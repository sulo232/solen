# DECISION_AUTHORITY.md

<!-- exists-check: net-new vs TASTE_AUTHORITY.md, TASTE_LOG.md, QUESTIONS.md because TASTE_AUTHORITY.md governs visual/taste calls only (its own opening line: "It is not a reference document," and its whole test tree is about pixels, colour, radius, motion), TASTE_LOG.md is a dated log of past verdicts not a decide/park/ask test, and QUESTIONS.md is a standing page of open design questions, not operational authority. This file is the sibling the owner asked for on 2026-08-21, same shape, different concern: not how things look, but whether to fix/park/ask on any non-visual decision mid-task. -->

**This file exists so you can decide a small OPERATIONAL question in his place, correctly, without
asking him.** It is the sibling of TASTE_AUTHORITY.md. That file governs how things LOOK. This one
governs what happens next when a decision is not about looks at all: fix it now, park it, keep
going, or stop and ask.

Written 2026-08-21, on his instruction. Verbatim:

> "we alrdy have it for design but for decision maikings n thats why i thought sht training(u
> asking me tons of questions)"

> "but u also have to understand like what u should do n dont not all automatic but thts the fine
> line n thats why i told u abt subagents councils"

He is the founder, not an engineer, and he reads on a phone. A question that costs him a turn and
returns him nothing is a real cost. So is a wrong call made silently. This file is the line between
the two.

**The limit on what may be written here, same as its sibling:** only what traces to a dated thing he
said or to a value already locked in CLAUDE.md, LOCKFILE.md, or a memory file. It invents no
positions. Where it is silent, THE TEST still applies, and a silent gap is never filled with a guess.

---

## 1. THE TEST

Run it top to bottom on any decision that comes up mid-task. Stop at the first line that fires. You
get one of three answers: **DO IT**, **PARK IT**, or **ASK HIM**.

**Step 1. Is it a security hole in the product?**
**DO IT NOW**, in the same turn you found it, whatever else you were doing. His words, 2026-08-21:
*"fix it now."*
Two limits, both his, both from the same sentence. **The fix stays the size of the hole:** *"if the
problem gets too big then park it or smth."* Fixing the hole is not optional; fixing everything
adjacent to it is. **And section 4 still binds the METHOD:** if closing the hole requires dropping a
column with live rows, changing a price, or rewriting a customer promise, the hole gets fixed the
way that does not touch those, and the part that does is parked and named. "Fix it now" is
permission to act, not permission to reach past the never-list.

**Step 1b. Is the product telling a customer something that is not true, right now?**
**FIX IT THIS TURN. It is never a menu item.** Not "here are six things, which do you want first",
not a bullet inside a longer message, not a line in a plan file. A screen that states a false fact
is the same family as a security hole: the product is actively doing harm every hour it stays up,
and unlike a design question there is no version of it he could reasonably prefer.

Members of this family, and it is deliberately narrow so it cannot be stretched into "everything is
urgent": a number, a wait, a count, a price or an availability that is computed from stale or dead
rows; a promise rendered to a customer that nothing enforces (a deadline nobody measures, a policy
nobody applies); a state the product says is one thing while the database says another.

**The case that put this here, 2026-08-15.** His homepage advertised a 70 to 98 minute walk-in wait
and "4 ahead of you", built from four people who had joined the queue on 3 June, 3 June, 13 June and
1 July and were never removed. I found it, wrote it as the third bullet of eight in a message mostly
about mockups, ended with "I have not touched any of it. Which do you want first?", and it stayed
live for seven more days. Nothing about that was a decision he needed to make. He was never going to
answer "leave the false wait up".

The size limit from Step 1 carries over unchanged: **the fix stays the size of the lie.** Stop the
screen from stating the false thing. The wider cleanup around it is parked and named, per section 7.

**HOW THIS SITS WITH SECTION 4, WRITTEN 2026-08-22 THE SAME DAY, BECAUSE A READER FOUND THE TWO
GIVING OPPOSITE ORDERS ON THE SAME CASE.** Section 4 items 3 and 4 say a customer-facing word and
a customer-facing promise are never changed without him, with no size threshold. Step 1b says a
false statement is fixed this turn. Both are right, and they are about different halves of the
same screen:

- **The DATA is mine and gets fixed now.** A number computed from rows nobody clears, a wait built
  from a dead queue, a count that no longer counts anything. Fixing the query, the job or the rows
  changes no word he wrote. Do it this turn.
- **The WORDS are his and are never rewritten without him.** If stopping the lie means editing
  what the customer READS (rewriting a promise, changing a deadline, softening a guarantee, or
  deleting the sentence), that is section 4 and it stops, however small it looks.
- **When the only available fix is to change the words**, the screen still must not keep lying, so
  the legal move is to stop RENDERING the false element until he decides its wording, and tell him
  in the same turn that it is hidden and why. Hiding a lie is not the same as fixing it, and it is
  named as a holding action, never reported as a fix.

The refund-flow case both documents cite lands cleanly under this: the deadline that nothing
measured was a PROMISE, so its wording was always his, and what was mine was building the thing
that measures it.

**Step 2. Is a second, unasked-for problem blocking the task you were given?**
**FIX BOTH.** His words, 2026-08-21: *"Fix both, tell me what Y was."* Do not fix the blocker,
finish the task, and report only the task. Name the second problem back to him, one line, per
section 7.

**Step 3. Does it hit money, wording, or something he already approved?**
**PARK IT.** That is his own definition, not a paraphrase. See section 2.

**Step 4. Does section 3 or section 4 already answer it?**
Section 3 (an area default) covers it: **DO IT**, apply the default, do not surface it. Section 4
(never without him) covers it: **ASK HIM**, always. There is no size threshold on section 4.

**Step 5. Is it mechanical, reversible, and inside your lane?**
Setup chores, running an existing script, finishing something already built and approved, anything a
measurement or an approved mockup already answers. **DO IT.**

**Step 6. Anything left over.**
It is real but you cannot place it in steps 1 to 5 with confidence. That uncertainty is the signal.
**ASK HIM**, once, plainly, in the closing report, or inline if it blocks the next step. Guessing
here is the failure this file exists to prevent.

### The retry budget on any of the above

**One retry, then stop and tell him.** His answer, 2026-08-21, to how hard to push when a fix keeps
failing: *"One retry, then leave it broken and tell you."* The measured reason it is that low
(CLAUDE.md rule 12.4): 13 gate fixes shipped in one day, each self-tested and passing. Handed to an
agent that had not written them, 12 of the 13 broke, and two of the new defects had been introduced
by the fix itself. A third attempt is where a fix starts causing the damage it was meant to prevent. This is also CLAUDE.md rule 15a's second-theory stop: two wrong explanations for one
symptom means the instrument is the suspect, not the subject.

---

## 2. THE PARK LINE

This is not a phrase needing interpretation. He picked it off a list, and **the option he picked
carried its own definition**, which is the operational test:

> **"When it needs a decision that is yours"** , *"The moment the side-fix hits money, wording, or
> something you approved, I stop and park it."* (2026-08-21)

So the test is three words: **money, wording, approved.** A side-fix that touches a price, a fee, a
charge, a refund; or any word a customer reads in any of the four locales; or anything he has
already signed off on, gets parked. That is the whole rule and it needs no expansion.

**He attached one more condition in the same answer:** *"also important u dont duplicate fixes or
principles harness yk."* Before building a new fix, principle, gate, or harness, check whether one
already exists and extend that instead. This is CLAUDE.md rule 12, and he named it here himself, so
it applies to enforcement machinery too, not only product code. A duplicate gate is worse than none,
because two of them drift apart and neither owner knows which is live.

**What does NOT get parked:** anything an area default in section 3 covers, anything a rendered
measurement settles, anything an approved mockup already shows, any mechanical or reversible step
inside work he already signed off on. Parking one of these is not caution, it is a wasted question,
which is the exact complaint that produced this file.

**How to park, mechanically:** keep working on everything that does not depend on the answer. Note
the open question in one line in the closing report, per section 7. Do not stop the task to raise it.
Do not silently drop it either. A parked item that never resurfaces in a report was not parked, it
was lost.

---

## 3. THE DEFAULTS

A new case arrives mid-task and no dated decision names it. Apply the default. Do not list options,
do not ask.

### Turning a safety rule on or off: YOURS, with two conditions

**This is delegated to you.** His words, 2026-08-21, asked directly whose call it is: *"urs like
today but i dont even know what safety rules yk thats also problem w u not telling me context but
ths too evaluate woth subagent councils but mainly U like today."*

Both conditions are in that sentence and neither is optional:

1. **Tell him which rule.** He does not currently know what the safety rules are, and he named that
   as the problem, not as a footnote. When a safety rule is relevant to what you are doing, say
   which one, in plain words, before he has to ask. Silence about which rule applies is its own way
   of deciding for him.
2. **Evaluate it with a council, not alone.** *"ths too evaluate woth subagent councils."* A toggle
   decided by the same agent that wants to ship past the gate is not an evaluation. Writer is never
   reviewer (CLAUDE.md rule 13).

Standing constraints that do not move: never mass-arm (`feedback_gates_built_but_never_armed.md`,
78 unwired hooks, 50 with passing suites), and a gate is never armed before it has been evaluated,
not merely self-tested (CLAUDE.md rule 12.4, `~/.claude/GATE_LAW.md`). One nearby data point, given
honestly because it cuts the other way: on the same day he answered *"Show me the proposal first"*
when asked to switch on a set of new rules about how the agent writes to him. Different object, a
writing style rather than a safety gate, so it does not overturn the delegation above, but it is
evidence that he wants to see a proposal when a rule change would visibly change how he is talked to.

### A check, gate or hook that turns out broken: report it, do not fix it

**Report only.** His answer, 2026-08-21, when asked what should happen in the same pass as a check
that is broken or firing on nothing: *"Report only, you decide."* This is the deliberate opposite of
step 1's fix-it-now, and the difference is the subject: a hole in the PRODUCT gets fixed on sight, a
broken CHECK gets reported. He kept the enforcement layer for himself. Do not quietly repair, widen,
or narrow a gate mid-task because it inconvenienced you.

### A problem that keeps coming back: he hears about it the SECOND time

**Fix it silently once. The second time the same thing breaks, tell him.** His words, 2026-08-21:
*"second time but smtimes it happens again but u also dont see or jst skip over it and what am i
suposed to do if u cant stop u need subagents council."* Recorded with his own caveat intact: he
does not trust that a repeat will be noticed at all, and he named a council as the compensation for
that. So the second-occurrence report is a floor, and noticing a recurrence is not something to
trust your own memory for inside one long task.

### Setup and configuration chores

Installing a dependency already implied by approved work, running a script that already exists,
restarting a dev server, clearing a cache. **DO IT.** Reversible, no customer-facing or financial
consequence. CLAUDE.md's Terminal autonomy section already settles this class: npm/npx, git
status/add/commit/diff/log, tsc checks, file ops proceed without asking, and commits happen often
and autonomously.

**Editing `.env.local` is NOT in this class: ASK FIRST.** The same Terminal autonomy line that
grants everything above names four exceptions by name, and `.env.local` edits are one of them,
alongside `git push --force`, `reset --hard`, and DB data deletion. Reading a value that is already
in `.env.local` is fine. Writing one is a stop.

### Database migrations

**Additive and idempotent only** (`CREATE TABLE` / `ADD COLUMN IF NOT EXISTS`, no drops), introspect
the live schema first, then verify against the live snapshot per the exists-check protocol. Inside
those bounds, a migration implementing a schema already described in an approved spec or already
referenced live in the codebase: **DO IT**. This is the proven path of every reconcile wave in
`project_db_schema_drift.md`, and that file states additive feature migrations are safe precisely
because the drift does not block them.

Everything outside those bounds is not a default. **Never `supabase db push` or `db reset`** on this
project, no exception carved out here: the local repo carries numeric-prefixed migration files the
remote history has never recorded, so a push would re-run `013_drop_legacy_schema`, whose contents
are `DROP TABLE ... CASCADE` on five tables. That is data loss, not a risk of it. A migration that
invents shape not specced anywhere is a new direction: **PARK** or **ASK**. A destructive migration
against live rows is section 4.

### Backend work

Fixing a silent no-op (a filter that renders but does not discriminate, a dead column, a convention
mismatch) is finishing behaviour already promised: **DO IT**. This is the project's named number one
failure mode per CLAUDE.md's Silent no-ops section, and the fix restores intended behaviour rather
than inventing new behaviour. Prove it discriminates, do not prove it exists. A new API shape, a new
auth flow, a new third-party integration: **ASK**, that is a new direction.

### Finishing work already built

CLAUDE.md's NO DECORATION section, 2026-08-19, settles this class by name: a copy key rendered
nowhere, a deadline printed but never computed, a control that does nothing. Owner verbatim: *"when
you build something, you keep making these decorations or, like, unfinished stuff, right, even
though I thought it actually finishes loop. Finish it as a loop."* **DO IT**, connect the last mile,
and drive one real end-to-end path so it is proven rather than asserted. This is not a new decision,
it is completing one already made.

### Measurable questions

Anything a `getBoundingClientRect`, a PIL pixel-sample, a contrast calculation, or a live `npm run
exists` scan settles outright: **DO IT**, apply the measured answer. TASTE_AUTHORITY.md step 6
establishes this for visual values; it holds anywhere a tool rather than a judgement produces the
answer. **Run the known-answer control first** (CLAUDE.md rule 15a): before reporting that something
is broken, missing, or not firing, run the same test on a case whose answer you already know. If the
known case also comes out wrong, your instrument is the broken thing, not the subject.

### Anything he has already settled in writing

TASTE_LOG.md, LOCKFILE.md, REMOVED.md, or a dated line in any of this repo's law files. **DO IT**,
apply the recorded value, do not re-surface it. Re-asking a settled question is the same failure as
inventing an answer, just slower to notice.

---

## 4. NEVER WITHOUT HIM

Short and absolute. No size of change and no confidence level makes any of these smaller than a stop.

1. **Money leaving his account.** Any purchase, subscription, paid API credit spend beyond what is
   already provisioned, or financial transaction of any kind.
2. **Destructive database or infrastructure operations.** `supabase db push`, `db reset`, dropping a
   table or column with live rows, deleting DB data, pausing or deleting a project.
3. **Words a customer reads.** Any naming, label, headline, button copy, or product-noun change, in
   any of the four locales, in production. Copy has no indifference band. The one exception is his to
   grant per question, not a standing default: when he hands a naming question to a council, the
   council's researched answer IS the decision and it ships without him (TASTE_AUTHORITY.md section
   4 item 1, amended 2026-08-21, *"i told u let subagent decide it"*). Silence is not delegation.
4. **Anything promised to a customer.** A deadline, a cancellation or refund term, a response time, a
   guarantee, a consent meaning. If a screen names a promise, something must own that promise, and
   he decides what it says.
5. **Prices and how they are shown.** A price, fee, surcharge, discount, commission, VAT treatment,
   or its display format. Swiss PBV total-price rules sit in the statutory tier.
6. **Statutory floors.** WCAG 2.2 AA on a published customer surface, nFADP and GDPR consent
   including special-category data (allergy and treatment notes), anything the Terms represent as
   true. Per the precedence chain these outrank every default in this file. When one collides with a
   taste decision of his, surface the collision with both dates and propose the treatment that
   satisfies both. Never silently pick a side.
7. **Breaking a dated decision of his.** A LOCKFILE row, a TASTE_LOG entry, a REMOVED.md graveyard
   hit, a settled line in this file. Breaking a lock needs an explicit named yes, dated. His
   frustration is not that yes: *"idc"* means he is annoyed, not that a lock is open.
8. **Pushing to git.** Never automatic, and never mentioned unprompted. CLAUDE.md: *"NEVER auto-push,
   and don't even mention pushing (the owner pushes manually)."*

---

## 4b. FOUR MORE ANSWERED 2026-08-21, in his own words

**A council's answer: it DEPENDS, and here is the split, because he handed the split to me.**
Asked whether a researched answer from a panel is settled or still needs his yes, he said
*"rlly depends"*. He did not pick, so the condition is mine to draw and is drawn here to be
overruled on sight. **A council's researched answer binds you, EXCEPT where it moves money or
changes what a customer is promised. Those two go to him whatever the council concluded.**
Reasoning: those are already the two absolutes in section 4 that carry no escape hatch, so a
council cannot be a way around them, and everything else is exactly what he delegated on
2026-08-21 when the Salon word came back for a rubber stamp and he said *"i told u let subagent
decide it"*.

**Old work stranded on side branches: HIS, and he wants volume.** Verbatim: *"old sh lemme decide
n u tel me alot"*. So it is never landed on your judgement, whatever its size, and the reporting
is deliberately generous rather than minimal: what it is, what it does for his product, and why it
never landed. About 40 branches are sitting there, so this will be a lot of telling, which is what
he asked for. This OVERRIDES the "finishing work already built" default in section 3 for anything
that has to be merged from another branch.

**How big is too big for a side-fix: MINE.** See section 5, where the reasoning is recorded.

**A vague ask with no list, like "improve the search page": ASK FIRST.** Verbatim: *"ask me first
thats question phase or so first clearly better but maybe u wont understand so ye ask me even vague
but so u acc understand or also if i was talkin abt it bfr dont reask"*. Three things in one
sentence, and all three bind:
 1. There is a QUESTION PHASE before an open ask. Ask before building.
 2. A rough question is better than a confident guess. *"ask me even vague ... so u acc
    understand"* means an imperfect question beats building the wrong thing.
 3. **UNLESS HE HAS TALKED ABOUT IT BEFORE.** *"if i was talkin abt it bfr dont reask"*. Search
    TASTE_LOG.md, the plan files and the graveyard FIRST. This is the same standing instruction as
    2026-08-09, *"you actually, like, remember my preferences?"*, and it is what turns the question
    phase from helpful into exhausting when it is skipped.

---

## 5. WHAT IS STILL OPEN

Not answered. Do not guess an answer and do not build as though one exists.

- **The severity ladder for a customer problem reaching him.** He rejected a flat per-category
  yes/no and asked for something closer to a severity ladder (his Uber Eats comparison), then paused
  the line himself: *"bro we arent even live rn ... we need to acc research how othr fompanies do it
  but rn ths session is abt harness."* Parked BY HIM, not by this file. Do not build a ladder and do
  not route customer-facing incidents through a guessed threshold until he reopens it.
- ~~**What "too big" means for a growing side-fix.**~~ **ANSWERED 2026-08-21, and he handed the
  number to me: asked how big is too big, he replied *"what do u think"*. So this is a decision of
  mine, recorded here with its reasoning so it can be overruled on sight.**
  **THE LINE: a side-fix parks when it reaches a SECOND SYSTEM, not when it reaches a second file.**
  A second system means the database, payments, authentication, or anything a customer is told.
  WHY NOT A FILE COUNT, which was the other option on the table: a file count punishes exactly the
  right kind of fix. Renaming one thing correctly touches nine files and is safe; changing one line
  in a payment path touches one file and is not. Counting files would park the safe one and wave
  the dangerous one through, which is backwards. Size is a bad proxy for risk and reach is a good
  one.
  This sits ON TOP of section 2, it does not replace it. Money, wording, or something he approved
  still parks a fix at any size, including a one-character one.
- **Which safety rules exist and what they cover.** He named this as a real gap in the same breath as
  delegating the toggle to you: he does not know what the safety rules are. This file does not
  enumerate them, because he has not asked for that enumeration here and inventing a summary would
  be the exact failure this file exists to stop. Section 3's first condition is the interim answer:
  name the rule in plain words whenever one is in play.

---

## 6. WHEN NOT ASKING MEANS RUNNING TWO THINGS AT ONCE

He raised this as a decision-authority problem, not a scheduling one. Verbatim, 2026-08-21:

> "its racional to think next is fix the duplicate guards n harnesses u jst found but at the same
> time ur asking me if u should ask u for more decisions what if u do it parallel thats why we have
> subagents byk that didnt fire either"

The point: two independent jobs handed to him as a choice between them is a question that did not
need to exist. Run both. Asking him to pick is only correct when the jobs actually depend on each
other.

**A gate on this is live right now, and you should know what it does before it stops you.**
`~/.claude/fan-out-not-one-agent-gate.py` is armed in settings.json (PreToolUse, Agent) and refuses
ONE agent being handed a whole-system job. Measured before arming: over 59 real single-agent
dispatches it would have refused 2, both the same oversized job.

**A second arm, the one that would detect independent-jobs-run-serially, was written and deliberately
NOT shipped the same hour.** Measured, it refused 15 of those same 59 dispatches, a quarter of
correct work, because "independent" is what you write when you mean an independent REVIEWER, the
most common brief in this estate. A check that refuses a quarter of good work gets switched off, and
a switched-off check enforces nothing. So this half stays judgement:

- **Does job B read, write, or depend on anything job A produces?** If yes, sequential is correct.
  Do not force parallel to look fast.
- **If no, are they going out one after another out of habit?** That is the defect. Fan them out.
- **Unsure: name the dependency you are checking for, out loud, before dispatching.** "B needs A's
  output" or "B touches nothing A touches" is one sentence and it catches the mistake before it
  ships.

---

## 7. REPORTING

His words, 2026-08-21, verbatim: *"One line each, at the bottom, under a heading."*

Every parked item, every second problem you fixed, every still-open question goes into the closing
report as one line each, under a heading, at the bottom. Not woven through the narrative, not a
paragraph per item, not omitted because it felt small. What he said he is reading for: **is it done
and what do I do now, what actually changed in my product, and whether to trust it** (2026-08-21).
The subject of every line is his product, never the machinery that produced it.

---

## 8. FEEDING THIS FILE

When he decides something that changes what a helper may DO without asking, record it here with the
date and his verbatim words, the same discipline TASTE_AUTHORITY.md section 7 holds for taste.

A line here with no dated quote and no traceable lock behind it will drift the first time someone
disagrees with it. Worse, it can invert: the first draft of this file put the safety-rule toggle in
the never-list, when what he actually said that day was that the toggle is yours. It was written
without the quote in front of it. That is why the quote is the requirement.
