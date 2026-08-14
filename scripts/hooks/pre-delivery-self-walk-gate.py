#!/usr/bin/env python3
"""
pre-delivery-self-walk-gate.py  (Stop)  ,  R3 stream S13 / gap-register D4

Owner 2026-07-22 (approved small item). Blocks ending a turn that PRESENTS a UI mockup/redesign
to the owner unless solen-taste-diagnosis was run on it this turn first. The reactive
show-it-then-get-rejected loop is the weakest link; this forces the self-walk BEFORE showing.

Exit 0 = allow. Exit 2 = block. Skip once: touch ~/.claude/self-walk-skip.flag
Self-test: pipe {"last_assistant_message":"...","diagnosis_ran":false} on stdin.
"""
import json, sys, re, os

LINK = re.compile(r"localhost:\d+|trycloudflare\.com|loca\.lt|claude\.ai/code/artifact", re.I)
MOCK = re.compile(r"mockup|redesign|before[ /]?after|integrated (redesign|mockup)", re.I)


def _msg_and_diag(data):
    if "last_assistant_message" in data:
        return data.get("last_assistant_message", "") or "", bool(data.get("diagnosis_ran", False))
    tp = data.get("transcript_path")
    msg, diag = "", False
    if tp and os.path.exists(tp):
        try:
            lines = open(tp).read().splitlines()
            for ln in lines[-80:]:
                if "solen-taste-diagnosis" in ln or "taste-diagnosis" in ln:
                    diag = True
            for ln in reversed(lines):
                try:
                    o = json.loads(ln)
                except Exception:
                    continue
                role = o.get("role") or o.get("type") or (o.get("message") or {}).get("role")
                if role != "assistant":
                    continue
                c = o.get("content")
                if c is None:
                    c = (o.get("message") or {}).get("content")
                if isinstance(c, list):
                    msg = " ".join(s.get("text", "") for s in c if isinstance(s, dict))
                elif isinstance(c, str):
                    msg = c
                if msg:
                    break
        except Exception:
            pass
    return msg, diag


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
    msg, diag = _msg_and_diag(data)
    if not msg:
        sys.exit(0)
    # Presenting a mockup = a preview link AND mockup/redesign language in the same message.
    if not (LINK.search(msg) and MOCK.search(msg)):
        sys.exit(0)
    if diag:
        sys.exit(0)  # self-review ran this turn
    flag = os.path.expanduser("~/.claude/self-walk-skip.flag")
    if os.path.exists(flag):
        try:
            os.remove(flag)
        except Exception:
            pass
        sys.exit(0)
    sys.stderr.write(
        "PRE-DELIVERY SELF-WALK GATE (owner 2026-07-22, S13/D4): you are handing the owner a UI "
        "mockup/redesign link but did NOT run solen-taste-diagnosis on it this turn. Run the diagnosis "
        "skill on your OWN mockup FIRST (squint test, hierarchy counts, type floors, grouping, contrast, "
        "real-photos check), fix what it flags, THEN show the owner. The show-then-reject loop is the "
        "failure this gate exists to stop. Skip once: touch ~/.claude/self-walk-skip.flag\n"
    )
    sys.exit(2)


if __name__ == "__main__":
    main()
