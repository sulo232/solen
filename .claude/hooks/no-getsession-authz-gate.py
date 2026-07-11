#!/usr/bin/env python3
"""PreToolUse gate: block server-side supabase.auth.getSession() for identity/authz.

getSession() reads the session straight from the client-supplied cookie and does
NOT verify the JWT signature (confirmed vs @supabase/auth-js: _isValidSession only
checks that the token keys EXIST, never their values). An attacker can forge a
cookie with any user.id. For any server-side identity or authorization decision
use supabase.auth.getUser() (verifies the JWT against the Supabase Auth server,
returns a null user on failure so it fails CLOSED). The whole backend was migrated
off getSession() on 2026-07-10 (commit 9783e5711); this gate stops it coming back.

Fires on Write|Edit to app/**/*.ts(x) or lib/**/*.ts(x) that introduces
`auth.getSession()`. EXEMPT: client components ("use client" at the top of the
file) reading their own session for UI state , that is not a security boundary.
Override (rare, justified): touch .claude/getsession-skip.flag  (5 min TTL).

House rules: fail OPEN on any parse/IO error; reason on stderr + exit 2 to block.
"""
import json
import os
import re
import sys
import time


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)  # fail open

    tool = data.get("tool_name", "")
    ti = data.get("tool_input", {}) or {}
    fp = ti.get("file_path", "") or ""
    if not fp:
        sys.exit(0)

    # Only server-side surfaces where getSession() is an authz footgun.
    if not re.search(r"(^|/)(app|lib)/", fp):
        sys.exit(0)
    if not re.search(r"\.tsx?$", fp):
        sys.exit(0)

    if tool == "Write":
        new_text = ti.get("content", "") or ""
    elif tool == "Edit":
        new_text = ti.get("new_string", "") or ""
    else:
        sys.exit(0)

    # A real (non-comment) getSession call is the trigger; a mention in a // or * comment is fine.
    def _has_real_getsession(text):
        for line in text.splitlines():
            if "auth.getSession()" in line:
                s = line.lstrip()
                if not (s.startswith("//") or s.startswith("*") or s.startswith("/*")):
                    return True
        return False

    if not _has_real_getsession(new_text):
        sys.exit(0)

    # Override flag (5 min TTL).
    proj = os.environ.get("CLAUDE_PROJECT_DIR", ".")
    for flag in (
        os.path.join(proj, ".claude", "getsession-skip.flag"),
        os.path.join(".claude", "getsession-skip.flag"),
    ):
        try:
            if time.time() - os.path.getmtime(flag) < 300:
                sys.exit(0)
        except OSError:
            pass

    # Client components legitimately read their own session for UI state.
    head = ""
    if tool == "Write":
        head = new_text[:250]
    else:
        try:
            with open(fp, "r", encoding="utf-8", errors="ignore") as f:
                head = f.read(250)
        except OSError:
            head = ""
    if '"use client"' in head or "'use client'" in head:
        sys.exit(0)

    msg = (
        "BLOCKED: supabase.auth.getSession() reads the client-supplied cookie WITHOUT verifying "
        "the JWT signature (a forged cookie can set any user.id). For any server-side identity or "
        "authorization decision, use supabase.auth.getUser() instead (it verifies the JWT against "
        "the Supabase Auth server and returns a null user on failure, so it fails closed). "
        "Shared helpers already do this: lib/auth/require.ts requireAuth()/requireAdmin() and "
        "lib/supabase.ts getSessionUser(). The whole backend was migrated off getSession() on "
        "2026-07-10 (commit 9783e5711). "
        "Exempt: client components (\"use client\") reading their own session for UI state. "
        "Override (rare, justified): touch .claude/getsession-skip.flag"
    )
    print(msg, file=sys.stderr)
    sys.exit(2)


try:
    main()
except Exception:
    sys.exit(0)  # fail open , never wedge a turn on a hook bug (matches every sibling gate)
