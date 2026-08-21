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

MIGRATION_PATH = re.compile(r"supabase/migrations/.*\.sql$")
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
ASSIGNS_FROM_HASH = re.compile(
    r"\b[a-z_][\w]*\s*=\s*[^,;\n]*(?:hashtext\(|(?<![\w.])random\(\)|md5\()", re.IGNORECASE)
# Setting a column to NULL is an UNDO. The cleanup migration uses the same hash to recognise the
# fabricated rows and erase them; refusing that would have blocked the fix for this exact bug.
UNDOES_TO_NULL = re.compile(r"=\s*case\s+when[^;]{0,400}?\bthen\s+null\b|=\s*null\b", re.IGNORECASE)


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

    content = get_new_content(tool_input)
    if not content:
        return 0
    if WAIVER.search(content):
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
        if UNDOES_TO_NULL.search(window):
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
