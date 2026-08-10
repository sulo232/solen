#!/usr/bin/env python3
"""rowcount-check-reminder , PostToolUse(Write|Edit) hook (authz-rls-07, 2026-07-27).

Gap it covers: PostgREST returns error: null for an UPDATE/DELETE that matched zero rows.
That is database-correct (nothing went wrong) but application-dangerous: a zero-row result
on an RLS-scoped write is indistinguishable, from the response alone, between "correctly
refused an unauthorized caller" and "silently failed to do the authorized thing." This
project has three confirmed prior incidents of exactly this shape (availability_slots,
bookings rollback deletes, group_bookings), per _docs/BACKEND.md and
_plans/BOOKING_BACKEND_AUDIT.md.

Heuristic (warn-only): an .update(/.delete( call in a route/lib file scoped to
booking/availability/group-booking tables, with no nearby .select() + a length/count check
and no comment explaining why the row count does not matter for this call. Fires once per
file per session; informational, never blocks (row-count checks are legitimately not needed
on every write, e.g. a best-effort audit-log insert, so this stays advisory).
"""
import hashlib
import json
import os
import re
import sys

STATE_DIR = os.path.expanduser("~/.claude/state")
SENSITIVE_TABLES = ("bookings", "availability_slots", "group_bookings", "group_booking_members")
WRITE_CALL = re.compile(
    r'\.from\(\s*[\'"](' + "|".join(SENSITIVE_TABLES) + r')[\'"]\s*\)[^;]*?\.(update|delete)\s*\('
)
ROWCOUNT_SIGNALS = (
    ".select(", "rowCount", "row_count", "affected", ".length", "count:",
    "// row count", "// rowcount",
)


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    tool = data.get("tool_name", "")
    ti = data.get("tool_input") or {}
    fp = str(ti.get("file_path") or "")
    if not re.search(r"(^|/)(app|lib)/.*\.tsx?$", fp):
        sys.exit(0)

    if tool == "Write":
        text = ti.get("content", "") or ""
    elif tool == "Edit":
        text = ti.get("new_string", "") or ""
    else:
        sys.exit(0)
    if not text:
        sys.exit(0)

    if not WRITE_CALL.search(text):
        sys.exit(0)
    if any(sig in text for sig in ROWCOUNT_SIGNALS):
        sys.exit(0)

    sid = (data.get("session_id") or "nosid")[:12]
    key = hashlib.md5(fp.encode()).hexdigest()[:10]
    marker = os.path.join(STATE_DIR, f".rowcount-{sid}-{key}")
    try:
        os.makedirs(STATE_DIR, exist_ok=True)
        if os.path.exists(marker):
            sys.exit(0)
        open(marker, "w").close()
    except Exception:
        pass

    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PostToolUse",
            "additionalContext": (
                "ROW-COUNT CHECK (authz-rls-07, hook-injected): this file .update()/.delete()s "
                "a booking/availability/group-booking table. PostgREST returns error: null for a "
                "write that matched ZERO rows, byte-identical to a successful RLS refusal, so "
                "checking only `if (error)` cannot tell 'correctly blocked' apart from 'silently "
                "did nothing.' This project has 3 confirmed prior incidents of exactly this shape "
                "(availability_slots, bookings rollback deletes, group_bookings, see "
                "_docs/BACKEND.md). Chain a .select() after the write and check the returned "
                "array length, or comment why the row count genuinely does not matter here."
            ),
        }
    }))
    sys.exit(0)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        sys.exit(0)
