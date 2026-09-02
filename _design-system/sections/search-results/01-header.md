# Global Header (search-results band 0) , section spec

**Reference:** `_design-system/sections/_measured/search-results.json`, band index 0, measured at 390x844 against the running dev server (`http://localhost:3457/de/basel/coiffeur`, HTTP 200, `settled: true`). No screenshot reference exists for this route; the salon-detail specs cite Fresha stills because that route was built from them, and this one was not.
**Component:** `app/[locale]/_components/layout/Header.tsx`
**Layer:** 1 (chrome, navigation)

## Layout

```
y 0    ┌──────────────────────────────────────────────┐  390 x 84, transparent
       │  py-5 (20px)                                 │
       │  [ (44) Home ]        (flex spacer)   [ ☰ ]  │  one 44px tile each side
       │  py-5 (20px)                                 │
y 84   └──────────────────────────────────────────────┘
```

## Measured

Every number below is read from band 0 of `_measured/search-results.json`.

| what | measured |
|---|---|
| box | top 0, left 0, width 390, height 84 |
| surface background | `rgba(0, 0, 0, 0)` |
| padding | `20px 0px` |
| border radius | `0px` |
| distinct text roles | **0** |
| card entries | **0** |
| images | 0, area 0 px |
| className recorded | `sticky top-0 left-0 right-0 z-50 transition-all duration-300 ease-glide py-5 bg-transparent` |

**Why an 84px band holds zero text and zero images, traced in source rather than guessed.** On this route `Header.tsx:407` derives `categorySegment` from `/^\/[a-z]{2}\/([^/?#]+)\/?$/`, which accepts one segment after the locale. `/de/basel/coiffeur` has two, so `categorySegment` is null, `isHome` and `isDiscover` are false, and `showCategoryChrome` (line 446) is false. That leaves the utility row rendered on mobile, and the `py-5` in the measured className is the same branch's output (line 626), so the measurement and the source agree on which branch ran. `isTopLevel` (line 378) returns true for a two-part `city/category` path by its own explicit clause, so the far-left slot is the **Home tile** (line 745), not the wordmark and not a back arrow. Home tile, flex spacer (line 843, because `categorySegment` is null so `MobileCityChip` does not render) and hamburger are all icons, and the walker in `scripts/measure-sections.mjs` skips SVG namespaces, which is why `textRoles` is empty. The tiles are 44x44, under the card walker's own 60px minimum width, which is why `cards` is empty too.

## Tokens

- Band background at rest: transparent (`bg-transparent`), measured `rgba(0, 0, 0, 0)`
- Home tile and hamburger: `h-11 w-11` `rounded-full` `shadow-elevation-2` (`0 2px 8px rgba(50,47,44,0.09)`), `bg-white`, `text-s-ink`. Shadow and no border, which is the design-contract rule that a card carrying elevation drops its border.
- Icon glyphs: lucide `Home` and `Menu`, size 22, strokeWidth 2.2

## Interaction

- Home tile: `Link` to `/{locale}`
- Hamburger: toggles `menuOpen`, opens `MobileMenu`
- Band is `sticky top-0 z-50`. `SearchTemplate`'s own search band is `z-[55]`, so on scroll the search band passes over this one rather than under it (Header.tsx:654 states this as the intent).

## Intentional deviations

- No back arrow on this route, by rule rather than by omission: `isTopLevel` names `city/category` browse as top level, so the slot carries Home. Item S3 of `_plans/DESIGN_CONSISTENCY_2026-08-27.md` measured "none at all on a category page"; what is absent is the BACK arrow, and a Home tile is present in its place.
- No wordmark on mobile here. The wordmark branch is gated on `isHome`.

## Empty state

None. The band renders the same two controls on every load of this route.

## Against the floors

This band is inside the first viewport, so it counts toward the six whole-screen floors, and it contributes nothing to five of them: 0 text elements, 0 images, no heading.

- **F2 imagery 41.03% PASS** (screen-level): this band contributes 0 px of the imagery area.
- **F6 display anchor 18px FAIL against 28**: this band contributes no text at all, so it neither carries the anchor nor could. The anchor is owned by `03-top-category-rail.md`.
- **F7a bold share 28.57% PASS against the 30% ceiling**: 0 elements contributed.
- **F7b anchor ratio 1.5x FAIL against 1.8**: same as F6, owned by section 03.
- **F7c four distinct sizes PASS**: 0 contributed.
- **ELEVATION five levels PASS against a floor of 2**: the two 44px tiles carry `shadow-elevation-2`. That value is one of the levels counted, and it is also the SalonCard photo shadow measured in bands 2 and 4, so it is one distinct value shared, not two.

Against the owner's target ladder (the salon page's): that page carries its screen anchor in its own title block. This band carries no text, which is a difference in kind rather than degree and is not a defect of this band.

## Provenance

- `Header.tsx:378` isTopLevel, with the explicit two-part `city/category` clause
- `Header.tsx:446` showCategoryChrome, and the `py-5` branch at line 626 that the measurement confirms
- LOCKFILE NAV CONTROLS (2026-08-10), quoted in the file at line 757: elevation-2 and no border, because whisper was too faint to be the only edge on white
- V3-D421h / V3-D421k / V3-D421L , the far-left tile, its rounding and its flatness
- V3-D461 , deep page renders BACK; not reached on this route
