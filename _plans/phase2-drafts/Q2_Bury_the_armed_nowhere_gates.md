# Q2 VERIFICATION, TOMBSTONES, AND COMMANDS

## PART 1. The count, verified independently

**Root set.** Every `*.py` and `*.sh` at the top level of `/Users/sulo/.claude/hooks/`: **212 files**.
(PENDING_ARM.md said 211. The difference is `_probe_writability.py`, created today at 12:16 by this
session's own writability re-measure and never cleaned up. The plan's number was right when written.)

**Checked against all four settings files**, by exact filename with token boundaries (a loose
substring match would have falsely counted `link-gate.py` as armed because `always-give-link-gate.py`
is in settings):
- `/Users/sulo/.claude/settings.json`
- `/Users/sulo/.claude/settings.local.json`
- `<worktree>/.claude/settings.json`
- `<worktree>/.claude/settings.local.json`

**Result: 173 armed, 10 dispatched inside `link-family-aggregator.py`, 8 named in `SHELVED.txt`,
0 named in `_retired/RETIRED_GATES.md`, 21 referenced nowhere.**

**Three of those 21 are not gates.** This is the one place the plan's list is incomplete, and it
matters, because two of the three should be deleted and the third must never be buried:

| file | what it is | disposition |
|---|---|---|
| `_probe_writability.py` | 1 line. Its own text: "temporary writability probe, 2026-08-07. Deleted immediately after the check." It was not deleted. | delete |
| `_write_tool_probe.py` | 13 lines. Its own text: "inert. Not a gate. Wired to nothing. Safe to delete." | delete |
| `_toolproof.py` | 224-line shared helper providing `ran_this_turn()`. **Imported by six ARMED gates:** dropped-directive, env-claim-needs-evidence, finding-provenance, no-invented-visual-motif, no-unrequested-removal, owner-punt. | add to SHELVED.txt, never bury |

**21 minus those 3 = 18 gates.** Identical to the PENDING_ARM.md list, name for name.

**Dependency check before moving anything.** No hook imports or invokes any of the 18. The only
cross-references are prose: `measure-dont-ask-gate.py` is named as a sibling inside two other
orphans' docstrings, and `wire-pending-gates.py` quotes `chrome-consistency-gate.py` and
`plain-english-gate.py` at lines 28 and 29 purely as docstring-format examples in a comment. Nothing
breaks at runtime.

---

## PART 2. Sorted into the three buckets

### (a) Covered by an armed gate. Safe to bury. Ten.
found-it-then-fix-it, loop-does-not-report, no-intent-announcement, no-permission-question,
measure-dont-ask, mockup-already-answered, composed-not-written, glyph-height-is-not-font-size,
measure-the-live-page, captured-reference-unread.

### (b) Not covered. Real protection disappears. Six.
touch-action-scroll, locked-value, subagent-phone-view, chrome-consistency, overstep,
fan-out-not-one-agent. **Detailed separately in PART 5.**

### (c) Obsolete because the rule changed. Two.
plain-english (superseded by decision Q9 the same day), scope-creep (its own successor diagnoses its
instrument as measuring the wrong thing).

---

## PART 3. Tombstone text

Append to `/Users/sulo/.claude/hooks/_retired/RETIRED_GATES.md`, above the existing
`## Going forward` section. Format matches the file's own line 10 spec exactly:
`- <filename> | <date> | <failure class it caught> | <why judged dead>`.

```markdown
## The 2026-08-07 burial, 18 gates armed nowhere

Owner decision Q2 of 2026-08-07 (`_plans/SYSTEM_DECISIONS_2026-08-07.md`): "Bury all 18
armed-nowhere gates. Anything genuinely needed comes back through rule 1." Rule 1 of the same
decision froze new gates except for things that are objective and cheap to check.

These 18 were on disk and referenced by no settings file, so none of them has ever run. That is
the whole reason they are here: an unarmed gate is not protection, it is a per-session reading tax
and a false sense of coverage. The count was re-verified on 2026-08-07 against all four settings
files, minus the 10 gates dispatched inside link-family-aggregator.py, minus SHELVED.txt.

Six of the 18 had no armed substitute. They are marked NOT COVERED below and were reported to the
owner as a named loss, not buried silently. Four of those six pass the rule-1 legality test and are
the re-entry candidates.

- captured-reference-unread-gate.py | 2026-08-07 (authored 2026-08-05) | a closing message that hedges how big a visual change will look ("a small visual delta on a 22px glyph") while a captured reference under _design-system/references/ already answers it and was never opened this turn | never armed, buried per owner decision Q2. The lane is already held by three armed gates: owner-sees-it-measure-it-gate.py blocks disputing a visual observation of his with no measurement in the turn, reference-check-gate.sh blocks a mockup citing a brand with no captured-ref file that exists, reference-measure-gate.py blocks a reference-derived mockup carrying no measured numbers. The residual this one added is a hedge-word match on my own prose, which tests vocabulary rather than history, so it is judgment-shaped and not legal under the 2026-08-07 gate-legality rule
- chrome-consistency-gate.py | 2026-08-07 (authored 2026-07-31) | a mockup whose chrome order (category row above search pill, or the inverse) disagrees with its sibling mockups in the same folder, after six rounds settling that order on one file while the home mockup kept the inverse the whole time | never armed, buried per owner decision Q2. NOT COVERED: this is the only check in the estate that compares two files against each other, and every other gate reads one file in isolation, which is the exact hole its docstring names ("consistency is a RELATIONSHIP, and nothing was checking relationships"). Reported to the owner as a loss and as a rule-1 re-entry candidate, since comparing element order across sibling files is objective and cheap
- composed-not-written-gate.py | 2026-08-07 (authored 2026-08-02) | a closing message describing a mockup as existing ("the whole file is composed", "the mockup has 56px rows", "both versions are ready") in a turn where every write of it was blocked and nothing reached disk | never armed, buried per owner decision Q2. Covered by show-me-means-show-me-gate.py (armed, 2026-08-07), which requires a screenshot, page read or navigation plus a handed-over link whenever the owner asks to see a surface, and by mockup-verify-before-show-gate.py (armed), which requires measured evidence before any mockup link is handed over. Both demand the artifact instead of punishing the description of it, which is the earlier and stronger form of the same rule
- fan-out-not-one-agent-gate.py | 2026-08-07 (authored 2026-08-03) | a single Agent dispatch carrying work that should have been carved into parallel slices (research a whole design system, audit every surface), which runs out of context and finishes far later than N agents doing a slice each | never armed, buried per owner decision Q2. NOT COVERED, and it points the same way as owner decision Q14b of the same date ("fan out MANY design subagents in parallel, never one at a time"), so burying it leaves that new decision with no enforcement at all. Judged dead as a GATE and not as a rule: "does this prompt describe big work" is a judgment call read off prose, not an objective cheap check, so under the rule-1 legality test it belongs in the orchestration brief rather than in a hook
- found-it-then-fix-it-gate.py | 2026-08-07 (authored 2026-08-01) | a closing message reporting a located or measured defect in past-tense discovery language ("found", "the cause is", "sits at", "still says") with nothing landed, so investigation becomes the deliverable while the defect is still on his screen | never armed, buried per owner decision Q2. Covered by flag-instead-of-fix-gate.py (armed, 2026-07-13), which blocks a reply that acknowledges a lock violation and recommends leaving it, and by no-permission-to-fix-gate.py (armed, 2026-08-05), which blocks a reply that names a specific change it is not making and asks whether to make it
- glyph-height-is-not-font-size-gate.py | 2026-08-07 (authored 2026-08-03) | reporting a type size taken from a dark-pixel bounding box, which includes descenders and therefore varies with which letters the sample happens to contain, so the same style measures 37px or 46px and a build gets sent 31% wrong | never armed, buried per owner decision Q2. Covered by mockup-width-calibration-gate.py (armed, 2026-07-21), whose own docstring names this identical defect verbatim ("glyph-height measurement swallows the active-tab underline, descender tails and the neighbouring letter, so the measured height comes out ~20-40% too tall") and blocks the mockup write unless it carries a word-width calibration proof. That is the same rule enforced before the file lands rather than after the reply is written, backed by reference-measure-gate.py (armed)
- locked-value-gate.py | 2026-08-07 (authored 2026-07-31) | an edit that moves a value the file itself marks LOCKED, in the same edit that chases a number the owner asked for (photo 5/4 to 16/9, then to a grid, then to 16/10, three rounds on one value in one session) | never armed, buried per owner decision Q2. NOT COVERED except partially: design-law-integrity-gate.py (armed) guards the design-law corpus (LOCKFILE.md, SOURCE.md, TASTE_LOG.md, the project CLAUDE.md, _BASE.md) against duplicate or contradicting additions, and approved-surface-guard.py (armed) guards files sitting under a slug in the approved-mockups ledger. Neither reads a LOCKED comment marker inside an ordinary mockup or component file, which is exactly where this one bit. Reported to the owner as a loss and as a rule-1 re-entry candidate
- loop-does-not-report-gate.py | 2026-08-07 (authored 2026-08-01) | ending a turn with unticked implementation boxes in the active plan after the owner asked for loop or batch execution, so he spends a turn saying "continue" | never armed, buried per owner decision Q2. Covered five times over by armed gates: finish-autonomously-gate.py, unfinished-batch-gate.py, defer-bulk-gate.py, no-defer-excuse-gate.py, plus the mid-turn nudge open-boxes-midturn.py. LAW_SYSTEM.md section 6.9 (2026-08-03) already measured stopping-early as one of the three most-repeated themes in the durable ledger AND as already sitting behind six gates, so this would have been the seventh gate on the worst-served class in the estate, which is the precise pattern section 6.9 rules out
- measure-dont-ask-gate.py | 2026-08-07 (authored 2026-08-01) | asking the owner a question whose answer is a position, a size, a count, a colour, a location on a page or which element, meaning anything a screenshot, a scroll or a grep would have returned | never armed, buried per owner decision Q2. Covered by owner-sees-it-measure-it-gate.py (armed, 2026-08-05) for the dispute form, by visual-question-needs-render-gate.py (armed, PreToolUse on AskUserQuestion, which stops a look-and-choose question at the moment it is asked instead of at the end of the turn), by no-permission-to-fix-gate.py (armed) for the offer-to-fix form, and by owner-punt-gate.py (armed) for the assign-him-a-chore form. Residual named honestly: a plain factual question about the rendered page that is neither a visual choice nor a fix offer is now unguarded
- measure-the-live-page-gate.py | 2026-08-07 (authored 2026-07-31) | a mockup write citing `Grounded-in: <something>.tsx` in a turn that never loaded the real route, so the mockup copies a dormant variant, a stale comment or a treatment the owner already rejected | never armed, buried per owner decision Q2. Covered by pre-edit-measure-first-gate.py (armed), which blocks any write under /_mockups/ unless a measurement ran this work session and explicitly counts a live getBoundingClientRect as the proof, by mockup-grounding-gate.sh (armed), which requires the cited Grounded-in path to actually exist, and by mockup-verify-before-show-gate.py (armed) at handover
- mockup-already-answered-gate.py | 2026-08-07 (authored 2026-08-01) | putting a design decision back to the owner when an approved mockup for that surface already answers it and the turn never opened the mockup, spending two of his turns on a question he settled weeks earlier by approving it | never armed, buried per owner decision Q2. Covered by mockup-parity-gate.py (armed), which forces the approved /dev mockup plus a compare instruction into the verifier's scope whenever a surface with an approved mockup is built, and by visual-question-needs-render-gate.py (armed), which refuses a look-and-choose question in a turn with no render
- no-intent-announcement-gate.py | 2026-08-07 (authored 2026-08-01) | closing a turn with a future-tense work announcement ("going now to fix the header stacking, then the three homepage directions"), which is a permission request with the question mark filed off | never armed, buried per owner decision Q2. Its own docstring already names the coverage: finish-autonomously-gate.py (armed) catches the "want me to?" and "stopping here" dialects and defer-bulk-gate.py (armed) catches the soft-defer dialect. A third sibling on the stopping-early class, which LAW_SYSTEM.md section 6.9 measured as the most over-gated class in the estate
- no-permission-question-gate.py | 2026-08-07 (authored 2026-07-31) | closing with a courteous fork question about work the owner already ordered ("wire the icons first, or keep going down the mockup list", "your call: fix the icons, or keep going") | never armed, buried per owner decision Q2. Covered by no-permission-to-fix-gate.py (armed, 2026-08-05), authored five days later on the same shape and actually wired, plus owner-punt-gate.py (armed) and defer-bulk-gate.py (armed)
- overstep-gate.py | 2026-08-07 (authored 2026-07-31) | a layout change (display, position, justify-content, padding, margin, width, absolute positioning) shipped under a content-only request: he asked to delete one invented line from the search bar and also got the icon group re-centred, side padding moved from 14 to 56, and the menu button pulled out of flow | never armed, buried per owner decision Q2. NOT COVERED except partially: approved-surface-guard.py (armed) blocks big or cumulative edits but only to files under a slug in the approved-mockups ledger, and no-unrequested-removal-gate.py (armed) only catches announced removals. On any surface not in that ledger there is now no write-time check that the KIND of change matches the KIND of ask. Reported to the owner as the largest single loss in this batch, with the honest caveat that the gate never ran, so its false-positive rate is unmeasured
- plain-english-gate.py | 2026-08-07 (authored 2026-07-31) | implementation vocabulary in the closing message ("composes SalonResultCard's DEFAULT variant", "the inset layers produce the moulded edge", "viewport 390x844") handed to a non-engineer reading on a phone | never armed, buried per owner decision Q2, and superseded as an APPROACH by owner decision Q9 of the same date, which says the reply itself is the problem and that the fix is to research how to write it and produce a reply-shape law, not another vocabulary blocklist. The mechanical half is already armed anyway: no-plumbing-in-reply-gate.py keeps gate and hook names out of the reply (which is Q9c) and reply-length-gate.py caps length and table-first shape. Arming a third reply-blocking Stop gate would also reproduce the pattern the owner killed by name on 2026-07-21, when concise-response-gate.py and always-recommend-gate.py were both neutered in the same minute because a Stop block forces a full re-send and he reads near-identical messages twice
- scope-creep-gate.py | 2026-08-07 (authored 2026-07-31) | an edit touching more distinct CSS rules than the owner's last message plausibly named, e.g. "the category pill shadow" answered with the search bar shadow AND the filter pill shadow AND the side gutter | never armed, buried per owner decision Q2, and obsolete on its own method. overstep-gate.py, written the same day about the same owner complaint, diagnoses this gate's instrument as wrong in its own docstring: "That gate counts how many CSS RULES an edit touches, and this edit touched three, which sits at its threshold. Counting rules is the wrong axis. The right axis is KIND." A rule count cannot separate a requested five-rule colour change from an unrequested one-rule layout change. Retiring the wrong instrument and keeping one check on the class is the consolidation LAW_SYSTEM.md section 6 rule 8 asks for
- subagent-phone-view-gate.py | 2026-08-07 (authored 2026-07-31) | an Agent or Workflow brief telling a subagent to look at a rendered UI while naming a desktop viewport first, or never naming a phone one, so the wrong looking happens inside another agent's context where no Stop gate can see it | never armed, buried per owner decision Q2. NOT COVERED: mobile-view-gate.py (armed) is a Stop gate that inspects my own reply and my own tool calls and has no view into a subagent brief, and subagent-uiwork-reminder.py (armed) runs after the subagent finishes and never blocks. Owner decision Q14b of 2026-08-07 makes this hole larger rather than smaller, since design work now fans out to many subagents by law. Reported to the owner as a loss and as a rule-1 re-entry candidate, since "does the brief name a phone width, and in what order" is objective and cheap
- touch-action-scroll-gate.py | 2026-08-07 (authored 2026-07-31) | adding a single-axis touch-action (`pan-x`, `pan-y` or `none`) to a CSS or HTML file, which forbids the other scroll axis for every touch starting on that element. The change that turned a merely short mockup into one the owner genuinely could not scroll on his phone, three complaints in a row | never armed, buried per owner decision Q2. NOT COVERED by anything, and it is the only gate in this batch that is structurally necessary rather than behavioural: touch-action is consulted ONLY for touch input, so a wheel gesture, scrollTo() and getBoundingClientRect are all blind to the bug by construction, and no instrument available in the browser pane can catch it. Reported to the owner as the strongest rule-1 re-entry candidate in the batch, since the check is three literal CSS values in a diff
```

---

## PART 4. The exact commands

**Important, and it changes what "one commit" can mean here.** `/Users/sulo/.claude` is **not a git
repository** (`git rev-parse --is-inside-work-tree` returns `fatal: not a git repository`). The
global hooks are not mirrored into the Solen repo either (only the project's own `.claude/hooks/`
is tracked). So there is **no `git mv` and no commit** for this move. Plain `mv`, and the only undo
is moving the files back out of `_retired/`.

**Second, and it decides where this runs.** Bash in a sandboxed session cannot write to
`~/.claude/hooks` at all: `touch ~/.claude/hooks/_perm_probe_q2.tmp` returns
`Operation not permitted`. The Write and Edit tools CAN write there, so **step 1 (the ledger) can be
applied from a normal session; steps 2 and 3 (the moves and deletes) cannot** and must run in the
owner's own Terminal or a session without that restriction.

**Order matters.** The ledger lines go in FIRST. `system-health-check.py` invariant 12 flags any file
in `_retired/` that has no matching line, so moving first creates 18 violations for however long the
gap lasts.

```bash
# STEP 1 (Write/Edit tool, works from a sandboxed session)
#   1a. Append the PART 3 block to ~/.claude/hooks/_retired/RETIRED_GATES.md,
#       above the existing "## Going forward" section.
#   1b. Append this block to ~/.claude/hooks/SHELVED.txt so _toolproof.py stops
#       counting as an orphan and is never buried by a later sweep:
#
#       # helper library, imported (not dispatched). Provides ran_this_turn(): reads the
#       # transcript to prove a tool actually ran this turn, instead of trusting my own prose
#       # that it did. Born 2026-08-05 from the fix-up-me sweep, which found 103 of 190 live
#       # checks satisfiable by writing a string. Verified 2026-08-07: imported by SIX ARMED
#       # gates (dropped-directive, env-claim-needs-evidence, finding-provenance,
#       # no-invented-visual-motif, no-unrequested-removal, owner-punt). Burying it breaks all six.
#       _toolproof.py

# STEP 2. Bury the 18. Plain mv: ~/.claude is not under version control.
cd ~/.claude/hooks
mv captured-reference-unread-gate.py       _retired/
mv chrome-consistency-gate.py              _retired/
mv composed-not-written-gate.py            _retired/
mv fan-out-not-one-agent-gate.py           _retired/
mv found-it-then-fix-it-gate.py            _retired/
mv glyph-height-is-not-font-size-gate.py   _retired/
mv locked-value-gate.py                    _retired/
mv loop-does-not-report-gate.py            _retired/
mv measure-dont-ask-gate.py                _retired/
mv measure-the-live-page-gate.py           _retired/
mv mockup-already-answered-gate.py         _retired/
mv no-intent-announcement-gate.py          _retired/
mv no-permission-question-gate.py          _retired/
mv overstep-gate.py                        _retired/
mv plain-english-gate.py                   _retired/
mv scope-creep-gate.py                     _retired/
mv subagent-phone-view-gate.py             _retired/
mv touch-action-scroll-gate.py             _retired/

# STEP 3. Two dead probe files. Not gates, so they get deleted rather than tombstoned.
rm ~/.claude/hooks/_probe_writability.py
rm ~/.claude/hooks/_write_tool_probe.py

# STEP 4. Verify. Expected after the move:
#   root .py + .sh count 212 -> 192
#   invariant 1  (orphans)        -> 0
#   invariant 11 (sprawl ceiling) -> 192, still over the 150 line, now 20 closer
#   invariant 12 (retired ledger) -> 0 unaccounted-for retirements
python3 ~/.claude/hooks/system-health-check.py
ls -1 ~/.claude/hooks/*.py ~/.claude/hooks/*.sh | wc -l
```

---

## PART 5. CATEGORY (b), READ THIS ONE. What actually disappears.

Six of the 18 have no armed substitute. Burying them is a real reduction in coverage, not a cleanup.
Four of the six pass your own rule-1 test (objective, cheap to check) and are the ones worth arming
rather than losing. Ordered by how much I think you lose.

**1. `touch-action-scroll-gate.py` (arm it).** Blocks `touch-action: pan-x`, `pan-y` or `none` on a
CSS or HTML file. This is the "I can't scroll anywhere" bug, and the reason no other gate can cover
it is structural: that property only applies to a real finger. A mouse wheel is not touch, `scrollTo()`
is not touch, and `getBoundingClientRect` cannot see it. Every scroll test available to me passed
while your phone was locked. It is also the cheapest possible check: three literal values in a diff.
Losing this one means the bug comes back and my instruments still cannot see it.

**2. `overstep-gate.py` (biggest loss, but the messiest call).** Blocks a layout change (padding,
width, position, flex direction) when your last message asked only for a content change. The case:
you asked to delete one line of invented text from the search bar and also got the icon group
re-centred, padding moved 14 to 56, and the menu button pulled out of flow. The only armed thing
nearby is `approved-surface-guard.py`, and it only watches files under a slug in the approved-mockups
ledger. Off that ledger there is now nothing. Caveat I owe you: half of its trigger is reading your
message for layout words, which is a heuristic, not an objective check, so it sits on the edge of
your rule 1. And it never ran, so nobody knows how often it would fire wrongly.

**3. `subagent-phone-view-gate.py` (arm it, and it got more important this week).** Blocks a subagent
brief that names a desktop viewport first or never names a phone one. `mobile-view-gate.py` is armed
but it only reads MY reply, so it cannot see what I wrote into someone else's brief. Your decision
Q14b now makes parallel design subagents the law, which means more work moves behind exactly this
blind spot, not less. Cheap and objective: does the brief say 390 before it says 1280.

**4. `locked-value-gate.py` (arm it).** Blocks an edit that changes a value the file itself marks
LOCKED. The case was the photo aspect ratio moving three times in one session, each time with a
reasonable-sounding paragraph attached. `design-law-integrity-gate.py` is armed but it only guards
the law documents (LOCKFILE, SOURCE, TASTE_LOG, CLAUDE.md, _BASE). It does not read a LOCKED comment
sitting next to a value in a mockup or a component, which is where this actually happened.

**5. `chrome-consistency-gate.py` (arm it, medium confidence).** The only check anywhere that
compares two files. Six rounds settling categories-above-search-bar on one file, while the home
mockup kept the inverse the whole time and nothing noticed, because every gate reads one file alone.
Lower confidence than the others only because its markers are regexes over class names, which drift.

**6. `fan-out-not-one-agent-gate.py` (do not arm, but the rule needs a home).** Blocks one agent
taking a job that should have been sliced across many. Nothing armed covers it, and your decision
Q14b explicitly wants the opposite behaviour enforced. But "is this prompt describing big work" is a
judgment read off prose, which is precisely what rule 1 says is not allowed to be a gate. So the
honest answer is that Q14b ships with no enforcement, and it needs to live in the orchestration brief
instead. Worth naming so it is a choice and not an oversight.