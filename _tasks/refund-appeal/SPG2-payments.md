# SP-G2 Payments (full prepay)

> Layer 1, foundational. Decoded from REFUND_APPEAL_PLAN.md §8 (D11 full prepay / D12 auto-charge / D13 upcharge), §10b (binding council fixes), §11 (two lanes), §14 (execution). This subplan makes a **real charge** exist at booking time so that every downstream money flow (refunds SP-0/SP-3, upcharge SP-3, cancellation/no-show auto-charge SP-AC) has something to move, unwind, or top-up.
>
> **Verified against the LIVE DB (project `tocfnsmxmdxkrcmjzzdw`) on 2026-06-01.** Findings woven in below. The headline: nearly every column this flow needs is ABSENT live (`paid_amount`, `refunded_amount`, `stripe_customer_id`, `stripe_payment_method_id`, `stripe_setup_intent_id` all `count=0`), `salon_payouts` the TABLE is absent (`count=0`), `profiles.stripe_customer_id` is absent, and `bookings.user_id` is `NOT NULL`. The webhook (`setup_intent.succeeded` handler) and the pre-charge cron already WRITE to these absent columns. So this is a half-shipped feature whose persistence layer never landed. SP-G2 reuses that shipped code and rides SP-0's one guarded migration to make it real.

## Objective

Charge the **full** service amount at booking via a Stripe **PaymentIntent** (the Fresha model), in **integer Rappen end to end**, routed as a **Stripe Connect destination charge** to the salon's connected account with an `application_fee_amount` (the Solen commission). Persist `payment_intent_id`, `paid_amount` (Rappen), `payment_status` on the booking. SAVE the card for later **off-session** charges (`setup_future_usage: "off_session"`) and store the Stripe customer + payment-method id, so SP-AC (cancellation/no-show) and SP-3 (upcharge) can charge off-session later, and so SP-0's `issueRefund` can refund with `reverse_transfer` against the destination charge.

In scope: on-session SCA at booking, the front-end PaymentIntent confirmation, the **guest** payment path (no account → Stripe customer keyed off the guest booking), webhook reconciliation, the centimes unit fix at this flow's boundary. Replaces today's `/api/bookings` POST which inserts a booking and charges **nothing** (`PayConfirmStep` only ever POSTs `/api/bookings`; no card is taken — confirmed `components-legacy/booking/PayConfirmStep.tsx:79-101`).

## Depends on

- **SP-0 Foundation (hard, blocks everything here):**
  - The ONE guarded forward-only migration (`ADD COLUMN IF NOT EXISTS`) that adds the columns below. SP-G2 **references** them; it does **not** author the migration (§14 "ONE writer per shared artifact"). Live-verified absent: `bookings.paid_amount`, `bookings.refunded_amount`, `bookings.stripe_customer_id`, `bookings.stripe_payment_method_id`, `bookings.stripe_setup_intent_id`, the whole `salon_payouts` table, `profiles.stripe_customer_id`.
  - **Centimes/Rappen lock (§10b #5):** SP-0 fixes `app/api/bookings/[id]/refund/route.ts:51` (`paid_amount ?? price_paid` mixes Rappen and CHF) and `app/api/cron/pre-charge/route.ts:52` (charges `booking.price_paid`, a CHF value, as a Rappen `amount` → 100x undercharge). SP-G2 writes `paid_amount` in Rappen so SP-0's fixed readers are correct. SP-G2 must NOT also write CHF into `price_paid` as the charge basis.
  - **`lib/bookings/issue-refund.ts` chokepoint (§10b #3):** SP-0 builds it (`lib/bookings/` does not exist yet — verified). SP-G2 does not call it, but SP-G2's destination-charge shape (`transfer_data.destination` + `application_fee_amount`) is exactly what `issueRefund` later unwinds via `reverse_transfer: true` + `refund_application_fee` (D7). SP-G2 must store enough to make that reversal possible: the `payment_intent_id`, the `application_fee_amount` actually used (persist to `platform_fee`, Rappen), and the destination account.
- **SP-2 (order numbers + `resolveBookingActor` + hashed guest token):** the guest payment path needs the guest booking to carry `reference_code` + `access_token_hash`. SP-G2 charges against a guest booking; SP-2 owns issuing/looking-up the token. If SP-2 lands after SP-G2 in the DAG, the guest charge path is built behind the same migration but exercised once SP-2's token exists. (§14 order is SP-0 + SP-G2 in Layer 1, SP-2 then SP-1 in Layer 2 — so the guest *booking row* may not exist yet when SP-G2 lands; build the guest charge code, gate the e2e guest test on SP-1/SP-2.)
- **Stripe Connect already wired:** `app/api/stripe/connect/create-account/route.ts` + `connect/status/route.ts` exist; `salons.stripe_account_id` + `salons.accepts_online_payment` are live and already read by `walkin/pay-intent` + `create-payment-intent`. SP-G2 reuses, does not rebuild Connect onboarding.
- **Existing saved-card webhook handler:** `app/api/stripe/webhook/route.ts:243-255` (`setup_intent.succeeded`) already persists `stripe_customer_id` / `stripe_payment_method_id` / `stripe_setup_intent_id` / `payment_status:"card_saved"`. SP-G2 reuses this verbatim (just needs the columns to exist via SP-0).

## Schema / DB changes

All columns ride **SP-0's single guarded migration** (`ADD COLUMN IF NOT EXISTS`, forward-only, on a Supabase branch per §14). SP-G2 only references them. Units: **integer Rappen** for every amount column (§10b #5). CHF→Rappen conversion happens ONLY at the API boundary via `toRappen()` (`lib/stripe.ts:25`).

On `bookings` (live-verified absent unless noted):
- `payment_intent_id text` — ALREADY LIVE (`is_nullable=YES`). The full-prepay PI id lands here.
- `payment_status text` — ALREADY LIVE. New value used by this flow: `"paid"` (full prepay captured). Existing values in code: `none` / `deposit_held` / `card_saved` / `paid`. SP-G2 standardises `"paid"` = full amount captured + card saved.
- `paid_amount integer` (Rappen) — **ADD (absent live).** The amount actually charged + captured. Source of truth for refunds (SP-0's fixed `refund/route.ts` reads it).
- `refunded_amount integer` (Rappen, default 0) — **ADD (absent live).** Written by SP-0's `issueRefund`, not by SP-G2; declared here because the refund route already reads it.
- `platform_fee integer` (Rappen) — currently `numeric` live. **SP-0 decides**: keep `numeric` but store Rappen, or migrate type. SP-G2 writes the `application_fee_amount` used (Rappen) so `issueRefund`'s `refund_application_fee` math (D7) is exact.
- `stripe_customer_id text` — **ADD (absent live).** The Stripe customer the card is saved on (user OR guest). Webhook `setup_intent.succeeded` already writes it.
- `stripe_payment_method_id text` — **ADD (absent live).** The saved PM for off-session reuse (SP-AC / SP-3). Webhook already writes it; SP-G2 also captures it from the succeeded PaymentIntent's `payment_method`.
- `stripe_setup_intent_id text` — **ADD (absent live).** Only used when the save-card step is a separate SetupIntent rather than `setup_future_usage` on the PI. Webhook already writes it.

On `profiles`:
- `stripe_customer_id text` — **ADD (absent live, verified `[]`).** Reused for logged-in customers so one customer is shared across bookings. `app/api/stripe/payment-methods/route.ts:17` + `create-customer` already read/write this column — it has never existed, so those routes silently no-op today. SP-0's migration adds it; SP-G2 populates it on first charge.

New table (SP-0 authors; SP-G2 depends):
- `salon_payouts` — **ADD (whole TABLE absent live, verified `count=0`).** The webhook (`webhook/route.ts:98-108`) and pre-charge cron (`pre-charge/route.ts:68-76`) already INSERT/UPDATE it. SP-G2's destination charge is what populates it via the webhook `payment_intent.succeeded` path. Columns the shipped code expects: `booking_id`, `salon_id`, `stripe_payment_intent_id`, `gross_amount`, `commission_percent`, `commission_amount`, `net_amount`, `status`. **Unit caveat for SP-0:** the webhook writes these from `pi.amount / 100` (CHF) today; SP-0 must decide payout units and keep the webhook + `issueRefund` consistent. SP-G2 flags this; the payout-table unit decision is SP-0's, not SP-G2's.

Guest columns (`bookings.user_id` → nullable, `guest_name/guest_email/guest_phone`, `reference_code`, `access_token_hash`) are owned by **SP-1/SP-2**, not SP-G2. SP-G2 only needs `user_id` to be nullable (verified `NOT NULL` today) and a guest email to create the Stripe customer.

## Backend changes

Design choice (recommended, see Risks): **one PaymentIntent that both charges and saves the card** via `setup_future_usage: "off_session"` + `customer`. This is one SCA prompt, one Stripe object, no second SetupIntent round-trip. It supersedes the current `save-card` SetupIntent step for the prepay flow (that SetupIntent path stays only for the legacy ">7 days, hold-don't-charge" behaviour if retained). Rationale from first principles: a single PI with `setup_future_usage` is the minimal object count that satisfies all three requirements (charge now + reusable PM + Connect destination) and minimises SCA friction to exactly one challenge.

### 1. NEW `POST /api/stripe/booking-pay-intent` (full-prepay PI; reuses the walk-in pattern)

Modeled on `app/api/walkin/pay-intent/route.ts` (server-trusted price, Connect destination, commission fee) but `capture_method: "automatic"` (full prepay, not a hold) + `setup_future_usage` + `customer`.

- **Method/path:** `POST /api/stripe/booking-pay-intent`
- **Request (JSON):** `{ salon_id, service_id, slot_id? , starts_at?, staff_member_id?, guest?: { name, email, phone } }`. NO client-supplied amount (server-trusted, like walk-in `pay-intent:52-65`).
- **Auth:** session OR guest. If session → logged-in customer. If no session AND `guest` present → guest path (mirror `walkin/pay-intent:84-87` which already tolerates `customerId = null`). Feature gate `checkFeatureEnabled("payments")`. Rate-limit: `paymentLimiter` keyed by `userId` (logged-in) or `getClientIp(req)` (guest) — same dual pattern as `walkin/pay-intent:21`. (§10b #12 wants a dedicated money limiter; flag for SP-0/SP-2 to add `moneyLimiter`; until then reuse `paymentLimiter`.)
- **Logic:**
  1. Validate salon accepts online pay + has price; **server-trusted price** from the `services` row (`Number(service.price)` CHF) → `toRappen()` (verbatim pattern from `walkin/pay-intent:52-65`).
  2. Resolve/lock the slot the SAME way `/api/bookings` POST does (`availability_slots` by `slot_id` OR `salon_id+service_id+starts_at`, `status='available'`) so we don't take a card for an unavailable slot. (Reuses the slot-resolution block at `app/api/bookings/route.ts:62-86`.)
  3. Resolve the Stripe **customer**:
     - Logged-in: read `profiles.stripe_customer_id`; if null, `stripe.customers.create({ email, metadata:{ solen_user_id } })` and persist (pattern: `payment-methods/route.ts:62-72` + `create-customer/route.ts:32-36`).
     - Guest: `stripe.customers.create({ email: guest.email, name: guest.name, metadata:{ guest:"1" } })`. NOT written to `profiles` (no row). The customer id is carried in PI metadata and persisted onto the **booking** at confirm time (`bookings.stripe_customer_id`).
  4. Commission: `platform_settings.commission.rate_percent` ?? `DEFAULT_COMMISSION_RATE_PERCENT` (15, `lib/constants/billing.ts:9`); `application_fee_amount = round(amountRappen * rate)` (verbatim `walkin/pay-intent:90-93`).
  5. Create the PI:
     ```
     amount: amountRappen,                 // Rappen
     currency: "chf",
     capture_method: "automatic",          // FULL PREPAY (not a hold)
     customer: customerId,
     setup_future_usage: "off_session",     // saves the PM for SP-AC / SP-3 off-session charges
     automatic_payment_methods: { enabled: true, allow_redirects: "never" },  // wallets + Link, exclude redirect/BNPL (matches walk-in:104)
     application_fee_amount: feeRappen,     // only if salon.stripe_account_id
     transfer_data: { destination: salon.stripe_account_id },  // Connect destination charge
     metadata: { type:"booking", salon_id, salon_name, service_id, service_name, customer_id: userId ?? "", guest_email: guest?.email ?? "", slot_id, starts_at, staff_member_id }
     ```
  6. `on_behalf_of` is implied by `transfer_data.destination` for destination charges — do not also set it (Stripe forbids the combo for destination charges; the `save-card` route's `on_behalf_of` is for the no-charge SetupIntent only).
- **Idempotency:** pass `{ idempotencyKey }` as the 2nd arg to `paymentIntents.create` (§10b #11). Key = a client-generated UUID echoed back, or `sha256(userId|guestEmail + slot_id + starts_at)` so a double-submit reuses the same PI. (Walk-in does not set one today — SP-G2 adds it; do NOT retrofit walk-in here, that's out of scope.)
- **Response:** `{ client_secret, payment_intent_id, amount: priceChf }` (same shape as `walkin/pay-intent:127-132`).
- **Status codes:** 200 ok; 400 missing/invalid params, salon not online-pay, no valid price, slot gone; 401 only if a logged-in-only feature flag blocks (guests allowed otherwise); 403 banned user; 429 rate-limited; 503 payments feature off.

### 2. CHANGE `POST /api/bookings` (create the booking in a payable state; do NOT charge here)

`app/api/bookings/route.ts:36-249`. Today it inserts a booking and returns 201 with NO payment. Two options; **recommend Option A** (PI-first):

- **Option A (recommended): PI created first (step 1 above), booking created on PI success.** The booking row is written by the **webhook** `payment_intent.succeeded` (or a thin confirm route) using PI metadata (`slot_id`, `service_id`, `staff_member_id`, `customer_id`/`guest_email`). `/api/bookings` POST is then only for the legacy/in-person `payment_method:"in_person"` path (no charge). Pro: never a booking without a paid charge; matches the walk-in model (ticket issued on PI success). Con: booking creation moves into the webhook/confirm path.
- **Option B: booking created first (`status:"pending_payment"`), PI references `booking_id`, webhook flips to `confirmed`+`paid`.** Mirrors the deposit flow the webhook already speaks (`webhook:79-83` reads `pi.metadata.booking_id` → sets `payment_status`). Pro: minimal change to `/api/bookings`. Con: orphan `pending_payment` bookings if the user abandons SCA (needs a sweeper cron).

**Decision needed (flag to orchestrator):** A vs B. Given the walk-in precedent (pay gates the ticket) and §11's "a real charge must exist," **A** is the cleaner invariant, but **B** reuses the existing `booking_id`-keyed webhook handler with near-zero new code. Default to **B** for reuse unless the orchestrator wants the stronger A invariant.

Under **B**, `/api/bookings` POST adds: accept `payment_method:"online"` → set `status:"pending_payment"`, `payment_status:"none"`, return the booking id so the FE can call `booking-pay-intent` with `booking_id` in metadata. The slot is held (`status:"booked"`) but a sweeper must release it if payment never lands.

### 3. CHANGE `app/api/stripe/webhook/route.ts` (reconcile the full-prepay PI)

Reuse the existing switch (`webhook:66`). In `payment_intent.succeeded` (`webhook:67`), add a branch for `pi.metadata.type === "booking"` (the walk-in branch `webhook:72` already early-returns its own type; mirror that):
- Set on the booking (by `payment_intent_id` for Option A, or `pi.metadata.booking_id` for Option B):
  `payment_status:"paid"`, `paid_amount: pi.amount` (Rappen, already integer from Stripe), `platform_fee: pi.application_fee_amount ?? 0`, `stripe_customer_id: pi.customer`, `stripe_payment_method_id: pi.payment_method`, and (Option A) insert the booking row from metadata + flip the slot to `booked`.
- The `salon_payouts` insert already exists (`webhook:98-108`) — it will now actually persist because SP-0 creates the table. **Unit flag:** that block computes `grossAmount = pi.amount / 100` (CHF). SP-0 must reconcile payout units with the Rappen lock; SP-G2 does not change the payout block (SP-0 owns it), just notes the dependency.
- The `setup_intent.succeeded` handler (`webhook:243-255`) stays for any separate-SetupIntent path; with `setup_future_usage` on the PI it's not needed (the PM is saved by the PI itself), but leaving it is harmless and reused if Option B keeps a save-card step.
- Confirmation email/notification already fires here (`webhook:110-157`); guest path needs `guest_email` instead of `auth.admin.getUserById` (notifications are SP-2/owner's later piece — leave the hook, don't build guest email here).

### 4. NEW front-end: real PaymentIntent confirmation in the booking flow

Reuse `components-legacy/barber/WalkInPaymentForm.tsx` verbatim as the Stripe Elements + SCA confirmation surface — it already: loads the platform publishable key (destination charges stay on platform, no `stripeAccount` option), renders `<PaymentElement>`, calls `stripe.confirmPayment({ elements, redirect:"if_required" })`, and reports the confirmed PI (`WalkInPaymentForm.tsx:32-62`). `redirect:"if_required"` is exactly the SCA contract: card payments stay on-page; 3DS challenges are handled inline by Stripe; only redirect methods leave. The current `PayConfirmStep.tsx` "Karte" radio must be wired to: call `/api/stripe/booking-pay-intent` → mount this form with the returned `client_secret` → on `onPaid(pi.id)` route to `/confirmation`. (Today `PayConfirmStep` skips all of this and POSTs `/api/bookings` directly — `PayConfirmStep.tsx:79`.) **This is a mockup-first deliverable per §12 + owner policy** — see "Front-end mockups needed."

SCA specifics (on-session, at booking): `setup_future_usage:"off_session"` on the PI means Stripe asks for any required 3DS challenge during this on-session `confirmPayment` call, so the saved PM is afterwards usable off-session without re-auth (subject to issuer). No extra code beyond `confirmPayment` — the `WalkInPaymentForm` flow already covers it; success status for an automatic-capture PI is `"succeeded"` (the form already accepts both `requires_capture` and `succeeded`, `WalkInPaymentForm.tsx:52`).

## Reuse + anti-duplication

REUSE (do not rebuild):
- `app/api/walkin/pay-intent/route.ts` — the entire server-trusted-price + Connect-destination + commission-fee + guest-tolerant pattern. `booking-pay-intent` is this minus `capture_method:"manual"`, plus `customer` + `setup_future_usage`.
- `app/api/stripe/webhook/route.ts` — the `payment_intent.succeeded` handler, the `salon_payouts` insert (`:98-108`), the `setup_intent.succeeded` saved-card writer (`:243-255`), the booking-confirmation notification (`:110-157`), and the idempotency claim via `processed_webhook_events` (`:48-60`). Add ONE `type:"booking"` branch; do not fork the webhook.
- `components-legacy/barber/WalkInPaymentForm.tsx` — the Stripe Elements/SCA confirm form, verbatim (rename-agnostic; could be promoted to a shared `PaymentForm` later — out of scope here).
- `app/api/stripe/payment-methods/route.ts:62-72` + `create-customer/route.ts:32-36` — the "get-or-create Stripe customer for a logged-in user, persist to `profiles.stripe_customer_id`" snippet. (NB: this column is absent live — SP-0 adds it; these routes silently no-op until then.)
- `lib/stripe.ts` `toRappen()` (`:25`) — the ONLY CHF→Rappen conversion. `getStripe()` singleton (`:6`). `PLATFORM_FEE_PERCENT` is stale (1%, `:22`) — ignore it; use `DEFAULT_COMMISSION_RATE_PERCENT` (15, `lib/constants/billing.ts:9`) like the live PI routes do.
- `lib/constants/billing.ts` `DEFAULT_COMMISSION_RATE_PERCENT` + `platform_settings.commission.rate_percent` — the commission source, same as `create-payment-intent:88-94` and `walkin/pay-intent:90-93`.
- Connect onboarding: `app/api/stripe/connect/create-account` + `connect/status` — already built; SP-G2 only READS `salons.stripe_account_id`.

DO NOT duplicate:
- A second CHF→Rappen helper (use `toRappen`).
- A second Stripe refund path — that's SP-0's `issueRefund` chokepoint; SP-G2 creates charges only.
- A second commission default — use `DEFAULT_COMMISSION_RATE_PERCENT`, never the stale 1% `PLATFORM_FEE_PERCENT`.
- A separate webhook route — extend the existing switch.

## Acceptance criteria

(Stripe **test mode**; all amounts asserted in Rappen.)
1. **Full prepay charge.** Booking a CHF 50 service creates a PaymentIntent with `amount = 5000`, `currency:"chf"`, `capture_method:"automatic"`, that reaches `status:"succeeded"`. The booking row has `payment_status:"paid"`, `paid_amount = 5000`, `payment_intent_id` set. (Contrast today: `/api/bookings` charges nothing.)
2. **Connect destination + fee.** The PI has `transfer_data.destination = salon.stripe_account_id` and `application_fee_amount = round(5000 * rate)` (e.g. 750 at 15%). The dashboard shows the transfer to the connected account and the application fee on the platform. `bookings.platform_fee` equals the `application_fee_amount` in Rappen. (This is what SP-0's `issueRefund` later reverses with `reverse_transfer:true`.)
3. **Saved card usable off-session.** After the booking PI succeeds, `bookings.stripe_customer_id` + `bookings.stripe_payment_method_id` are populated. A manual off-session test charge `paymentIntents.create({ amount, customer, payment_method, off_session:true, confirm:true })` against those ids **succeeds without a new SCA prompt** (proves SP-AC/SP-3 can charge later). For a logged-in user, `profiles.stripe_customer_id` is set and reused on a second booking (one customer, two PaymentMethods).
4. **SCA.** Using Stripe's 3DS-required test card (`4000 0027 6000 3184`), `confirmPayment` surfaces the on-page 3DS challenge and, once passed, the PI succeeds and the card is saved off-session. The 3DS-always-decline card (`4000 0000 0000 3220`) leaves the booking unpaid (no `paid` flip, slot released under the chosen Option A/B).
5. **Guest path.** A logged-out booker with `{ guest:{ name, email, phone } }` gets a PI under a freshly created Stripe customer (metadata `guest:"1"`), pays, and the resulting booking carries `stripe_customer_id`/`stripe_payment_method_id` with `user_id IS NULL`. (Full guest e2e is gated on SP-1/SP-2 landing the guest booking row + token; the **charge** path is testable independently against a stub guest booking.)
6. **Idempotency.** Re-POSTing `booking-pay-intent` with the same idempotency key returns the SAME `payment_intent_id` (no double PI, no double charge).
7. **Unit integrity.** No code path charges `price_paid` (CHF) as a Rappen amount; `paid_amount` is always Rappen; the only CHF→Rappen step is `toRappen()`. (Guards against re-introducing the `pre-charge:52` 100x bug.)

## Risks + edge cases

Citing §10:
- **Units (§10b #5, LIVE-CONFIRMED).** `paid_amount`/`refunded_amount` are Rappen; `price_paid` is CHF (live `numeric NOT NULL`). The refund route already coalesces them (`refund/route.ts:51`) and the pre-charge cron charges CHF as Rappen (`pre-charge/route.ts:52`, 100x undercharge). SP-G2 must write Rappen into `paid_amount` and NEVER use `price_paid` as a charge basis. The `salon_payouts` insert in the webhook uses `pi.amount/100` (CHF) — SP-G2 does not touch it but flags the payout-unit reconciliation as SP-0's.
- **Idempotency / double charge (§10b #11).** Every `paymentIntents.create` here passes an idempotency key. The webhook is already idempotent via `processed_webhook_events` (`webhook:48-60`). Double-submit of the pay step must not create two PIs (criterion 6).
- **Connect reverse on refund (§7 Stripe, §10b #3).** Because this is a destination charge with `application_fee_amount`, refunds MUST use `reverse_transfer:true` (and `refund_application_fee` per D7) or the salon's connected balance and the platform fee won't unwind. SP-G2's job is to STORE the destination + fee so SP-0's `issueRefund` can do this; SP-G2 must not itself refund. **Post-payout negative balance** (§7): if Stripe already paid the salon out, a later reverse can push the connected balance negative — that's SP-0/SP-AC policy (who absorbs it), flagged not solved here.
- **SCA (§7, §10b #8).** On-session 3DS at booking via `confirmPayment` (handled by `WalkInPaymentForm`). `setup_future_usage:"off_session"` is what lets later SP-AC/SP-3 charges run off-session — but issuers can still decline off-session and force a re-auth; SP-AC must handle the `requires_action`/`authentication_required` decline (Stripe `error.code === "authentication_required"`), exactly the failure the pre-charge cron currently swallows (`pre-charge:79-94`). SP-G2 maximises off-session success by saving via `setup_future_usage` on the on-session PI (best-practice single-prompt path), but cannot guarantee no future challenge.
- **Guest customer hygiene.** A guest Stripe customer is created per guest booking (no `profiles` row to dedupe against). Risk: orphan customers if the guest abandons SCA. Mitigate: create the customer only when the PI is created (not on form open), and let SP-2's PII-lifecycle cron (§10b #10) consider guest-customer cleanup. Never store the guest's raw email in a URL/log (§10 privacy).
- **Booking-without-charge invariant (Option B risk).** If `/api/bookings` creates a `pending_payment` row before the PI succeeds, abandoned SCA leaves an orphan holding a slot → needs a release sweeper. Option A avoids this. Decision flagged above.
- **`automatic_payment_methods` + `allow_redirects:"never"`** intentionally excludes TWINT/BNPL (can't be saved off-session / don't fit the prepay-then-recharge model), matching the walk-in rationale (`walkin/pay-intent:99-104`). Wallets (Apple/Google Pay) + Link still appear; Apple Pay needs domain registration (HTTPS only, never localhost — see `_tasks/APPLE_PAY_SETUP.md`).
- **Abuse / rate (§10b #12).** Reuse `paymentLimiter`; flag the dedicated `moneyLimiter` for SP-0. Server-trusted price (never client) blocks the "pay CHF 0.01 for a CHF 500 service" attack, same guard the walk-in + create-payment-intent routes already enforce.

## Front-end mockups needed

Per §12 + owner policy (all FE = competitor-informed mockups for sign-off BEFORE real build; brief template `_design-system/AGENT_BRIEF_TEMPLATE.md`). SP-G2 touches §12 item-adjacent surfaces (the pay step itself isn't in §12's list of 10 because §12 enumerates the refund/appeal screens, but full-prepay needs its own):
1. **Booking pay step (review + card entry).** Evolve `PayConfirmStep.tsx`: keep the summary card + cancellation banner; replace the "Karte / Vor Ort" radio's online branch with the mounted Stripe `<PaymentElement>` (reuse `WalkInPaymentForm` visual). Show the FULL amount (not a deposit) + a "saved for cancellation/no-show fees" disclosure line (D12 acceptance-at-booking, §11 Lane A). Fresha-structure / Uber-aesthetic per the dual-axis rule.
2. **SCA confirm state.** The in-flow 3DS challenge + the success/return state (PI succeeded → confirmation). Mockup the loading/authenticating and the decline/retry states (payment-flow error states are in scope for this surface).
3. **Guest pay variant.** The same pay step with the guest name/email/phone fields (slots into the logged-out flow; coordinates with SP-1's `GuestBookingForm`) + the "save your access link" affordance (SP-2 owns the token; mock the placement).
4. **Cancellation/no-show fee disclosure** at booking (the consent that authorises Lane-A auto-charge of the saved card) — a one-line policy + amount, accepted implicitly by booking. Detailed policy UI is SP-AC; SP-G2 only mocks the at-booking disclosure line.

(Build only after sign-off. Mockups in English per project memory; product locale is de.)

## Out of scope for this SP

- The migration authorship + migration-history reconcile + the centimes fix to `refund/route.ts` + `pre-charge/route.ts` + the `salon_payouts` table/payout-unit decision + `lib/bookings/issue-refund.ts` → **SP-0** (SP-G2 references them).
- Any **refund** (money out) → SP-0 `issueRefund` + SP-3 appeal flow.
- **Cancellation/no-show auto-charge** of the saved card per policy → **SP-AC** (SP-G2 only saves the card + proves off-session reuse works).
- **Upcharge** charge-the-difference → **SP-3** (uses the saved card SP-G2 stored).
- **Guest booking row + nullable `user_id` migration + RLS + service-role insert** + `GuestBookingForm` wiring → **SP-1**; **`reference_code` + hashed `access_token` + `resolveBookingActor` + lookup/resend** → **SP-2**. SP-G2 only needs `user_id` nullable + a guest email to mint the Stripe customer.
- Walk-in payments (already live) — not re-touched; do NOT retrofit the booking idempotency key onto walk-in here.
- Email/SMS notifications (owner's later piece) — leave the existing webhook hook; do not build guest-email here.
- Promo/gift-card/credit application to the charged amount (`PayConfirmStep` passes `promo_code`/`gift_card_code` but `/api/bookings` ignores them today) — out of scope; the charged `amount` is the server-trusted service price until a discount engine lands.
