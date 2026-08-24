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
    """Added 2026-08-24. THIS COPY was armed with no test behind it since it was written.

    READ THIS FIRST. This file is the ORIGINAL gate, commit 6705143c4. The copy on main has
    since had two rounds of hardening (42ebfbfef, f3ad2c868) that this branch never picked up,
    so four of the cases below assert behaviour that main already gets RIGHT and this armed
    copy still gets WRONG. They are marked STALE and they are recorded, not fixed: the brief
    was to test the gate, not to retune it. The fix is to bring this file up to main's version.

    Every case is a real migration shape from supabase/migrations/, source named.
    """
    real_seed = ("update salons set\n"
                 "  wheelchair_accessible = (abs(hashtext(id::text || 'wheel'))   % 100 < 45),\n"
                 "  near_public_transport = (abs(hashtext(id::text || 'transit')) % 100 < 70);")
    real_cleanup = ("update salons set\n"
                    "  wheelchair_accessible = case when wheelchair_accessible = "
                    "(abs(hashtext(id::text || 'wheel')) % 100 < 45) then null "
                    "else wheelchair_accessible end;")
    real_lock = ("create or replace function f(p_user uuid) returns void as $$\nbegin\n"
                 "  PERFORM pg_advisory_xact_lock(hashtext('mdisc:' || p_user::text));\n"
                 "end;\n$$ language plpgsql;")

    cases = [
        # ---- must be REFUSED --------------------------------------------------
        ("1  THE REAL BUG, verbatim from supabase/migrations/20260530_seed_salon_amenities.sql: "
         "an accessibility claim about real businesses derived from a hash of the row id",
         True, real_seed, None),
        ("2  the same shape on a new column, an identity claim from a hash",
         True, "update salons set lgbtq_friendly = (abs(hashtext(id::text || 'lgbtq')) % 100 < 40);",
         None),
        ("3  a bare random() filling a live column",
         True, "update salons set rating = random() * 5 where is_active;", None),
        ("4  an INSERT that fabricates rows from a hash",
         True, "insert into salon_amenities (salon_id, wifi) "
               "select id, (abs(hashtext(id::text)) % 100 < 60) from salons;", None),

        # ---- must PASS UNTOUCHED (ordinary good work) -------------------------
        ("5  an ordinary schema migration, no hash anywhere",
         False, "alter table salons add column contact_email text;", None),
        ("6  the same hash scoped to a test table",
         False, "update salons_test set wheelchair_accessible = "
                "(abs(hashtext(id::text)) % 100 < 45);", None),
        ("7  real 20260711233100 audit fix: pg_advisory_xact_lock(hashtext(...)) is a Postgres "
         "lock identifier and assigns to no column, so it can fabricate nothing",
         False, real_lock, None),
        ("8  the owner-approved waiver comment lets a genuinely decorative facet through",
         False, "-- fabricated-data-ok: owner 2026-08-21, decorative only, re-seeded at launch\n"
                "update salons set wifi = (abs(hashtext(id::text)) % 100 < 60);", None),
        ("9  a real RLS policy migration, nothing to do with data values",
         False, "alter table public.bookings enable row level security;\n"
                "create policy bookings_own on public.bookings for select "
                "using (auth.uid() = customer_id);", None),
        ("10 an app route is never this gate's business, even carrying the same SQL",
         False, "update salons set wheelchair_accessible = (abs(hashtext(id::text)) % 100 < 45);",
         "/x/app/api/salons/route.ts"),
        ("11 a plain UPDATE with real values and no hash",
         False, "update salons set contact_email = 'hallo@salon.ch' where id = "
                "'97c04291-0000-0000-0000-000000000000';", None),

        # ---- STALE, recorded not fixed: main already gets these right ---------
        ("12 STALE (over-block, main fixed in 42ebfbfef): real 20260716150000_null_fabricated_"
         "salon_amenities.sql is the CLEANUP that repaired this exact bug. It uses the same hash "
         "to RECOGNISE the fabricated values and set them to NULL. This copy refuses the repair.",
         True, real_cleanup, None),
        ("13 STALE (bypass D open, main fixed in f3ad2c868): a throwaway trailing comment naming "
         "a _test table launders a live write against salons straight past this copy",
         False, "update salons set wheelchair_accessible = "
                "(abs(hashtext(id::text || 'wheel')) % 100 < 45) where is_active; "
                "-- for the _test dataset only, remove before ship", None),
        ("14 STALE (bypass E open, main fixed in f3ad2c868): this machine's filesystem is "
         "case-insensitive, so supabase/Migrations/x.SQL lands in the directory Supabase reads, "
         "and this copy never opens the file",
         False, real_seed, "/x/supabase/Migrations/20260901_probe.SQL"),
        ("15 STALE (over-block, main fixed in f3ad2c868): SQL that is entirely commented out "
         "writes nothing, and this copy refuses it",
         True, "-- update salons set wheelchair_accessible = "
               "(abs(hashtext(id::text || 'wheel')) % 100 < 45) where is_active;", None),
    ]
    ok = 0
    for name, want, sql, path in cases:
        got = _drive(sql, path or "/x/supabase/migrations/20260901_probe.sql")
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
