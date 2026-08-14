#!/usr/bin/env python3
"""
mockup-english-only-gate.py  (PreToolUse: Write | Edit)

Owner 2026-07-23 (verbatim): "why did you make it in German ... harden ... about making mockups in
German because I don't want fucking German shit."

Mockup copy is ENGLISH, always (DRIFT_LEDGER 2026-07-13). This session I wrongly instructed coders to
"keep real German content" in mockups, and they shipped German UI. This gate BLOCKS writing a mockup
.html that carries German UI prose. Real i18n component/source files are exempt (they are not mockups).

Exit 0 = allow. Exit 2 = block. Skip once (genuinely justified): touch ~/.claude/mockup-english-skip.flag
Self-test: pipe {"tool_input":{"file_path":"...mockup.html","content":"..."}} on stdin.
"""
import json, sys, re, os

# German UI words that should never appear in an English mockup (word-boundary matched).
GERMAN = re.compile(
    r"\b(Termin|Buchen|Buchung|Bewertung(en)?|Ge(oe|ö)ffnet|Geschlossen|Salons?|Uhrzeit|Weiter|"
    r"Stornieren|Kalender|Datum|Vormittag|Nachmittag|Abend|Empfohlen|Suche|Preis|Leistungen|"
    r"Verf(ue|ü)gbar|Ausw(ae|ä)hlen|Zur(ue|ü)ck|Anmelden|Damenschnitt|F(oe|ö)hnen|"
    r"F(ae|ä)rben|Haarschnitt)\b",
    re.I,
)


def _is_mockup(path, content):
    low_p = path.lower()
    if "mockup" in low_p or "_mockups" in low_p:
        return True
    # a plans/scratchpad .html that reads like a mockup
    if low_p.endswith((".html", ".htm")) and re.search(r"current.*proposed|mockup|round-3 tension|phone frame", content, re.I):
        return True
    return False


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
    flag = os.path.expanduser("~/.claude/mockup-english-skip.flag")
    if os.path.exists(flag):
        try:
            os.remove(flag)
        except Exception:
            pass
        sys.exit(0)
    ti = data.get("tool_input", {}) or {}
    path = ti.get("file_path", "") or ""
    content = ti.get("content") or ti.get("new_string") or ""
    if not path.lower().endswith((".html", ".htm")):
        sys.exit(0)
    if not _is_mockup(path, content):
        sys.exit(0)
    hits = GERMAN.findall(content)
    # findall returns tuples for alternation groups; flatten + count distinct-ish
    n = len(re.findall(GERMAN, content))
    if n >= 2:
        sample = ", ".join(sorted({m.group(0) for m in re.finditer(GERMAN, content)})[:6])
        sys.stderr.write(
            "MOCKUP-ENGLISH-ONLY GATE (owner 2026-07-23): this mockup carries German UI copy (" + sample +
            "...). Mockups are ENGLISH, always. Translate every visible UI string to English (keep the "
            "layout/meaning). Do NOT instruct 'keep real German content' for a mockup. "
            "Skip once only if truly justified: touch ~/.claude/mockup-english-skip.flag\n"
        )
        sys.exit(2)
    sys.exit(0)


if __name__ == "__main__":
    main()
