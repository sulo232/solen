#!/usr/bin/env python3
"""count-consistency-gate.py : Stop hook — a review/rating COUNT must be a pill, never bare accent text.

WHY (owner 2026-07-23): "i dont like this (16) review thingy. make it a [pill] in the buttons. we
already have that type of stuff. i need consistencies. make a gate for it, not restricted to this."
Codified decision v2-1 (MOCKUP_QUEUE.md): "bare blue count -> folded into pill." This is the FIRST
rule of a general count/badge-consistency gate (extend RULES below for more).

Fires (Stop, exit 2) when a recently-modified mockup/component file paints a parenthesized count
like (16) or (3'249) in the ACCENT color (#276EF1 / text-s-accent) as bare text — i.e. NOT folded
into a sunken pill/chip. Scope: public/_mockups/**/*.html and app|components **/*.tsx modified in
the last 15 min. Fail-open. Escape: echo "<why>" > .claude/count-consistency-skip.flag (15-min TTL).
"""
import os, re, sys, time, glob, json
PDIR = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
ACCENT = r"(#276EF1|text-s-accent)"
COUNT  = r"\(\s*\d[\d'’.,]*\s*\)"
# accent within ~160 chars before a bare count, or a bare count within ~160 chars after accent
VIOL = re.compile(ACCENT + r"[^<]{0,160}?" + COUNT + r"|" + COUNT + r"[^<]{0,60}?" + ACCENT)
def recent():
    fs=[]
    for pat in ("public/_mockups/**/*.html","app/**/*.tsx","components/**/*.tsx"):
        try:
            for f in glob.glob(os.path.join(PDIR,pat),recursive=True):
                if time.time()-os.stat(f).st_mtime < 900: fs.append(f)
        except OSError: pass
    return fs
def flag_ok():
    f=os.path.join(PDIR,".claude","count-consistency-skip.flag")
    try: return os.path.isfile(f) and time.time()-os.stat(f).st_mtime<900 and bool(open(f,encoding="utf-8").readline().strip())
    except OSError: return False
def main():
    try: json.load(sys.stdin)
    except Exception: pass
    if flag_ok(): sys.exit(0)
    hits=[]
    for f in recent():
        try: s=open(f,encoding="utf-8").read()
        except OSError: continue
        if VIOL.search(s): hits.append(os.path.relpath(f,PDIR))
    if hits:
        sys.stderr.write("COUNT-CONSISTENCY GATE: a review/rating count is painted as BARE ACCENT text "
            "(#276EF1 / text-s-accent) next to a parenthesized number in: "+", ".join(hits[:8])+". "
            "Fold the count into a sunken PILL (bg #F4F4F5, ink text), consistent with the existing "
            "count-pill pattern (decision v2-1). Escape: echo '<why>' > .claude/count-consistency-skip.flag\n")
        sys.exit(2)
    sys.exit(0)
if __name__=="__main__":
    try: main()
    except Exception: sys.exit(0)
