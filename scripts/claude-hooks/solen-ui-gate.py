#!/usr/bin/env python3
"""PreToolUse hook: surface _rules/SOLEN_UI.md when an agent edits UI source files.

Reads a JSON tool-use payload from stdin, inspects the target file path, and
emits a hookSpecificOutput.additionalContext message to the model so it sees
the gate reminder *before* the edit goes through. Non-blocking — purely
informational, but loud enough that the model can't claim it didn't see it.

Triggers on: .tsx .jsx .ts .js .css .scss .html
Skips: tests, _rules/, _tasks/, messages/ (i18n), node_modules, scripts/, .next/
"""
import json
import os
import sys

UI_EXTENSIONS = (".tsx", ".jsx", ".ts", ".js", ".css", ".scss", ".html")
SKIP_DIR_FRAGMENTS = (
    "/_rules/", "/_tasks/", "/messages/", "/node_modules/",
    "/scripts/", "/.next/", "/supabase/", "/public/",
)
SKIP_SUFFIXES = (".test.tsx", ".test.ts", ".test.jsx", ".test.js", ".d.ts", ".config.ts", ".config.js")

GATE_MESSAGE = (
    "\n⛔ SOLEN UI GATE — you are about to edit {fname}.\n"
    "Before producing UI output, confirm you have walked through _rules/SOLEN_UI.md "
    "(14 principles + tactical heuristics) and that the change respects _tasks/SOLEN_DESIGN.md tokens.\n"
    "If this is a UI/UX change, briefly answer the relevant principles in your reply BEFORE the edit.\n"
    "If this edit is non-visual (logic, types, data wiring), proceed without the gate — but say so.\n"
)


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        return 0

    tool_input = payload.get("tool_input", {}) or {}
    file_path = tool_input.get("file_path") or tool_input.get("notebook_path") or ""
    if not file_path:
        return 0

    lower = file_path.lower()
    if not lower.endswith(UI_EXTENSIONS):
        return 0
    if any(frag in file_path for frag in SKIP_DIR_FRAGMENTS):
        return 0
    if any(lower.endswith(suf) for suf in SKIP_SUFFIXES):
        return 0

    msg = GATE_MESSAGE.format(fname=os.path.basename(file_path))
    out = {
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "additionalContext": msg,
        }
    }
    json.dump(out, sys.stdout)
    return 0


if __name__ == "__main__":
    sys.exit(main())
