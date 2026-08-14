#!/usr/bin/env python3
"""
attempt-before-delegate-gate.py  (Stop)

Owner 2026-07-22 (verbatim: "u can lttrly do it pls stop asking me to enter the commands over and
over again im alrdy tired"). Recurring pattern: handing the owner shell commands to run ("run this
in your terminal", "you remove/wire/edit X") instead of attempting it myself first.

Rule: if the closing message DELEGATES a shell/filesystem action to the owner, the transcript must
show I actually ATTEMPTED that action this turn (a Bash tool call). Otherwise block: try it first,
delegate only after showing the real failure.

Exit 0 = allow. Exit 2 = block. Skip once: touch ~/.claude/attempt-before-delegate-skip.flag
Self-test: pipe {"last_assistant_message":"...","attempted":false} on stdin.
"""
import json, sys, re, os

# The message hands the owner a command / tells them to do a shell-ish action themselves.
DELEGATE = re.compile(
    r"(run|paste|type|enter)\s+(this|these|it|that|the).{0,40}(terminal|command|line)|"
    r"from your( own)?\s+terminal|in your( own)?\s+terminal|"
    r"you\s+(can|could|should|need to|have to|just)\s+(run|remove|delete|rm|mv|wire|add|edit|paste|type|enter|chmod)|"
    r"```[a-z]*\s*\n?\s*(rm|mv|chmod|echo\b.*>|git\s|npm\s|python3?\s)",
    re.I,
)


def _msg_and_attempted(data):
    if "last_assistant_message" in data:
        return data.get("last_assistant_message", "") or "", bool(data.get("attempted", False))
    tp = data.get("transcript_path")
    msg, attempted = "", False
    if tp and os.path.exists(tp):
        try:
            lines = open(tp).read().splitlines()
            # find the last user message index; scan forward for a Bash tool call
            last_user = 0
            for i, ln in enumerate(lines):
                try:
                    o = json.loads(ln)
                except Exception:
                    continue
                role = o.get("role") or (o.get("message") or {}).get("role")
                if role == "user":
                    last_user = i
            for ln in lines[last_user:]:
                if '"name":"Bash"' in ln or '"name": "Bash"' in ln or "tool_use" in ln and "Bash" in ln:
                    attempted = True
            for ln in reversed(lines):
                try:
                    o = json.loads(ln)
                except Exception:
                    continue
                role = o.get("role") or o.get("type") or (o.get("message") or {}).get("role")
                if role != "assistant":
                    continue
                c = o.get("content") or (o.get("message") or {}).get("content")
                if isinstance(c, list):
                    msg = " ".join(s.get("text", "") for s in c if isinstance(s, dict))
                elif isinstance(c, str):
                    msg = c
                if msg:
                    break
        except Exception:
            pass
    return msg, attempted


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
    msg, attempted = _msg_and_attempted(data)
    if not msg or not DELEGATE.search(msg):
        sys.exit(0)
    if attempted:
        sys.exit(0)
    flag = os.path.expanduser("~/.claude/attempt-before-delegate-skip.flag")
    if os.path.exists(flag):
        try:
            os.remove(flag)
        except Exception:
            pass
        sys.exit(0)
    sys.stderr.write(
        "ATTEMPT-BEFORE-DELEGATE GATE (owner 2026-07-22): you are handing the owner a command to run "
        "but did not attempt it yourself this turn. Try it first with Bash and show the real result; "
        "only hand the owner a command AFTER a genuine failure. Do not make the tired owner type "
        "things you can try. Skip once: touch ~/.claude/attempt-before-delegate-skip.flag\n"
    )
    sys.exit(2)


if __name__ == "__main__":
    main()
