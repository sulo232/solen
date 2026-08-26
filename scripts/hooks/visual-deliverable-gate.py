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

# v3, 2026-08-10 , the PROMISED-VISUAL arm.
# The v2 gate only fired when this turn happened to WRITE a design-knowledge file. That left the
# commoner failure wide open: the closing message OFFERS to build a mockup / page / direction and
# ships no link, so the owner gets a question instead of something to look at. Measured this
# session: "Want me to start there, or rebuild all 40 in v2 as originally written?" , a promised
# visual, zero files written, gate silent.
# It also closes the permission-asking hole the finish-autonomously gate keeps catching from the
# other side: an offer to build a visual is not a deliverable, and the fix for both is the same ,
# build the thing and paste the link.
PROMISE_PAT = re.compile(
    r"("
    r"(want|would you like|should) (me |i )?(to )?\w{0,12} ?(build|mock|draw|make|do|start)"
    r"|(i('| w)?(ll|d| will| can| could| should)|let me|next up,? i)\s+\w{0,18}\s*"
    r"(build|mock|draw|render|put together|show you)"
    r"|(build|mock|draw)(ing)? (out )?(the|a|3|three|two|both|all) [\w\s-]{0,30}"
    r"(mockup|mock-up|direction|variant|version|page|screen|preview)"
    r")",
    re.I,
)
VISUAL_NOUN_PAT = re.compile(r"(mock ?-?up|mock the|direction[s]?\b|variant|preview|screen|page|visual)", re.I)

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
        # One refusal per turn (2026-08-23). `stop_hook_active` is true on every re-run
        # after this check already blocked, so returning success here is what stops the
        # same objection being raised against message after message. The product force-
        # ends the turn after 8 consecutive blocks anyway, so a run past one is wasted.
        if data.get("stop_hook_active"):
            sys.exit(0)
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
    # v2, 2026-08-05, fix-up-me sweep. Both arms were pure text, and the escape had no backstop at
    # all: typing "nothing viewable yet" shipped the markdown-only deliverable this gate exists to
    # prevent. Proven by execution. The escape is now BUDGETED rather than removed , it is
    # sometimes genuinely true, and banning it would push toward a fake link instead, which is
    # worse. Free while rare (3 per rolling week), stops counting once it is a habit.
    if LINK_PAT.search(final):
        return 0
    if ESCAPE_PAT.search(final):
        # Overridable so the self-test cannot be decided by how many real escapes happened this
        # week. Found the hard way on 2026-08-10: the escape case passed, then failed on a re-run
        # with no code change, purely because the live ledger had filled up in between. A check
        # whose result depends on unrelated history cannot tell you whether it works.
        ledger = os.environ.get("VISUAL_ESCAPE_LEDGER") or os.path.expanduser("~/.claude/state/visual-escape-ledger.json")
        now = time.time()
        try:
            used = [t for t in json.load(open(ledger)) if now - t <= 7 * 86400]
        except Exception:
            used = []
        if len(used) < 3:
            try:
                os.makedirs(os.path.dirname(ledger), exist_ok=True)
                json.dump(used + [now], open(ledger, "w"))
            except Exception:
                pass
            return 0
        # over budget: it has become the exit, not the exception , fall through and block

    # v3 arm: a PROMISED visual with no link is its own failure, independent of file writes.
    if PROMISE_PAT.search(final) and VISUAL_NOUN_PAT.search(final):
        print(
            "PROMISED-VISUAL (visual-deliverable-gate v3, 2026-08-10): your closing message offers to "
            "build a mockup / direction / page and contains NO link to look at. To him that is a "
            "question, not a deliverable, and he has to spend a turn saying yes before anything "
            "exists. BUILD IT THIS TURN and paste the link. If it genuinely cannot be built yet, say "
            "which specific thing you are missing (a pick between two options he has already been "
            "shown, a credential, a destructive op) , not 'want me to'. "
            "Escape: echo \"<reason>\" > .claude/visual-deliverable-skip.flag (30-min).",
            file=sys.stderr,
        )
        return 2

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

    # Each run gets its own empty escape ledger, so the escape case tests the CODE and not how many
    # escapes the real week happened to contain.
    _ledger_dir = tempfile.mkdtemp(prefix="visual-escape-selftest-")

    def run(text, pdir):
        payload = json.dumps({"transcript_path": transcript(text)})
        ledger = os.path.join(_ledger_dir, "ledger-%d.json" % len(os.listdir(_ledger_dir)))
        r = subprocess.run([sys.executable, __file__], input=payload, capture_output=True, text=True,
                           env={**os.environ, "CLAUDE_PROJECT_DIR": pdir,
                                "VISUAL_ESCAPE_LEDGER": ledger})
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

    # v3 PROMISED-VISUAL arm, added 2026-08-10. It fires on the MESSAGE alone, so it needs no dirty
    # knowledge file, and the live project is the honest place to run it.
    live = project_dir()
    results.append(("promised-visual, no link",
                    run("My recommendation: build the reviews A/B/C directions mockup first. "
                        "Want me to start there, or rebuild all 40 in v2 as originally written?", live), 2))
    results.append(("promised-visual, with link",
                    run("Built all three reviews directions: "
                        "https://x.trycloudflare.com/_mockups/reviews-abc/index.html", live), 0))
    # An innocent sentence cannot be tested end to end whenever the other arm is truthy, so the
    # pattern is asserted directly instead.
    innocent = [
        "The register decision is recorded and the two stale pointers are fixed.",
        "Main took two commits this week, both of them checkpoints.",
        "I would build on the existing table rather than adding a second one.",
        "The account hub page renders no bell now.",
    ]
    over = [x for x in innocent if PROMISE_PAT.search(x) and VISUAL_NOUN_PAT.search(x)]
    print("innocent sentences quiet: " + ("ok" if not over else "FALSE-POSITIVE on " + repr(over)))

    good = not over
    for name, got, want in results:
        hit = got == want
        good = good and hit
        verdict = "ok" if hit else ("MISS" if want == 2 else "FALSE-POSITIVE")
        print(f"{name}: exit {got} (want {want}) {verdict}")
    print("SELFTEST", "OK" if good else "FAILED")
    return 0 if good else 1

if __name__ == "__main__":
    sys.exit(selftest() if "--selftest" in sys.argv else main())
