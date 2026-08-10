# BALANCE_VERDICT: which of the four lenses' measures survive an adversarial test

<!-- exists-check: net-new vs _design-system/research/BALANCE_WEIGHT.md, BALANCE_ALIGN.md,
     BALANCE_LOGO.md, BALANCE_CLUTTER.md (all four read in full before writing, this file is the
     adversarial round OVER them and cites each by section), AXIS_ALIGNMENT.md (read: it measures
     the vertical axis of a single list row, icon/label/chevron, and left-edge columns; it proposes
     no pass/fail instrument and does not touch clutter, logo or visual weight), TASTE_HIERARCHY.md,
     TASTE_GROUPING.md, TASTE_RANGE.md, TASTE_TYPOGRAPHY.md (grepped: emphasis order, grouping,
     size range and type scale, none of them a validation of a measurement instrument against the
     owner's stated likes and dislikes). `npm run exists balance` run 2026-07-31: 6 hits, all
     financial balance or a dev search mock, no graveyard hit. The four BALANCE_*.md files are
     deliberately NOT edited: each is its author's own record and the negative results in them stay
     reproducible. This file is the cross-lens verdict that none of them could write about itself. -->

Written 2026-07-31. Adversarial round over `BALANCE_WEIGHT.md`, `BALANCE_ALIGN.md`,
`BALANCE_LOGO.md`, `BALANCE_CLUTTER.md`.

**The one-line answer: of the three measures that claimed to work, one survives, and it does not
measure taste.** Frame overflow survives as a correctness check. Chrome share and the logo
letterform test both fail the decisive test. Two of the three "secondary" candidates fail too. A
measure the four lenses did not build, entity-render divergence, is the only thing tested here that
orders the owner's stated preference correctly, and it is a hypothesis on a small sample rather than
a validated instrument.

---

## 0. The test, and why it is the right one

Each lens validated its measure against screens its own author chose. That is the weakest possible
evidence, because the author picks the sample after seeing the measure behave. This round uses a
label nobody in the research loop controlled:

> the salon page is the ONE screen he says he likes. The profile page he called "ultra ass".

A measure that claims to track his taste must rank `/de/salon/cuts-and-culture` **above**
`/de/profile`. That ordering was fixed before any number was computed, and no lens author had seen
either screen. Anything that inverts it, or ties on it, is not measuring what we need.

### Sample

Eight rendered screens, 390x844, `deviceScaleFactor: 2`, scroll position 0, locale `de-CH`,
Playwright 1.59.1 against the live dev server on `localhost:50723`.

| id | url | owner's verdict |
|---|---|---|
| `mockup-index` | `/_mockups/home-v3/index.html` | REJECTED, the file he was looking at |
| `mockup-n1` | `/_mockups/home-v3/n1.html` | REJECTED variant, standalone |
| `mockup-n2` | `/_mockups/home-v3/n2.html` | REJECTED variant, standalone |
| `mockup-n3` | `/_mockups/home-v3/n3.html` | REJECTED variant, standalone |
| `home` | `/de` | not stated |
| `salon` | `/de/salon/cuts-and-culture` | **LIKED** |
| `profile-auth` | `/de/profile`, signed in | **DISLIKED** |
| `profile-out` | `/de/profile`, signed out | control, see 1.2 |

### Method

M1, M2, M3, M6 and M7 are the lens authors' code **verbatim**, copied out of their files unchanged,
so this round tests their measures rather than my paraphrase of them. M4 and M5 are
re-implementations, because those harnesses lived in a session scratchpad and are not in the repo;
their definitions are stated in section 3 so the numbers can be disputed. Every number below came
out of that run; none is recalled or estimated.

### Three method bugs caught before they produced a wrong verdict

**1.2 `/de/profile` signed out is a login form, not the profile.** The naive run measured a page
with an email field, a password field and two SSO buttons. That is not the screen he called "ultra
ass", and it scores 31.3% chrome, which would have "failed" the clutter gate and looked like a
confirmation. The real screen is reachable only through `GET /api/dev/login?to=/de/profile`. Both
rows are kept below so the size of the error is visible: the same URL scores **31.3%** signed out
and **6.2%** signed in. Any gate wired against an authenticated surface must authenticate, or it
grades a login form. Worth noting the login form is also an exempt surface under the clutter gate's
own rule ("exempt forms"), so the gate would have been wrong twice over.

**1.3 The Next dev-tools button does not bias the DOM measures, and I checked rather than assumed.**
Our live pages paint a dark circular dev button bottom-left that the static mockups do not have. I
measured chrome share before and after removing `nextjs-portal`, on all eight screens: the delta is
**0.0 points everywhere**. It lives in a shadow root, and `querySelectorAll('*')` does not pierce
shadow DOM, so no DOM-traversal measure ever counted it. It would bias a pixel raster, which is what
`BALANCE_WEIGHT.md`'s ground-truth version uses, so anyone re-running the raster must remove it.

**1.4 `index.html` is a comparison shell, not a screen.** It is 8.05 viewports tall and its first
viewport is mostly explanatory prose about the three variants. Two lens authors flagged this
independently; confirmed here. Numbers derived from its "first viewport" describe a document that
compares designs, not a design.

---

## 1. Every measure against every screen

Bold marks the decisive pair. `LIKED` must beat `DISLIKED` for a measure to be tracking his taste.

| screen | verdict | M1 overflow px | M2 chrome % | M3 logo | M4 radii | M5 icon sizes | M6 L/R imbalance | M7 near-miss % |
|---|---|---|---|---|---|---|---|---|
| `mockup-index` | REJECTED | **32** | 10.2 | FAIL 0.0596 | 4 | 1 | 6.63 | 31.8 |
| `mockup-n1` | REJECTED | 0 | 11.2 | no logo | 3 | 1 | 0.11 | 22.7 |
| `mockup-n2` | REJECTED | 0 | 7.5 | PASS 0.3718 | 3 | 3 | 0.81 | 15.4 |
| `mockup-n3` | REJECTED | 0 | 12.2 | no logo | 3 | 3 | 3.08 | 20.7 |
| `home` | not stated | 9 | **37.0** | FAIL 0.0144 | **7** | 5 | 6.60 | 37.0 |
| **`salon`** | **LIKED** | **0** | **11.3** | FAIL 0.0368 | **4** | **5** | **3.92** | **57.4** |
| **`profile-auth`** | **DISLIKED** | **0** | **6.2** | no logo | **4** | **5** | **3.71** | **6.5** |
| `profile-out` | control | 0 | 31.3 | no logo | 4 | 3 | 7.94 | 47.6 |

Chrome-share buckets, since a bare percentage hides what drives it:

| screen | chrome | control | icon | photo | text | surface | empty |
|---|---|---|---|---|---|---|---|
| `mockup-index` | 10.2 | 9.2 | 1.0 | 0 | 16.8 | 50.8 | 22.1 |
| `mockup-n1` | 11.2 | 10.4 | 0.8 | 0 | 3.0 | 83.9 | 1.9 |
| `mockup-n2` | 7.5 | 5.9 | 1.5 | 60.1 | 6.3 | 26.2 | 0 |
| `mockup-n3` | 12.2 | 9.8 | 2.4 | 0 | 6.7 | 79.2 | 1.9 |
| `home` | 37.0 | 30.9 | 6.1 | 0.6 | 14.0 | 41.1 | 7.3 |
| **`salon`** | **11.3** | 10.2 | 1.1 | 19.4 | 12.4 | 56.9 | 0 |
| **`profile-auth`** | **6.2** | 2.3 | 4.0 | 22.3 | 8.8 | 56.0 | 6.7 |
| `profile-out` | 31.3 | 30.5 | 0.8 | 0 | 12.1 | 49.3 | 7.3 |

### The decisive pair, alone

| measure | salon (LIKED) | profile (DISLIKED) | ranks his taste correctly? |
|---|---|---|---|
| M1 frame overflow | 0px | 0px | tie, carries no information |
| M2 chrome share | 11.3% | 6.2% | **INVERTED**, the liked screen is 1.8x worse |
| M3 logo letterform | FAIL | no logo present | not comparable, and the FAIL is invalid, see 3.3 |
| M4 distinct radii | 4 | 4 | tie |
| M5 icon size vocabulary | 5 | 5 | tie |
| M6 L/R imbalance | 3.92 | 3.71 | **INVERTED**, marginally |
| M7 rail near-miss | 57.4%, worst in sample | 6.5%, best in sample | **STRONGLY INVERTED** |
| M8 entity divergence | canonical, 1 signature | 2 signatures, price and rating dropped | **CORRECT** |

**Seven of the eight measures either tie or invert. Zero of the four lenses' measures rank the
screen he likes above the screen he hates.**

### Reproducibility against the lens authors' own runs

Two numbers were measured independently by a lens author and by me, on different days with different
harnesses, and they agree. `BALANCE_CLUTTER.md` reports `/de` at 38.4% chrome, I get 37.0.
`BALANCE_ALIGN.md` reports the Solen PDP at 57.8% near-miss, I get 57.4. The instruments are stable.
They are measuring something real. It is just not his taste.

---

## 2. What survives

### M1 FRAME OVERFLOW: SURVIVES, as a correctness gate, not a taste measure

For every element whose computed `overflow-x` is `hidden` or `clip`, larger than 40x20px and
intersecting the first viewport, is `scrollWidth - clientWidth` greater than zero?

| screen | worst overflow | what |
|---|---|---|
| `mockup-index` | **32px** | `DIV.screen`, frame 358px holding 390px of content |
| `home` | 9px | a closed modal, invisible |
| every other screen | **0px** | |

**Why it survives.** Eight screens, one real hit, zero false positives. It is the only measure in
this round that fires on something a human would call a defect on sight: in the rendered screenshot
of `index.html` the white card is visibly sliced down its right edge, cutting the search pill and
the "Nails" chip. It costs milliseconds and it is a yes/no fact, not a judgement.

**What it is honestly not.** It is silent on both halves of the decisive pair, 0px against 0px, so
it carries **no information about what he likes**. It detects that something is sheared. Shearing is
a bug. Bugs are worth gating, and this one would have stopped the delivery before he saw it. But
`BALANCE_ALIGN.md`'s own caveat is correct and load-bearing: the 32px is a defect of the comparison
*shell*, and each of the three headers standalone measures 0. It would have caught this artifact,
not these designs. Do not present it as evidence that balance is measurable.

**Threshold: fail any `overflow: hidden|clip` container whose `scrollWidth - clientWidth` exceeds
10px in the first viewport.** Count, not percentage: clean screens sit at exactly 0 and the broken
one at 32, so there is no distribution to calibrate against. 10 rather than 2 because `/de`'s
invisible closed modal reads 9px. Containers with `overflow: auto|scroll` are excluded by
construction, which is load-bearing, since FLOORS LAW 3 requires a cropped peek item.

Run it in the design-verifier render pass, not as a PreToolUse hook: it needs a rendered page.

### M8 ENTITY-RENDER DIVERGENCE: the only measure that orders his taste correctly

**Not from the four lenses. Built in this round**, because every lens measure is scoped to one
screen in isolation, and FLOORS LAW 8 already asserts, without any measure behind it, that the
defect is relational.

For each salon entity linked on a screen, find the smallest ancestor of the `/salon/<slug>` link
that contains at least one `img`, is 60 to 520px tall, and does not contain a different salon's
link. Record its signature: photo count, first photo aspect ratio, price present, rating present,
name size and weight. One entity should produce one signature.

| screen | cards | distinct signatures | signature |
|---|---|---|---|
| `/de` | 19 | **1** | `1 photo, AR 1.25, price, rating, 14/500` |
| `/de/basel/coiffeur` | 8 | **1** | `1 photo, AR 1.25, price, rating, 16/500` |
| `/de/salon/cuts-and-culture` | 1 | **1** | `3 photos, AR 1.00, no price, rating, 18/600` |
| **`/de/profile`** | 10 | **2** | `3 photos, AR 0.98, no price, no rating, 16/500` **and** `3 photos, AR 0.97, no price, no rating, 14/500` |

Cross-screen, the same entity:

```
haarsalon-margot   home     1 | 1.25 | price   | rating
                   search   1 | 1.25 | price   | rating
                   profile  3 | 0.98 | noprice | norating
                   profile  3 | 0.97 | noprice | norating
```

`haarsalon-margot`, `velvet-face`, `atelier-haarwerk`, `nail-studio-bliss`, `pink-petal-nails`,
`smooth-skin-studio` and `cuts-and-culture` all show the same split. Home and search agree with each
other on every axis and differ only in name size, 14 versus 16. Profile drops **price** and
**rating**, two load-bearing fields, changes the photo count from 1 to 3 and the aspect from 1.25 to
0.97, and renders the same salon **two different ways on one screen**: the saved row at 16/500 and
the "Neu für dich" row at 14/500.

This reproduces FLOORS LAW 8's assertion to the decimal. The law says `/de` renders the salon at a
5/4 ratio, which is 1.25; measured 1.25. The law says profile renders a three-photo collage;
measured 3 photos.

**Why this is the one that tracks.** The screens he did not complain about are mutually consistent.
The screen he called "ultra ass" is the one that diverges, and it diverges by losing information the
other screens carry. That ordering is correct without any threshold tuning.

**Proposed threshold, stated as a hypothesis and not as a validated instrument.** An entity
appearing on more than one customer screen must render one signature, where the signature is
(photo count, photo aspect to 2dp, price present, rating present). Font size is excluded from the
signature: home and search differ by 14 versus 16 and that difference is not what he objected to, so
including it would fire on screens he has never criticised. A screen carrying two signatures for one
entity is a fail on its own, no second screen needed.

**The caveat, not buried.** n = 1 disliked screen and 3 undisliked screens. This measure was built
after seeing the label, which is exactly the weakness I criticised the lenses for in section 0. It
is a hypothesis that survived one honest test, not a validated instrument. The correct next step is
to run it on his next few rejections before wiring it, and abandon it if it goes quiet. What is
already solid regardless of the metric: `/de/profile` really does drop price and rating for salons
that carry both everywhere else, and that is a defect whether or not the measure generalises.

---

## 3. What is killed, and why

### 3.1 M2 CHROME SHARE: KILLED as a taste gate

Percent of the first viewport painted by controls and icons rather than photos, text or plain
surface. Threshold proposed by its author: 25%.

**It inverts the decisive pair.** Salon, the screen he likes, is **11.3%**. Profile, the screen he
hates, is **6.2%**. The gate ranks the disliked screen as the cleanest screen in the entire sample
of eight.

**It does not flag anything he rejected.** All four rejected mockups score 7.5 to 12.2, comfortably
inside the reference band its author established. The only two screens over the 25% line are `/de`,
whose verdict he never stated, and the signed-out profile, which is a login form and exempt by the
gate's own exemption list.

**Its author already said this, and was right to.** `BALANCE_CLUTTER.md` section 5 states plainly
that the measure does not flag the file he was looking at. This round adds the part that kills it as
a taste gate rather than merely limiting it: given his liked screen and his disliked screen, it
picks the wrong one.

**The one-line reason.** Chrome share is dominated by screen *kind*, not screen *quality*. A
product-detail page with a booking control is control-heavy by nature; a saved-items grid is
photo-heavy by nature. Ranking a PDP against a saved list on control area ranks the category, not
the craft.

**What to keep.** Nothing as a gate. The underlying observation that `/de` spends 30.9% of its first
viewport on control fills against 0.6% on photography is true, reproducible and worth acting on
while `/de` is being redesigned. Use it as a diagnostic on `/de`. Do not wire it, and do not cite
25% as a threshold: its own author already flagged the number as a house number fitted to n=13 with
no external source.

### 3.2 M7 RAIL NEAR-MISS: KILLED, and harder than its author killed it

Count every left edge, cluster into rails, count how often two vertically-disjoint rails sit 1 to
4px apart.

`BALANCE_ALIGN.md` already declined to wire it, on the grounds that it ranked the rejected screen
second best of five. The new pair makes it worse than uninformative. **Salon, the screen he likes,
scores 57.4%, the worst in this sample of eight. Profile, the screen he hates, scores 6.5%, the
best.** That is not noise around zero, it is a consistent inversion: the screen with more real
content has more edges, and more edges means more chances for two of them to land 3px apart. The
measure is partly counting density, and our own density floor mandates density.

Do not wire it. Do not quote the number. Useful only as a locator on a screen already known to be
wrong, exactly as its author said.

### 3.3 M3 LOGO LETTERFORM DISTANCE: KILLED as a screen gate, on two structural defects

Step 1 asks whether the logo slot paints an `svg`/`img` or live text. Step 2, if text, measures the
letterform distance from the page's body font, with a floor of 0.20.

**Defect one: it reaches below the fold and grades an element nobody can see.**

| screen | page height | logo top | in the first viewport? |
|---|---|---|---|
| `home` | 4283 | 27 | yes |
| `mockup-n2` | 2238 | 4 | yes |
| **`salon`** | 5058 | **4386.9** | **no, 5.2 viewports down, in the footer** |
| **`mockup-index`** | 6796 | **2108.7** | **no** |

The gate returned FAIL for `salon`, a screen he likes, off a footer logo. It returned FAIL for
`mockup-index` off an element 2.5 viewports down. Only two of eight screens have a logo in the
first viewport at all. A gate that silently walks into the footer will fire on every page in the
estate that has one, which is all of them.

**Defect two: the score is relative to the body font, so bad body typography earns a PASS.** The
same wordmark, same markup, scores **0.0596 (FAIL)** embedded in `index.html` and **0.3718 (PASS)**
standalone in `n2.html`. The cause is measured, not guessed: `n2.html` sets no body `font-family`,
so `getComputedStyle(document.body).fontFamily` resolves to **Times**, and the distance from Times
is large. The measure therefore rewards a page for having broken body type. That is not a tuning
problem, it is the shape of the metric.

**What survives as a fact, not a gate.** Our wordmark is live text set in our own interface
typeface: `Inter Tight 600` against a body of `Inter 400`, letterform distance **0.0144**, where
Helvetica against Inter scores 0.106. Five of five references in `BALANCE_LOGO.md` paint a drawn
mark instead. That is a true and interesting observation about our logo, and it is a **one-time
finding about one asset**, not something to run on every screen. If anything is ever wired here, it
is step 1 only (does the logo slot paint a drawn mark), scoped to a resolved logo element that is
actually in the first viewport, and never as a document sweep. Its own author warned that a page
heading scores 0.033 and that the gate "depends entirely on correct logo resolution". This round
shows the resolution failing in practice.

### 3.4 M4 DISTINCT CORNER RADII: KILLED

Definition used here, since the original harness is not in the repo: distinct
`border-top-left-radius` values among painted boxes over 400px² intersecting the first viewport,
counting 0 as a value and collapsing fully-round to one "pill" bucket. This reproduces the original
file's `/de` figure of 7 exactly, so the re-implementation is faithful.

Salon 4, profile 4. Tie on the decisive pair. The rejected mockups score 3 and 4, inside the
reference band its author established, so it flags nothing he rejected either. The only outlier
remains `/de` at 7, the one screen whose verdict he never gave. Its author called it "a weaker
signal" needing a bigger sample; the bigger sample removes it.

### 3.5 M5 ICON SIZE VOCABULARY: KILLED, and my count does not reproduce the original

Definition used here: distinct rounded sizes among `svg` elements whose larger dimension is between
8 and 32px, intersecting the first viewport.

Salon 5, profile 5. Tie on the decisive pair.

**Stated rather than smoothed over:** `BALANCE_CLUTTER.md` reports `n3` using 7 distinct glyph sizes
at 32px or under. I measure **3**. The difference is scope, not arithmetic: that author counted
within the `n3` cell of the comparison shell, over the whole cell; I count the standalone file's
first viewport. Neither is wrong, they are different questions, and the gap is a warning that this
particular number moves a lot with framing. Do not build on it.

### 3.6 M6 VISUAL WEIGHT AND OPTICAL CENTRE: KILL CONFIRMED

`BALANCE_WEIGHT.md` already concluded no, with a positive control proving the instrument works. The
new pair agrees: salon 3.92, profile 3.71, inverted and inside noise.

**One honesty note:** I re-ran only the author's DOM implementation, which that author states is the
inferior of the two and reports 5 to 14 points of error against the pixel raster. I did not re-run
the raster on these four screens. The kill stands because the DOM version, the raster version and
the new decisive pair all point the same way, but this specific confirmation is DOM-only.

---

## 4. Why they all failed, in one paragraph

Grep the four lens files and every measure they built takes **one screen** as input. Chrome share,
radii count, icon vocabulary, rail near-miss, centroid: all of them describe a single rendered
viewport in isolation. But the two things the owner actually objected to on `/de/profile` are, in
his words and in FLOORS LAW 8 and 10, that the same salon looks like a different object here than it
does on the home feed, and that a search bar is sitting on a screen where nobody searches. Both are
statements about a **relationship**: between two screens, or between an element and the screen's
job. A single-screen area or edge statistic cannot express either, and no amount of tuning will make
it. That is why the disliked screen scores best on two of the measures: judged purely as one
picture, it is a calm, photo-led grid. Judged against the rest of the product, it is a second,
worse implementation of a card we already own.

This is not a defence of the "it needs human taste" hedge he corrected. His correction was right.
Section 2 shows the divergence is arithmetic: `1 | 1.25 | price | rating` against
`3 | 0.97 | noprice | norating`. It was measurable. It just needed a measure that takes two screens
as input, and nothing in this system, including the four lenses, was built to do that.

---

## 5. What I did not do

- **I did not wire anything.** Every lens author recommended against wiring before the owner sees
  the numbers, and the strongest result in this file is a kill list. Wiring a gate off the back of
  it would be the opposite of what the evidence supports. Separately, per the standing note on
  sandboxed sessions, `settings.json` is not writable from here, so a "wired" gate would sit on disk
  enforcing nothing while being reported as armed.
- **I did not re-run the pixel raster** for M6, see 3.6.
- **I did not re-test the reference screens** (Fresha, Airbnb, Treatwell, Booksy, Planity). The lens
  files carry those numbers and this round's job was the four screens whose labels we own. The
  decisive test does not need them: it is internal, and the inversions are internal.
- **`home` has no owner verdict.** It is the only screen over the chrome threshold and the only one
  with 7 radii. I have not assumed that means he dislikes it, and no conclusion here rests on it.

---

## 6. Bottom line

| measure | verdict | threshold if kept |
|---|---|---|
| **M1 frame overflow** | **KEEP**, correctness only | `scrollWidth - clientWidth > 10px` on any `overflow:hidden\|clip` container in the first viewport |
| **M8 entity-render divergence** | **KEEP as a hypothesis**, the only one that tracks his taste | one entity, one signature `(photos, aspect 2dp, price, rating)`; two signatures for one entity on one screen is a fail |
| M2 chrome share | KILL as a gate, retain as a `/de` diagnostic | none |
| M3 logo letterform | KILL as a gate; keep the one-time finding about our wordmark | none |
| M4 distinct radii | KILL | none |
| M5 icon size vocabulary | KILL | none |
| M6 visual weight / centroid | KILL, confirmed | none |
| M7 rail near-miss | KILL, anti-correlated | none |

Two measures out of eight. One of them is a bug detector that says nothing about taste. The other
was not in the four lenses' output and needs his next few rejections before it earns a gate.
