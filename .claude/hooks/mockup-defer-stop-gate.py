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
    r"as\s+mock\w*\s*[—-]?\s*next|coming\s+(up\s+)?next|"
    # 2026-08-11, found by ~/.claude/gate-eval.py, not by reading: the corpus case
    # "I fixed the city filter instead. I'll put the mockup together next." sailed straight through,
    # because every alternative above pins the verb DIRECTLY against "together"/"mock", and ordinary
    # English puts the object in between. Any "I'll ... mockup" or "mockup ... next" is a deferral.
    # Safe to widen: arm 1 only fires when the reply carries NO link, so "I'll show you the mockup at
    # /dev/x" is still untouched.
    r"i'?ll\b[^.!?\n]{0,40}\bmock ?up|mock ?ups?\b[^.!?\n]{0,25}\bnext\b)", re.I)
# TIGHTENED 2026-08-15, adversarial review, and this is the escape hatch that MATTERS now that the
# skip flag no longer opens ARM 2. The old pattern was a bare substring search, so it was satisfied
# by things that are not a mockup handover at all:
#   - "the dev server is still up on localhost:3000", which this project's own link rule has me
#     writing routinely;
#   - `/dev/null`, `/dev/random`, `/dev/urandom` inside any shell snippet;
#   - any `/dev/<word>` appearing in ordinary prose about a file.
# So the cheapest way to silence the arm was to mention a port or a device file by accident.
# Now: a real handover is a tunnel URL, a _mockups path, or a /dev route given as a LINK (markdown,
# or with a scheme and host in front of it). A bare localhost mention no longer counts, and the
# device files are excluded by name.
LINK = re.compile(
    r"trycloudflare\.com"
    r"|/_mockups/"
    r"|\]\(\s*(?:https?://)?(?:localhost|127\.0\.0\.1)[:/]\d*[^)\s]*/dev/[a-z0-9-]+"
    r"|https?://[^\s)\]]+/dev/[a-z0-9-]+"
    r"|\]\([^)\s]*/dev/(?!null\b|random\b|urandom\b|stdin\b|stdout\b|stderr\b|tty\b)[a-z0-9-]+",
    re.I)
# ARM 2, added 2026-08-11. Owner: "u repeated urself stop skipping abt what im saying and also
# mockup i told you", after asking TWICE for a mockup of the search field and getting a
# panel-layout mockup the first time and a bug fix the second.
#
# Arm 1 only ever fired on DEFERRAL LANGUAGE ("I'll build it next"), and it was right not to fire
# here: nothing was deferred, something ELSE was simply built and the ask fell on the floor in
# silence. That is the shape the owner-correction ledger records seven times in fourteen days under
# "promised-visual", and no check could see it.
#
# So: if HE asked for a mockup this turn, and the turn produced no mockup artifact, and the reply
# carries no mockup link, block. Decidable straight off the transcript.
ASKED = re.compile(
    r"\b(make|build|give|show|want|need)\b[^.\n]{0,40}\b(mock ?ups?|variations?|design directions?)\b"
    r"|\bmock ?ups?\b[^.\n]{0,30}\b(i (told|asked)|pls|please)\b"
    r"|\bmock ?up\s+i\s+told\s+you\b", re.I)

# NEGATED REQUESTS ARE NOT REQUESTS. Added 2026-08-15, and found by STRESS TESTING rather than by
# reading: `python3 ~/.claude/gate-eval.py` plus a direct regex probe showed ASKED firing on
# "i dont want a mockup", which is the exact opposite of an ask.
#
# WHY THIS ONE IS URGENT RATHER THAN TIDY. Earlier the same day this gate's skip flag was narrowed
# so it can no longer silence ARM 2. That was the right call for the failure it fixed, and it also
# means an ARM 2 false positive is now UNESCAPABLE: the only ways out are to build a mockup he
# explicitly said he did not want, or to put a link in the reply. Removing the escape from an arm
# obliges you to make that arm's trigger correct, and I shipped the first half without the second.
#
# Deliberately narrow: it wants a negation sitting close in FRONT of the request, so an ordinary ask
# that merely contains the word "no" somewhere ("make a mockup, no rush") is untouched.
NEGATED = re.compile(
    r"\b(?:do\s?n[o']?t|dont|don't|never|stop|no|without|instead\s+of|rather\s+than)\b"
    r"[^.\n]{0,30}?\b(?:want|need|make|build|give|show|more)?\b[^.\n]{0,20}?\b(?:mock ?ups?)\b"
    r"|\bmock ?ups?\b[^.\n]{0,20}\b(?:not\s+needed|are\s+not\s+needed|no\s+longer)\b",
    re.I)

# "SHOW ME THE ONE YOU ALREADY MADE" IS NOT "MAKE ME A NEW ONE". Added 2026-08-15, adversarial
# review. It found that "i need to see the mockup again" and "show me the mockup you already built"
# both trip ASKED, and the message they trigger tells you to BUILD one, which is the wrong
# instruction when the thing already exists and he simply wants the link back. That is not a
# hypothetical shape either: the turn immediately before this one was "server down try again",
# i.e. re-send what you already made.
#
# Re-sending an existing link is the correct answer to these, and the reply carrying that link
# satisfies ARM 2 on its own, so treating them as non-asks costs no real coverage.
ALREADY_BUILT = re.compile(
    r"\b(?:again|already|still|earlier|last\s+time|previous|再)\b[^.\n]{0,40}\bmock ?ups?\b"
    r"|\bmock ?ups?\b[^.\n]{0,40}\b(?:again|already\s+(?:built|made|showed|sent)|you\s+(?:built|made|showed|sent))\b"
    r"|\b(?:re-?send|resend|link\s+again|same\s+link)\b",
    re.I)


def asked_for_mockup(owner):
    """ASKED, minus the negations and the re-send-what-exists asks.

    One place, so the suite, verdict() and main() cannot drift apart. Every caller goes through it.
    """
    if not owner:
        return False
    if not ASKED.search(owner):
        return False
    return not NEGATED.search(owner) and not ALREADY_BUILT.search(owner)


# NOT EVERY "type":"user" ROW IS HIM. Added 2026-08-15 after an independent adversarial review found
# this by RUNNING it, which is the whole reason that review existed.
#
# THE FINDING, and it breaks the stated rationale for the flag change earlier the same day. That
# change removed the escape from ARM 2 because "ARM 2 reads HIS message, and a flag arguing he meant
# something else is an override, not a correction". ARM 2 does not reliably read his message. It
# reads the LAST "type":"user" row, and the harness writes several kinds of row under that type that
# he never typed: a Skill tool's entire file body, system-reminder blocks, injected context.
#
# The reviewer ran this file's own ASKED regex over the real ~/.claude/skills/fable-frontend/SKILL.md
# body and got a hit on its own sentence, "show a mockup that is a COPY of the real page". So any
# turn whose last user-type row is a Skill injection, closing in prose with no link, would have been
# told "HE ASKED FOR A MOCKUP AND THIS TURN BUILT NONE" about text he never wrote, with no flag left
# to clear it. Removing an escape hatch obliges you to make the trigger correct; this is the second
# half of that debt, after the negation fix.
#
# The existing `"hook" not in c[:60]` line is the same idea done as a substring blocklist, and it has
# its own false negative: a real message of his that opens with the word "hook" is silently skipped,
# and this owner talks about hooks constantly. Both are handled below by SHAPE rather than by
# keyword where possible, and the keyword list is anchored to line starts so ordinary prose that
# merely contains one of these words is untouched.
INJECTED = re.compile(
    r"\A\s*(?:"
    r"<(?:system-reminder|task-notification|command-name|command-message|local-command)"
    r"|Base directory for this skill:"
    r"|The following skills are available"
    r"|The following deferred tools"
    r"|Available agent types"
    r"|Stop hook (?:feedback|blocking error)"
    r"|\[SYSTEM NOTIFICATION"
    r"|Caveat: The messages below"
    r")", re.I)


def is_injected(text):
    """True when this 'user' row is harness-generated rather than typed by him."""
    if not text:
        return True
    if INJECTED.match(text):
        return True
    # A skill body or a tool dump can start with ordinary prose, so also refuse a row that carries a
    # hook/skill marker ANYWHERE while being far longer than anything he dictates. His messages run
    # to a few hundred characters; a skill file runs to thousands.
    if len(text) > 1500 and re.search(
            r"(?m)^\s*(?:Base directory for this skill:|<system-reminder|Path:\s*userSettings:)", text):
        return True
    return False


def last_owner_text(tp, with_ts=False):
    """His most recent message, so ARM 2 can see what he actually asked for.

    `with_ts` also returns when he sent it. That timestamp is the honest floor for "was the mockup
    built for THIS ask": a route written before he asked cannot be an answer to it, and a route
    written after it is. Using the session start instead would let any old mockup from hours earlier
    satisfy a fresh request, which is the opposite failure to the one fixed above.
    """
    try:
        with open(tp, encoding="utf-8") as f:
            lines = f.readlines()
    except (OSError, UnicodeDecodeError, ValueError):
        # UnicodeDecodeError is a ValueError, NOT an OSError, so the old `except OSError` let one bad
        # byte anywhere in the transcript escape to main()'s bare handler, which exits 0. That turned
        # a damaged transcript into a SILENT PASS on the arm that is meant to have no escape.
        return ("", None) if with_ts else ""
    for line in reversed(lines):
        line = line.strip()
        if not line:
            continue
        try:
            o = json.loads(line)
        except Exception:
            continue
        # A line can be valid JSON without being an object (a bare number, string, list or null).
        # `.get` on those raises AttributeError, which aborted this whole function and fell through
        # to the same silent pass. Found by the adversarial review.
        if not isinstance(o, dict) or o.get("type") != "user":
            continue
        msg = o.get("message")
        c = msg.get("content", []) if isinstance(msg, dict) else []
        if isinstance(c, list):
            if any(isinstance(b, dict) and b.get("type") == "tool_result" for b in c):
                continue
            c = " ".join(b.get("text", "") for b in c if isinstance(b, dict) and b.get("type") == "text")
        if isinstance(c, str) and c.strip() and not is_injected(c):
            return (c, _epoch(o.get("timestamp"))) if with_ts else c
    return ("", None) if with_ts else ""


def wrote_mockup_route(since=None):
    """A /dev route or public/_mockups file written since `since` counts as the mockup for the ask.
    /dev is where mockups actually live now, not public/_mockups, which is where arm 1 was looking."""
    written = _written(since)
    if not written:
        return False
    # ANCHORED 2026-08-15, adversarial review. `"/dev/" in f` was an unanchored substring test, so
    # ANY file anywhere in the tree whose path happened to contain /dev/ counted as "the mockup" ,
    # and this repo really has such paths, e.g. the flow harness under app/[locale]/dev/flows. A
    # turn that edited one of those for an unrelated reason silenced ARM 2 while the actual ask went
    # unanswered. A mockup route here is a Next route segment named dev, so require the segment to
    # sit under an app directory rather than merely appear somewhere in the string.
    return any(
        (re.search(r"(?:^|/)app/[^/]*/dev/", f) or f.startswith("public/_mockups/")
         or f.startswith("app/dev/"))
        and f.endswith((".tsx", ".jsx", ".html"))
        for f in written)


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
                if isinstance(c,str): got=c
                elif isinstance(c,list):
                    got=" ".join(p.get("text","") for p in c if isinstance(p,dict) and p.get("type")=="text")
                else: got=""
                # 2026-08-21: this used to assign unconditionally, so a final assistant entry
                # carrying only a tool call and no words BLANKED the real answer found moments
                # earlier and the check then judged an empty string. Reproduced with a two line
                # fixture. Keep the last entry that actually said something.
                if got.strip(): txt=got
    except OSError: return ""
    return txt
# 2026-08-09 (plan box K0e). mtime alone is not authorship: creating or syncing a git worktree
# restamps every file. Git now has to agree the mockup was actually written this session.
#
# FIXED 2026-08-11, and this was a BINDING failure, not a missing check. `files_written_this_session`
# takes an optional session-start epoch; called without it, the helper consults ONLY the dirty
# working tree, by its own documented contract. So the instant a mockup is COMMITTED, this gate can
# no longer see that it was ever built, and it blocks the very sessions that follow the repo's
# commit-often rule. Measured on this session: /dev/search-field was built, the owner picked variant
# A from it with one letter, that pick was applied, and the gate then demanded the same mockup again
# because the file was clean. That is a false block, and a false block is the expensive kind: it
# costs a whole turn and teaches the skip flag.
#
# The helper's own docstring names the fix ("a transcript's first timestamp works"), so the session
# start now comes from the transcript and committed work counts as written.
def _epoch(ts):
    """Transcript timestamp -> epoch seconds, or None. Never raises."""
    if not ts:
        return None
    try:
        from datetime import datetime
        return datetime.fromisoformat(str(ts).replace("Z", "+00:00")).timestamp()
    except Exception:
        return None

def _written(since=None):
    try:
        sys.path.insert(0, os.path.join(PDIR, "scripts", "hooks"))
        from _session_files import files_written_this_session
        return files_written_this_session(PDIR, since)
    except Exception:
        return None

def wrote_recent(since=None):
    written=_written(since)
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


# THE ESCAPE NOW ONLY OPENS ARM 1. Added 2026-08-15, owner: "I told you to make mock up why did you
# not make any fucking mock ups? ... why the fuck you keep making the same fucking mistake".
#
# What actually happened, and it is worse than not building the mockup. ARM 2 fired, correctly,
# saying he asked for a mockup and the turn built none. I then wrote the escape flag with a
# paragraph arguing that his words meant the opposite, and closed the turn. So the one check that
# had correctly heard him was overruled by me, in writing, with prose.
#
# THE STRUCTURAL POINT, which is why this is a fix and not a scold: the two arms are decided off
# completely different evidence, so one escape hatch should never have covered both.
#   ARM 1 reads MY OWN reply for deferral language. I am the author of that text, I can be wrong
#     about my own phrasing, and a flag explaining "this sentence is not a deferral" is a legitimate
#     correction of a false positive. The flag stays live for arm 1.
#   ARM 2 reads HIS message. A flag saying "he did not really mean that" is not a correction of a
#     false positive, it is me outvoting him on the meaning of his own sentence, in a file he will
#     never see. There is no version of that which is legitimate, so there is no flag for it.
#
# The honest escape for arm 2 is the one that was always available and costs less than the
# paragraph I wrote instead: BUILD THE MOCKUP. If his ask is genuinely ambiguous, the reply asks him
# which surface, and asking is not blocked by this gate.
ARM2_FLAG_NOTE = ("\n\nAND THE FLAG WILL NOT OPEN THIS ONE. `.claude/mockup-defer-skip.flag` still "
    "excuses the deferral arm, which reads YOUR wording and can misread it. This arm reads HIS "
    "message. Writing a file that argues he meant something else is not correcting a false "
    "positive, it is overruling him where he cannot see it, and that is what happened on "
    "2026-08-15. Build the mockup, or ask him which surface, asking is not blocked.")
ARM2_MSG = ("HE ASKED FOR A MOCKUP AND THIS TURN BUILT NONE. His message asks for a "
    "mockup / variations / directions, the turn wrote no mockup file (a /dev route or "
    "public/_mockups), and the reply carries no link to one. Fixing something else instead "
    "is exactly what he means by 'stop skipping abt what im saying'. BUILD it this turn: "
    "real tokens, side by side, one column per direction, ending with the link. "
    "Escape: echo '<why>' > .claude/mockup-defer-skip.flag\n")

ARM1_MSG = ("MOCKUP-DEFER GATE: your reply defers a mockup/variation ('next' / 'after "
    "your confirmation' / 'want me to build') without building it and without a link. BUILD "
    "the mockup THIS turn (real tokens, side-by-side variations) and end with the "
    "trycloudflare/_mockups link, or add a CONCRETE blocker. "
    "Escape: echo '<why>' > .claude/mockup-defer-skip.flag\n")


def verdict(reply, owner="", asked_at=None):
    """The whole decision, as a pure function: returns the block message, or None to pass.

    Extracted 2026-08-11 because ~/.claude/gate-eval.py reported "could not drive it over the
    transcript (no usable pure function)" and therefore scored 0 of 1 on a case this gate DOES
    catch. A gate the evaluation layer cannot run is a gate nobody can measure, which is the exact
    false-reassurance that layer exists to stop. main() now calls this too, so what is tested is
    what runs."""
    if not reply:
        return None
    if asked_for_mockup(owner) and not LINK.search(reply) and not wrote_mockup_route(asked_at):
        return ARM2_MSG
    if MOCKUP.search(reply) and DEFER.search(reply) and not LINK.search(reply):
        return ARM1_MSG
    return None


def main():
    try: data=json.load(sys.stdin)
    except Exception: sys.exit(0)
    # One refusal per turn (2026-08-23). `stop_hook_active` is true on every re-run
    # after this check already blocked, so returning success here is what stops the
    # same objection being raised against message after message. The product force-
    # ends the turn after 8 consecutive blocks anyway, so a run past one is wasted.
    if data.get("stop_hook_active"):
        sys.exit(0)
    tp=data.get("transcript_path") or ""
    if not tp or not os.path.isfile(tp): sys.exit(0)
    text=last_assistant_text(tp)
    owner, asked_at = last_owner_text(tp, with_ts=True)
    if not text or wrote_recent(asked_at): sys.exit(0)
    msg = verdict(text, owner, asked_at)
    if not msg:
        sys.exit(0)
    # The flag is consulted AFTER the verdict, because which arm fired decides whether the flag is
    # allowed to speak at all. See ARM2_FLAG_NOTE above.
    #
    # WHICH ARM IS RE-DERIVED, NOT IDENTIFIED BY OBJECT IDENTITY. This used to read
    # `if msg is ARM2_MSG`, which holds only because verdict() happens to return the module constant
    # itself. The adversarial review named the landmine: any later edit that BUILDS the message
    # instead of returning the constant (an f-string, a .format, merging the two templates) leaves
    # the text identical and the identity false, and the failure is silent and points the wrong way,
    # because control then falls into `flag_ok()` and THE FLAG SILENTLY REOPENS ARM 2, which is
    # exactly the 2026-08-15 failure this whole change exists to prevent. Re-deriving from the same
    # helpers cannot drift like that.
    is_arm2 = (asked_for_mockup(owner) and not LINK.search(text)
               and not wrote_mockup_route(asked_at))
    if is_arm2:
        sys.stderr.write(msg.rstrip("\n") + ARM2_FLAG_NOTE + "\n")
        sys.exit(2)
    if flag_ok():
        sys.exit(0)
    sys.stderr.write(msg)
    sys.exit(2)


def _selftest():
    """Added 2026-08-11 with the committed-mockup fix. This file had NO suite for three days, which
    is how the false block below survived: nobody had ever written down what it must let through."""
    import calendar, subprocess, tempfile
    global PDIR
    ok = True

    def check(name, got, want):
        nonlocal ok
        good = got == want
        ok = ok and good
        print(("pass: " if good else "FAIL: ") + name + ("" if good else f"  (got {got}, want {want})"))

    check("timestamp parses", _epoch("2026-08-11T09:00:00.000Z"), calendar.timegm((2026, 8, 11, 9, 0, 0, 0, 0, 0)))
    check("junk timestamp is None", _epoch("not-a-date"), None)

    d = tempfile.mkdtemp()
    git = lambda *a: subprocess.run(["git", "-C", d, *a], capture_output=True, text=True)
    git("init", "-q"); git("config", "user.email", "t@t.t"); git("config", "user.name", "t")
    os.makedirs(os.path.join(d, "app/[locale]/dev/search-field"))
    with open(os.path.join(d, "app/[locale]/dev/search-field/page.tsx"), "w") as fh:
        fh.write("export default function P(){return null}\n")
    git("add", "-A"); git("commit", "-q", "-m", "mockup")
    real_pdir, PDIR = PDIR, d
    sys.path.insert(0, os.path.join(real_pdir, "scripts", "hooks"))

    # THE REGRESSION THIS FIX EXISTS FOR
    check("a COMMITTED mockup answers an ask that came before it", wrote_mockup_route(time.time() - 3600), True)
    check("a committed mockup does not answer a LATER ask", wrote_mockup_route(time.time() + 60), False)

    # CALLS THE REAL verdict(), 2026-08-15. It used to re-implement the ARM 2 condition inline, so
    # these six checks tested a COPY of the logic and would have kept passing while the shipped
    # function was edited underneath them. The adversarial review flagged it, and it is the same
    # class of defect this file's own 08-11 note warns about for the flag ordering, just never
    # generalised. The helper now only builds the transcript; the decision comes from the module.
    real_verdict = globals()["verdict"]

    def run_verdict(owner_msg, reply, ask_offset):
        ts = time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime(time.time() + ask_offset))
        tp = os.path.join(d, "t.jsonl")
        with open(tp, "w") as fh:
            fh.write(json.dumps({"type": "user", "timestamp": ts, "message": {"content": owner_msg}}) + "\n")
            fh.write(json.dumps({"type": "assistant", "timestamp": ts,
                                 "message": {"content": [{"type": "text", "text": reply}]}}) + "\n")
        owner, at = last_owner_text(tp, with_ts=True)
        return real_verdict(reply, owner, at) is not None

    verdict = run_verdict

    check("BLOCKS a fresh ask answered with something else",
          verdict("give me a mockup of the search field", "I fixed the filter instead.", +30), True)
    check("BLOCKS 'mockup i told you' answered with a bug fix",
          verdict("u repeated urself and also mockup i told you", "Here is the bug fix.", +30), True)
    check("PASSES when the mockup was built after the ask (the false block, 2026-08-11)",
          verdict("give me a mockup of the search field", "Variant A is live.", -3600), False)
    # UPDATED 2026-08-15, and the expectation moved rather than the code. This case used to hand a
    # BARE "/dev/search-field" in prose and expect a pass. Tightening LINK (so that a stray
    # "localhost:3000" or a "/dev/null" in a shell snippet can no longer silence the arm) means a
    # bare path no longer counts, and that is correct on its own terms: his rule 0 says a link he
    # cannot tap is not a link, and every other gate in the link family already demands markdown.
    # The case's real intent, "a genuine handover passes", is preserved by making it a genuine one.
    check("PASSES when the reply links a /dev route as a real, tappable link",
          verdict("give me a mockup of the search field",
                  "Have a look: [open](https://x.trycloudflare.com/en/dev/search-field)", +30), False)
    check("BLOCKS when the /dev route is only a bare path in prose, which he cannot tap",
          verdict("give me a mockup of the search field", "Have a look at /dev/search-field", +30), True)
    check("PASSES a one-letter answer, which is a pick and not a request",
          verdict("a", "Variant A is live.", +30), False)
    check("PASSES an ordinary question with no mockup word",
          verdict("why is the search bar grey", "Because the capsule is filled.", +30), False)

    # NEGATED REQUESTS, 2026-08-15. Found by gate-eval plus a direct regex probe, NOT by reading the
    # file, and urgent because ARM 2 lost its escape hatch earlier the same day: a false positive
    # here can now only be cleared by building a mockup he said he did not want.
    for phrase in ["i dont want a mockup",
                   "don't make a mockup for this",
                   "no more mockups please",
                   "just fix it instead of a mockup",
                   "stop making mockups"]:
        check(f"NEGATED is not an ask: {phrase!r}",
              verdict(phrase, "Fixed it in the code.", +30), False)
    # ...and the negation guard must not swallow the real ones.
    for phrase in ["make me a mockup, no rush",
                   "I told you to make mock up why did you not make any fucking mock ups?",
                   "give me a mockup of the search field"]:
        check(f"STILL an ask: {phrase[:44]!r}",
              verdict(phrase, "I fixed the filter instead.", +30), True)

    # ─── EVERYTHING BELOW CAME OUT OF THE ADVERSARIAL REVIEW, 2026-08-15 ────────────────────────
    # None of it was in my own suite, which is the point: a suite tests its author's imagination.

    # 1. "Show me the one you already made" is not "make me a new one", and the block message would
    #    have told me to BUILD something that already exists.
    for phrase in ["i need to see the mockup again",
                   "show me the mockup you already built",
                   "send me the mockup link again"]:
        check(f"RE-SEND is not a new ask: {phrase!r}",
              verdict(phrase, "Here it is.", +30), False)

    # 2. A "user" row the harness wrote, not him. The reviewer ran this file's own ASKED regex over
    #    the real fable-frontend skill body and got a hit on its own sentence about showing a mockup.
    skill_row = ("Base directory for this skill: /Users/sulo/.claude/skills/fable-frontend\n\n"
                 "Step 4. Before touching real code on any visual change: show a mockup that is a "
                 "COPY of the real page with only the proposed change applied.")
    check("a Skill injection is NOT him asking",
          verdict(skill_row, "Fixed the padding bug.", +30), False)
    check("a system-reminder block is NOT him asking",
          verdict("<system-reminder>\nRemember to show a mockup before building.\n</system-reminder>",
                  "Fixed the padding bug.", +30), False)

    # 3. The LINK escape must not be satisfiable by accident. These are the three the reviewer found.
    for reply, why in [("Fixed the bug, dev server is still up on localhost:3000", "a bare port"),
                       ("Cleaned it with `rm -f /dev/null` style redirection", "a device file"),
                       ("I edited the /dev/round5 file this morning.", "prose naming a path")]:
        check(f"LINK is not satisfied by {why}",
              verdict("give me a mockup of the search field", reply, +30), True)
    check("LINK IS satisfied by a real markdown handover",
          verdict("give me a mockup of the search field",
                  "Have a look: [open](https://x.trycloudflare.com/en/dev/search-field)", +30), False)

    # 4. Crash inputs must not become a silent pass. A JSON-valid non-object row and a message field
    #    that is not a dict both used to raise AttributeError out of last_owner_text.
    for bad_row, why in [("42", "a bare number"), ('"just a string"', "a bare string"),
                         ("null", "a null"), ('{"type":"user","message":"not-a-dict"}', "a string message")]:
        tp = os.path.join(d, "crash.jsonl")
        ts = time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime())
        with open(tp, "w") as fh:
            fh.write(bad_row + "\n")
            fh.write(json.dumps({"type": "user", "timestamp": ts,
                                 "message": {"content": "give me a mockup of the search field"}}) + "\n")
        try:
            owner, at = last_owner_text(tp, with_ts=True)
            survived = "mockup" in owner
        except Exception:
            survived = False
        check(f"a damaged row ({why}) does not silence the gate", survived, True)

    # THE 2026-08-15 REGRESSION: the flag must not open arm 2. Driven through the real decision
    # path in main() rather than through a re-implementation of it, because the bug WAS in main()
    # (it consulted the flag before it knew which arm had fired) and a suite that rebuilds the
    # logic to test it would have passed while the shipped file failed. That exact shape is on
    # record in this estate: a gate whose suite only ever exercised its failure path.
    import io, contextlib
    flagdir = os.path.join(d, ".claude")
    os.makedirs(flagdir, exist_ok=True)
    with open(os.path.join(flagdir, "mockup-defer-skip.flag"), "w") as fh:
        fh.write("he did not really mean it\n")
    PDIR = d

    def run_main(owner_msg, reply, ask_offset):
        """Exit code from the SHIPPED main(), flag present, over a synthetic transcript."""
        ts = time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime(time.time() + ask_offset))
        tp = os.path.join(d, "m.jsonl")
        with open(tp, "w") as fh:
            fh.write(json.dumps({"type": "user", "timestamp": ts, "message": {"content": owner_msg}}) + "\n")
            fh.write(json.dumps({"type": "assistant", "timestamp": ts,
                                 "message": {"content": [{"type": "text", "text": reply}]}}) + "\n")
        stdin, sys.stdin = sys.stdin, io.StringIO(json.dumps({"transcript_path": tp}))
        try:
            with contextlib.redirect_stderr(io.StringIO()):
                try:
                    main()
                except SystemExit as e:
                    return e.code
                return 0
        finally:
            sys.stdin = stdin

    # SHOULD trip, with the flag sitting right there: he asked, nothing was built.
    check("flag does NOT open arm 2 (the 2026-08-15 failure)",
          run_main("I told you to make mock ups, why did you not make any", "I fixed the code instead.", +30), 2)
    # Must NOT trip: same flag, arm 1 only. My own wording, which I am allowed to correct.
    check("flag still opens arm 1 (deferral wording is mine to correct)",
          run_main("what colour is the pill", "I'll build the mockup next.", +30), 0)
    # Must NOT trip: no flag involved, he asked and it was built.
    check("no block when he asked and the reply carries a real, tappable link",
          run_main("make me a mockup", "It is here: [open](https://x.trycloudflare.com/en/dev/round5)", +30), 0)

    PDIR = real_pdir
    # the word "passed" is what ~/.claude/gate-eval.py greps for to know a suite actually ran
    print(f"SELFTEST {'passed' if ok else 'FAILED'}")
    return 0 if ok else 1


if __name__=="__main__" and "--selftest" in sys.argv:
    sys.exit(_selftest())
if __name__=="__main__":
    try: main()
    except Exception: sys.exit(0)
