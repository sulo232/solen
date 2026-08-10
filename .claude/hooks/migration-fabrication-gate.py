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


if __name__ == "__main__":
    sys.exit(main())
