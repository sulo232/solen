<!-- exists-check: net-new vs _design-system/sections/home-feed/CORPUS.md (extended, not edited),
     scripts/measure-sections.mjs and the _plans/ roadmaps. Full note in 01-search-and-categories.md.
     Structure follows _design-system/sections/salon-detail/. -->

# TopCategoryRails, rail 3 of 4 ("Top Nails"): section spec

**Reference:** `_measured/home-feed.json` band index 7 · `CORPUS.md` section 1 row 4 and section 3
**Component:** `app/[locale]/_components/homepage/TopCategoryRails.tsx`, inner `CategoryRail`
**Layer:** 1 (chrome) + Layer 3 child (star `s-star`, `HeartButton`)

## Layout

Identical anatomy to 05, with 4 cards.

```
Top Nails                                              (->)
+-------------+ +-------------+ +----------
|   photo     | |   photo     | |   photo               231 x 185, radius 22
+-------------+ +-------------+ +----------
 Nail Studio Bliss * 4.5   Name   * 4.6   ...           14/600 ink + 12/400 ink-2
 Nails             Nails                                12/400 ink-2
 4051 Basel  15 CHF   ...                               12/400 ink-2 + 12/600 ink
```

## Measured

Band index 7. Box top 1724, left 0, width 390, height 333. Surface transparent, padding 0, radius 0.

| Role | Size / weight | Family | Colour | Line-height | Count | Sample |
|---|---|---|---|---|---|---|
| Section title | 18 / 600 | Inter Tight | `rgb(10,10,10)` | 22.5 | 1 | "Top Nails" |
| Card name | 14 / 600 | Inter | `rgb(10,10,10)` | 17.5 | 4 | "Nail Studio Bliss" |
| Rating value | 12 / 400 | Inter | `rgb(107,107,107)` | 18 | 4 | "4.5" |
| Category, address, price label | 12 / 400 | Inter | `rgb(107,107,107)` | 16.2 | 12 | "Nails" |
| Price amount | 12 / 600 | Inter | `rgb(10,10,10)` | 16.2 | 4 | "15 CHF" |

- Card photo: radius 22, shadow `rgba(50, 47, 44, 0.09) 0px 2px 8px 0px`, no border,
  background `rgb(244, 244, 245)`, padding 0, example 231 x 185, count 4.
- Imagery: 4 images, 170 239 px2, 42 560 px2 each.
- Text elements 25, of which 9 are weight >= 600.
- Box-to-box gaps: 16px above (band 06 ends 1708) and 16px below (this band ends 2057, band 08 starts
  2073).

## Tokens

Same set as 05.

## Interaction

- Tap a card: `/{locale}/salon/{slug}`.
- Tap the see-all circle: `/{locale}/nails`, label `Alle Nails-Salons`.
- Desktop only: a scroll-circle pair at `md:`.

## Intentional deviations

Same as 05.

## Empty state

Same as 05: `null` below 2 resolvable salons.

## Provenance

Same as 05 (I3, 2026-08-01; A6, 2026-08-05).

## Against the floors

- **Display anchor >= 28px: FAIL.** Largest text 18px.
- **Anchor at least 1.8x body: FAIL at 1.5x** (18 / 12).
- **At most ~30% of text at weight >= 600: FAIL at 36.00%** (9 of 25).
- **At most 4 sizes and 2 weights: PASS within this band** (3 sizes, 2 weights).
- **Density floor >= 4 units: PASS on count** at exactly 4. Horizontal crop **not measured**.
- **Locked shadow: FAIL against the contract row** (`elevation-2` measured, `whisper` specified).
- **Locked radius: photo at 22, off the locked ladder.**
- **Same thing looks the same everywhere (FLOORS LAW 8): PASS.** Identical measured anatomy to 03, 05,
  06 and 08.
