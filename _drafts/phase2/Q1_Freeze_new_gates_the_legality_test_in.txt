# Q1 DELIVERABLE , paste-ready text

Four edits. A1-A4 in `~/.claude/LAW_SYSTEM.md`, B1-B5 in `~/.claude/commands/harden.md`.
Anchors are exact current text so the orchestrator can match them.

---

## A1. `LAW_SYSTEM.md` , section 2 heading, one word

**Replace this line (line 32):**

```
## 2. What a LAW is (definition + the four tiers)
```

**With:**

```
## 2. What a LAW is (definition + the tiers)
```

(Needed because A2 adds a tier. Flagged for you in "open for owner" , this is the only heading change in the whole patch.)

---

## A2. `LAW_SYSTEM.md` , section 2, INSERT after the T3 bullet

**Anchor, insert immediately after these lines (47-49):**

```
- **T3 structural impossibility** , the action cannot physically happen: sandbox seatbelt
  denies the write, settings disable the flag, the tool is not registered. Strongest, used
  for security boundaries (bash cannot write hook dirs; unsandboxed commands disabled).
```

**Insert:**

```
- **TR reasoning move** , a change to how the agent THINKS, not to what it is allowed to do.
  Lettered and not numbered on purpose: T0-T3 are one ladder measuring how hard an action is
  blocked, and TR is not a rung on it. It does not beat a gate and it is not a weak gate. It
  answers a different question. T0-T3 ask "can this action happen"; TR asks "which move was
  missing". TR is the REQUIRED output when a failure is real but fails the legality test below,
  and it is the ONLY legal output for a judgment-shaped failure. It must live in one of exactly
  three places, all of which already exist and already fire on their own:
  - `~/.claude/PREFERENCES.md` , when the failure was a wrong CHOICE at a nameable tool call.
    `preference-inject.py` (armed in `~/.claude/settings.json`) matches the entry's `when:`
    against the call about to run and injects one BETTER line before the act. Precedent already
    in the file: `diagnose-the-gate-before-adding-one`, written 2026-08-03 for this exact class.
  - `~/.claude/agents/loop-reviewer.md` , when a SEPARATE PASS could have caught it. Precedent:
    the standing psychology lens, whose own text already names this role , "This is the
    enforcement path for the laws that are judgment calls, not regexes, so the main thread's
    fading memory is not what protects them."
  - the matching `~/.claude/skills/fable-*/SKILL.md` , when the failure was a wrong ORDER of
    work rather than one wrong choice. Loaded at task start by CLAUDE.md rule 14 and
    `fable-skill-trigger.py`.
  A move written anywhere else is a promise, and killing promises is why this file exists.
```

---

## A3. `LAW_SYSTEM.md` , section 2, REPLACE the whole "Rules for the tiers" block

**Replace lines 51-65 in full** (from `Rules for the tiers:` through the end of the mute bullet)
**with:**

```
Rules for the tiers:
- **New T2 gates are FROZEN (owner decision 2026-08-07, decision 1).** A gate is no longer the
  default answer to a mistake. It is a privilege a failure has to earn by passing the legality
  test below. Everything that fails it becomes a TR move. Nothing becomes nothing.
- **THE LEGALITY TEST , six questions, all must be YES.** One NO and the answer is TR.
  1. **Artifact-only.** Can the check decide from the artifact in front of it: the file being
     written, the command, the message text? If it needs a browser, a screenshot, a rendered
     page, a device, or the owner's eye, this is not a gate.
  2. **One right answer.** Would two competent readers, looking at the same artifact with no
     other context, reach the same verdict? If the answer depends on the screen, the content,
     or how it feels, that is taste, and taste is TR.
  3. **Cheap.** Is the check a regex, a path match, a file-exists, a JSON lookup, or a git
     query? A model call, a build, or a render is not cheap, and a check that is expensive gets
     resented into a skip flag no matter how correct it is.
  4. **Quiet, measured rather than guessed.** Estimate from `~/.claude/state/skip-flag-ledger.log`
     how often this class would produce a LEGITIMATE exception. Both ends of the boundary are
     measured, in the same ledger, over the same weeks. The MOCKUP gate family, which asks
     judgment questions (is this grounded in the real surface, is it in scope, is it based
     correctly), was skip-flagged 88 times in the seven days to 2026-08-03 across five flag
     names, and three consecutive weekly audits counted the same family at 72, then 58, then 56
     without ever resolving it. `pre-edit-drift-gate.sh`, which asks whether a literal hex or a
     retired token appears in a file, offers a skip flag of its own
     (`.claude/drift-gate-skip.flag`, pre-edit-drift-gate.sh:42) and has been used ZERO times in
     the ledger's entire 425-entry history. Same estate, same agents, same weeks. The difference
     is not discipline. One question has its answer sitting in the file; the other does not. If
     your proposed check sits on the mockup side of that line, it is not a gate.
  5. **Not superficial.** Could the agent satisfy the check by writing a string without doing
     the real work? If yes, redesign it to check a STRUCTURAL fact, or route to TR.
  6. **Unowned.** Does a gate for this class already exist? Read the gate index, not memory. If
     one does, this is a BINDING failure and section 6.9 (a) to (d) governs: diagnose whether it
     never fired (a hole), fired and was skip-flagged (calibration), or fired and was obeyed
     while the mistake still landed (a wrong rule), and fix THAT. Never a new sibling.
- Default NEW laws to T1. Promotion to T2 requires a recurrence (or an owner order) AND the
  legality test.
- Every T2 gate ships with: fail-open on exception, a skip flag with TTL, a self-test (block
  case + pass case piped through before wiring, rule 12.5), and test 5 above.
- **Every TR move ships with a REPRODUCTION TEST, the way a gate ships with a self-test.**
  Before the move is trusted, show it would have changed the outcome on a case that already went
  wrong: name the real incident (a transcript, a rejected mockup, a ledger entry), state what the
  move would have made the agent do differently at that exact moment, and state what the agent
  actually did instead. If you cannot name the incident, you are guessing at the cause and the
  move is not ready. This is owner decision 5 of 2026-08-07 (an instrument must reproduce a
  verdict he already gave before it is trusted) applied one level up, because a reasoning move is
  an instrument for a decision. The fourteen-attempt animation is the case it exists to prevent:
  every attempt carried a real measurement, and not one of the measurements had ever been checked
  against a verdict he had already given.
- **Every TR move names its own failure signal, in one line.** What does it look like when this
  move is being ignored, and where would that show up (a ledger theme, a skip flag, an owner
  complaint phrase)? A gate's failure has always been countable, which is the only reason "gates
  work, advice does not" was ever a measurable claim rather than a mood. Advice has never had a
  counter, so it could never be shown failing, tuned, or retired , only repeated. A TR move
  without a counter is that same unfalsifiable advice and does not ship.
- A misfiring gate gets TUNED, never silently disabled. A disabled gate is a lie: everyone
  believes the law is enforced and nobody is enforcing it.
- **Mute is disablement by a thousand cuts (2026-07-27).** A gate skip-flagged past a
  threshold in a rolling week is functionally the same lie as a silently-disabled gate, just
  spread across many small exceptions instead of one big one. Any skip flag used more than
  10 times in 7 days is flagged REQUIRES-DECISION at the next SessionStart (system-health-
  check.py invariant 9, reading skip-flag-ledger.log): the owner picks narrow-scope, merge-
  into-family, or retire. Until that decision lands, the flag count itself is the standing
  evidence that "wired" does not mean "enforcing." A gate that trips this threshold has also
  retroactively failed legality test 4 above, and the retire option is the honest default.
```

---

## A4. `LAW_SYSTEM.md` , section 3, REPLACE step 4

**Replace these two lines (92-93):**

```
4. **Recurrence check**: if the same class recurs despite T1, /harden it into a T2 gate.
   harden-when-flagged fires this mandate automatically when the owner flags a repeat.
```

**With:**

```
4. **Recurrence check, and THE FORK (amended 2026-08-07)**: if the same class recurs despite T1,
   run the legality test in section 2 BEFORE writing anything. Six yes -> /harden it into a T2
   gate. Any no -> write a TR move instead, in one of section 2's three homes, with its
   reproduction test and its failure signal. Either way, write down in one line which branch you
   took and why, in the same place the fix lands.
   **Failing the legality test is not a pass to do nothing, and that hole is what this amendment
   closes.** Until now the system had exactly two exits: a gate, or the literal phrase "not
   mechanically hookable because <reason>" (recurrence-harden-gate.py:15-16), which produces
   nothing at all. So every regex-shaped failure collected gates and every judgment-shaped
   failure collected a sentence. That is section 6.9's finding stated as a mechanism instead of a
   coincidence. harden-when-flagged still fires the mandate automatically when the owner flags a
   repeat; it now fires the FORK, not the gate.
   **Companion wiring, without which this amendment is inert.** Three armed gates currently
   accept ONLY a hook file as proof, so a turn that correctly answers TR gets blocked and will
   manufacture a throwaway gate to escape , making the sprawl worse, not better.
   `repeat-mistake-detector.py:125` requires a Write/Edit whose path contains `/.claude/hooks/`
   and ends `.py`. `recurrence-harden-gate.py:18-19` states "Memory files and skill edits do NOT
   count as enforcement". `harden-when-flagged.py:50` injects "build or extend a hook/gate". All
   three must add `PREFERENCES.md`, `agents/loop-reviewer.md` and `skills/fable-*/SKILL.md` to
   their accepted-proof set, with the REPRODUCTION TEST as the thing that makes the edit count
   (so a one-word touch does not satisfy them). Per section 6.9 this is a widening of three
   existing gates, never a fourth sibling.
```

---

## A5. `LAW_SYSTEM.md` , section 6, APPEND as item 10

**Append at the end of section 6 (after item 9, currently ending line 213):**

```
10. **New gates are frozen; the legality test decides (owner decision 2026-08-07, decision 1).**
   Section 6.8 named the sprawl and section 6.9 named the wrong reflex, and neither one stopped
   it, because both left "write a gate" as the default answer with only a cost attached to it.
   This law removes the default. A gate is now a privilege earned by passing the six-part
   legality test in section 2; everything else becomes a TR reasoning move; nothing becomes
   nothing. The counted state on the day of the decision: 247 hook files across the three hook
   directories (212 in `~/.claude/hooks` excluding the 11 already in `_retired/`, 30 in
   `.claude/hooks`, 5 in `scripts/hooks`), 18 of them armed nowhere at all, sitting against a
   durable ledger whose three most-repeated themes were the three with the most gates.
   The owner's own framing from the same day is the clearest statement of why more gates cannot
   be the answer: fourteen consecutive attempts at one animation, each one "verified" by a
   measurement, each one rejected by his eyes, because nobody had ever checked that the
   instrument could reproduce a verdict he had already given. A gate is an instrument. An
   unvalidated instrument does not become trustworthy by being duplicated.
```

---
---

# B. `~/.claude/commands/harden.md`

## B1. INSERT a new section 0, before `## 1. Pin the mistake down`

**Anchor, insert immediately after line 9** (the paragraph beginning "The premise (proven in this
user's own setup)...") **and before `## 1. Pin the mistake down`:**

```markdown
## 0. Decide whether this is even a gate (LEGALITY TEST, owner decision 2026-08-07)

New gates are FROZEN. Before writing a single line of hook code, answer these six about the
mistake in `$ARGUMENTS`, and put the answers in your reply. Six yes = build the gate, continue to
step 1. Any no = the answer is a REASONING MOVE, jump to step 3R.

1. **Artifact-only.** Can the check decide from the artifact in front of it (the file being
   written, the command, the message text)? If it needs a browser, a screenshot, a rendered page,
   a device, or the owner's eye , no.
2. **One right answer.** Would two competent readers of the same artifact reach the same verdict?
   If it depends on the screen, the content, or how it feels, that is taste , no.
3. **Cheap.** Is the check a regex, a path match, a file-exists, a JSON lookup, or a git query? A
   model call, a build, or a render is not cheap , no.
4. **Quiet.** Would this class produce near-zero legitimate exceptions? Look up the closest
   existing relative in `~/.claude/state/skip-flag-ledger.log`. The measured boundary: the mockup
   gate family, which asks judgment questions, was skip-flagged 88 times in the seven days to
   2026-08-03; `pre-edit-drift-gate.sh`, which asks whether a literal hex appears in a file, offers
   a skip flag and has never been used once in 425 logged skips. If your check sits on the mockup
   side of that line , no.
5. **Not superficial.** Could the agent satisfy the check by writing a string without doing the
   real work? If yes, redesign it to check a structural fact, or , no.
6. **Unowned.** Does a gate for this class already exist? Read the gate index, not memory. If one
   does, this is a BINDING failure, not a missing-gate problem: LAW_SYSTEM 6.9 (a) to (d).
   Diagnose whether it never fired (a hole), fired and was skip-flagged (calibration), or fired
   and was obeyed while the mistake still landed (a wrong rule), and fix that one thing. No new
   sibling , no.

Answering no is not a failure and it is not permission to do nothing. It routes the work to step
3R, which is a real deliverable with a real test, not a promise.
```

## B2. REPLACE the last line of section 1

**Replace (line 19):**

```
If you can't name a detectable signal, a hook can't catch it — say so and propose the closest checkable proxy instead of a vague one.
```

**With:**

```
If you can't name a detectable signal, a hook can't catch it. Say so and go to step 3R. Do NOT substitute the closest checkable proxy. A proxy gate fires on a signal that is not the mistake, so it misses the real cases and blocks innocent ones, which is exactly how this estate ended up with gate families that get skip-flagged dozens of times a week and a durable ledger whose most-repeated themes carry the most gates.
```

## B3. INSERT a new section 3R, after section 3 and before `## 4. Register it`

```markdown
## 3R. Write the reasoning move instead (when step 0 said no)

The deliverable is a TR move (LAW_SYSTEM section 2). Pick ONE home, by what actually went wrong:

| What went wrong | Home | Shape |
|---|---|---|
| A wrong CHOICE at a nameable tool call | `~/.claude/PREFERENCES.md` | `## <slug>` then `- when: <Tool>: <substring or /regex/>` then `- prefer:` `- over:` `- because:`. Fires before the act via `preference-inject.py`, already armed in `~/.claude/settings.json`. |
| Something a SEPARATE PASS could have caught | `~/.claude/agents/loop-reviewer.md` | one bullet under the standing lens: the law, what it looks like when broken, and whether it blocks or lands in `extraFindings` |
| A wrong ORDER of work | the matching `~/.claude/skills/fable-*/SKILL.md` | one numbered step inside the existing pipeline, placed at the point where it got skipped |

Then two things, both non-negotiable, because they are the entire difference between this and the
advice the 2026-07-06 retro condemned:

- **Reproduction test.** Show the move would have changed the outcome on a case that already went
  wrong. Name the real incident (a transcript, a rejected mockup, a ledger entry), state what the
  move would have made the agent do differently at that exact moment, and state what the agent
  actually did. No named incident means you are guessing at the cause and the move is not ready.
  This is owner decision 5 of 2026-08-07 applied to reasoning moves: an instrument must reproduce
  a verdict he already gave before it is trusted, and a reasoning move is an instrument.
- **A failure signal somebody can count later.** One line: what it looks like when this move is
  being ignored, and where that shows up (a ledger theme, a skip flag, an owner complaint phrase).
  A gate's failure was always countable, which is the only reason "gates work, advice does not"
  was a measurable claim. Advice never had a counter, so it could never be caught failing, tuned,
  or retired , only repeated. Give the move one.

Then skip to step 6. There is nothing to register in settings.json; all three homes are already
wired and fire on their own.
```

## B4. APPEND to section 5 (`## 5. Test before claiming it works`)

**Append at the end of section 5, after the "Don't register-and-hope" line:**

```
For a TR move there is no exit code to assert. Its test is the REPRODUCTION TEST in step 3R, and
it is not optional: an untested reasoning move is exactly the "I'll be careful next time" that
IMPROVE_SYSTEM section 1 was written to kill.
```

## B5. REPLACE section 6 (`## 6. Record it`) in full

**Replace the two existing bullets with:**

```
- **Gate**: append a one-liner to the user's memory in the rules-are-hooks family
  (`feedback_rules_are_hooks.md` lists the live gates) so the next session knows the gate exists
  and how to loosen it.
- **TR move**: the PREFERENCES entry, the lens bullet, or the skill step IS the record. Add one
  more line to the incident's domain ledger (LAW_SYSTEM section 5) naming which branch of the
  step-0 fork you took and why. Without that line, the next session reading the ledger sees an
  unfixed recurrence and reaches for gate N+1, which is the loop this whole freeze exists to break.
- Tell the user in ONE line, plain English: what changes, and what will look different next time.
  No gate name, no hook name, no exit code, no self-test score, no list of files touched
  (owner 2026-08-07, decisions 9a to 9c).
```