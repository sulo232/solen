<!-- exists-check: extends _design-system/sections/booking-staff/CORPUS.md (read in full first) and
     _design-system/sections/booking-service/01-step-chrome.md, which specs this SAME component on
     step 1 and owns its shared anatomy. This file records only what differs on step 2 plus this
     step's own measured numbers; it does not restate the shared spec. `npm run exists "staff step"`
     returns 3 hits: one graveyard entry (SalonServicesSheet) and the two step components, no
     per-section spec. -->

# Booking step chrome on the stylist step (back, title, exit) , section spec

**Reference:** `_design-system/sections/_measured/booking-staff.json` band index 1, measured live at 402x844, settled, HTTP 200 · `CORPUS.md` pattern 3 (the title as display anchor)
**Component:** `components-legacy/booking/BookingWizard.tsx:186-218` (the row) · `components-legacy/booking/BookingExitButton.tsx` (the X)
**Layer:** 1 (chrome)
**Owning spec:** `_design-system/sections/booking-service/01-step-chrome.md`. Everything about the row's shape, the two 44px controls, the exit guard and the browser-back sentinel lives there and is not repeated here.

## Layout

```
+---------------------------------------------------------------+   y = 12
|  ( <- )        Stylist:in auswählen                   ( X )   |   h = 52
+---------------------------------------------------------------+   y = 64
   44x44          16.5px / 600 centred                 44x44
```

Identical geometry to step 1. Only the title string and the back target change.

## Measured

| item | value |
|---|---|
| band box | top 12, left 16, width 370, height 52 |
| surface | background `rgba(0, 0, 0, 0)`, padding `4px 0px`, radius 0 |
| title | 16.5px / 600 / Inter Tight / `rgb(10, 10, 10)` / line-height 24.75 / letter-spacing -0.165px / count 1 / "Stylist:in auswählen" |
| title box | [60, 26, 282, 25] |
| back control | [16, 16, 44, 44], radius 9999, border 1px `rgb(228, 228, 231)`, background white, shadow `rgba(10,10,10,0.04) 0 1px 3px` + `rgba(10,10,10,0.1) 0 10px 28px -14px` |
| exit control | [342, 16, 44, 44] |

Width 370 and left 16 are the page's `px-4` inside a 402 viewport (402 - 32 = 370), one derivation and its arithmetic. The two controls are absent from the JSON's card list because `scripts/measure-sections.mjs:280` skips any box under 60px wide; they were read separately and are in `bandAnatomy`.

## Tokens

- Back: `h-11 w-11 rounded-full border border-s-border bg-white shadow-whisper`, `ArrowLeft` 22px `strokeWidth 2.2` (`BookingWizard.tsx:207-209`)
- Title: `font-heading text-[16.5px] font-semibold tracking-[-0.01em] text-s-ink`, `min-w-0 flex-1 truncate text-center`
- `s-border` `#E4E4E7` = measured `rgb(228, 228, 231)`; `s-ink` `#0A0A0A` = measured `rgb(10, 10, 10)`

## Interaction

- **Back on this step goes back one step in page, it does not leave the flow.** `canGoBack` is true here (`currentIndex > 0`), so the arrow calls `goToStep(STEPS[currentIndex - 1])` (`BookingWizard.tsx:154-158`), which is the service step. On step 1 the same control leaves the route entirely. Same pixels, different job.
- The step change scrolls the window to 0 (`BookingWizard.tsx:145-147`).
- The title is data from `t('stepTitles.' + STEP_TITLE_KEYS[normalizedStep])`, not a per-step literal.
- X, browser back and tab close: see the owning spec.

## Against the floors

- **Display anchor (FLOORS LAW 6, >= 28px): FAIL.** The screen's only `h1` measures 16.5px, 11.5px under. The largest text anywhere on this step is the sticky bar's 20px price (`03`), still 8px under.
- **Anchor ratio (EMPHASIS BUDGET b, >= 1.8x body): FAIL.** 16.5 / 15 = 1.10x against this screen's dominant 15px row name, 16.5 / 13 = 1.27x against its 13px subtitle.
- **Touch target (>= 44px): PASS.** Both controls are 44x44, measured.
- **Single global back: PASS.** `HideInBooking` removes the global `Header` and `Breadcrumb` on this route, so this arrow is the only back on screen.
- **CORPUS pattern 3 answered.** The corpus said the title is the display anchor in 14 of 14 titled surfaces, Fresha at an estimated 28 to 30px, and closed with "Confirm on the rendered page, do not assume." Confirmed on the rendered page: Solen's is 16.5px. The corpus's expectation and the build disagree, and the build is the one measured.

## Intentional deviations

- **16.5px, not a display anchor, by a dated owner decision.** `BookingWizard.tsx:212-213`: mockup 26, owner-approved 2026-06-12, because "the 30px page title read unbalanced". Precedence tier 1 (dated owner call) sits above FLOORS LAW at tier 5, so the anchor floor loses here. The fail above is recorded raw regardless.
- No progress UI, no salon name, no step counter (`BookingWizard.tsx:179-180`, mockup 20).

## Empty state

None. The row renders on every step in every state.

## Provenance

- Mockup 20, owner-approved 2026-06-11 , back plus X, no progress UI
- Mockup 26, owner-approved 2026-06-12 , the compact 16.5px step title
- 2026-08-10 , back control matched to the header's 44px circle (`BookingWizard.tsx:181-185`)
