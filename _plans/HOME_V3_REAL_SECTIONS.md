# HOME V3 , rebuild the mockup out of the REAL home page's sections

Owner message 2026-07-31 (dictated, plus 4 annotated screenshots and 8 selected elements).
Standing order still in force: **mockups only, nothing lands in a .tsx yet.**

## Atomic asks

- [x] **1. Continue-search card: align its width to the search bar.** verified: both render 16 -> 374 on the home state at 390x844 (753edfb60).
  - [x] 1a. Measured the gap: search pill spans 16 -> 374 (w 358); the card spans 28 -> 362 (w 334). 12px out on each side, which is what his red marks point at. verified: getBoundingClientRect on .sa-pill and .sa-cont, home state, 390x844.
  - [x] 1b. Root cause: `#sa-list` carried `padding: 12px 28px 32px` while the band uses 16. Set the list gutter to 16 so every section shares the search bar's edges. verified: search-a.html:409 `padding: 12px 16px 32px`.
- [x] **2. Continue-card image square (he said "four by four" = 1:1).** Was 150x120 (5:4). verified: search-a.html:520 `width: 120px; aspect-ratio: 1 / 1`, renders 120x120.
- [x] **3. Delete the mockup's own "Walk in today" rail completely.** verified: 0 render sites left; the only remaining match in search-a.html is the comment at :1074 explaining the deletion.
  - [x] 3a. Graveyard line filed, since this is an owner deletion. verified: _design-system/REMOVED.md:108.
- [x] **4. Replace it with the REAL walk-in section** verified: search-a.html `walkInBand()` renders .sa-witile/.sa-wititle/.sa-widot/.sa-wicard/.sa-wiall; measured live at 157x128 per card (commit 753edfb60). (`WalkInBand`): 52px sunken icon tile, 18/700 title, subline, green Live dot, 42%-width bordered cards with the green `70-98 Min` figure, `bis frei`, name + star + blue count, address, `N vor dir`, then the `Alle Walk-ins` button.
- [x] **5. Add the real Reviews section** (`Bewertungen`): 260px cards, min-height 220, initials avatar, name, salon chip, date, 5 stars, quoted text. Real seeded reviews.
- [x] **6. Add the real Inspo section** verified: 6 self-hosted thumbnails under public/_mockups/_assets/inspo/, 0 broken images measured across all categories (commit 753edfb60). (`Finde deine Inspiration.`): 9:16 photo cards, gradient scrim, title chip, author, `ab CHF n`. Real thumbnails, self-hosted.
- [x] **7. Every section rebuilt in the real `SectionFrame` format**: h2 at `clamp(18px,2vw,20px)` 600 with the arrow link, rail `gap-3` with `-mx` bleed so the next card crops.
- [x] **8. "Top in Zurich" and one section per city.** Delivered as option (b), the format with an honest empty state, because (a) needs data that does not exist. The layout is judgable now; which of (a)/(b)/(c) ships is his call, named in the closing report. Evidence below.
- [x] **9. "Available this week" section.** Built from real `available_*` seeded data, honest sub-state when thin.
- [x] **10. Anything else worth adding.** Proposed and built, listed in the closing report so he can cut any of it.

## The one blocked ask, with its concrete dependency

**Ask 8 cannot be built truthfully.** Measured this turn:

- `cities` holds 7 rows: Basel, Zurich, Bern, Luzern, Geneve, Lausanne, Neuchatel.
- **Exactly one is `is_active: true`: Basel.**
- All 28 salon rows have `city_id: null` and every address string ends in Basel. The 20 usable ones are Basel.

So a "Top in Zurich" rail has nothing to put in it. Rendering one means inventing salons, which the no-fabrication rule forbids by name.

**What unblocks it, pick one:**
- (a) seed real Zurich salons, then the section builds itself from data, or
- (b) I render the city rail with the honest empty state (`Zurich, noch keine Salons`) so he can see the FORMAT now, or
- (c) drop city sections until a second city launches.

Built (b) so the layout is judgable, and flagged it. Not silently skipped.

## Unparsed

One phrase in the dictation did not resolve: *"McRind two zero zero equal turn, all of that"*. Not guessed at. Needs one line from him.

## Verified on the rendered page, 390x844, home state

| check | result |
|---|---|
| continue card vs search bar | both 16 -> 374. Exact match, was 28 -> 362 |
| continue card photo | 120x120, ratio 1.000 |
| distinct font sizes, first viewport | 4 (12/14/16/18), ceiling is 4 |
| weight >= 600 share | 5.4%, ceiling is 30% |
| broken images | 0 |
| every rail's first card | left 16, same as its heading |
| sections | 9: continue, Top auf Solen, In der Nähe, Diese Woche verfügbar, Coiffeure in Basel, Walk-in, Inspiration, Bewertungen, Städte |

Anatomy copied off the running app at vw=405, not from source:
salon card 231x226 with a 5:4 photo at radius 22 (real 241x257) · walk-in card 157x128
(real 163x112) · review card 260x200 (real 260, min-h 220) · inspo card 172x327 (real 178x317).

## Bugs found and fixed while building

1. **A second `svgStar` hoisted over the existing one.** I declared `svgStar(px)` while a no-arg
   `svgStar()` already existed. Every pre-existing call site then emitted `width="undefined"`, and
   an SVG with no width falls back to 300x150, which blew each salon card from 226px to 512px
   tall. Renamed mine to `svgStarSized`.
2. **The padding SHORTHAND killed the rail bleed.** All three rails used `padding: 0 0 4px`, which
   resets padding-left/right to 0, so the first card sat at the screen edge while its heading
   stayed at 16. Now axis-specific.
3. **`scroll-padding-left` was missing.** A `scroll-snap-align: start` card snaps flush to the
   CONTAINER edge, 16px left of the gutter, so the browser auto-scrolled each rail by exactly 16 on
   load. The real app has `scroll-pl-3`; I had left it off.
4. **The walk-in star inherited the grey rating colour** through `currentColor`. Taste rule 4 is
   explicit that a semantic element keeps its hue, so it is pinned to #FFC32B.
5. **Reviewer name and salon rendered on one line** ("Luca MCuts & Culture") as inline spans.
