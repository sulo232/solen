<!-- exists-check: net-new vs _design-system/sections/home-feed/CORPUS.md (extended, not edited),
     scripts/measure-sections.mjs and the _plans/ roadmaps. Full note in 01-search-and-categories.md.
     Structure follows _design-system/sections/salon-detail/. -->

# PopularLooks ("Beliebte Looks"): section spec

**Reference:** `_measured/home-feed.json` band index 9 · `CORPUS.md` section 1 row 4 (titled horizontal carousels) and section 2 row 6 (exactly one overlay badge on a photo: 9 of 19 carry one, 0 of 19 carry two)
**Component:** `app/[locale]/_components/homepage/PopularLooks.tsx`
**Layer:** 1 (chrome) + Layer 3 child (`HeartButton`)

## Layout

```
Beliebte Looks                                         (->)
+-----------+ +-----------+ +------
|           | |           | |          172 x 305, radius 16, aspect 9/16
|   photo   | |   photo   | |          shadow-elevation-3 BEHIND the frame
|           | |           | |
| [name   ] | | [name   ] | |          opaque white pill on the photo, bottom-left
+-----------+ +-----------+ +------
 Minenhle Ntanzi      45 CHF           12/400 ink-2  +  12/600 ink
```

The look name sits in an opaque white pill on the photo (approved variant B), not below it.

## Measured

Band index 9. Box top 2422, left 0, width 390, height 439. Surface transparent, padding 0, radius 0.

| Role | Size / weight | Family | Colour | Line-height | Count | Sample |
|---|---|---|---|---|---|---|
| Section title | 18 / 600 | Inter Tight | `rgb(10,10,10)` | 22.5 | 1 | "Beliebte Looks" |
| Look name + price | 12 / 600 | Inter | `rgb(10,10,10)` | 16.2 | 16 | "Sleek Blunt Bob with Golden Ombre and Middle Part" |
| Creator handle | 12 / 400 | Inter | `rgb(107,107,107)` | 16.2 | 8 | "Minenhle Ntanzi" |

- Photo frame: radius 16, shadow `rgba(50, 47, 44, 0.12) 0px 6px 16px 0px`, no border,
  background `rgb(244, 244, 245)`, padding 0, example 172 x 305, count 8.
- Card wrapper: radius 16, no shadow, transparent background, example 172 x 329, count 8. The 24px
  difference between wrapper and frame is the meta row under the photo (derived: 329 minus 305).
- Imagery: 8 images, 418 753 px2, 52 344 px2 each. This is the largest per-image footprint on the
  screen (the salon card photo is 42 560 px2).
- Text elements 25, of which 17 are weight >= 600.
- The 16-count 600 role is 8 look names plus 8 prices: both are 12 / 600 / `rgb(10,10,10)` /
  line-height 16.2, so they collapse into one measured role despite sitting in different places
  (one on the photo, one under it).
- Non-card share of the band, derived: 439 minus the 329 card wrapper leaves 110px for the heading and
  the frame padding.
- Box-to-box gaps: 16px above (band 08 ends 2406) and 16px below (this band ends 2861, band 10 starts
  2877).

## Tokens

- Frame: `rounded-[16px]`, `bg-s-bg-sunken`, `shadow-elevation-3` = `0 6px 16px rgba(50,47,44,0.12)`
  (`tailwind.config.js:280`). All three measured exactly.
- Name pill: solid `#FFFFFF` with `0 1px 3px rgba(10,10,10,0.10)`, capped at `max-w-[80%]`, radius
  full. Deliberately opaque rather than frosted: the component records that copying Entdecken's
  `backdrop-filter: blur(14px) saturate(1.1)` made the name fail to paint at all, leaving an empty
  white pill, and that removing the backdrop-filter in the live DOM brought every name back.
- Card footprint `w-[44vw] max-w-[200px]`, which renders 172 at 390 wide (measured) and 200 above 455.

## Interaction

- Tap a card: an absolute overlay link fills the frame (`inset-0 z-[1] rounded-[16px]`), carrying an
  aria-label of the look title plus its from-price.
- Tap the heart: `HeartButton` with a `lookId`, at `z-[2]` so it sits above the overlay link.
- The rail scrolls horizontally with the negative-margin bleed matched to `SectionFrame`'s padding.

## Intentional deviations

- Name ON the photo rather than under it. `CORPUS.md` section 1 row 5 records text-below as the
  dominant provider-card anatomy (16 of 19), but that row is about provider cards; this is a look tile,
  and the owner picked variant B by name on 2026-08-16. The cost is recorded in the component: one line
  at 12px capped at 80% of the card, so a long style name truncates where two 14px lines below the
  photo would not have.
- The 9:16 frame is the one portrait ratio on the screen. Every other photo here is 5/4 landscape.

## Empty state

`usePopularLooks` drives a skeleton first: 4 tiles of `aspect-[9/16]` at radius 16 with
`shadow-elevation-3`, plus a 12px / 40% width line, so the loading shape matches the final layout
rather than showing a spinner. A look with no resolvable price is dropped rather than shown priceless.

## Provenance

- I5 (2026-08-01): real seeded discovery tiles with a real starting price, placed after the rails and
  before Walk-in, matching `public/_mockups/home-v3/search-a.html`.
- Owner round 2026-08-16 (`public/_mockups/looks-round2/section.html`, variant B): the 4-across square
  grid becomes a 9:16 rail, the black gradient over the photo becomes a real shadow behind the frame,
  the name moves into the pill on the photo.
- 2026-08-16: `Entdecken` was unmounted because it and this rail rendered the same 8 look ids from one
  `/api/discovery/feed?category=hair` query.

## Against the floors

- **Display anchor >= 28px: FAIL.** Largest text 18px.
- **Anchor at least 1.8x body: FAIL at 1.5x** (18 / 12). This band carries only two sizes, 18 and 12,
  so the ratio is the same 1.5 either way you read "body".
- **At most ~30% of text at weight >= 600: FAIL at 68.00%** (17 of 25), the second worst band on the
  screen after 10. The cause is structural: the card has three text leaves and two of them are 600.
- **At most 4 sizes and 2 weights: PASS within this band** (2 sizes, 2 weights). It is the only content
  band that spends just two sizes.
- **Imagery: the strongest band on the screen.** 8 photos at 52 344 px2 each, and the photo is 305 of
  the card's 329 measured height (92.7%, derived).
- **One overlay badge ceiling: PASS.** One white name pill and one heart, no second badge.
- **Locked radius: PASS.** 16 = `rounded-card`.
- **Locked shadow: PASS against the elevation table.** `elevation-3` is a named token and this is a
  photo-led tile, not a SalonCard, so the `whisper` row does not bind here.
- **Edge visibility (FLOORS LAW 4): PASS by route (b).** Flush photo edge, no border, elevation-3 behind.
- **Copy economy rule 2 (long text truncates with a read-more): not applicable, and the trade is named
  above.** The name truncates in the pill with no expand affordance, which is what variant B bought.
