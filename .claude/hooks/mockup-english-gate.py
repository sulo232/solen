#!/usr/bin/env python3
"""mockup-format gate , PreToolUse Write/Edit. (File keeps its historical name because it is
wired twice in settings.json, which this sandbox cannot edit; the LAW inside is current.)

TWO owner rules, dictated 2026-07-13 after rejecting the decision A/B panel mockups
("those mockup makes no sence and there should be a hook abt saying maiking the mockup a
preview of the whole page and also always in german"):

1. GERMAN, ALWAYS: mockup copy is German. This SUPERSEDES the 2026-07-01 English-mockup rule
   this file previously enforced (owner then: "mockup is always english"; owner now: "always
   in german" , latest dated instruction wins, per the precedence chain). Blocks a mockup
   file whose visible copy is English (>=2 distinct unambiguous English UI words).
2. WHOLE-PAGE PREVIEW: a mockup is a preview of the WHOLE real page with only the treatment
   applied , never an isolated component panel / A-B swatch board. Blocks a NEW mockup file
   that does not declare `Mockup-scope: whole-page` AND import at least one real component
   from the app tree (the declaration line is the agent's explicit compliance claim; the
   import requirement keeps it a copy of the real page, matching the no-invented-ui gate).

Scope: Write/Edit to files whose path contains /dev/ or /_mockups/ (code/markup extensions).
Fail-open on any error. Escapes: `german-ok` in-file for a genuinely-required English string
(brand names etc. never trigger; the wordlist is UI copy only); `panel-ok: <reason>` in-file
for the rare sanctioned non-page mockup (needs the reason inline); or
touch .claude/mockup-format-skip.flag (30-min TTL).
"""
import json, os, re, sys, time

# Unambiguous ENGLISH UI-copy words (not German homographs, not code identifiers by usage:
# matched only inside JSX text or quoted UI strings, see UI_TEXT_RE below).
ENGLISH = re.compile(
    r"\b(search|book now|choose|select one|continue|cancel|close|open now|read more|"
    r"see all|view all|show more|load more|back to|next step|your (booking|appointment)|"
    r"welcome|sign in|log in|please|loading|no results|try again|learn more)\b",
    re.I,
)
# JSX text nodes (>text<) and common UI-string props/labels.
UI_TEXT_RE = re.compile(r">([^<>{}]{3,120})<|(?:label|title|placeholder|aria-label)\s*[:=]\s*[\"']([^\"']{3,120})[\"']")


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
    ti = data.get("tool_input", {}) or {}
    fp = (ti.get("file_path") or "").replace("\\", "/")
    if not (("/dev/" in fp or "/_mockups/" in fp)
            and fp.endswith((".tsx", ".jsx", ".ts", ".js", ".html", ".htm"))):
        sys.exit(0)
    content = ti.get("content") or ti.get("new_string") or ""
    if not isinstance(content, str) or not content.strip():
        sys.exit(0)

    project = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
    flag = os.path.join(project, ".claude", "mockup-format-skip.flag")
    try:
        if os.path.exists(flag) and (time.time() - os.path.getmtime(flag)) < 1800:
            sys.exit(0)
    except Exception:
        pass

    problems = []

    # Rule 1 , German always (English copy blocked).
    if "german-ok" not in content:
        ui_text = " ".join(a or b for a, b in UI_TEXT_RE.findall(content))
        hits = sorted({m.group(0).lower() for m in ENGLISH.finditer(ui_text)})
        if len(hits) >= 2:
            problems.append(
                "ENGLISH COPY (" + ", ".join(hits[:6]) + "): mockups are ALWAYS German "
                "(owner 2026-07-13, supersedes the 2026-07-01 English rule). Rewrite the "
                "visible copy in German, or mark a genuinely-required string `german-ok`.")

    # Rule 2 , whole-page preview (new mockup page files only).
    is_new_file = bool(ti.get("content")) and not os.path.exists(fp)
    if is_new_file and fp.endswith((".tsx", ".jsx")) and "panel-ok" not in content:
        declares = "Mockup-scope: whole-page" in content
        imports_real = re.search(r"from\s+[\"'][^\"']*(_components|components-legacy)/", content)
        if not (declares and imports_real):
            problems.append(
                "NOT A WHOLE-PAGE PREVIEW: a mockup is the WHOLE real page with only the "
                "treatment applied (owner 2026-07-13: 'a preview of the whole page'), never an "
                "isolated component panel. Required: the literal line `Mockup-scope: whole-page` "
                "+ >=1 import from the real app tree (_components/ or components-legacy/). "
                "Rare sanctioned exception: add `panel-ok: <reason>` inline.")

    if problems:
        sys.stderr.write("MOCKUP-FORMAT GATE (owner 2026-07-13):\n- " + "\n- ".join(problems)
                         + "\nSkip (genuine false positive): touch .claude/mockup-format-skip.flag (30m)\n")
        sys.exit(2)
    sys.exit(0)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        sys.exit(0)
