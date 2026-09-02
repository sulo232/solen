<!-- exists-check: extends _design-system/sections/checkout-pay/CORPUS.md (the cross-app research half,
     52 iOS checkout compositions, read in full before writing) and applies the shape of
     _design-system/sections/salon-detail/README.md, as _design-system/sections/booking-service/
     already does for step 1. Net-new vs scripts/measure-sections.mjs and
     _plans/DESIGN_CONSISTENCY_2026-08-27.md item S4. `npm run exists "pay confirm"` returns 2 hits:
     PayConfirmStep.tsx and one graveyard entry, app/[locale]/checkout/page.tsx, a 748-line
     standalone Stripe checkout removed 2026-07-18 as an unreachable duplicate of this very step.
     Nothing in this folder re-proposes it. -->

# Booking pay step (Bestätigen & Zahlen) section docs

Per-section specs for the paid commit step of the booking flow. Each file follows the same shape as `_design-system/sections/salon-detail/*.md`: Reference, Component, Layer, Layout with an ASCII sketch, Measured, Tokens, Interaction, **Against the floors**, Intentional deviations, Empty state, Provenance.

Route: `/de/salon/cuts-and-culture/booking` (`app/[locale]/salon/[slug]/booking/page.tsx`, rendering `BookingWizard` then `PayConfirmStep`). Measured live at 402x844, settled, HTTP 200, `documentHeight` 1081.

**Note the corpus's scope before reading it against these numbers.** `CORPUS.md` maps its 52 field screens onto `app/[locale]/walk-in-pay/page.tsx` as well as this step, and two of its Solen-specific findings are about that other route. Where a corpus claim and a measurement here disagree, the reason is usually the surface, and it is named in the file.

## The trust floor, checked against the rendered DOM

FLOORS LAW item 8 (hierarchy-density-05, LOCKFILE §17.6) gates any screen with a paid commit action, and it is checked **before** the finished-screen pass matters. All three conditions were checked against the live DOM at 402x844, scrollY 0, not against source strings. The named prior failure this exists to catch is `app/[locale]/walk-in-pay/page.tsx`, which defined `cancelPolicy` in all four locale objects with zero JSX render sites, fixed 2026-07-27.

| condition | verdict | evidence, in one line |
|---|---|---|
| **(a) the total price is broken down** | **PASS** | Line item "Herrenschnitt / CHF 45" at doc y 387, a rule, then "Total / CHF 45" at y 418 with the amount at 22px / 700. Rendered total equals rendered line item, so nothing is added after the fact. Full evidence in `03`. |
| **(b) the cancellation term renders above the commit** | **PASS on the letter, with two caveats** | Real JSX with live text: "Kostenlos bis 24h vorher stornieren." at doc y 870, `compareDocumentPosition` puts it before the button in DOM order. Full evidence in `06`. |
| **(c) who you are booking with is above the commit** | **PASS** | "Cuts & Culture" at y 81 with its cover photo and address, "Jonas" at y 152 with an avatar. Both above the button in position and in DOM order, and both inside the first viewport. Full evidence in `02`. |

**The two caveats on (b), because a pass with caveats is not a clean pass:**

1. **It is below the fold while the button is not.** The term sits at doc y 870, 26px past the 844px fold, while the commit button is pinned at viewport y 776 at every scroll position. The button is reachable before the term has ever been on screen. 237px of scroll exists and the term does come into view at full scroll. The floor's words are "renders in the DOM above the commit button", and it does; the ordering is right and the visibility is not.
2. **The rendered term states only the free half of the policy.** The salon row carries `late_cancel_fee_percent = 50`, so cancelling inside 24 hours costs half the price, and no rendered string on this screen says so. Every app in the corpus that takes real money with a real penalty names the penalty.

**VAT, and why its absence is a pass rather than a gap.** The floor says "VAT where applicable". The row is gated on `salons.vat_registered`; `cuts-and-culture` has it false with a null VAT number, so no VAT is applicable and none is due. A rendered-body search for MWST, Mehrwertsteuer, VAT, "inkl." and "exkl." returned nothing, which matches. **0 of the 28 seeded salons has `vat_registered = true`, and this pass was read only, so this run is not evidence that the VAT row renders correctly for a registered salon.** That remains unproven.

**One adjacent defect, measured on the same screen and not one of the three conditions.** The commit label reads "Buchung bestätigen" with "Jetzt online bezahlen" selected, and it still reads "Buchung bestätigen" after tapping "Zahlung im Salon", verified before and after the tap. `PayConfirmStep.tsx:725-731` keys the label on `paymentMode` (the salon's setting) and never on `payChoice` (the customer's choice), so on any `at_salon` salon the "Weiter zur Zahlung CHF 45" branch is unreachable, including for the customer who is about to be sent to a card form. Full detail in `07`.

## How this screen was reached, and in which state

**The step has no URL.** `?step=pay` returns step 1. The wizard was driven through every preceding step: add "Herrenschnitt", `Weiter`, pick "Jonas", `Weiter`, pick "Mo 31 Aug", pick "10:00", `Weiter`, then **"Überspringen" on a fifth step**, "Ihre Haare", which is inserted between the date step and this one because every service at this salon is category `barbershop` and `HAIR_CATEGORIES` contains it. That step is not one of the four in this assignment and is not specced here.

Three facts from `reachedBy` that change how the numbers read:

1. **Logged in, and not by anything the run did.** The browser context already carried a Supabase session cookie for the seed test-owner fixture, which renders on this screen as the name "QA Test". So `isLoggedIn` was true and the **guest branch was never rendered**. To reproduce deliberately: `GET /api/dev/login?to=/de/salon/cuts-and-culture/booking` first.
2. **The salon's payment configuration decides half this screen**, and it was read from the live database, read only: `payment_mode 'at_salon'`, `accepts_online_payment true`, `vat_registered false`, `vat_rate 8.1`, `cancellation_window_hours 24`, `cancellation_fee_type 'free'`, `free_cancel_hours 24`, `late_cancel_fee_percent 50`.
3. **Nothing was committed.** "Buchung bestätigen" was never pressed. No booking was created and nothing was written.

Clicks were synthetic `HTMLElement.click()` because the pane's `left_click` timed out three times, so no hover, press or `focus-visible` state was exercised.

## Sections (document order)

| # | File | Section | Component |
|---|---|---|---|
| 1 | `01-step-chrome.md` | Back, step title, exit | `booking/BookingWizard.tsx:186-218` |
| 2 | `02-summary-card.md` | Salon, stylist, service, when, with three Ändern links | `booking/PayConfirmStep.tsx:374-458` |
| 3 | `03-price-card.md` | Line items, VAT slot, Total | `booking/PayConfirmStep.tsx:461-504` |
| 4 | `04-contact-block.md` | Contact summary or fields, guest form | `booking/PayConfirmStep.tsx:516-582` |
| 5 | `05-payment-choice.md` | Payment options, and the voucher field beside them | `booking/PayConfirmStep.tsx:585-660`, `:673-703` |
| 6 | `06-cancellation-banner.md` | The cancellation term | `booking/PayConfirmStep.tsx:706-711` |
| 7 | `07-commit-bar.md` | Fixed ink commit | `booking/PayConfirmStep.tsx:716-732` |

Band map at 402x844, from the JSON:

```
 y    0  +-------------------------------------------+
      12 |  01  back / title / exit          h = 52  |
      64 |  02  summary card       370 x 286         |
     350 |            20px gap (space-y-5)           |
     370 |  03  price card         370 x 109         |
     479 |            20px gap                       |
     499 |  04  contact card       370 x 140         |
     639 |                                           |
     686 |  05  online option      370 x 78  SELECTED|
     774 |  05  in-salon option    370 x 76          |
     870 |  06  cancellation line  (below the fold)  |
    1081 +-------------------------------------------+
         |  07  fixed bar [0, 760, 402, 84], always on screen
         |      fold at 844: covers the lower half of the
         |      second option and sits 26px above the term
```

## Folded elements

Per the brief, wrappers and the all-containing landmark are folded into their parent rather than given a band of their own:

- **Band index 0 of the JSON is `main`, the whole document.** On this screen the script kept only two bands, `main` and the nav row, because every band below `main` is a plain `<div>` with no landmark tag and no direct-child heading. **All seven section files therefore take their numbers from `main`'s text and card lists plus the separate `bandAnatomy` reads**, not from bands of their own. That is stated in each file.
- **The route has two nested `main` elements**, the layout's and the page's own (`page.tsx:261`). Band 0 carries the layout's className; the page's `main` was dropped by the script's dedupe rule. The page's `main` contributes the geometry every band inherits: `px-4` (the measured left 16 and width 370), `pt-3`, `pb-6`, `max-w-2xl`.
- **Folded with no band of their own:** `BookingWizard`'s `<div className="w-full">` and its `AnimatePresence` step-swap wrapper, `PayConfirmStep`'s `<div className="space-y-5 pb-28">` (`:368`, whose `space-y-5` is the measured 20px gaps between cards and whose `pb-28` is the 112px that lets content clear the fixed bar), the `motion.div` ENTER-RECIPE wrappers on the two cards, the `<>` phase fragment at `:509`, and the page's `<div className="min-h-screen bg-white">`.

## The screen against the owner's target ladder

| axis | target (salon page) | pay step, measured | delta |
|---|---|---|---|
| display anchor | 30px | **22px** (the Total) | 8px under |
| body | 14px | 14px | same |
| anchor to body ratio | 2.14x | **1.57x** | 0.57 under |
| distinct sizes | 5, four in the densest cluster | **9** (22, 16.5, 16, 15, 14.5, 14, 13, 12.5, 12) | 4 more, and seven of the nine sit inside a 4px band |
| bold share (weight >= 600) | 30% | **59.26%** (16 of 27) | 29 points over |
| elevation levels | 3 | **2** (`shadow-whisper` on the back circle, `shadow-elevation-1` on two of the three cards) | 1 under |
| what carries emphasis | size and colour, at weight 500 | **weight**: every label, name and title is 600 and only the Total steps in size | differs |

**Nine sizes is the highest count of the four screens in this pass, and seven of them are packed into 12 to 16px.** 16, 15, 14.5, 14, 13, 12.5, 12 are seven distinct sizes inside a 4px range, which is precisely EMPHASIS BUDGET clause (c): breaking the ceiling while buying no hierarchy. The 14.5 and 12.5 values are the tell, since each sits half a pixel from a size already in use on the same screen.

`CORPUS.md` section 4 says checkout "sits inside Solen's <= 4 ceiling without effort, because the screen has little content variety to begin with", counting roughly 4 sizes each on Fresha, Airbnb and Uber. Measured, Solen's is at 9.

## Screen-level measured numbers

| item | value |
|---|---|
| viewport | 402 x 844, settled, HTTP 200, no redirect |
| document height | 1081, so 237px of scroll |
| distinct sizes | **9, all of them visible.** One of the two 16px sources is the sr-only skip link, but the other is real: the tel input renders at 16px, the iOS no-zoom floor |
| distinct weights | 3 (700, 600, 400). No 500 anywhere, which is the weight the owner's ladder carries emphasis at |
| text elements | 27, of which 16 are weight >= 600 = **59.26%** |
| colours | ink `#0A0A0A`, ink-2 `#6B6B6B`, white, accent `#276EF1`, success `#16A34A` (one 14px glyph), hairline `#E4E4E7`, star `#FFC32B` (SVG, unmeasured) |
| imagery | 2 images, 3961 px: a 44x44 salon cover and a 45x45 stylist avatar |
| cards | 6 signatures: two `shadow-elevation-1` cards at radius 16, one flat card at radius 16, two option cards at radius 12, one 48px input at radius 12, one ink pill |

Screen-level floor results:

- **Trust floor: PASS, PASS with caveats, PASS.** Table above. This is the gate that matters most on this screen and it is the one it clears.
- **Sticky CTA (FLOORS LAW 3b): PASS.**
- **Display anchor (FLOORS LAW 6): FAIL by 6px**, and it is a live owner-level collision rather than a simple defect. `CORPUS.md` section 7 item 10 states both sides: only 2 of 52 field checkouts carry a display anchor, so the field agrees with the build, and it recommends promoting the Total to >= 28px rather than writing a checkout exemption into the floor. Unactioned as of this measurement.
- **Anchor ratio (EMPHASIS BUDGET b): FAIL at 1.57x.**
- **Bold share (EMPHASIS BUDGET a): FAIL at 59.26%, about 2x the ceiling.**
- **Size ceiling (<= 4) and weight ceiling (<= 2): FAIL, 9 and 3.**
- **EMPHASIS BUDGET (c): FAIL.** Seven sizes inside 4px.
- **Imagery (FLOORS LAW 2): EXEMPT by name.** The floor's exemption list is "forms, checkout payment step, legal, receipts". It carries two real photographs anyway, both data-driven.
- **FLOORS LAW 1 (d), a semantic-colour moment: PASS.** The star in the rating row and the green shield on the cancellation line.
- **FLOORS LAW 4, the sunken tray: FAIL.** Three stacked cards on a white body, no tray, no photo anchor. The corpus notes that every card-dialect app in its own sample sits its cards on a tinted page.
- **FLOORS LAW 4, edge visibility: PASS by option (c)** on every card.
- **Locked radius: MIXED.** 16 on the three cards, correct. 12 on the two payment options, which is the input radius, not a card radius. 12 on the input, correct. 9999 on the commit, correct.
- **Locked selected state: DIVERGES by a dated owner call.** The payment options select with a 2px ink border, mockup 24d, 2026-06-12. Tier 1 over tier 5. This is the product's third selected-state vocabulary after the gray fill and the blue booking date.
- **Elevation consistency: FAIL within the screen.** Two cards elevated, one flat, same role, no rule separating them.
- **Touch targets: two FAILs.** The three "Ändern" links measure 46 x 20; the contact block's "Ändern" is an unpadded 13.5px link in a variant that did not render. Everything else passes: options 78 and 76, input 48, commit 52, chrome 44.
- **FLOORS LAW 8, the same thing looks the same everywhere: FAIL twice.** Against the previous step, this bar is 84 tall with a 338 x 52 button where the date step's is 73 with a 370 x 48 button (full table in `booking-staff/03-continue-bar.md`). Against the next screen, the same three booking facts render at 15px / 600 with 13px secondaries here and at 14.5px / 600 with 12.5px secondaries on the confirmation.
- **FLOORS LAW 9: MIXED.** `Avatar`, `Image`, `Spinner` and `GuestBookingForm` are composed; the summary rows, the option cards and the bottom bar are hand-built.
- **NO DECORATION (owner 2026-08-19): one hit.** `formData.promoCode` is initialised to `''` in `lib/booking-context.tsx:32` and read once at `PayConfirmStep.tsx:263`, where it is posted to `/api/bookings`. No file in the booking flow ever writes it, so it is always null on the wire. The server accepts a promo code the UI cannot set.

## Not yet measured

1. **The guest branch**, `GuestBookingForm` with name, email and phone. The session was already logged in.
2. **The `deposit` and `prepay` payment branches.** The prepay branch carries a **28px** amount, which would be the only element in the whole booking flow to clear the display-anchor floor. Source value, never rendered.
3. **The Stripe card phase** (`phase: 'pay'`), which replaces everything from the contact block down.
4. **The VAT row.** No seeded salon is VAT registered.
5. **The voucher field**, its error state and its applied green savings line.
6. **The complete-contact variant** of `04`, and its 13.5px "Ändern" link.
7. **Every hover, press and `focus-visible` state**, plus the `isSubmitting` spinner and the disabled commit.
8. **The inline error line** for each of the four refusal paths in `handleConfirm`.
9. **A multi-service cart**, which changes both the summary card and the price ladder.
10. **Desktop and the `md:` breakpoint.**
11. **Worst-case content (FLOORS LAW 1 item f).** The longest salon and service names against the truncating 15px lines, and the French and Italian strings against the fixed-width payment option titles and the commit label.
12. **The star SVG**, skipped by the measurement script.

## Reference set

- `_design-system/sections/_measured/checkout-pay.json` , the live measurement, including the three trust-floor verdicts with their DOM evidence and the salon's payment configuration
- `_design-system/sections/checkout-pay/CORPUS.md` , 52 iOS checkout compositions plus 34 booking-domain screens, whose section 7 splits Solen's differences into "deliberate and correct", "genuine gaps" and one open owner-level collision
- `_design-system/sections/confirmation/` , the screen one tap after this one, which renders the same three facts through a different type ramp
- `_design-system/sections/booking-service/README.md` , the shared addressability finding
- `app/[locale]/walk-in-pay/page.tsx` , the other pay surface, which the corpus also maps and which two of its findings are about

## Locked decisions affecting this route

- **Mockup `booking-pay-step`, owner-approved 2026-06-11** , white icon-led summary rows, Ändern links back to the owning step, price card ending in a total
- **Mockup 24c/24d, owner-approved 2026-06-12** , online above in-salon, 2px ink wrap on the selected option, no radio dots, the cancellation banner below the payment block, the sticky ink commit
- **Mockup 28/28b, owner-approved 2026-06-12** , complete contact data shows a summary row, not a pre-filled form
- **Phase D** , the salon's `payment_mode` drives the step; online is only offered when the salon can take it
- **Owner 2026-06-12 and 2026-07-02** , `resetForm` plus `router.replace` so browser back cannot re-book
- **Owner 2026-08-21** , the voucher field is hidden where the salon has no redeemable voucher
- **hierarchy-density-05 / LOCKFILE §17.6** , the trust floor
- **PBV total-price rule** , statutory tier 2, above any taste axis
- **Taste rule 3 / V3-D192-fix** , the one primary commit stays ink
