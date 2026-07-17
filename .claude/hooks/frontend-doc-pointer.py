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

if __name__ == "__main__":
    try:
        main()
    except Exception:
        sys.exit(0)
