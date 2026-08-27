# Back tile and the "Gespeichert" title

**Reference:** `_measured/saved-looks.json`, the single text role in band 0. The header row has no
band of its own; see Measured.
**Component:** `app/[locale]/inspo/saved/page.tsx:65-74`, hand-written in the page file.
**Layer:** 1 chrome, and it is this screen's own chrome rather than the global bar. The global
`Header` does not render on this route.

## Layout

```
   0 +--------------------------------------------------+
     |  pt-4                                            |
  16 |  (<-)  Gespeichert                               |   tile 40x40, title 22/700
  56 |  pb-3                                            |
  68 +--------------------------------------------------+
     |  px-1.5   [ grid or skeleton or empty state ]    |
```

`flex items-center gap-3 px-4 pb-3 pt-4`. Two elements, no third. There is no count, no filter, no
sort and no overflow menu.

## Measured

**No band of its own.** The row is a `div` with an `h1` as a direct child, so the walker did promote
it as a candidate, and then dropped it: a candidate contained in another candidate with identical
`innerText` is discarded in favour of the outer one, and in this capture `main.innerText` is exactly
"Gespeichert" because the skeleton below carries no text. See this folder's README.

The one measured role, from band 0:

| size | weight | family | colour | line-height | letter-spacing | count | sample |
|---|---|---|---|---|---|---|---|
| 22 | 700 | Inter Tight | `rgb(10, 10, 10)` | 33 | -0.44px | 1 | "Gespeichert" |

The row's box is **derived, not measured**: `pt-4` + a 40px tile + `pb-3` gives 16 + 40 + 12 = 68px
tall, full width at 390, contents inset 16px by `px-4`.

Source literals, verified for this file:

| element | literal | line |
|---|---|---|
| back tile | `grid h-10 w-10 place-items-center rounded-full border border-s-border text-s-ink transition-transform duration-150 active:scale-95` | 69 |
| back glyph | `ArrowLeft size={18} strokeWidth={1.9}` | 71 |
| title | `font-heading text-[22px] font-bold tracking-[-0.02em] text-s-ink` | 73 |

`tracking-[-0.02em]` at 22px is -0.44px, which is exactly the measured letter-spacing, so the source
and the render agree.

## Tokens

- Title `s-ink` `#0A0A0A`, measured `rgb(10, 10, 10)`
- Tile hairline `border-s-border` `#E4E4E7`, the single divider token
- No fill on the tile, no shadow, which is the flat treatment the elevation table asks for on a calm
  control on white

## Interaction

- Back tile: `router.push('/{locale}/inspo')`, a **fixed destination**, not history back. A customer
  who arrived from the bottom nav's heart, or from a shared link, is sent to the feed rather than
  back to where they were.
- The title is not a control.
- The row does not stick. It scrolls away with the grid, over a 2019px document.

## Intentional deviations

- **The title is a hardcoded German string**, not a translation key (`page.tsx:73`). On a four-locale
  product the English, French and Italian renders of this route all read "Gespeichert". Recorded, not
  fixed: `page.tsx` is a source file.
- **The back control is hand-drawn rather than composed.** The screen draws its own 40px circular
  tile instead of using the header's back affordance, which every other deep route inherits. FLOORS
  LAW 9 says if the registry owns it, compose it. The registry does not own a back tile today, so
  this is not a violation of the letter; item S3 of `_plans/DESIGN_CONSISTENCY_2026-08-27.md` is
  open on exactly this ("Back arrow becomes one rule. Standard is the 44x44 at (16,20) that seven
  pages already use"), and this tile is 40x40 at (16,16).
- **The global header is not merely hidden, it is removed by route.** `HideInBooking.tsx:54` returns
  null for `/inspo/saved` with no prop guard, so the header, the breadcrumb, the footer AND the
  bottom nav all disappear on this route. The comment at lines 51 to 54 gives the reason for the
  header (avoid a doubled back control) and does not mention the nav, which arrived three months
  later. See this folder's README.

## Empty state

Unchanged. The row renders identically over the grid, over the skeleton and over the empty state,
which is correct: it is the screen's only permanent furniture.

## Against the floors

- **Display anchor: FAIL.** 22px measured, against a >= 28px floor and a 30px ladder value. FLOORS
  LAW 6 excuses the anchor when the photograph is the focal, and populated this screen is nothing
  but photographs, so the excuse applies to the SCREEN. It does not apply to this band, which is the
  only text the screen has and which sits above the fold on its own.
- **Touch target: FAIL, source-read.** `h-10 w-10` is 40px against the design contract's 44px floor
  for interactive controls. The heart on each card is `h-11 w-11` and clears it, so the screen's
  most permanent control is its smallest one. WCAG 2.2 AA 2.5.8 asks for 24x24, which 40px clears,
  so this is a house floor and not a statutory one.
- **Contrast: PASS.** `#0A0A0A` on white is 19.3:1. The tile's hairline is decorative and the glyph
  is `s-ink`.
- **Type: 22/700 is on the locked scale**, and it is one of only two sizes the screen authors.

## Provenance

- Owner 2026-06-23, boards ditched, "the heart icon just saves, simple plain"
  (`_design-system/REMOVED.md` line 33), which is why this row has a title and nothing else
- V3-D414, `/inspo/board` and `/inspo/saved` are focused views and drop the marketing chrome
- `_design-system/sections/saved/05-saved-looks.md`, which read the same literals from source before
  any measurement existed; this file re-verified each line and adds the measured 22/700 role
