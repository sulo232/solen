#!/usr/bin/env python3
"""mockup-english-gate , PreToolUse Write/Edit.

Owner rule (2026-07-01, flagged: "why are you making the mockup in german mockup is always
english"): standalone MOCKUPS are ALWAYS in ENGLISH. I built the /dev/no-results comparison
mockup with hardcoded German copy , wrong. The real SHIPPED component is exempt (it renders
German via i18n/t(), which is correct); only a MOCKUP file with HARDCODED copy must be English.

Scope: blocks a Write/Edit to a mockup file (path contains /dev/ or /_mockups/, code/markup)
whose new content has German copy (>=2 distinct unambiguous German words). Fail-open on any
error. Skip: touch .claude/mockup-english-skip.flag (30-min TTL) or add `english-ok` in-file.
"""
import json, re, sys, os, time

# unambiguously-German UI words (not English homographs); literal umlauts on purpose.
GERMAN = re.compile(
    r"\b(keine?|suchen|anzeigen|nichts|vorschl\w*|zurücksetzen|treffer|geöffnet|"
    r"probier\w*|schweiz\w*|wählen|stadt|städte|und|oder|für|nicht|weiter|ganzen?|"
    r"aktuell|ruhig|wärmere|erhöht\w*|klarer|termine?|buchung\w*|preis\w*|"
    r"verfügbar\w*|datum|mitarbeiter)\b",
    re.I,
)


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
    if not isinstance(content, str) or "english-ok" in content:
        sys.exit(0)

    project = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
    flag = os.path.join(project, ".claude", "mockup-english-skip.flag")
    try:
        if os.path.exists(flag) and (time.time() - os.path.getmtime(flag)) < 1800:
            sys.exit(0)
    except Exception:
        pass

    hits = sorted({m.group(0).lower() for m in GERMAN.finditer(content)})
    if len(hits) >= 2:
        sys.stderr.write(
            "MOCKUP-ENGLISH (owner rule): this mockup file (" + os.path.basename(fp) +
            ") has German copy (" + ", ".join(hits[:6]) + "). Mockups are ALWAYS in ENGLISH , "
            "the shipped component renders German via i18n/t(), but a hardcoded mockup must be "
            "English. Rewrite the visible copy (and notes) in English. Skip: touch "
            ".claude/mockup-english-skip.flag (30m) or add `english-ok` if a German string is "
            "genuinely required.\n")
        sys.exit(2)
    sys.exit(0)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        sys.exit(0)
