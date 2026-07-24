#!/usr/bin/env python3
"""real-component-gate.py : Stop hook — a UI change must be the REAL component, not a throwaway HTML mockup.

WHY (owner 2026-07-23, repeated fury): "it's not gonna be a real component. i need a 1:1 real comp,
what's gonna be actually built, not a mockup thats a hand job by a kindergarten. harden the gate, you
keep doing this." A standalone public/_mockups/*.html approximation of a component is the banned
hand-rolled redraw; the deliverable must be the REAL .tsx component modified, shown on the real route.

Fires (Stop, exit 2) when THIS turn modified a mockup HTML (public/_mockups/**/*.html, last 15 min)
but modified NO real component (app|components|components-legacy/**/*.tsx, last 15 min) -- i.e. an HTML
approximation was thrown over the wall instead of changing the real component.

Exempt: index.html gallery. Escape: echo "<why>" > .claude/real-component-skip.flag (15-min TTL).
Fail-open. Exit 2 = block.
"""
import os, sys, time, glob, json
PDIR = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
W = 900
def recent(pats):
    out=[]
    for p in pats:
        try:
            for f in glob.glob(os.path.join(PDIR,p),recursive=True):
                try:
                    if time.time()-os.stat(f).st_mtime < W: out.append(f)
                except OSError: pass
        except OSError: pass
    return out
def flag_ok():
    f=os.path.join(PDIR,".claude","real-component-skip.flag")
    try: return os.path.isfile(f) and time.time()-os.stat(f).st_mtime<W and bool(open(f,encoding="utf-8").readline().strip())
    except OSError: return False
def main():
    try: json.load(sys.stdin)
    except Exception: pass
    if flag_ok(): sys.exit(0)
    mk=[m for m in recent(["public/_mockups/**/*.html"]) if os.path.basename(m).lower()!="index.html"]
    tsx=recent(["app/**/*.tsx","components/**/*.tsx","components-legacy/**/*.tsx"])
    if mk and not tsx:
        rels=", ".join(os.path.relpath(m,PDIR) for m in mk[:6])
        sys.stderr.write("REAL-COMPONENT GATE: this turn produced standalone HTML mockup(s) ("+rels+") but "
            "changed NO real component (.tsx). The owner needs the REAL component modified 1:1 with what ships, "
            "shown on the real route -- not a hand-rolled HTML approximation. Apply the change to the real .tsx "
            "(use node if Bash writes are sandboxed). Escape: echo '<why>' > .claude/real-component-skip.flag\n")
        sys.exit(2)
    sys.exit(0)
if __name__=="__main__":
    try: main()
    except Exception: sys.exit(0)
