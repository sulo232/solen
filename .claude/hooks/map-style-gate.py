#!/usr/bin/env python3
"""map-style-gate.py : Stop hook — ONE Solen map style, imported, never redefined.

WHY (owner 2026-07-23): "i want the style everywhere like the mapbox style in the searchmap view,
want that everywhere in map in solen, so put it in design system" + "gate". The app had THREE
divergent maps: search (Studio style solen32/cmpshru31000801s751e55735), homepage NearbyMap (a
hand-authored inline StyleSpecification: land #E8EAEA / park #CFF2D0 / water #CBE3FC / road #F8F8F8),
and the PDP (a stock mapbox/light-v11 static image). Measured: the Studio style renders BLANK (~4KB)
via the Static Images API at every zoom 12-16, so maps must be mapbox-gl, never static.

Fires (Stop, exit 2) when a recently-modified app/components/lib file (NOT the canonical map-style
module) contains its own map style: a `mapbox://styles/...` literal, a stock `styles/v1/mapbox/...`
static URL, or an inline `StyleSpecification` object. Import the canonical style instead.

Escape: echo "<why>" > .claude/map-style-skip.flag (15-min TTL, non-empty). Fail-open. Exit 2 = block.

2026-08-18 stress-test finding: two bugs. (1) VIOL matched INSIDE comments too, so a code comment
merely documenting the canonical style ("// uses mapbox://styles/solen32/... via env override")
was flagged as if it redefined one. (2) scope was keyed off a 15-MINUTE FILE MTIME, not the turn:
any file anyone touched in the last 15 minutes stayed in scope for every later, unrelated turn, so
plainly answering "which map style do we use" could block on a stray file from an earlier edit.
FIX: comments are stripped before matching, and the scope is now the files THIS TURN actually wrote
(read from the transcript), not a wall-clock window. Falls back to the old mtime+session heuristic
only when no transcript is available at all (never worse than before, only more precise).
"""
import os, re, sys, time, glob, json
PDIR = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
W = 900
VIOL = [
    (re.compile(r"mapbox://styles/"), "a hardcoded mapbox:// style URL"),
    (re.compile(r"styles/v1/mapbox/"), "a stock mapbox/* Static Images style"),
    (re.compile(r":\s*mapboxgl\.StyleSpecification\s*="), "an inline StyleSpecification object"),
]
EXEMPT = re.compile(r"(map-style|_design-system/|\.claude/|node_modules)", re.I)
# The leading slash is optional: by the time a path has had its project root removed it reads
# `.claude/worktrees/<name>/app/...` with no leading slash, and a pattern demanding one matches
# nothing. That exact omission cost plan-first-gate a third round of fixes today.
WORKTREE_PREFIX = re.compile(r"^(?:.*?/)?\.claude/worktrees/[^/]+/")


def strip_comments(s):
    """Drop block and line comments before matching, so documentation ABOUT the style is not
    mistaken for redefining it. `//` immediately after `:` (mapbox://, https://) is a protocol,
    never a comment start, so it is left alone."""
    s = re.sub(r"/\*.*?\*/", " ", s, flags=re.S)
    s = re.sub(r"(?<!:)//[^\n]*", " ", s)
    return s


def turn_written_files(data):
    """Absolute paths Write/Edit/MultiEdit'd THIS TURN (since the last real user message), read
    from the transcript. Returns None only when no transcript is available at all (fail-open to
    the old heuristic); returns a (possibly empty) set otherwise , an empty set correctly means
    "this turn wrote nothing", which is exactly the case that used to false-block."""
    tp = data.get("transcript_path")
    if not tp or not os.path.exists(tp):
        return None
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
        return None
    if not entries:
        return None
    last_user = 0
    for i, e in enumerate(entries):
        if e.get("type") == "user":
            c = (e.get("message") or {}).get("content")
            if isinstance(c, str) or (isinstance(c, list) and
                                      any(isinstance(b, dict) and b.get("type") == "text" for b in c)):
                last_user = i
    touched = set()
    for e in entries[last_user:]:
        if e.get("type") != "assistant":
            continue
        c = (e.get("message") or {}).get("content")
        if not isinstance(c, list):
            continue
        for b in c:
            if isinstance(b, dict) and b.get("type") == "tool_use" and b.get("name") in ("Write", "Edit", "MultiEdit"):
                fp = (b.get("input") or {}).get("file_path")
                if fp:
                    touched.add(os.path.abspath(fp))
    return touched


# 2026-08-09 (plan box K0e). mtime alone is not authorship: creating or syncing a git worktree
# restamps every file, so this gate would have fired on files nobody touched for the first
# window of every worktree session. Git now has to agree the file was actually written.
def _written():
    try:
        sys.path.insert(0, os.path.join(PDIR, "scripts", "hooks"))
        from _session_files import files_written_this_session
        return files_written_this_session(PDIR)
    except Exception:
        return None

def recent(data=None):
    out = []
    turn_files = turn_written_files(data or {})
    written = None if turn_files is not None else _written()
    for pat in ("app/**/*.ts", "app/**/*.tsx", "components/**/*.tsx", "components-legacy/**/*.tsx", "lib/**/*.ts"):
        try:
            for f in glob.glob(os.path.join(PDIR, pat), recursive=True):
                # 2026-08-18, third hook found with this same defect (plan-first-gate and
                # orchestration-gate were the first two). `\.claude/` in EXEMPT is meant to skip
                # hook and config files, but every git worktree here lives at
                # <root>/.claude/worktrees/<name>/, so the pattern matched EVERY product file in
                # the checkout the session actually runs in. Strip the worktree prefix first, then
                # judge the path on its own project-relative shape.
                if EXEMPT.search(WORKTREE_PREFIX.sub("/", f)): continue
                try:
                    if turn_files is not None:
                        # 2026-08-18: key off what THIS TURN wrote, not a 15-min wall-clock window.
                        if os.path.abspath(f) not in turn_files: continue
                    else:
                        # no transcript at all , fall back to the old heuristic, never worse.
                        if time.time() - os.stat(f).st_mtime >= W: continue
                        if written is not None and os.path.relpath(f, PDIR) not in written: continue
                    out.append(f)
                except OSError: pass
        except OSError: pass
    return out

def flag_ok():
    f = os.path.join(PDIR, ".claude", "map-style-skip.flag")
    try:
        return os.path.isfile(f) and time.time()-os.stat(f).st_mtime < W and bool(open(f, encoding="utf-8").readline().strip())
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
    hits = []
    for f in recent(data):
        try: s = strip_comments(open(f, encoding="utf-8").read())
        except OSError: continue
        for rx, why in VIOL:
            if rx.search(s):
                hits.append(os.path.relpath(f, PDIR) + " -> " + why)
                break
    if hits:
        sys.stderr.write("MAP-STYLE GATE: a map style is being defined outside the canonical module: "
            + "; ".join(hits[:6]) + ". Solen has ONE map style (mapbox://styles/solen32/"
            "cmpshru31000801s751e55735, env-overridable) — import it from the shared map-style module "
            "instead of hardcoding a URL, a stock mapbox/* style, or an inline StyleSpecification. "
            "Note: that style renders BLANK via the Static Images API, so use mapbox-gl, not a static "
            "<img>. Escape: echo '<why>' > .claude/map-style-skip.flag\n")
        sys.exit(2)
    sys.exit(0)


def selftest():
    import tempfile, shutil
    ok = True
    total = 0
    passed = 0

    def check(name, cond):
        nonlocal ok, total, passed
        total += 1
        passed += 1 if cond else 0
        ok = ok and cond
        print(f"{'PASS' if cond else 'FAIL'}  {name}")

    # 1. comment stripping
    check("a code comment documenting the style does not read as a violation",
          not VIOL[0][0].search(strip_comments(
              "// uses mapbox://styles/solen32/cmpshru31000801s751e55735 via env override\n"
              "const url = MAP_STYLE_URL;")))
    check("a real hardcoded style URL in actual code still matches",
          bool(VIOL[0][0].search(strip_comments('const style = "mapbox://styles/foo/bar123";'))))
    check("a block comment mentioning the static style URL is stripped too",
          not VIOL[1][0].search(strip_comments(
              "/* legacy note: used to hit styles/v1/mapbox/light-v11 here */\nconst x = 1;")))

    # 2. end to end: scope keyed off the TURN, not a 15-minute mtime window.
    tmp = tempfile.mkdtemp(prefix="mapstylegate-selftest-")  # NOT "map-style", EXEMPT matches that substring
    try:
        os.makedirs(os.path.join(tmp, "components"), exist_ok=True)
        offender = os.path.join(tmp, "components", "OldMap.tsx")
        with open(offender, "w") as f:
            f.write('const style = "mapbox://styles/rogue/xyz789";\n')

        def transcript_for(written_paths, reply="ok"):
            fd, tp = tempfile.mkstemp(suffix=".jsonl", prefix="map-style-selftest-")
            rows = [{"type": "user", "message": {"role": "user",
                     "content": [{"type": "text", "text": "which map style do we use"}]}}]
            content = [{"type": "text", "text": reply}]
            for p in written_paths:
                content.append({"type": "tool_use", "name": "Write",
                                "input": {"file_path": p, "content": "x"}})
            rows.append({"type": "assistant", "message": {"role": "assistant", "content": content}})
            with os.fdopen(fd, "w") as f:
                for r in rows:
                    f.write(json.dumps(r) + "\n")
            return tp

        # this turn wrote NOTHING (a plain informational answer) , the offender file exists and
        # is fresh (mtime just now, well within the old 15-min window) but was not touched THIS
        # turn, so it must not be in scope.
        tp_plain = transcript_for([], reply="We use the canonical Solen style, imported everywhere.")
        r = __import__("subprocess").run(
            [__import__("sys").executable, os.path.abspath(__file__)],
            input=json.dumps({"transcript_path": tp_plain}),
            env={**os.environ, "CLAUDE_PROJECT_DIR": tmp},
            capture_output=True, text=True, timeout=15)
        check("a plain answer turn (wrote nothing) PASSES even though a violating file sits fresh nearby",
              r.returncode != 2)

        # this turn DID write the offending file , must still block.
        tp_wrote = transcript_for([offender], reply="Added a custom map style for the new view.")
        r2 = __import__("subprocess").run(
            [__import__("sys").executable, os.path.abspath(__file__)],
            input=json.dumps({"transcript_path": tp_wrote}),
            env={**os.environ, "CLAUDE_PROJECT_DIR": tmp},
            capture_output=True, text=True, timeout=15)
        check("a turn that actually wrote a hardcoded map style still BLOCKS",
              r2.returncode == 2)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

    print(f"\n{passed}/{total} passed")
    print("SELFTEST", "OK" if ok else "FAILED")
    return 0 if ok else 1


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        sys.exit(selftest())
    try: main()
    except Exception: sys.exit(0)
