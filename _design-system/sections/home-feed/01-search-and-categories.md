<!-- exists-check: net-new vs _design-system/sections/home-feed/CORPUS.md (read in full first; it is the
     cross-app "what other apps do" half of this screen's research and is EXTENDED here, never edited or
     replaced), scripts/measure-sections.mjs (the instrument that produced every number below, read in
     full), lib/search-filter-pills.ts (search-RESULTS filter pill data, not the home category row),
     _docs/category-system-map.md (taxonomy map, no geometry), _plans/MOBILE_DESIGN_SYSTEM.md +
     _plans/DESIGN_SYSTEM_HARDENING.md + _plans/DESIGN_PRINCIPLE_RESEARCH.md (roadmaps and research, no
     per-section spec) and app/api/homepage-sections/route.ts (an admin toggle API whose section keys
     page.tsx never reads). The structure this follows is _design-system/sections/salon-detail/. -->

# Search pill + category pills: section spec

**Reference:** `_design-system/sections/_measured/home-feed.json` (no band of its own, see Measured) · `CORPUS.md` section 1 rows 1 and 2 (search field in the top zone: 29 of 34; category shortcut strip: 24 of 34)
**Component:** `app/[locale]/_components/homepage/HomeSearchPill.tsx` + `app/[locale]/_components/layout/CategoryPillRow.tsx`, both mounted from `app/[locale]/page.tsx:255-262`
**Layer:** 1 (chrome)

## Layout

```
top of <main>, measured top 0
+--------------------------------------------------+
|   [ (o)  Suchen                              ]   |   pill 358 x 64, radius 40
|                                                  |   sticky top-0, z-55, md:hidden
|  (All) (Coiffeur) (Barber) (Nails) (Spa) (Inspo) |   6 pills, h 40, radius 40
+--------------------------------------------------+
top of section 02, measured top 164
```

The search pill is `sticky top-0`; the pill row below it is in normal flow and never pins
(`page.tsx:258-262`). Hero renders nothing at this width: its mobile block is `max-md:hidden`.

## Measured

Every number below is read off `home-feed.json` unless it is marked derived.

- **This band has no box of its own.** `extractSections` keeps a node only when it is a landmark
  tag or carries a direct-child heading (`scripts/measure-sections.mjs`). The sticky wrapper is a
  plain `div` with no heading, so it produced no entry in `sections[]`. Its contents are visible in
  the `main` aggregate (`sections[0]`) only.
- **Vertical extent, derived:** `main` box top 0, section 02 box top 164, so this band plus the
  FeedZone and Section top padding under it occupies 164px. The split between the two controls and
  that padding is **not measured**.
- Search pill: 358 x 64, radius 40, background white, border 1px `rgb(228, 228, 231)`,
  shadow `rgba(0, 0, 0, 0.1) 0px 6px 20px 0px`, count 1.
- Search pill label "Suchen": 14px / 500 / Inter / `rgb(10, 10, 10)` / line-height 21, count 1.
- Category pill: radius 40, no shadow, transparent background, padding `0px 14px`, example 76 x 40, count 6.
- Category pill fill layer: radius 40, background white, count 5, example 113 x 40, with the seven-part
  inset shadow recorded verbatim in the JSON. The sixth pill ("All", selected) carries the sunken fill
  instead; its entry falls outside the top-8 card list the extractor keeps, so it is **not measured**.
- Category pill label: 14px / 400 / Inter / `rgb(10, 10, 10)` / line-height 14, count 6, sample "All".
- Imagery: 3 images at 784 px2 each (28 x 28), derived as `main` 40 images / 1 573 418 px2 minus the
  ten content bands' 37 images / 1 571 066 px2. Five of the six pills carry an `iconSrc`
  (`CategoryPillRow.tsx:94-100`); the JSON does not say why only 3 registered and I did not re-render
  to find out.
- Text elements contributed to the page total: 7 (1 search label + 6 pill labels), derived as
  `main` 298 minus the 291 counted across the ten content bands.

## Tokens

- Pill border: `s-border` `#E4E4E7`, measured `rgb(228, 228, 231)`.
- Pill fill / label ink: `s-bg-surface` `#FFFFFF` and `s-ink` `#0A0A0A`, measured `rgb(10, 10, 10)`.
- Selected pill fill: `s-bg-sunken` `#F4F4F5` per `CategoryPillRow.tsx:288`. Not in the measured card list.
- Radius 40 on both controls. The locked radius ladder (design contract) has no 40 rung; the pill rung
  is `9999`. Both controls reach a visually identical result at 40 on a 40px and a 64px box.

## Interaction

- Tap the search pill: opens the shared `SearchOverlay` in place. The URL changes only when the
  overlay's own submit runs (`HomeSearchPill.tsx` header comment, lines 42-50).
- Tap a category pill: navigates to `/{locale}/{route}`; "All" points at the home route.
- Selected state changes fill only. Weight stays 400 on select (`CategoryPillRow.tsx:249-257`), which
  is why the measurement shows a single 14px / 400 role for all six labels rather than one at 600.

## Intentional deviations

- `CORPUS.md` section 6 records the search entry as `SearchBar.tsx` inside `Hero.tsx`. At 390 wide that
  is no longer what renders: `HomeSearchPill` is the mobile search entry and Hero's mobile block is
  empty. That corpus line is from the 2026-07-29 sweep and is stale on this point.
- The corpus finds the segmented multi-field bar in both booking-marketplace web feeds (section 2 row 1).
  Mobile collapses that to one pill, which is what Airbnb iOS does in the same corpus.

## Empty state

None. Both controls render from static lists and have no data dependency.

## Provenance

- FIX B (2026-08-01): the sticky wrapper is a sibling before the page's root div, because that div's
  `overflow-hidden` was the containing block that stopped the pill pinning (`page.tsx:235-254`).
- A2 (owner 2026-08-05): the wrapper's `border-b border-s-border` was removed; the pill's own hairline
  plus shadow is what the screen keeps as the pinned-chrome boundary.
- Owner 2026-08-10 and 2026-08-12: pill padding back to `px-4`, one height at 64.

## Against the floors

Graded against the FLOORS LAW block and the design-contract table in `CLAUDE.md`.

- **Display anchor >= 28px: FAIL, and this band is one of the two reasons the first viewport has none.**
  Its largest text is 14px. It occupies the top 164px of the screen and contributes no anchor at all.
- **Anchor at least 1.8x body: not applicable here.** This band carries one size (14px).
- **At most ~30% of text at weight >= 600: PASS for this band.** 0 of its 7 text elements are >= 600
  (the search label is 500, the pill labels are 400).
- **At most 4 sizes and 2 weights per screen: this band spends 1 size (14) and 2 weights (400, 500).**
  The 500 is one of the four weights the screen carries against a ceiling of 2.
- **Imagery >= 33%: FAIL, and this band is the largest single reason for the first viewport.** 164px of
  the 844px first viewport is this band, and it carries 2 352 px2 of imagery in total, which is
  0.7% of its own 390 x 164 area. `CORPUS.md` section 8 row 1 is unambiguous that the fix is not a hero
  image (0 of 34 home feeds carry one); it is pulling real card rows up.
- **Locked radius / shadow / hairline: hairline PASSES** (`#E4E4E7` measured exactly). Radius 40 is off
  the locked ladder on both controls. The search pill's `0px 6px 20px rgba(0,0,0,0.1)` is not one of the
  named shadow tokens in `tailwind.config.js`; it is the measured Airbnb value recorded in the component.
