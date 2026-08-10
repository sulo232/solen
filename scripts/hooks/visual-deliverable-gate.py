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

def knowledge_written_recently(pdir):
    hits = []
    now = time.time()
    base = os.path.join(pdir, "_design-system")
    for root, _dirs, files in os.walk(base):
        for fn in files:
            p = os.path.join(root, fn)
            rel = os.path.relpath(p, pdir)
            if not KNOWLEDGE_PAT.search(rel):
                continue
            try:
                st = os.stat(p)
            except OSError:
                continue
            if now - st.st_mtime < LOOKBACK_S and st.st_size > 2048:
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
    # v2, 2026-08-05, fix-up-me sweep. Both arms were pure text, and the escape had no backstop at
    # all: typing "nothing viewable yet" shipped the markdown-only deliverable this gate exists to
    # prevent. Proven by execution. The escape is now BUDGETED rather than removed , it is
    # sometimes genuinely true, and banning it would push toward a fake link instead, which is
    # worse. Free while rare (3 per rolling week), stops counting once it is a habit.
    if LINK_PAT.search(final):
        return 0
    if ESCAPE_PAT.search(final):
        ledger = os.path.expanduser("~/.claude/state/visual-escape-ledger.json")
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
    import tempfile
    pdir = project_dir()
    tf = tempfile.NamedTemporaryFile("w", suffix=".jsonl", delete=False)
    def transcript(text):
        tf2 = tempfile.NamedTemporaryFile("w", suffix=".jsonl", delete=False)
        tf2.write(json.dumps({"message": {"role": "assistant", "content": [{"type": "text", "text": text}]}}) + "\n")
        tf2.close()
        return tf2.name
    import subprocess
    def run(text):
        payload = json.dumps({"transcript_path": transcript(text)})
        r = subprocess.run([sys.executable, __file__], input=payload, capture_output=True, text=True,
                           env={**os.environ, "CLAUDE_PROJECT_DIR": pdir})
        return r.returncode
    # research files were modified this session, so knowledge_written_recently is truthy right now
    block = run("Here are the researched rules, see _design-system/research/TASTE_GROUPING.md for details.")
    ok_link = run("Here it is: https://generation-barn-houses-greater.trycloudflare.com/_mockups/taste-book/index.html")
    ok_escape = run("This is a large build, nothing viewable yet, the round is the build session.")
    print(f"no-link close: {'BLOCK' if block == 2 else 'MISS'} | link close: {'PASS' if ok_link == 0 else 'FALSE-POSITIVE'} | escape close: {'PASS' if ok_escape == 0 else 'FALSE-POSITIVE'}")

    # v3 PROMISED-VISUAL arm. The blocking case is the real one measured on 2026-08-10.
    promise_block = run("My recommendation: build the reviews A/B/C directions mockup first. "
                        "Want me to start there, or rebuild all 40 in v2 as originally written?")
    promise_ok = run("Built all three reviews directions: "
                     "https://wood-sing-clicking-deaf.trycloudflare.com/_mockups/reviews-abc/index.html")
    # The knowledge arm is truthy for the whole of any session that touched a law file, so an
    # innocent sentence cannot be tested end-to-end , it would be blocked by the OTHER arm, which is
    # correct behaviour and proves nothing about this one. Assert the new pattern directly instead.
    innocent = [
        "The register decision is recorded and the two stale pointers are fixed.",
        "Main took two commits this week, both of them checkpoints.",
        "I would build on the existing table rather than adding a second one.",
        "The account hub page renders no bell now.",
        "Six of the eleven are the same screen, corrected six times.",
    ]
    over = [s for s in innocent if PROMISE_PAT.search(s) and VISUAL_NOUN_PAT.search(s)]
    print(f"promised-visual no link: {'BLOCK' if promise_block == 2 else 'MISS'} | "
          f"promised + link: {'PASS' if promise_ok == 0 else 'FALSE-POSITIVE'} | "
          f"innocent sentences quiet: {'PASS' if not over else 'FALSE-POSITIVE on ' + repr(over)}")

    good = (block == 2 and ok_link == 0 and ok_escape == 0
            and promise_block == 2 and promise_ok == 0 and not over)
    print("SELFTEST", "OK" if good else "FAILED")
    return 0 if good else 1

if __name__ == "__main__":
    sys.exit(selftest() if "--selftest" in sys.argv else main())
