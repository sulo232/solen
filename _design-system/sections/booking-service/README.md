<!-- exists-check: extends _design-system/sections/booking-service/CORPUS.md (the cross-app research
     half for this screen, read in full before writing) and applies the shape of
     _design-system/sections/salon-detail/README.md to a second screen. Net-new vs
     _plans/DESIGN_CONSISTENCY_2026-08-27.md item S4 (the plan that asks for this, not the spec),
     scripts/measure-sections.mjs (the tool that produced the numbers) and _plans/SCREEN_RESEARCH.md.
     `npm run exists "booking service"` returns 5 hits: two graveyard entries, one page-inline mockup
     marker and the two components specced here. No per-section spec existed for this screen. -->

# /salon/[slug]/booking step 1 (service selection) section docs

Per-section specs for the first step of the booking flow. Each section file follows the same shape as `_design-system/sections/salon-detail/*.md`:

- **Reference:** what was measured, or a statement that nothing was
- **Component:** the real file path and line range
- **Layer:** 1 chrome / 2 accent / 3 semantic
- **Layout:** the structural target, with an ASCII sketch
- **Measured:** numbers from `_measured/booking-service.json`, with anything derived showing its arithmetic
- **Tokens:** the color / font / spacing tokens in use
- **Interaction:** what each tap actually does, read from the code
- **Against the floors:** which floors this band's measured numbers pass and fail, with the number
- **Intentional deviations:** dated owner decisions that override a rule
- **Empty state**
- **Provenance**

Route: `/de/salon/cuts-and-culture/booking` (`app/[locale]/salon/[slug]/booking/page.tsx`, rendering `BookingWizard` then `ServicesStaffStep` from `components-legacy/booking/`). Measured live at 390x844, settled, HTTP 200, `documentHeight` 1906.

Steps 2 to 5 (staff, date and time, pay) and the confirmation live in their own folders and are not covered here.

## Sections (document order)

| # | File | Section | Component |
|---|---|---|---|
| 1 | `01-step-chrome.md` | Back, step title, exit | `booking/BookingWizard.tsx:186-218` + `booking/BookingExitButton.tsx` |
| 2 | `02-category-pill-row.md` | Sticky category scroll-spy pills | `booking/ServicesStaffStep.tsx:482-503` |
| 3 | `03-service-group-card.md` | Service group card, four instances | `booking/ServicesStaffStep.tsx:507-521` + `primitives/ServiceDisclosureRow.tsx` + `booking/ToggleCircle.tsx` |
| 4 | `04-running-total-bar.md` | Fixed running total and the Weiter commit | `booking/ServicesStaffStep.tsx:561-608` |
| 5 | `05-selection-recall-pill.md` | Floating "N ausgewaehlt" recall pill (conditional) | `booking/ServicesStaffStep.tsx:538-558` |
| 6 | `06-service-detail-sheet.md` | Options and add-ons overlay | `booking/ServiceDetailSheet.tsx` |
| 7 | `07-empty-services-state.md` | Zero-services branch (replaces the whole route) | `booking/EmptyServicesState.tsx` |

Band map at 390x844, from the JSON:

```
 y    0  +-------------------------------------------+
      12 |  01  back / title / exit          h = 52  |
      64 |  02  sticky pill row     h = 65 (derived) |
     145 |  03  Bart          394   card 358 x 358   |
     539 |            32px gap                       |
     571 |  03  Extras        275   card 358 x 239   |
     878 |  03  Haarschnitt   513   card 358 x 477   |
    1423 |  03  Kombi         275   card 358 x 239   |
    1698 |      208px of padding (128 + 24 + 56)     |
    1906 +-------------------------------------------+
         |  04  fixed bar, about 68px, always on screen
```

## Folded elements

Per the brief, wrappers and the all-containing landmark are folded into their parent rather than given a band of their own:

- **Band index 0 of the JSON is `main`**, the whole document. Its numbers are used at screen level in this README and its type and card anatomy are the source for the two bands (`02`, `04`) that the script does not keep separately. It gets no file.
- **The route has two nested `main` elements.** The layout's (`app/[locale]/layout.tsx:115-129`) and the page's own (`page.tsx:261`). The JSON's band 0 carries the layout's className, and the page's `main` was dropped by the script's dedupe rule, which keeps the outer of two candidates with identical `innerText` (`scripts/measure-sections.mjs:227-231`). The page's `main` still contributes the geometry every band inherits: `px-4` (the measured left 16 and width 358), `pt-3` (the measured top 12), `pb-6` and `max-w-2xl`.
- **Folded with no band of their own, because none carries a surface:** `BookingWizard`'s `<div className="w-full">`, the `AnimatePresence` + `motion.div` step-swap wrapper and its `SectionErrorBoundary` (`BookingWizard.tsx:221-235`), `ServicesStaffStep`'s `<div className="pb-32">` (`:476`) and its `<div className="space-y-8 pt-4">` groups container (`:507`), and the page's `<div className="min-h-screen bg-white">` (`page.tsx:260`). Their spacing contributions are recorded inside the bands that show them.

## Addressability

Measured behaviour, not a proposal, and nothing here is being fixed.

- **The step is not in the URL.** `currentStep` is React state in a `useReducer` (`lib/booking-context.tsx:39, 45-48, 92`), and `goToStep` only dispatches `SET_STEP` (`:145-147`). Neither `BookingWizard.tsx` nor `ServicesStaffStep.tsx` reads `useSearchParams`, and no file in the flow calls `history.pushState` to record a step. `?step=staff` therefore does nothing.
- **A booking step cannot be linked to.** The route does accept seven search params, `staff`, `service`, `services`, `start`, `date`, `note` and `bundle` (`page.tsx:11, 41`), and they seed the cart, the stylist, the date and the note (`lib/booking-context.tsx:94-136`). They never set the step: `initialState.currentStep` is always `'services-staff'` (`:39`), so every arrival lands on step 1 no matter how much of the form the link fills in.
- **The browser back button does not step back one, and it does not silently leave either.** `BookingExitButton` pushes a sentinel history entry on mount and listens for `popstate` (`BookingExitButton.tsx:42-58`). With services in the cart, back re-arms the sentinel and raises the same "leave this booking?" confirm the X uses; with an empty cart it does `router.replace` to the salon page. Either way the gesture exits the flow rather than returning to the previous step. `beforeunload` covers a tab close or hard refresh (`:59-65`). The only step-back is the in-page arrow (`BookingWizard.tsx:156-158`).
- **A reload loses the flow.** The context has no `localStorage` or `sessionStorage`, so a refresh returns to step 1 with only the URL seeds restored.
- **One consequence worth recording:** because the step is not addressable, `01`, `02`, `03` and `04` are not independently linkable and cannot be screenshotted at a URL. Every future measurement of steps 2 to 5 has to be driven by clicking.

## Step order, confirmed against the code

Project memory records the flow as services, then staff as its own step, then Zeit plus "Deine Haare" for hair categories, with the staff step skipped for salons with zero or one staff member. **The code agrees, on every clause.**

- The array is built at `BookingWizard.tsx:125-131`: `'services-staff'`, then `'staff'` only when `hasStaffStep`, then `'datetime'`, then `'hair'` only when `hairRelevant`, then `'pay-confirm'`.
- `hasStaffStep = staffList.length > 1` (`:124`), so 0 or 1 staff skips the staff step. `ServicesStaffStep` also auto-assigns the single stylist on selection (`:163-165, 237`), so nothing downstream is left unset.
- `hairRelevant` is true when any service in the cart belongs to `HAIR_CATEGORIES = { coiffeur, barbershop }` (`:57, 121-123`). It is data-driven from the cart, not a component-level category branch, which keeps V3-D205 intact (`:55-56`).
- Step 1 forwards to `hasStaffStep ? 'staff' : 'datetime'` (`:163`), and `ServicesStaffStep` takes that as a prop rather than deciding it.

Two naming residues, neither of which changes behaviour:

- The step id is `'services-staff'` and the component is `ServicesStaffStep`, names from the pre-mockup-20 wizard where service and staff shared one step. Today it renders services only.
- `BookingWizard.tsx:21-39` still documents the retired Q55 three-step wizard with a Q56 progress indicator ("3-segment progress bar, coral fill", "eyebrow `Schritt N / 3`", "Anton step label"). The comment immediately below it (`:40-44`, mockup 20, owner-approved 2026-06-11) says the opposite and matches what renders: no progress UI anywhere. The lower comment is the live one. "Coral" and "Anton" are both retired names.

## The screen against the owner's target ladder

The ladder is the salon page's, which is the one route the owner says he likes and the only one that breaks zero floors.

| axis | target (salon page) | booking service step, measured | delta |
|---|---|---|---|
| display anchor | 30px | **20px** (the running total, in the fixed bar) | 10px under |
| body | 14px | 14px | same |
| anchor to body ratio | 2.14x | **1.43x** (20 / 14) | 0.71 under |
| distinct sizes | 5, four in the densest cluster | **7**: 20, 16.5, 16, 15, 14, 13, 12 | 2 more, inside an 8px spread |
| bold share (weight >= 600) | 30% | **76.19%** (48 of 63) | 46 points over |
| elevation levels | 3 | **1 rendered** (`whisper`); a second (`elevation-2`) exists only on the unmounted recall pill | 2 under |
| what carries emphasis | size and colour, at weight 500 | **weight**, 600 on names and 700 on prices, at one size | differs |

Plainly: this screen carries its hierarchy almost entirely in weight, at one size, which is the opposite of the ladder. Four of the seven sizes (16, 15, 14, 13) sit within 3px of each other, which is the case EMPHASIS BUDGET item (c) names as the worst one, breaking the size ceiling while buying no range.

## Screen-level measured numbers

| item | value |
|---|---|
| viewport | 390 x 844, settled, HTTP 200, no redirect |
| document height | 1906 (2.26 viewports), fully accounted for: 1698 last card bottom + 128 `pb-32` + 24 `pb-6` + 56 layout `main` bottom padding |
| distinct sizes | 7 (20, 16.5, 16, 15, 14, 13, 12) |
| distinct weights | 3 (400, 600, 700) |
| text elements | 63, of which 48 are weight >= 600 = **76.19%** |
| text elements inside `main` | 58, of which 45 are weight >= 600 = 77.59% |
| colours | 4, all achromatic: `#0A0A0A`, `#6B6B6B`, `#FFFFFF`, `#E4E4E7` |
| imagery | 0 images, 0 px, in every band |
| service rows | 11, in 4 category groups |
| cards | one signature, four instances: radius 24 + `#E4E4E7` hairline + white + `shadow-whisper` |

Screen-level floor results, gathered from the per-section files:

- **Sticky CTA (FLOORS LAW 3b): PASS.** The commit control sits in a `fixed bottom-0` bar (`ServicesStaffStep.tsx:562`), on screen at every scroll position from first paint, so no amount of content above it can bury it. This is the "booking running-summary bar" CLAUDE.md names as the existing implementation of that floor. The global `BottomNav` yields the slot rather than stacking (`BottomNav.tsx:45-50`, `HideInBooking.tsx:64-66`).
- **Imagery floor (FLOORS LAW 2): EXEMPT, not failed.** The floor's own exemption list is "forms, checkout payment step, legal, receipts", and this is a form surface: a list of selectable rows with a running total and a commit. Zero images is the correct result here, and the floor's own 2026-07-25 clarification rules out adding one to satisfy a percentage: a static image on a Solen surface is decoration, and decoration is rejected by name.
- **Display anchor (FLOORS LAW 6, >= 28px): FAIL by 8px.** Nothing in the document flow reaches 28. The only 28px type on this route's surface is the detail sheet's title (`06`, source, not measured), which is an overlay.
- **Anchor ratio (EMPHASIS BUDGET b, >= 1.8x): FAIL.** 1.43x.
- **Bold share (EMPHASIS BUDGET a, <= ~30%): FAIL, at 2.54x the ceiling.**
- **Size ceiling (<= 4) and weight ceiling (<= 2): FAIL, 7 and 3.**
- **FLOORS LAW 1 item (d), a semantic-colour moment: FAIL.** Zero chromatic pixels were measured. Combined with zero imagery, this is the condition FLOORS LAW 4 calls the dead-grey fail. The imagery exemption covers the imagery floor; it does not cover this item.
- **FLOORS LAW 4, the sunken tray: FAIL.** Grouped list content on a white substrate (`page.tsx:260`) with no photo anchor and no tray. The comment beside that class calls the same element a "sunken body", which the class contradicts.
- **FLOORS LAW 4, edge visibility: PASS.** Every card keeps the `#E4E4E7` hairline, which is the floor's option (c) for a white card on white.
- **Locked radius, hairline and shadow: PASS.** Radius 24 with border and `shadow-whisper` is the frozen grouped-list-card literal (LOCKFILE lines 558, 633-646), `rounded-btn` 99 on the CTA, `#E4E4E7` everywhere a divider appears in the document flow.
- **FLOORS LAW 9, composed from the registry: MIXED.** The service row composes the registered `ServiceDisclosureRow`; the category pills, the running total bar and the empty state are all hand-built while `TabPill` and `EmptyState` exist.
- **Trust floor (hierarchy-density-05): does not bind on this step.** It fires on a paid commit action, and "Weiter" takes no money. It binds on the pay step, in another folder.
- **Touch targets: one FAIL.** The `ToggleCircle` select control is 36x36 with no padding around it, 8px under the 44px floor. Everything else measured or read is 44 or more, except the sheet's 40px close control.

## Not yet measured

Everything below is absent from `_measured/booking-service.json` and is either derived from source in the section files or simply unknown. Nothing here was re-measured, per the brief.

1. **The detail sheet (`06`)**, all values. It is closed at rest.
2. **The zero-services state (`07`)**, all values. The measured salon has 11 services.
3. **The selection recall pill (`05`)**, all values. Its mount condition was false (empty cart).
4. **The running total bar's own box.** Only its ink CTA child (113x44) is in the JSON; the bar height of about 68px is derived from source.
5. **The category pill row's own box.** Derived at top 64, height 65 from the two bands that bracket it. The script keeps only landmark tags and heading-leading elements (`scripts/measure-sections.mjs:193-194, 213-223`).
6. **The active category pill's box.** Excluded by the script's 60px minimum card width (`:280`); "Bart" is the shortest label and the three captured pills measure 66px.
7. **The expanded row description.** Every row is collapsed at rest, so the 14px description paragraph never entered the DOM.
8. **Chevron presence and count.** SVG is skipped by the script (`:214`), so how many of the 11 rows carry a description affordance is unknown.
9. **`ToggleCircle` boxes.** 36px, under the same 60px card floor.
10. **The selected-row wash** (`bg-s-bg-sunken/60`) and every other selected state. Nothing was selected.
11. **The disabled CTA's rendered opacity.** The script reads `backgroundColor`, not `opacity`, so the measured ink is the token and not the pixels.
12. **The inline error state** (`text-s-error`, `ServicesStaffStep.tsx:526`).
13. **Desktop and the `md:` breakpoint.** The service name bumps to 16px there (`:435`) and the bar's inner column caps at `max-w-2xl`. The measurement is 390 only.
14. **Worst-case content (FLOORS LAW 1 item f).** The longest real service and salon names, a full-length description, and the French and Italian strings against the 113px CTA and the truncating step title.
15. **On-screen trapped dead space at maximum scroll.** The document carries 208px below the last card, but how much of the viewport is empty at the bottom of the scroll is not measured.
16. **The identity of 5 text nodes.** The body carries 63 visible text elements while the roles inside `main` sum to 58, so 5 sit outside `main` on this route. The JSON does not name them and I did not re-run the measurement to find out. Both denominators are given above; the bold-share verdict is the same either way.

## Reference set

- `_design-system/sections/_measured/booking-service.json` , the live measurement every number traces to
- `_design-system/sections/booking-service/CORPUS.md` , the cross-app research this extends, 8 apps, with the Solen gap named in its section 8
- `_design-system/sections/salon-detail/README.md` and its numbered files , the template shape. Note that `salon-detail/19-services-sheet.md` specs `SalonServicesSheet`, which `npm run exists "booking service"` returns as a GRAVEYARD entry: removed 2026-07-19 as a duplicate of this very step, with "Alle ansehen" now deep-linking here. That file describes a component that no longer exists.
- `public/_mockups/liftup-booking-services-tiered/index.html` , the owner-approved 2026-07-18 mockup this screen was built to
- `public/_mockups/restraint/booking-empty-services.html` , the approved mockup behind `07`
- Graveyard hits for this surface: `SalonServicesSheet` (2026-07-19) and the borderless "chrome off, density stays" Model B (2026-07-18, reverted because the carded booking-services style won). Neither is re-proposed anywhere in this folder.

## Locked decisions affecting this route

- **Mockup 20, owner-approved 2026-06-11** , Fresha bones: services-only step 1, staff as its own step, no progress UI anywhere, back arrow plus X as the whole navigation
- **Mockup 26, owner-approved 2026-06-12** , the compact 16.5px step title, replacing a 30px page title that "read unbalanced"
- **Owner 2026-06-12** , every step starts scrolled to the top
- **Owner 2026-07-18** , the tiered carded service rows, the count-up total, the draw-in CTA arrow, the white recall pill
- **Owner 2026-07-19** , grouping by the salon's own taxonomy, pills that scroll instead of filter, and the ink-fill selected pill that overrides the locked gray-selected contract for this surface only (`selected-ok`, `ServicesStaffStep.tsx:493`)
- **Owner decision 10, 2026-08-09** , the service row extracted into `ServiceDisclosureRow` and shared with the salon page
- **LOCKFILE lines 633-646, owner-approved 2026-06-11** , the grouped list-card grammar this screen matches literally
- **hierarchy-density-06 / FLOORS LAW 3b** , the sticky-CTA floor, whose reference implementation is this screen's bottom bar
- **V3-D205** , no component-level category branches, which is why the hair step is decided from cart data
