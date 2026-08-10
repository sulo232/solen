# AXIS: GRID

<!-- exists-check: net-new vs _design-system/research/GEOMETRY_PRINCIPLES_2026-07-17.md (read its
     grid principles GM-01/02/03/09/10/11 and the breakpoint-ladder entry in full first),
     _design-system/SOURCE.md "Gutter math" table (lines ~412-420),
     _design-system/LOCKFILE.md container-width table, docs/audit/fresha-airbnb-solen-audit-part1..5
     (grepped: zero occurrences of "gutter" in any of the five), research/TASTE_DIAGNOSIS_FRAMEWORKS.md
     and research/MOTION_MODERNIZATION_2026-07-10.md (the exists-guard's other flags; neither
     mentions gutters, columns or container width at all).
     GEOMETRY_PRINCIPLES is the closest real match and this file DEFERS to it on grid MATH
     (colWidth formula, margin>=gutter, 4pt-clean tokens, fr-track remainder). What it does not
     contain, and what this file adds, is (1) a measured competitive corpus of column structure,
     container width, gutter and card width, and (2) a per-file audit of what Solen's grid actually
     renders today. It also CORRECTS two stale claims in it, flagged in section 9 rather than
     silently overwritten. Sibling convention: research/AXIS_FONT.md, research/AXIS_MOTION.md.
     `npm run exists grid` run 2026-07-29: 3 graveyard hits (fuer-salons categories grid,
     makeup/waxing categories, discovery Kollektionen boards-grid). None is proposed here.
     SearchResultGrid / MasonryGrid / DiscoveryGridSkeleton all live in components-legacy. -->

Layout grid across modern booking and marketplace apps: column structure, page container, gutter,
card-to-gutter ratio, deliberate grid breaks, and how many distinct card widths land on one screen.

Date: 2026-07-29
Written for `_plans/SCREEN_RESEARCH.md` section C.

---

## 0. Sample, stated before any claim

**13 distinct Mobbin searches** (7 iOS, 6 web) returned **80 screen results, 78 of them distinct**
(two screens came back in two different searches), across **22 apps**: Airbnb, Fresha, Square Go,
Uber Eats, OpenTable, Cal.com, Calendly, Stripe, Linear, Resy, Warby Parker, Swiggy, Redfin,
Careem, GetYourGuide, Airtasker, Grab, KakaoTalk, Hers, Natural AI, Behance, Unfold.

Of those 78 I **pixel-measured 30 with PIL**, and 28 produced usable numbers. Two failed: Hers and
Redfin's time pills are white cards on a near-white background separated only by a shadow, which
defeats an edge detector. Every number below carrying a `px` came from a script run, not from
looking at an image. Everything else is labelled.

**Precision, honestly.** Mobbin serves iOS screenshots at **299 px wide** and web screenshots at
**768 px wide**. I tried to pull higher-resolution originals from the bytescale CDN behind the
short links (`&w=1200`, and the `/raw/` path); both returned a JSON error, so 299 and 768 are the
ceiling available to me.

- iOS: the phone-screen region measures 299 x ~648 px, aspect 0.461, matching a 390x844 or 393x852
  device. Scale is **1.304 pt per px**, so **+/- 1 px is +/- 1.3 pt**. I round iOS pt conversions
  to the nearest 2 pt and never claim a 1 pt distinction.
- Web: I cannot recover the capture viewport width, so **every web number is a percent of viewport
  width**, which is scale-invariant. Where web px appear they are px-at-768-render and said so.

This is not a census. Mobbin's corpus is curated, so "of the N screens I examined" is the only
honest frame and it is used throughout.

---

## 1. The strongest finding: the gutter is a constant, the card is the variable

**iOS, 9 measurements across 6 apps, all at 299 px render:**

| App | Screen | Card px | Gutter px | Page margin px | Card:gutter |
|---|---|---|---|---|---|
| Airbnb | [home carousel](https://mobbin.com/screens/2df6111d-0888-47ab-8d35-6a2f20d66eb2) | 128 | 8 | 18 | 16:1 |
| Airbnb | [mosaic inside one card](https://mobbin.com/screens/b961fe67-3637-4f52-bbf5-56f79595571e) | 130 | **3** | 18 | 43:1 |
| Fresha | [home carousel](https://mobbin.com/screens/9eaedf92-a72f-4a04-8bc8-49e9ecf7ff58) | 170 | 8 | 15 | 21:1 |
| Airtasker | [category carousel](https://mobbin.com/screens/f11dd898-8954-45d9-aff7-4e5398517671) | 126 | 7 | 12 | 18:1 |
| GetYourGuide | [experience carousel](https://mobbin.com/screens/e26f1510-bdf6-4747-b75c-cd9fd8c11538) | 199 | 10 | 12 | 20:1 |
| Square Go | [2-up hero tiles](https://mobbin.com/screens/89ee891e-17ea-4c5a-b173-eccd95149a21) | 120.5 | 8 | 25 | 15:1 |
| Square Go | [3-up category tiles](https://mobbin.com/screens/89ee891e-17ea-4c5a-b173-eccd95149a21) | 77 | 9 | 25 | 9:1 |
| Warby Parker | [2-up time slots](https://mobbin.com/screens/11be216a-ddfa-4cc4-80c5-8470fc835b09) | 126 | 10 | 19 | 13:1 |
| Square Go | [2-up slot pills](https://mobbin.com/screens/8b69dfc2-0028-4364-afc5-ed5820644be3) | 111 | 11 | 16 | 10:1 |

**Card widths span 77 to 199 px, a 2.6x range. Gutters span 7 to 11 px, a 1.6x range, and 7 of the
9 sit between 8 and 10.** Converted: the gutter in every app I measured is **10 to 14 pt**,
clustered on 11.

The consequence for how a spec should be written: **card-to-gutter ratio is a derived number, not a
design decision.** It swings from 9:1 to 21:1 across these nine measurements purely because the card
changed. Nobody is designing to a ratio. They are designing to a fixed margin plus a fixed gutter,
with the card taking whatever remains once you pick a column count.

Square Go proves it arithmetically on one screen. Content width 249 px, gutter ~8.5 px, and both
rows solve exactly: 2-up gives (249 - 8.5) / 2 = 120.25 against a measured 120.5, and 3-up gives
(249 - 17) / 3 = 77.3 against a measured 77. Same margin, same gutter, different divisor.

That is the same `colWidth = (W - 2m - (N-1)g) / N` that GEOMETRY_PRINCIPLES GM-09 already states.
This file does not restate it. What it adds is the empirical value of `g`: **the corpus says one
number, 10 to 14 pt, and it does not move when N moves.**

Confidence: **observed**. Nine independent script measurements.

---

## 2. The intra-card gutter is deliberately about a third of the inter-card gutter

Airbnb's [Experiences in Miami screen](https://mobbin.com/screens/b961fe67-3637-4f52-bbf5-56f79595571e)
renders one experience card whose media is a 2x2 photo mosaic. Measured on the same image, same
scale, same app:

- gutter **between** cards on Airbnb's home feed: **8 px**
- gutter **between the four photos inside** the mosaic: **3 px**
- ratio **2.7 : 1**

The card spans 18 to 280 px, so 263 px wide (343 pt), with symmetric 18 px margins. It is the full
content width: one card, one column.

This is the grouping law as a measurement. **The gap inside a unit is roughly a third of the gap
between units, and that is what makes four photos read as one object instead of four.** Solen
already has this rule (FLOORS LAW 5, "between-group gap >= 2x in-group gap"). The corpus does not
contradict it; it supplies a measured reference at 2.7x, comfortably above Solen's 2x floor. Keep
the rule and cite this.

Confidence: **observed** for both numbers. The reading of *why* is **inferred**.

---

## 3. Web: almost nobody centres a fixed max-width box on a browse surface

Eight web products measured. All figures are percent of viewport width.

| App | Container behaviour | Content as % of viewport | Columns |
|---|---|---|---|
| [Airbnb search](https://mobbin.com/screens/4b9d614f-7f68-47bb-83e6-7fd35efca097) | full-bleed split | list rail **59.8%**, map **36.9%**, page margin **1.4%** | 3 |
| [Fresha home / nearby](https://mobbin.com/screens/962315e5-a36e-4a70-ba2d-f2e1d7871be2) | fluid, ~4% margins | **92%** | 4 |
| [Fresha map + list](https://mobbin.com/screens/612f2a56-4a8c-4d16-bc51-08cca7209937) | full-bleed split | list rail **28.9%**, map **67.3%** | 1 |
| [Uber Eats all stores](https://mobbin.com/screens/a205105f-d2be-4377-86b1-5f9302b2ec46) | nav rail + fluid | rail **13.4%**, content **85.5%**, right margin **1%** | 4 |
| [OpenTable home](https://mobbin.com/screens/ff307b73-39a0-4899-bcf2-08521035820f) | centred | **84.5%** | 5 |
| [OpenTable search](https://mobbin.com/screens/be5bb7ea-e3fb-4fb8-845c-b7b178ff2cde) | centred | **73.7%** (rail 15.7% + list 56.1%) | 1 |
| [Cal.com booking](https://mobbin.com/screens/43d909f7-c988-4ed8-a530-0bc1b17f0067) | centred card | **68.8%** | 3 panels |
| [Calendly booking](https://mobbin.com/screens/09362b21-1b1e-4504-b354-c44cf3d029da) | centred card | **70.8%** | 3 panels |
| [Stripe transactions](https://mobbin.com/screens/80054ec0-bb9d-4438-9a66-4f7bcd8f103f) | sidebar + fluid | sidebar **15.8%**, content to the right edge | table |
| [Linear projects](https://mobbin.com/screens/3d3a4fae-d824-440a-961b-001c6b715a4a) | sidebar + fluid | sidebar **15.6%**, content to the right edge | table |

**Of the 8 web products measured, 6 run their browse surface fluid or full-bleed** (Airbnb, Fresha,
Uber Eats, Stripe, Linear, plus OpenTable's home at 84.5%). **The two that bound content inside a
centred card, Cal.com at 68.8% and Calendly at 70.8%, are both single-task booking widgets, not
browse surfaces.** That split held on every screen I looked at: browse goes wide, commit goes
narrow and centred.

Two side notes, both measured rather than recalled:

- **Stripe and Linear converge on the sidebar width.** 15.8% and 15.6% of viewport. At a 1440
  viewport that is 227 and 225 px, the familiar ~240 px rail. Two independent teams, same number.
- **Airbnb and Fresha invert each other's map split.** Airbnb gives the list 59.8% and the map
  36.9%. Fresha gives the list 28.9% and the map 67.3%. There is no industry answer here, only a
  product decision about which instrument is primary.

This is the one place the corpus is genuinely at odds with a Solen lock. Handled in section 8, item 6.

Confidence: **observed** for every percentage. The browse-wide / commit-narrow split is
**inferred** from 8 products: a pattern, not a law.

---

## 4. Distinct card widths on one screen: median 2, ceiling 3

Counted on the 7 screens where I could measure every distinct card in the viewport.

| Screen | Distinct card widths | Widths (render px) | Widest : narrowest |
|---|---|---|---|
| [Airbnb iOS home](https://mobbin.com/screens/2df6111d-0888-47ab-8d35-6a2f20d66eb2) | **1** | 128 | 1.00x |
| [Fresha iOS home](https://mobbin.com/screens/9eaedf92-a72f-4a04-8bc8-49e9ecf7ff58) | **1** | 170 | 1.00x |
| [Fresha web home](https://mobbin.com/screens/962315e5-a36e-4a70-ba2d-f2e1d7871be2) | **1** | 167 | 1.00x |
| [Square Go categories](https://mobbin.com/screens/89ee891e-17ea-4c5a-b173-eccd95149a21) | **2** | 120.5, 77 | 1.56x |
| [Cal.com booking](https://mobbin.com/screens/43d909f7-c988-4ed8-a530-0bc1b17f0067) | **2** | 141 (two panels), 244 | 1.73x |
| [OpenTable home](https://mobbin.com/screens/ff307b73-39a0-4899-bcf2-08521035820f) | **2** | 134, 128 | **1.05x** |
| [Uber Eats home](https://mobbin.com/screens/9ef233db-531f-40b8-be83-fdc3335455e2) | **3** | 216, 158, 67 | 3.22x |

Median 2, max 3, nobody exceeded 3.

The useful pattern is not the count, it is the **separation**. Where a screen carries two widths
they sit 1.56x, 1.73x and 3.22x apart: a step you read as a decision. The one exception is
OpenTable's home, where the lone card in the "Available for late dinner now" row measures 134 px and
the carousel cards below it measure 128 px, a **5% difference**. Looking at that screenshot, the 5%
does not read as hierarchy. It reads as two components built separately, which is what it almost
certainly is.

**The usable rule: same width, or at least ~1.3x apart. A 5% difference is the worst case, because
it costs consistency and buys no hierarchy.** Structurally the same argument as the EMPHASIS BUDGET
item (c) about type sizes, applied to widths.

Confidence: **observed** for the widths. The 1.3x threshold is **inferred** from 7 screens and is a
house number with no external citation. Do not cite it as evidence.

---

## 5. Where they break the grid on purpose, and where they break it by accident

**On purpose, and it works:**

1. **The split view abandons the container entirely.** Airbnb web's search page runs edge to edge
   with a 1.4% page margin, because a map cannot live inside a centred box. Fresha web and Uber
   Eats do the same. Measured: Airbnb's list rail 59.8% + map 36.9% = 96.7% of viewport used.
2. **The peek card.** Every horizontal rail I measured deliberately crops the next card at the right
   edge rather than ending flush. Airbnb iOS shows 2 full cards plus a **9 px** sliver;
   GetYourGuide shows 1.3 cards; Fresha shows 1.55. The crop is the scroll promise and it is the
   most consistently applied grid break in the sweep.
3. **The intra-card mosaic** (section 2): a 3 px gutter nested inside an 8 px gutter grid.
4. **Cal.com's booking card refuses the site grid.** 528 px of a 768 render, centred, split
   **27% / 46% / 27%**: info panel, month grid, slot column, with the two flanking panels set to
   identical widths. The 7-column month grid inside it is a genuinely different module from anything
   else on the page. Three nested grids on one screen, and it reads calm because the outer card
   bounds them.

**By accident, and it shows:**

5. **The fixed grid with too few items.** Warby Parker's slot picker is a 2-column grid, pill 126 px,
   gutter 10 px. On the [populated screen](https://mobbin.com/screens/11be216a-ddfa-4cc4-80c5-8470fc835b09)
   it is dense and correct. On the [sparse screen](https://mobbin.com/screens/69b6baa5-99c9-4bbd-99af-2eb6b1476390)
   the same grid holds 3 slots, so row 2 has one pill and an orphan empty column, and everything
   below is empty. Measured: last pill bottom at y=408 against a screen bottom at ~648, so
   **37% of the viewport is dead space below the last interactive element, with no sticky action.**
   That is exactly the failure Solen's NEVER-AGAIN floor 3 bounds at 30%, occurring in a shipped
   product.
6. **The near-identical width** (OpenTable, section 4).
7. **Two container widths on one site.** OpenTable's home content measures 84.5% of viewport and its
   search page measures 73.7%, at the same capture width. Different templates, different containers,
   and no reason for it visible in the screenshots.

Square Go shows the good answer to failure mode 5. On its
[slot screen](https://mobbin.com/screens/8b69dfc2-0028-4364-afc5-ed5820644be3) the "Morning" and
"Afternoon" sections are fully booked, and instead of collapsing, each renders a **ghost pill at
column width** carrying the words "All booked". The grid keeps its shape, the empty state stays
inside the grid, and the user learns something. Measured: ghost pill 111 px, exactly the width of
the live blue pills below it.

Confidence: **observed** for all measurements. Calling 5, 6 and 7 accidents is **inferred**; I
cannot know intent, only that the result reads as unintentional.

---

## 6. Time-slot grids specifically, because Solen has one

Of the 8 time-picker screens returned by the iOS slot search, the column structure split like this:

| Structure | Count | Apps |
|---|---|---|
| 2-column grid of pills | 2 | [Warby Parker](https://mobbin.com/screens/11be216a-ddfa-4cc4-80c5-8470fc835b09), [Square Go](https://mobbin.com/screens/8b69dfc2-0028-4364-afc5-ed5820644be3) |
| 3-column grid of pills | 1 | [Swiggy](https://mobbin.com/screens/bc00c1ad-e740-4444-bfc5-811b50fbc74f) |
| 1-column full-width rows | 2 | [Fresha](https://mobbin.com/screens/9ed7eb7a-41ca-4528-a891-9ffb44f60dcf), [Natural AI](https://mobbin.com/screens/e90a5563-be94-43c0-a62a-a46334b78c45) |
| horizontal scroll strip | 2 | [Careem](https://mobbin.com/screens/a030486a-580e-4b86-b331-2b7cdddf94c8), [Redfin](https://mobbin.com/screens/982f1ab4-f062-4de9-acbb-59245229e747) |
| 1-column beside a 7-col month grid (web) | 2 | [Cal.com](https://mobbin.com/screens/43d909f7-c988-4ed8-a530-0bc1b17f0067), [Calendly](https://mobbin.com/screens/09362b21-1b1e-4504-b354-c44cf3d029da) |

There is no convergence on column count, so I am reporting the distribution rather than declaring a
winner. What the measurements *do* agree on is narrower and more useful: **every one of them keeps
the slot grid's left margin identical to the page margin**, so slots align to the same left edge as
the headings above them. Fresha's slot row spans 16 to 282 px, the exact content width of its other
screens. Warby Parker's slot grid starts at 19 px, matching its own date strip. Square Go's starts
at 16 px.

One measured oddity I could not resolve: Square Go's slot pills stop **50 px short of the right
margin** at 299 render (pills end at 248 while content elsewhere reaches 283). I could not tell from
the screenshot whether that is a fixed pill width or a 3-column grid with a permanently empty third
column. Flagging it rather than guessing.

Confidence: **observed** for the counts and the margins. Eight screens is a small sample for a
categorical claim, which is why no winner is declared.

---

## 7. What Solen actually renders today

Everything here came from grepping and reading the repo on 2026-07-29, not from memory.

### 7a. The default SalonCard grid is correct and matches the corpus

`app/[locale]/_components/homepage/SalonCard.tsx` lines 403 to 409:

```
w-[calc((100vw-44px)/1.5)]     // mobile: 1 full card + a peek
sm:w-[calc((100%-24px)/3)]     // 3 cols, 12px gutter
md:w-[calc((100%-36px)/4)]     // 4 cols, 12px gutter
lg:w-[calc((100%-48px)/5)]     // 5 cols, 12px gutter
xl:w-[calc((100%-60px)/6)]     // 6 cols, 12px gutter
```

This is exactly the pattern section 1 found: **fixed 12 px gutter, fixed margin, card is the
remainder.** 12 px sits inside the measured band of 10 to 14 pt. The mobile card lands at
(390 - 44) / 1.5 = **231 pt, 59.1% of a 390 viewport**, between Fresha's 57% and GetYourGuide's
66.5%. It also ships the peek crop from section 5 item 2. I looked for a reason to change it and
found none.

### 7b. The same card renders at three different widths on three surfaces

At a 390 pt viewport, computed from the code:

| Surface | File:line | Width formula | Card pt | % viewport |
|---|---|---|---|---|
| Home rails (default) | `_components/homepage/SalonCard.tsx:404` | `(100vw-44px)/1.5` | **231** | 59.1% |
| PDP "Venues nearby" | `_components/salon/SalonVenuesNearby.tsx:197` | `(100vw-44px)/1.25` + `md:w-[300px]` | **277** | 71.0% |
| Search results grid | `_components/search/SearchTemplate.tsx:1556` | `grid-cols-2 gap-x-3` inside `px-3` | **177** | 45.4% |

Ratios: 231 / 177 = **1.30x**, 277 / 231 = **1.20x**.

By the rule in section 4, the search-to-home step at 1.30x is legal: it reads as a decision. **The
home-to-PDP step at 1.20x is the OpenTable failure mode**, big enough to notice and too small to
read as intent. `SalonVenuesNearby.tsx:197` also hardcodes `md:w-[300px]` on desktop, abandoning the
fractional column formula every other SalonCard caller uses, so on desktop the PDP rail is not on
the same grid as anything else in the product.

FLOORS LAW 8 already documents that this card's *anatomy* diverges across screens. These are the
*geometry* numbers for the same divergence.

### 7c. Six column ladders and five gutters for one component

Every grid that renders `SalonCard`:

| File:line | Ladder | Gutter |
|---|---|---|
| `homepage/SalonCard.tsx:404-408` (default) | 1 / 3 / 4 / 5 / 6 | 12 |
| `search/SearchTemplate.tsx:1556-1557` | 2 / md 3 / lg 4 (lg 2 with map open) | 12 mobile, 20 desktop |
| `profile/FavoritesList.tsx:101` | 1 / sm 2 | 16 |
| `brand/[slug]/page.tsx:113` | 1 / sm 2 / lg 3 | 20 |
| `behandlungen/[...slug]/page.tsx:200` | 1 / sm 2 / lg 3 | 24 |
| `salon/SalonVenuesNearby.tsx:197` | horizontal rail, fixed 300 px desktop | 12 |

Six ladders, five gutter values (12, 12/20, 16, 20, 24). Across the whole repo `grid-cols-2` appears
with **eight different gap values**: `gap-3` (16 sites), `gap-4` (14), `gap-2.5` (8), `gap-2` (6),
`gap-12` (4), `gap-8` (3), `gap-3.5` (3), `gap-6` (1). No app in the corpus varied its gutter by
more than 1.6x on any surface I measured. Solen varies it by 12x.

### 7d. 59 distinct container widths against a contract that locks 2

The design contract locks `max-w-[1280px]` for pages and 1180 for the PDP. Grepped over `app/`,
`components/`, `lib/`:

- **47 distinct** arbitrary `max-w-[Npx]` values
- **12 distinct** Tailwind named `max-w-*` tokens in use
- `max-w-[1280px]` appears **42 times across 20 files**, wrapped in at least **7 different
  horizontal padding recipes** (`px-4 md:px-8`, `px-4 md:px-6`, `px-3 md:px-4`, `px-3 md:px-6`,
  `px-4` alone, `px-6`, and bare)
- **there is no container primitive.** `components/ui/` holds `card.tsx`, `breadcrumb.tsx` and four
  decorative components. Nothing owns the page grid, so every page redeclares it inline.

That is FLOORS LAW 9 ("screens are composed, not drawn") applied to the grid: the registry never
owned the container, so 20 files hand-wrote it and they drifted.

### 7e. A 4 px misalignment on the live search page

Inside `SearchTemplate.tsx`, same page, same column:

- line 1452, the result-count and sort row: `max-w-[1280px] ... px-4 pt-5 md:px-6`
- line 1541, the wrapper around the results grid: `max-w-[1280px] px-3 pb-12 pt-4 md:px-6`

On mobile the heading sits **16 px** from the viewport edge and the card grid it labels sits
**12 px** from it. They do not share a left edge. At `md` and up both become `px-6` and the
misalignment disappears, so this is mobile-only. Separately, lines 1230 and 1333 wrap the search
chrome in `max-w-[680px] px-4`, and line 1653 nests `md:max-w-[780px]` inside the 1280 container, so
this one page carries four container widths.

Also worth naming: **12 px is tighter than the page margin of every app I measured.** Converted to
pt the iOS margins were 16 (Airtasker), 16 (GetYourGuide), 20 (Fresha), 24 (Airbnb), 25 (Warby
Parker), 33 (Square Go). Solen's search grid at 12 px sits below the floor of a 6-app sample.

---

## 8. Verdict for Solen

Ranked by what the fix buys, with the file named.

**1. Build the container and grid primitives, then compose with them.** There is no container
component, which is the root cause of 7d and 7e. Add `components/ui/PageContainer.tsx` exposing
exactly the two locked widths (`page` = 1280, `pdp` = 1180) with one padding recipe baked in, and
`components/ui/CardGrid.tsx` owning the one column ladder and the one gutter. Then replace the 42
inline `max-w-[1280px]` sites. Nothing else on this list holds without it, because advice does not
survive the next page someone writes. This is a `/refine` job, not a hand edit.

**2. Fix the 4 px misalignment on search.** `SearchTemplate.tsx:1541`: `px-3` becomes `px-4`, so the
results grid shares a left edge with its own heading at line 1452. Two characters, and it also moves
Solen's mobile page margin from 12 px, below the floor of every app measured, to 16 px, matching the
tightest of them.

**3. Resolve three card widths down to two.** `SalonVenuesNearby.tsx:197` should drop
`w-[calc((100vw-44px)/1.25)] md:w-[300px]` and take the SalonCard default `(100vw-44px)/1.5` plus
the fractional desktop ladder. That removes the 1.20x step, the one ratio in Solen that fails the
section-4 rule. Search stays at 45.4%, because 1.30x apart is a legible intentional step and a 2-up
mobile results grid is what Airbnb ships too.

**4. Collapse the SalonCard gutters to one token pair.** All six render sites in 7c go to `gap-3`
(12 px) mobile and `gap-5` (20 px) at `md` and up, which is what `SearchTemplate.tsx:1556` already
does and what the corpus supports. Kill `gap-4`, `gap-6` and the fixed 300 px in the other five.

**5. Add a grid-shape floor to the FLOORS LAW, because there is not one.** FLOORS LAW 8 binds
*anatomy* across screens and says nothing about *geometry*. Proposed wording for
`_design-system/LOCKFILE.md`: *an entity rendered on more than one screen uses either the same width
or a width at least 1.3x apart; the gutter is one token per breakpoint across the whole product; a
fixed-column grid whose content falls below one full row renders a ghost cell at column width rather
than collapsing.* The last clause is Square Go's "All booked" pattern and it is the measured answer
to the 37% dead-space failure in section 5.

**6. Surface, do not decide: the 1280 lock versus fluid browse.** Six of the eight web products
measured run browse fluid. `max-w-[1280px]` is 88.9% of a 1440 viewport, 66.7% of 1920 and 50% of
2560, so on a large monitor Solen's browse page occupies half the screen while Fresha occupies 92%.
The contract locks 1280 by name, and per the precedence chain a research file cannot overturn a
locked literal. **This needs the owner's call.** The narrower version needing no call: the
*search-with-map* view is a split view, and every split view I measured abandons the container
entirely, so `SearchTemplate.tsx:1541` could go fluid **only when `mapOpen` is true**.

### Two things I looked for a problem in and did not find one

- **The map split ratio is fine.** `SearchTemplate.tsx:1542` gives the map `minmax(380px,46%)`.
  Measured, Airbnb gives its map 36.9% and Fresha gives its map 67.3%. Solen at 46% sits inside that
  range. No change.
- **The default SalonCard responsive formula is right** (7a). Fixed 12 px gutter, fluid card,
  divisor per breakpoint, with the peek crop. That is precisely what the corpus converges on and
  Solen arrived at it independently. I went looking for a reason to touch it and could not find one,
  which means I might just be agreeing here. Push back on me.

---

## 9. Two stale claims in existing docs, surfaced not overwritten

Per rule 18, these contradict what I measured today and are reported rather than quietly fixed.

**9a. `SOURCE.md` "Gutter math" says desktop padding is `px-8` (32 px). The search page ships
`md:px-6` (24 px).** SOURCE.md's table reads "md (>=768px) | `px-8` (32px) | `max-w-[1280px]`".
`SearchTemplate.tsx` lines 1437, 1452 and 1541 all use `md:px-6`. Homepage sections do use
`md:px-8`. So the table describes the homepage, not the product. Either the table gains a
per-surface row or the search page moves to `px-8`; that is an owner or LOCKFILE call, not mine.

**9b. `GEOMETRY_PRINCIPLES_2026-07-17.md` GM-03's cited evidence points at the wrong container.**
GM-03 states the margin/gutter relationship on the search grid as "margin (16/24) exceeds gutter
(12/20)", citing `SearchTemplate.tsx:1435` for the outer margin. Line numbers have moved since
2026-07-17; the wrapper that actually contains the results grid today is **line 1541, `px-3`
(12 px)**, not `px-4`. So on mobile margin **equals** gutter (12 = 12) rather than exceeding it.
GM-03's floor is stated as `margin >= gutter`, so the principle still passes, but its worked numbers
are wrong about which element. Fixing item 2 in section 8 restores the strict inequality.

**9c. A note on GM-09's worked example, which is not a description of Solen.** GM-09 computes
`colWidth` using "Solen's own locked numbers (W=1280, m=32, g=24, N=12)". Grepped today, **there is
no 12-column module anywhere in `app/` or `components/`**: `grid-cols-` appears at 1, 2, 3, 4, 5, 6,
7 and 8, never 12, and the dominant gutter is 12 px, not 24. The formula is right; the numbers in it
are a hypothetical. Worth a one-line correction in that file so nobody reads it as the spec.

---

## Appendix: method

- Images pulled from the `image_url` short links Mobbin returned, measured with Python PIL.
- Two detectors. A band detector computes, per column, the fraction of rows in a y-band matching the
  page background, then reports runs of >=97% background as gaps. A row detector does the same on a
  single scanline. Photo cards with rounded corners and shadows defeat the band detector, which is
  why the Uber Eats 4-up gutter reads 3 px by band and **8 px** by row. 8 is the correct number and
  the one used above. Where the two disagreed, the row measurement was taken.
- White-on-white cards (Hers, Redfin's time pills) defeated both detectors. Not reported.
- Every `mobbin.com/screens/...` link in this file was returned by a search in this session and its
  image was examined before being described.
