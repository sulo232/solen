<!-- exists-check: net-new vs DESIGN_PRINCIPLE_RESEARCH.md (that pass TESTED our rules for
     provenance and is superseded in method by R12), PRINCIPLE_RESEARCH_HANDOFF.md (backend and the
     rest), POLISH_DIAGNOSIS.md and MOCKUP_QUEUE.md (queue empty, 42/42). This file is the
     RE-ENGINEERING of the design system we already have, measured against live Airbnb, and it is
     explicitly "improve what exists", never rebuild from scratch. -->

# DESIGN RE-ENGINEER , improve what we already have, measured against the real thing

**Owner, 2026-07-28.** Readback of the asks in his own order:

- [ ] 1. CORRECTION: my "Apple has nothing for web" answer missed the point. He wants an **app-like feel ON web**, which is what Airbnb does. Answer the question he actually asked.
- [ ] 2. Research how Airbnb and Apple do **typography**.
- [ ] 3. Research how they do **spacing and distance**.
- [ ] 4. Research **when and how they use lines** (the element he selected is an Airbnb divider).
- [ ] 5. Research how they do **grouping**.
- [ ] 6. Research how they do **drop shadow**, and specifically WHEN they use it.
- [ ] 7. **Re-engineer / improve** our existing design system and taste files. NOT from scratch.
- [ ] 8. Research **what is missing** or **what we are doing wrong** versus these sites.
- [ ] 9. **Fix the gate/principle about researching.** What I did was not correct and I did not follow his guide.
- [ ] 10. Add a **principle plus gate: ask many questions using the question tool BEFORE the loop starts**. After the loop starts, do not ask, it is autonomous.

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
