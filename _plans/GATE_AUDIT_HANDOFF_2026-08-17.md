# HANDOFF: stress test every gate, hook and principle

Written 2026-08-17 for a fresh session. The owner asked for this and said he would run it separately:

> "I want you to look into the gates, hooks, and all the restrictions that you have, and the
> principles. And I want you to stress test most, like, every one. Use the subagents council.
> Actually evaluate and stress test each one. Before you even think of removing, actually stress
> test it. Or when you think you should add something to it or edit something, stress test and use
> subagents, actually thinking it through. It's gonna be a long session."

Read this file first. Everything below was measured on 2026-08-17, not remembered.

---

## THE ONE RULE HE GAVE

**Nothing is removed, added, or edited on a hunch.** Every verdict is earned by driving the thing
with real inputs first. That applies in all three directions, and he said the removal direction out
loud because it is the one where a mistake is invisible: a gate deleted for being noisy takes its
protection with it and nobody notices until the thing it stopped happens again.

---

## THE NUMBERS, so nobody re-derives them

Counted on 2026-08-17 across `~/.claude/hooks/`, `~/.claude/settings.json`,
`~/.claude/settings.local.json` and the project's own `.claude/settings.json`.

| | count |
|---|---|
| hook files on disk | 236 |
| wired into some settings file | 176 |
| **on disk, wired nowhere** | **60** |
| have a `--selftest` | 118 |
| have no `--selftest` | 118 |
| have cases in `gate-eval-corpus.json` | 36 |
| **wired AND no self-test AND no corpus** | **103** |

By event: PreToolUse 105, Stop 68, UserPromptSubmit 23, SessionStart 9, PostToolUse 4,
SubagentStop 1, PreCompact 1.

**Read the 103 first.** Those are armed, they can stop work, and nothing has ever demonstrated that
they fire on the right thing or leave the right thing alone. That is the whole audit in one number.

---

## THE TOOLS THAT ALREADY EXIST. Do not rebuild them.

- **`python3 ~/.claude/gate-eval.py hooks/<name>.py`** is the evaluator. It answers three questions
  the hook's own suite cannot: does it fire on anything that really happened (it replays the hook
  over every real exchange in the transcripts), does it catch what it was built for, and does it
  leave good work alone. An empty corpus reports UNPROVEN, never PASS, which is deliberate.
- **`python3 ~/.claude/gate-eval.py add <hook> bad|good "<case>"`** grows the corpus. Every case a
  hook wrongly blocked or wrongly passed goes in, so the next audit starts from every mistake that
  hook has ever made. This is the memory of the whole system.
- **`--selftest`** is the convention for a hook's own suite. A hook without one cannot be graded at
  all, which is why the 118 number matters.
- **`~/.claude/workflows/council.workflow.js`** is the internal read-only reviewer fan-out. Invoke
  via the Workflow tool with `{files: [...], tier: N}`. Use it on any hook you intend to change.
- **`Skill(llm-council)`** is the outside opinion (Gemini, Grok, Claude via CLI). Two notes from
  2026-08-17: the configured `gemini-3-pro-preview` returns 404, use `GEMINI_MODEL=gemini-2.5-flash`;
  and the Claude CLI seat is unavailable in a sandboxed session, so expect two voices not three.
- **`python3 ~/.claude/hooks/system-health-check.py --report`** already reports 98 violations,
  including 66 wiring problems and 3 laws that claim an unwired hook enforces them.

---

## WHAT WAS ALREADY FOUND, so the audit starts ahead rather than from zero

Each of these is a real defect confirmed on 2026-08-17. They are the pattern library: when you audit
the other 230, these are the shapes to look for.

### 1. A gate pointed at a folder nobody uses anymore
`design-verify-gate.py` excluded any path containing `/dev/`, and mockups moved to real pages under
`app/[locale]/dev/` a while ago. It stood down on the exact directory where design now happens, for
ten consecutive owner rejections. `mockup-verify-before-show-gate.py` had the same hole twice over:
it only recognised a mockup as `public/_mockups/**.html` and only recognised a handover as a link
containing `/_mockups/`. Both fixed. **Three other hooks found and fixed this identical blindness on
2026-08-08 and each fixed only itself.** Nobody ever swept the family. Sweep it.

### 2. A gate whose path scope was widened and whose grammar was not
`mockup-type-budget-gate.py` reaches the terminal files and reads nothing off them, because its
extractors parse CSS `font-size:` longhand and a Tailwind file writes `text-[13px]`. It reports zero
sizes and zero weights on a file with four sizes and three weights against its own cap of two. Still
broken. **Look for this everywhere: scope and grammar are two separate things and only one usually
gets updated.**

### 3. A gate that stands itself down on a single token
`use-the-registered-component-gate.py` exits clean if the file imports anything from the design
system. One `import { Avatar }` satisfies a 44KB hand-written file. Still broken.

### 4. Gates on disk that are in no settings file at all
`composed-not-written-gate.py` and `chrome-consistency-gate.py` among 60 others. Some are retired on
purpose. Some are laws that a doc still claims are enforced. The health check names 3 of those by
name. Decide each one: arm it, or delete it and correct the doc that lies about it.

### 5. A defect in the evaluator itself, which masked everything downstream
`gate-eval.py` probed PreToolUse hooks with a **relative** file path, which falls outside the
`is_solen()` scope check several hooks use, so they scored "blocked 0 of N" while blocking correctly
in real life. It also counted a refusal only as exit code 2 or `"decision": "block"`, never the
`permissionDecision: deny` JSON that the PreToolUse docs actually recommend. Both fixed 2026-08-17.
**Any evaluation run before that date is suspect and should be re-run.**

### 6. The category that has nothing to do with correctness: cost
The reply-shape family fired 36 times in one session, 29 of those on pure surface findings (an
em-dash, a word he would not use, a list written as prose). A Stop hook runs after the reply is
composed and blocking it does not un-send it, so each of those 29 could only ever produce a second
message saying the same thing. Then the gate that exists to stop repetition fired 15 times, on
repetition its own family had caused. Fixed on 2026-08-17 by moving three of them to
`reply-shape-preflight.py` on UserPromptSubmit, which runs before a word is written and costs
nothing. **This is the highest-value question to ask of every Stop hook: can this fire before the
message exists instead of after? If yes, it belongs there.**

---

## THE METHOD, per hook

For each of the 236, in priority order (the 103 untested-and-armed first, then the 60 unwired, then
the rest):

1. **Read it and say what it claims to prevent, in one sentence.** If that sentence cannot be
   written, that is the finding.
2. **Find the incident.** Almost every hook here carries a dated owner quote in its docstring. If a
   hook has no incident behind it, it is someone's theory, and theories are the cheapest thing to
   delete.
3. **Drive it.** `--selftest` if it has one, and write one if it does not: one input that must trip
   it, one that must pass. A suite tests the author's imagination, so this is the floor, not the bar.
4. **Evaluate it.** `gate-eval.py`. If the verdict is UNPROVEN, add real corpus cases from the
   transcripts before judging it.
5. **Council it.** For anything you intend to change, dispatch an independent reviewer whose job is
   to break your reasoning, not to agree. The author is never the reviewer.
6. **Then decide, and record the decision with its evidence:** keep, fix, move earlier (see finding
   6), or delete. A deletion needs the same proof as a build.

---

## THE PREMORTEM. Three ways this session goes wrong.

1. **It becomes a reading exercise.** 236 files is a lot of prose and none of it is evidence.
   Mitigation: no verdict without having RUN the thing. A hook you only read is a hook you have not
   audited.
2. **The evaluator lies to you.** It just did, twice, in ways that made working gates look dead. If a
   result surprises you, suspect the harness before the hook, and prove it by driving the hook
   directly with a payload file.
3. **The audit adds more than it removes.** He has said the count itself is the problem: he gets
   three messages per turn because so many things can stop one. Every addition must name what it
   pays for. "Build one and retire one" is the standing rule, and "delete only" is a legitimate
   outcome he has already accepted twice.

**Out of scope, so it does not sprawl:** the product code. This is about the enforcement layer and
the principles it enforces. The merchant terminal workstream stays paused in
`_plans/MERCHANT_TERMINAL_2026-08-15.md` with six decisions waiting on him.

---

## WHAT HE WILL WANT BACK

Not a report of 236 verdicts. A page he can open, with the count before and after, the ones that were
armed and untested, the ones that were lying, and the ones that got deleted. He reads on a phone and
he skims down the left edge.
