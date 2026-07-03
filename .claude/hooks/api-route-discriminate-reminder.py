#!/usr/bin/env python3
"""api-route-discriminate-reminder , PostToolUse(Write|Edit|MultiEdit) hook
(2026-07-03, from the fable setup review).

Gap it covers: the enforcement layer is overwhelmingly frontend/process; the project's
number one BACKEND failure (silent no-op filters: PostgREST swallows selects on phantom
columns, filters render but never discriminate) had no gate at all. This hook fires
after any edit to an API route file and injects the two-call discriminate check as
context. Informational, never blocks; once per file per session.
"""
import hashlib
import json
import os
import sys

ROUTE_MARKERS = ("/app/api/", "app/api/")
STATE_DIR = os.path.expanduser("~/.claude/state")


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
    fp = ((data.get("tool_input") or {}).get("file_path") or "")
    if not (fp.endswith("route.ts") or fp.endswith("route.js")):
        sys.exit(0)
    if not any(m in fp for m in ROUTE_MARKERS):
        sys.exit(0)

    sid = (data.get("session_id") or "nosid")[:12]
    key = hashlib.md5(fp.encode()).hexdigest()[:10]
    marker = os.path.join(STATE_DIR, f".apiroute-{sid}-{key}")
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
                "SILENT NO-OP CHECK (project CLAUDE.md, hook-injected): you edited an API route. "
                "Before claiming it works, prove BEHAVIOR, not existence: "
                "(1) every filter must DISCRIMINATE: call the endpoint with and without the param, "
                "counts must differ; "
                "(2) every selected column must exist in the LIVE snapshot: npm run exists <column> "
                "(PostgREST silently returns null on phantom columns); "
                "(3) computed filters (open-now, distance) resolve matching IDs first, then "
                ".in('id', ids) BEFORE .range(), never client-side over one page. "
                "Worked example: app/api/salons/route.ts."
            ),
        }
    }))
    sys.exit(0)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        sys.exit(0)
