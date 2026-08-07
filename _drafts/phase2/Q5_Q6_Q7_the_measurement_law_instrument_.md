# MEASUREMENT_LAW.md

**Tier 0 doctrine. Owner decisions Q5, Q6, Q7 of 2026-08-07 (`_plans/SYSTEM_DECISIONS_2026-08-07.md`).**
**Judgment law, not gate law.** Q1 froze new gates: a gate is legal only for something objective
and cheap to check. Almost everything below is judgment, so it lives here and is enforced by being
read, not by being blocked. The one mechanical piece extends a gate that already exists.

---

## Why this file exists

The owner, verbatim:

> "every time, my measurement said we matched and you said it was wrong. That gap is the actual
> problem, and it has repeated four separate ways: I sampled fixed strips of screen while the card
> moved through them; I polled screenshots too slowly to see a 333ms animation; I measured the card
> rect converging instead of when it stops being visible; I measured the wrong start state. Each
> time I found the flaw in the instrument, fixed the instrument, got a new number, changed the code,
> and told you it was done. The measuring keeps improving. It has never once agreed with your eyes."

Fourteen attempts. Every one of them carried a real number from a real instrument. The number was
never fake. It was pointing at the wrong thing, and nothing in the system ever asked it to prove it
was pointing at the right thing before it was believed.

So the failure is not "measure more". It is "a reading was treated as evidence the moment it
existed". These three rules put a step in front of that.

---

# Part 1. An instrument is not evidence until it has reproduced a known answer

**The rule.** Before a number is used to make a decision or told to the owner, the instrument that
produced it must have passed at least one case where the right answer was already known. Until then
it produces a reading. A reading is a hint. It is not proof and it does not outrank a person.

**Two kinds of known answer.**

1. **A verdict he already gave.** He looked at something and said yes or no. Run the instrument on
   that same thing. If it disagrees with him, it is blind on that axis and its readings on that axis
   mean nothing.
2. **A constructed truth.** Build a tiny test case whose answer is true by construction, because we
   built it. Use this where no verdict exists, which is most timing and motion work.

Both are cheap. Neither needs his time.

## 1.1 The four instruments, and the actual case each one has to pass

### `scripts/check-geometry.mjs --floors-only --gate`
Claims to measure: photo share, biggest text, share of bold text, size spread, shadow variety, on
the first 390x844 viewport (header comment, lines 40 to 72 of that file).

Known verdicts available to test it with:

| case | his verdict | source |
|---|---|---|
| the /profile split, 6 text sizes, "busy with no anchor" | REJECTED | project CLAUDE.md, NEVER-AGAIN floor 2 |
| the payment empty state, CTA 54% down the screen, 46% dead space below, gray disc icon | REJECTED | project CLAUDE.md, NEVER-AGAIN floors 3 and 4 |
| the converged salon card, `public/_mockups/card-redesign.html` panel `#c11` | APPROVED | `_design-system/TASTE_LOG.md:200` |

Test: serve each, run the gate. It has to FAIL the two he rejected and PASS the one he approved.
If it passes something he rejected, that is not a bug to fix, it is a boundary to write down: the
instrument does not see that axis, and a PASS from it says nothing about that axis.

Already known and to be written in its row: it reads only the first viewport, so anything below the
fold is outside its evidence. It has no measure at all for "the empty state is one centred unit".

### `~/.claude/skills/pixel-spec-auto/scripts/extract.py`
Claims to measure: card edges, row heights, gaps, padding, radii, colors, from a screenshot.

Known verdict: the 2026-07-21 type-size incident, roughly eight rounds of "the sizes are too big",
recorded in `~/.claude/hooks/mockup-width-calibration-gate.py:5-9`. The known answer is unusually
clean: glyph-height reading came out 20 to 40 percent too tall, and the sizes he accepted came from
matching word WIDTH instead.

Test: run it on that reference and see whether its numbers land on the sizes he accepted or the ones
he rejected. If they land on the rejected ones, its row says "trusted for box geometry, not for type
size", and type size keeps going through the width method.

Cheaper second test that needs no verdict: render a Solen mockup at known sizes, screenshot at 3x,
run extract.py, compare to the truth we set. Within about 2px means trusted for that shape.

Note, so this is an extension and not a duplicate: extract.py already ships half of this idea. On
success it writes a `.review-needed` marker (extract.py lines 451 to 452) that demands a human look
at the annotated overlay before any component is edited. Calibration sits behind that, it does not
replace it.

### `gemini-visual-check`
Claims to produce: a visual second opinion.

Known verdict, and this one is unusually strong: `public/_mockups/card-redesign.html` holds eleven
candidate cards, `#c1` through `#c11`, in one file, and `_design-system/TASTE_LOG.md:200` records
that he picked `#c11`.

Test: send it the file with no hint of which one won, ask which card is best and why. Trusted if it
picks c11. If it picks another one, its output is an opinion and gets labelled an opinion, never
offered to him as a check.

(The other obvious pair is not usable: `solen-taste-01-search-cards.html`, the version he rejected,
is no longer on disk. Only the approved `-01b-` survives. Worth knowing that rejected artifacts get
deleted, which is exactly what shrinks this corpus over time.)

### The motion instruments: `scripts/capture/record-interaction.mjs`, `scripts/check-motion.mjs`
This is where the fourteen attempts happened, and no owner verdict can validate a timing tool. So
this one uses a constructed truth, and it is the highest value item in this whole document.

Build one fixture page, `public/_mockups/_fixtures/motion-truth.html`, with three elements whose
answers are true by construction:

- **A**: a transform that runs for exactly 333ms.
- **B**: the same transform at exactly 700ms.
- **C**: an element that ends fully transparent while its bounding box stays exactly where it started.

The instrument passes only if it reports A as 333 and not as 300 or 400, tells A apart from B, and
reports C as gone rather than as "position unchanged".

Those three cases kill all four flaws he named, in order: sampling fixed strips, polling too slowly
to see 333ms, watching the rect converge instead of watching visibility, and reading the wrong start
state. One HTML file, reusable forever, no owner time.

## 1.2 Where the result is written

One file: **`_design-system/INSTRUMENT_CALIBRATION.md`**. One row per instrument. One file, per Q8.

| instrument | last calibrated | cases used | result | trusted for | blind to |
|---|---|---|---|---|---|

The load-bearing column is **blind to**. Every instrument is blind to something, and the fourteen
attempts happened inside the blind spots of four different instruments in a row. Writing the blind
spot down is what stops the next reading from being over-claimed.

**Staleness, and it is deliberately dumb so it actually gets checked:** if the instrument's own file
has been edited since the calibration date, the row is stale and its readings drop back to hints
until it is re-run. He changed the instrument fourteen times. Each change silently invalidated
whatever trust the last one had earned, and nothing noticed.

## 1.3 When you may skip calibration

Skip it when the number is not load-bearing: you are orienting, exploring, or the number will not be
shown to him and will not decide anything. The rule binds at two moments only, and they are both
moments of commitment:

- you are about to tell him a number, or
- you are about to change code because of a number.

---

# Part 2. When the number and his eyes disagree, he sees both and he decides

**The rule, in his words:** show him both readings and let him decide which one is wrong.

**This is his rule, not mine, and his is better.** I recommended "his eyes win automatically and the
instrument is the suspect". He rejected that. Two concrete reasons his version beats mine:

1. **Eyes-win throws away the only thing that can locate the flaw.** Fourteen times a new instrument
   flaw was found, and every single one was found by staring at the number that disagreed with him.
   Delete the number on contact and the instrument stays broken and lies again next time, in a new
   way. That is a loop with no exit, which is precisely what fourteen attempts looked like.
2. **Both statements are usually true, about different things.** "The card's rect converged on the
   target" and "the card is still there" were both true at the same time. Eyes-win deletes a true
   statement and hides the actual finding, which is that the two sentences were never about the same
   thing. Naming that gap is the fix. Deleting one side of it is not.

**The honest cost of his version:** it spends one of his turns every time it fires. Mine was cheaper
per incident. Over fourteen incidents mine was far more expensive, because it never converged.

## 2.1 What "show him both" looks like in a message

He has banned numbers he cannot interpret ("you just tell me a lot of before and after numbers... I
don't understand any of that"). So this cannot be a table of measurements. Five parts, in this order,
and nothing else:

1. **His words, quoted, one line.** Exactly as he said them.
2. **My reading, one line, as a sentence about the thing he can see.** Not a number with units.
3. **One thing he can look at.** A recording, a frame strip, a link. For a visual disagreement the
   evidence is a picture, not a figure.
4. **Two labelled options.** A and B. Not three, not a menu.
5. **Nothing else.** No numbers, no method, no file names.

### The template, filled from the real case

> You said: "the card is still there when the sheet opens."
>
> My check says: the card finishes fading before the sheet finishes opening.
>
> [Watch it](link)
>
> **A.** The card is still there, so my check is watching the wrong moment.
> **B.** The card is gone, and what is bothering you is something else on that screen.
>
> A or B?

He can answer with one letter. That is the whole design goal.

## 2.2 The three rules around that block

- **The number stays available, it just stays out of the message.** If he asks how the check works,
  answer then. Volunteering it is the thing he banned.
- **Do not act until he answers.** Acting on the number is the fourteen-attempt loop. Acting on his
  eyes alone leaves the instrument broken to lie again. Neither is allowed here.
- **This is a legal stop, and it does not break "finish the job".** The project rule permits pausing
  for a blocking decision that the remaining work depends on. A measurement-versus-eyes disagreement
  is exactly that: continuing means building on a guess about which of two contradictory statements
  describes reality, and building on a guess is the failure mode that rule exists to prevent. Say
  which one you think is wrong and why, then wait. One question, a recommendation, a picture.

---

# Part 3. Two attempts, then the method changes or it comes to him

## 3.1 Definitions, tight enough that the count cannot drift

**An attempt** is one handover to him of a change meant to fix a named defect. Not one edit, not one
tool call, not one internal review round. Five files changed, two verifier rounds, then "try it now"
is ONE attempt. The counter moves when you hand it back, because the handover is what costs him.

**Failed** means he says it is still wrong. Only his rejection counts. Explicitly:

- an attempt you caught and abandoned before showing him does NOT count, so internal churn cannot
  burn the budget
- "better, but still off" DOES count as failed
- a measurement disagreeing with you does NOT count, that is Part 2's business

**The same defect** is the same thing he is pointing at, not the same file and not the same word. In
the fourteen-attempt case the file changed, the variable changed, and the instrument changed every
round. The defect never changed once.

## 3.2 The rule

Attempts one and two are free. Change the value, change the variable, do the obvious thing.

Attempt three may not be another value on the same method. It has exactly two legal forms:

- **change the method**, or
- **come to him**.

Both are first-class. Coming to him is not the failure branch.

## 3.3 What "change the method" means, and how to tell

**The test question:** after this change, is the thing I rely on to know whether it worked the same
thing as last time? If yes, the method did not change.

**Real method changes, from the fourteen-attempt case:**

- Every early attempt watched the running animation from outside: sample the screen, poll
  screenshots, read the rect. Stopping all of that and RECORDING one video at a known frame rate,
  then looking at the frames, is a method change. Different class of instrument.
- Stopping the measurement of the animation entirely and instead answering the exact question he
  asked, "is the card visible at the moment the sheet is open", as one yes or no at one moment, from
  a picture he can look at himself. Different question, not a better answer to the old one.
- The blow-dryer precedent already recorded in `~/.claude/hooks/repeat-fix-simplify-gate.py:8-17`:
  seven attempts each added a control inside a 3D approach, the eighth threw the approach away and
  took twenty lines. The class of solution changed, not its settings.

**Not method changes, so the rule is falsifiable:**

- a fourth easing curve after three easing curves
- a fourth duration after three durations
- polling every 20ms instead of every 100ms (this is the exact trap, and it happened)
- swapping one CSS property for another that does the same thing, when the property was never the
  problem
- adding a fourth condition to a heuristic that already has three

The pattern in the whole non-list: they all still trust the same thing to tell you it worked.

## 3.4 What "come to him" looks like

One message, the Part 2 shape, plus one sentence:

> I have changed the same thing twice and it is still wrong, so I think I am solving the wrong
> problem. Here is what I think it actually is.

Then the recommendation, then the picture, then one question.

## 3.5 The gate half: extend what exists, do not add anything

`~/.claude/hooks/repeat-fix-simplify-gate.py` already exists, is already armed
(`~/.claude/settings.json:557`, Stop event), and its threshold is already 3, which is already his
number. Per LAW_SYSTEM.md section 6.9, the answer to a repeat that already has a gate is to find why
the gate did not bind, not to write a sibling.

**Why it did not bind, measured.** I replayed its own matching logic over the 31 real session
transcripts in `~/.claude/projects/-Users-sulo-Documents-solen/`:

- 162 replies in those sessions claim a fix
- only 49 of them carry a word its subject list recognises
- so it is blind to 113 of 162, about seven in ten
- it would have blocked at some point in 3 of the 31 sessions

The reason is visible in the code. Its subject list (lines 37 to 39) is the vocabulary of the
blow-dryer incident it was born from: air, puff, jet, wind, ribbon, smoke, nozzle, spin, rotation,
tilt, bob, shine, gloss, colour, frame, loop, icon, chair, dryer. The words that actually appear in
the fix claims it misses are: gate (47), link (29), hook (19), header (12), photo (12), size (10),
layout (10), card (9), tunnel (9), gap (7), button (7), shadow (7), fade (6), transition (5), image
(5), font (5), width (4), modal (4). An animation fix about a card that fades into a sheet contains
none of its words.

**Four changes to that one file. All four are objective and cheap, so all four are legal under the
Q1 freeze.**

1. **Widen the subject list** to the measured vocabulary above. Write the self-test case for the
   missed animation phrasing FIRST, confirm it fails, then widen until it passes. A widening with no
   failing case in front of it is a guess.
2. **Anchor "failed" on his rejection, not on my claims.** Today it counts how many times I said
   "fixed". Per 3.1 the count should be how many times he said it is still wrong. Scan the user
   messages between fix claims for rejection language and count those. This makes the counter match
   the rule instead of approximating it.
3. **Add the third legal ending.** Today the block clears only on naming a root cause or removing
   complexity. "I am bringing this to you because I think I am solving the wrong problem" is the
   other legal Q7 move and must not be blocked.
4. **Count across sessions, not just this one.** It reads one transcript file, so /clear or a new
   session resets the count to zero. Fourteen attempts did not happen in one session. Read the
   recent transcripts in the project directory, not only the current one.

Its escape flag TTL is 300 seconds, the same five-minute window Q3a is fixing elsewhere. Raise it in
the same pass or it will be re-touched repeatedly during one long job, which is the exact false
signal the mockup gate produced.

---

# Where each rule installs

| what | where | why there |
|---|---|---|
| all three rules, in full | **new canon file `~/.claude/MEASUREMENT_LAW.md`** (this document) | Q8: one canon file per concern. Sits beside LAW_SYSTEM, LOOP_SYSTEM, REPORT_SYSTEM at the same doctrine tier |
| index row so it is findable | `~/.claude/LAW_SYSTEM.md` section 5 table (line 123) | a rule not reachable from that table is not law yet, by that file's own closing line |
| Q5 + Q7 judgment, short pointer | `~/.claude/skills/fable-reasoning/SKILL.md`, new section 4.5 after Evidence standards (line 53) | that skill already carries the evidence tiers and the sunk-cost trap at section 5 that says three failed rounds means the hypothesis set is wrong. This makes that line precise. The skill is armed: `fable-skill-trigger.py` at `~/.claude/settings.json:1024`, plus global rule 14 |
| Q5, one line on the verify step | `~/.claude/skills/fable-frontend/SKILL.md` step 6 (lines 30 to 39), next to the existing motion line that already names `record-interaction.mjs` | visual work is where this fails, and that is the exact line that dispatches the motion instrument |
| Q6 reply shape | `~/.claude/REPORT_SYSTEM.md` section 5, Special shapes (line 154) | it is a reply shape, and section 5 is where reply shapes live. When Q9d's reply law is written, this moves there and section 5 keeps a pointer |
| Q7 mechanical half | extend `~/.claude/hooks/repeat-fix-simplify-gate.py` (armed, `~/.claude/settings.json:557`) | LAW_SYSTEM 6.9: a repeat with a gate is a binding failure, so fix the binding. No new file |
| the calibration record | new `_design-system/INSTRUMENT_CALIBRATION.md` | one file, project-side because the instruments are project-side |
| the motion fixture | new `public/_mockups/_fixtures/motion-truth.html` | one file, next to the instrument it validates |

## Pointer text to paste

**fable-reasoning, new section 4.5:**

> ## 4.5 A reading is not evidence
> An instrument's number counts as evidence only after that instrument has reproduced an answer that
> was already known: a verdict the owner gave, or a truth we constructed. Record in
> `_design-system/INSTRUMENT_CALIBRATION.md` what each one is trusted for and what it is blind to.
> When a number and his report disagree, show him both in one line each plus something to look at,
> and let him pick. Two failed attempts at one defect, then the method changes or it goes to him.
> Full law and the worked cases: `~/.claude/MEASUREMENT_LAW.md`.

**fable-frontend, step 6:**

> Before a measurement is quoted or acted on, check its row in
> `_design-system/INSTRUMENT_CALIBRATION.md`. No row, or a row older than the instrument's last
> edit, means it is a hint, not proof (`~/.claude/MEASUREMENT_LAW.md`).

**REPORT_SYSTEM section 5, new bullet:**

> - **Measurement disagrees with what he saw**: quote his words in one line, state the reading in one
>   plain sentence with no units, give one thing to look at, then two labelled options he can answer
>   with a single letter. No numbers, no method, no file names. Do not act until he picks
>   (`~/.claude/MEASUREMENT_LAW.md` part 2).

---

# How this fails

Honestly, and this matters more than the rest of the document.

**These are advice, and advice loses.** A gate blocks. A rule in a skill file gets read at the start
of a turn and then outranked twenty minutes later by task focus. This estate's own six-week retro
concluded exactly that: gates work, advice does not. So Q5 and Q6 are the weak kind of rule by
construction. He froze new gates knowing that trade, and the freeze is right (241 hook files, and by
his own LAW_SYSTEM section 6.9 the three most-repeated mistakes are the three with the most gates),
but "right" and "will always hold" are not the same claim and I am not making the second one.

**The gate-shaped piece I am deliberately not proposing.** Whether a calibration row exists and is
fresh IS objective and cheap, so it would pass the freeze test. I am not proposing it. There are 64
armed Stop gates already, one of them (`instrument-corroboration-gate.py`) stood silent through the
worst instance it was built for because other gates had fired first, and gate 65 on this class is the
reflex he just killed. If instrument validation gets skipped twice after this ships, the right move
is to extend `instrument-corroboration-gate.py`, which is armed and already covers "one instrument
said no", not to write a new file.

**The calibration corpus is thin, and it shrinks.** Eight machine-readable rejected treatments and
sixteen verbatim verdicts in the taste log is not many cases. Worse, rejected artifacts get deleted:
the rejected half of the search-card pair is already gone from disk, which is why that case cannot be
used. Calibration can prove an instrument is blind in a known way. It can never prove it is right on
a screen nobody has judged yet. The fifteenth animation attempt could still fail with every row green.

**Q7's mechanical half is checkable, its judgment half is not.** A gate can force the words "the
method changed, here is how". It cannot check that what changed was the method rather than the
fourth knob. Under pressure I can satisfy a regex with a sentence and ship attempt four. The only
real backstop is the third move, coming to him, and that spends the exact thing he is trying to spend
less of.

**The attempt counter will under-report.** It reads transcripts. Compaction drops earlier text out of
the current one, and clearing starts a fresh file. Reading the project's transcript directory helps
(31 sessions are on disk for this project) but the count will still miss attempts, never invent them.
Under-reporting means attempt five gets treated as attempt two, which is the failure that matters
here and I have no clean fix for it short of a durable per-defect ledger, which is another file and
another thing to maintain.

**Part 2 costs him a turn every time it fires.** If a check disagrees with him twice in one session,
he gets asked twice. If the disagreement rate is high because the instruments are bad, this rule
converts a bad instrument into an interruption stream aimed at him. Part 1 is what keeps that rate
down, so if Part 1 is skipped, Part 2 becomes a tax on him rather than a fix.