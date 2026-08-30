#!/usr/bin/env python3
"""migration-fabrication-gate: PreToolUse (Edit|Write), BLOCKING.

data-money-03 (missing-principles sweep, 2026-07-26): supabase/migrations/20260530_seed_salon_amenities.sql
set nine boolean columns on the live `salons` table (wheelchair_accessible, lgbtq_friendly,
woman_owned among them) from `abs(hashtext(id::text || salt)) % 100 < N`, i.e. it invented an
accessibility claim and two identity claims about real businesses out of a hash, with zero
source of truth behind them. The UPDATE never actually ran against live data and was neutralized
in place 2026-07-26 (see _rules/LESSONS_LEARNED.md, "A 'cosmetic facet' seed migration fabricated
accessibility and identity data"), but nothing stopped the NEXT migration from doing the same
thing to a new column. This gate is that stop.

Fires on supabase/migrations/*.sql (Write for a new file, Edit for a change to an existing one).
Denies when the new content assigns to a column on a table via UPDATE/INSERT/SET whose row scope
is not visibly restricted to a test/demo table (`is_test`, `_test` or `_demo` in the table name,
or a `where is_test` / `where ... is_test = true` clause) AND the assigned expression uses
`hashtext(`, a bare `random()`, or `md5(...) %` to derive the value. This is exactly the shape
that turns a "let's make demo data look varied" migration into a fabricated claim about a real
salon.

Escape hatch: add `fabricated-data-ok: <owner, date, remediation-plan>` on a comment line
anywhere in the new content if the column is genuinely decorative (no accessibility/identity/
eligibility meaning) and hash-seeding it is an explicit, owner-approved choice.

Fail-open on error, matching every other gate in this file's family (money-update-cas-gate.py,
no-unauth-money-route.py).

NOT YET ARMED: built + self-tested in a sandboxed worktree session where .claude/settings.json
is not writable (see reference_gate_wiring_sandbox_block.md). Wire it as a PreToolUse hook
matching `supabase/migrations/.*\\.sql$` from a non-sandboxed session before it actually blocks
anything.
"""
import json, re, sys

# IGNORECASE added 2026-08-21 (adversary bypass E). This machine's filesystem is case-insensitive,
# verified, so `supabase/Migrations/x.sql` lands in the very directory Supabase reads, while a
# case-sensitive pattern skipped the file without even opening it.
MIGRATION_PATH = re.compile(r"supabase/migrations/.*\.sql$", re.IGNORECASE)


def strip_sql_comments(text):
    """Remove -- line comments and block comments before any structural matching.

    2026-08-21, adversary bypass D. `TEST_SCOPED` greps for `_test` anywhere in the window, so a
    throwaway trailing comment, `-- for the _test dataset only`, laundered a real UPDATE against
    the live `salons` table. A comment can never be evidence about a WHERE clause or a table name.
    """
    text = re.sub(r"/\*.*?\*/", " ", text, flags=re.S)
    return re.sub(r"--[^\n]*", " ", text)
FABRICATION_FN = re.compile(r"hashtext\(|(?<![\w.])random\(\)|md5\([^)]*\)\s*%")
TEST_SCOPED = re.compile(r"is_test\s*=\s*true|where\s+is_test\b|_test\b|_demo\b", re.IGNORECASE)
WAIVER = re.compile(r"fabricated-data-ok\s*:", re.IGNORECASE)
# an UPDATE/INSERT/SET statement, scanned as the whole file content is small enough that a
# per-statement split is unnecessary for a deny-by-default gate; a false positive costs one
# extra `fabricated-data-ok:` comment, a false negative ships a repeat of the exact bug above.
WRITE_STMT = re.compile(r"\b(update|insert\s+into)\s+([a-z_][\w]*)", re.IGNORECASE)

# See the note at the deny site. Both added 2026-08-21 after driving this over all 374 real
# migrations, where two of its three hits were correct work.
# A lock identifier assigns to no column, so it can fabricate nothing.
ADVISORY_LOCK_ONLY = re.compile(r"pg_advisory(?:_xact)?_lock\s*\(", re.IGNORECASE)
# ... unless the same statement ALSO sets a column from a hash, in which case the lock is
# incidental and the fabrication is real.
# `[\s\S]{0,200}?` not `[^,;\n]*`, 2026-08-21 (adversary bypass C): a long assignment wrapped over
# several lines, which is ordinary SQL formatting, made this fail to match while the plain
# fabrication pattern still did, and the lock skip then waved the real fabrication through.
ASSIGNS_FROM_HASH = re.compile(
    r"\b[a-z_][\w]*\s*=\s*[\s\S]{0,200}?(?:hashtext\(|(?<![\w.])random\(\)|md5\()", re.IGNORECASE)
# Setting a column to NULL is an UNDO. The cleanup migration uses the same hash to recognise the
# fabricated rows and erase them; refusing that would have blocked the fix for this exact bug.
UNDOES_TO_NULL = re.compile(r"=\s*case\s+when[^;]{0,400}?\bthen\s+null\b|=\s*null\b", re.IGNORECASE)


def is_pure_undo(window):
    """True only when EVERY hash in this window belongs to an assignment that ends in NULL.

    2026-08-21, adversary bypasses A and B, both driven against the live hook.
      A. `kid_friendly = case when true then null end, wheelchair_accessible = (hash...)`.
         One harmless nulled column anywhere in the window waved the whole window through,
         including the real fabrication sitting beside it.
      B. `wheelchair_accessible = case when x is null then null else (hash...) end`.
         The undo pattern stops at the first "then null" and never reads the ELSE branch, where
         the hash actually lands on every row.
    Both are fixed by asking the question per ASSIGNMENT rather than per window: split on
    top-level commas, and treat the window as an undo only if no assignment sets a column FROM a
    hash. An assignment whose hash sits inside a CASE that also has a non-null ELSE is not an undo.
    """
    depth, cur, parts = 0, [], []
    for ch in window:
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth = max(0, depth - 1)
        if ch == "," and depth == 0:
            parts.append("".join(cur))
            cur = []
            continue
        cur.append(ch)
    parts.append("".join(cur))
    saw_undo = False
    for part in parts:
        if not FABRICATION_FN.search(part):
            continue
        # This clause contains a hash. It is only an undo if the hash is used to RECOGNISE a value
        # and the result is NULL, i.e. there is no non-null branch after the hash.
        m = re.search(r"\bthen\s+null\b", part, re.IGNORECASE)
        if not m:
            return False
        tail = part[m.end():]
        if re.search(r"\belse\b(?!\s+" + r"[a-z_][\w]*\s*\bend\b)", tail, re.IGNORECASE) and \
                FABRICATION_FN.search(tail):
            return False        # the ELSE branch fabricates, bypass B
        saw_undo = True
    return saw_undo


def get_new_content(tool_input: dict) -> str:
    if "edits" in tool_input and isinstance(tool_input["edits"], list):
        return "\n".join(e.get("new_string", "") for e in tool_input["edits"])
    return tool_input.get("new_string") or tool_input.get("content") or ""


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except Exception:
        return 0
    tool_input = payload.get("tool_input", {})
    file_path = tool_input.get("file_path", "")
    if not MIGRATION_PATH.search(file_path):
        return 0

    raw = get_new_content(tool_input)
    # The waiver is BY DESIGN a comment, so it has to be read before comments are stripped. Caught
    # by the suite the moment comment-stripping went in: case 7 flipped to a block.
    if WAIVER.search(raw):
        return 0
    content = strip_sql_comments(raw)
    if not content:
        return 0
    if not FABRICATION_FN.search(content):
        return 0

    for m in WRITE_STMT.finditer(content):
        table = m.group(2)
        if TEST_SCOPED.search(table):
            continue
        # look at a window around the statement for a WHERE is_test guard or the
        # fabrication function itself, so a write against an unrelated table earlier
        # in the same file doesn't false-positive off a hashtext() used elsewhere.
        window = content[m.start():m.start() + 2000]
        if TEST_SCOPED.search(window):
            continue
        # 2026-08-21, MEASURED AGAINST ALL 374 REAL MIGRATIONS BEFORE WIRING THIS. It fired on
        # three, and only one of the three is the bug: the 2026-05-30 seed. The other two are the
        # shape that would have got this switched off in a week.
        #   1. `pg_advisory_xact_lock(hashtext('credit-redeem:' || id))`. A lock identifier is the
        #      standard Postgres idiom for a hash and it assigns to no column at all, so it can
        #      fabricate nothing.
        #   2. The CLEANUP migration, `20260716150000_null_fabricated_salon_amenities.sql`. It uses
        #      the same hash to RECOGNISE the fabricated values and set them to NULL. This gate
        #      would have refused the migration that fixed the very bug it exists to prevent.
        # Both are now skipped by what they DO rather than by name, so a future one is covered too.
        if ADVISORY_LOCK_ONLY.search(window) and not ASSIGNS_FROM_HASH.search(window):
            continue
        if UNDOES_TO_NULL.search(window) and is_pure_undo(window):
            continue
        if FABRICATION_FN.search(window):
            print(json.dumps({
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "deny",
                    "permissionDecisionReason": (
                        f"BLOCKED (migration fabrication): this migration writes to `{table}` "
                        "(not scoped to is_test/_test/_demo) using hashtext(/random()/md5(...)% "
                        "to derive the value. This is the exact shape that fabricated "
                        "wheelchair_accessible/lgbtq_friendly/woman_owned claims from a hash in "
                        "supabase/migrations/20260530_seed_salon_amenities.sql (data-money-03, "
                        "neutralized 2026-07-26, see _rules/LESSONS_LEARNED.md). A hash-derived "
                        "value is fine for a genuinely decorative facet (wifi, pet-friendly); it "
                        "is never fine for an accessibility, identity, or eligibility claim about "
                        "a real business. Add `fabricated-data-ok: <owner, date, plan>` if this "
                        "is a reviewed, decorative exception."
                    ),
                }
            }))
            return 0
    return 0


def _drive(sql, path="/x/supabase/migrations/20260901_probe.sql"):
    """Run the real decision on one payload, the way the runtime does."""
    import io
    import contextlib
    buf = io.StringIO()
    real_stdin = sys.stdin
    sys.stdin = io.StringIO(json.dumps({
        "tool_name": "Write", "hook_event_name": "PreToolUse",
        "tool_input": {"file_path": path, "content": sql}}))
    try:
        with contextlib.redirect_stdout(buf):
            main()
    finally:
        sys.stdin = real_stdin
    return "deny" in buf.getvalue()


def selftest():
    """Every case here is a REAL migration shape from this repo, not an invention.

    Cases 3 and 5 are the two this gate wrongly refused when it was driven over all 374 real
    migrations on 2026-08-21, before it was ever wired. Case 5 is the migration that FIXED the
    bug this gate exists to prevent, so shipping without these two would have meant a gate that
    blocks the repair and gets switched off in a week.
    """
    cases = [
        ("1  THE REAL BUG: a live column set from a hash of the row id", True,
         "update salons set wheelchair_accessible = "
         "(abs(hashtext(id::text || 'wheel')) % 100 < 45);"),
        ("2  the same thing scoped to a test table -> allowed", False,
         "update salons_test set wheelchair_accessible = (abs(hashtext(id::text)) % 100 < 45);"),
        ("3  FALSE POSITIVE FOUND 2026-08-21: a Postgres lock id, assigns to no column", False,
         "create function f() returns void as $$ begin "
         "perform pg_advisory_xact_lock(hashtext('credit-redeem:' || p::text)); "
         "end; $$ language plpgsql;"),
        ("4  a lock id AND a hashed column in one statement is still the bug", True,
         "perform pg_advisory_xact_lock(hashtext('x')); "
         "update salons set lgbtq_friendly = (abs(hashtext(id::text)) % 100 < 40);"),
        ("5  FALSE POSITIVE FOUND 2026-08-21: the CLEANUP, hash recognises and sets null", False,
         "update salons set kid_friendly = case when kid_friendly = "
         "(abs(hashtext(id::text||'kid')) % 100 < 40) then null else kid_friendly end;"),
        ("6  an ordinary migration with no hash at all", False,
         "alter table salons add column foo boolean default false;"),
        ("7  the owner-approved waiver comment lets a decorative facet through", False,
         "-- fabricated-data-ok: owner 2026-08-21, decorative only, re-seeded at launch\n"
         "update salons set wifi_friendly = (abs(hashtext(id::text)) % 100 < 60);"),
        ("8  NOT a migration path -> never our business", False,
         "update salons set wheelchair_accessible = (abs(hashtext(id::text)) % 100 < 45);"),
        # --- The five an adversary found after this was wired, 2026-08-21. Each is that agent's
        # own SQL, kept verbatim so the hole cannot reopen quietly.
        ("9  BYPASS A: one harmless nulled column beside a real fabrication", True,
         "update salons set\n  kid_friendly = case when true then null else kid_friendly end,\n"
         "  wheelchair_accessible = (abs(hashtext(id::text || 'wheel')) % 100 < 45)\n"
         "where is_active;"),
        ("10 BYPASS B: the hash hidden in the ELSE branch of an undo", True,
         "update salons set wheelchair_accessible = case when kid_friendly is null then null "
         "else (abs(hashtext(id::text || 'wheel')) % 100 < 45) end where is_active;"),
        ("11 BYPASS C: an assignment wrapped over lines, with a lock further down", True,
         "update salons set\n  wheelchair_accessible = (abs(\n"
         "    hashtext(id::text || 'wheel')\n  ) % 100 < 45)\nwhere is_active;\n\n"
         "do $$\nbegin\n  perform pg_advisory_xact_lock(hashtext('seed'));\nend\n$$;"),
        ("12 BYPASS D: a trailing comment mentioning a test table launders a live write", True,
         "update salons set wheelchair_accessible = (abs(hashtext(id::text || 'wheel')) % 100 < 45)"
         " where is_active; -- for the _test dataset only, remove before ship"),
        ("13 the same SQL fully commented out fabricates nothing", False,
         "-- update salons set wheelchair_accessible = "
         "(abs(hashtext(id::text || 'wheel')) % 100 < 45) where is_active;"),
    ]
    ok = 0
    for name, want, sql in cases:
        path = ("/x/app/api/route.ts" if name.startswith("8")
                else "/x/supabase/migrations/20260901_probe.sql")
        got = _drive(sql, path)
        good = got == want
        ok += good
        print(("  PASS  " if good else "  FAIL  ") + name
              + ("" if good else "   expected block=%s got %s" % (want, got)))
    print("\n%d/%d passed" % (ok, len(cases)))
    return 0 if ok == len(cases) else 1


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        sys.exit(selftest())
    sys.exit(main())
