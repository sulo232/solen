#!/usr/bin/env python3
"""mockup-format gate , PreToolUse Write/Edit.

TWO rules, current as of the owner's 2026-07-13 CORRECTION message ("i told you mockups
always always in english... fix the gates too"):

1. ENGLISH, ALWAYS (2026-07-01 rule REAFFIRMED 2026-07-13): hardcoded mockup copy is ENGLISH.
   History, so this never flip-flops again: the 2026-07-01 owner rule said English; on
   2026-07-13 a dictated message read "and also always in german" and this gate was briefly
   inverted to German; the owner corrected the same day ("always always in english"), so the
   mis-dictation is void and ENGLISH stands. Note the standing exemption: REAL shipped
   components render German via i18n/t() at /de/ , that is correct and invisible to this gate
   (it only sees hardcoded strings in the mockup FILE). Review links for mockups composing
   real components should use the /en/ locale so the page reads English.
2. WHOLE-PAGE PREVIEW (owner 2026-07-13, first message , NOT retracted by the correction):
   a mockup is a preview of the WHOLE real page with only the treatment applied, never an
   isolated component panel / A-B swatch board. New mockup files must carry the literal line
   `Mockup-scope: whole-page` AND import at least one real component from the app tree.

Scope: Write/Edit to files whose path contains /dev/ or /_mockups/ (code/markup extensions).
Fail-open on any error. Escapes: `english-ok` in-file for a genuinely-required German string;
`panel-ok: <reason>` in-file for a sanctioned non-page mockup; or
touch .claude/mockup-format-skip.flag (30-min TTL).
"""
import json, os, re, sys, time

# Unambiguously-German UI words (not English homographs); literal umlauts on purpose.
# (Wordlist from the original 2026-07-01 gate, kept verbatim.)
GERMAN = re.compile(
    r"\b(keine?|suchen|anzeigen|nichts|vorschl\w*|zurücksetzen|treffer|geöffnet|"
    r"probier\w*|schweiz\w*|wählen|stadt|städte|und|oder|für|nicht|weiter|ganzen?|"
    r"aktuell|ruhig|wärmere|erhöht\w*|klarer|buchen|entscheidung\w*|beispiel|zähler|"
    r"deckkraft|kreisgrösse|glocke|schatten|ansehen)\b",
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

    # Rule 1 , ENGLISH always (hardcoded German copy blocked).
    if "english-ok" not in content:
        hits = sorted({m.group(0).lower() for m in GERMAN.finditer(content)})
        if len(hits) >= 2:
            problems.append(
                "GERMAN COPY (" + ", ".join(hits[:6]) + "): hardcoded mockup copy is ALWAYS "
                "ENGLISH (owner 2026-07-01, REAFFIRMED 2026-07-13 correction; the same-day "
                "'always in german' message was a mis-dictation, void). Real components "
                "rendering German via i18n are exempt , link such mockups at /en/. Rewrite "
                "hardcoded copy in English, or mark a genuinely-required string `english-ok`.")

    # Rule 2 , whole-page preview (new mockup page files only; NOT retracted).
    is_new_file = bool(ti.get("content")) and not os.path.exists(fp)
    if is_new_file and fp.endswith((".tsx", ".jsx")) and "panel-ok" not in content:
        declares = "Mockup-scope: whole-page" in content
        imports_real = re.search(r"from\s+[\"'][^\"']*(_components|components-legacy)/", content)
        if not (declares and imports_real):
            problems.append(
                "NOT A WHOLE-PAGE PREVIEW: a mockup is the WHOLE real page with only the "
                "treatment applied (owner 2026-07-13), never an isolated component panel. "
                "Required: the literal line `Mockup-scope: whole-page` + >=1 import from the "
                "real app tree. Rare sanctioned exception: `panel-ok: <reason>` inline.")

    if problems:
        sys.stderr.write("MOCKUP-FORMAT GATE:\n- " + "\n- ".join(problems)
                         + "\nSkip (genuine false positive): touch .claude/mockup-format-skip.flag (30m)\n")
        sys.exit(2)
    sys.exit(0)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        sys.exit(0)
