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

def recent():
    out = []
    written = _written()
    for pat in ("app/**/*.ts", "app/**/*.tsx", "components/**/*.tsx", "components-legacy/**/*.tsx", "lib/**/*.ts"):
        try:
            for f in glob.glob(os.path.join(PDIR, pat), recursive=True):
                if EXEMPT.search(f): continue
                try:
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
    try: json.load(sys.stdin)
    except Exception: pass
    if flag_ok(): sys.exit(0)
    hits = []
    for f in recent():
        try: s = open(f, encoding="utf-8").read()
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

if __name__ == "__main__":
    try: main()
    except Exception: sys.exit(0)
