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

2026-08-18 (third fix of the day): the second fix answered "did I touch this file?" with
`git status`, which lists only UNCOMMITTED files. Measured on identical fixtures, one German
mockup: BLOCK(exit2) while dirty, pass the moment it was committed. This project's law is to
commit often and autonomously, so finishing a commit disarmed the gate. The record that actually
knows what the turn did is the TRANSCRIPT; git status is now only the fallback for when no
transcript is readable.
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

# 2026-08-18, THIRD fix, the mirror of the second one below. `git status --porcelain` lists only
# UNCOMMITTED files, so committing your work turned the gate off: measured, an identical German
# mockup BLOCKED while dirty and PASSED once committed. The second fix had traded an over-answering
# proxy (mtime, true for every file in a fresh worktree) for an under-answering one. The record that
# actually knows what this turn did is the TRANSCRIPT: every Write/Edit names its file_path, and a
# shell command that wrote a file carries that path in its command text, which is the script-write
# hole this whole gate exists to close. git status stays, as the fallback when no transcript reads.
WRITE_TOOLS = {"write", "edit", "multiedit", "notebookedit"}
# A shell command counts only when it actually WRITES: a redirect (`2>/dev/null` does not count),
# tee/cp/mv/sed -i, or a script-side write call. A `cat` or `grep` of an old mockup must not count.
SHELL_WRITE = re.compile(r"(?<![0-9&])>|\btee\b|\bcp\b|\bmv\b|\bsed\s+-i|write_text|writeFile", re.I)


def turn_writes(transcript_path):
    """Files this session's tool calls WROTE, read from the transcript.

    Returns (abs_paths, shell_commands), or None when no transcript is readable, which is the only
    case that falls back to git. The two-substring prefilter keeps it cheap: measured on the largest
    transcript on this machine, 171.8MB over 33,715 lines, a full line scan costs 0.11s.
    """
    if not transcript_path:
        return None
    transcript_path = os.path.expanduser(transcript_path)
    if not os.path.exists(transcript_path):
        return None
    paths, cmds, written = set(), [], {}
    try:
        with open(transcript_path, encoding="utf-8", errors="ignore") as fh:
            for ln in fh:
                # only lines that are a tool call AND name a path this gate could ever scan
                if '"tool_use"' not in ln or ("_mockups" not in ln and "/dev/" not in ln):
                    continue
                try:
                    row = json.loads(ln)
                except Exception:
                    continue
                content = (row.get("message") or {}).get("content")
                if not isinstance(content, list):
                    continue
                for blk in content:
                    if not isinstance(blk, dict) or blk.get("type") != "tool_use":
                        continue
                    inp = blk.get("input")
                    if not isinstance(inp, dict):
                        continue
                    name = str(blk.get("name") or "").lower()
                    if name in WRITE_TOOLS:
                        for key in ("file_path", "notebook_path"):
                            v = inp.get(key)
                            if isinstance(v, str) and v:
                                ap = os.path.normpath(os.path.abspath(v))
                                paths.add(ap)
                                paths.add(os.path.realpath(ap))
                                # 2026-08-18 (fourth fix): keep the TEXT that was written, per
                                # path. introduced_here() needs it to tell German I put there
                                # from German that was already in the file.
                                blob = []
                                for k in ("content", "new_string"):
                                    if isinstance(inp.get(k), str):
                                        blob.append(inp[k])
                                for e in (inp.get("edits") or []):
                                    if isinstance(e, dict) and isinstance(e.get("new_string"), str):
                                        blob.append(e["new_string"])
                                if blob:
                                    written.setdefault(ap, []).append("\n".join(blob))
                    elif name == "bash":
                        c = inp.get("command")
                        if isinstance(c, str) and SHELL_WRITE.search(c):
                            cmds.append(c)
    except Exception:
        return None
    return paths, cmds, written


def was_written(fp, proj, touched):
    """Did this session write THIS file? Exact path for a tool write, path text for a shell write."""
    paths, cmds = touched[0], touched[1]
    if not paths and not cmds:
        return False
    ap = os.path.normpath(os.path.abspath(fp))
    if ap in paths or os.path.realpath(ap) in paths:
        return True
    rel = os.path.relpath(ap, proj)
    for c in cmds:
        if ap in c or rel in c:
            return True
    return False


# 2026-08-18, FOURTH fix, and the last three all had the same root: "did this turn write it" is not
# the question. THIS is: did this turn INTRODUCE the German? Measured today, the gate named
# public/_mockups/account-messages.html. That file's committed version already carries 8 of the
# words, from a commit in June, and the working copy is byte-identical to it. What I did was append
# a German test line and revert it, so the transcript truthfully says I wrote the file, and the gate
# then charged me for German that was there before I was. Reverted work counting as done work is
# the same class of wrong as the mtime and the uncommitted proxies it already replaced.
# So: only count German the working copy has and the committed version does not.
def introduced_here(fp, hits, written_text):
    """True when a flagged word is BOTH in the file now AND in what this turn actually wrote.

    First attempt diffed against HEAD, and that reintroduced the exact bug the previous fix had
    just removed: commit your German and HEAD contains it, so it reads as not-introduced-here. Its
    own suite caught that, two cases of seven.

    The transcript already holds the answer without any proxy. Every Write and Edit carries the
    text it wrote, so:
      german in the file now, and NOT in anything I wrote  -> pre-existing, not mine
      german I wrote that is no longer in the file          -> reverted, not a problem
      german in both                                        -> mine, block
    Immune to commits and to reverts alike, because it never asks git anything.
    Fail-closed: no written text captured means fall back to flagging, since a missed German
    mockup is the failure this gate exists to prevent.
    """
    if not written_text:
        return True
    wrote = {w.lower() for w in GERMAN.findall(visible_text(written_text))
             if not ALLOWED.fullmatch(w)}
    if not wrote:
        return False
    return any(h.lower() in wrote for h in hits)


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        payload = {}
    proj = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
    flag = os.path.join(proj, ".claude", "mockup-lang-skip.flag")
    try:
        if os.path.exists(flag) and (time.time() - os.path.getmtime(flag)) < 600:
            if open(flag).read().strip():
                sys.exit(0)
    except Exception:
        pass

    now = time.time()
    # 2026-08-18, stress-test pass. The three dev patterns began with a bare `**`, so with
    # recursive=True each one walked the WHOLE repo hunting for any directory called dev, and this
    # repo carries node_modules, node_modules.nosync, node_modules_old and .next, all of which
    # contain one. Measured: `**/dev/**/*.tsx` takes 3.62s and returns 175 files;
    # `app/**/dev/**/*.tsx` takes 0.07s and returns THE SAME 175 files, because every real dev
    # directory here is under app/ (app/[locale]/dev and app/api/dev, verified by find). This hook
    # runs at the end of every single reply, so that walk was roughly 4 of the 11 seconds he waits
    # after each one. Same coverage, anchored.
    patterns = [
        os.path.join(proj, "public", "_mockups", "**", "*.htm*"),
        os.path.join(proj, "app", "**", "dev", "**", "*.tsx"),
        os.path.join(proj, "app", "**", "dev", "**", "*.jsx"),
        os.path.join(proj, "app", "**", "dev", "**", "*.htm*"),
    ]
    # 2026-08-18, second stress-test fix, and this one was firing on the owner's screen. "Did I
    # touch this file?" was answered by mtime. Git writes EVERY file in a worktree at checkout, so
    # in a worktree every file in the repo has an mtime of minutes ago and the answer is yes for all
    # of them. Measured today: this gate named six mockups from June, July and 15 August as "a
    # mockup you touched this session"; `git status --porcelain` on all six is empty and `git log`
    # shows this session touched none of them. So it accused work nobody had done, which is the
    # fastest way to get a gate skip-flagged into uselessness.
    # Ask git what actually changed. mtime stays as the fallback for a non-git tree only.
    touched = turn_writes(payload.get("transcript_path"))
    changed = None
    if touched is None:
        try:
            import subprocess
            r = subprocess.run(["git", "-C", proj, "status", "--porcelain", "--untracked-files=all"],
                               capture_output=True, text=True, timeout=8)
            if r.returncode == 0:
                changed = set()
                for ln in r.stdout.splitlines():
                    rel = ln[3:].strip().strip('"')
                    if rel:
                        changed.add(os.path.normpath(os.path.join(proj, rel)))
        except Exception:
            changed = None

    offenders = []
    for pat in patterns:
        for fp in glob.glob(pat, recursive=True):
            try:
                if touched is not None:
                    if not was_written(fp, proj, touched):
                        continue
                elif changed is not None:
                    if os.path.normpath(fp) not in changed:
                        continue
                elif now - os.path.getmtime(fp) > 180 * 60:
                    continue
                txt = open(fp, encoding="utf-8", errors="ignore").read()
            except Exception:
                continue
            # ALLOWED must be applied HERE or the exemption is decorative. Defining the list
            # without filtering with it is how a gate keeps crying wolf while looking fixed.
            hits = sorted({m.group(0).lower() for m in GERMAN.finditer(visible_text(txt))
                           if not ALLOWED.fullmatch(m.group(0))})
            # A SHELL write leaves no per-path content, only the command text, and that text IS
            # what got written (`printf '<h1>Jetzt buchen</h1>' >> mockup.html`). Without this the
            # fail-closed default flagged every shell-touched file for its PRE-EXISTING German:
            # measured minutes after the fix landed, on a file whose 8 German words come from a
            # June commit and whose working copy is byte-identical to it.
            _ap = os.path.normpath(os.path.abspath(fp))
            _rel = os.path.relpath(_ap, proj)
            _parts = list((touched[2] if touched and len(touched) > 2 else {}).get(_ap, []))
            _parts += [c for c in (touched[1] if touched else []) if _ap in c or _rel in c]
            _wrote_here = "\n".join(_parts)
            if len(hits) >= 3 and introduced_here(fp, hits, _wrote_here):
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

def _selftest():
    """The bad case BLOCKS and the innocent case PASSES, on real git fixtures. Cases only grow."""
    import subprocess, tempfile
    here = os.path.abspath(__file__)
    GER = ("<html><body><h1>Termine buchen</h1><p>Jetzt und nicht teuer</p>"
           "<p>Keine Buchung</p></body></html>")
    ENG = ("<html><body><h1>Appointments</h1><p>Book now, no fee</p>"
           "<p>Nothing needed</p></body></html>")

    def build(html, commit, how, flag, transcript):
        root = tempfile.mkdtemp(prefix="mlsg-")
        os.makedirs(os.path.join(root, "public", "_mockups"))
        os.makedirs(os.path.join(root, ".claude"))
        fp = os.path.join(root, "public", "_mockups", "demo.html")
        open(fp, "w", encoding="utf-8").write(html)
        env = dict(os.environ)
        env.update(GIT_AUTHOR_NAME="t", GIT_COMMITTER_NAME="t",
                   GIT_AUTHOR_EMAIL="t@t", GIT_COMMITTER_EMAIL="t@t")
        subprocess.run(["git", "init", "-q"], cwd=root, env=env, capture_output=True)
        if commit:
            subprocess.run(["git", "add", "-A"], cwd=root, env=env, capture_output=True)
            subprocess.run(["git", "commit", "-qm", "x"], cwd=root, env=env, capture_output=True)
        rows = [{"type": "user", "message": {"role": "user", "content": "build the mockup"}}]
        if how == "write":
            rows.append({"type": "assistant", "message": {"role": "assistant", "content": [
                {"type": "tool_use", "id": "a", "name": "Write",
                 "input": {"file_path": fp, "content": html}}]}})
        elif how == "bash":
            rows.append({"type": "assistant", "message": {"role": "assistant", "content": [
                {"type": "tool_use", "id": "a", "name": "Bash",
                 "input": {"command": "cat > public/_mockups/demo.html <<'EOF'\n" + html + "\nEOF"}}]}})
        elif how == "read":
            rows.append({"type": "assistant", "message": {"role": "assistant", "content": [
                {"type": "tool_use", "id": "a", "name": "Read", "input": {"file_path": fp}}]}})
        tp = os.path.join(root, "t.jsonl")
        with open(tp, "w") as f:
            for r in rows:
                f.write(json.dumps(r) + "\n")
        payload = {"session_id": "st", "hook_event_name": "Stop", "cwd": root,
                   "stop_hook_active": False}
        if transcript:
            payload["transcript_path"] = tp
        if flag:
            open(os.path.join(root, ".claude", "mockup-lang-skip.flag"), "w").write("selftest")
        return root, payload, env

    cases = [
        ("german written this turn, UNCOMMITTED",              GER, False, "write", False, True,  2),
        ("german written this turn, COMMITTED (2026-08-18)",   GER, True,  "write", False, True,  2),
        ("german written by a shell script, COMMITTED",        GER, True,  "bash",  False, True,  2),
        ("german committed, only READ this turn",              GER, True,  "read",  False, True,  0),
        ("german UNCOMMITTED, no transcript (git fallback)",   GER, False, "read",  False, False, 2),
        ("english written this turn",                          ENG, False, "write", False, True,  0),
        ("german written this turn, skip flag set",            GER, False, "write", True,  True,  0),
    ]
    bad = 0
    for name, html, commit, how, flag, tr, want in cases:
        root, payload, env = build(html, commit, how, flag, tr)
        e = dict(env)
        e["CLAUDE_PROJECT_DIR"] = root
        p = subprocess.run([sys.executable, here], input=json.dumps(payload),
                           capture_output=True, text=True, env=e, cwd=root, timeout=60)
        ok = p.returncode == want
        if not ok:
            bad += 1
        print(("  ok    " if ok else "  FAIL  ") + name +
              "   (want exit " + str(want) + ", got " + str(p.returncode) + ")")
    total = len(cases)
    print(("SELFTEST PASS " if not bad else "SELFTEST FAIL ") + str(total - bad) + "/" + str(total))
    return 1 if bad else 0


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        sys.exit(_selftest())
    try:
        main()
    except Exception:
        sys.exit(0)
