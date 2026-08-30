#!/usr/bin/env python3
"""backend-doc-pointer , points backend work at _docs/BACKEND.md (2026-07-14).

Why this exists (owner ask): there was no single doc explaining how the Solen
backend actually works (storage, auth, payments, crons, RLS, ...). _docs/BACKEND.md
is now that map. A doc nobody opens is dead weight, so this hook surfaces it at the
moment backend work starts. It is a POINTER, never a gate: it only injects context,
it never blocks an edit.

Two events, one script:
  - UserPromptSubmit : if the prompt is backend-shaped, inject the pointer.
  - PreToolUse(Write|Edit|MultiEdit) : if the edited file is a backend file, inject it.
Fires at most ONCE per session (a marker file), so it never nags turn after turn.

Event contract: stdin is the hook JSON; a JSON hookSpecificOutput.additionalContext on
stdout (exit 0) is added to Claude's context. Non-backend input exits 0 silently.

2026-08-18 audit: "add a column for consumed_at to bookings" did not fire, the exact shape of
this project's own consumed_at case study (CLAUDE.md's MISSING THINGS section: a migration
that adds `bookings.consumed_at` was written and never merged, and without it the one-click
confirm/cancel email link has no replay protection at all). None of the prior keywords name a
schema-shape phrase like "add a column", so a schema-change ask with no other backend word in
it (no "migration", no "database", no "supabase") passed through un-pointed. Added phrase-based
triggers for add/create/drop/alter + column, scoped to that PHRASE rather than the bare word
"column" (which also means a CSS grid/layout column in a frontend ask, and bare-word matching
would fire on nearly every "make it a 2-column layout" prompt). Known accepted residual: the
phrase form still fires on the rarer "add a column to the grid" CSS ask, since this hook is a
POINTER that injects at most once per session, never a blocking gate, so the cost of that
residual is one extra doc pointer, not a blocked turn.
"""
import hashlib
import json
import os
import re
import sys

STATE_DIR = os.path.expanduser("~/.claude/state")

# Backend-shaped prompt vocabulary. Deliberately backend-SPECIFIC so a pure
# frontend prompt ("make the hero bigger", "change the button color") does NOT
# fire. Ambiguous words (booking/search/availability alone) are excluded unless
# paired with an unambiguous backend term.
PROMPT_PATTERNS = re.compile(
    r"\b("
    r"api\s*route|endpoint|route\.ts|server[-\s]?side|server\s*action|backend|"
    r"supabase|postgres|postgre|\bdb\b|database|\brls\b|row[-\s]?level|migration|"
    r"\bsql\b|execute_sql|pg_|schema\s*(change|drift)|"
    r"auth(entication|z)?|\bsession\b|\bjwt\b|oauth|getuser|getsession|requireauth|"
    r"payment|stripe|payout|refund|webhook|paymentintent|twint|voucher|credit\s*(spend|ledger)|gift[-\s]?card|"
    r"\bcron\b|scheduled\s*job|background\s*job|edge\s*function|"
    r"storage\s*bucket|\bbucket\b|file\s*upload|"
    r"rate[-\s]?limit|zod|validation\s*schema|audit\s*log|service[-\s]?role|"
    r"rpc|pgvector|embedding|"
    r"idor|ownership\s*check|feature\s*flag|"
    # 2026-08-18: schema-change PHRASES (not the bare word "column"/"table", which are also
    # common frontend/CSS terms , "add a column" is unambiguous, bare "column" is not).
    r"(?:add|adding|create|creating|drop|dropping|alter|altering)\s+(?:a\s+|an\s+|the\s+)?(?:new\s+)?column|"
    r"new\s+column|alter\s+table"
    r")\b",
    re.IGNORECASE,
)

# Backend files: an edit here means backend work regardless of the prompt.
def is_backend_file(fp: str) -> bool:
    if not fp:
        return False
    f = fp.replace("\\", "/")
    if re.search(r"(^|/)app/api/", f):
        return True
    if re.search(r"(^|/)supabase/(migrations|functions)/", f):
        return True
    # lib server utilities, but not the browser client or pure client helpers
    if re.search(r"(^|/)lib/", f) and f.endswith(".ts"):
        base = os.path.basename(f)
        if base in ("supabase-browser.ts",):
            return False
        return True
    return False


POINTER = (
    "BACKEND WORK , read _docs/BACKEND.md first (hook: .claude/hooks/backend-doc-pointer.py). "
    "It is the map of how every backend system actually works: auth/sessions/roles, "
    "database + RLS + the two-client model, storage, payments/Stripe/payouts, the booking engine, "
    "crons, notifications, search/discovery, the S1 security stack, and observability/ops. "
    "Ground your change in the relevant system section (and its Gotchas + invariants) before editing. "
    "Health/security state: _plans/BACKEND_HEALTH_AUDIT_2026-07-14.md."
)


def already_fired(sid: str) -> bool:
    marker = os.path.join(STATE_DIR, f".backend-doc-{sid}")
    try:
        os.makedirs(STATE_DIR, exist_ok=True)
        if os.path.exists(marker):
            return True
        open(marker, "w").close()
    except Exception:
        pass
    return False


def emit(event_name: str):
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": event_name,
            "additionalContext": POINTER,
        }
    }))
    sys.exit(0)


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    event = data.get("hook_event_name") or ""
    prompt = data.get("prompt") or ""

    # Background notifications land in `prompt` but are not owner messages: skip.
    if re.match(r"^\s*(<task-notification>|\[SYSTEM NOTIFICATION)", prompt):
        sys.exit(0)

    sid = (data.get("session_id") or "nosid")[:12]

    # UserPromptSubmit path (also matches when event is unset but a prompt is present).
    if prompt and (event == "UserPromptSubmit" or not event):
        if PROMPT_PATTERNS.search(prompt):
            if already_fired(sid):
                sys.exit(0)
            emit("UserPromptSubmit")
        sys.exit(0)

    # PreToolUse / PostToolUse edit path.
    fp = ((data.get("tool_input") or {}).get("file_path") or "")
    if is_backend_file(fp):
        if already_fired(sid):
            sys.exit(0)
        emit(event or "PreToolUse")
    sys.exit(0)


def _selftest():
    cases = [
        ("add a column for consumed_at to bookings", True, "the audit's own miss (this project's consumed_at case study)"),
        ("adding a new column to the salons table", True, "add-a-column phrase, another wording"),
        ("alter table bookings add column foo", True, "alter table phrase"),
        ("make it a 2-column layout", False, "bare CSS 'column' must not match"),
        ("flex column on mobile please", False, "bare CSS 'column' must not match"),
        ("the pricing table needs a redesign", False, "bare 'table' must not match"),
        ("add a supabase migration for the new column", True, "existing coverage still works (migration/supabase)"),
        ("make the hero bigger", False, "pure frontend prompt, existing exemption still holds"),
    ]
    failed = 0
    for prompt, should_fire, label in cases:
        fired = bool(PROMPT_PATTERNS.search(prompt))
        ok = fired == should_fire
        print(("PASS" if ok else "FAIL") + f": {label} -> fired={fired} want={should_fire}")
        if not ok:
            failed += 1
    print(f"\n{len(cases) - failed}/{len(cases)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        sys.exit(_selftest())
    try:
        main()
    except Exception:
        # A pointer hook must never break a turn.
        sys.exit(0)
