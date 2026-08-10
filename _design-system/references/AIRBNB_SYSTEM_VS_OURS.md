<!-- exists-check: `npm run exists "airbnb"` run this turn, 2026-08-03. 6 hits: 4 page-inline
     "Airbnb-style search" comments (unrelated surface), and TWO GRAVEYARD entries, one of which
     is load-bearing for this document and is quoted in CONFLICT 7 below (owner 2026-07-31 killed
     a pill border that had been "copied from Airbnb"). `_design-system/references/` already holds
     airbnb--profile-list.md, airbnb--profile-1to1-diff.md, airbnb--category-switch.md,
     airbnb--home-search-chrome.md. This file is net-new and does NOT re-measure what they cover:
     it is the first file to (a) capture Airbnb's LIVE token layer as a table our tokens could be
     set from, and (b) put that next to our live account screen. It also CORRECTS two numbers in
     the two profile files; those corrections are section 0 and must be read before their tables
     are used again. -->

# Airbnb's system vs ours, account surface

Scope: the system/token layer plus the account screen. Reference is everything including chrome.
Per the owner's instruction (*"dont only research the refference like go acc into the airbnb
website and in mobile view acc analyze"*), the **live site is primary** and the stills are
secondary. Nothing here lands in product code. No commits. No credentials entered.

---

## SOURCES

Every number below carries one of these tags. Nothing is carried between tags, and no number
measured on one screen is applied to another.

| tag | exactly what | how |
|---|---|---|
| **AB-LIVE-390** | `https://www.airbnb.com/help`, Browser pane **390x844**, dpr 2, logged out. `location.href` returned in the same payload as every number | `getComputedStyle(document.documentElement)`, 391 custom properties enumerated |
| **AB-CANVAS** | in-page `canvas.measureText` against the live-loaded `Airbnb Cereal VF` (`document.fonts.check('400 100px "Airbnb Cereal VF"') === true`), same tab as AB-LIVE-390 | ink-box metrics at weights 300-800 |
| **S6900** | `~/Downloads/IMG_6900.PNG`, Airbnb **Profile tab ROOT**, scrolled | PIL, mine this run. `Image.size` re-confirmed 1206x2622 = **402x874pt @3.0x** |
| **S6901** | `IMG_6901.PNG`, **Account settings**, top of scroll | same |
| **S6902** | `IMG_6902.PNG`, **Account settings**, scrolled (collapsed title) | same |
| **S6904** | `IMG_6904.PNG`, **Login & security** | same |
| **O-PROF** | `https://card-albums-anne-mood.trycloudflare.com/de/profile`, Browser pane **390x844**, dpr 2, logged in, `document.title === "Konto"` | `getBoundingClientRect` + `getComputedStyle`, mine this run |
| **SRC** | file read on disk this run, `file:line` given | Read / grep |
| **CONTRAST** | my own WCAG 2.x ratio function. **Self-tested before use: reproduces all seven contrast figures published in `CLAUDE.md` (1.60, 1.46, 1.94, 3.30, 3.55, 4.58, 4.83) exactly to 2dp, printed PASS** | computed |

**Airbnb's account screens are behind a login. I did not authenticate and entered no credentials.**
So the reference splits cleanly and is labelled that way throughout: the **token layer** is live
(`AB-LIVE-390`, their web bundle, same design system), the **account-screen geometry** is
stills-only (`S69xx`). Where I use a live number to interpret a still number I say so in the row.

**Unit note, stated once.** The stills are 402pt logical; our viewport is 390 CSS px. Fixed
paddings, pitches and stroke widths compare 1:1. Anything proportional carries 390/402 = 0.9701 and
is normalized explicitly in that row. IMG_6903 is excluded: a cookie-consent scrim covers the page.

---

## 0. TWO CORRECTIONS THAT MUST LAND FIRST

These are not quibbles. Both are live written instructions on disk that would send a fourth round
in the wrong direction, and one of them is wrong by 31% in the direction of "make it bigger".

### 0a. The Profile root and Account settings have the SAME type scale. `D1` is wrong.

`airbnb--profile-1to1-diff.md:113-142` ("ORCHESTRATOR RE-MEASUREMENT 2026-08-03") claims the
Profile root's row label is 45px cap = 15.0pt implying ~21pt, versus ~16pt on settings, i.e. "the
root is 24% bigger", and instructs at `:137`: **"row label 16px -> 21px"**. `_plans/DESIGN_SYSTEM_RENEWAL_2026-08-02.md:56` (A5) carries the same.

I isolated the **first capital glyph of every label row** on three screens and measured that
glyph's own y-extent. A 45px figure is the ink BAND, which includes descenders; the rows measuring
45-46px are exactly the rows whose label contains a `g`, `y`, `p` or `,`.

| screen | label rows measured | isolated first-capital cap |
|---|---|---|
| **S6900** Profile ROOT | 8 of 8 | 35, 36, **34, 34, 34, 34, 34, 34** px |
| **S6901** Account settings | 9 of 9 | 34, 34, 34, 34, 35, 35, 34, 34, 34 px |
| **S6902** Account settings scrolled | 10 of 10 | 34, 34, 34, 34, 35, 35, 34, 34, 34, 35 px |

**34px = 11.33pt cap on all three screens.** There is no root-vs-settings type-scale difference.
The band heights that produced "45" are 44-46px on descender rows and 37px on non-descender rows,
on *both* screens. Executing D1 as written ships the row label **31% oversized** against the
reference the owner named.

**What the label actually is, by two independent rulers that share no assumption.**

- **Cap route.** `AB-CANVAS`: Cereal's cap height measures **71.000 per 100px em at every weight
  300, 400, 500, 600, 700 and 800** (weight-invariant, so this route cannot be confounded by
  weight). Ratio = 0.710 exactly. 11.33pt / 0.710 = **15.96pt**.
- **Ink word-width route** (the repo-mandated method, `_mockups/_BASE.md`, memory
  `feedback_reference_copy_width_calibration`). `S6901` "Personal information" ink width = **450px
  @3x**. `AB-CANVAS` ink width per 100px em: w400 = 939.4, w500 = 960.49, w600 = 971.04. Solving:
  w400 → **15.97pt**, w500 → 15.62pt, w600 → 15.45pt.

The two rulers agree to **0.01pt at weight 400**. And 16 is a real named tier in Airbnb's own live
type scale (`AB-LIVE-390`: `--typography-titles-medium_16_20`, `--typography-body-text_16_20`),
whose neighbours are 14 and 18, both far outside the measurement. **Row label = 16px, weight 400.**

Ours is **15.5px, weight 500** (`O-PROF`; `SRC AccountHub.tsx:231`). The size gap is 0.5px. **The
weight gap is the real one and no prior doc names it.**

The consequence for the owner's actual complaint. He said *"how these texts are so small"*
(`_plans/DESIGN_SYSTEM_RENEWAL_2026-08-02.md:8`). **His label is already within 0.5px of the
reference's.** What he is reacting to is measured in section 3 item 3: our screen carries **six
distinct font sizes** (`O-PROF`: 28, 18, 15.5, 13, 12, 10) where the reference screen carries about
three, so the 15.5px label is buried among a 13px subline, a 12px eyebrow and a 10px badge and
reads small by comparison, not by measurement. Enlarging the label does not fix that; deleting the
tiers below it does.

### 0b. The two page titles are two STATES of one control, not two sizes.

`airbnb--profile-list.md:147` flags a "title-size discrepancy, flagged not smoothed over": 22.7pt
cap on S6901 versus 20.0pt on S6904, "reported as-is". Measured with the collapse state named:

| screen + state | isolated first capital | cap pt | / 0.710 | nearest live token (`AB-LIVE-390`) |
|---|---|---|---|---|
| **S6900**, root, **collapsed** into the nav bar | `P` x77-108, 47px | 15.67 | **22.07pt** | `titles-semibold_22_26`, exact |
| **S6901**, settings, **expanded** large title | `A` 69px | 23.00 | **32.39pt** | `titles-semibold_32_36`, exact |

Three independent cap measurements (16, 22, 32) each land on a discrete named tier of a scale whose
gaps are 2-6pt wide. That mutual consistency is itself the check on the 0.710 ratio. This is the
standard iOS large-title collapse, and it is why S6900 (scrolled) shows a small title while S6901
(top of scroll) shows a large one. Not an inconsistency in Airbnb's build.

---

## 1. WHAT THEIR SYSTEM IS

Airbnb's account surface is a **12-step neutral grey ramp and nothing else**: measured live, their
palette runs `#FFFFFF, #F7F7F7, #F2F2F2, #EBEBEB, #DDDDDD, #C1C1C1, #8C8C8C, #6C6C6C, #515151,
#3F3F3F, #222222, #000000` (`AB-LIVE-390`), the brand Rausch `#FF385C` appears on the account
screens only as the active tab-bar glyph, and the ink is `#222222` rather than black. Structure
carries no containers at all: on the Profile root I found **zero card edges** and exactly **three
1.0pt rules on the entire screen** (`S6900`), of which two are full-bleed chrome boundaries (the
nav-bar underline at y354 and the tab-bar top edge at y2349, both `#EBEBEB`, both x0-1205) and
exactly **one** is a content divider, inset **24.0pt on both sides**, marking the single boundary
between the two row groups; rows inside a group are separated by whitespace only. That whitespace
is a hard grid, not a content-driven box: row pitch measured **167/168/169/168/168/170px = 56.0pt**
with the group boundary stepping to 266px = 88.7pt, and the label always starts at **64.3-65.3pt**
from the edge even though the icon ink beside it varies from 15.0 to 24.0pt wide, so the icon sits
in a fixed slot rather than a fixed box. The icons are **bare ink on white with no tile** (my own
test: in a 117px box centred on each of the 8 row glyphs, non-ink pixels mean 254.2-254.9 and
pixels in the 230-250 band where a `#F4F4F5` tile would sit number 4 to 144 out of ~13,689, i.e.
0.03-1.05%, antialiasing only). Type is one family at three sizes on this screen with **zero
letter-spacing on every tier of their scale** (`AB-LIVE-390`: every `--typography-*-letter-spacing`
returns `normal`, the sole exception being one opt-in `tracking-wide` at 0.04em), the row label
sits at **regular weight 400**, and **no row carries a subline**. The whole effect is produced by
subtraction: one ink, one hairline grey, one pitch, one margin, and emphasis spent only on the
page title.

---

## 2. THE TOKEN LAYER

Airbnb column is `AB-LIVE-390` (their live `:root`, read this run). Ours is `SRC
tailwind.config.js` at the cited line. This is a table our tokens **could** be set from; it is not
a proposal that they should be, and nothing here is decided.

### 2a. Neutral ramp

| step | Airbnb token | Airbnb hex | our nearest token | our hex | note |
|---|---|---|---|---|---|
| 0 | `--palette-grey0` | `#FFFFFF` | `s-bg.base` (`:152`) | `#FFFFFF` | identical |
| 100 | `--palette-grey100` | `#F7F7F7` | none | none | **we have no step here.** Measured as the banner-card fill on `S6901` (247,247,247, inset 24.0pt) |
| 200 | `--palette-grey200` | `#F2F2F2` | `s-bg.sunken` (`:152`) | `#F4F4F5` | ours is 2 lighter and carries a blue cast (B minus R = +1 vs their 0) |
| 300 | `--palette-grey300` | `#EBEBEB` | none | none | **their divider.** Confirmed as `#EBEBEB` on 5 of 7 rules in `S6904`, the single content rule in `S6900`, and both chrome rules |
| *between 300 and 400* | *(they have no such step)* | *n/a* | `s-border` (`:130`) | `#E4E4E7` | our one hairline token falls between their two. `CONTRAST` vs white: their 300 is 1.19:1, their 400 is 1.36:1, ours **1.27:1** |
| 400 | `--palette-grey400` | `#DDDDDD` | none | none | their second divider grey, on 2 of 7 rules in `S6904` |
| 500 | `--palette-grey500` | `#C1C1C1` | none | none | |
| 600 | `--palette-grey600` | `#8C8C8C` | `s-chart-2` | `#9CA3AF` | ours is chart-only by `CLAUDE.md` FLOORS LAW 6, never text |
| 700 | `--palette-grey700` | `#6C6C6C` | `s-ink-2` (`:129`) | `#6B6B6B` | **1 step apart.** `CONTRAST` on white: theirs 5.25:1, ours 5.33:1, both AA |
| 800 | `--palette-grey800` | `#515151` | none | none | |
| 900 | `--palette-grey900` | `#3F3F3F` | none | none | |
| 1000 | `--palette-grey1000` | `#222222` | `s-ink` | `#0A0A0A` | **their body ink is not black.** `CONTRAST` on white: theirs 15.91:1, ours 19.80:1 |
| 1100 | `--palette-grey1100` | `#000000` | none | none | they reserve pure black for hover only (`--palette-text-primary-hover`) |

### 2b. Semantic aliases

| role | Airbnb token | hex | ours |
|---|---|---|---|
| text primary | `--palette-text-primary` | `#222222` | `s-ink` `#0A0A0A` |
| text secondary | `--palette-text-secondary` | `#6C6C6C` | `s-ink-2` `#6B6B6B` |
| icon primary / secondary / tertiary | `--palette-icon-*` | `#222222` / `#6C6C6C` / `#8C8C8C` | one `s-ink` for row icons (`SRC AccountHub.tsx:228`) |
| border tertiary (the hairline role) | `--palette-border-tertiary` | `#DDDDDD` | `s-border` `#E4E4E7` |
| border secondary disabled | `--palette-border-secondary-disabled` | `#EBEBEB` | none |
| surface secondary | `--palette-bg-secondary` | `#F7F7F7` | none |
| surface quaternary | `--palette-bg-quaternary` | `#F2F2F2` | `s-bg.sunken` `#F4F4F5` |
| success / error / warning / info | `--palette-icon-*` | `#12A139` / `#C13515` / `#EB6100` / `#318CF7` | `#16A34A` / `#DC2626` / `#F1AE27` / `s-accent #276EF1` |
| brand | `--palette-bg-primary-core` | `#FF385C` | `s-accent` `#276EF1` |
| elevation edge | `--elevation-primary-border` | `1px solid rgba(0,0,0,0.04)` | `1px solid #E4E4E7` |

### 2c. Type scale

Every tier below is a live token name from `AB-LIVE-390`, given as `size/line-height`.

| tier | Airbnb tokens present | ours (`O-PROF` measured on `/de/profile`) |
|---|---|---|
| 10 | `base-extra-small10px` (lh 12) | 10 (a badge) |
| 11 | `body-text_11_15` | none |
| 12 | `body-text_12_16`, `caption-text_12_16` | 12 (eyebrow) |
| 14 | `body-text_14_18`, `body-paragraphs-text_14_20`, `subtitles-book_14_18`, `titles-medium_14_18`, `titles-semibold_14_18` | 13 (subline) |
| 16 | `body-text_16_20`, `body-paragraphs-text_16_22`, `_16_24`, `subtitles-book_16_22`, `titles-medium_16_20`, `titles-semibold_16_20` | **15.5 (row label)** |
| 18 | `body-text_18_24`, `body-paragraphs-text_18_28`, `subtitles-book_18_24`, `titles-medium_18_24`, `titles-semibold_18_24` | 18 (header title) |
| 22 | `titles-semibold_22_26` | none |
| 26 | `titles-semibold_26_30` | none |
| 32 | `titles-semibold_32_36` | none |
| display | `40_44`, `48_54`, `60_68`, `72_74` | 28 (user name, the screen's anchor) |
| **tracking** | **`normal` on every single tier**; one opt-in `tracking-wide` at `0.04em` | **four values in one viewport**: `-0.18px`, `-0.155px`, `-0.56px`, `normal` |
| weight vocabulary | `book`, `medium`, `semibold` (three named title/subtitle ramps) | `400 / 500 / 600 / 700` all present in one viewport |

### 2d. Spacing and radius

| scale | Airbnb (`AB-LIVE-390`) | ours |
|---|---|---|
| spacing | 2, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80. **No 20 step.** | 4-pt scale (`CLAUDE.md` design contract); `/de/profile` uses `px-5` = **20px** page margin (`O-PROF` `contentLeftX = 20`) |
| radius | 4, 8, 12, 16, 20, 24, 28, 32 | 12 (input), 16 (card), 24 (grouped list-card), 28 (sheet), pill |
| page margin, measured | **24.0pt** on `S6900`/`S6901`/`S6902`/`S6904`, agreeing across banner bbox, all 7 content rules, and the chevron inset | 20px container + 16px card pad = **36px** to the row icon |
| row pitch, measured | **56.0pt** (`S6900` deltas 167/168/169/168/168/170) | **74.8-75.8px** (`O-PROF`, 7 rows) |

---

## 3. THE CHANGE LIST, account screen, ranked by impact

Ranked by contribution to *"every single part of it does not look like the reference at all"*.
Every target names where its number comes from. Items 1, 2 and 4 are already `_plans/`
A2/A3/A4; they are restated here with the measured target and the file, not re-decided.

| # | axis | from (measured) | to | file | source of the target number |
|---|---|---|---|---|---|
| **1** | **row-group container** | 4 white cards, `x=20 w=350`, `radius 24px`, `1px rgb(228,228,231)` on all four sides, `box-shadow: none` (`O-PROF`) | no container; rows on the page | `SRC AccountHub.tsx:208` (`RowCard`) | `S6900`: my full-width scans at 8 row bands found **0 card edges**; and `_design-system/LOCKFILE.md:552-553` already names "an account hub" as a surface that gets NO container |
| **2** | **rules per row** | **7** 1px rules ≥200px wide in the DOM, 7 rows (`O-PROF` `ruleCount:7`) | 1 rule per group boundary, 0 inside a group | same, `divide-y` on `:208` | `S6900`: exactly **3** 1.0pt rules on the whole screen, of which **1** is content (y1557, inset 24.0pt) and 2 are full-bleed chrome (y354, y2349). `S6901` at top-of-scroll: **zero** |
| **3** | **distinct font sizes on one screen** | **6** (28, 18, 15.5, 13, 12, 10) (`O-PROF`) | ≤4, floor 3 | `AccountHub.tsx:231,233`, `:204` | **not an Airbnb number.** `CLAUDE.md` NEVER-AGAIN floor 2, which we currently fail independently of this reference. The reference screen carries ~3 |
| **4** | **icon tile** | `38x38px`, `bg rgb(244,244,245)`, `radius 14px`, on 6 of 7 rows (`O-PROF`) | bare ink glyph, no tile | `AccountHub.tsx:228` | `S6900`, my own test on all 8 rows: 230-250-band pixels = **0.03-1.05%** of a 117px box, i.e. white. Third independent confirmation across the stills |
| **5** | **row label weight** | **500** (`O-PROF`; `font-medium` `AccountHub.tsx:231`) | **400** | `AccountHub.tsx:231` | `S6901` + `AB-CANVAS` word-width: ink 450px @3x solves to 15.97pt at w400 versus 15.62 at w500, while the weight-invariant cap route gives 15.96pt. Only w400 reconciles the two |
| **6** | **row pitch** | **74.8-75.8px**, content-driven, nothing pins it (`O-PROF`, 7 rows) | **56pt** fixed | `AccountHub.tsx:227` (`py-[15px]` + 38px tile) | `S6900` deltas 167/168/169/168/168/170px = 56.0pt, zero variance. Independently, `LOCKFILE.md:571` already prescribes `56px` for this case |
| **7** | **letter-spacing** | **4 values in one viewport**: `-0.18px`, `-0.155px`, `-0.56px`, `normal` (`O-PROF`) | one value | `AccountHub.tsx:231`, `:204`, header | `AB-LIVE-390`: **every** `--typography-*-letter-spacing` token returns `normal`; the only non-normal is an opt-in `tracking-wide 0.04em` |
| **8** | **page margin / label inset** | icon at **36px** from edge (20 container + 16 card pad); label follows the icon (`O-PROF`) | icon ink ~24pt, label at a fixed **64-65pt** slot | `AccountHub.tsx:227` (`px-4`), page `px-5` | `S6900`: label starts at **193-196px = 64.3-65.3pt on all 8 rows** while icon ink varies 15.0-24.0pt wide. Fixed slot, not fixed box |
| **9** | **body ink** | `#0A0A0A`, **19.80:1** on white (`O-PROF`, `CONTRAST`) | `#222222`, 15.91:1 | `tailwind.config.js` `s-ink` | `AB-LIVE-390` `--palette-text-primary`. **Flagged, not recommended:** this is a palette-wide token, out of one screen's scope, and lowering contrast needs its own decision |
| **10** | **row label size** | **15.5px** (`O-PROF`) | **16px** | `AccountHub.tsx:231` | two rulers agreeing to 0.01pt (section 0a). A 0.5px move: listed last on purpose, because `D1`/`A5` currently instruct **21px** and that is the error this document exists to stop |
| **11** | **emphasis budget** | **33.3%** of visible text at weight ≥600 (`O-PROF`, 21 elements) | ≤30% | `AccountHub.tsx:204` (eyebrows at 600) | **not an Airbnb number.** `CLAUDE.md` EMPHASIS BUDGET (a), which that block itself labels a house number with no external citation. We fail it by 3.3 points |

**Not on this list, and why:** the back control, the hamburger, and the bell. `S6900` is a **tab
root** and has no back control at all, so there is no reference measurement for ours on this
screen; the 39.7pt grey circle in `airbnb--profile-1to1-diff.md` row 1 was sampled from `S6901`, a
sub-screen. That is the same screen-attribution error class as 0a, and I am not repeating it by
proposing a target. Ours measures a 44x44 `radius 16px` white bordered tile at x16, a 40x40 bare
bell at x278 and a 44x44 bordered hamburger at x330 (`O-PROF`), all emitted by the sitewide
`Header.tsx`, which is outside this surface.

---

## 4. CONFLICTS

Numbered, both costs stated, **no decision taken in any of them**. Several are not
Airbnb-versus-us at all; they are our own code versus our own law, and those are marked.

### CONFLICT 1. Dropping the card collides with FLOORS LAW 4, and agrees with the LOCKFILE.

- **For dropping it:** `LOCKFILE.md:552-553` names "a settings or preferences list ... an account
  hub" as surfaces that get **no container**, and `:558-560` says "**Never both.** A container plus
  a hairline between every row is doubled chrome." `AccountHub.tsx:208` ships
  `divide-y divide-s-border rounded-[24px] border border-s-border` on exactly that surface: the
  "never both" case, verbatim, on a named-exempt screen. `S6900` independently shows 0 containers.
- **Against dropping it:** `CLAUDE.md` FLOORS LAW 4 says grouped/list/panel content on white with
  no photo anchor **requires** the sunken tray, and the design-contract *radius* row locks
  "grouped LIST-card 24". Removing the card leaves rows on bare white with neither tray nor edge,
  which is the literal shape FLOORS LAW 4 was written to forbid.
- **Cost of getting it wrong either way:** keep the card and the screen keeps the doubled chrome
  the owner named (*"I don't like how it's inside of this fucking weird box thing"*). Drop it
  without adding the tray and we trade a named owner complaint for a named floor violation.
- **Precedence note, not a decision:** the LOCKFILE is tier 4 and `CLAUDE.md`'s pinned blocks are
  tier 5, so the chain as written favours dropping. I am flagging rather than applying that,
  because FLOORS LAW 4 is dated later than the LOCKFILE passage and the chain's own rule is that
  the latest dated owner decision wins. **This needs the owner, not me.**

### CONFLICT 2. Deleting the sublines collides with FLOORS LAW 3, and I think the reference should lose this one.

- **For deleting:** `S6900`, `S6901`, `S6902`: **no row on any of the three screens carries a
  subline.** Ours carries one on 7 of 7 (`O-PROF`).
- **Against deleting:** FLOORS LAW 3 says "a card renders its FULL info stack whenever the data
  exists, omission is legal only for null data, **never for minimalism**." Our sublines are not
  decoration: they carry `Nächster Termin am Fr.`, `1 aktiv`, `2 Stores`, `Noch 6 bis zur
  Belohnung` (`O-PROF`). Those are live values. Airbnb's account rows are pure navigation and have
  nothing to put there. Deleting ours to match a screen that has no equivalent data is copying a
  constraint as if it were a choice, and it is the failure the plan's own PREMORTEM predicted at
  `_plans/DESIGN_SYSTEM_RENEWAL_2026-08-02.md:110`.
- **Cost either way:** keeping them means the row cannot hit the 56pt pitch of item 6, so items 2
  and 6 partly depend on this decision. Deleting them removes the only real numbers on the screen,
  which is also FLOORS LAW 1(c).

### CONFLICT 3. Divider hex: their `#EBEBEB` vs our locked `#E4E4E7`.

- **For matching:** `S6900`/`S6902`/`S6904` measure `#EBEBEB` on 6 of 7 content rules and both
  chrome rules; `AB-LIVE-390` confirms it as a real token (`--palette-grey300`).
- **Against:** the `CLAUDE.md` design contract *hairline* row locks `s-border` `#E4E4E7` as "one
  token, every divider", sitewide. Changing it for one screen breaks the one-token rule; changing
  it globally is a palette decision far beyond this surface.
- **Measured stakes, so this is not argued on vibes:** `CONTRAST` vs white gives theirs 1.19:1 and
  ours 1.27:1. Ours is the slightly stronger line. This is the smallest conflict here and could
  legitimately be closed as "no change".

### CONFLICT 4. Their ink `#222222` vs our `#0A0A0A`.

- **For matching:** `AB-LIVE-390` `--palette-text-primary`. Their ramp reserves pure black for
  hover only.
- **Against:** `#0A0A0A` is our `s-ink` across the entire product, including the one commit CTA
  fill. Softening it is a palette-wide change with no screen-scoped version. `CONTRAST`: 19.80:1
  vs 15.91:1, both far above AA, so no statutory floor forces or blocks either.

### CONFLICT 5. The 24pt margin vs the LOCKFILE's own 26px vs our shipped 20px.

Three numbers, three sources, all defensible: reference **24.0pt** (`S6900`-`S6904`, four
independent agreements), `LOCKFILE.md:571` **26px**, ours **20px** (`O-PROF`). Normalizing the
reference to our 390 viewport gives 23.3px. Nothing decides between 23.3, 24 and 26; it needs one
call, and picking silently is how a fourth number gets born.

### CONFLICT 6. Zero letter-spacing collides with nothing written down, which is itself the finding.

`AB-LIVE-390` runs `normal` on every tier. We run four values in one viewport (`O-PROF`). I
grepped for a locked tracking rule and **found none**: the design contract's *text size* row fixes
sizes and says nothing about tracking. So this is an unowned axis that has drifted to four values
with no rule to violate. Flagged as a system-layer gap, not as an Airbnb-versus-us conflict.

### CONFLICT 7. The precedent: the last thing we copied from Airbnb was rejected by name.

`npm run exists "airbnb"` returns a graveyard entry, owner **2026-07-31**: *"this weird white line
that doesnt really go all the way around the border, that looks really weird. Remove that."* The
`REMOVED.md` reason states it plainly: *"It was copied from Airbnb, but our raised/sunken overlay
already draws the pill edge."* The relevant cost for this document: a detail that is correct inside
Airbnb's depth model can be wrong inside ours, and the failure mode is not "it looks bad", it is
"it collides with a device we already have". Items 1, 3 and 4 above are the ones exposed to this.
Naming it as a risk on the record, not arguing against any of them.

---

## 5. WHAT WE KEEP, AND WHY

1. **The sublines with live values.** Per CONFLICT 2. `Nächster Termin am Fr.`, `1 aktiv`,
   `2 Stores`, `Noch 6 bis zur Belohnung` are wired data. Airbnb has no equivalent because its
   account rows are pure navigation. The structure is the reference; the content is ours.
2. **No bottom tab bar.** Present on `S6900` and it is Airbnb's primary nav. `npm run exists
   "bottom nav"` returns a dated owner rejection (2026-07-02, *"Solen has NO bottom nav"*). A
   dated owner decision outranks a visual-match instinct. Not a gap.
3. **`s-ink-2` `#6B6B6B` for secondary text.** Their `--palette-text-secondary` is `#6C6C6C`. One
   step apart, `CONTRAST` 5.33:1 vs 5.25:1, both AA. Nothing to change.
4. **Our 24px radius token itself.** Even if the account hub loses its card (CONFLICT 1), 24 is a
   real tier in Airbnb's own radius scale (`AB-LIVE-390` `--corner-radius-xxlarge24px`). The
   question is whether this surface uses a container, not whether the token is right.
5. **The 28px display anchor.** `O-PROF`: the user name at 28px/700 is the largest element,
   anchor ratio 28/15.5 = **1.81x**, clearing FLOORS LAW 6 (≥28px) and EMPHASIS BUDGET (b)
   (≥1.8x). Do not "fix" something that already passes.
6. **Lucide icons at `strokeWidth 1.9`.** `SRC AccountHub.tsx:229`. Item 4 removes the tile behind
   the glyph, not the glyph. I did not re-measure Airbnb's icon stroke myself and am therefore
   proposing no stroke change (see NOT MEASURED).

---

## 6. NOT MEASURED

Stated plainly rather than filled in.

- **Airbnb's account screens live.** Behind a login. I did not authenticate, no credentials
  entered. The token layer is live from their public Help Center bundle; all account-screen
  geometry is stills-only, and every such row is tagged `S69xx`.
- **Font weight of either page title.** My stem/cap ratios (`S6900` title 0.1915, `S6901` title
  0.1594, row labels 0.1176-0.1471) are internally consistent and correctly ordered, but converting
  them to an absolute weight against `AB-CANVAS` renders (w300 0.1429, w400 0.1714, w500 0.2286,
  w600 0.2286, w700 0.2571) is quantization-limited at these cap heights to roughly ±1 weight step,
  and the two rasterizers may not antialias identically. **Only the row label's weight is pinned
  (400), and only because the width and cap routes independently converge there.** The titles'
  sizes are firm (22, 32); their weights are not.
- **Airbnb's icon stroke width.** `airbnb--profile-list.md:84` gives 1.33pt sourced from `S6904`'s
  device row, and a sibling lens reports 1.67pt measured on `S6900`. I did not re-measure it, so I
  propose no stroke change and cite neither figure as settled.
- **Whether the iOS app's bundled Cereal has identical metrics to the web's `Airbnb Cereal VF`.**
  The row label's two routes converge to 0.01pt, which argues they match at that size. The large
  titles diverge 1.6-4.7% between cap and width routes, consistent with negative tracking at large
  sizes, but I could not separate tracking from a metric difference. Sizes above 22pt should be
  treated as ±1pt.
- **Motion, press, focus, hover, and every empty/loading/error state** on the reference. These are
  static stills; nothing about transitions can be read from them.
- **`IMG_6903`.** A cookie-consent scrim covers the page; excluded rather than measured through.
- **Our `/de/profile/settings` sub-screen.** I measured `/de/profile` (title "Konto") only. The
  change list is scoped to `AccountHub.tsx`; whether settings inherits the same recipe is a real
  question and I have no measurement of my own for it.
- **`/de/profile` scrolled, and at any viewport other than 390x844.** One viewport, `scrollY 6`.

---

## 7. UNSOURCED CLAIMS REMOVED

Claims that appear in the inputs to this work and are **not** carried forward, each with why.

1. **"The Profile root's row label is ~21pt / the root is 24% bigger than settings"**
   (`airbnb--profile-1to1-diff.md:113-142`, and `D1` at `:137`, and `_plans/…:56` A5). **Refuted**
   by my own measurement of all 27 label rows across three screens: 34px cap on every one. The
   source read an ink band with descenders as a cap height. Executing it ships +31%.
2. **"Title 51px cap → ~24pt"** (same block). **Refuted:** 51px is the merged `P-r-o-f-i-l` band
   whose top is set by the `f` ascender. The isolated `P` is 47px → 22.07pt.
3. **"Row label cap-height 11.7pt"** used as a font size (`airbnb--profile-list.md:86`). Correct as
   a cap-height (I measure 11.33-11.67pt), **wrong if applied as a size**. Its own ORCHESTRATOR
   CORRECTION says so; carried forward only as 16px via the two-ruler derivation.
4. **"Cereal's cap ratio is ~0.72"** (`airbnb--profile-list.md:245-268`, an assumption in that
   file's correction). **Replaced with a measurement:** 0.710 exactly, weight-invariant across
   300-800 (`AB-CANVAS`). The 0.72 assumption is what produced that file's "~20pt" detail-label
   figure.
5. **"The tab bar is on all five stills"** (`airbnb--profile-1to1-diff.md:94`, implied by "present
   on every one of the five"). A sibling lens re-measured it as present on **S6900 only**. I did
   not re-measure this myself; **carried as unresolved, not as fact**, and nothing in this document
   depends on it.
6. **"Airbnb and Apple support sparse-blue / the 30% emphasis threshold / the 1.8x anchor ratio as
   independent laws."** `CLAUDE.md` already self-corrects all three (the citation correction dated
   2026-07-28, and the two PROVENANCE notes calling the 30% "a HOUSE NUMBER with no external
   citation" and the 1.8x "not an independent law"). Items 3 and 11 of the change list therefore
   cite them as **our own floors**, never as reference-derived numbers.
7. **Any reference figure for our back control, hamburger or bell on this screen.** `S6900` is a
   tab root with none of those. The 39.7pt grey circle came from `S6901`. No target proposed.
