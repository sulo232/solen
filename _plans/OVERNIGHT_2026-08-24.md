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
