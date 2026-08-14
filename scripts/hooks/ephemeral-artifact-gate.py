#!/usr/bin/env python3
"""
ephemeral-artifact-gate.py  (Stop)

Recurring 'link' failure this session: I handed the owner links to artifacts that then died,
the worst being 5 mockups written to the session SCRATCHPAD, which a session restart wiped
(localhost 404). Root cause: pointing the owner at a deliverable that lives under a temp /
scratchpad path instead of a committed location.

Fix (mechanical, not a promise): block ending a turn whose final message points the owner at an
artifact under /private/tmp, /tmp/claude, or a scratchpad dir. Deliverables must be moved to a
committed location (git add + commit) and linked from there.

Exit 0 = allow. Exit 2 = block. Skip once: touch ~/.claude/ephemeral-artifact-skip.flag
Self-test: pipe {"last_assistant_message":"..."} on stdin.
"""
import json, sys, os, re

EPHEMERAL = re.compile(r'/private/tmp/|/tmp/claude|/scratchpad/|[\\/]scratchpad\b', re.I)


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
    if not msg or not EPHEMERAL.search(msg):
        sys.exit(0)
    flag = os.path.expanduser("~/.claude/ephemeral-artifact-skip.flag")
    if os.path.exists(flag):
        try:
            os.remove(flag)
        except Exception:
            pass
        sys.exit(0)
    sys.stderr.write(
        "EPHEMERAL-ARTIFACT GATE: your reply points the owner at an artifact under a temp/scratchpad "
        "path, which is wiped on session restart (the exact dead-link failure that keeps recurring). "
        "Move any deliverable you hand the owner into a COMMITTED location (git add + commit), serve/link "
        "THAT, and drop the temp path from your message. Skip once: touch ~/.claude/ephemeral-artifact-skip.flag\n"
    )
    sys.exit(2)


if __name__ == "__main__":
    main()
