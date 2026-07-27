#!/usr/bin/env python3
"""idor-object-check-reminder , PostToolUse(Write|Edit) hook (authz-rls-03, 2026-07-27).

Gap it covers: the only authz-adjacent gate in this estate, no-unauth-money-route.py,
proves a route has SOME authentication signal (getUser(, requireAdmin(, ...). It never
checks the next, harder question: once the caller is known, does the route verify the
caller actually OWNS the specific row it is about to read/write? OWASP API1 (Broken
Object Level Authorization) has been #1 on the API Security Top 10 for two editions
running precisely because "logged in" and "authorized for THIS row" are different
checks, and a codebase that only gates on the first one ships routes where any
authenticated user can act on any other user's row by id.

Heuristic (warn-only, informational, never blocks): a route.ts under app/api/ that
(a) reads a client-supplied id (a path param via [id]/[slug] segment, or a body/query
field ending in _id or literally "id"), AND
(b) performs a privileged .update(/.delete(/.select( call against a table in the
PRIVILEGED_TABLES list,
is checked for an ownership-shaped predicate anywhere in the file: owner_id, user_id,
staff_salon_id, salon_id, requireX(-style helper, or a named resolver (resolveBookingActor,
requireAuth, requireAdmin, requireOwnership). If none of those appear, inject a reminder.

Deliberately warn-only: false positives are likely (helper indirection, e.g. a shared
resolver function in a different file doing the real check, is invisible to a single-file
grep, exactly the false-positive class the authz-rls-05 research session's own spot check
hit). This hook educates, it does not gate. Once per file per session.

Self-tested 2026-07-27: positive case (a bookings/[id] route with .update and no ownership
predicate) fires the reminder; negative case (the same route with an owner_id check) does
not.
"""
import hashlib
import json
import os
import re
import sys

ROUTE_MARKERS = ("/app/api/", "app/api/")
STATE_DIR = os.path.expanduser("~/.claude/state")

PRIVILEGED_TABLES = (
    "bookings", "salons", "reviews", "staff_members", "profiles",
    "staff_invites", "payouts", "vouchers", "gift_cards", "review_replies",
)
CLIENT_ID_PATTERN = re.compile(
    r"params\.(id|[a-zA-Z_]+Id)\b"
    r"|(?:body|query)\??\.\s*[a-zA-Z_]*_id\b"
    r"|(?:body|query)\??\.\s*id\b"
)
PRIVILEGED_TABLE_RE = re.compile(
    r'\.from\(\s*[\'"](' + "|".join(PRIVILEGED_TABLES) + r')[\'"]\s*\)'
)
MUTATING_CALL = re.compile(r"\.(update|delete)\s*\(")
OWNERSHIP_SIGNALS = (
    "owner_id", "user_id", "staff_salon_id", "salon_id",
    "requireAuth(", "requireAdmin(", "requireOwnership(",
    "resolveBookingActor(", "requireX(",
)


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    tool = data.get("tool_name", "")
    ti = data.get("tool_input") or {}
    fp = str(ti.get("file_path") or "")
    if not (fp.endswith("route.ts") or fp.endswith("route.js")):
        sys.exit(0)
    if not any(m in fp for m in ROUTE_MARKERS):
        sys.exit(0)

    if tool == "Write":
        text = ti.get("content", "") or ""
    elif tool == "Edit":
        text = ti.get("new_string", "") or ""
    else:
        sys.exit(0)
    if not text:
        sys.exit(0)

    has_client_id = bool(CLIENT_ID_PATTERN.search(text))
    has_privileged_table = bool(PRIVILEGED_TABLE_RE.search(text))
    has_mutating_call = bool(MUTATING_CALL.search(text))
    if not (has_client_id and has_privileged_table and has_mutating_call):
        sys.exit(0)

    # If the file already shows an ownership-shaped predicate anywhere, this is not the
    # gap the hook exists for; stay silent.
    if any(sig in text for sig in OWNERSHIP_SIGNALS):
        sys.exit(0)

    sid = (data.get("session_id") or "nosid")[:12]
    key = hashlib.md5(fp.encode()).hexdigest()[:10]
    marker = os.path.join(STATE_DIR, f".idorcheck-{sid}-{key}")
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
                "OBJECT-LEVEL AUTHZ CHECK (authz-rls-03, hook-injected): this route reads a "
                "client-supplied id and writes/reads a privileged table (bookings/salons/reviews/"
                "staff_members/profiles/...). Passing auth.getUser() only proves the caller is "
                "LOGGED IN, never that they own THIS row (OWASP API1, Broken Object Level "
                "Authorization, #1 on the API Security Top 10 for two editions running). "
                "Before shipping: does this file check the id against owner_id / user_id / "
                "staff_salon_id, or route through a named resolver (resolveBookingActor, "
                "requireOwnership)? If the check lives in a shared helper this grep cannot see, "
                "ignore this reminder. If it does not exist, add it before the privileged "
                ".update()/.delete()/.select()."
            ),
        }
    }))
    sys.exit(0)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        sys.exit(0)
