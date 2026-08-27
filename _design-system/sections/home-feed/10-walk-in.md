<!-- exists-check: net-new vs _design-system/sections/home-feed/CORPUS.md (extended, not edited),
     scripts/measure-sections.mjs and the _plans/ roadmaps. Full note in 01-search-and-categories.md.
     Structure follows _design-system/sections/salon-detail/. -->

# WalkInBand ("Walk-in"): section spec

**Reference:** `_measured/home-feed.json` band index 10, with band index 11 folded in (see Measured) · `CORPUS.md` section 1 row 6 (a promo or editorial band interrupting the card rows: 12 of 34, and the corpus names `WalkInBand` as the component occupying that slot)
**Component:** `app/[locale]/_components/homepage/WalkInBand.tsx`
**Layer:** 1 (chrome) + Layer 2 (accent `s-accent` on the review count) + Layer 3 (success `s-success` on the wait figure and the Live dot, star `s-star`)

## Layout

```
+----+  Walk-in                                        <- h2 18/600 ink
| [] |  Ohne Termin. Sehen Sie die Wartezeit ...       <- 12/400 ink-2
+----+  (o) Live                                       <- 7px green dot + 12/600 ink
 52x52 sunken tile, radius 15

+-----------------+ +-----------------+ +---
| Jetzt frei      | | 10-20 Min       | |          20/600 GREEN
| Cuts & Culture  | | Name    * 4.8 (16) |         14/600 ink + 12/600 ink-2 + 12/600 BLUE
| Elsaesserstr 10 | | ...             | |          12/400 ink-2
| Niemand wartet  | | ...             | |          12/400 ink-2
+-----------------+ +-----------------+ +---
 157 x 119, radius 13, white, 1px hairline

[  Alle Walk-ins  ->  ]                              <- 358 x 47, radius 13
```

## Measured

Band index 10. Box top 2877, left 0, width 390, height 296. Surface transparent, padding 0, radius 0.

**Band index 11 is folded into this file.** It is an unclassed `div` at top 2885, left 82, width 292,
height 78 whose text roles are a strict subset of this band's (the h2, the sub-line and the Live label).
It is the header text column beside the 52px icon tile, not a nameable section of the screen.

| Role | Size / weight | Family | Colour | Line-height | Count | Sample |
|---|---|---|---|---|---|---|
| Wait figure | 20 / 600 | Inter Tight | `rgb(22,163,74)` | 20 | 4 | "Jetzt frei" |
| Section title | 18 / 600 | Inter Tight | `rgb(10,10,10)` | 18.9 | 1 | "Walk-in" |
| Shop name + CTA label | 14 / 600 | Inter Tight | `rgb(10,10,10)` | 21 | 5 | "Cuts & Culture" |
| Sub-line | 12 / 400 | Inter | `rgb(107,107,107)` | 15.6 | 1 | "Ohne Termin. Sehen Sie die Wartezeit ..." |
| Live label | 12 / 600 | Inter | `rgb(10,10,10)` | 18 | 1 | "Live" |
| Rating value | 12 / 600 | Inter | `rgb(107,107,107)` | 18 | 4 | "4.8" |
| Review count | 12 / 600 | Inter | `rgb(39,110,241)` | 18 | 4 | "( 16 )" |
| Address + queue line | 12 / 400 | Inter | `rgb(107,107,107)` | 18 | 8 | "Elsaesserstrasse 10, Basel" |

- Shop chip: radius 13, no shadow, border 1px `rgb(228, 228, 231)`, background white, padding 12px,
  example 157 x 119, count 4.
- Bottom CTA: radius 13, no shadow, border 1px `rgb(228, 228, 231)`, background white,
  padding `12px 16px`, example 358 x 47, count 1.
- Imagery: 1 image, 1 177 px2. The 52 x 52 header icon tile falls below the extractor's 60 x 32 card
  floor, so it carries no measured card entry.
- Text elements 28, of which 19 are weight >= 600.
- The 5-count 14 / 600 role is 4 shop names plus the bottom CTA label, which share size, weight, family
  and colour.
- The 8-count 12 / 400 role is 2 lines per chip (address and the queue line), derived from 4 chips.
- Box-to-box gaps: 16px above (band 09 ends 2861) and 16px below (this band ends 3173, file 11 /
  JSON band 12 starts 3189).

## Tokens

- Wait figure `text-s-success` `#16A34A`, measured `rgb(22, 163, 74)`.
- Live dot `bg-s-success`, 7 x 7, with the label itself in ink. The R3 fix recorded in the component:
  ink label, the dot carries the colour.
- Review count `text-s-accent` `#276EF1`, measured `rgb(39, 110, 241)`.
- Star `text-s-star` `#FFC32B` at size 11.
- Chip and CTA hairline `s-border` `#E4E4E7`; header icon tile `bg-s-bg-sunken` at radius 15.
- Radius 13 on the chips and the CTA. The locked ladder has no 13 rung.

## Interaction

- Tap a chip: `/{locale}/salon/{slug}?walkin=1`, which `SalonDetailV3` reads to open the PDP in walk-in
  mode. Press feedback `active:scale-[0.98]` at 80ms.
- Tap the CTA: `/{locale}/barbershop?walk_in=true`, the existing search with the filter applied, not a
  bespoke route.
- The chip rail is horizontally scroll-snapped at `flex-[0_0_42%]`, so 2 chips plus a peek are in view.
- With exactly 1 salon the chip goes full width and the peek disappears.

## Intentional deviations

- This is the one band on the screen whose numbers are live rather than nightly: `GET /api/walkin/nearby`
  on mount. The "Live" marker is honest signal for that reason, not decoration.
- The wait is a conservative range (`waitMinutes-waitMinutesMax`), and 0 renders as "Jetzt frei" rather
  than a fabricated minute count.
- The tracked-uppercase "BARBERSHOP" eyebrow was deleted 2026-06-11. `CORPUS.md` section 2 row 9 found
  0 of 25 corpus headers using a tracked all-caps eyebrow, so the corpus agrees with that removal.
- The h2 here uses `leading-[1.05]` where every `SectionTitle` h2 uses `leading-[1.25]`, which the
  measurement shows as two separate 18 / 600 Inter Tight roles (line-height 18.9 here, 22.5 there).

## Empty state

The whole band returns `null` at 0 walk-in salons (feature off, or none enabled). The loading state is
2 chips at the real chip geometry (radius 13, hairline, `p-3`) with four `animate-pulse-bounded` bars at
the real row positions, so the skeleton mirrors the final layout.

## Provenance

- Mockup-approved 2026-06-04, replacing the earlier dark teaser band.
- Owner pick 2026-06-29, variant B "live board".
- 2026-06-09: real data wired (`getWalkinAvailability`).
- B15 (PSYCHOLOGY law 6): the review count was gated on but never printed, so a bare rating showed. It
  now prints the count it was gated on.
- 2026-07-17 rhythm decision: this section had no padding of its own and got `pt-2 pb-2` to match the
  `Section` primitive's cadence.

## Against the floors

- **Display anchor >= 28px: FAIL, and this band holds the largest text in the page body.** Its 20px
  wait figure is the biggest thing on the screen outside the footer wordmark, and it is still 8px short
  of the 28 floor and 10px short of the 30px target ladder.
- **Anchor at least 1.8x body: FAIL at 1.67x** within this band (20 / 12), better than the 1.5x every
  rail scores and still under the 1.8 floor.
- **At most ~30% of text at weight >= 600: FAIL at 67.86%** (19 of 28), the worst band on the screen.
  The chip is the cause: name, rating, count and wait are all 600, against two 400 lines.
- **At most 4 sizes and 2 weights: this band alone spends 4 of the screen's 9 sizes** (20, 18, 14, 12),
  which is the entire per-screen size ceiling in one band. Weights 400 and 600 only, so it PASSES the
  weight half.
- **Imagery >= 33%: FAIL, and this band is a named contributor.** 296px of document height returning
  1 177 px2 of imagery, which is 0.8% of its own 390 x 296 area.
- **Semantic colour, taste rule 4: SURFACE, do not resolve here.** `#16A34A` measures 3.30:1 on white
  per the CLAUDE.md contrast table. At 20px / 600 that clears the WCAG large-text 3:1 floor, and it
  collides with the same rule's own sentence that success green is "legal as ICONS, never as body text".
  Two readings of one dated rule, so it is recorded, not decided.
- **Blue is sparse and small-clickable-only, taste rule 3: PASS.** The only blue is the review count,
  which the rule names by example, on a white chip where `#276EF1` is 4.58:1.
- **Locked radius: 13 and 15 are both off the locked ladder.** Nearest rungs are 12 (input) and 16 (card).
- **Locked hairline: PASS.** `#E4E4E7` on both the chips and the CTA.
- **Same thing looks the same everywhere (FLOORS LAW 8) and screens are composed, not drawn
  (FLOORS LAW 9): FAIL, and it is measurable.** This band hand-writes its own rating cluster
  (`WalkInBand.tsx:139-145`: `Star size={11}` + value + a blue count span) instead of composing
  `RatingStars`, which every salon card on the same screen uses. The measurement records the result as
  two different roles for one fact: 12 / 600 `rgb(107,107,107)` here against 12 / 400 `rgb(107,107,107)`
  on the cards, plus a blue count that the cards do not render at all.
