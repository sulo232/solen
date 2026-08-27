<!-- exists-check: extends _design-system/sections/booking-datetime/CORPUS.md (the cross-app research
     half, 72 screens, read in full before writing) and applies the shape of
     _design-system/sections/salon-detail/README.md, as _design-system/sections/booking-service/
     already does for step 1. Net-new vs scripts/measure-sections.mjs (the measuring tool) and
     _plans/DESIGN_CONSISTENCY_2026-08-27.md item S4 (the plan that asks for this). `npm run exists
     "date time step"` returns one hit, DateTimeStep.tsx. The date control itself is the registered
     DateTimePicker primitive (V3-D445); nothing here proposes a second one. -->

# Booking step 3 (date and time) section docs

Per-section specs for the date-and-time step. Each file follows the same shape as `_design-system/sections/salon-detail/*.md`: Reference, Component, Layer, Layout with an ASCII sketch, Measured, Tokens, Interaction, **Against the floors**, Intentional deviations, Empty state, Provenance.

Route: `/de/salon/cuts-and-culture/booking` (`app/[locale]/salon/[slug]/booking/page.tsx`, rendering `BookingWizard` then `DateTimeStep`, which composes `DateTimePicker`). Measured live at 402x844, settled, HTTP 200, `documentHeight` 911.

## How this screen was reached, and which state was measured

**The step has no URL.** `?step=datetime` returns step 1. The wizard was driven: add "Herrenschnitt", `Weiter`, pick "Jonas", `Weiter`, then tap the day tile "Mo 31 Aug". Full steps in `reachedBy` in `_measured/booking-datetime.json`.

- **The POPULATED state is the record**, because FLOORS LAW 3 makes the populated state the design target. A named stylist was picked rather than leaving the default "Keine Präferenz", so the downstream pay step would carry a real name for its trust floor.
- **The landing state was measured separately** and is under `bandAnatomy.landingStateBeforeADateIsPicked`. It matters: it is what a user actually sees on arrival, and it is nearly empty. See `04`.
- **Clicks were synthetic `HTMLElement.click()`**, because the pane's `left_click` timed out three times and delivered nothing. React handlers ran; no hover, press or `focus-visible` state was exercised, so nothing here describes them.

## Sections (document order)

| # | File | Section | Component |
|---|---|---|---|
| 1 | `01-step-chrome.md` | Back, step title, exit | `booking/BookingWizard.tsx:186-218` |
| 2 | `02-stylist-recall-pill.md` | Stylist echo, taps back to the staff step | `booking/DateTimeStep.tsx:162-186` |
| 3 | `03-day-strip.md` | "Datum wählen" heading plus the 14-day strip | `primitives/DateTimePicker.tsx:276-346` |
| 4 | `04-time-slots.md` | "Wählen Sie eine Uhrzeit" heading plus the slot card | `primitives/DateTimePicker.tsx:508-598` |
| 5 | `05-waitlist.md` | Quiet recovery link, or the full fully-booked card | `booking/DateTimeStep.tsx:229-259` |
| 6 | `06-continue-bar.md` | Fixed Weiter bar | `booking/DateTimeStep.tsx:266-277` |

Band map at 402x844, populated state, from the JSON:

```
 y    0  +-------------------------------------------+
      12 |  01  back / title / exit          h = 52  |
      68 |  02  stylist pill      120 x 42           |
     138 |  03  heading "Datum wählen"       h = 28  |
     178 |  03  day strip, full bleed 0..402, h = 92 |
     266 |      strip ends                           |
     298 |  04  heading "Wählen Sie eine Uhrzeit"    |
     338 |  04  slot card  [21, 338, 360, 337]       |
     675 |      card ends                            |
    ~695 |  05  waitlist link (derived, see 05)      |
     911 +--- document -----------------------------+
         |  06  fixed bar [0, 771, 402, 73], always on screen
```

## Folded elements

Per the brief, wrappers and the all-containing landmark are folded into their parent rather than given a band of their own:

- **Band index 0 of the JSON is `main`, the whole document.** Its text roles and card list are the source for every band the script does not keep separately, and for all screen-level numbers below. It gets no file.
- **The route has two nested `main` elements**, the layout's and the page's own (`page.tsx:261`). The JSON's band 0 carries the layout's className; the page's `main` was dropped by the script's dedupe rule (identical `innerText`, outer kept). The page's `main` still contributes the geometry every band inherits: `px-4` (the measured left 16 and width 370), `pt-3` (the measured top 12), `pb-6` and `max-w-2xl`.
- **Bands 2 and 3 in the JSON are unclassed `<div>`s** that the script kept only because each leads with a direct-child heading. Their own boxes are real and are used in `03` and `04`.
- **Folded with no band of their own, because none carries a surface:** `BookingWizard`'s `<div className="w-full">` and its `AnimatePresence` plus `motion.div` step-swap wrapper, `DateTimeStep`'s `<div className="pb-28">` (`:159`) and its `motion.div` ENTER-RECIPE wrapper (`:160`), the picker's own `flex flex-col gap-7` column (`DateTimePicker.tsx:188`), and the page's `<div className="min-h-screen bg-white">`. Their spacing shows up inside the bands: the `gap-7` is the 32px between the strip band and the slot band (266 to 298), and the `pb-28` is 112px of the space below the last content.

## Addressability

Identical to steps 1 and 2 and documented in `_design-system/sections/booking-service/README.md`. The step is React state, no search param reaches it, browser back exits the flow rather than stepping back, and a reload returns to step 1. **No band here can be linked to or screenshotted at a URL**, so every future measurement has to be driven by clicking.

## What this measurement answers in the corpus

`CORPUS.md` section 9 states four findings from source and names a rendered measurement as the confirming step for each. All four are now measured.

| corpus claim | source-derived | measured | verdict |
|---|---|---|---|
| 9.1 slot button "computes to about 43px", under the 44px floor | 43 | **77 x 43** | Confirmed, exactly 1px under |
| 9.2 four columns is the corpus's densest tier | `grid-cols-4` | **4 columns at 77px** | Confirmed |
| 9.3 the step has no display anchor, largest is the 22px day number, "I cannot rule out something larger arriving from a sibling component" | 22px | **22px is the rendered maximum** | Confirmed, nothing larger arrives |
| 9.4 distinct sizes are 12, 12.5, 13, 13.5, 14, 15, 16.5, 22 | 8 | **12, 12.5, 13.5, 14, 16.5, 18, 22** | Corrected in two places |

The 9.4 correction is worth keeping, because both halves of it are informative. **The rendered set adds 18px**, the two section headings, which the corpus missed because they live in `DateTimePicker.tsx:257` (`text-lg`) rather than in the step file it counted. **The rendered set drops 13 and 15**, which belong to the fully-booked waitlist card (`05`) and never mounted on a day with 18 free slots. Both counts are 7 or 8 against a ceiling of 4, so the verdict does not move.

## The screen against the owner's target ladder

| axis | target (salon page) | date step, measured | delta |
|---|---|---|---|
| display anchor | 30px | **22px** (a day number in the strip) | 8px under |
| body | 14px | 14px | same |
| anchor to body ratio | 2.14x | **1.57x** | 0.57 under |
| distinct sizes | 5, four in the densest cluster | **7 visible** (22, 18, 16.5, 14, 13.5, 12.5, 12), 8 rendered | 2 more, and four of the seven sit inside a 2px band |
| bold share (weight >= 600) | 30% | **55.71%** (39 of 70) | 26 points over |
| elevation levels | 3 | **1** (`shadow-whisper` on the back circle). All 8 card signatures measure `boxShadow: none` | 2 under |
| what carries emphasis | size and colour, at weight 500 | **weight, on repeated items**: 32 of the 39 bold elements are the 18 slot labels plus the 14 day numbers | differs |

**The bold-share number has a mechanical cause and it is worth naming exactly.** This screen is two grids, and both grids bold every cell. 18 slot labels at 600 plus 14 day numbers at 700 is 32 of the 39 bold elements. That is not 39 emphasis decisions; it is two decisions, each multiplied by its row count. The corpus is explicit that the reference apps do the opposite on the slot half: times read regular or medium, and only the selected one changes weight. Fixing the slot label alone would take the screen from 55.71% to 30% (21 of 70), which is the ceiling exactly.

## Screen-level measured numbers

| item | value |
|---|---|
| viewport | 402 x 844, settled, HTTP 200, no redirect |
| document height | 911 populated, 900 in the landing state. 900 is `min-h-screen` (844) plus the layout `main`'s 56px bottom padding; the populated content exceeds that minimum by 11px |
| distinct sizes | 8 rendered (22, 18, 16.5, 16, 14, 13.5, 12.5, 12); **7 visible**, the 16px being the 1x1 sr-only skip link |
| distinct weights | 4 (700, 600, 500, 400) |
| text elements | 70, of which 39 are weight >= 600 = **55.71%** |
| colours | ink `#0A0A0A`, ink at 30% for disabled days, ink-2 `#6B6B6B`, white, accent `#276EF1`, hairline `#E4E4E7` |
| imagery | 1 image, 676 px, the 26px stylist avatar in the recall pill |
| cards | 8 signatures: 18 slot pills, 8 enabled tiles, 5 disabled tiles, 1 selected tile, 1 more-dates tile, 1 stylist pill, 1 slot card, 1 CTA |

Screen-level floor results, gathered from the per-section files:

- **Sticky CTA (FLOORS LAW 3b): PASS.**
- **Display anchor (FLOORS LAW 6, >= 28px): FAIL by 6px.** The largest type is a day number.
- **Anchor ratio (EMPHASIS BUDGET b): FAIL at 1.57x.**
- **Bold share (EMPHASIS BUDGET a): FAIL at 55.71%, 1.86x the ceiling.**
- **Size ceiling (<= 4) and weight ceiling (<= 2): FAIL, 7 visible sizes and 4 weights.**
- **EMPHASIS BUDGET (c), variety without range: FAIL.** 14, 13.5, 12.5 and 12 sit inside a 2px band.
- **Touch targets: two FAILs, both by a hair.** Slot pills 43 (1 under), the stylist pill 42 (2 under). Day tiles 88, CTA 48, chrome controls 44 all pass. The waitlist link is 20px tall with no padding.
- **Imagery (FLOORS LAW 2): EXEMPT, not failed.** A form surface by the floor's own exemption list. It carries one real avatar.
- **FLOORS LAW 1 (d), a semantic-colour moment: FAIL.** The only chromatic pixels on the screen are the accent blue on the selected day tile, and accent blue is chrome, not semantic. No success, warning, star or error hue renders anywhere.
- **FLOORS LAW 4, the sunken tray: FAIL.** Grouped content on a white body with no photo anchor and no tray.
- **FLOORS LAW 4, edge visibility: PASS by option (c).** Every card keeps the `#E4E4E7` hairline.
- **Locked radius: one FAIL.** Tiles 16, pills 9999, CTA 99 all correct; the slot card measures 12, which is the locked **input** radius, not a card radius (16 or 24).
- **Alignment: one FAIL.** The slot card starts at x 21 while every other band starts at 16.
- **FLOORS LAW 8: FAIL.** This step's bottom bar is one of four hand-built copies that disagree on height, button width, background token and z-index. Table in `booking-staff/03-continue-bar.md`.
- **FLOORS LAW 9: PASS on the date control**, which is the registered `DateTimePicker` primitive under V3-D445, and **FAIL on the bottom bar**, hand-built while a sibling implementation exists two files away.
- **Trust floor (hierarchy-density-05): does not bind.** No money moves on this step.

## Not yet measured

1. **The fully-booked variant of `05`**, all values, and with it the 13px and 15px sizes.
2. **The slot loading skeleton.** It resolved before settle. Its pill is 38px against a real 43, so the layout moves when it resolves.
3. **The month sheet** behind the more-dates tile.
4. **The waitlist modal**, and both of its refusal paths (logged out, no date).
5. **The populated-state position of the waitlist link.** See the caveat in `05`.
6. **Every hover, press and `focus-visible` state**, including the slot cascade animation and the tile `active:scale-[0.98]`.
7. **The inline error line** (`text-s-error`), reachable only by pressing `Weiter` with nothing picked.
8. **The evening slot group.** This day produced only Morgens and Nachmittags.
9. **An unavailable-but-rendered slot** (`opacity-40`). All 18 were available.
10. **Desktop and the `md:` breakpoint.** 402 only.
11. **Worst-case content (FLOORS LAW 1 item f).** The longest stylist name in the 120px pill, and the French and Italian strings against the truncating step title and the fixed-width day tiles.
12. **The `isChecking` spinner**, which has no reachable rendered state.

## Reference set

- `_design-system/sections/_measured/booking-datetime.json` , the live measurement every number traces to, including the separately captured landing state and selected-slot reading
- `_design-system/sections/booking-datetime/CORPUS.md` , 72 screens, whose section 9 left four findings to a rendered pass, all four answered above
- `_design-system/sections/booking-staff/CORPUS.md` , pattern 9 (the stylist echo, answered in `02`) and Solen-gap item 1 (the fully-booked dead end, still open)
- `_design-system/sections/booking-service/README.md` , the sibling step, which owns the shared addressability finding
- `app/[locale]/_components/primitives/DateTimePicker.tsx` , the shared primitive both this step and search compose

## Locked decisions affecting this route

- **V3-D445** , one `DateTimePicker` primitive, `dateLayout="strip"` for booking and calendar for search, no bespoke date UI anywhere
- **Design contract, selected/active** , calm gray fill everywhere, with the booking date and slot named as one of the four exceptions that stay blue
- **Owner 2026-06-12** , the waitlist restructure and its dead-click fix
- **Owner 2026-06-12** , every step starts scrolled to the top
- **Mockup 26, owner-approved 2026-06-12** , the 16.5px step title, which is why this screen's anchor is a day number
- **hierarchy-density-06 / FLOORS LAW 3b** , the sticky-CTA floor
