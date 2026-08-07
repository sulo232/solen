#!/usr/bin/env python3
"""visual-deliverable-gate.py : owner deliverables must be VISUAL + linked, not markdown files.

Born 2026-07-15 (owner, recurring): "i read the file but i dont understand its not in plain
english and i told u i need visuals this is a reccuring pattern" and, when the fix was a memory
file instead of a gate: "you didn't even make a hook... you're gonna forget after the context
expires." This is the hook.

Fires (Stop, exit 2) when THIS TURN wrote owner-facing design knowledge (files under
_design-system/ matching research/*.md, RATIONALE*, TASTE_LOG*, PSYCHOLOGY*, or any _plans/
audit/report file over 2KB) AND the final assistant message contains NO viewable link
(trycloudflare.com, /_mockups/, /dev/ route, localhost preview) AND no explicit escape
declaration ("large build, nothing viewable yet" or "not visualizable because").

Fail-open on any internal error. Escape: echo "<reason>" > .claude/visual-deliverable-skip.flag
(30-min TTL, non-blank reason required).
"""
import json
import os
import re
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _session_files import files_written_this_session  # noqa: E402

LOOKBACK_S = 3600  # only files written this turn-ish window matter; refined by transcript ts when available
KNOWLEDGE_PAT = re.compile(r"_design-system/(research/.*\.md|RATIONALE|TASTE_LOG|PSYCHOLOGY|CONSISTENCY|.*AUDIT)", re.I)
LINK_PAT = re.compile(r"(trycloudflare\.com|/_mockups/|localhost:\d+|/dev/[a-z-]+|\.png\)|\.png\])", re.I)
ESCAPE_PAT = re.compile(r"(large build.{0,40}nothing viewable|nothing viewable yet|not visuali[sz]able because|no visual form)", re.I)

def project_dir():
    return os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()

def flag_ok(pdir):
    f = os.path.join(pdir, ".claude", "visual-deliverable-skip.flag")
    try:
        if not os.path.isfile(f):
            return False
        age = time.time() - os.stat(f).st_mtime
        reason = open(f, encoding="utf-8").readline().strip()
        return age < 1800 and bool(reason)
    except OSError:
        return False

def last_assistant_text(transcript_path):
    text = ""
    try:
        with open(transcript_path, encoding="utf-8") as fh:
            for line in fh:
                try:
                    j = json.loads(line)
                except Exception:
                    continue
                m = j.get("message") or {}
                if m.get("role") == "assistant":
                    for c in m.get("content", []):
                        if isinstance(c, dict) and c.get("type") == "text" and c.get("text", "").strip():
                            text = c["text"]
    except OSError:
        return None
    return text

def knowledge_written_recently(pdir, since_epoch=None):
    """Knowledge files THIS SESSION actually wrote, proven by git rather than by mtime.

    Corrected 2026-08-07 after a measured false positive: this used filesystem mtime inside a
    3600s window, which in a worktree measures when the checkout stamped the file, not who wrote
    it. `_design-system/RATIONALE.md`, `TASTE_LOG.md`, `research/PRINCIPLES_50.md` and
    `research/TASTE_RANGE.md` all read mtime 11:23:57 while `git status` reported every one CLEAN,
    so the gate blocked a turn over four files nobody had touched, and would have kept doing it
    on every turn for an hour of every worktree session. A gate that cannot prove its trigger
    must not fire, so the trigger now comes from git and fails open to empty.
    """
    touched = files_written_this_session(pdir, since_epoch)
    hits = []
    for rel in sorted(touched):
        if not KNOWLEDGE_PAT.search(rel):
            continue
        try:
            if os.stat(os.path.join(pdir, rel)).st_size <= 2048:
                continue
        except OSError:
            continue
        hits.append(rel)
    return hits

def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        return 0
    pdir = project_dir()
    if flag_ok(pdir):
        return 0
    final = last_assistant_text(data.get("transcript_path", "")) if data.get("transcript_path") else None
    if final is None:
        final = data.get("last_assistant_message") or ""
    if not final:
        return 0  # fail-open: cannot see the message, do not brick
    if LINK_PAT.search(final) or ESCAPE_PAT.search(final):
        return 0
    hits = knowledge_written_recently(pdir)
    if not hits:
        return 0
    print(
        "VISUAL-DELIVERABLE GATE (owner 2026-07-15, recurring): this turn wrote owner-facing design "
        "knowledge (" + ", ".join(hits[:4]) + (" ..." if len(hits) > 4 else "") + ") but the closing "
        "message contains NO viewable link. The owner is a visual non-coder: a markdown file is a "
        "SYSTEM artifact, not a deliverable. Build the visual companion (served page, Wrong/Right "
        "pairs, plain English, tunnel link) THIS turn, or state plainly 'large build, nothing viewable "
        "yet' with the reason. Escape: echo \"<reason>\" > .claude/visual-deliverable-skip.flag (30-min).",
        file=sys.stderr,
    )
    return 2

def selftest():
    """Five cases. The fifth is the false positive this gate shipped with for three weeks.

    Cases 1-3 run in a throwaway git repo with a REAL dirty knowledge file, so the trigger is
    genuine. Case 4 proves a clean-but-restamped tree does not fire. Case 5 runs against the live
    project, where every knowledge file is committed and clean: it must stay silent.
    """
    import subprocess
    import tempfile

    def transcript(text):
        tf = tempfile.NamedTemporaryFile("w", suffix=".jsonl", delete=False)
        tf.write(json.dumps({"message": {"role": "assistant", "content": [{"type": "text", "text": text}]}}) + "\n")
        tf.close()
        return tf.name

    def run(text, pdir):
        payload = json.dumps({"transcript_path": transcript(text)})
        r = subprocess.run([sys.executable, __file__], input=payload, capture_output=True, text=True,
                           env={**os.environ, "CLAUDE_PROJECT_DIR": pdir})
        return r.returncode

    results = []
    with tempfile.TemporaryDirectory() as d:
        subprocess.run(["git", "-C", d, "init", "-q"], capture_output=True)
        subprocess.run(["git", "-C", d, "config", "user.email", "t@t.t"], capture_output=True)
        subprocess.run(["git", "-C", d, "config", "user.name", "t"], capture_output=True)
        os.makedirs(os.path.join(d, "_design-system", "research"), exist_ok=True)
        knowledge = os.path.join(d, "_design-system", "research", "TASTE_GROUPING.md")
        with open(knowledge, "w") as fh:
            fh.write("x" * 4096)
        subprocess.run(["git", "-C", d, "add", "-A"], capture_output=True)
        subprocess.run(["git", "-C", d, "commit", "-q", "-m", "base"], capture_output=True)

        # 4. committed and merely restamped: must NOT fire
        os.utime(knowledge, None)
        results.append(("restamped-clean close", run("Wrote the rules down.", d), 0))

        # now genuinely dirty it, so 1-3 have a real trigger
        with open(knowledge, "a") as fh:
            fh.write("\nreal edit\n")
        results.append(("no-link close", run("See _design-system/research/TASTE_GROUPING.md.", d), 2))
        results.append(("link close", run("Here: https://x.trycloudflare.com/_mockups/taste-book/index.html", d), 0))
        results.append(("escape close", run("Large build, nothing viewable yet, the round is the build session.", d), 0))

    # 5. the live project, where knowledge files are committed and clean
    results.append(("live-clean project close", run("Wrote the rules down.", project_dir()), 0))

    good = True
    for name, got, want in results:
        hit = got == want
        good = good and hit
        verdict = "ok" if hit else ("MISS" if want == 2 else "FALSE-POSITIVE")
        print(f"{name}: exit {got} (want {want}) {verdict}")
    print("SELFTEST", "OK" if good else "FAILED")
    return 0 if good else 1

if __name__ == "__main__":
    sys.exit(selftest() if "--selftest" in sys.argv else main())
