# One log reader, not fifteen (2026-08-26)

## The ask
Owner, one word: **"fix"**, answering a report that called this "a bigger job than tonight". Then,
asked how far to go: **"evrth but one by one carefully"**, and asked what to do when merging changes
a verdict: **fix it, and name every one**.

So: EVERYTHING, sequentially, each file verified before the next starts. Not a mass sweep.

## The measurement that scoped it
Taken across `~/.claude/hooks` before any edit:
- **129 files** read the session log in some way
- **15 of them carry their own copy** of the "is this the human speaking, or is it machinery"
  marker list, and **no two lists agree**

## The live bug the drift was already causing
Three of the fifteen (`resend-delta-gate`, `plain-english-gate`, `selftest-before-done-gate`) had
never heard of a `<task-notification>`, which is what the harness writes when a background agent
finishes. They read it as HIM speaking. **51 of those in one session.** For `resend-delta-gate`,
whose entire job is stopping him reading the same message twice, that means a finishing agent
between two of my messages made it believe he had replied, so it stopped looking.

That is the **third independent silencer** of that one check found in two days:
1. `reply-family-aggregator` exited early whenever any plan file held an open box, so writing a
   to-do list switched the check off. Removed 2026-08-25.
2. its own stand-down counter, left at 3 by my own replays.
3. this one.

## The shared module
`~/.claude/hooks/_lib/transcript.py`, suite 20/20. Exports `is_machinery`, `entries`, `spoken`,
`last_reply`, `last_unanswered_reply`, `last_owner_prompt`, `assistant_chain`, `blocked_pair`.

Two earlier attempts to centralise this exist and are NOT replaced, because they answer different
questions and both are armed: `_stopgate_lib.load_transcript_lines` (a caching line reader, no
speaker classification) and `_lib/notification_guard.py` (classifies an incoming prompt, not a
transcript entry).

## Method, one file at a time
1. Record the file's own suite score.
2. Replace each private reader's BODY with a call to the shared one. Name, signature and return
   shape unchanged, so no caller moves. The explanation stays; only the duplicated code goes.
3. Re-run the suite. Same or better, never weakened to pass.
4. Re-run the whole-estate before/after harness
   (`scratchpad/before-after.py`, 24 real cut points x 9 checks) and account for every verdict that
   moved.

## Branches, both arms decided now
**PLAN A** , the verdicts do not move, or move only where a named bug is being fixed. Commit that
file on its own, naming the change, and start the next.

**PLAN B** , a verdict moves and I cannot say which behaviour is right. Do NOT guess and do NOT
stop. Revert that one file, leave its private copy in place with a comment naming the exact
disagreement, and carry on to the next file. One unmigrated file is a far smaller cost than a check
that silently decides differently.

**PLAN C** , the shared module turns out to be missing a marker a private copy genuinely needed. It
goes into the shared module ONCE, with a test, never as a local exception. Then every already
migrated file is re-run.

**PLAN D** , a file has no suite of its own. Do not migrate it blind: write the smallest suite that
pins its current behaviour first, then migrate, then re-run.

## Done, in order, each verified before the next started
- [x] `_lib/transcript.py` built, then DEMOTED: see below
- [x] `_lib/already_read.py` , 158 lines of duplicated reading deleted
- [x] `resend-delta-gate.py` , 2 copies that had already drifted from each other
- [x] `plain-english-gate.py` , 4 copies, the most in one file
- [x] `selftest-before-done-gate.py`, `dictation-decode.py`, `pick-reading-gate.py`,
      `finish-autonomously-gate.py`
- [x] `pushback-gate.py`, `owner-sees-it-measure-it-gate.py`, `reply-shape-preflight.py`
- [x] `link-verified-gate.py`, `_toolproof.py`

## The mistake I made in the middle of it, kept because it is the same mistake
I measured 15 private copies, built a shared module to end them, and never found that a SIXTEENTH
already existed: `hooks/_turnboundary.py`, shared by ~29 gates since 2026-07-31. Rule 12 says
research before building. I did the measurement and still missed it, because I searched for the
marker STRINGS rather than for anything already answering the question.

It is older and better measured, so it is the authority and mine defers to it. Its numbers, none of
which mine had: 254 real ESC interruptions written into the user slot, 239 of 2,844 real owner
messages thrown away by an earlier version requiring string content, 46% of one gate's 127 blocks
landing on text he never wrote.

## Result
| | start | end |
|---|---|---|
| files with a private copy | 15 | 1, and that one is comments and fixtures |
| verdicts moved, 240 real runs | , | 2, both the same named bug, both BLOCK to PASS |
| suites passing | , | 19 of 19 |

The two moved verdicts are the same fault in two places: a finished background agent read as HIS
message. In `plain-english-gate` it had disabled the loop protection entirely; in
`link-verified-gate` it reset the turn window so the gate demanded proof that already existed. The
second is the exact failure `_turnboundary.py` was written for on 2026-07-31, still live in the one
gate it was named after, because that gate kept its own copy.

## Still open
- [ ] `delegate-media-read-gate.py` is the last name on the list and needs no change: its markers
      are in comments and test fixtures, not in a live pattern. Left as a box so the claim gets
      re-checked rather than trusted.
