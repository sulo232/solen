#!/usr/bin/env python3
"""
future-link-promise-gate.py  (Stop)

Recurring 'promised-visual' failure: I close a turn saying "I'll send you the link once it's
rebuilt / when it's done" instead of either (a) giving a live link now, or (b) plainly stating
nothing is viewable yet. A future link promise leaves the owner empty-handed and reads as a
mockup that is "waiting to be seen" when it is not.

This gate BLOCKS a final message that PROMISES a future link but contains no actual link. Force:
give a live link now, or just say "nothing viewable yet" with no promise.

Exit 0 = allow. Exit 2 = block. Skip once: touch ~/.claude/future-link-skip.flag
Self-test: pipe {"last_assistant_message":"..."} on stdin.
"""
import json, sys, os, re

PROMISE = re.compile(
    r"(\bi'?ll\b|\bi will\b|\bwill\b)[^.]{0,45}\b(send|give|share|drop|hand|get you|bring you)\b[^.]{0,35}\blink\b"
    r"|\bsend (you )?(the|its|a|your) (link|url)\b"
    r"|\blink\b[^.]{0,25}\b(when|once|after)\b[^.]{0,35}\b(done|ready|rebuilt|lands?|built|finish)",
    re.I,
)
LINK = re.compile(r"\]\(https?://|localhost:\d+|trycloudflare|loca\.lt|claude\.ai/code/artifact|file://", re.I)


def _last_msg(data):
    if "last_assistant_message" in data:
        return data.get("last_assistant_message") or ""
    tp = data.get("transcript_path")
    if not tp or not os.path.exists(tp):
        return ""
    msg = ""
    try:
        for ln in reversed(open(tp).read().splitlines()):
            try:
                o = json.loads(ln)
            except Exception:
                continue
            role = o.get("role") or (o.get("message") or {}).get("role")
            if role != "assistant":
                continue
            c = o.get("content")
            if c is None:
                c = (o.get("message") or {}).get("content")
            if isinstance(c, list):
                msg = " ".join(b.get("text", "") for b in c if isinstance(b, dict))
            elif isinstance(c, str):
                msg = c
            if msg:
                break
    except Exception:
        pass
    return msg


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
    msg = _last_msg(data)
    if not msg:
        sys.exit(0)
    if PROMISE.search(msg) and not LINK.search(msg):
        flag = os.path.expanduser("~/.claude/future-link-skip.flag")
        if os.path.exists(flag):
            try:
                os.remove(flag)
            except Exception:
                pass
            sys.exit(0)
        sys.stderr.write(
            "FUTURE-LINK-PROMISE GATE (owner-recurring 'promised-visual'): your reply promises a link "
            "later ('I'll send the link when it's done') but contains no live link now. Stop promising "
            "future links. Either give a real link this turn, or just say plainly 'nothing viewable yet' "
            "with NO promise to send one. Skip once: touch ~/.claude/future-link-skip.flag\n"
        )
        sys.exit(2)
    sys.exit(0)


if __name__ == "__main__":
    main()
