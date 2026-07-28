<!-- exists-check: net-new vs DESIGN_PRINCIPLE_RESEARCH.md (that pass TESTED our rules for
     provenance and is superseded in method by R12), PRINCIPLE_RESEARCH_HANDOFF.md (backend and the
     rest), POLISH_DIAGNOSIS.md and MOCKUP_QUEUE.md (queue empty, 42/42). This file is the
     RE-ENGINEERING of the design system we already have, measured against live Airbnb, and it is
     explicitly "improve what exists", never rebuild from scratch. -->

# DESIGN RE-ENGINEER , improve what we already have, measured against the real thing

**Owner, 2026-07-28.** Readback of the asks in his own order:

- [x] 1. CORRECTION: my "Apple has nothing for web" answer missed the point. He wants an **app-like feel ON web**, which is what Airbnb does. **Answered:** Airbnb imports no platform system at all. It runs one custom variable family (Airbnb Cereal VF), its own scale and its own shadow set, on the web, so the app-feel comes from execution and not from Apple's or Google's kit. `verified:` font family read off the live PDP via `getComputedStyle`, sole family `Airbnb Cereal VF`; evidence table at DESIGN_REENGINEER.md:31-44, commit `615e6b39e`.
- [x] 2. Research how Airbnb and Apple do **typography**. **First pass measured** on a live Airbnb PDP: 9 sizes, 16 size/weight pairs, emphasis at weight 500, 3.1% at 600+. `verified:` DESIGN_REENGINEER.md:38-41 (type rows of the measured table) and the raw weight histogram 400:259 / 500:117 / 600:7 / 700:5, commit `615e6b39e`. Apple side and the WHY behind the pairs remain in the blocked loop.
- [x] 3. Research how they do **spacing and distance**. **First pass measured:** 24px page inset; gaps between section rules of 83 / 88 / 147 / 405 / 443 / 743 px, so section rhythm is content-driven, not a fixed step. `verified:` DESIGN_REENGINEER.md:36-37, commit `615e6b39e`. Deeper pass in the blocked loop.
- [x] 4. Research **when and how they use lines** (the element he selected is an Airbnb divider). **Measured, and this one is essentially answered:** `#DDDDDD`, 1px `border-top`, 354px wide in a 402 viewport so inset 24px each side, and only **6** on a page over 3,500px tall. Lines separate SECTIONS, never rows. `verified:` DESIGN_REENGINEER.md:36-38, commit `615e6b39e`.
- [ ] 5. Research how they do **grouping**. BLOCKED on question Q3 below (does grouping stay a grey tray, or move to whitespace-plus-heading as Airbnb does).
- [ ] 6. Research how they do **drop shadow**, and specifically WHEN they use it. Five distinct shadows captured, including a real three-layer one. BLOCKED on question Q4 (how much depth you want, given the current flat house style).
- [ ] 7. **Re-engineer / improve** our existing design system and taste files. NOT from scratch. BLOCKED on Q1, Q2, Q3, Q4: each answer changes which LOCKFILE rows get rewritten.
- [ ] 8. Research **what is missing** or **what we are doing wrong** versus these sites. Partly delivered in the contradiction table below. Full pass BLOCKED on Q5 (which surfaces are in scope).
- [x] 9. **Fix the gate/principle about researching.** `verified:` `_design-system/RESEARCH_METHOD.md:85` is `## R11. ASK BEFORE YOU LOOP` and `:100` is `## R12. DATE EVERY PRINCIPLE`, both in commit `615e6b39e`. R12's premise was checked against the file BEFORE it was written: grepping R1 to R10 for date, era, recency and supersession returned nothing.
- [x] 10. Add a **principle plus gate: ask many questions using the question tool BEFORE the loop starts**. `verified:` `~/.claude/hooks/ask-before-loop-gate.py` (8,348 bytes on disk), wired at `~/.claude/settings.json:29` under matcher `Workflow`; suite `~/.claude/hooks/tests/test_ask_before_loop_gate.py` returns **15/15**. Two-sided by design: never fires on a resume or on an explicit release.
- [x] 10b. Follow-on the owner added while answering: **"make a gate for question ... for question making"**, meaning a question about how something LOOKS must come with something rendered. `verified:` `~/.claude/hooks/visual-question-needs-render-gate.py` (7,325 bytes), wired at `~/.claude/settings.json:38` under matcher `AskUserQuestion`; suite `test_visual_question_gate.py` returns **12/12**, with case 1 being the exact prose-only question round that produced it.

**Items 5 to 8 are the loop, and the loop is deliberately not started.** The named dependency is the owner's answers to Q1 to Q5, put to him with the question tool in the same turn this file was written. That is R11 operating as designed on the very ask that produced it.

## Delivered this turn, before any loop

- [x] 9 + 10. `~/.claude/hooks/ask-before-loop-gate.py` written, **self-tested 15/15**, wired into `settings.json` PreToolUse on `Workflow`, settings re-validated as JSON. Two-sided by design: blocks a loop launched with no question round, and never fires on a resume or when the owner has released it. The test that mattered caught a real inversion, "dont ask me just finish it" contains the substring "ask me" and was being read as a REQUEST for questions.
- [x] 9. `RESEARCH_METHOD.md` gains **R11 (ask before you loop)** and **R12 (date every principle, provenance is not recency)**. R12 is verified against the file: none of R1 to R10 mentioned a date, an era, or supersession.

## MEASURED on a live Airbnb PDP, 402x874, same viewport as our design constant

Not recalled, not from a screenshot. `getBoundingClientRect` plus `getComputedStyle` on
`airbnb.com/rooms/892461288627408577`.

| axis | Airbnb, measured | ours | verdict |
|---|---|---|---|
| divider colour | `#DDDDDD` 1px | `#E4E4E7` 1px | close, theirs is warmer and darker |
| divider width | **354px in a 402 viewport** = **24px inset each side** | we shipped 0px inset until yesterday | our CONTAINER TEST was right |
| divider count | **6 section rules** on a very long page | we put one between every ROW | **we massively over-rule** |
| gaps between rules | 83, 88, 147, 405, 443, 743, 468, 115, 445 | uniform | rules mark SECTIONS, not rows |
| type sizes | **10, 12, 14, 16, 18, 22, 24, 26, 32** = 9 distinct | ceiling of **4** | **our ceiling is wrong** |
| type pairs | 16 distinct size/weight combos | 4 | ditto |
| weights | **400 (259), 500 (117), 600 (7), 700 (5)** | ceiling of 2, and we use 600 as the workhorse | **their emphasis weight is 500, not 600** |
| weight >= 600 | **3.1%** of visible text | our house ceiling says <= 30%, our PDP measured 86% | our number is far too loose AND we use the wrong weight |
| shadows | 5 distinct, incl. a **three-layer** modal shadow | one `shadow-whisper` | we under-use depth |
| radii | 4, 8, 12, 16, 24, 32, 50, 100 | 12 / 16 / 24 / pill | they use far more |
| font | **Airbnb Cereal VF**, one variable family | Inter Tight + Inter | fine, but they run ONE family |

### The three findings that most directly contradict our own rules

1. **Our 4-size type ceiling is not what the reference does.** Airbnb ships 9 sizes. The ceiling was written to stop drift, and it does, but it also caps hierarchy. What Airbnb actually holds constant is the WEIGHT discipline, not the size count.
2. **We use the wrong emphasis weight.** Airbnb carries emphasis at **500** and reserves 600 and 700 for 12 elements on an entire page, 3.1% of text. We use 600 as the default bold, everywhere.
3. **We over-rule.** They use 6 horizontal lines on a page taller than 3,500px, always inset 24px, always between SECTIONS. We draw one between every row.

### A debunk of our own debunk

Our earlier research recorded a three-layer box-shadow attributed to Airbnb as "no credible source, probably invented". **Measured on the live page it is real:**
`rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.1) 0 6px 8px, rgba(0,0,0,0.18) 0 16px 56px`.
R6 says verify load-bearing claims yourself. That debunk was wrong and is now corrected by measurement.

## BLOCKED ON OWNER ANSWERS, per R11

Items 1 through 8 are the loop. It is NOT started, because R11 and its gate now forbid starting one
without a question round, and this is exactly the ask that produced that rule. Questions are being
put to the owner via the question tool in the same turn as this file.
