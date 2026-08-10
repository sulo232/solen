#!/usr/bin/env python3
"""admin-client-check-reminder , PostToolUse(Write|Edit) hook (authz-rls-05, 2026-07-27).

Gap it covers: createAdminSupabaseClient() maps to Postgres's service_role, which has
BYPASSRLS (confirmed live via pg_roles this pass). Once a query runs on that connection,
RLS contributes NOTHING; the entire authorization decision for that call collapses onto
whatever the surrounding application code remembered to check. 271 files in this repo call
createAdminSupabaseClient() today (this session's own count) and nothing has ever audited
what fraction of them carry a real ownership/role check next to the privileged query.

This hook does not try to be the audit (that needs per-file human judgment, a same-session
heuristic spot-check of 7 flagged files found 7/7 were correctly designed, mostly via a
crypto-token/payment-proof/public-by-design shape a simple grep can't recognize, so a
hard block here would be mostly noise). It exists to put the discipline in front of the
person adding call site #272, at the moment it is cheapest to get right.

Fires once per file per session, informational only, on a Write/Edit that introduces
createAdminSupabaseClient( into a file with no visible auth/ownership/resolver signal.
"""
import hashlib
import json
import os
import re
import sys

STATE_DIR = os.path.expanduser("~/.claude/state")
SIGNALS = (
    "getUser(", "owner_id", "user_id", "staff_salon_id", ".role", "CRON_SECRET",
    "requireAuth(", "requireAdmin(", "requireOwnership(", "resolveBookingActor(",
    "constructEvent", "STRIPE_WEBHOOK_SECRET", "verifyToken(", "verifyAccessToken(",
    "timingSafeEqual", "hashCode(", "createHmac",
)
RESOLVER_PATTERN = re.compile(r"\bresolve[A-Za-z]*\(|\brequire[A-Za-z]*\(")


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
    if "createAdminSupabaseClient(" not in text:
        sys.exit(0)

    if any(s in text for s in SIGNALS) or RESOLVER_PATTERN.search(text):
        sys.exit(0)

    sid = (data.get("session_id") or "nosid")[:12]
    key = hashlib.md5(fp.encode()).hexdigest()[:10]
    marker = os.path.join(STATE_DIR, f".adminclient-{sid}-{key}")
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
                "SERVICE-ROLE CHECK (authz-rls-05, hook-injected): this file calls "
                "createAdminSupabaseClient(), which maps to Postgres's service_role "
                "(BYPASSRLS=true, confirmed live). RLS enforces NOTHING on this connection; "
                "the authorization decision is entirely on you. No auth.getUser()/ownership "
                "column/resolver/crypto-proof (HMAC token, payment intent, email-code) signal "
                "was found in this file. If the route is genuinely public-by-design (a public "
                "signup, a public salon lookup), that is fine, say so in a comment. If it reads "
                "or writes a specific row that belongs to someone, add the ownership check "
                "before the privileged query."
            ),
        }
    }))
    sys.exit(0)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        sys.exit(0)
