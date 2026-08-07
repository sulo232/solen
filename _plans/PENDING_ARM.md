<!-- The list of enforcement that EXISTS but RUNS NOWHERE. Committed on purpose so a gate built in
     one session is not silently lost and the pattern it was built for does not recur in the next.
     recurrence-harden-gate.py reads this file: a gate that genuinely cannot be armed is only
     accepted once it is named here. NOTE the correction below: "the sandbox blocks arming" was a
     Bash-only reading and is not true of the Write/Edit tool. -->
# PENDING ARM , enforcement written but not running

**Why this file exists (2026-08-07), and a correction written the same day.**

The original claim here was that a sandboxed session cannot write either settings.json, so a gate
can be built and self-tested but never armed. **That claim was wrong, and the owner called it out
as a hallucination.** Re-measured with two instruments: Bash and python get
`PermissionError: [Errno 1] Operation not permitted` on `~/.claude/hooks/` and on
`~/.claude/settings.json`, but the **Write tool created a file in `~/.claude/hooks/` on the first
try**, seconds after python was refused. `instrument-corroboration-gate.py` line 15 has recorded
the settings.json half of this since 2026-07-09: *"printf >> settings.json denied -> 'that file is
unwritable' (the Edit tool wrote it on the first try)"*. A Bash denial is a fact about Bash, never
about the estate.

So this file is NOT an excuse list. It is a ledger of enforcement that is currently armed nowhere,
whatever the reason. The 2026-08-01 self-audit found 20 gates in that state, 18 with green
self-tests, which is a real and recurring problem regardless of what caused it.

This file is the record that survives the session. Arm these from a session that can write
settings, or retire them by name.

## Currently on disk in `~/.claude/hooks/` and referenced by NO settings file

Counted 2026-08-07 against all four settings files (`~/.claude/settings.json`,
`~/.claude/settings.local.json`, `.claude/settings.json`, `.claude/settings.local.json`), minus
the 10 gates dispatched by `link-family-aggregator.py`, minus `SHELVED.txt` and
`_retired/RETIRED_GATES.md`. 18 of 211.

| gate | what it was built to stop |
|---|---|
| captured-reference-unread-gate.py | building from a reference that was captured but never read |
| chrome-consistency-gate.py | chrome drifting between surfaces |
| composed-not-written-gate.py | hand-writing a component instead of composing a registered one |
| fan-out-not-one-agent-gate.py | one agent doing work that should have fanned out |
| found-it-then-fix-it-gate.py | finding a defect and not fixing it |
| glyph-height-is-not-font-size-gate.py | copying a reference's type by glyph height |
| locked-value-gate.py | changing a LOCKFILE frozen literal |
| loop-does-not-report-gate.py | a loop that reports instead of finishing |
| measure-dont-ask-gate.py | asking the owner something measurable |
| measure-the-live-page-gate.py | measuring source instead of the rendered page |
| mockup-already-answered-gate.py | re-mocking a settled decision |
| no-intent-announcement-gate.py | announcing what I am about to do |
| no-permission-question-gate.py | asking permission for something already authorised |
| overstep-gate.py | doing more than was asked |
| plain-english-gate.py | jargon in a reply to the owner |
| scope-creep-gate.py | widening scope mid-task |
| subagent-phone-view-gate.py | a subagent verifying on desktop only |
| touch-action-scroll-gate.py | touch-action bugs that break scrolling |

**Correction on the record:** an earlier count this session said 48. That number read only
`~/.claude/settings.json` and missed `settings.local.json` (12 registrations), the aggregator's
10 dispatched gates, and the shelved/retired manifests. 18 is the checked number.

**Do not read this list as 18 things to arm.** Every one of them is a candidate for retirement
too. `LAW_SYSTEM.md` section 6.9 (2026-08-03) already recorded the measured verdict on this
whole approach: *"that reflex has never once worked here: the three most-repeated themes in the
durable ledger were, at the time of the audit, the three with the MOST gates."* Arming all 18
would make that worse, not better. The K workstream in
[SYSTEM_OVERHAUL_2026-08-07.md](SYSTEM_OVERHAUL_2026-08-07.md) decides which of them survive.
