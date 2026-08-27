<!-- exists-check: net-new vs _design-system/sections/home-feed/CORPUS.md (extended, not edited),
     scripts/measure-sections.mjs and the _plans/ roadmaps. Full note in 01-search-and-categories.md.
     Structure follows _design-system/sections/salon-detail/. -->

# Nearby (map teaser): section spec

**Reference:** `_measured/home-feed.json` band index 4 · `CORPUS.md` section 1 row 3 (a pinned personal card: 6 of 34) is the nearest archetype; the corpus has no map-teaser row, which is named in Intentional deviations
**Component:** `app/[locale]/_components/homepage/Nearby.tsx` wrapping `NearbyMap.tsx`
**Layer:** 1 (chrome) + Layer 2 (accent `s-accent` on the marker dot)

## Layout

```
(no heading, deliberately)
+--------------------------------------------------+
|  * 4.6 (25)          * 4.8 (12)                  |   live Mapbox tiles, 358 x 156
|          * 4.9 (7)                               |   marker pills, white, radius 9999
|   [ Basel  15 Salons ]                           |   city chip, 136 x 32, bottom-left
+--------------------------------------------------+
```

The whole tile is one `<a href>` to `/{locale}/search?view=map`.

## Measured

Band index 4. Box top 822, left 0, width 390, height 188. Surface transparent, padding 0, radius 0.

The extractor reported this band's heading as "4.6". That is its last-resort fallback (the largest
visible text leaf) firing because the band has no `h1`/`h2`/`h3`/`h4` at all, which is correct: the
section title was deliberately removed. The band is not called "4.6" anywhere.

| Role | Size / weight | Family | Colour | Line-height | Count | Sample |
|---|---|---|---|---|---|---|
| Marker rating | 12 / 600 | Helvetica Neue | `rgb(10,10,10)` | 12 | 13 | "4.6" |
| Marker count | 12 / 400 | Helvetica Neue | `rgb(107,107,107)` | 12 | 13 | "(25)" |
| City chip name | 12 / 600 | Inter | `rgb(10,10,10)` | 18 | 1 | "Basel" |
| City chip count | 12 / 400 | Inter | `rgb(107,107,107)` | 18 | 1 | "15 Salons" |

- Map tile: radius 16, no shadow, border 1px `rgb(228, 228, 231)`, background `rgb(244, 244, 245)`,
  padding 0, example 358 x 156, count 1.
- City chip: radius 9999, shadow `rgba(0,0,0,0.1) 0px 1px 3px` plus a white 1px inset,
  border 1px `rgba(255, 255, 255, 0.6)`, background `rgba(255, 255, 255, 0.8)`, padding `6px 12px`,
  example 136 x 32, count 1.
- Imagery: 1 image, 2 024 px2. The Mapbox tiles do not register as imagery at all; the JSON records
  one small image in a 358 x 156 tile.
- Text elements 28, of which 14 are weight >= 600.
- **13 marker pills are measured, and the chip says 15 Salons.** Both are correct and the reason is in
  `NearbyMap.tsx:145-155`: 15 markers are created, then a de-collide pass sets
  `display: none` on any pill whose projected point lands within 76 x 24 of one already kept. The chip
  counts the array handed to the map, the pills count what survived the collision.
- The Helvetica Neue family on the marker roles is the Mapbox marker element inheriting a different
  stack than the page. The other two roles in the same band are Inter.
- Box-to-box gaps: 16px above (band 03 ends 806) and 16px below (band 05 starts 1026).

## Tokens

- Tile: `rounded-card` (16), `border-s-border`, `bg-s-bg-sunken`. All three measured exactly.
- Marker dot: `bg-s-accent` `#276EF1` with a 2px white ring, 11 x 11 (`NearbyMap.tsx:55`). Below the
  extractor's 60 x 32 card floor, so it carries no measured entry.
- Star inside the marker pill: `text-s-star` `#FFC32B`, 11 x 11.
- Press feedback `active:scale-[0.97]` at 80ms `ease-glide`.

## Interaction

- Tap anywhere on the tile: `/{locale}/search?view=map`. The map itself is `interactive: false`, so
  there is no pan or zoom in place; the tile is a single link.
- Markers re-project and re-de-collide on every `ResizeObserver` fire.

## Intentional deviations

- **No section heading and no see-all arrow.** Owner 2026-08-10, verbatim in `Nearby.tsx:90-108`: "in
  your near thing, like, remove and just make it maps... I don't even want an arrow." FLOORS LAW 5 asks
  what a deletion keeps: it keeps 156px of live tiles with real markers plus a chip naming the city. The
  cost is named in the component: this section stops contributing a text anchor to the page's heading
  rhythm.
- The card rail that used to sit under the map was removed 2026-08-05 (A4), with `ScrollRow`, the
  `scrollRef`, the `sortByCategoryPicks` bend and the `prefsOverride` seam all removed with it because
  the cards were their only consumer.
- No corpus support either way: none of the 34 tally-set screens carries a map teaser in the feed. This
  band is a Solen decision, not a corpus pattern.

## Empty state

`NearbyMap` returns early when the Mapbox token is missing or `salons.length === 0`
(`NearbyMap.tsx:104`), leaving the sunken tile with its border and no markers. `countSubLabel` drops out
entirely rather than rendering a fabricated number when `mapSalons` is empty (`Nearby.tsx:126`).

## Provenance

- A4 (owner 2026-08-05): map only, cards removed.
- Owner 2026-08-10: heading and arrow removed, the box carries its own city label.
- M1 (2026-08-11): the label counts what the tile draws. Three different numbers for one thing (20 / 15
  / 12) were reconciled to the single `mapSalons` array.

## Against the floors

- **Display anchor >= 28px: FAIL, and this band is a named contributor.** It carries no heading at all;
  its largest text is 12px, the smallest maximum of any band on the screen.
- **Anchor at least 1.8x body: not applicable.** One size (12px) in the whole band.
- **At most ~30% of text at weight >= 600: FAIL at 50.00%** (14 of 28). Every marker pill puts its
  rating at 600 and its count at 400, so the band sits at exactly half by construction.
- **At most 4 sizes and 2 weights: PASS within this band** (1 size, 2 weights). It spends no size budget.
- **Imagery >= 33%: FAIL, and this band is a named contributor.** 188px of document height returning
  2 024 px2 of measured imagery. Live map tiles are not photography and the measurement does not count
  them as images either, so this band reads as zero against the imagery floor from both directions.
- **Edge visibility (FLOORS LAW 4): PASS by route (c).** Sunken fill plus a 1px `#E4E4E7` hairline
  against the white page.
- **Locked radius: PASS.** 16 = `rounded-card`.
- **Locked hairline: PASS.** `#E4E4E7` measured exactly.
- **Same thing looks the same everywhere (FLOORS LAW 8): the rating is a third shape here.** The marker
  pill renders "* 4.6 (25)" with the count in `s-ink-2`; the salon cards render "* 4.8" with no count;
  band 10 renders "* 4.8 (16)" with the count in accent blue. Three treatments of one fact on one screen.
- **Semantic colour (taste rule 4): the accent marker dot is a graphical element, not text.** `#276EF1`
  is 4.58:1 on white per the CLAUDE.md table, above the 3:1 graphical floor.
