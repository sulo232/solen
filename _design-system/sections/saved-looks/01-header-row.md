# Back tile and the "Gespeichert" title

**Reference:** `_measured/de-inspo-saved.json` band 1, `/de/inspo/saved` at 390x844, signed in as
`kunde@solen.ch`, 2026-08-27 re-take, plus a live `getBoundingClientRect` run on the same route the
same day.
**Component:** `app/[locale]/inspo/saved/page.tsx:65-74`, hand-written in the page file.
**Layer:** 1 chrome, and it is this screen's own chrome rather than the global bar. The global
`Header` does not render on this route: measured, `document.querySelectorAll('header').length` is 0
here and 1 on `/de/profile/favorites`.

## CORRECTION, 2026-08-27

This file used to say, in bold, **"No band of its own."** That is no longer true, and the reason it
was true is worth keeping because it also confirms the diagnosis of the bad capture.

The walker drops a candidate that sits inside another candidate with identical `innerText`, keeping
the outer one (`scripts/measure-sections.mjs`, the `kept` loop). In the skeleton capture the
skeleton below carried no text, so `main.innerText` and this row's `innerText` were both exactly
"Gespeichert" and `main` won. In the re-take the empty state adds two strings to `main`, the two
differ, and this row survives as band 1. Same walker, same page, different content, and the band
appears exactly where the old file predicted it would. The row's box was recorded there as
**derived**, 16 + 40 + 12 = 68. It measures **68**.

## Layout

```
   0 +--------------------------------------------------+
     |  pt-4                                            |
  16 |  (<-)  Gespeichert                               |   tile 40x40 at (16,16), title 22/700
  56 |  pb-3                                            |
  68 +--------------------------------------------------+
     |  the empty state, or the grid, or the skeleton   |
```

`flex items-center gap-3 px-4 pb-3 pt-4`. Two elements, no third. There is no count, no filter, no
sort and no overflow menu.

## Measured

Band 1, verbatim from the capture:

| axis | value |
|---|---|
| tag | `div`, class `flex items-center gap-3 px-4 pb-3 pt-4` |
| box | top 0, left 0, **390 x 68** |
| background | `rgba(0, 0, 0, 0)` |
| padding | `16px 16px 12px` |
| images | 0 |

Text role, one:

| size | weight | family | colour | line-height | letter-spacing | count | sample |
|---|---|---|---|---|---|---|---|
| 22 | 700 | Inter Tight | `rgb(10, 10, 10)` | 33 | -0.44px | 1 | "Gespeichert" |

Rects from the live run, which the JSON does not carry:

| element | x | y | w | h | note |
|---|---|---|---|---|---|
| back tile | 16 | 16 | **40** | **40** | computed radius `9999px`, background `rgba(0, 0, 0, 0)` |
| title | 68 | 20 | 120 | 33 | 22/700 Inter Tight, letter-spacing -0.44px |

Source literals, re-verified for this file:

| element | literal | line |
|---|---|---|
| back tile | `grid h-10 w-10 place-items-center rounded-full border border-s-border text-s-ink transition-transform duration-150 active:scale-95` | 69 |
| back label | `aria-label={tBack("back")}`, which rendered "Zurück" | 68 |
| back glyph | `ArrowLeft size={18} strokeWidth={1.9}` | 71 |
| title | `font-heading text-[22px] font-bold tracking-[-0.02em] text-s-ink` | 73 |

`tracking-[-0.02em]` at 22px is -0.44px, which is exactly the measured letter-spacing. `h-10 w-10`
is 40px, which is exactly the measured tile. Source and render agree.

## Tokens

- Title `s-ink` `#0A0A0A`, measured `rgb(10, 10, 10)`
- Tile hairline `border-s-border` `#E4E4E7`, the single divider token
- No fill on the tile, no shadow, which is the flat treatment the elevation table asks for on a calm
  control on white
- 22 is on the locked scale (`scripts/lib/type-scale-allowed.mjs` cites LOCKFILE section 2 for it)

## Interaction

- Back tile: `router.push('/{locale}/inspo')`, a **fixed destination**, not history back. A customer
  who arrived from the bottom nav's heart, or from a shared link, is sent to the feed rather than
  back to where they were.
- The title is not a control.
- The row does not stick. It scrolls away with whatever is below it. Over the empty state there is
  nothing to scroll: the document is 900 tall against an 844 viewport, and the extra 56 is the
  layout main's bottom padding, not content.

## Intentional deviations

- **The title is a hardcoded German string**, not a translation key (`page.tsx:73`). On a four-locale
  product the English, French and Italian renders of this route all read "Gespeichert". The back
  control's `aria-label` IS translated (`tBack("back")`, line 68), so the screen mixes both
  approaches in one row of two elements.
- **The back control is hand-drawn rather than composed.** The screen draws its own 40px circular
  tile instead of using the header's back affordance, which every other deep route inherits. FLOORS
  LAW 9 says if the registry owns it, compose it. The registry does not own a back tile today, so
  this is not a violation of the letter. Item S3 of `_plans/DESIGN_CONSISTENCY_2026-08-27.md` line
  190 is open on exactly this: "Standard is the 44x44 at (16,20) that seven pages already use". This
  tile measures 40x40 at (16,16), so it misses the proposed standard on both size and origin.
- **The global header is not merely hidden, it is removed by route.**
  `app/[locale]/_components/layout/HideInBooking.tsx:54` returns null for
  `/\/inspo\/(board|saved)(\/|$)/` with no prop guard, so the header, the breadcrumb, the footer AND
  the bottom nav all disappear on this route. Measured on the live route: 0 `header`, 0 `nav`, 0
  `footer` elements, against 1, 3 and 1 on `/de/profile/favorites`. The comment at lines 51 to 54
  gives the reason for the header (avoid a doubled back control) and does not mention the nav, which
  arrived later. See this folder's README.

## Empty state

Unchanged. The row renders identically over the grid, over the skeleton and over the empty state,
which is correct: it is the screen's only permanent furniture. The re-take measured it over the
empty state, and its box matches the height derived from source when the skeleton was up.

## Against the floors

- **Display anchor: FAIL.** 22px measured, against a >= 28px floor and the 30px ladder value at
  `_plans/DESIGN_CONSISTENCY_2026-08-27.md` line 297. FLOORS LAW 6 excuses the anchor when the
  photograph is the focal, and populated this screen is nothing but photographs, so the excuse
  applies to the populated SCREEN. It does not apply in the state that was measured, where there is
  no photograph at all.
- **Anchor ratio: FAIL, and this is new.** Against the empty state's 14px body line, 22 / 14 =
  1.57x, under the 1.8x floor. The previous version of this folder recorded the ratio as not
  gradeable because the screen had no body text. In the state a customer with no saves actually
  sees, it has one. See `03-empty-state.md`.
- **Touch target: FAIL, and now measured rather than source-read.** 40x40 against the design
  contract's 44px floor for interactive controls. The heart on a look card measures 44x44 (measured
  on `/de/inspo`, same component, see `02-saved-grid.md`), so the screen's most permanent control is
  its smallest one. WCAG 2.2 AA 2.5.8 asks for 24x24, which 40 clears, so this is a house floor and
  not a statutory one.
- **Contrast: PASS.** `#0A0A0A` on white is 19.3:1. The tile's hairline is decorative and the glyph
  is `s-ink`.
- **Type: 22/700 is on the locked scale.**

## Provenance

- Owner 2026-06-23, boards ditched, "the heart icon just saves, simple plain"
  (`_design-system/REMOVED.md` line 33), which is why this row has a title and nothing else
- V3-D414, `/inspo/board` and `/inspo/saved` are focused views and drop the marketing chrome
- `_design-system/sections/saved/05-saved-looks.md`, which read the same literals from source before
  any measurement existed; this file re-verified each line and adds the measured band
