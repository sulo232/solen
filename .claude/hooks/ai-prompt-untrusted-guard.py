#!/usr/bin/env python3
"""ai-prompt-untrusted-guard , PreToolUse(Write|Edit|MultiEdit) reminder (2026-07-14).

Owner asked to HARDEN the AI prompt-injection class ("so this won't happen again") after the
Part-D audit found customer text spliced raw into a Gemini prompt. The structural fix is the
shared helper lib/ai/untrusted.ts wrapUntrustedInput(); this hook keeps it enforced: whenever a
file that calls Gemini/an LLM is written or edited without routing text through wrapUntrustedInput,
it injects a reminder. It is a REMINDER, not a hard block, because static analysis cannot prove a
given interpolation is user-controlled (a hard block would false-positive on prompts built only
from server constants). Once per file per session.

Fires when the NEW content introduces an LLM-call marker (generateContent / generativelanguage /
@google/generative-ai / GoogleGenerativeAI / fal image gen) and neither the new content nor the
on-disk file already references wrapUntrustedInput. stdout JSON additionalContext is injected.
"""
import hashlib
import json
import os
import re
import sys

STATE_DIR = os.path.expanduser("~/.claude/state")
LLM_MARKER = re.compile(r"generateContent|generativelanguage\.googleapis|@google/generative-ai|GoogleGenerativeAI|fal\.subscribe|fal\.run|@fal-ai")
HELPER = "wrapUntrustedInput"


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    tool = data.get("tool_name", "")
    ti = data.get("tool_input", {}) or {}
    fp = ti.get("file_path", "") or ""
    if not fp or not re.search(r"\.tsx?$", fp):
        sys.exit(0)
    f = fp.replace("\\", "/")
    if not re.search(r"(^|/)(app|lib)/", f):
        sys.exit(0)
    # The helper file itself is exempt.
    if f.endswith("lib/ai/untrusted.ts"):
        sys.exit(0)

    if tool == "Write":
        new_text = ti.get("content", "") or ""
    elif tool in ("Edit", "MultiEdit"):
        new_text = ti.get("new_string", "") or ""
        if tool == "MultiEdit":
            new_text = " ".join((e or {}).get("new_string", "") for e in (ti.get("edits") or []))
    else:
        sys.exit(0)

    if not LLM_MARKER.search(new_text):
        sys.exit(0)
    if HELPER in new_text:
        sys.exit(0)
    # The helper might already be used elsewhere in the current file (pre-edit): don't nag then.
    try:
        with open(fp, "r", encoding="utf-8", errors="ignore") as fh:
            if HELPER in fh.read():
                sys.exit(0)
    except OSError:
        pass

    sid = (data.get("session_id") or "nosid")[:12]
    key = hashlib.md5(fp.encode()).hexdigest()[:10]
    marker = os.path.join(STATE_DIR, f".aiguard-{sid}-{key}")
    try:
        os.makedirs(STATE_DIR, exist_ok=True)
        if os.path.exists(marker):
            sys.exit(0)
        open(marker, "w").close()
    except Exception:
        pass

    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "additionalContext": (
                "AI PROMPT-INJECTION GUARD (.claude/hooks/ai-prompt-untrusted-guard.py): this file "
                "calls an LLM (Gemini/fal) but does not use wrapUntrustedInput. Any user-controlled "
                "text (request body, DB values a user set, DOM element_text, uploaded content) that "
                "goes into the prompt MUST be wrapped with wrapUntrustedInput(label, value) from "
                "lib/ai/untrusted.ts, so injected text is fenced as untrusted DATA and cannot act as "
                "instructions. If every input here is a server-side constant, ignore this."
            ),
        }
    }))
    sys.exit(0)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        sys.exit(0)
