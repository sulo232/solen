# Deposit / Prepay / At-salon — payment-mode e2e test plan

Last updated: 2026-06-04. Owner-executed (needs a browser + Stripe **test mode** keys + the dev server).

## Decision recorded (2026-06-04)
`payment_mode` resolves to **`at_salon` when unset**, consistently across all four code paths:
- `app/[locale]/dashboard/settings/page.tsx:765` — settings UI defaults the selector to `at_salon`, and writes it on save.
- `components-legacy/booking/PayConfirmStep.tsx:96` — UI renders the in-person path for unset.
- `app/api/bookings/route.ts:218` — `ONLINE_PAYMENT_REQUIRED` guard only fires for `deposit`/`prepay`.
- `app/api/stripe/booking-pay-intent/route.ts:114` — **fixed 2026-06-04**: was `?? "prepay"` (the lone outlier, the unsafe direction); now `?? "at_salon"` (fail-closed). Only affects salons with a NULL `payment_mode`; explicitly-configured salons are unaffected.

To make the marketplace prepay-by-default instead, that is a deliberate product change: flip the 4 defaults together (settings, PayConfirmStep, bookings guard, pay-intent) AND require `payment_mode` at onboarding so customers are never surprise-charged for an unconfigured salon.

## Deposit math (verified by code review — `booking-pay-intent/route.ts`)
- `depositPct = clamp(deposit_percent, 1, 100)`, default **20** if unset/invalid (line 119).
- `amountRappen = round(fullRappen * depositPct / 100)`, floored at **50 Rappen** (Stripe min) for deposit; full price for prepay (lines 120-121).
- Response returns `amount` (charged now), `full_price`, `remaining_at_salon = full − charged` for deposit (lines 246-250).
- Commission is computed on the charged amount via `application_fee` (Connect). VAT/MWST handled per salon (inclusive 8.1%).

## Stripe test cards (test mode only)
- Success: `4242 4242 4242 4242`, any future expiry, any CVC, any ZIP.
- 3DS required: `4000 0027 6000 3184` (triggers the authentication modal).
- Declined: `4000 0000 0000 0002`.

## Scenarios (run each end-to-end: book → pay → confirmation → dashboard)

### 1. payment_mode = `prepay`
1. Set a test salon's payment_mode = prepay (dashboard → Settings → Payments), `accepts_online_payment = true`.
2. Book a service priced e.g. CHF 80 → reach the pay step.
3. Expect: PayConfirmStep shows **full CHF 80** charge, blue CTA.
4. Pay with `4242…`. Expect: PaymentIntent for **8000 Rappen**, booking → `confirmed` + `paid` after the webhook.
5. Confirmation page shows "paid" + full amount; receipt shows VAT breakdown.

### 2. payment_mode = `deposit`, deposit_percent = 30
1. Same salon, payment_mode = deposit, deposit_percent = 30.
2. Book the CHF 80 service.
3. Expect: pay step shows **CHF 24.00 now** (30%) + **CHF 56.00 at the salon** (remaining_at_salon).
4. Pay with `4242…`. Expect: PaymentIntent for **2400 Rappen**; booking confirmed + paid; confirmation shows deposit paid + remaining-at-salon line.

### 3. payment_mode = `at_salon`
1. Salon payment_mode = at_salon.
2. Book the CHF 80 service.
3. Expect: pay step shows the **in-person** path (no card form); booking is created directly (payment_method ≠ online).
4. Direct call to `/api/stripe/booking-pay-intent` for this booking must return **400 `AT_SALON`** (fail-closed).

### 4. payment_mode = UNSET (null) — regression for the 2026-06-04 fix
1. A salon row with `payment_mode = null` (legacy). 
2. Book → expect the **in-person** path (same as at_salon), no online charge.
3. Direct `/api/stripe/booking-pay-intent` call must return **400 `AT_SALON`** (NOT a prepay charge).

### 5. 3DS path (any online mode)
1. Use `4000 0027 6000 3184` on scenario 1 or 2.
2. Expect the 3DS modal; on approve → confirmed + paid; on cancel → booking stays pending, slot held until the abandonment sweeper releases it.

### 6. Decline path
1. Use `4000 0000 0000 0002`.
2. Expect a user-visible error, booking NOT confirmed, retry possible.

## Notes
- The Stripe webhook must point at the deployed Netlify URL (already done per task #31). For LOCAL e2e, use `stripe listen --forward-to localhost:3000/api/stripe/webhook` to relay events to the dev server.
- After any e2e in test mode, refunds can be issued from the dashboard to verify the refund path (fee-aware per salon policy).
