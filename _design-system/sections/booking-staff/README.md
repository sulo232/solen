<!-- exists-check: extends _design-system/sections/booking-staff/CORPUS.md (the cross-app research
     half, read in full before writing) and applies the shape of
     _design-system/sections/salon-detail/README.md, as the sibling
     _design-system/sections/booking-service/README.md already does for step 1. Net-new vs
     scripts/measure-sections.mjs (the tool that produced the numbers) and
     _plans/DESIGN_CONSISTENCY_2026-08-27.md item S4 (the plan that asks for this, not the spec).
     `npm run exists "staff step"` returns 3 hits: one graveyard entry (SalonServicesSheet, the
     PDP sheet removed 2026-07-19 as a duplicate of the booking service step) and the two step
     components. No per-section spec existed for this screen. -->

# Booking step 2 (stylist selection) section docs

Per-section specs for the stylist step of the booking flow. Each section file follows the same shape as `_design-system/sections/salon-detail/*.md` and its sibling `booking-service/*.md`:

- **Reference:** what was measured, or a plain statement that nothing was
- **Component:** the real file path and line range
- **Layer:** 1 chrome / 2 accent / 3 semantic
- **Layout:** the structural target, with an ASCII sketch
- **Measured:** numbers from `_measured/booking-staff.json`, with anything derived showing its arithmetic
- **Tokens:** the colour, font and spacing tokens in use
- **Interaction:** what each tap actually does, read from the code
- **Against the floors:** which floors this band's measured numbers pass and fail, with the number
- **Intentional deviations:** dated owner decisions that override a rule
- **Empty state**
- **Provenance**

Route: `/de/salon/cuts-and-culture/booking` (`app/[locale]/salon/[slug]/booking/page.tsx`, rendering `BookingWizard` then `StaffStep`). Measured live at 402x844, settled, HTTP 200, `documentHeight` 900.

## How this screen was reached, and why that matters

**The step has no URL.** `?step=staff` returns step 1, because `BookingWizard` holds `currentStep` in React state through `lib/booking-context` and reads no search params. The screen was reached by driving the wizard: add "Herrenschnitt" on step 1, press `Weiter`. Full steps, the salon and service used, and the reason for each choice are in `reachedBy` in `_measured/booking-staff.json`.

Two facts from that record that change how the numbers should be read:

1. **The salon was verified to have more than one stylist before it was used.** `cuts-and-culture` has 3 active `staff_members` rows, so `hasStaffStep = staffList.length > 1` is true and the step is not skipped. With 0 or 1 staff this screen does not exist at all.
2. **The clicks were dispatched as `HTMLElement.click()` through `javascript_tool`, not as real pointer events**, because `mcp__Claude_Browser__computer`'s `left_click` timed out after 30s on three consecutive attempts and delivered nothing. React `onClick` handlers ran; **no hover, press or `focus-visible` state was ever exercised**, so nothing in this folder describes those states.

## Sections (document order)

| # | File | Section | Component |
|---|---|---|---|
| 1 | `01-step-chrome.md` | Back, step title, exit | `booking/BookingWizard.tsx:186-218` |
| 2 | `02-stylist-list.md` | Egal row plus one card per stylist | `booking/StaffStep.tsx:102-189` |
| 3 | `03-continue-bar.md` | Fixed running total and Weiter | `booking/StaffStep.tsx:192-216` |
| 4 | `04-profile-sheet.md` | Read-only stylist profile overlay (not measured) | `booking/StaffProfileSheet.tsx` |

Band map at 402x844, from the JSON:

```
 y    0  +-------------------------------------------+
      12 |  01  back / title / exit          h = 52  |
      64 |  02  ul, gap 10, pt 4                     |
      68 |      Egal          370 x 90   SUNKEN      |
     168 |      Jonas         370 x 125              |
     303 |      Marco         370 x 125              |
     438 |      Tim           370 x 125              |
     563 |      list ends                            |
     771 |      content ends (563 + 128 + 24 + 56)   |
     900 +--- document, set by min-h-screen + 56 ----+
         |  03  fixed bar [0, 775, 402, 69], always on screen
```

## Folded elements

Per the brief, wrappers and the all-containing landmark are folded into their parent rather than given a band of their own:

- **Band index 0 of the JSON is `main`, the whole document.** Its numbers are used at screen level here and its text roles and card list are the source for the two bands the script does not keep separately (`02` and `03`). It gets no file.
- **The route has two nested `main` elements**, the layout's and the page's own (`page.tsx:261`). The JSON's band 0 carries the layout's className; the page's `main` was dropped by the script's dedupe rule, which keeps the outer of two candidates with identical `innerText`. The page's `main` still contributes the geometry every band inherits: `px-4` (the measured left 16 and width 370), `pt-3` (the measured top 12), `pb-6` and `max-w-2xl`.
- **Folded with no band of their own, because none carries a surface:** `BookingWizard`'s `<div className="w-full">`, the `AnimatePresence` plus `motion.div` step-swap wrapper and its `SectionErrorBoundary` (`BookingWizard.tsx:221-235`), `StaffStep`'s `<div className="pb-32">` (`:103`), the `motion.ul`'s `motion.li` items, and the page's `<div className="min-h-screen bg-white">` (`page.tsx:260`). Their spacing contributions are recorded inside the bands that show them: the `pb-32` in `03`, the `min-h-screen` in the document-height arithmetic.

## Addressability

Identical to step 1 and fully documented in `_design-system/sections/booking-service/README.md`. In one line: the step is React state, no search param sets it, the browser back button exits the flow rather than stepping back, a reload returns to step 1, and therefore **no band in this folder can be linked to or screenshotted at a URL.** Every future measurement of this step has to be driven by clicking.

## The screen against the owner's target ladder

The ladder is the salon page's, the one route the owner says he likes.

| axis | target (salon page) | stylist step, measured | delta |
|---|---|---|---|
| display anchor | 30px | **20px** (the running total, in the fixed bar) | 10px under |
| body | 14px | 15px row name / 13px subtitle. The only 14px on the screen is the CTA label | different scale |
| anchor to body ratio | 2.14x | **1.33x** (20 / 15), or 1.54x against the 13px subtitle | 0.6 to 0.8 under |
| distinct sizes | 5, four in the densest cluster | **6 visible** (20, 16.5, 15, 14, 13, 12), 7 rendered | 1 more, and four of the six sit inside a 4px band |
| bold share (weight >= 600) | 30% | **21.05%** (4 of 19) | **under the ceiling, the only booking step that is** |
| elevation levels | 3 | **1 rendered** (`shadow-whisper`, on the back circle only) | 2 under |
| what carries emphasis | size and colour, at weight 500 | **weight and colour**: 500 to 600 on the selected name, accent blue on the profile link | closer than its siblings |

Plainly: this step is the flow's most restrained screen and it is restrained in the right places. The selected row is marked by a weight step and a calm gray fill rather than by shouting, and the bold share clears the ceiling. What it lacks is the top of the ladder: nothing on the screen is large, so there is no anchor and the whole page sits inside a 12 to 20px band.

## Screen-level measured numbers

| item | value |
|---|---|
| viewport | 402 x 844, settled, HTTP 200, no redirect |
| document height | 900, which is `min-h-screen` (844) plus the layout `main`'s 56px bottom padding. Content stops at 771 |
| distinct sizes | 7 rendered (20, 16.5, 16, 15, 14, 13, 12); **6 visible**, because the 16px is the 1x1 sr-only skip link |
| distinct weights | 4 (700, 600, 500, 400) |
| text elements | 19, of which 4 are weight >= 600 = **21.05%** |
| colours | ink `#0A0A0A`, ink-2 `#6B6B6B`, white, accent `#276EF1`, sunken `#F4F4F5`, hairline `#E4E4E7`. One chromatic, and it is on a text link |
| imagery | 3 images, 9408 px, all real stylist avatars |
| cards | 3 signatures: white entity card x3, sunken entity card x1, ink pill x1 |

Screen-level floor results, gathered from the per-section files:

- **Sticky CTA (FLOORS LAW 3b): PASS.** The commit is in a `fixed bottom-0` bar, on screen from first paint.
- **Bold share (EMPHASIS BUDGET a, <= ~30%): PASS at 21.05%.** Worth naming, because the services step next door measures 76.19% and the date step 55.71% on the same flow.
- **Display anchor (FLOORS LAW 6, >= 28px): FAIL by 8px.** Nothing reaches 28. The largest text is a price in a fixed bar.
- **Anchor ratio (EMPHASIS BUDGET b, >= 1.8x): FAIL at 1.33x.**
- **Size ceiling (<= 4) and weight ceiling (<= 2): FAIL, 6 visible sizes and 4 weights.** This answers the corpus's own open question directly: its Solen-gap item 2 counted "five distinct sizes inside `StaffStep.tsx` alone, before whatever title `BookingWizard` contributes" and said it must be measured live. Measured: six visible, and the title is indeed the sixth.
- **EMPHASIS BUDGET (c), variety without range: FAIL.** Four of the six visible sizes (15, 14, 13, 12) sit inside a 3px band, which is the exact case the clause names as the worst one.
- **Imagery (FLOORS LAW 2): EXEMPT, not failed.** A picker is a form surface, which the floor exempts by name. The screen carries 3 real avatars anyway.
- **FLOORS LAW 1 (d), a semantic-colour moment: PASS, source-confirmed only.** The `#FFC32B` star renders in each rating row; SVG is skipped by the measurement script.
- **FLOORS LAW 4, the sunken tray: N/A rather than FAIL.** The rule pushes grouped list content on white toward a tray, and here the tray is already spent: `bg-s-bg-sunken` is the locked SELECTED state for a row. Putting the list on a sunken tray would put the selected fill on top of its own colour. The corpus checked this same collision from the other side and found no `bg-s-bg-sunken` on either body today, so the collision does not exist yet. It would arrive the moment this step moved onto a tray.
- **FLOORS LAW 4, edge visibility: PASS by option (c).** Every card keeps the `#E4E4E7` hairline.
- **FLOORS LAW 8, the same thing looks the same everywhere: FAIL.** Four consecutive steps of one flow hand-build four different bottom bars: heights 68 (derived), 69, 73 and 84, CTA widths 113, 113, 370 and 338, two z-indexes, two background tokens. The table is in `03`.
- **FLOORS LAW 9, composed from the registry: MIXED.** `Avatar` is composed and the profile sheet composes six primitives; the row and the bottom bar are hand-built.
- **Touch targets: one FAIL.** Rows are 90 and 125 tall and the CTA is exactly 44. The "Profil ansehen" link has no padding and an 18px measured line box, 26px under the floor.
- **Trust floor (hierarchy-density-05): does not bind.** No money moves on this step.
- **Locked selected state: PASS.** Gray `#F4F4F5` fill plus semibold plus one static check, never an ink fill.

## Not yet measured

Absent from `_measured/booking-staff.json`, listed so nobody re-derives it from source and calls it measured.

1. **The profile sheet (`04`)**, all values. Closed at rest, never opened.
2. **Every hover, press and `focus-visible` state.** The run used synthetic `.click()`, so no pointer ever existed. This includes the CTA's draw-in arrow, `butterPress`, and the row hover.
3. **The unselected Egal row and the selected stylist row.** Only one selection state was on screen: Egal selected, three stylists unselected. The selected white-row-to-sunken transition was never seen.
4. **The "Profil ansehen" link's own box.** Its 18px height is derived from the measured line-height, not read from a rect.
5. **The disabled CTA.** `disabled={!selected}` has no reachable state, because Egal is pre-selected.
6. **The zero-capable-stylist fallback** (`StaffStep.tsx:86`) and the no-languages row (`:159`). Both are data states this salon does not produce.
7. **The star SVG.** `scripts/measure-sections.mjs:214` skips SVG, so the one chromatic semantic element on the screen has no rendered measurement.
8. **Desktop and the `md:` breakpoint.** 402 only.
9. **Worst-case content (FLOORS LAW 1 item f).** The longest real stylist name against the truncating 15px name line, four languages against the 13px subtitle, and the French and Italian step titles against the truncating `h1`.
10. **The entrance stagger.** `useStaggerVariants` runs on mount; the measurement was taken after settle, so only the resting state is recorded.

## Reference set

- `_design-system/sections/_measured/booking-staff.json` , the live measurement every number traces to
- `_design-system/sections/booking-staff/CORPUS.md` , the cross-app research this extends: 23 rows across 4 apps, whose Solen-gap section left the type census explicitly to a rendered pass
- `_design-system/sections/booking-service/README.md` and `01-step-chrome.md` , the sibling step, which owns the shared chrome spec and the shared addressability finding
- `_design-system/sections/salon-detail/README.md` , the template shape and the owner's target ladder
- `/dev/stylist-directions` , the three directions the owner picked B from on 2026-07-09

## Locked decisions affecting this route

- **Direction B, owner-picked 2026-07-09** , rich full-width tap rows, whole row taps, "Egal" pinned first with a glyph, one quiet static check
- **B19, owner 2026-07-09, asked twice** , the read-only profile path, without any service picking
- **Owner 2026-07-19** , stylists are individual entity cards, not members of a group card
- **Owner 2026-07-24** , the language subtitle restored against Fresha IMG_6696, reversing the 2026-07-09 removal
- **Mockup 26, owner-approved 2026-06-12** , the 16.5px step title, which is why this screen has no display anchor
- **Design contract, selected state** , calm gray fill, never ink
- **hierarchy-density-06 / FLOORS LAW 3b** , the sticky-CTA floor
