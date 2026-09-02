# Sticky search band (the search pill) , section spec

**Reference:** `_design-system/sections/_measured/search-results.json`. This band has **no band index of its own**: it is a `motion.div`, not a landmark tag, and it holds no `h1`/`h2`/`h3` child, so it fails both tests the walker in `scripts/measure-sections.mjs` uses to promote a node to a section. Its numbers come from inside band 1 (`main`): the card entry `358x54` and the text role sampled `"Coiffeur"`.
**Component:** `app/[locale]/_components/search/SearchTemplate.tsx:1306-1360` (the band), `:1316-1360` (the pill itself)
**Layer:** 1 (chrome, the way in)

## Layout

```
        ┌────────────────────────────────────────┐
        │ band padding-top 4                     │
        │  ╭──────────────────────────────────╮  │  358 x 54, radius 40
        │  │  (12) Coiffeur                   │  │  white, hairline, elevation-3
        │  ╰──────────────────────────────────╯  │  centred label, 19px side padding
        │ band padding-bottom 8                  │
        └────────────────────────────────────────┘
```

Wrapper is `mx-auto w-full max-w-[680px] px-4`, so at a 390 viewport the pill is 390 minus 32, which is the measured 358.

## Measured

| what | measured | source in the JSON |
|---|---|---|
| pill width | 358 | band 1 `cards[1].exampleSize` |
| pill height | 54 | band 1 `cards[1].exampleSize` |
| radius | 40px | band 1 `cards[1].radiusPx` |
| shadow | `rgba(50, 47, 44, 0.12) 0px 6px 16px` (= `shadow-elevation-3`) | band 1 `cards[1].boxShadow` |
| border | `1px solid rgb(228, 228, 231)` (= `s-border` `#E4E4E7`) | band 1 `cards[1].border` |
| background | `rgb(255, 255, 255)` | band 1 `cards[1].background` |
| padding | `0px 19px` | band 1 `cards[1].padding` |
| count on the screen | 1 | band 1 `cards[1].count` |
| label | 14px / weight 500 / Inter / `rgb(10, 10, 10)` / line-height 21 / letter-spacing normal / count 1 / sample `"Coiffeur"` | band 1 `textRoles[3]` |
| pill y (top) | **not measured** | see Chrome position |

## Chrome position

Recorded for item S2 of `_plans/DESIGN_CONSISTENCY_2026-08-27.md` ("the search bar moves to other places, that should be a permanent spot"). Nothing here is changed; this is the number S2 asked for.

| axis | value | how it is known |
|---|---|---|
| **height** | **54** | measured, band 1 `cards[1].exampleSize` |
| **width** | **358** | measured, band 1 `cards[1].exampleSize` |
| **y at rest** | **not directly measured**, and the JSON records no box for this element. It sits inside the 82px window between the measured header bottom (band 0, top 0 + height 84) and the measured top of the first rail (band 2, top 166). |

**The derivation that closes that window exactly, kept separate from the measurement.** Header height 84 is measured. `bandPaddingTop` is `useTransform(scrollProgress, [0, 1], [4, 12])` (SearchTemplate.tsx:906), so 4 at rest. Pill height 54 is measured. `bandPaddingBottom` is `[8, 8]` (line 910), constant. The results wrapper is `px-3 pb-12 pt-4` (line 1656), so 16. That gives 84 + 4 = **88** as the pill top, 88 + 54 = 142 as its bottom, 142 + 8 + 16 = **166**, which is exactly the measured top of band 2. Every constant in that chain is read from source and the chain terminates on a measured number, so y = 88 at rest is derived, not eyeballed. It is still labelled derived rather than measured, because a re-run of `scripts/measure-sections.mjs` that captured this element's own box is what would make it measured.

For the cross-screen comparison S2 needs, the same pill was measured live at 402 wide on 2026-08-27 (plan section 1(c)): `/de` y 13 h 62 w 368, the four single-segment category routes y 4 h 54 w 370, `/de/inspo` y 19 h 62 w 316. This route reads **h 54, w 358, y derived 88** at 390 wide. The height matches the single-segment category routes and the y does not, because on this route `Header.tsx`'s `showCategoryChrome` is false (see `01-header.md`), so the header row above the pill is not hidden on mobile and the pill starts below its full 84px rather than at the top of the viewport.

## What this screen requires of the pill, and the call nobody has made (FLOORS LAW 8)

FLOORS LAW 8 says an entity appearing on more than one screen renders through the same component with the same anatomy, and that a genuine density difference is a documented VARIANT, never a second implementation. This pill passes the first half and fails the second. It is one component, `SearchTemplate.tsx:1316-1360`, so there is no second implementation to find. Its vertical position varies by route family, and nothing anywhere documents that variance as a variant.

**The four measured positions, all 2026-08-27.** The first three at 402 wide from the live sweep in `_plans/DESIGN_CONSISTENCY_2026-08-27.md` section 1(c); the last at 390 wide from `_measured/search-results.json` plus the derivation above.

| route family | y | height | width | viewport |
|---|---|---|---|---|
| `/de` | 13 | 62 | 368 | 402 |
| `/de/coiffeur`, `/de/barbershop`, `/de/nails`, `/de/spa` | 4 | 54 | 370 | 402 |
| `/de/inspo` | 19 | 62 | 316 | 402 |
| `/de/basel/coiffeur` (this screen) | 88, derived | 54 | 358 | 390 |

**Width is not one of the divergences, and reading that table without normalising says it is.** The band is `mx-auto w-full max-w-[680px] px-4`, so the pill's width is the viewport minus 32 until the 680px cap bites. At 402 that is 370, which is the single-segment category routes' measured width to the pixel. This screen's 358 is a 390 viewport, not a narrower pill. What are real width differences: `/de` at 368 and `/de/inspo` at 316, since 402 minus 32 is 370 and neither matches.

**What survives normalising is two heights and four tops.** Heights: 54 on both category families, 62 on `/de` and `/de/inspo`. Tops: 4, 13, 19 and 88.

**What this screen's spec requires of the pill, in numbers.** Every value measured or derived on this route, none invented here:

- height **54**, radius **40**, side padding **19**, fill white, hairline `#E4E4E7`, lift `shadow-elevation-3`, icon lucide `Search` at size 12 strokeWidth 2.4, label 14px / weight 500 / `#0A0A0A`, width = viewport minus 32 up to a 680 cap
- sticky for the whole list (`max-md:sticky max-md:top-0 max-md:z-[55]`), and the same height scrolled as at rest (V3-D421d); only the band's own padding morphs, 4 to 12
- top at rest **88**, and that number is a consequence rather than a choice. The header above it occupies its full measured 84 because `Header.tsx:446` computes `showCategoryChrome` false on a two-segment path. On `/de/coiffeur` the same gate is true, the header chrome is suppressed, and the identical pill starts at 4.

**The anatomy is settled and the vertical position is not.** Nothing in `_design-system/LOCKFILE.md`, nothing in `TASTE_LOG.md`, and none of the dated owner decisions under Provenance names a y for this pill; every one of them fixes its height, radius, padding, fill and contents. `_plans/DESIGN_CONSISTENCY_2026-08-27.md` item S2 states the requirement, "the search bar moves to other places, that should be a permanent spot", and does not pick the spot.

**Which of 4, 13, 19 and 88 becomes the permanent one is an owner call, and it has not been made.** It is his rather than this spec's for a concrete reason: those four values are not four bugs, they are four different amounts of chrome sitting above the pill, so collapsing them means deciding, on each of those screens, whether the chrome above the pill or the pill's own position is the thing that gives way. On this route specifically, moving the pill to y 4 means suppressing the header row that currently carries the only mobile-menu trigger left on the screen (see the Intentional deviations below). This file records the numbers and picks nothing.

**A second element of exactly this shape, found while measuring this one.** `CategoryPillRow` is mobile-only (`md:hidden`, `CategoryPillRow.tsx:183`) and self-gates on the same `showCategoryChrome` derivation (`:130`, returning null at `:171`). On `/de/coiffeur` it renders directly beneath the pill; on this route it returns null, which is why no category-pill text appears anywhere in this screen's measurement. Same entity, neighbouring routes, present on one and absent on the other, and undocumented as a variant in the same way the pill's y is.

## Tokens

- Fill `bg-white`, hairline `border-s-border` `#E4E4E7`, lift `shadow-elevation-3` `0 6px 16px rgba(50,47,44,0.12)`
- Radius `rounded-[40px]`, height `h-[54px]`, side padding `px-[19px]`
- Icon: lucide `Search`, size 12, strokeWidth 2.4, `text-s-ink`
- Label: `font-body text-[14px] font-medium text-s-ink`, measured weight 500

## Interaction

- Click or Enter or Space on the pill: `openSearchOverlay(false)`. `role="button"`, `tabIndex={0}`, `aria-haspopup="dialog"`, `aria-label` from `ui.searchChrome.editSearch`.
- The label composes `[category label, query].filter(Boolean).join(" ")` and falls back to the `searchPlaceholder` string. On this route the query is empty and the category is set, so it reads the single word `"Coiffeur"`, which is what the measurement sampled.
- The inline city span is `w-0 overflow-hidden opacity-0` by V3-D421d, so the city never appears in the pill on mobile. `visible()` in the measure script rejects `opacity: 0`, so this span correctly produced no text role.
- The trailing map control is `hidden md:grid`, so nothing renders in the pill's right slot at 390.
- Band is `max-md:sticky max-md:top-0 max-md:z-[55]`. Height does not change on scroll (V3-D421d, "keep the pinned bar the SAME size as normal"); only the band's own padding morphs from 4 to 12.

## Intentional deviations

- The trailing hamburger was removed from this pill on 2026-08-10. **Where its job went is not what this file said, and not what the source comment says either. Corrected 2026-08-27.** `SearchTemplate.tsx:1383` states the job "moved to BottomNav.tsx, whose fourth item fires the identical `solen:open-menu` event, so MobileMenu keeps its one trigger contract", and `HomeSearchPill.tsx:293` repeats it. `BottomNav.tsx` contains no `dispatchEvent` and no `CustomEvent` of any kind, and grepping `solen:open-menu` across `app/`, `components/`, `components-legacy/` and `lib/` returns exactly four hits: those two comments and the listener pair at `Header.tsx:546-547`. The bottom nav's fourth item is a plain `Link` to `/{locale}/profile`, or `/{locale}/auth/login` when logged out (`BottomNav.tsx:276`). So the event the moved job was supposed to travel on is dispatched by nobody, and on this route the mobile menu has exactly one trigger left, the header hamburger in `01-header.md`. That makes the header hamburger load-bearing rather than redundant, which is the opposite of what this line implied. See `05-bottom-nav.md`.
- `shadow-elevation-3` here is constant, replacing the V3-D421L scroll-driven shadow, per the approved chrome I2 note in the file.

## Not rendered on this route, and it is the cause of two failing floors

`app/[locale]/[city]/[category]/page.tsx:211` passes `hero={{ title: "Coiffeur in Basel", subtitle: ... }}` and `breadcrumb={[...]}` into `SearchTemplate`. `SearchTemplate.tsx:429-430` destructures both. Grepping the whole 2546-line file for `hero` returns the prop type (line 139), the destructure (line 430) and three comments; grepping for `breadcrumb` returns the prop type (line 137) and the destructure (line 429). **Neither prop has a render site.** So the page's own title and its breadcrumb chain are computed per locale, interpolated with the real city and category name, passed down, and drawn nowhere. That is the "decoration" shape named in the project CLAUDE.md: pieces that exist, connected to nothing.

Stated without softening and with no fix proposed here: this is why the screen has no headline, and the missing headline is what fails F6 and F7b. The floor failure is booked against `03-top-category-rail.md`, because section 03's `h2` is the largest text that actually renders.

## Empty state

The pill renders identically with no results; it is chrome, not content. It has no empty variant.

## Against the floors

- **F2 imagery 41.03% PASS**: contributes 0 px.
- **F6 display anchor 18px FAIL against 28**: this band's largest text is the 14px label, so it is not the anchor. The prop that would have carried a title is not rendered (above).
- **F7a bold share 28.57% PASS against 30%**: the label is weight 500, which is below the 600 threshold, so it counts in the denominator and not the numerator. This is the one place on the screen that already matches the owner's target ladder, where emphasis is carried at weight 500.
- **F7b anchor ratio 1.5x FAIL against 1.8**: 18 / 12. This band contributes the 14px label to neither term.
- **F7c four distinct sizes PASS**: contributes 14px, which the SalonCard name also uses, so no extra size.
- **ELEVATION five levels PASS against a floor of 2**: this pill contributes `elevation-3`, one of the five.

Against the owner's target ladder (`/de/salon/cuts-and-culture`, measured 2026-08-27: anchor 30px over a 14px body, ratio 2.14x, 5 distinct sizes, weight-600 share 30%, 3 elevations, 34.66% photographic): this band's 14px label is the ladder's body size exactly, and its weight 500 is how the ladder carries emphasis. It is the only element on this screen sitting ON the ladder rather than below it. It contributes nothing to the anchor, which is the axis this screen fails, and a 14px label is not a candidate to become one.

## Provenance

- V3-D376 , the sticky band is a direct child of the page root so the pill stays pinned for the whole list
- V3-D421d , the pinned bar keeps its resting size, and the city stays off line 1
- Variant C, owner pick 2026-08-10 off `/dev/search-bar`: 54 tall, radius 40, 19px padding, 12px icon, hairline plus lift instead of a black ring
- I2 (`public/_mockups/home-v3/search-a.html` `.sa-pill --lift`) , constant elevation, second line deleted
- Owner 2026-08-10, the hamburger leaves this slot
