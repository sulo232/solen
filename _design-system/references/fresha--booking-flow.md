# Fresha booking flow (services -> professional -> time -> review)

Exists-check: EXTENDS `public/_pixel-refs/fresha/booking-services/` (25 screenshots already
captured live on 2026-06-something, no SPEC.md was ever written for that folder, confirmed by
`find` returning zero `.md` files there this pass). This file is the SPEC.md that folder was
missing, now sourced additionally from Mobbin so the anatomy is cross-checked against a second
capture. Not a duplicate of `_design-system/references/continue-and-recently-viewed--home.md`
(home surface) or `project_booking_flow_canonical.md`-style memory notes (Solen's OWN locked flow
order, a different document with a different job: that one says WHAT ORDER Solen's steps run in,
this one says HOW FRESHA DRAWS each step).

## Identity

- Brand: Fresha. Platform: web (desktop-width captures only; Fresha's own iOS review/confirm step
  also captured for comparison). Flow name in Mobbin: "Booking an appointment"
  (https://mobbin.com/flows/0ae100c9-f9bb-4a81-8837-772fd8ac330c, 22 screens) plus the standalone
  screen search that returned individual steps directly.
- Capture date: 2026-09-05. Method: Mobbin MCP (search_screens for high-confidence single-screen
  pairing, search_flows for sequence context only, since the flow tool's inline images are an
  evenly-spaced sample and are NOT guaranteed to index-match its own screen_id list — this is the
  documented Mobbin limitation called out in the task brief: order-only, no timing).
- Screens used, each independently image-verified via search_screens/search_flows:
  - Venue page pre-booking: sample venue page with Book now sidebar (verified, same page family as
    `public/_pixel-refs/fresha/booking-services/00-venue.png`, which already exists locally).
  - Select services (Waxing tab open, chip row of category tabs, "+"-per-row, sidebar order
    summary, "Continue" button disabled/grey until a service is picked) (verified).
  - Select time (breadcrumb "Services > Professional > Time > Confirm", professional filter
    dropdown, date-picker week strip, scrollable time-slot list, sidebar order summary + Continue)
    (verified).
  - Review and confirm, web (payment form: Name on card, Card number, Expiry/CVV, ZIP, "Pay
    securely with" card-brand row, Deposit policy paragraph, Additional terms paragraph, Booking
    notes textarea, sidebar Total / Pay now (green) / Pay at venue, black "Confirm" button)
    (verified, three progressive screenshots of the same step: empty, scrolled, notes filled).
  - Review and confirm, iOS (Total $0, Discount code field + Apply, Payment method row "Pay at
    venue", Notes textarea, sticky bottom bar showing "$0 / 1 service - 1 hour 30 mins" + a
    three-dot "..." button) (verified).

## Philosophy

Fresha's flow is a strict LINEAR WIZARD: a breadcrumb names the four steps (Services, Professional,
Time, Confirm) and the current step is bold-black while future steps stay grey, so the user always
knows how many taps remain. A persistent order-summary card on the right (or a sticky bottom bar on
mobile) repeats venue name, chosen date/time, service, and running total on every step, so nothing
about the transaction is ever off-screen. The "Continue" or "Confirm" button lives inside that same
summary card/bar, not floating separately, so total and commit action are always visually paired.

## Measured (per step)

### Step: Select services
- Category tabs as a horizontal chip row directly under the "Select services" H1 (verified).
- Each service row: name (bold) + duration (grey, under name) + price (grey, under duration) on the
  left, a round "+" button on the right; tapping "+" moves it into the sidebar summary (verified).
- Sidebar/summary card, right column desktop: venue photo thumbnail + name + rating, "No services
  selected" placeholder text, "Total: free", a disabled grey "Continue" button until 1+ service is
  picked (verified).

### Step: Select professional
- Not independently re-verified this pass (booking-services/13-step2.png and 14-step2-scrolled.png
  already exist locally per the folder listing; tag: assume that pre-existing local capture is
  still accurate, not re-checked against a fresh Mobbin or live pull this session).

### Step: Select time
- Breadcrumb row: "Services > Professional > Time > Confirm", current step bold black, others grey
  (verified).
- "Select time" H1, a professional-filter pill/dropdown directly under it defaulting to the chosen
  staff member's name (verified).
- Month/year label + left/right arrows, then a horizontal row of date circles (selected date =
  solid purple-filled circle, today/available = outline, unavailable = greyed and unclickable)
  (verified).
- Below the date strip: a vertical scrollable list of time-slot rows, each a full-width bordered
  rectangle with the time centered, no price repeated per slot (verified).
- Sidebar summary, same card as the services step, now populated: venue block, calendar-icon date
  line, clock-icon time+duration line, service name + price row, Total, "Continue" button now
  enabled (verified).

### Step: Review and confirm (web)
- Breadcrumb same as above, "Confirm" now bold (verified).
- "Review and confirm" H1, then a payment FORM directly in the main column: "Payment method"
  sub-heading, Name on card, Card number (with a Visa mark inline right), Expiry date + Security
  code as a two-column row, ZIP/Postal code, then a "Pay securely with" row of card-brand icons
  (verified).
- "Deposit policy" heading + one paragraph naming the exact deposit amount (verified).
- "Additional terms and conditions" heading + one paragraph (refund/reschedule terms, a lead time
  in hours) (verified).
- "Booking notes" heading + a textarea placeholder "Include comments or requests about your
  booking" (verified).
- Sidebar, unchanged position/shape from prior steps: venue block, date, time+duration, service +
  price, "Total", then TWO price lines stacked: "Pay now" in GREEN bold with its amount, "Pay at
  venue" in grey with its amount, then a full-width black "Confirm" button (verified).

### Step: Review and confirm (iOS)
- No payment form fields shown in this capture (assume: a "Pay at venue"-only booking, no deposit
  required, so the card-entry fields Fresha's web version shows never render here) (verified for
  what IS shown, tag: assume for why the fields are absent).
- "Total $0" bold black, then "Discount code" field + a black "Apply" button, "Payment method" row
  showing a storefront icon + "Pay at venue" (verified).
- "Notes" heading + textarea, pre-filled in one capture with "Can't wait for the appointment!"
  (verified, this is placeholder/demo content, not a real user's note).
- Sticky bottom bar (does not scroll with the page): left side "$0 / 1 service - 1 hour 30 mins",
  right side a black rounded "..." button (this is the CONTINUE affordance, verified though its
  exact end-state label past the "..." was not captured).

## Port map (Fresha element -> Solen file)

- Whole wizard -> `components-legacy/booking/BookingWizard.tsx` (orchestrator, per project memory
  "booking flow LOCKED to mockup 20: services -> Staff -> Zeit(->Haare) -> ...").
- Select services -> `components-legacy/booking/ServicesStaffStep.tsx`.
- Select professional -> `components-legacy/booking/StaffStep.tsx`.
- Select time -> `components-legacy/booking/DateTimeStep.tsx`, which per this project's own lock
  already uses the single shared `DateTimePicker` primitive
  (`app/[locale]/_components/primitives/DateTimePicker.tsx`) rather than bespoke date UI (V3-D445).
  Fresha's date-circle-strip + separate time-slot list matches this primitive's `dateLayout` strip
  mode already documented in `_design-system/components/DateTimePicker.md`.
- Extra hair-detail step (Solen-specific, no Fresha analog seen) -> `components-legacy/booking/HairStep.tsx`.
- Review and confirm -> `components-legacy/booking/PayConfirmStep.tsx` +
  `components-legacy/booking/BookingPaymentForm.tsx` for the card-entry fields, and
  `components-legacy/booking/GuestBookingForm.tsx` for the guest-checkout path.
- Persistent order-summary card/sticky bar -> the project's own booking running-summary bar,
  documented in `RESTRAINT_TEST.md` per project memory `project_walkin_vision` and the FLOORS LAW
  hierarchy-density-06 sticky-CTA requirement; this Fresha capture is independent confirmation that
  a persistent summary + inline commit button is the right shape to copy, not a new proposal.

## Conflicts (Fresha placement vs a Solen lock)

- CONFLICT [green price emphasis]: Fresha bolds the "Pay now" amount in solid GREEN to distinguish
  it from grey "Pay at venue". Solen's semantic-color rule (CLAUDE.md taste rule 4/FLOORS LAW)
  reserves green for success/confirmation/availability states, not for a price-comparison emphasis
  device. Owner call: use ink-bold + a neutral label instead of green for "due now," reserving green
  for an actually-completed payment state (which matches this project's own BookingConfirmation.tsx
  comment: "green 'confirmed' text when it is actually 'paid'").
- CONFLICT [breadcrumb-shaped step indicator]: Fresha's "Services > Professional > Time > Confirm"
  row visually resembles the breadcrumb component this project has an explicit, dated rule against
  on `/{city}/{category}` routes (CLAUDE.md design contract, `nav` row: "sub-page nav is single,
  the global Breadcrumb is excluded on `/{city}/{category}`"). That rule targets PAGE navigation
  breadcrumbs, not a booking-wizard step indicator, which is a different job (progress, not
  history), but the visual similarity is worth flagging so nobody reads porting this as
  reintroducing the banned breadcrumb. Owner call: confirm a step-indicator here is fine (it likely
  is, different job), or pick a different step-indicator shape (dots, a progress bar) to avoid any
  visual confusion with the banned pattern.
- No conflict on the persistent summary card: this already matches Solen's own locked sticky-CTA
  and DateTimePicker patterns, so this step is closer to confirmation than to redesign.
