#!/usr/bin/env python3
"""real-component-gate.py : Stop hook — a UI change must be the REAL component, not a throwaway HTML mockup.

WHY (owner 2026-07-23, repeated fury): "it's not gonna be a real component. i need a 1:1 real comp,
what's gonna be actually built, not a mockup thats a hand job by a kindergarten. harden the gate, you
keep doing this." A standalone public/_mockups/*.html approximation of a component is the banned
hand-rolled redraw; the deliverable must be the REAL .tsx component modified, shown on the real route.

Fires (Stop, exit 2) when THIS turn modified a mockup HTML (public/_mockups/**/*.html) but modified
NO real component (app|components|components-legacy/**/*.tsx) AND the reply does not read as a
mockup-first preview (asking for approval before building the real thing) -- i.e. an HTML
approximation was thrown over the wall AS THE DELIVERABLE instead of changing the real component.

Exempt: index.html gallery. Escape: echo "<why>" > .claude/real-component-skip.flag (15-min TTL).
Fail-open. Exit 2 = block.

2026-08-18 stress-test finding: scope was a 15-MINUTE FILE MTIME window, not the turn the docstring
always claimed ("THIS turn"). Two failures fell out of that: (1) a later, unrelated QUESTION turn
that wrote nothing still saw the previous turn's mockup file inside its 15-min window and blocked
on it; (2) the gate had no way to tell a COMPLIANT mockup-first preview turn (mockup shown, real
code deliberately not touched yet, pending the owner's approval, exactly what the law asks for) from
the banned "HTML instead of the real thing" case, because it only ever looked at file mtimes, never
at what the turn actually said. FIX: scope is now the files THIS TURN actually wrote (read from the
transcript), which alone kills failure (1); and a reply that reads as a mockup-first preview
(mentions mockup/preview/approval/a tunnel link) is exempt, which addresses failure (2) without
weakening the case the gate exists for: a reply that claims the UI is built/shipped/done while only
a throwaway HTML file exists still blocks.
"""
import os, re, sys, time, glob, json
PDIR = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
W = 900

MOCKUP_FRAMING = re.compile(
    r"mockup|preview|approve|approval|trycloudflare\.com|"
    r"which (design|direction|version|option) do you (prefer|like)|"
    r"before (applying|building)|for your review|let me know (which|what)",
    re.I,
)


def turn_written_files(data):
    """Absolute paths Write/Edit/MultiEdit'd THIS TURN (since the last real user message), read
    from the transcript. None only when no transcript is available (fail-open to the old mtime
    heuristic); an empty set correctly means "this turn wrote nothing"."""
    tp = data.get("transcript_path")
    if not tp or not os.path.exists(tp):
        return None, ""
    entries = []
    try:
        with open(tp, encoding="utf-8", errors="ignore") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    entries.append(json.loads(line))
                except Exception:
                    continue
    except Exception:
        return None, ""
    if not entries:
        return None, ""
    last_user = 0
    for i, e in enumerate(entries):
        if e.get("type") == "user":
            c = (e.get("message") or {}).get("content")
            if isinstance(c, str) or (isinstance(c, list) and
                                      any(isinstance(b, dict) and b.get("type") == "text" for b in c)):
                last_user = i
    touched = set()
    reply_text = ""
    for e in entries[last_user:]:
        if e.get("type") != "assistant":
            continue
        c = (e.get("message") or {}).get("content")
        if not isinstance(c, list):
            continue
        for b in c:
            if not isinstance(b, dict):
                continue
            if b.get("type") == "tool_use" and b.get("name") in ("Write", "Edit", "MultiEdit"):
                fp = (b.get("input") or {}).get("file_path")
                if fp:
                    touched.add(os.path.abspath(fp))
            elif b.get("type") == "text" and (b.get("text") or "").strip():
                reply_text += b["text"]
    return touched, reply_text


# 2026-08-09 (plan box K0e). mtime alone is not authorship: creating or syncing a git worktree
# restamps every file, so this gate would have fired on files nobody touched for the first 15
# minutes of every worktree session. The window still applies; git now has to agree the file was
# actually written. Fails open to "nothing written", so a gate that cannot prove its trigger stays
# silent rather than blocking on a guess.
def _written():
    try:
        sys.path.insert(0, os.path.join(PDIR, "scripts", "hooks"))
        from _session_files import files_written_this_session
        return files_written_this_session(PDIR)
    except Exception:
        return None  # helper unavailable -> do not filter, old behaviour

def recent(pats, turn_files):
    out=[]
    written=None if turn_files is not None else _written()
    for p in pats:
        try:
            for f in glob.glob(os.path.join(PDIR,p),recursive=True):
                try:
                    if turn_files is not None:
                        # 2026-08-18: key off what THIS TURN wrote, not a 15-min wall-clock window.
                        if os.path.abspath(f) not in turn_files: continue
                    else:
                        if time.time()-os.stat(f).st_mtime >= W: continue
                        if written is not None and os.path.relpath(f,PDIR) not in written: continue
                    out.append(f)
                except OSError: pass
        except OSError: pass
    return out
def flag_ok():
    f=os.path.join(PDIR,".claude","real-component-skip.flag")
    try: return os.path.isfile(f) and time.time()-os.stat(f).st_mtime<W and bool(open(f,encoding="utf-8").readline().strip())
    except OSError: return False
def main():
    try: data = json.load(sys.stdin)
    except Exception: data = {}
    # One refusal per turn (2026-08-23). `stop_hook_active` is true on every re-run
    # after this check already blocked, so returning success here is what stops the
    # same objection being raised against message after message. The product force-
    # ends the turn after 8 consecutive blocks anyway, so a run past one is wasted.
    if data.get("stop_hook_active"):
        sys.exit(0)
    if flag_ok(): sys.exit(0)
    turn_files, reply_text = turn_written_files(data)
    if turn_files is not None and MOCKUP_FRAMING.search(reply_text):
        # 2026-08-18: a mockup-first preview turn (owner approval pending) is COMPLIANT, not a
        # violation -- that is the law this gate was accidentally punishing.
        sys.exit(0)
    mk=[m for m in recent(["public/_mockups/**/*.html"], turn_files) if os.path.basename(m).lower()!="index.html"]
    tsx=recent(["app/**/*.tsx","components/**/*.tsx","components-legacy/**/*.tsx"], turn_files)
    if mk and not tsx:
        rels=", ".join(os.path.relpath(m,PDIR) for m in mk[:6])
        sys.stderr.write("REAL-COMPONENT GATE: this turn produced standalone HTML mockup(s) ("+rels+") but "
            "changed NO real component (.tsx). The owner needs the REAL component modified 1:1 with what ships, "
            "shown on the real route -- not a hand-rolled HTML approximation. Apply the change to the real .tsx "
            "(use node if Bash writes are sandboxed). Escape: echo '<why>' > .claude/real-component-skip.flag\n")
        sys.exit(2)
    sys.exit(0)


def selftest():
    import tempfile, shutil, subprocess
    ok = True
    total = 0
    passed = 0

    def check(name, cond):
        nonlocal ok, total, passed
        total += 1
        passed += 1 if cond else 0
        ok = ok and cond
        print(f"{'PASS' if cond else 'FAIL'}  {name}")

    tmp = tempfile.mkdtemp(prefix="realcompgate-selftest-")
    try:
        os.makedirs(os.path.join(tmp, "public", "_mockups"), exist_ok=True)
        mockup = os.path.join(tmp, "public", "_mockups", "card-v2.html")
        with open(mockup, "w") as f:
            f.write("<html><body>mock</body></html>")

        def transcript_for(written_paths, reply):
            fd, tp = tempfile.mkstemp(suffix=".jsonl", prefix="real-component-selftest-")
            rows = [{"type": "user", "message": {"role": "user",
                     "content": [{"type": "text", "text": "make the card look like this reference"}]}}]
            content = []
            for p in written_paths:
                content.append({"type": "tool_use", "name": "Write",
                                "input": {"file_path": p, "content": "x"}})
            content.append({"type": "text", "text": reply})
            rows.append({"type": "assistant", "message": {"role": "assistant", "content": content}})
            with os.fdopen(fd, "w") as f:
                for r in rows:
                    f.write(json.dumps(r) + "\n")
            return tp

        def run(tp):
            return subprocess.run(
                [sys.executable, os.path.abspath(__file__)],
                input=json.dumps({"transcript_path": tp}),
                env={**os.environ, "CLAUDE_PROJECT_DIR": tmp},
                capture_output=True, text=True, timeout=15)

        # 1. compliant mockup-first preview turn: mockup written, no tsx, reply asks for approval.
        r1 = run(transcript_for([mockup],
                 "Here is a mockup of the card treatment: https://xyz.trycloudflare.com/de. "
                 "Which direction do you prefer before I apply it to the real component?"))
        check("a compliant mockup-first PREVIEW turn passes", r1.returncode != 2)

        # 2. the banned case: mockup written, no tsx, reply claims it's the finished UI change.
        r2 = run(transcript_for([mockup],
                 "Updated the card to match the reference, done."))
        check("a mockup thrown over the wall AS THE DELIVERABLE still blocks", r2.returncode == 2)

        # 3. a later, unrelated QUESTION turn that writes nothing must pass even though the
        #    mockup file still sits there, fresh, from an earlier turn.
        r3 = run(transcript_for([], "Port 3000."))
        check("a later unrelated question turn (wrote nothing) passes", r3.returncode != 2)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

    print(f"\n{passed}/{total} passed")
    print("SELFTEST", "OK" if ok else "FAILED")
    return 0 if ok else 1


if __name__=="__main__":
    if "--selftest" in sys.argv:
        sys.exit(selftest())
    try: main()
    except Exception: sys.exit(0)
