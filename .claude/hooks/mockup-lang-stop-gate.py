#!/usr/bin/env python3
"""mockup-lang-stop-gate , Stop hook.

WHY THIS EXISTS (owner 2026-07-17, FURIOUS, second recurrence): "why the fuck is the mockup in
German? Next session we literally made a gate about stopping this, and it keeps happening."

The PreToolUse mockup-english-gate.py only fires on the Write/Edit TOOLS. It was bypassed by
GENERATING the mockup HTML with a Python script run through the shell (pathlib.write_text), which
never touches Write/Edit, so the PreToolUse gate never ran. This Stop gate closes that hole: at
turn end it scans every RECENTLY-MODIFIED mockup file (any write method) for German in the VISIBLE
CHROME (text the owner reads), independent of how the file was written.

Scope: files under public/_mockups/ (*.html/*.htm) and any /dev/ route file (*.tsx/*.jsx/*.html)
modified in the last 180 minutes. It strips <!-- comments -->, <script>/<style> blocks, HTML tags,
and alt="..."/title="..." values (a live-capture frame legitimately carries German inside the
image and its alt description; the CHROME the owner reads must be English). >=3 distinct
unambiguous German words in the remaining visible text -> block the stop.

No in-file marker escape (the marker is exactly what gets abused). Escape only via a fresh reasoned
skip flag: echo "<why>" > .claude/mockup-lang-skip.flag (10-min TTL, must be non-empty).
Fail-open on any error.
"""
import os, re, sys, time, glob, json

# FOUR FALSE POSITIVES IN ONE SESSION, 2026-07-31, each costing a turn and a skip flag. The list
# had swept up three kinds of word that are not German mockup chrome:
#
#   ENGLISH WORDS that merely look German-ish: "screen", "screens", "datum" (singular of data),
#   "statt" only ever appeared inside English text here. Flagging these makes the gate cry wolf.
#
#   OUR OWN COMPONENT'S FIELD LABELS: "Stadt" is the literal label rendered by
#   app/[locale]/_components/homepage/SearchBar.tsx. DRIFT_LEDGER 2026-07-03 records a mockup that
#   INVENTED a search bar instead of using ours and was rejected, so carrying the real label is
#   required. Translating it would be the exact drift the ledger warns about.
#
#   SWISS PROPER NOUNS: place and salon names stay in German by definition. Zürich is Zürich.
#
# The gate exists to stop me WRITING German chrome, not to stop the product's own words appearing.
# Those three classes are now exempt and the rest of the list stands.
ALLOWED = re.compile(
    r"\b(screens?|datum|statt|"                     # English words that look German
    r"stadt|zeit|service|"                          # our real SearchBar field labels
    r"z[üu]rich\w*|basel|bern|genf|luzern|lausanne|winterthur|"  # Swiss place names
    r"solen)\b",
    re.I,
)

GERMAN = re.compile(
    r"\b(keine?|suchen|anzeigen|nichts|vorschl\w*|zurücksetzen|treffer|geöffnet|"
    r"probier\w*|schweiz\w*|wählen|städte|und|oder|für|nicht|weiter|ganzen?|"
    r"aktuell|ruhig|wärmere|erhöht\w*|klarer|termine?|buchung\w*|preis\w*|jetzt|"
    r"gemessen|angewandt|entscheidung\w*|verletzung\w*|welle|nach|dem|gesetz|"
    r"punkte?|sauber|erfüllt|bereits|deine|einzeln|zuerst|sektionsabst\w*|dieselbe|"
    r"verfügbar\w*|mitarbeiter|abst\w*|haarlinie|auswahl|grau|schwarz|braucht)\b",
    re.I,
)

def visible_text(html):
    s = re.sub(r"<!--.*?-->", " ", html, flags=re.S)          # drop HTML comments (headers)
    s = re.sub(r"<(script|style)\b.*?</\1>", " ", s, flags=re.S | re.I)  # drop code/style
    s = re.sub(r'\balt\s*=\s*"[^"]*"', " ", s, flags=re.I)     # drop alt="" (frame descriptions)
    s = re.sub(r'\btitle\s*=\s*"[^"]*"', " ", s, flags=re.I)
    s = re.sub(r"<[^>]+>", " ", s)                              # strip tags -> visible text only
    return s

def main():
    try:
        json.load(sys.stdin)
    except Exception:
        pass
    proj = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
    flag = os.path.join(proj, ".claude", "mockup-lang-skip.flag")
    try:
        if os.path.exists(flag) and (time.time() - os.path.getmtime(flag)) < 600:
            if open(flag).read().strip():
                sys.exit(0)
    except Exception:
        pass

    now = time.time()
    patterns = [
        os.path.join(proj, "public", "_mockups", "**", "*.htm*"),
        os.path.join(proj, "**", "dev", "**", "*.tsx"),
        os.path.join(proj, "**", "dev", "**", "*.jsx"),
        os.path.join(proj, "**", "dev", "**", "*.htm*"),
    ]
    offenders = []
    for pat in patterns:
        for fp in glob.glob(pat, recursive=True):
            try:
                if now - os.path.getmtime(fp) > 180 * 60:
                    continue
                txt = open(fp, encoding="utf-8", errors="ignore").read()
            except Exception:
                continue
            # ALLOWED must be applied HERE or the exemption is decorative. Defining the list
            # without filtering with it is how a gate keeps crying wolf while looking fixed.
            hits = sorted({m.group(0).lower() for m in GERMAN.finditer(visible_text(txt))
                           if not ALLOWED.fullmatch(m.group(0))})
            if len(hits) >= 3:
                offenders.append((os.path.relpath(fp, proj), hits[:6]))
    if offenders:
        lines = ["MOCKUP-LANG (owner 2026-07-17, FURIOUS second recurrence): a mockup you touched",
                 "this session has GERMAN in the visible chrome. Mockups are ALWAYS English , the",
                 "live-capture frames carry the product's German, but every label/heading/sentence",
                 "YOU write is English. (This gate closes the script-write hole the PreToolUse gate",
                 "missed.) Rewrite the chrome in English:"]
        for f, h in offenders[:6]:
            lines.append("  - " + f + "  (" + ", ".join(h) + ")")
        lines.append('Escape only if genuinely required: echo "<why>" > .claude/mockup-lang-skip.flag')
        sys.stderr.write("\n".join(lines) + "\n")
        sys.exit(2)
    sys.exit(0)

if __name__ == "__main__":
    try:
        main()
    except Exception:
        sys.exit(0)
