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
import os, re, sys, time, glob, json, subprocess

GERMAN = re.compile(
    r"\b(keine?|suchen|anzeigen|nichts|vorschl\w*|zurücksetzen|treffer|geöffnet|"
    r"probier\w*|schweiz\w*|wählen|stadt|städte|und|oder|für|nicht|weiter|ganzen?|"
    r"aktuell|ruhig|wärmere|erhöht\w*|klarer|termine?|buchung\w*|preis\w*|jetzt|"
    r"gemessen|angewandt|entscheidung\w*|verletzung\w*|screens?|welle|nach|dem|gesetz|"
    r"punkte?|sauber|erfüllt|bereits|deine|einzeln|zuerst|sektionsabst\w*|dieselbe|"
    r"verfügbar\w*|datum|mitarbeiter|abst\w*|haarlinie|auswahl|grau|statt|schwarz|braucht)\b",
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
                # v2, 2026-08-05, owner: "remove those gates thats maiking u stop". mtime is not
                # authorship. Creating a git worktree rewrites every file on disk, so a fresh
                # worktree made every mockup in the repo look "touched this session" and this gate
                # named six files the session had never opened, on every single stop. Git knows
                # the difference: if the file is unmodified against HEAD, this session did not
                # write it, whatever its timestamp says.
                try:
                    _st = subprocess.run(["git", "-C", proj, "status", "--porcelain", "--", fp],
                                         capture_output=True, text=True, timeout=8)
                    if _st.returncode == 0 and not _st.stdout.strip():
                        continue          # clean against HEAD: not this session's work
                except Exception:
                    pass                  # git unavailable: fall back to the old mtime behaviour
                txt = open(fp, encoding="utf-8", errors="ignore").read()
            except Exception:
                continue
            hits = sorted({m.group(0).lower() for m in GERMAN.finditer(visible_text(txt))})
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
