<!-- exists-check: extends _design-system/sections/booking-service/CORPUS.md (read in full first), which
     holds the cross-app research half for this screen and explicitly says it is "written to the house
     format of _design-system/sections/salon-detail/*.md" but is NOT a per-section spec. Net-new vs
     scripts/measure-sections.mjs (the measuring tool, not a spec), components/ui/card.tsx (a shadcn
     primitive, unused by this route), _docs/category-system-map.md (taxonomy data flow),
     _plans/MOBILE_DESIGN_SYSTEM.md and _plans/DESIGN_SYSTEM_HARDENING.md (token plans, no per-screen
     bands), docs/roadmaps/02-salon-cards.md and 07-design-system-polish.md (roadmaps). `npm run exists
     "booking service"` returns 5 hits: 2 graveyard entries (borderless Model B, SalonServicesSheet),
     the page-inline mockup marker, and the two components this file specs. Nothing found is a
     per-section spec for the booking service step; this is step one of item S4 in
     _plans/DESIGN_CONSISTENCY_2026-08-27.md. -->

# Booking step chrome (back, title, exit) , section spec

**Reference:** `_design-system/sections/_measured/booking-service.json` band index 1 (measured live at 390x844, settled, HTTP 200) · `CORPUS.md` section 2 and section 7 row "Step chrome"
**Component:** `components-legacy/booking/BookingWizard.tsx:186-218` (the row) · `components-legacy/booking/BookingExitButton.tsx` (the X)
**Layer:** 1 (chrome)

## Layout

```
+---------------------------------------------------------------+   y = 12
|  ( <- )        Services auswaehlen                    ( X )   |   h = 52
+---------------------------------------------------------------+   y = 64
   44x44          16.5px / 600 centred                 44x44
```

One row, three slots, `flex items-center justify-between`. The title is `min-w-0 flex-1 truncate text-center`, so it takes whatever the two 44px controls leave and truncates rather than wrapping. The row does not stick; it scrolls away and the category pill row (`02`) pins in its place.

## Measured

From band index 1 of the JSON unless marked otherwise.

| item | value |
|---|---|
| box | top 12, left 16, width 358, height 52 |
| surface background | `rgba(0, 0, 0, 0)` (transparent, the white comes from an ancestor) |
| surface padding | `4px 0px` |
| surface radius | `0px` |
| title | 16.5px / 600 / Inter Tight / `rgb(10, 10, 10)` / line-height 24.75px / letter-spacing -0.165px / count 1 / sample "Services auswaehlen" |
| cards in this band | none recorded |
| imagery | 0 images, 0 px |

Two numbers that are derived, not measured, with the arithmetic shown:

- **Height 52 decomposes as 4 + 44 + 4.** `pt-1` + `h-11` control + `pb-1` (source: `BookingWizard.tsx:186, 192`). The measured 52 and the measured `4px 0px` padding agree with it.
- **Top 12 is the page's `pt-3`** (source: `app/[locale]/salon/[slug]/booking/page.tsx:261`), and left 16 / width 358 are that same element's `px-4` inside a 390 viewport (390 - 32 = 358).

The two 44x44 circle controls do not appear in the JSON's card list. That is the measurement script's own filter, not an absence: `cardAnatomy` skips any box under 60px wide (`scripts/measure-sections.mjs:280`).

## Tokens

- Back control: `h-11 w-11 rounded-full border border-s-border bg-white shadow-whisper`, `ArrowLeft` 22px `strokeWidth 2.2` `text-s-ink` (source `BookingWizard.tsx:192-194`)
- Exit control: `h-11 w-11 rounded-full` with no border and no fill at rest, `hover:bg-s-bg-sunken`, `X` 20px `strokeWidth 2.2` (source `BookingExitButton.tsx:89-91`)
- Title: `font-heading` (Inter Tight) `text-[16.5px] font-semibold tracking-[-0.01em] text-s-ink`
- `s-border` = `#E4E4E7` = the measured `rgb(228, 228, 231)`; `s-ink` = `#0A0A0A` = the measured `rgb(10, 10, 10)`

## Interaction

- **Back, on step 1** (this step): `router.back()` when `window.history.length > 1`, else `router.push('/{locale}/salon/{slug}')` (`BookingWizard.tsx:199-205`). It leaves the flow. There is no earlier step to return to.
- **Back, on later steps:** `goToStep(STEPS[currentIndex - 1])` (`BookingWizard.tsx:156-158`). In-page only, no URL change.
- **X:** with an empty cart, `router.replace('/{locale}/salon/{slug}')`. With anything in the cart, a full-screen confirm opens first (`BookingExitButton.tsx:76-79, 99-140`). `replace` and not `push`, deliberately, so the browser back button cannot walk back into the abandoned flow.
- **Browser back and tab close** are treated as the same action as X: a sentinel history entry is pushed on mount and `popstate` re-arms it and raises the same confirm when the cart is non-empty (`BookingExitButton.tsx:44-58`); `beforeunload` warns on a tab close or hard refresh (`BookingExitButton.tsx:59-65`).
- Step change scrolls the window to 0 (`BookingWizard.tsx:145-147`).

## Against the floors

- **Display anchor (FLOORS LAW 6, >= 28px per customer screen): FAIL.** This band holds the screen's only `h1` and it measures 16.5px, 11.5px under the floor. The screen's largest type is elsewhere (20px, in `04`) and still 8px under.
- **Anchor ratio (EMPHASIS BUDGET b, >= 1.8x body): FAIL for this band.** 16.5 / 14 = 1.18x.
- **Bold share (EMPHASIS BUDGET a, <= ~30% at weight >= 600): FAIL.** 1 of 1 text element in this band is 600.
- **Touch target (>= 44px): PASS.** Both controls are `h-11 w-11` (source; the JSON does not carry them, see the 60px filter note above).
- **Single global back (locked nav row): PASS.** `HideInBooking` removes the global `Header` and `Breadcrumb` on this route (`app/[locale]/layout.tsx:112-114, 129-131`, `HideInBooking.tsx:66`), so this row is the only back on the screen.

## Intentional deviations

- **The title is 16.5px and not a display anchor, by a dated owner decision.** `BookingWizard.tsx:212-213` records it: mockup 26, owner-approved 2026-06-12, because "the 30px page title read unbalanced". Precedence chain tier 1 (the owner's dated literal call) sits above FLOORS LAW at tier 5, so the 28px anchor loses here. The measured fail above is recorded raw regardless; this is the reason, not a softening.
- **No progress UI of any kind.** No segments, no numbered circles, no breadcrumb pills (`BookingWizard.tsx:40-44`, mockup 20, owner-approved 2026-06-11). The back arrow is the navigation and the title names the task.
- The back control carries a border and `shadow-whisper` while the X carries neither. Source records the asymmetry as deliberate: the back circle was matched to the header's 44px control on 2026-08-10 (`BookingWizard.tsx:181-185`); the X is a bare glyph in a 44px hit area.

## Empty state

None. This band renders on every step of the flow, in every state. It does not render in the zero-service branch (`07`), because that branch replaces the whole wizard at the page level.

## Provenance

- Mockup 20, owner-approved 2026-06-11 , Fresha bones, back + X, no progress UI (`BookingWizard.tsx:40-44`)
- Mockup 26, owner-approved 2026-06-12 , compact 16.5px step title replacing a 30px page title (`BookingWizard.tsx:212-213`)
- 2026-08-10 , back control matched to the header's 44px circle, `-ml-1` pull removed (`BookingWizard.tsx:181-185`)
- ia-navigation-01 , browser back and tab close get the same guard as X (`BookingExitButton.tsx:19-23`)
