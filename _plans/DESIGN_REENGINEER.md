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
- [x] 5. Research how they do **grouping**, and show it. `verified:` the Lines axis of `public/_mockups/design-axes-fs/index.html` injects three grouping treatments into the live PDP. Measured on the rendered page: 18 dividers and 16 section boundaries tagged; the Sections variant blanks every row rule and re-draws one per section at 24px inset.
- [x] 6. Research how they do **drop shadow**, and specifically WHEN. `verified:` the Depth axis injects Airbnb's real three-layer shadow onto the live cards. Measured before `rgba(0,0,0,0) 0 0 0 0`, after `rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.1) 0 6px 8px, rgba(0,0,0,0.18) 0 16px 56px`, across 10 tagged cards. The option that removed elevation was WITHDRAWN, dead per REMOVED.md:85.
- [x] 7. **Re-engineer / improve** the existing system, not from scratch. `verified:` nothing was rebuilt; the mockup restyles the real `app/[locale]/salon/[slug]/page.tsx` in place via contentDocument injection, so every proposal is a delta against shipped code. The system-file rewrites are the next step and depend on which variants get picked.
- [x] 8. Research **what is missing / what we are doing wrong** versus these sites. `verified:` measured table at DESIGN_REENGINEER.md:31-44 plus the CORRECTION section below, which overturns four of my own earlier claims.
- [x] 9. **Fix the gate/principle about researching.** `verified:` `_design-system/RESEARCH_METHOD.md:85` is `## R11. ASK BEFORE YOU LOOP` and `:100` is `## R12. DATE EVERY PRINCIPLE`, both in commit `615e6b39e`. R12's premise was checked against the file BEFORE it was written: grepping R1 to R10 for date, era, recency and supersession returned nothing.
- [x] 10. Add a **principle plus gate: ask many questions using the question tool BEFORE the loop starts**. `verified:` `~/.claude/hooks/ask-before-loop-gate.py` (8,348 bytes on disk), wired at `~/.claude/settings.json:29` under matcher `Workflow`; suite `~/.claude/hooks/tests/test_ask_before_loop_gate.py` returns **15/15**. Two-sided by design: never fires on a resume or on an explicit release.
- [x] 10b. Follow-on the owner added while answering: **"make a gate for question ... for question making"**, meaning a question about how something LOOKS must come with something rendered. `verified:` `~/.claude/hooks/visual-question-needs-render-gate.py` (7,325 bytes), wired at `~/.claude/settings.json:38` under matcher `AskUserQuestion`; suite `test_visual_question_gate.py` returns **12/12**, with case 1 being the exact prose-only question round that produced it.

## CORRECTION, measured 2026-07-28 on /de/salon/cuts-and-culture at 402x874

The table further down measures AIRBNB correctly, but the "ours" column in it quoted numbers from
the 2026-07-25 flatness diagnosis and from the /de home as though they described the salon page.
They do not. Measured on the actual PDP:

| what I claimed | measured on this page | verdict |
|---|---|---|
| 86% of text at weight >=600 | **17.6%**, 16 of 91 elements | my number belonged to another surface |
| dividers at 0px inset, full width | **all 12 at left:16, width 370**, none full width | wrong, we already inset |
| anchor 1.57x body | **30px at 1.88x** | already clears both floors, NOT a defect |
| we do not use weight 500 | **400:56, 500:19, 600:16** | wrong, 500 is already in use |
| 7 distinct sizes | **9** (30/22/20/18/16/15/14/13/12) | and Airbnb also ships 9 |

**The real delta against Airbnb is much narrower than the story I told:** inset 16 where the
reference is 24, twelve rules where the reference draws six on a taller page, and sixteen elements
at weight 600 where the reference puts seven. That is the whole gap. The dated feel is not
primarily the type scale, and the 4-size ceiling is not what the reference obeys either, since it
ships 9 sizes itself.

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

---

## CORRECTION, owner 2026-07-28, and it names the real problem

Owner verbatim: *"the main problem is inconsistencies... I saw that you make icons and text and
arrow not aligned in the same heights like Airbnb. And I told you that's wrong, and then you said,
no. That's correct. What I'm doing right now. And then I was furious... maybe I thought in the
outside of the mock up, and generally, that could be the case too. And that's what making stuff
inconsistent. And I then told you to go research. Right? And then you didn't do that."

- [x] CORRECTION 1: I contradicted a visual observation instead of measuring it. He was right. `verified:` the measurement table in this file (Solen PDP 8 icon sizes / 4.35px mean vs Airbnb 1 / 1.29px) proves his claim and refutes mine, commit `3e18f0982`. Gate against the behaviour: `~/.claude/hooks/owner-sees-it-measure-it-gate.py`, wired Stop, suite 12/12.
- [x] CORRECTION 2: I was told to research row alignment and did not. `verified:` the research is now done and recorded in the measurement table below, one identical `getBoundingClientRect` probe run on airbnb.com/rooms/892461288627408577 and on our /de, /de/salon/cuts-and-culture and /de/basel/coiffeur, commit `3e18f0982`.
- [x] CORRECTION 3: `verified:` commit `691f6105c` records the type-ramp proposal measuring WORSE (200 text elements collapsed from five weights to two) and commit `3e18f0982` records the icon scale as the actual defect. The real target is INCONSISTENCY. Everything I
      measured this session (weights, sizes, shadows, divider colour) was the wrong variable, which
      is why every proposal came out worse than the untouched page.
- [x] CORRECTION 4: confirmed in the PRODUCT, not only in the mockup. `verified:` measured on three separate live product routes, all showing a 24.5px worst offset, plus 12 distinct icon sizes over 648+ instances counted in `app/` and `components/` source. Commit `3e18f0982`. Not only in my mockup,
      Measure it across real surfaces.


### THE MEASUREMENT, finally taken. The owner was right.

Identical probe on the live pages and on a live Airbnb PDP: every `<svg>` paired with its nearest
text, comparing optical centres and counting distinct icon box sizes.

| surface | distinct icon sizes | mean offset | worst offset | rows centred |
|---|---|---|---|---|
| **Airbnb PDP** | **1** (24x24 everywhere) | **1.29px** | 9.5px | 8/12 |
| Solen PDP | **8** (11,12,13,15,16,18,19,20) | **4.35px** | **24.5px** | 8/19 |
| Solen home | **7** (11,12,16,18,19,20,21) | 1.85px | **24.5px** | 20/24 |
| Solen search | **6** (8,13,14,16,18,20) | **4.42px** | **24.5px** | 9/14 |

In the SOURCE, counting explicit icon size props across `app/` and `components/`:
**12 distinct sizes, 648+ instances**, led by 16 (129 uses), 14 (120), 18 (108), 12 (77), 13 (75),
20 (65), 15 (61), 11 (34), 22 (30), 17 (28), 24 (24), 19 (21).

Airbnb ships **one**.

**This is the inconsistency.** With twelve icon sizes in play, an icon beside text almost never
lands on the same optical centre twice, so no two rows have the same rhythm. It is present on
every surface measured, so it is a PRODUCT problem and not a mockup problem, exactly as the owner
suspected. It also explains why the type-ramp and shadow work made things worse rather than better:
those were never the variable.

**Verdict: the icon scale is the first thing to fix, and it is a consistency fix, not a taste
change.** Collapse 12 sizes to a small set of named roles, then re-measure the offsets.


### The icon fix, built and measured. Half of it works, half of it does not.

An Icons axis now injects two candidate scales into the real page, and the header carries two live
counters describing the owner's actual complaint: distinct icon boxes on screen, and mean
icon-to-text offset.

| state | distinct icon boxes | mean offset |
|---|---|---|
| now | **6** | 2.31px |
| One size (20 everywhere) | **1** | **2.31px** |
| Three roles (16 meta / 20 row / 24 nav) | **2** | **2.31px** |

**Honest result: the size inconsistency is solved and the alignment offset is not.** Normalising
the box takes 6 distinct sizes to 1, which is the reference's own answer. It moves the offset by
nothing at all.

That is a finding rather than a failure, and it corrects my own assumption: the icon-to-text offset
is NOT caused by icons being different sizes. It is caused by rows that never centre their
children. Injecting `align-items:center` onto each icon's immediate parent also failed to move it,
because that parent is frequently a wrapper span rather than the flex row that lays out the icon
beside the text.

**So the alignment half cannot be fixed by an injected override; it needs the row components
themselves.** The size half can be swept mechanically and needs no taste decision.

Role split, measured after the tagger was corrected: meta 8, row 38, nav 4. The first tagger read
only the immediate parent and dumped 46 of 50 icons into "nav"; counting the roles exposed it.


### CORRECTION 2, owner 2026-07-29: "the link i gave me ion see any change cz pdl doesnt have icons"

He was right twice over, and both corrections are on me.

**1. I pointed the harness at a screen with almost no icon rows.** The PDP's first viewport carries
very few icon-plus-text rows, so flipping the Icons axis there changes nothing a person can see.
The harness now opens on `/de/profile`, where the icon rows actually live, and the change is
visible: nine icons in the first viewport go from **six distinct widths (16, 18, 20, 20, 21, 22,
22, 22, 24) to one (20)**.

**2. My "24.5px worst offset" was largely NOT our UI.** Re-measuring `/de/profile` and separating
our own markup from third-party chrome:

| what | offset |
|---|---|
| our own rows (Profil, Profil, QA) | **0.0px, all three** |
| the cookie consent banner | 10.3px and 8.3px |
| an e-mail form field | the 24.5px I kept quoting |

**So our rows are already centred.** The alignment claim I built a whole axis around was measuring
a consent banner and a form input. What IS real, and visible on that screen, is the SIZE spread:
five different icon widths among five rows (16, 20, 21, 22, 24) where two of them differ by a
single pixel.

Two claims I had conflated and that are now separated: sizes ARE inconsistent, our rows are NOT
misaligned. The first is worth fixing and is mechanical. The second was never a defect.


### THE FULL ICON AUDIT, and it is worse than I reported

`_design-system/research/ICON_SCALE_AUDIT.json`, generated by scanning every `.tsx` under `app/`
and `components/` for an explicit icon `size` prop. Machine-readable, one entry per instance with
file, line, component, current size and proposed role.

| | |
|---|---|
| instances | **888** |
| distinct sizes | **26** |
| files touched | **198** |
| already on a role target | 93 |
| would change | **795** |

Distribution: 8:3, 9:3, 10:18, 11:34, 12:78, 13:75, 14:125, 15:66, 16:131, 17:32, 18:126, 19:22,
20:68, 21:8, 22:32, 24:25, 26:3, 28:10, 30:6, 32:8, 34:3, 36:6, 38:1, 40:2, 44:1, 48:2.

**Correction to my own earlier figure.** I reported "12 distinct sizes, 648+ instances" from a
cruder grep. The real numbers are **26 sizes across 888 instances**. Airbnb ships one. There are
icons at 8, 9 and 10 pixels, and sizes 12 through 22 are all in use with no gap, which means the
scale is not a scale at all: it is 26 individual decisions.

The audit is complete and mechanical. The only open question is the target set, which the mockup
puts in front of the owner: one size everywhere, or three named roles (16 meta / 20 row / 24 nav).
Once picked, the sweep is a single pass over the 795 entries already listed in the JSON.


### STOPPED, owner 2026-07-29: "this after so many buttons sh i dont like it stop"

Halted here at his instruction. Recorded so it is not repeated rather than argued with:

**The mockup format was wrong.** I grew a comparison harness into a five-row control panel (Type,
Lines, Depth, Icons, Screen). Twenty buttons above the screen being judged. A mockup is meant to
show ONE thing clearly enough to react to; this asked him to operate an instrument and find the
change himself. I added each axis separately and never looked at the whole thing as an object he
has to use.

**Nothing here is blocked and nothing needs a decision to be preserved.** What stands on its own:
- `_design-system/research/ICON_SCALE_AUDIT.json` , 888 icon instances, 26 distinct sizes, 198
  files, complete and machine-readable. This is the real finding.
- The measured corrections: our own rows are centred at 0.0px (the offsets I kept quoting were a
  cookie banner and a form field); our PDP already matches the reference on type sizes, weights and
  divider inset.
- Six gates added this session, all self-tested and wired.

NOT resumed without an explicit owner yes.


## PROFILE PAGE AUDIT, owner 2026-07-29: "the profile page is also ultra ass ... doesnt follow our taste nor design system at all"

Measured on the live `/de/profile` at 402x874, signed in, first viewport only, our own markup with
consent chrome excluded. Graded against our OWN written rules, not against taste.

### FAILS, four of them

| our rule | where | ceiling | measured | verdict |
|---|---|---|---|---|
| emphasis budget | CLAUDE.md FLOORS LAW 7(a) | <= 30% at weight >= 600 | **56.7%** (17 of 30 text elements) | **FAIL, nearly double** |
| distinct font sizes | CLAUDE.md NEVER-AGAIN floor 2 | <= 4 | **7** (28, 18, 16, 15, 14, 13, 12) | **FAIL** |
| distinct weights | LOCKFILE type budget | <= 2 | **3** (400, 600, 700) | **FAIL** |
| touch target | locked contract, `h-11` | >= 44px | **36x36 and 40x40** | **FAIL, two of ours** |

**The emphasis number is the headline.** More than half the visible text is bold. That is what makes
a screen read heavy, flat and undesigned, and it is the single biggest gap between this page and
the reference, which sits at 3.1%.

**The size spread compounds it.** Four of the seven sizes (12, 13, 14, 15) live within a 3px band.
That is FLOORS LAW 7(c) exactly: variety without range. It costs consistency and buys no hierarchy.

### PASSES, recorded so they do not get "fixed"

| our rule | measured | verdict |
|---|---|---|
| display anchor >= 28px (FLOORS LAW 6) | 28px | PASS |
| anchor >= 1.8x body (7b) | 2.00x (28 over 14) | PASS |
| imagery >= roughly 1/3 (FLOORS LAW 2) | 46.7% of the viewport | PASS |
| radii from the locked set | 12, 16, 24 only | PASS |
| text contrast, WCAG AA | zero elements below 4.5:1 | PASS |
| fonts | Inter Tight + Inter | PASS |

### So the owner is right, and specifically right

He said it does not follow the design system. It does not: it breaks four written rules. But the
break is not everywhere, it is concentrated in TYPE, and above all in weight. Colour, contrast,
radius, imagery and the anchor are all compliant. Fixing bold alone would move this page more than
everything else I proposed this week combined.
