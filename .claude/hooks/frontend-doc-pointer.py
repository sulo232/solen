#!/usr/bin/env python3
"""frontend-doc-pointer , points customer-frontend work at _docs/FRONTEND.md (2026-07-17).

Why this exists (owner ask, workstream #29): the design was defined but not the FUNCTION , what each
customer surface does, what you can do on it, and how it hands off to the next screen. _docs/FRONTEND.md
is now that map (10 flows, 62 screens, 113 connections, 60 gaps). A doc nobody opens is dead weight, so
this hook surfaces it the moment customer-frontend work starts. It is a POINTER, never a gate: it only
injects context, it never blocks an edit. Mirrors backend-doc-pointer.py.

Two events, one script:
  - UserPromptSubmit : if the prompt is customer-frontend / flow shaped, inject the pointer.
  - PreToolUse(Write|Edit|MultiEdit) : if the edited file is a customer-facing page/component, inject it.
Fires at most ONCE per session (a marker file), so it never nags turn after turn. Never fires on a
pure-backend prompt (those get backend-doc-pointer instead).
"""
import json, os, re, sys

STATE_DIR = os.path.expanduser("~/.claude/state")

# Customer-frontend / FLOW-shaped vocabulary. Deliberately about screens, flows and what-connects-to-what,
# not pure styling (that is fine too, but the doc is about function/connections).
PROMPT_PATTERNS = re.compile(
    r"\b("
    r"customer\s*(side|frontend|facing)|front[-\s]?end|"
    r"user\s*flow|booking\s*flow|checkout\s*flow|walk[-\s]?in\s*flow|"
    r"which\s*screen|each\s*screen|every\s*screen|per[-\s]?screen|screen\s*flow|"
    r"how\s*(it|they|the\s*\w+)\s*(connect|flow|hand\s*off)|handoff|hands?\s*off|"
    r"pdp|salon\s*page|confirmation\s*screen|booking\s*wizard|"
    r"the\s*(booking|checkout|profile|inspo|search|walk-?in|reviews?)\s*(flow|screen|page|surface)|"
    r"customer\s*journey|what\s*(each|the)\s*(page|screen|flow)\s*(does|shows)"
    r")\b",
    re.IGNORECASE,
)

_CUST_DIR = re.compile(
    r"(^|/)app/\[locale\]/(?!dashboard/|dev/|api/)"      # customer routes, not dashboard/dev/api
    r"|(^|/)app/\[locale\]/_components/(homepage|search|salon|primitives|landings|layout)/"
    r"|(^|/)components-legacy/(booking|salon|discovery|refund|loyalty|nail|shared|ui)/"
)

def is_customer_frontend_file(fp: str) -> bool:
    if not fp:
        return False
    f = fp.replace("\\", "/")
    if not f.endswith((".tsx", ".jsx")):
        return False
    if re.search(r"(^|/)app/\[locale\]/(dashboard|dev|api)/", f):
        return False
    return bool(_CUST_DIR.search(f))

POINTER = (
    "CUSTOMER-FRONTEND WORK , read _docs/FRONTEND.md first (hook: .claude/hooks/frontend-doc-pointer.py). "
    "It is the map of how every customer surface WORKS and CONNECTS: the 10 flows (discovery/search, "
    "PDP, booking, checkout, confirmation+post-booking, walk-in/queue, reviews, profile, value-store, "
    "inspo), and for each screen , route + file:line, what it shows, what you can do, what each element "
    "is wired to (real vs computed vs fabricated), and the HANDOFF to the next screen (what data carries "
    "over). It also lists 60 known gaps (orphaned routes, dead links, dormant/hidden features, "
    "fabrications). Ground your change in the relevant flow section before editing. Design/taste law is "
    "separate: _design-system/LOCKFILE.md + the CLAUDE.md pinned blocks."
)

def already_fired(sid: str) -> bool:
    marker = os.path.join(STATE_DIR, f".frontend-doc-{sid}")
    try:
        os.makedirs(STATE_DIR, exist_ok=True)
        if os.path.exists(marker):
            return True
        open(marker, "w").close()
    except Exception:
        pass
    return False

def emit(event_name: str):
    print(json.dumps({"hookSpecificOutput": {"hookEventName": event_name, "additionalContext": POINTER}}))
    sys.exit(0)

def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
    event = data.get("hook_event_name") or ""
    prompt = data.get("prompt") or ""
    if re.match(r"^\s*(<task-notification>|\[SYSTEM NOTIFICATION)", prompt):
        sys.exit(0)
    sid = (data.get("session_id") or "nosid")[:12]
    if prompt and (event == "UserPromptSubmit" or not event):
        if PROMPT_PATTERNS.search(prompt):
            if already_fired(sid):
                sys.exit(0)
            emit("UserPromptSubmit")
        sys.exit(0)
    fp = ((data.get("tool_input") or {}).get("file_path") or "")
    if is_customer_frontend_file(fp):
        if already_fired(sid):
            sys.exit(0)
        emit(event or "PreToolUse")
    sys.exit(0)

def selftest():
    """Added 2026-08-24. This pointer was armed with no test behind it since it was written.

    It has two independent decisions and both are tested here: does a PROMPT look like
    customer-frontend work, and is a FILE a customer surface. The session-marker that limits
    it to once per session is bookkeeping, not a judgement, so it is left out.

    Every file path below is a real one from the Solen repo.
    """
    prompt_cases = [
        # ---- must FIRE -------------------------------------------------------
        ("a question about how the booking flow hands off",
         "how does the booking flow hand off to the confirmation screen?", True),
        ("a question naming the checkout flow",
         "the checkout flow drops the promo code on step 3, can you look", True),
        ("a question about what each screen does",
         "walk me through what each screen does in the walk-in flow", True),
        ("customer-facing work named as such",
         "I want to redo the customer facing search page", True),
        ("the PDP named by its abbreviation",
         "the pdp gallery only shows two photos", True),

        # ---- must stay QUIET -------------------------------------------------
        ("a pure backend ask, which belongs to the backend pointer",
         "add a covering index on bookings(salon_id, starts_at)", False),
        ("a plain operational ask",
         "run the type check and tell me what breaks", False),
        ("a design-token ask with no flow vocabulary",
         "make the hairline #E4E4E7 everywhere", False),
        ("a git ask", "commit what is staged and show me the log", False),
        ("a task notification, which is never a real prompt",
         "<task-notification>agent finished</task-notification> the booking flow is done", False),
    ]

    file_cases = [
        # ---- must FIRE -------------------------------------------------------
        ("real app/[locale]/confirmation/page.tsx, a customer route",
         "app/[locale]/confirmation/page.tsx", True),
        ("real app/[locale]/_components/homepage/SalonCard.tsx",
         "app/[locale]/_components/homepage/SalonCard.tsx", True),
        ("real app/[locale]/_components/search/SalonResultCard.tsx",
         "app/[locale]/_components/search/SalonResultCard.tsx", True),
        ("real components-legacy/booking/BookingWizard.tsx",
         "components-legacy/booking/BookingWizard.tsx", True),
        ("real app/[locale]/inspo/[id]/page.tsx",
         "app/[locale]/inspo/[id]/page.tsx", True),

        # ---- must stay QUIET on ordinary good work ---------------------------
        ("real app/[locale]/dashboard/page.tsx is the salon owner's surface, not a customer's",
         "app/[locale]/dashboard/page.tsx", False),
        ("real app/api/waitlist/route.ts is backend",
         "app/api/waitlist/route.ts", False),
        ("real lib/supabase.ts is backend",
         "lib/supabase.ts", False),
        ("a migration is not a rendering surface",
         "supabase/migrations/20260815010000_chat_media_read_own_folder_only.sql", False),
        ("real messages/de.json is copy, not a screen",
         "messages/de.json", False),
        ("real app/[locale]/dev/login/page.tsx is a dev-only route",
         "app/[locale]/dev/login/page.tsx", False),

        # ---- GAPS found by this suite, recorded, NOT fixed -------------------
        ("GAP 1: real components-legacy/SalonCard.tsx sits at the TOP level of the folder, and "
         "the pattern requires one of eight named subfolders, so it is missed",
         "components-legacy/SalonCard.tsx", False),
        ("GAP 2: real components-legacy/search/ is missed even though 'search' IS named for the "
         "app/[locale]/_components branch. The two lists were never reconciled.",
         "components-legacy/search/SearchBar.tsx", False),
        ("GAP 3: the whole root components/ folder is missed. Real files there today include "
         "QuartierTile.tsx and WeatherBanner.tsx.",
         "components/QuartierTile.tsx", False),
    ]

    ok = 0
    total = len(prompt_cases) + len(file_cases)
    for name, prompt, expect in prompt_cases:
        is_notification = bool(re.match(r"^\s*(<task-notification>|\[SYSTEM NOTIFICATION)", prompt))
        got = (not is_notification) and bool(PROMPT_PATTERNS.search(prompt))
        good = got == expect
        ok += good
        print(f"  {'PASS' if good else 'FAIL'}  PROMPT  {name}  (fired={got}, expected={expect})")
    for name, fp, expect in file_cases:
        got = is_customer_frontend_file(fp)
        good = got == expect
        ok += good
        print(f"  {'PASS' if good else 'FAIL'}  FILE    {name}  (fired={got}, expected={expect})")
    print(f"\n{ok}/{total} passed")
    return 0 if ok == total else 1


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        sys.exit(selftest())
    try:
        main()
    except Exception:
        sys.exit(0)
