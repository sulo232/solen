#!/usr/bin/env python3
"""
tunnel-alternative-gate.py  (Stop hook)

Hardens the recurring "link" mistake (owner 2026-07-22, after a long tunnel loop):
NEVER leave the owner told "the tunnel/link is down/blocked" with NO working way to
see the deliverable in the SAME message. A dead-end "sorry, no link" is the failure.

Rule: if the final assistant message says a tunnel/preview link is down / blocked /
unavailable / impossible, it MUST also hand a working alternative in that same message:
a localhost:PORT link, a pointer to a file that was sent (SendUserFile / "sent above" /
"rendered file" / "side panel"), or a live loca.lt / trycloudflare link.

Exit 0 = allow. Exit 2 = block with guidance on stderr.

Self-testable: pass {"last_assistant_message": "..."} on stdin. In production it also
reads the transcript_path the harness provides and pulls the last assistant turn.
"""
import json, sys, re


def _extract_message(data):
    # 1) direct field (used by the self-test and some harnesses)
    for k in ("last_assistant_message", "message", "assistant_message"):
        v = data.get(k)
        if isinstance(v, str) and v.strip():
            return v
    # 2) transcript file: take the last assistant turn's text
    tp = data.get("transcript_path")
    if tp:
        try:
            text = ""
            with open(tp) as fh:
                for line in fh:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        o = json.loads(line)
                    except Exception:
                        continue
                    role = o.get("role") or o.get("type") or (o.get("message") or {}).get("role")
                    if role != "assistant":
                        continue
                    content = o.get("content")
                    if content is None:
                        content = (o.get("message") or {}).get("content")
                    if isinstance(content, list):
                        text = " ".join(
                            seg.get("text", "") for seg in content if isinstance(seg, dict)
                        )
                    elif isinstance(content, str):
                        text = content
            return text
        except Exception:
            return ""
    return ""


DOWN = re.compile(
    r"tunnel\s+(is\s+)?(down|dead|blocked|unavailable|unreachable|can'?t|cannot|not\s+work|"
    r"failing|impossible)|(no|without\s+a?)\s+(cloudflare|trycloudflare|tunnel)\s+link|"
    r"port\s*7844|readyconnections\D*0|503\s*[- ]*tunnel\s+unavailable",
    re.I,
)

ALT = re.compile(
    r"localhost:\d+|https://[a-z0-9-]+\.trycloudflare\.com|https://[a-z0-9-]+\.loca\.lt|"
    r"side panel|sent above|rendered file|file i sent|i sent (you )?the|senduserfile",
    re.I,
)

# Rule 2 (owner 2026-07-22, refuted TWICE): never assert the owner's OWN network / internet /
# wifi / router is the cause of a tunnel failure. If a tunnel will not connect, frame it as THIS
# execution environment, or as genuinely uncertain, never as the owner's side.
BLAME = re.compile(
    r"(your\s+(network|internet|wi[- ]?fi|router|firewall)|the\s+network)\s+(is\s+)?"
    r"(block(s|ing)?|firewall(s|ing|ed)?|unreachable|down)",
    re.I,
)
EXEMPT = re.compile(
    r"not\s+your\s+(network|internet)|this\s+(execution\s+)?environment|this\s+sandbox|"
    r"my\s+(sandbox|environment)|i'?m\s+not\s+(certain|sure)|don'?t\s+(actually\s+)?know",
    re.I,
)


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
    msg = _extract_message(data)
    if not msg:
        sys.exit(0)
    # Rule 2 (owner 2026-07-22): never blame the owner's OWN network for a tunnel failure.
    if BLAME.search(msg) and not EXEMPT.search(msg):
        sys.stderr.write(
            "TUNNEL-BLAME GATE: do not claim the owner's own network / internet / wifi / router "
            "is blocking the tunnel. The owner refuted that. Frame a tunnel failure as THIS "
            "execution environment, or as genuinely uncertain, never as the owner's side.\n"
        )
        sys.exit(2)
    # Rule 1: a claimed-down tunnel must ship a working alternative.
    if not DOWN.search(msg):
        sys.exit(0)  # not claiming a link is down; nothing to enforce
    if ALT.search(msg):
        sys.exit(0)  # claimed down but gave a working alternative: good
    sys.stderr.write(
        "TUNNEL-ALTERNATIVE GATE: your message tells the owner a tunnel/preview link is "
        "down or blocked but gives NO working way to view the deliverable in the same "
        "message. Add one now: a localhost:PORT link, a pointer to the file you sent "
        "(SendUserFile), or a live loca.lt/trycloudflare link. Never leave them with "
        "'no link' and nothing else.\n"
    )
    sys.exit(2)


if __name__ == "__main__":
    main()
