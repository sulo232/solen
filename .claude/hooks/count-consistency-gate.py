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

2026-08-18 stress-test finding: the 160-char gap on the accent-then-count direction crossed ANY
non-`<` text, so a locked blue "Mehr lesen" link (a real, correct accent link with zero digits of
its own) sitting up to 160 chars before an UNRELATED "(54)" review count elsewhere blocked, even
though the two have nothing to do with each other. FIX: the gap is tightened (160/60 -> 40 both
directions) AND a real violation now requires the gap to be free of known non-count CTA/link
phrases ("Mehr lesen", "read more", etc.), i.e. the accent styling and the count must plausibly be
the SAME element, not two unrelated ones that happen to sit near each other in the source.
"""
import os, re, sys, time, glob, json
PDIR = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
ACCENT = r"(#276EF1|text-s-accent)"
COUNT  = r"\(\s*\d[\d'’.,]*\s*\)"
GAP_MAX = 40  # tightened 2026-08-18, was 160/60
# a real "bare accent count" violation is the accent styling and the count being the SAME element,
# so a gap that contains a normal readable CTA/link phrase means they are TWO DIFFERENT things
# (e.g. a "Mehr lesen" link sitting near an unrelated, already-pilled review count), not a hit.
NON_COUNT_LABEL = re.compile(
    r"(mehr lesen|read more|learn more|weiterlesen|en savoir plus|voir plus|leggi di più|"
    r"mostra di più|view all|alle anzeigen|voir tout|show more|zeig mehr|reservieren|book now|"
    r"jetzt buchen|termin buchen)",
    re.I,
)
RAW = re.compile(
    ACCENT + r"([^<]{0,%d}?)" % GAP_MAX + COUNT +
    r"|" +
    COUNT + r"([^<]{0,%d}?)" % GAP_MAX + ACCENT
)


def is_violation(s):
    """True only when an accent marker and a bare count are close enough, with nothing but
    attribute/markup punctuation between them, to plausibly be the SAME styled element."""
    for m in RAW.finditer(s):
        gap = next((g for g in m.groups() if g is not None and not g.startswith("#") and
                    g not in ("276EF1", "text-s-accent")), "")
        if not NON_COUNT_LABEL.search(gap):
            return True
    return False


# 2026-08-09 (plan box K0e). mtime alone is not authorship: creating or syncing a git worktree
# restamps every file, so this gate would have fired on files nobody touched for the first 15
# minutes of every worktree session. Git now has to agree the file was actually written. Fails
# open to no-filtering when the helper is unavailable.
def _written():
    try:
        sys.path.insert(0, os.path.join(PDIR, "scripts", "hooks"))
        from _session_files import files_written_this_session
        return files_written_this_session(PDIR)
    except Exception:
        return None

def recent():
    fs=[]
    written=_written()
    for pat in ("public/_mockups/**/*.html","app/**/*.tsx","components/**/*.tsx"):
        try:
            for f in glob.glob(os.path.join(PDIR,pat),recursive=True):
                if time.time()-os.stat(f).st_mtime >= 900: continue
                if written is not None and os.path.relpath(f,PDIR) not in written: continue
                fs.append(f)
        except OSError: pass
    return fs
def flag_ok():
    f=os.path.join(PDIR,".claude","count-consistency-skip.flag")
    try: return os.path.isfile(f) and time.time()-os.stat(f).st_mtime<900 and bool(open(f,encoding="utf-8").readline().strip())
    except OSError: return False
def main():
    try: payload = json.load(sys.stdin)
    except Exception: payload = {}
    # One refusal per turn (2026-08-23). `stop_hook_active` is true on every re-run
    # after this check already blocked, so returning success here is what stops the
    # same objection being raised against message after message. The product force-
    # ends the turn after 8 consecutive blocks anyway, so a run past one is wasted.
    if payload.get("stop_hook_active"):
        sys.exit(0)
    if flag_ok(): sys.exit(0)
    hits=[]
    for f in recent():
        try: s=open(f,encoding="utf-8").read()
        except OSError: continue
        if is_violation(s): hits.append(os.path.relpath(f,PDIR))
    if hits:
        sys.stderr.write("COUNT-CONSISTENCY GATE: a review/rating count is painted as BARE ACCENT text "
            "(#276EF1 / text-s-accent) next to a parenthesized number in: "+", ".join(hits[:8])+". "
            "Fold the count into a sunken PILL (bg #F4F4F5, ink text), consistent with the existing "
            "count-pill pattern (decision v2-1). Escape: echo '<why>' > .claude/count-consistency-skip.flag\n")
        sys.exit(2)
    sys.exit(0)


def selftest():
    ok = True
    total = 0
    passed = 0

    def check(name, cond):
        nonlocal ok, total, passed
        total += 1
        passed += 1 if cond else 0
        ok = ok and cond
        print(f"{'PASS' if cond else 'FAIL'}  {name}")

    check("bare accent-styled count still violates (the gate's real job)",
          is_violation('<span class="text-s-accent">(16)</span>'))
    check("accent class immediately before a count, minimal markup, still violates",
          is_violation('<a class="text-s-accent" style="color:#276EF1">(3\'249)</a>'))
    check("a locked blue Mehr lesen link near an unrelated (54) review count PASSES",
          not is_violation(
              '<a class="text-s-accent" href="#">Mehr lesen</a> and further down '
              'the header shows Bewertungen (54) for the salon.'))
    check("an English 'read more' link near an unrelated count PASSES",
          not is_violation('<span class="text-s-accent">read more</span> ... (12) reviews below'))
    check("a genuine count-consistency violation still blocks (same element, tight gap)",
          is_violation('<button class="text-s-accent">(54)</button>'))

    print(f"\n{passed}/{total} passed")
    print("SELFTEST", "OK" if ok else "FAILED")
    return 0 if ok else 1


if __name__=="__main__":
    if "--selftest" in sys.argv:
        sys.exit(selftest())
    try: main()
    except Exception: sys.exit(0)
