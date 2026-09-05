# Fresha booking payment / confirm step ("Review and confirm")

Exists-check: net-new. No `fresha--payment-step.md` exists under `_design-system/references/`.
`fresha--booking-flow.md` (services/staff/date/time steps) explicitly stops before the pay step,
so this file is the one it does not cover. `fresha--confirmation.md` covers the screen AFTER this
one (post-payment receipt). On the Solen side, `components-legacy/booking/PayConfirmStep.tsx`
(786 lines) is the live implementation this file feeds; its own file-header comment already
documents a five-part anatomy (see Port map), which was read in full and cross-checked against
this capture rather than assumed.

## Identity

- Brand: Fresha. Surface: iOS customer app, "Review and confirm" screen, the last step of the
  booking wizard before a booking is created.
- Method: Mobbin MCP only, iOS platform. No live fresha.com capture attempted this pass. Every
  value below is a screen I looked at directly, tagged verified, expect, or assume.
- Capture date: 2026-09-05.
- Primary sources (three progressive captures of the same screen, in different fixture states):
  - Minimal state (discount/payment fields empty, no cancellation copy visible in this crop):
    https://mobbin.com/screens/16a12447-7a3a-463a-a1a1-05dfaa242d8a (verified, viewed image)
  - With the salon summary card + date/time rows + a service line item visible above the totals:
    https://mobbin.com/screens/0ef6b0b2-ed22-4c29-bb2c-74719882f58f (verified, viewed image)
  - With the Cancellation policy paragraph visible in place of the discount-code block (a
    different scroll position or fixture of the same screen shape):
    https://mobbin.com/screens/b9ae2648-6ffb-4444-a0c1-d86d0852bcd5 (verified, viewed image; that
    all three are the SAME underlying screen at different scroll/fixture states is tag expect,
    each individual row's content is independently verified)

## Philosophy

This screen answers one question, "what am I about to agree to," and answers it in strict top to
bottom order: who and when (salon + date/time), what and how much (service + total), what happens
if I change my mind (cancellation policy), how I pay (method), anything I want to add (notes), then
one commit action. Price is never the first thing shown, context is. The commit button is sticky
and carries the price again inline with the item count, so the number on the button always matches
the number the customer just reviewed above the fold.

## Measured (ordered element list, iOS, top to bottom)

1. Top chrome: back arrow (left) + "Review and confirm" as a large bold headline directly under
   it (not in the nav bar itself) + an X close icon (right), same row as the arrow (verified).
2. Salon summary card: small square photo thumbnail, salon name (bold), a star-rating line with
   review count in parentheses ("5.0 ★★★★★ (83)"), then the street address, all inside one
   borderless block, no card edge drawn around it (verified).
3. Date row: a small calendar-glyph icon + the date, plain text, no card ("Sat, 21 Sept 2024")
   (verified).
4. Time row: a small clock-glyph icon + the time range and duration, plain text, directly under
   the date row ("12:15-1:45pm (1 hour 30 mins duration)") (verified).
5. Service line item: service name + duration on the left ("Jet Plasma / 1 hour 30 mins"), price
   on the right; in the discounted-fixture capture the original price is shown with a strikethrough
   next to the discounted one (verified).
6. Hairline divider, then "Total" as its own bold row, price right-aligned (verified).
7. Below Total, two more price-context rows in the minimal-state capture: "Pay now" (in a green/
   success tint) and "Pay at venue" (in a neutral grey), both showing their own amount, i.e. the
   TOTAL is split into what's charged now vs. at the venue directly under the total (verified).
8. "Discount code" section: a labelled text input with placeholder "Enter discount code" + a
   separate "Apply" button to its right, same row (verified).
9. "Cancellation policy" section, only visible in the third capture, appears in the SAME
   vertical position the discount-code block occupied in the other two, i.e. tag: assume these are
   mutually exclusive states of one slot (a booking close enough to the cancellation window shows
   the policy warning here instead of a discount-code field), not two permanently stacked sections.
   Content: heading "Cancellation policy" + one plain sentence with the hour count bolded, "Please
   avoid cancelling within 72 hours of your appointment time" (verified, content only; the
   mutual-exclusivity claim is tag: assume).
10. "Payment method" section: heading, then one selectable row showing the current method, icon
    (a small storefront glyph for "Pay at venue") + label, no radio dot visible in this capture
    (tag: assume more than one method exists and this row expands to a picker on tap, not proven
    from a static screen).
11. "Notes" section: heading + a multi-line textarea, placeholder "Include comments or requests
    about your booking" (verified).
12. Sticky bottom bar, always visible: left side shows the running price + a one-line summary of
    what's booked ("$0 · 1 service · 1 hour 30 mins", or in the cancellation-policy fixture,
    "Tue, Sep 24, 2024 at 10:00 AM · Updated date & time"), right side is a single filled black
    pill button, "Confirm" (verified, both left-side variants; the button itself is identical
    across all three captures).

## Port map (Fresha element -> Solen file)

- Whole screen -> `components-legacy/booking/PayConfirmStep.tsx` (786 lines), wizard step 3 of 3,
  whose own file-header comment already specifies: (a) eyebrow "Schritt 3 / 3" + headline
  "Bestätigen & Zahlen", (b) a summary card (service + stylist + date/time + tabular price),
  (c) a cancellation-policy mini-banner (warm-amber background, one sentence), (d) a payment-method
  selector (radio chips: Karte / Vor Ort), (e) a sticky "Buchen · CHF <total>" primary CTA.
- Fresha's salon-card-then-date-then-time as three separate unboxed rows -> Solen's summary card
  (b) already bundles service + stylist + date/time + price into ONE card rather than three loose
  rows; this is a genuine anatomy difference (card vs. unboxed rows), not a missing element.
- Fresha's Cancellation policy placement (its own section, appears in place of the discount-code
  slot) -> Solen's mini-banner (c) already sits directly below the summary card, i.e. ABOVE the
  payment-method selector, which matches Fresha's ordering (policy before payment method) even
  though the visual treatment (amber banner vs. a plain heading + paragraph) differs.
- Fresha's Payment method row (single current method + implied picker) -> Solen's (d) is already a
  two-way radio-chip choice (Karte / Vor Ort) rendered inline, not a single row that expands, i.e.
  Solen's version is already more explicit than what this capture shows of Fresha's.
- Fresha's sticky bar (price + one-line summary, left; Confirm, right) -> Solen's (e) sticky
  "Buchen · CHF <total>" CTA already exists and already satisfies the FLOORS LAW sticky-CTA
  floor (hierarchy-density-06) and the Trust floor for commit actions (price breakdown +
  cancellation term + who you're booking with, all above the button per that floor's three
  requirements): confirmed live in this repo's own history (LOCKFILE-cited fix,
  `app/[locale]/walk-in-pay/page.tsx` was the walk-in surface caught missing this, not this one).
- Fresha's Discount-code field -> not confirmed present anywhere in `PayConfirmStep.tsx` from this
  pass (the file-header's five-part anatomy names no discount/voucher slot on this screen); if a
  discount/voucher redemption exists elsewhere in the flow, it was not located in this file and is
  out of scope for this capture to confirm either way.

## Conflicts (Fresha placement vs a Solen lock)

- CONFLICT [cancellation-banner colour]: Fresha renders its cancellation policy as a plain heading
  + paragraph, no coloured banner at all. Solen's `PayConfirmStep.tsx` uses a WARM-AMBER
  background banner for the same content (its own file-header comment, line 40). Taste rule 3
  reserves warm/cream tones as generally banned ("no warm cream") though this specific case is a
  semantic WARNING tint (`s-warning` family), which the design contract's semantic-color table
  does authorize as a legal role for a warning banner, not a decorative fill. Not a hard
  conflict, but worth naming: Fresha's own version carries no colour at all here, so matching
  Fresha literally would mean removing the amber tint, which is a taste call, not a correctness
  fix. Owner call.
- CONFLICT [three loose rows vs. one card]: Fresha shows salon info, date, and time as three
  separate unboxed text rows. Solen's summary card bundles all of it (service + stylist + date/time
  + price) into one card per the wizard's own Q55 lock. Adopting Fresha's looser, unboxed
  structure would mean breaking apart an already-locked, dated (2026-05-02) Q55 decision. Needs a
  mockup and his yes, not a silent unbundling.
- No conflict on ordering: both Fresha and Solen already put the cancellation policy ABOVE the
  payment-method selector and keep one sticky commit button at the bottom, so the Trust floor's
  ordering requirement (price, then who/what, then policy, all above the button) is already
  satisfied on both sides; this is a case where Fresha's structure and Solen's current build agree,
  named here so it is not mistaken for an open question.
