# BALANCE: the two measures that survived, and the six that did not

<!-- exists-check 2026-07-31: `npm run exists balance` returns 6 hits, all financial balance
     (gift-card balance API, referral credit) or the /dev/search-balance mock. No design-balance
     doc exists. `ls _design-system/BALANCE.md` before writing: absent. This file is NET-NEW and
     is the durable law layer over `_design-system/research/BALANCE_VERDICT.md` (the adversarial
     round) and the four lens files under research/ (BALANCE_WEIGHT, BALANCE_ALIGN, BALANCE_LOGO,
     BALANCE_CLUTTER). Those five stay unedited: they are their authors' records and the negative
     results in them must stay reproducible. Nothing here supersedes FLOORS LAW; floor 8 of that
     law is the rule this file makes runnable. -->

Written 2026-07-31. Runner: `scripts/measure-balance.mjs`.

**Why this section exists, in the owner's words:** *"I believe it's all math or not. You said sixty
percent. But you can actually measure, like, logo looks weird or the balance and stuff. Balance is
the most easiest measure or not."* He was right and the hedge he was correcting was wrong. What
follows is what happened when we actually tried: eight candidate measures built, run against eight
rendered screens including one he likes and one he called "ultra ass". **Two survive. Six are dead
and are listed by name at the bottom so nobody re-proposes them.**

The honest headline, because it is more useful than a win: the six that died all died the same way.
Every one of them takes ONE screen as input. The thing he objected to is a RELATIONSHIP, so no
amount of tuning a single-screen statistic was ever going to find it.

---

## How to run it

```
node scripts/measure-balance.mjs /de
node scripts/measure-balance.mjs /de --viewport mobile          # 390x844, the default
node scripts/measure-balance.mjs /de/profile --dev-login        # authenticated surfaces
node scripts/measure-balance.mjs /de /de/profile                # 2+ URLs adds the cross-screen pass
node scripts/measure-balance.mjs /de --gate                     # exit 1 on any FAIL
node scripts/measure-balance.mjs /de --json
```

Default viewport is 390x844, matching FLOORS LAW 2 and `check-geometry.mjs`. It reuses the repo's
existing Playwright and adds no dependency. It is **not wired to any hook**, by decision, see
"Status" at the bottom.

---

## BALANCE FLOOR 1: NOTHING IS SHEARED (M1, frame overflow)

**The rule.** No `overflow: hidden` or `overflow: clip` container in the first viewport may hold
content wider than its own frame. Measured as `scrollWidth - clientWidth` on every such container
larger than 40x20px that intersects the first viewport.

**Threshold: FAIL above 10px.**

**Why 10 and not 0.** There is no distribution to calibrate against, so this is a gap threshold, not
a fitted one. Across eight screens the clean ones sit at exactly 0, `/de` reads 9px off an invisible
closed modal, and the one real defect reads 32px. 10 sits in the empty space between the artifact
and the defect.

**Why `auto` and `scroll` are excluded, and this exclusion is load-bearing.** A horizontally
scrollable rail is required by FLOORS LAW 3, which mandates a visibly cropped next item as the
scroll promise. A measure that flagged scrollers would fight our own density floor.

**What it caught.** The rejected `home-v3/index.html`: `div.screen` is a 358px frame holding 390px
of content, so the white card is visibly sliced down its right edge, cutting the search pill and the
"Nails" chip. Zero false positives across the other seven screens.

**What it is honestly not.** It is **not a taste measure and must never be presented as one.** It
scored 0px on the screen the owner likes and 0px on the screen he hates. It carries no information
about the decisive pair. It also did not catch the three rejected mockups: `n1`, `n2` and `n3`
standalone all measure 0px. It caught a defect of the comparison *shell* those three sit inside. It
is a cheap, exact bug detector that would have stopped one bad delivery, and that is all it is.

---

## BALANCE FLOOR 2: ONE ENTITY, ONE RENDERING (M8, entity-render divergence)

**The rule.** A salon that appears on more than one customer screen renders through one component
with one anatomy. Measured as a signature per card:

```
(photo count | first-photo aspect ratio | price present | rating present)
```

A card is the smallest ancestor of a `/{locale}/salon/{slug}` link that contains at least one photo,
is 60 to 520px tall, and does not contain a different salon's link.

**Threshold: any ONE entity producing two or more signatures is a FAIL**, whether the two renderings
sit on the same screen or on two different screens.

**Why this one and not the other seven.** It is the only measure tested that ranked the owner's
stated preference correctly without any threshold tuning. It reproduces FLOORS LAW 8 to the decimal:
the law asserts `/de` renders the salon at a 5/4 ratio, and the measured aspect is 1.25.

**What it catches, measured 2026-07-31 across `/de` and `/de/profile`:**

```
                          /de          1 | 1.25 | price   | rating
haarsalon-margot          /de/profile  3 | 0.98 | noprice | norating
```

Seven of seven salons that appear on both screens render two different ways. The profile version
drops **price** and **rating**, two load-bearing fields the same salon carries everywhere else.

**Why font size is NOT in the signature.** `/de` renders the card name at 14 and
`/de/basel/coiffeur` renders it at 16. The owner has never objected to that. Including size would
fire on screens he likes.

**Why the photo aspect has a 1.05x tolerance, amending BALANCE_VERDICT.md.** The verdict specified
"aspect to 2dp" with no tolerance. Measured, that is a false-positive generator: on `/de/profile`
the saved row renders cards 175px wide and the "Neu für dich" row renders them 148px wide, both
using the same photo tray with a FIXED 2px gap, so the first photo comes out at 0.982 in one and
0.973 in the other. That is a 0.9% difference caused by a constant gap in two container widths, and
at 2dp it reads as two signatures. 1.05 sits an order of magnitude above that artifact and an order
of magnitude below the divergence the measure exists to catch (1.25 against 0.97, a 29% difference).
Both bounds are measured. The raw 2dp signatures stay in the output so the clustering hides nothing.

**Consequence of that amendment, stated plainly rather than buried:** with the tolerance applied,
`/de/profile` **passes** the within-screen check and fails only the cross-screen one. That is the
correct answer and it confirms the verdict's own section 4. Within itself, profile is one card
design at two widths. The defect only exists relative to the rest of the product. **Running this
measure on a single screen will not find the thing it was built to find. Give it two screens.**

**Its status is HYPOTHESIS, not law.** n = 1 disliked screen, and it was built after its author saw
the label, which is the same weakness the adversarial round criticised the four lenses for. It
survived one honest test. Run it against the owner's next few rejections before anyone wires it, and
abandon it if it goes quiet. What is solid regardless of the metric: `/de/profile` really does drop
price and rating for salons that carry both everywhere else.

---

## Calibration sample

Eight screens, 390x844, `deviceScaleFactor: 2`, locale `de-CH`, scroll position 0, against the dev
server. `/de/profile` measured **signed in** through `/api/dev/login`, because signed out that URL
is a login form and grading it grades the wrong screen.

| screen | owner's verdict | M1 worst | M8 cards | M8 signature(s) | result |
|---|---|---|---|---|---|
| `home-v3/index.html` | REJECTED | **32px** | 0 | none | **M1 FAIL** |
| `home-v3/n1.html` | REJECTED | 0px | 0 | none | pass, caught nothing |
| `home-v3/n2.html` | REJECTED | 0px | 0 | none | pass, caught nothing |
| `home-v3/n3.html` | REJECTED | 0px | 0 | none | pass, caught nothing |
| `/de` | not stated | 9px | 19 | `1 \| 1.25 \| price \| rating` | pass |
| `/de/basel/coiffeur` | not stated | 1px | 8 | `1 \| 1.25 \| price \| rating` | pass |
| `/de/salon/cuts-and-culture` | **LIKED** | 0px | 0 | none | pass |
| `/de/profile` signed in | **DISLIKED** | 0px | 10 | `3 \| 0.98 \| noprice \| norating` | **M8 cross-screen FAIL, 7 of 7** |

Read the third and fourth rows honestly: **three screens the owner rejected pass both floors.** These
two measures are not a taste gate. They are two specific, real defects that are now arithmetic
instead of opinion.

**Reproducing the first row.** `public/_mockups/home-v3/index.html` was deleted from the working
tree by a concurrent session on 2026-07-31 while this was being measured. It still exists at HEAD,
so the row is reproducible with a temporary copy in the same directory (relative asset paths must
still resolve, so do not copy it elsewhere):

```
git show HEAD:public/_mockups/home-v3/index.html > public/_mockups/home-v3/_tmp.html
node scripts/measure-balance.mjs /_mockups/home-v3/_tmp.html
rm public/_mockups/home-v3/_tmp.html
```

---

## Three defects found in the measures themselves while building the runner

Recorded because each one produced a confident wrong answer before it was caught, and any future
measure will fail the same ways.

1. **A missing screen was graded PASS.** A concurrent session deleted
   `public/_mockups/home-v3/index.html` mid-run. The URL fell through to Next's `[locale]/[city]`
   catch-all, the server returned a 500 error page, and the script measured that error page and
   reported `VERDICT PASS`. **The runner now refuses to grade any response with status >= 400.** A
   tool that answers PASS for a screen that does not exist is worse than no tool, because it is
   trusted.

2. **A team section was counted as a salon card.** On the PDP, ten service rows link to
   `/salon/{slug}/booking?service={uuid}`. The card resolver climbed until it found photos in the
   height band and landed on `#section-team`, the stylist strip, reporting it as a salon card with
   signature `3 | 1.00 | noprice | norating`. **BALANCE_VERDICT.md's PDP row carries this same
   artifact.** Fixed by requiring a card link to end at the slug (the real `SalonCard`, line 385,
   renders an href of `/{locale}/salon/{slug}` and nothing deeper) and by ignoring self-links, since
   a detail page is the entity and not a card of it. The PDP now correctly resolves zero cards.

3. **A slow API read as an empty screen.** `/de/basel/coiffeur` renders its results from a call the
   dev server answered in 10.0s. With a 5s settle the runner reported "0 salon cards" on a page that
   has eight, and M8 said N/A on a screen it should have graded. Fixed with a `networkidle` wait
   before the fixed settle. This is the project's named number-one failure mode, a silent no-op, and
   it appeared inside the tool built to detect defects.

---

## KILLED. Do not re-propose these without re-running the decisive test.

The decisive test any candidate must pass: rank `/de/salon/cuts-and-culture`, which the owner likes,
**above** `/de/profile`, which he called "ultra ass". That ordering was fixed before any number was
computed. Full workings in `_design-system/research/BALANCE_VERDICT.md` section 3.

**Provenance, so the two are not confused:** every number in the two surviving floors and in the
calibration table above was re-measured on 2026-07-31 by `scripts/measure-balance.mjs`. Every number
in the killed table below is **quoted from BALANCE_VERDICT.md and was not re-measured here**, since
the runner does not implement dead measures. Two of those numbers were independently reproduced
across two harnesses on different days and agreed (`/de` chrome share 38.4 against 37.0, PDP
near-miss 57.8 against 57.4), so the instruments are stable. They are measuring something real. It
is just not his taste.

| measure | liked screen | disliked screen | why it is dead |
|---|---|---|---|
| **Chrome share** (control+icon area as a share of the first viewport) | 11.3% | **6.2%** | INVERTED. Ranks the screen he hates as the cleanest of all eight. Flags none of the four rejected mockups (they score 7.5 to 12.2). It measures screen KIND, not screen quality: a PDP with a booking control is control-heavy by nature, a saved-items grid is photo-heavy by nature. Its 25% threshold was a house number fitted to n=13 with no external source, which its own author flagged. Keep only as a one-off diagnostic on `/de` (30.9% of its first viewport is control fill against 0.6% photography). |
| **Rail near-miss** (how often two rails sit 1 to 4px apart) | **57.4%, worst of eight** | **6.5%, best of eight** | STRONGLY INVERTED, and not noise. More real content means more edges means more chances two land 3px apart, so it partly counts density, which our own FLOORS LAW mandates. |
| **Logo letterform distance** | FAIL | no logo | Two structural defects, not tuning. It graded a footer logo at `top: 4386.9` on a 5058px page, 5.2 viewports below the fold, and returned FAIL for a screen he likes. And the same wordmark scores 0.0596 in `index.html` but 0.3718 standalone in `n2.html` purely because `n2.html` sets no body font and falls back to Times: **the metric rewards broken body typography.** Only 2 of 8 screens have a logo in the first viewport at all. |
| **Distinct corner radii** | 4 | 4 | Tie. Rejected mockups score 3 and 4, inside the reference band. Flags nothing. |
| **Icon size vocabulary** | 5 | 5 | Tie. Also unstable: the same screen counts 7 or 3 depending only on whether you scope to the cell or the standalone file. |
| **Visual weight / optical centre** | 3.92 | 3.71 | Inverted and inside noise, with a positive control proving the instrument itself works. Confirmed on the DOM implementation only; the pixel raster was not re-run. |

**The one durable finding from the dead logo measure**, kept as a fact about our asset and not as a
gate: our wordmark is live text set in our own interface typeface, `Inter Tight 600` against a body
of `Inter 400`, letterform distance 0.0144, where 5 of 5 references paint a drawn mark. That is a
one-time observation about one asset. It is not something to run on every screen.

---

## Status

**Nothing here is wired.** No hook, no PreToolUse gate, no CI step. That is a decision, not an
omission: the strongest result in this research is a kill list, and arming a gate off the back of it
would be the opposite of what the evidence supports. Floor 2 in particular needs the owner's next
few rejections before it earns enforcement.

Run it in the design-verifier render pass, by hand, or with `--gate` in a check. It needs a rendered
page, so it can never be a PreToolUse hook on file content.

**If you add a measure to this file**, it does not get in on plausibility. It runs against the eight
screens above, and it ranks the liked screen above the disliked one, or it goes in the killed table
with its numbers.
