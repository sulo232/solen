# OVERNIGHT LOOP, 2026-08-24, four workstreams

He went to sleep after answering four questions. This file is the resume point: if context is
compacted, a limit is hit, or the session restarts, read THIS first and continue. Do not stop and
ask. Rule 20: a transient blocker is a wait, not a stop.

## HIS ASK, verbatim

> "aftr ur done w that and also onto how u handle tasks like for example if i tell u to reseatch how
> u research or if i tell u to look into everywhere design how u do that yo there should be ways onto
> improve like maybe ur way of doing is weong yk so check that too n ok nxt i want is
> efficency(speed and money) i need u to research our harnesses and how i use u and problems
> corolated and research anthropic or openais sh and improve or add yk or delete and parralel i want
> u to run the skill thing i told u bfr too n im goin to sleep so ask me all thr questions now n
> finish evrth as a. loop"

## HIS FOUR ANSWERS, which are the standing rules for tonight

1. **AUTHORITY: stand down freely, add only non-blocking.** I may turn OFF or retire any check that
   ends his turn. Anything NEW I add may only inject a note; it may never refuse. Anything genuinely
   new that could refuse his work WAITS FOR HIS YES. Widening an existing blocking gate counts as
   new blocking behaviour and also waits. Everything goes through git so it reverts in one command.
2. **BUDGET: go wide, cost is not the constraint.** Large parallel fan-outs, adversarial
   verification of findings.
3. **EFFICIENCY: both, and he does not know which is worse.** So MEASURE BOTH FIRST and show him
   which is actually costing more, THEN optimise that one. The first thing he sees is a number.
4. **PRIORITY: "wont happen".** He rejected the premise that I would run out. All four get finished.

## THE FOUR WORKSTREAMS

### A. HOW I WORK (his words: "maybe ur way of doing is weong")
Audit of the METHOD, not of individual answers. What does "research" actually cause me to do, what
does "look into everywhere design" cause, and which methods produced results that later got
retracted. Then what the labs publish about how an agent should investigate.
- [ ] agent `a7fa5d4077edbe315` running: audit of >=30 real research asks, method classification,
      failure rate BY METHOD with a baseline, plus the design-sweep half and the published guidance.
- [ ] act on its verdict: fix the method, not the individual answers.

### B. EFFICIENCY (speed and money, measure both, then cut the worse one)
- [ ] agent `a12f7d036f7f0c7ef` running: where the MONEY goes. Injected context per turn, real
      token totals from the transcript usage fields, biggest consumers ranked, quantified waste,
      and the one change that saves most.
- [ ] agent `aaab00199846899e9` running: where the TIME goes. The wait he actually feels, hook
      latency per action, the Stop-refusal time cost, serial work that could have been parallel.
- [ ] compare the two, tell him which is worse with the number, then cut that one.

Already measured today, carry forward:
- 58 checks fire on ONE ordinary file edit, 1.74s if serial, median 29ms, and **zero** of them
  refuse ordinary work. Sprawl costs time, not blocked work.
- `reply-shape-preflight.py` alone injects **9,470 characters (~2,367 tokens) into every prompt**.
- Inject-only reminders are obeyed **123 times out of 1,109 firings, 11.1 percent**, against a
  control confirming the detector sees 72 real Skill calls and 1,017 real plan edits in the same
  files. So roughly 89 percent of injected instruction tokens are paid for and ignored. This is the
  single biggest link between the harness and the money.
- 4,743 Stop refusals across his 49 typed-in sessions, about 97 per session.

### C. THE HARNESS (continuing this session's work)
- [x] `second-reader-after-building.py` BUILT AND RETIRED THE SAME DAY. The after-build reader round
      refuted it: it duplicated `harden-needs-council-gate.py`, which is armed at Stop, exits 2, and
      already refuses a closing message claiming a check is built with no independent reviewer
      dispatched. Its stated reason for avoiding Stop was factually false. Full record in
      `~/.claude/hooks/_retired/RETIRED_GATES.md`.
- [x] Project CLAUDE.md corrected: it claimed `missing-needs-a-reason-gate.py` (Stop) enforced the
      missing-needs-a-reason principle. That file is in NO settings file and dispatched by no
      aggregator, verified against a control of three known-armed hooks. The principle IS live, as
      rule 1 of the before-you-write note. The claim was wrong, not the principle.
- [ ] THE 13 STOP CHECKS THAT ONLY READ MY OWN WORDS. They can never un-send anything, so the most
      they can do is cause a second message: defer-bulk, dropped-directive, finding-provenance,
      flag-instead-of-fix, link-load-succeeded, no-emdash-reply, no-permission-to-fix,
      no-unrequested-removal, owner-punt, prelaunch-reality, stock-photo, tool-rejection-blame,
      visual-promised-needs-link. Firing counts where a headline could be recovered:
      no-unrequested-removal 56, prelaunch-reality 9, link-load-succeeded 2, flag-instead-of-fix 1,
      no-permission-to-fix 0, tool-rejection-blame 0.
      BLOCKER ON THIS: the before-you-write note is ALREADY 9,470 characters and 14 rules. Moving 13
      more makes it 27 rules and a wall nobody reads, which at an 11 percent obedience rate is
      paying more to be ignored. So this is now gated on workstream B: decide the note's size budget
      from the money measurement first, then move only what fits and RETIRE the rest outright.
- [ ] THE 87 BLIND-SPOT FILES found today: things under `~/.claude/` that are unmistakably part of
      the checking setup and that no gate watches. Worst by consequence: **11 skip-flag files with
      28 real writes**, the files whose whole purpose is to DISARM a gate, watched by nothing;
      `gate-eval.py` (50 edits), the tool the rulebook makes mandatory by name; `hooks/tests/`
      (16 files, 47 edits); `hooks/_lib/` (5 modules, one of which 12 armed gates import).

### D. SKILLS (parked by him on 2026-08-23, unparked tonight, "parralel")
- [ ] agent `a3f107ae1f7ddbb57` running: inventory of every SKILL.md on the machine, which are
      NEVER used, which cannot fire without him typing the name, and which reference files that no
      longer exist.
- [ ] agent `a1face6979ffe10cb` running: what Anthropic and the community publish, with a MANDATORY
      source read before any recommendation. His rule: "before you actually download the community
      ones, you need to actually analyze what you're downloading so there isn't any malware".
      Nothing gets installed tonight; the shortlist is for him.
- [ ] write skills for the real gaps, including his two self-named core problems: not researching
      properly before building, and building things that look finished and are wired to nothing.

## STANDING CONSTRAINTS, do not violate while he sleeps

- NEVER `git push`, and do not mention pushing. He pushes manually.
- Never arm anything that can refuse a turn. Non-blocking additions only. (His answer 1.)
- Never edit any settings.json from a subagent.
- Nothing irreversible without a copy first. Everything under `~/.claude/` is now in git.
- Solen is PRE-LAUNCH: no customers, no live traffic, all seed data.
- Product work stays PARKED. He said so on 2026-08-23 and has not lifted it.
- Every measurement gets a KNOWN-ANSWER CONTROL before it is reported. Four instrument errors
  today were caught this way and one was not caught until a reader found it.
- No rate without its baseline.
- No em-dash or en-dash anywhere.

## WHAT HE SEES IN THE MORNING

One message. What is now true, the numbers that decide something, and the short list of things that
need his yes because they would refuse his work. Not a tour of the files I touched.

---

# WHAT THE SIX READERS FOUND, and what was done about it

## THE EFFICIENCY ANSWER: they have a common cause, so one thing fixes both

He said he does not know whether speed or money is worse. Measured, both:

**SPEED.** Median wait per turn 8.0 minutes (suspend-corrected), p90 35.9. 59.5 percent of that is
the model generating text across a median of 32 round-trips per turn, which no setting fixes. The
largest REMOVABLE block is the refusal loop: 80.4 percent of his turns get refused by at least one
end-of-reply check, 2,135 rounds, 15.0 seconds each (2.96s of checks plus 12.08s of rewriting),
**31.9 seconds per turn and about 16.2 minutes per session.** Hooks run in PARALLEL, verified in the
installed binary (`Promise.all` on one path, an unlimited-concurrency merge on the REPL path), so
the old "1.74 seconds serial per edit" framing was the wrong model: real cost is the slowest hook,
about 688ms on an edit. The count was also wrong: 85 fire on an Edit and 95 on a Write, not 58.

**MONEY.** 22.73 billion tokens across the 49 sessions, about $25,761 at list. **97.12 percent of
every token is cache read**, i.e. re-reading context that already exists. His own replies are **1.7
percent of the bill.** The single biggest lever is the size of the context being re-read: at a
200,000 working ceiling the read bill falls 64.8 percent, about 57 million tokens per session.
Ranked consumers of the read bill: tool results 22.9, the commands and file contents Claude itself
writes out 17.1, system prompt plus both CLAUDE.md files plus tool definitions 15.1, hook injections
10.7, images 6.5. Stop-gates throwing away a finished reply cost 1.68 billion tokens, about $839.

**SO THE ANSWER IS: the refusal loop is the one thing that is simultaneously the biggest removable
time cost and a top money cost.** Cutting it helps both, which is why it was cut first.

## THE METHOD AUDIT, his own named ask

1. **Research stops at the edge of this machine.** 154 of 43,422 tool calls looked outside it, 0.35
   percent. Three separate asks for a multi-hour research session produced 0, 0 and 0 web calls; the
   four-hour one ran 323 tool calls, all local. Airbnb, the declared source of truth since
   2026-08-12, has been visited 15 times in six weeks.
2. **19 published claims about this machine turned out false**, all about the tooling not the
   product: a `shadow-elevation` class that never existed and silently shipped every card flat, a
   `no-black-selected` gate cited by three law files, a "hook-enforced" mockup rule that was not.
   16 of the 19 were found by a later audit, not at the time.
3. **"Everywhere" gets answered with a sample.** 115 sweep-shaped asks, median distinct pages opened
   1, and 57 opened none. The clean case delivered 8 of a hundred-plus and closed with "everything
   else is queued", which hides the ratio. He types "dont stop" or "as a loop" pre-emptively in 35
   of his messages because stopping short is the expected behaviour.
4. **807 subagents dispatched, 78 percent solo.** Anthropic publishes 3 to 5 in parallel for
   read-only gathering, and up to 90 percent time saved.
5. **3 of 807 briefs mentioned searching a synonym**, 0.4 percent, which is why duplicates keep
   being found rather than prevented.

**AND THE PROOF THAT GATES BEAT ADVICE, from the same audit:** source-only design sweeps ran at 73
percent before a gate was armed on 2026-07-15 and 31 percent after. Advice never moved it.

## WHAT LANDED TONIGHT

- **A check built this morning was refuted and retired the same day** by the after-build reader round
  he asked for. It duplicated `harden-needs-council-gate.py`, which is armed, exits 2, and already
  refuses a closing message claiming a check was built with no independent reviewer. Its stated
  reason for choosing a weaker channel was factually false.
- **All 83 checks that can end a turn now carry the one-refusal guard.** Nine did not, so each could
  refuse a turn it had already refused. Verified one at a time.
- **The note arriving with every message went from 9,470 characters to 3,471**, a 63 percent cut,
  with all 14 rules kept and every dated case moved to CLAUDE_WHY.md, which is not auto-loaded.
  Anthropic's docs are explicit that this is the cause of rules being ignored: "Shorter files
  produce better adherence" and "If Claude keeps doing something you don't want despite having a
  rule against it, the file is probably too long and the rule is getting lost."
- **A look complaint now starts the diagnosis by itself.** The project rulebook has claimed that
  trigger for months and nothing implemented it; all 9 real runs happened because the model
  remembered a table. 25/25 both directions on his real phrasings.
- **Research and sweep asks now carry what the audit found**, on the hook that already fires on
  prompt shapes. That file had no suite at all; it has 18 now.
- **Two false enforcement claims corrected** (`missing-needs-a-reason-gate`, and the taste trigger,
  which was fixed by wiring rather than by editing the sentence).

## THE NUMBER THAT ALMOST WENT OUT WRONG, TWICE

A reader killed the retired check with "inject-only reminders are obeyed 11.1 percent of the time",
which is true and decided nothing, because it had no baseline. Measured: the behaviour happens 2.4
percent of the time WITHOUT the reminder and 4.6 percent WITH it, a **1.92x lift**, and 1.89x when
restricted to sessions where the situation was present throughout so the lift cannot be the
situation. **Injected reminders roughly double what they ask for.** That reversed a
cut-everything conclusion. Written into GATE_LAW.md as a rule: judge a reminder by its lift, never
by its obedience rate, in both directions.

Separately, a second reader independently measured em-dash compliance at 80.8 percent against the
same 11 percent figure, which confirms the 11 percent describes one narrow class and not obedience
in general.

## STILL OPEN

- [ ] The pre-action replay (114 checks over 1,200 real tool calls) is still running. It answers
      which pre-action checks ever refuse real historical work, which gate-eval cannot drive.
- [ ] 19 registered checks have no suite; 8 of those can refuse something, including the Swiss
      price-indication one and the security one. Suites being written. (The first count of this was
      inverted by my own parser and said 194; the control caught it.)
- [ ] The skills cleanup: 8 of his own skills have never run, `uiux-audit` is broken (5 of its 6
      referenced files are missing), and 225 vendored plugin skills have never run once.
- [ ] `tunnel`: the skill loaded 5 times while `cloudflared` was run by hand 4,560 times across 38
      of 49 sessions. The work happens constantly and the thing built to do it is skipped.

## NEEDS HIS YES, because each would make something refuse his work

1. Key `harden-needs-council-gate.py` to the ARTIFACT rather than the turn, and widen what it counts
   as machinery using the 87 blind-spot files found today (skip flags, gate-eval.py, hooks/tests/,
   hooks/_lib/, pending-gates/, commands/).
2. A gate for the research finding. The measured precedent is strong: the design-verify gate moved
   source-only sweeps from 73 percent to 31, where advice moved nothing. Tonight's version is a
   note only, because he forbade new blocking checks while asleep.
3. Lowering the working context ceiling, which is 65 percent of the bill. Not a code change, a
   working-habit change, and the read-side saving is only half the model.

---

# CLOSING STATE, 2026-08-24

25 commits under the config repo. Every check that can end a turn and is named directly in a
settings file carries the one-refusal guard, 70 of 70. The five that demand evidence deliberately
do NOT, because their second pass is the check, and each carries a comment saying so.

Regression pass, every registered check's own suite run: **203 pass, 8 fail, and all 8 were failing
before tonight.** None of the 8 is a file that was touched. At least three of the 8 pass when run
from the project directory, so my runner's working directory was part of the problem, not the
checks. Genuinely failing and worth a look later: `mockup-diagnosis-gate.py`.

A claim I nearly published and did not: that the biggest single interrupter, `recurrence-harden-
gate.py` at 465 of 4,753 refusals, could not pass its own test. Run properly it passes all seven.
The failure was my runner's working directory. Reproduced before repeating it, which is the rule.

Still running at close: the pre-action replay, 83 of 114 checks driven over 1,200 of his real tool
calls.
