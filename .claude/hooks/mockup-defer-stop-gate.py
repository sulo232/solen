#!/usr/bin/env python3
"""mockup-defer-stop-gate.py : Stop hook — BUILD the mockup this turn, never "I'll do it next".
WHY (owner 2026-07-23, recurrence): "you said 'next' instead of actually making the mockup ...
other sessions build the mockup instead of saying I'm gonna do this after your confirmation. And
you didn't give me a link at the end." Complements visual-deliverable-gate.py (which needs a link
only when KNOWLEDGE FILES are written); this fires on the DEFERRAL LANGUAGE itself.
Fires (Stop, exit 2) when final assistant msg: (1) mentions mockup/variation/direction, (2) defers
it ("I'll build", "mockups next", "after your confirmation", "want me to build"), (3) has NO link
(trycloudflare/_mockups/localhost/dev route), (4) no public/_mockups file written in last 10 min.
Escape: echo "<why>" > .claude/mockup-defer-skip.flag (10-min TTL). Fail-open. Exit 2 = block."""
import os, re, sys, time, json, glob
PDIR = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
MOCKUP = re.compile(r"\b(mock ?ups?|variations?|design directions?)\b", re.I)
DEFER = re.compile(r"(i'?ll\s+(build|make|do|create|put together|mock)|i will\s+(build|make|do)|"
    r"i'?m\s+(going to|gonna)\s+(build|make|do|mock)|let me\s+(build|make|go build)|"
    r"mock ?ups?\s+(are\s+)?(coming\s+)?next|next\s+up[:,\s].{0,80}mock|after\s+(your\s+)?confirm|"
    r"want me to\s+(build|make|do|mock|proceed)|then\s+i'?ll|will\s+build\s+(the\s+)?mock|"
    r"build\s+(them|the mock\w*)\s+next|do\s+(this|that|it|them|the mock\w*)\s+next|"
    r"as\s+mock\w*\s*[—-]?\s*next|coming\s+(up\s+)?next)", re.I)
LINK = re.compile(r"(trycloudflare\.com|/_mockups/|localhost:\d+|127\.0\.0\.1:\d+|/dev/[a-z0-9-]+)", re.I)
def last_assistant_text(tp):
    txt=""
    try:
        with open(tp,encoding="utf-8") as f:
            for line in f:
                line=line.strip()
                if not line: continue
                try: o=json.loads(line)
                except Exception: continue
                if o.get("type")!="assistant": continue
                c=o.get("message",{}).get("content",[])
                if isinstance(c,str): txt=c
                elif isinstance(c,list):
                    txt=" ".join(p.get("text","") for p in c if isinstance(p,dict) and p.get("type")=="text")
    except OSError: return ""
    return txt
# 2026-08-09 (plan box K0e). mtime alone is not authorship: creating or syncing a git worktree
# restamps every file. Git now has to agree the mockup was actually written this session.
def _written():
    try:
        sys.path.insert(0, os.path.join(PDIR, "scripts", "hooks"))
        from _session_files import files_written_this_session
        return files_written_this_session(PDIR)
    except Exception:
        return None

def wrote_recent():
    written=_written()
    try:
        for f in glob.glob(os.path.join(PDIR,"public","_mockups","**","*.htm*"),recursive=True):
            if time.time()-os.stat(f).st_mtime >= 600: continue
            if written is not None and os.path.relpath(f,PDIR) not in written: continue
            return True
    except OSError: pass
    return False
def flag_ok():
    f=os.path.join(PDIR,".claude","mockup-defer-skip.flag")
    try:
        return os.path.isfile(f) and (time.time()-os.stat(f).st_mtime<600) and bool(open(f,encoding="utf-8").readline().strip())
    except OSError: return False
def main():
    try: data=json.load(sys.stdin)
    except Exception: sys.exit(0)
    tp=data.get("transcript_path") or ""
    if not tp or not os.path.isfile(tp): sys.exit(0)
    text=last_assistant_text(tp)
    if not text or flag_ok() or wrote_recent(): sys.exit(0)
    if MOCKUP.search(text) and DEFER.search(text) and not LINK.search(text):
        sys.stderr.write("MOCKUP-DEFER GATE: your reply defers a mockup/variation ('next' / 'after "
            "your confirmation' / 'want me to build') without building it and without a link. BUILD "
            "the mockup THIS turn (real tokens, side-by-side variations) and end with the "
            "trycloudflare/_mockups link, or add a CONCRETE blocker. "
            "Escape: echo '<why>' > .claude/mockup-defer-skip.flag\n")
        sys.exit(2)
    sys.exit(0)
if __name__=="__main__":
    try: main()
    except Exception: sys.exit(0)
