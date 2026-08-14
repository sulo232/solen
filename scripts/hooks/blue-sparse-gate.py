#!/usr/bin/env python3
"""
blue-sparse-gate.py  (PreToolUse: Write | Edit)

Owner-recurring ("you keep forgetting"): blue is KEPT but used VERY sparsely, like Uber / X, small
clickable bits only (text links, small chips, review counts). Never blue on many elements, never blue
CTAs/prices/labels. LOCKFILE ceiling: <=3 blue moments per content screen (taste rule 3, RT2).

This gate BLOCKS a mockup .html that applies the blue accent as a color to too many elements. It
counts applied-blue occurrences (color:/background: #276EF1 or var(--accent), text-s-accent /
bg-s-accent classes), not the single token definition.

Exit 0 = allow. Exit 2 = block. Skip once: touch ~/.claude/blue-sparse-skip.flag
Self-test: pipe {"tool_input":{"file_path":"...mockup.html","content":"..."}} on stdin.
"""
import json, sys, re, os

# blue accent applied as a color (NOT the :root token definition)
APPLIED_BLUE = re.compile(
    r"(?:color|background(?:-color)?)\s*:\s*(?:#276ef1|var\(\s*--accent\s*\))"
    r"|\b(?:text|bg|border)-s-accent\b"
    r"|(?:color|background(?:-color)?)\s*:\s*#1e54b7",
    re.I,
)
THRESHOLD = 6  # LOCKFILE ceiling is 3 blue moments; allow headroom, block clear overuse.


def _is_mockup(path, content):
    lp = path.lower()
    if "mockup" in lp or "_mockups" in lp:
        return True
    if lp.endswith((".html", ".htm")) and re.search(r"current.*proposed|round-3 tension|phone frame|mockup", content, re.I):
        return True
    return False


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
    flag = os.path.expanduser("~/.claude/blue-sparse-skip.flag")
    if os.path.exists(flag):
        try:
            os.remove(flag)
        except Exception:
            pass
        sys.exit(0)
    ti = data.get("tool_input", {}) or {}
    path = ti.get("file_path", "") or ""
    content = ti.get("content") or ti.get("new_string") or ""
    if not path.lower().endswith((".html", ".htm")) or not _is_mockup(path, content):
        sys.exit(0)
    n = len(APPLIED_BLUE.findall(content))
    if n > THRESHOLD:
        sys.stderr.write(
            "BLUE-SPARSE GATE (owner-recurring: 'use blue really scarcely, like Uber/X'): this mockup "
            "applies the blue accent to " + str(n) + " elements (ceiling is ~3 blue moments per screen). "
            "Blue is for small clickable bits only (text links, small chips, review counts). Never blue "
            "CTAs, prices, labels, headings, or fills. Cut it back to <=3 blue moments; everything else "
            "stays ink/grey. Skip once: touch ~/.claude/blue-sparse-skip.flag\n"
        )
        sys.exit(2)
    sys.exit(0)


if __name__ == "__main__":
    main()
