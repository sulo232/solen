#!/usr/bin/env python3
# hook-event: Stop
# hook-matcher:
"""plan-park-gate.py : if you park it in the message, it has to exist in the plan.

Owner, 2026-08-07, decision 13: park a mid-loop question, keep going, surface it at the end,
"but actually added to the plan. And we will serve, like, a plan gate ... do not forget about
those."

WHAT ACTUALLY GOES WRONG, measured
----------------------------------
`CLAUDE.md:22` says to park non-blocking decisions "under the 'Unplanned additions' / parked
section of `_plans/ACTIVE.md`". That section does not exist in `_plans/ACTIVE.md`. It exists in
`_plans/SYSTEM_OVERHAUL_2026-08-07.md:238` and `_plans/BACKEND_LAW.md:168` and nowhere else. So
the law points at nothing and parking lands wherever the turn was writing, or nowhere.

The consequence, from git log on the plan files:
  * `_plans/LAW_IMPROVE_2026-07-27.md:66-102` asks five owner decisions. `_plans/
    LAW_IMPROVE_2026-08-03.md:94-116` asks the SAME FIVE, seven days later. None was answered in
    between, and `_plans/ACTIVE.md:11` still lists all five as OPEN.
  * Oldest still-parked item I could date: the ab-CHF i18n decision, written 2026-06-29
    (cdf2e4849), still in `_plans/ACTIVE.md:19` today. Forty days.
  * Over the last month, plan commits ADDED 274 lines that park or open a decision and 78 that
    resolve one.

The sets that DID get answered were the ones put in front of him: MOTION_LAW Q1/Q2 in
conversation, and the thirty system-overhaul questions off a served page. Nothing that lived only
inside a plan file was ever answered. So this file is only half the fix: the gate makes the record
exist, and `scripts/build-open-decisions.py` puts it where he will see it.

WHY THIS IS LEGAL UNDER THE FREEZE (decision 1, LAW_SYSTEM.md section 6.9)
-------------------------------------------------------------------------
(a) No gate covers this class. Three touch parking and all police the opposite direction.
    `no-defer-excuse-gate.py` blocks a park carrying a budget excuse and explicitly exempts "an
    owner-decision park", so a legitimate park is waved through unchecked. `unfinished-batch-gate.py`
    mode (C) needs the word "readback" plus two numbered lines to trigger, which a closing park
    sentence is not. `finish-autonomously-gate.py` blocks early stops, not unrecorded parks.
(b), (c) do not apply.
(d) So a new gate is the answer, and it is objective and cheap: two string checks over text this
    hook already holds. No judgment, no rendering, no measurement.

THE GIT RULE, and why it is not negotiable
------------------------------------------
The did-a-plan-file-change half is proven from git, never from filesystem mtime. Two gates in this
estate were caught this session using mtime as a proxy for authorship, and both fired on files
nobody had touched: a worktree checkout restamps everything, so `_design-system/RATIONALE.md` and
three siblings all read one mtime while `git status` called every one clean.
`scripts/hooks/_session_files.py` was written for exactly that, and this gate calls it for the
which-files question, then does its own line-level diff on top, because a park needs a line and
that helper answers at file granularity on purpose.

One consequence is deliberate: when git cannot answer, this gate stays SILENT. `plan_lines_added`
returns None on any git failure and None fails open. An instrument that cannot prove its trigger
must not fire, which is the same lesson as the fourteen animation attempts, arriving from the
other side.

ARMS
----
A. The message parks something and NO `PARKED <date>` line was added to any `_plans` file this
   turn. Block: write the line.
B. Lines were added, but none shares a distinctive word with the sentence that did the parking.
   Block: the line you wrote is about something else. Arm B needs at least two distinctive words
   in the parked sentence before it will speak, so a terse park cannot trip it.

GUARDS
------
* `stop_hook_active` does NOT silence this gate. It bounds it: three blocks per session, then it
  stands down. The unconditional early exit is why `instrument-corroboration-gate.py` sat silent
  through the exact turn it existed for, with 64 armed Stop hooks setting that flag for it.
* Quotes, code fences and blockquotes are stripped before the message is read, so quoting the
  owner or pasting a plan file is not a park claim.
* Skip: echo "<reason>" > .claude/plan-park-skip.flag  (90s TTL, non-empty reason required,
  consumed on read).
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import tempfile
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _park_marker import PARK_LINE_RE, question_text  # noqa: E402
from _session_files import files_written_this_session  # noqa: E402

SKIP_TTL = 90          # seconds; matches the raised-skip-cost convention
MAX_BLOCKS = 3         # per session, so this can never wedge a turn forever
PLAN_DIR = "_plans"

# The closing message parks something.
#
# TIGHTENED after a measured false positive during this gate's own self-test. The first draft
# matched a bare "parked decisions", so the sentence "the old law told me to write parked
# decisions into ACTIVE.md" fired the gate. That sentence REPORTS on parking, it does not park
# anything, and the sessions most likely to write it are the ones building this gate.
#
# So every alternative below is anchored to an ACT: first person, or an explicit address to him,
# or a line-initial label. A mention of parking in the abstract matches nothing.
# He is telling me I got something wrong. Deliberately narrow: these are the shapes he actually
# uses, taken from his own messages, not a general complaint detector. A vague "hmm" is not a
# correction and must not demand a plan line.
OWNER_CORRECTION_RE = re.compile(
    r"\b(?:i (?:told|said)|told you|i already (?:told|said))\b"
    # his real sentence was "That is not what I fucking ask", so the verb is bare and a swear can
    # sit between "i" and it. Written from what he types, not from what grammar expects.
    r"|\b(?:that (?:is|'s)|this is) not what i\b[^.\n]{0,20}\b(?:ask|asked|said|meant|want|wanted)\b"
    r"|\bnot what i\b[^.\n]{0,20}\b(?:ask|asked|meant|wanted)\b"
    r"|\bkeep it\b.{0,20}\b(?:square|round|circle|black|white|grey|gray)\b"
    r"|\b(?:no|nope) not (?:at all|like that|what)\b"
    r"|\bwhy (?:do|did) you (?:keep|not|never)\b"
    r"|\byou (?:keep|kept) (?:not )?(?:forgetting|repeating|ignoring)\b"
    r"|\bwe did ?n'?t do that\b"
    r"|\bagain\b.{0,30}\b(?:told|said|asked)\b",
    re.IGNORECASE)


def owner_message(records) -> str:
    """His last real message, skipping hook feedback and machine entries."""
    for rec in reversed(records or []):
        if rec.get("type") != "user":
            continue
        content = (rec.get("message") or {}).get("content")
        text = content if isinstance(content, str) else " ".join(
            b.get("text", "") for b in (content or [])
            if isinstance(b, dict) and b.get("type") == "text")
        if not text.strip():
            continue
        low = text.lower()
        if ("hook feedback" in low or "<task-notification" in low
                or "[system notification" in low or "hook additional context" in low):
            continue
        return text
    return ""


PARK_CLAIM_RE = re.compile(
    r"(\bi(?:'ve| have)? parked\b"
    r"|\bi(?:'m| am) parking\b"
    r"|\bparked (?:this|that|it|these|them)\b"
    r"|\bparked the \w+(?: \w+)? (?:question|decision|call|choice)\b"
    r"|\bpark(?:ing|ed) (?:it|this|that) (?:and|for|until)\b"
    r"|\b(?:one|two|three|four|five|\d+) (?:open |outstanding |parked )?"
    r"(?:decision|question|call|choice)s? (?:is|are) (?:parked|open|waiting)\b"
    r"|\b(?:one|two|three|four|five|\d+) parked (?:decision|question|call|choice)s?\b"
    r"|\b(?:open|outstanding|remaining|parked) (?:decision|question|call|choice)s? "
    r"for (?:you|the owner)\b"
    r"|\bneeds? (?:your|an owner|the owner'?s) (?:call|decision|answer|pick|input|sign-?off)\b"
    r"|\bi (?:did not|didn'?t) decide\b"
    r"|\bi(?:'ve| have)? left (?:it|this|that|them) open\b"
    r"|\bsurfacing (?:it|this|these|them) (?:at the end|here) for you\b"
    r"|^\s*(?:open|parked) (?:decision|question)s?\s*:"
    r")",
    re.I | re.M,
)

# WEAK claims. These phrases genuinely park things, and they also appear in sentences that park
# nothing. Replaying the last 25 sessions' closing messages through the strong set found one such
# case: "you're ending the session, and anything I start dies with it. That's your call, not me
# deferring." That is an explanation of who owns a stop, not a decision handed over.
#
# So a weak phrase only counts when the same sentence also carries a question mark or a colon,
# i.e. when it is actually introducing the thing he has to answer. The same replay's two REAL
# parks both survive this test, and both are decisions still open today: the mockup-mute question
# (asked in three consecutive weekly audits, `_plans/WORKLOG.md:102`) and the SOLEN_UI.md folding
# question (`_plans/ESTATE_AUDIT_2026-07-11.md:40`, 27 days open).
WEAK_CLAIM_RE = re.compile(r"(\byour call\b|\bfor you to (?:decide|pick|choose|call)\b)", re.I)
WEAK_QUALIFIER_RE = re.compile(r"[:?]")

# Arm B keyword extraction. Same technique unfinished-batch-gate.py mode (C) already uses, with
# the word-boundary fix it needed (a raw substring test let "design" inside "redesign" count).
STOPWORDS = {
    "about", "which", "where", "there", "should", "would", "could", "these", "those", "their",
    "before", "after", "every", "still", "again", "never", "parked", "parking", "decide",
    "decision", "decisions", "question", "questions", "owner", "surface", "surfaced", "surfacing",
    "because", "instead", "though", "while", "until", "something", "anything", "everything",
    "whether", "wrote", "written", "writing", "thing", "things", "other", "another", "answer",
}


def project_dir(data: dict) -> str:
    return (
        os.environ.get("CLAUDE_PROJECT_DIR")
        or (data.get("cwd") if isinstance(data, dict) else None)
        or os.getcwd()
    )


# --------------------------------------------------------------------------- skip flag
def skip_state(pdir: str) -> str:
    """'skip' | 'empty' | 'none'. Consumed on read, so a stale flag cannot silence a later turn."""
    path = os.path.join(pdir, ".claude", "plan-park-skip.flag")
    try:
        if not os.path.isfile(path):
            return "none"
        fresh = (time.time() - os.stat(path).st_mtime) < SKIP_TTL
        reason = open(path, encoding="utf-8", errors="replace").read().strip()
        try:
            os.remove(path)
        except OSError:
            pass
        if not fresh:
            return "none"
        return "skip" if reason else "empty"
    except OSError:
        return "none"


# --------------------------------------------------------------------------- block budget
def block_budget_left(session_id: str) -> bool:
    """Bounded replacement for the usual unconditional `stop_hook_active` early exit.

    `instrument-corroboration-gate.py` bailed the moment any other Stop hook had already fired,
    and with 64 armed Stop hooks that meant it stood down on precisely the turns it was built
    for. A counter keeps the gate working during an in-progress stop while still guaranteeing
    the turn can end.
    """
    if not session_id:
        return True
    path = os.path.join(tempfile.gettempdir(), f"plan-park-gate-{session_id}.count")
    try:
        n = int(open(path, encoding="utf-8").read().strip() or "0")
    except (OSError, ValueError):
        n = 0
    return n < MAX_BLOCKS


def record_block(session_id: str) -> None:
    if not session_id:
        return
    path = os.path.join(tempfile.gettempdir(), f"plan-park-gate-{session_id}.count")
    try:
        n = int(open(path, encoding="utf-8").read().strip() or "0")
    except (OSError, ValueError):
        n = 0
    try:
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(str(n + 1))
    except OSError:
        pass


# --------------------------------------------------------------------------- transcript
def read_transcript(path: str):
    if not path or not os.path.exists(path):
        return None
    out = []
    try:
        with open(path, encoding="utf-8", errors="replace") as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                try:
                    out.append(json.loads(line))
                except ValueError:
                    continue
    except OSError:
        return None
    return out


def last_assistant_text(records) -> str:
    text = ""
    for rec in records or []:
        msg = rec.get("message") or {}
        if msg.get("role") != "assistant" and rec.get("type") != "assistant":
            continue
        content = msg.get("content")
        if isinstance(content, str) and content.strip():
            text = content
        elif isinstance(content, list):
            for block in content:
                if isinstance(block, dict) and block.get("type") == "text" and block.get("text", "").strip():
                    text = block["text"]
    return text


def _iso_to_epoch(stamp: str):
    if not stamp:
        return None
    try:
        cleaned = stamp.replace("Z", "+00:00")
        import datetime

        return datetime.datetime.fromisoformat(cleaned).timestamp()
    except (ValueError, TypeError):
        return None


def turn_start_epoch(records):
    """Timestamp of the most recent genuine user PROMPT, i.e. when this turn began.

    Falls back to the first record in the transcript, then to None. None means the commit half of
    the git check is skipped, never that the gate guesses.
    """
    if not records:
        return None
    latest = None
    for rec in records:
        if rec.get("type") != "user":
            continue
        content = (rec.get("message") or {}).get("content")
        is_prompt = isinstance(content, str) or (
            isinstance(content, list)
            and any(isinstance(b, dict) and b.get("type") == "text" for b in content)
        )
        if is_prompt:
            ts = _iso_to_epoch(rec.get("timestamp"))
            if ts:
                latest = ts
    if latest:
        return latest
    return _iso_to_epoch((records[0] or {}).get("timestamp"))


# --------------------------------------------------------------------------- message cleaning
FENCE_RE = re.compile(r"```.*?```", re.S)
INLINE_CODE_RE = re.compile(r"`[^`]*`")
QUOTE_LINE_RE = re.compile(r"^\s*>.*$", re.M)
DOUBLE_QUOTED_RE = re.compile(r"[\"“][^\"”]{0,400}[\"”]")


def strip_non_claims(text: str) -> str:
    """Remove code fences, inline code, blockquotes and quoted speech.

    Quoting the owner's own words about parking, or pasting a plan line, is reporting, not
    parking. Without this the gate fires on every turn that discusses itself.
    """
    text = FENCE_RE.sub(" ", text)
    text = INLINE_CODE_RE.sub(" ", text)
    text = QUOTE_LINE_RE.sub(" ", text)
    text = DOUBLE_QUOTED_RE.sub(" ", text)
    return text


def park_sentences(text: str):
    """Every sentence-ish chunk of the closing message that makes a park claim.

    A strong phrase counts on its own. A weak phrase counts only when its sentence also carries a
    colon or a question mark, so "that's your call, not me deferring" stays silent while
    "your call: 11px or 13px?" does not.
    """
    cleaned = strip_non_claims(text or "")
    chunks = re.split(r"(?<=[.!?])\s+|\n+", cleaned)
    out = []
    for chunk in chunks:
        chunk = chunk.strip()
        if not chunk:
            continue
        if PARK_CLAIM_RE.search(chunk):
            out.append(chunk)
        elif WEAK_CLAIM_RE.search(chunk) and WEAK_QUALIFIER_RE.search(chunk):
            out.append(chunk)
    return out


# --------------------------------------------------------------------------- git proof
def _git(pdir: str, *args: str, timeout: float = 8.0):
    """Returns stdout, or None on any failure. None means 'git could not answer', never 'nothing'."""
    try:
        r = subprocess.run(["git", "-C", pdir, *args], capture_output=True, text=True, timeout=timeout)
    except (OSError, subprocess.SubprocessError):
        return None
    if r.returncode != 0:
        return None
    return r.stdout


def plan_lines_added(pdir: str, since_epoch):
    """Lines added to `_plans/**.md` by THIS session, proven by git. None when git cannot answer.

    WHICH FILES counts is delegated to `_session_files.files_written_this_session`, the shared
    helper written for exactly this question after the mtime false positive. It already knows the
    two honest answers, dirty in the working tree or landed in a commit made since the session
    started, and it already knows that a worktree checkout restamping a file is neither.

    WHICH LINES is this function's own work, because the shared helper deliberately answers at
    file granularity and a park needs a line. Three sources, because a plan line can legitimately
    be in any of these states when the turn ends:
      1. `git diff HEAD -- <file>`         : edited, not yet committed (staged or not)
      2. an untracked file                 : read whole, every line counts as added
      3. `git log --since=@turn_start -p`  : committed during this turn

    THE FAILURE DISTINCTION, which is the part that matters. The shared helper returns an empty
    set both when nothing was written and when git broke, and those two must not be confused here:
    "nothing written" is the block condition and "git broke" must be silence. So this function
    runs its own two probes first, `rev-parse` and `status`, and returns None if either cannot
    answer. Only past that point does an empty result mean an empty result.

    Known looseness, stated rather than hidden: source 1 is not turn-scoped, so a plan file left
    dirty by an earlier turn still reads as written. Arm B's keyword check is what keeps that from
    being a free pass, and it is not airtight. Snapshotting the tree at every turn start would
    close it and costs more than the failure is worth.
    """
    if _git(pdir, "rev-parse", "--is-inside-work-tree") is None:
        return None
    if _git(pdir, "status", "--porcelain", "--untracked-files=all") is None:
        return None

    try:
        written = files_written_this_session(pdir, since_epoch)
    except Exception:
        return None

    plan_files = sorted(
        p for p in written
        if p.startswith(PLAN_DIR + "/") and p.endswith(".md")
    )
    if not plan_files:
        return []  # git answered, and the answer is that no plan file was written

    added: list[str] = []
    for rel in plan_files:
        diff = _git(pdir, "diff", "HEAD", "--unified=0", "--", rel)
        if diff:
            for line in diff.splitlines():
                if line.startswith("+") and not line.startswith("+++"):
                    added.append(line[1:])
        elif not _git(pdir, "ls-files", "--error-unmatch", "--", rel):
            # untracked: the whole file is new, so every line is an added line
            try:
                with open(os.path.join(pdir, rel), encoding="utf-8", errors="replace") as fh:
                    added.extend(fh.read().splitlines())
            except OSError:
                continue

    if since_epoch:
        log = _git(pdir, "log", f"--since=@{int(since_epoch)}", "--unified=0", "-p",
                   "--pretty=format:", "--", PLAN_DIR)
        if log is None:
            return None
        for line in log.splitlines():
            if line.startswith("+") and not line.startswith("+++"):
                added.append(line[1:])

    return added


# --------------------------------------------------------------------------- arms
def distinctive_words(text: str):
    words = {w.lower() for w in re.findall(r"[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ-]{4,}", text or "")}
    return {w for w in words if w not in STOPWORDS}


def already_parked(pdir: str, claims) -> bool:
    """True when an OPEN PARKED line for this same decision is already in the plan files.

    Same distinctive-word technique arm B uses on freshly added lines, pointed at what is on disk
    instead. Conservative on purpose: it needs at least two distinctive words in common, so a park
    that merely shares the word "design" with an existing row still gets its own line.
    """
    claim_words = distinctive_words(" ".join(claims))
    if len(claim_words) < 2:
        return False
    plans = os.path.join(pdir, "_plans")
    if not os.path.isdir(plans):
        return False
    for root, _dirs, names in os.walk(plans):
        for name in names:
            if not name.endswith(".md"):
                continue
            try:
                with open(os.path.join(root, name), encoding="utf-8", errors="replace") as fh:
                    for line in fh:
                        if not PARK_LINE_RE.search(line):
                            continue
                        body = question_text(line).lower()
                        hits = [w for w in claim_words
                                if re.search(r"\b" + re.escape(w) + r"\b", body)]
                        if len(hits) >= 2:
                            return True
            except OSError:
                continue
    return False


def main() -> int:
    try:
        data = json.load(sys.stdin)
    except ValueError:
        return 0
    if not isinstance(data, dict):
        return 0

    pdir = project_dir(data)
    session_id = str(data.get("session_id") or "")

    if not block_budget_left(session_id):
        return 0

    state = skip_state(pdir)
    if state == "skip":
        return 0

    records = read_transcript(data.get("transcript_path") or "")
    final = last_assistant_text(records) if records else (data.get("last_assistant_message") or "")
    if not final:
        return 0  # cannot see the message: fail open, never brick a turn on a blind guess

    claims = park_sentences(final)

    # 2026-08-10, owner: "literally told you about making plan before you actually go further
    # because it keep forgetting, and you can add stuff to the plan when I tell you to. We didn't
    # do that either."
    #
    # SECOND ARM, same gate rather than a new one. This file already enforces "a decision that only
    # lives in a reply dies with the context window". A CORRECTION from him is the same thing from
    # the other direction: he tells me I got something wrong, I fix the code, and the correction
    # itself is never written down, so the next session re-derives the wrong reading. That happened
    # today with the hamburger: it went into the code and the taste log and never into the plan.
    #
    # So a turn where HE corrected me must also leave a line in a plan file.
    corrected = bool(OWNER_CORRECTION_RE.search(owner_message(records)))
    if not claims and not corrected:
        return 0

    added = plan_lines_added(pdir, turn_start_epoch(records))
    if added is None:
        return 0  # git could not answer, so this gate has no proof and does not speak

    if corrected and not claims:
        # any new plan line at all satisfies this arm: the point is that it is written down,
        # not that it carries the PARKED marker, which is for open questions rather than settled
        # corrections.
        if added:
            return 0
        print(
            "HIS CORRECTION IS NOT IN THE PLAN (owner 2026-08-10: \"literally told you about making\n"
            "plan before you actually go further because it keep forgetting, and you can add stuff\n"
            "to the plan when I tell you to. We didn't do that either\").\n\n"
            "He corrected you this turn and no file under _plans gained a line (checked with git,\n"
            "not timestamps).\n\n"
            "THE CASE, from the day he said it: he corrected the hamburger from a circle back to a\n"
            "square. It went into the code and into the taste log, and never into the plan, so the\n"
            "plan still described the version he had just rejected.\n\n"
            "FIX: add one line to the plan this work belongs to, in his words, then continue:\n\n"
            "    - [x] CORRECTION <date> · <what he said, quoted> · <what changed because of it>\n",
            file=sys.stderr,
        )
        record_block(session_id)
        return 2

    if not claims:
        return 0

    park_lines = [ln for ln in added if PARK_LINE_RE.search(ln)]

    # ALREADY PARKED ON AN EARLIER TURN, added 2026-08-22 after this arm demanded a duplicate.
    # It only ever looked at lines added THIS turn, so merely REPORTING a still-open park, which is
    # what the say-whats-next rule asks every closing message to do, read as a fresh unrecorded
    # park. The real case: the customer-severity ladder was parked in his own words on 2026-08-21,
    # the line is in the plan file, and saying "still open: the customer-severity ladder" the next
    # day was refused unless a SECOND line for the same decision was written. Two rows for one
    # decision is precisely what this gate exists to prevent, so the demand was self-defeating.
    if not park_lines and already_parked(pdir, claims):
        return 0

    today = time.strftime("%Y-%m-%d")
    recipe = (
        "Add ONE line per parked decision to the plan file this work belongs to, in this exact "
        "shape, then stop:\n\n"
        f"    - [ ] PARKED {today} · <the decision, written as a question he can answer> · "
        "from: <what raised it>\n\n"
        "`PARKED` is uppercase and the date is required. That marker is what puts the row on the "
        "standing open-decisions page, which is the only reason parking it is allowed at all. "
        "It leaves that page when the same line gains `ANSWERED <date>: <his words>` or "
        "`DROPPED <date>: <why>`. Ticking the box does nothing on its own."
    )

    if not park_lines:
        print(
            "PLAN-PARK GATE (owner 2026-08-07, decision 13: \"but actually added to the plan ... "
            "we will serve, like, a plan gate\").\n\n"
            "Your closing message parks a decision:\n  \"" + claims[0][:240] + "\"\n"
            "and no _plans file gained a PARKED line this turn (checked with git, not file "
            "timestamps).\n\n"
            "A park that lives only in a reply is a park that dies with the context window. "
            "Measured: LAW_IMPROVE_2026-07-27 asked five owner decisions, LAW_IMPROVE_2026-08-03 "
            "asked the same five verbatim seven days later, and all five are still open. The "
            "oldest item parked this way is 40 days old.\n\n" + recipe,
            file=sys.stderr,
        )
        record_block(session_id)
        return 2

    claim_words = distinctive_words(" ".join(claims))
    if len(claim_words) >= 2:
        line_blob = " ".join(question_text(ln) for ln in park_lines).lower()
        overlap = [w for w in claim_words if re.search(r"\b" + re.escape(w) + r"\b", line_blob)]
        if not overlap:
            print(
                "PLAN-PARK GATE, arm B (the line does not match the park).\n\n"
                "Your closing message parks:\n  \"" + claims[0][:240] + "\"\n"
                "and a PARKED line WAS added this turn, but it shares no distinctive word with "
                "what you said you parked:\n  " + "\n  ".join(park_lines[:3]) + "\n\n"
                "Either the parked decision is missing its own line, or the line is worded so "
                "differently that the standing page will not read as the same question he was "
                "told about. Write the decision in his words.\n\n" + recipe,
                file=sys.stderr,
            )
            record_block(session_id)
            return 2

    # PASS, and this turn genuinely parked something. Regenerate the standing page now, while the
    # facts are fresh, so it can never be one turn behind the plan files. Best effort by design:
    # a generator failure must never turn a passing turn into a blocked one.
    regenerate_page(pdir)
    return 0


def regenerate_page(pdir: str) -> None:
    script = os.path.join(pdir, "scripts", "build-open-decisions.py")
    if not os.path.isfile(script):
        return
    try:
        subprocess.run([sys.executable, script], capture_output=True, timeout=20,
                       env={**os.environ, "CLAUDE_PROJECT_DIR": pdir})
    except (OSError, subprocess.SubprocessError):
        pass


# --------------------------------------------------------------------------- self-test
def selftest() -> int:
    """Seventeen assertions in throwaway git repos, so every trigger is a real one.

    Two of them, 14 and 15, are replays of REAL session-final messages rather than invented
    strings. That is the difference between a tested gate and a validated one, and it is owner
    decision 5 applied to this instrument before anyone is asked to trust it.
    """
    tests = []

    def transcript(text, user_ts="2026-08-07T10:00:00.000Z"):
        tf = tempfile.NamedTemporaryFile("w", suffix=".jsonl", delete=False)
        tf.write(json.dumps({"type": "user", "timestamp": user_ts,
                             "message": {"role": "user", "content": "go"}}) + "\n")
        tf.write(json.dumps({"type": "assistant", "timestamp": user_ts,
                             "message": {"role": "assistant",
                                         "content": [{"type": "text", "text": text}]}}) + "\n")
        tf.close()
        return tf.name

    # Unique per run. The block-budget counter lives in tempdir keyed by session id, so a fixed
    # id would carry a used-up budget from the previous run into the next one and turn the budget
    # case green for the wrong reason. (It did, on the first run of this file.)
    run_tag = f"selftest-{os.getpid()}-{int(time.time())}"

    def run(text, pdir, session="s1"):
        payload = json.dumps({"transcript_path": transcript(text),
                              "session_id": f"{run_tag}-{session}", "cwd": pdir})
        r = subprocess.run([sys.executable, __file__], input=payload, capture_output=True,
                           text=True, env={**os.environ, "CLAUDE_PROJECT_DIR": pdir})
        return r.returncode

    def fresh_repo(stack):
        d = stack.enter_context(tempfile.TemporaryDirectory())
        for args in (["init", "-q"], ["config", "user.email", "t@t.t"], ["config", "user.name", "t"]):
            subprocess.run(["git", "-C", d, *args], capture_output=True)
        os.makedirs(os.path.join(d, "_plans"), exist_ok=True)
        os.makedirs(os.path.join(d, ".claude"), exist_ok=True)
        with open(os.path.join(d, "_plans", "WORK.md"), "w") as fh:
            fh.write("# work\n- [x] something done\n")
        subprocess.run(["git", "-C", d, "add", "-A"], capture_output=True)
        subprocess.run(["git", "-C", d, "commit", "-q", "-m", "base"], capture_output=True)
        return d

    import contextlib

    with contextlib.ExitStack() as stack:
        # 1. parks, wrote nothing -> BLOCK
        d = fresh_repo(stack)
        tests.append(("parks with no plan line",
                      run("Done. I parked the eyebrow size question for you.", d, "a1"), 2))

        # 2. parks, wrote the canonical line -> PASS
        d = fresh_repo(stack)
        with open(os.path.join(d, "_plans", "WORK.md"), "a") as fh:
            fh.write("- [ ] PARKED 2026-08-07 · What size is an eyebrow, 11 or 13? · from: LOCKFILE\n")
        tests.append(("parks and wrote the line",
                      run("Done. I parked the eyebrow size question for you.", d, "a2"), 0))

        # 3. no park claim at all -> PASS
        d = fresh_repo(stack)
        tests.append(("no park claim",
                      run("Done. The header is fixed and here is the link.", d, "a3"), 0))

        # 4. lowercase prose "parked:" is NOT the marker -> BLOCK
        #    This is the 40-day ab-CHF shape, and it must not satisfy the gate.
        d = fresh_repo(stack)
        with open(os.path.join(d, "_plans", "WORK.md"), "a") as fh:
            fh.write("| 1 | row | ACTIVE | detail | parked: the eyebrow size thing |\n")
        tests.append(("lowercase prose parked: does not count",
                      run("Done. I parked the eyebrow size question for you.", d, "a4"), 2))

        # 5. line committed during the turn (not dirty) -> PASS
        d = fresh_repo(stack)
        with open(os.path.join(d, "_plans", "WORK.md"), "a") as fh:
            fh.write("- [ ] PARKED 2026-08-07 · What size is an eyebrow? · from: LOCKFILE\n")
        subprocess.run(["git", "-C", d, "add", "-A"], capture_output=True)
        subprocess.run(["git", "-C", d, "commit", "-q", "-m", "park it"], capture_output=True)
        tests.append(("line committed this turn",
                      run("Done. I parked the eyebrow size question for you.", d, "a5"), 0))

        # 6. brand-new untracked plan file carrying the line -> PASS
        d = fresh_repo(stack)
        with open(os.path.join(d, "_plans", "NEW.md"), "w") as fh:
            fh.write("- [ ] PARKED 2026-08-07 · What size is an eyebrow? · from: LOCKFILE\n")
        tests.append(("untracked new plan file",
                      run("Done. I parked the eyebrow size question for you.", d, "a6"), 0))

        # 7. arm B: a PARKED line exists but is about something else entirely -> BLOCK
        d = fresh_repo(stack)
        with open(os.path.join(d, "_plans", "WORK.md"), "a") as fh:
            fh.write("- [ ] PARKED 2026-08-07 · Should the booking sidebar keep its hairline? · from: PDP\n")
        tests.append(("arm B, line is about something else",
                      run("Done. I parked the eyebrow typography question for you.", d, "a7"), 2))

        # 8. THE FALSE POSITIVE THIS GATE MUST NOT HAVE: quoting park language, parking nothing.
        d = fresh_repo(stack)
        quoting = ('The owner said: "park it, keep going, surface it at the end". '
                   'The old rule told me to write `parked decisions` into ACTIVE.md.')
        tests.append(("quotes park language only", run(quoting, d, "a8"), 0))

        # 9. non-repo directory: git cannot answer, so the gate must stay silent
        nd = stack.enter_context(tempfile.TemporaryDirectory())
        tests.append(("non-repo fails open",
                      run("Done. I parked the eyebrow size question for you.", nd, "a9"), 0))

        # 10. skip flag with a reason -> PASS, and it is consumed
        d = fresh_repo(stack)
        with open(os.path.join(d, ".claude", "plan-park-skip.flag"), "w") as fh:
            fh.write("owner answered it live in this turn\n")
        first = run("Done. I parked the eyebrow size question for you.", d, "a10")
        second = run("Done. I parked the eyebrow size question for you.", d, "a10b")
        tests.append(("skip flag with reason", first, 0))
        tests.append(("skip flag is consumed, second stop blocks", second, 2))

        # 11. THE MEASURED FALSE POSITIVE. The first draft of PARK_CLAIM_RE fired on this exact
        #     sentence, which reports on parking and parks nothing. Kept as a permanent case so a
        #     later widening of the regex has to break a test before it breaks a turn.
        d = fresh_repo(stack)
        meta = ("I measured the parking failure. The old law told me to write parked decisions "
                "into ACTIVE.md, and that section does not exist. Five owner decisions were "
                "re-asked verbatim seven days later.")
        tests.append(("meta report about parking stays silent", run(meta, d, "a11"), 0))

        # 12. a labelled park block, no first-person verb -> BLOCK
        d = fresh_repo(stack)
        tests.append(("labelled 'Open decision:' block",
                      run("Header shipped.\n\nOpen decision: 11px or 13px for the eyebrow?", d, "a12"), 2))

        # 13. the block budget bounds the gate: three blocks, then it stands down
        d = fresh_repo(stack)
        msg = "Done. I parked the eyebrow size question for you."
        budget = [run(msg, d, "a13") for _ in range(4)]
        tests.append(("budget: blocks 1-3", budget[:3], [2, 2, 2]))
        tests.append(("budget: 4th stop is allowed through", budget[3], 0))

        # 14 and 15. REPLAYED FROM REAL SESSION-FINAL MESSAGES, which is what makes this gate
        # validated rather than merely tested (owner decision 5: an instrument must reproduce a
        # verdict already given before it is trusted).
        #
        # 14 is a bare weak phrase with no colon and no question mark. It parks nothing, it
        # explains who owns a stop. Must stay silent.
        d = fresh_repo(stack)
        real_quiet = ("I am not starting an action now on purpose: you are ending the session, "
                      "and anything I start dies with it. That is your call, not me deferring.")
        tests.append(("real message, weak phrase parking nothing", run(real_quiet, d, "a14"), 0))

        # 15 is a real park of a real decision. It was never written into a plan file, and the
        # question it parked is still open today (`_plans/ESTATE_AUDIT_2026-07-11.md:40`, folding
        # SOLEN_UI.md into fable-frontend, asked 2026-07-11). Must block.
        d = fresh_repo(stack)
        real_park = ("Estate audit fully applied. The only untouched item is the one you told me "
                     "to leave out, and it is genuinely your call: fold SOLEN_UI.md into "
                     "fable-frontend, and keep or bin the compact-draft.")
        tests.append(("real message, genuine park of a still-open decision",
                      run(real_park, d, "a15"), 2))

    ok = True
    for name, got, want in tests:
        hit = got == want
        ok = ok and hit
        verdict = "ok" if hit else ("MISSED" if want == 2 else "FALSE POSITIVE")
        print(f"{name}: exit {got} (want {want}) {verdict}")
    print("SELFTEST", "OK" if ok else "FAILED")
    return 0 if ok else 1


if __name__ == "__main__":
    try:
        sys.exit(selftest() if "--selftest" in sys.argv else main())
    except Exception:
        sys.exit(0)