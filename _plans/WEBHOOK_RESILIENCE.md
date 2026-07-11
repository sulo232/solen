# Webhook resilience audit (Ring 8, backend improvement loop)

Owner ask (`_plans/BACKEND_IMPROVEMENT.md`, Ring 8): re-read all 5 `app/api/stripe/webhook`
handler files + the dispatcher under the RETRY lens (does the handler stay correct when the
WHOLE event body re-runs after a `processed_webhook_events` claim-release, per the 2026-07-10
sweep's idempotency model), fix the promo-increment retry double-count, map reconcile-cron
coverage, memo `vouchers/confirm`, and close the `pending_approval` referral gap.

Files read in full for this audit: `app/api/stripe/webhook/route.ts` (dispatcher + inline
handlers for 11 event types), `voucher-handler.ts`, `purchase-handler.ts`,
`gift-card-handler.ts`, `salon-voucher-handler.ts`, `app/api/cron/reconcile/route.ts`,
`app/api/stripe/booking-pay-intent/route.ts` (promo/member-discount reserve-at-checkout),
`lib/referral/complete-referral.ts`, `app/api/bookings/route.ts`,
`app/api/bookings/[id]/confirm/route.ts`, `app/api/bookings/[id]/route.ts`.

---

## 1. Per-handler retry verdict table

Model: `processed_webhook_events` claims the event_id BEFORE any handler runs; on a handler
throw, `route.ts`'s outer catch DELETES the claim and returns 500, so Stripe redelivers the
SAME event_id and the WHOLE case body (not just the failed statement) re-runs from scratch. A
genuine Stripe re-delivery of an event Stripe already got a 200 for is blocked upstream by the
claim's `23505` on the very first INSERT, before any handler code runs at all, so that case is
not analyzed per-handler below (it never reaches the handler).

| event type | handler | idempotent? | how / gap |
|---|---|---|---|
| `payment_intent.succeeded`, `metadata.type==='walk_in'` | inline (route.ts, early `break`) | YES | No-op branch, nothing runs. |
| `payment_intent.succeeded`, `metadata.type==='tip'` | inline | YES | `tips.status='paid'` write is idempotent (same end value on every replay), no counter. |
| `payment_intent.succeeded`, `metadata.type==='voucher_purchase'` | `voucher-handler.ts` | YES | CAS `promo_codes.is_active false->true`; a re-delivery finds `activated===null` and returns `true` before the `voucher_purchases` insert / email, so neither ever double-fires. |
| `payment_intent.succeeded`, `metadata.type==='voucher'` (salon gift voucher) | `salon-voucher-handler.ts` | YES, but FRAGILE | `vouchers.remaining_amount` write is gated `.is("remaining_amount", null)` (CAS). The recipient email is **deliberately NOT gated** on that CAS (own comment: relies on "the outer claim guarantees this handler runs exactly once per event"). Verified true today because nothing in this function/branch can throw AFTER the email send (the email itself is `try/catch`'d and swallowed, and `return true` immediately follows), so a claim-release-retry can only re-enter this function from a throw BEFORE the email, not after it. **Latent risk, not a live bug**: if a future edit adds any code after the email that can throw, this becomes a duplicate-send. |
| `payment_intent.succeeded`, `metadata.type==='retail_purchase'` | `purchase-handler.ts` | YES | CAS `retail_purchases.status pending->paid`; stock decrement only runs on the rows the CAS actually flipped (`settled?.[0]`), stock RPC itself is atomically capped. Payout upsert on `stripe_payment_intent_id` (unique). |
| `payment_intent.succeeded`, `metadata.type==='gift_card'` | `gift-card-handler.ts` | YES | CAS `gift_cards.is_active false->true`; recipient email correctly gated on `card` being non-null (the CAS winner), the cleanest of the 4 purchase-type handlers. |
| `payment_intent.succeeded`, `metadata.type==='booking'` (money-critical fields) | inline | YES | `bookings` update is ADVANCE-ONLY via `.in("status", ["pending","pending_approval","confirmed"])`. `"confirmed"` is deliberately included so a retry re-applies the SAME deterministic values (paid_amount/platform_fee/vat/etc, all re-derived from the same `pi` object), safe, convergent. Slot-confirm, `salon_payouts` upsert (`onConflict: stripe_payment_intent_id`), and the referral-completion call are all correctly re-entrant (the referral helper has its own CAS, see below). The new `promo_counted_at` claim (this ring) is CAS by construction. |
| `payment_intent.succeeded`, `metadata.type==='booking'` (confirmation email + analytics) | inline | **NO, real gap (not fixed this ring, out of the ring-8 fix list)** | `trackServerEvent(...)` x2 and the `sendNotification` "Buchung bestätigt" email are gated ONLY on `booking?.user_id` truthiness, not on whether THIS call is the one that actually transitioned the booking. Because `confirmedRows` matches an ALREADY-confirmed booking too (by design, for the advance-only guard), a claim-release retry re-sends the customer's booking-confirmation email and re-fires `payment_succeeded`/`booking_completed` analytics. Narrow window in practice (nothing after the email in this case throws today, so a retry needs a genuinely new failure elsewhere in the same case body), but not a structural guarantee. **Suggested fix for a future ring**: derive a `justConfirmed` boolean from a narrower pre-image check (e.g. select the booking's PRE-update status in a separate read, or add a second CAS-style marker) instead of trusting `confirmedRows.length` for the notification gate. |
| `payment_intent.succeeded`, off-session upcharge/fee (`metadata.type` upcharge/cancellation_fee/no_show_fee) | inline | YES | Whole block wrapped in its own `try/catch` (non-fatal). Payout upsert idempotent (`onConflict`). Dispute CAS-advance (`booking_disputes.status salon_approved->charged`) is a real CAS (`.eq("status","salon_approved")`), so a retry that already won is a no-op; `writeCaseEvent` only runs on the winning CAS. |
| `payment_intent.amount_capturable_updated` (walk-in backstop) | inline -> `lib/barber/walkin-ticket.ts` | YES | `createWalkinTicket` is guarded by a unique index on `payment_intent_id` (own doc comment: "the unique index on payment_intent_id guarantees one ticket"); a 23505 on retry resolves to the existing ticket. |
| `payment_intent.payment_failed` (booking cancel + slot release) | inline | YES | Same ADVANCE-ONLY shape as the succeeded case: `.in("payment_status", ["pending","none","card_saved"])`, and `"none"` (the value being set) is in the allowed input set, so a retry re-applies convergently. `release_promo_use` RPC call is itself wrapped/logged, never throws uncaught. |
| `payment_intent.payment_failed` (customer notification email) | inline | **NO, same class of gap as the succeeded-email finding above** | The "payment failed" email is sent whenever `booking?.user_id` exists, **unconditional even on `cancelledRows` being empty** (i.e. it is not even gated on this call being the one that cancelled). A retry (or a late, already-superseded delivery) re-sends the failure email. Same suggested fix direction as above; not fixed this ring (out of the explicit ring-8 list; the money-bearing cancel/slot-release/promo-release logic right above it IS correctly guarded). |
| `charge.dispute.created` | inline | Trivially YES (never actually retries) | The admin email is `.catch()`'d and the `audit_log` insert has its own `try/catch`, so literally nothing in this case can throw uncaught. The claim is therefore never released for this event type, so the "does it survive a retry" question does not arise in practice today. |
| `charge.dispute.closed`, `status==='won'` or other non-lost | inline | YES (no ledger touch) | Only the audit_log write (own try/catch, swallowed), nothing to double. |
| `charge.dispute.closed`, `status==='lost'` (ledger decrement) | inline | **NO, real finding, comment is factually wrong** | The code comment claims this "mirrors `charge.refunded`... recomputing from the dispute's own amount (NOT from the already-mutated row) so repeated deliveries converge." The ACTUAL code does the opposite: `newGross = payout.gross_amount - dispute.amount / 100` subtracts the dispute amount from a **fresh SELECT of the current (possibly already-adjusted) `salon_payouts` row**, not from a Stripe-side absolute cumulative total the way `charge.refunded` correctly does (`charge.amount - charge.amount_refunded`, both Stripe-side totals). If this case's ledger write throws AFTER actually committing (a real, if narrow, network-response-lost scenario) and Stripe redelivers, the retry re-reads the now-already-decremented row and subtracts `dispute.amount` a SECOND time, double-decrementing the salon's payout. **Not fixed this ring** (webhook touch scope this ring is "promo claim" only; a correct fix needs its own design, since Stripe disputes do not expose a cumulative "already-applied" total the way refunds do, e.g. a CAS marker keyed on `dispute.id` similar to the upcharge dispute CAS a few cases above, or storing the pre-dispute gross separately). Flagged for a dedicated future ring. |
| `setup_intent.succeeded` | inline | YES | `.in("payment_status", ["pending","none","card_saved"])`, `"card_saved"` (the value written) is in the allowed input set, convergent on retry. No side-effect (email/analytics) in this branch at all. |
| `account.application.deauthorized` | inline | Trivially YES (never actually retries) | `accepts_online_payment:false` write is idempotent; admin email is `.catch()`'d; nothing throws uncaught, so the claim is never released for this event type either. No CAS guard on the email specifically, but moot while nothing can trigger a retry. |
| `account.updated` | inline | YES | `accepts_online_payment:true` only set when `account.charges_enabled`, idempotent write, no side effects. |
| `charge.refunded` | inline | YES | Correctly recomputes from `charge.amount - charge.amount_refunded` (both Stripe-side, cumulative, absolute), the pattern `charge.dispute.closed` claims to mirror but does not. |
| `payout.paid` / `payout.failed` | inline | YES | `sendNotification` is the LAST statement in each case (not wrapped, so a genuine failure correctly propagates to claim-release-and-retry rather than being silently swallowed); nothing runs after it, so a successful send can never be followed by a throw that causes a duplicate-send retry. |

### Summary
14 of 17 analyzed branches are genuinely idempotent under a claim-release retry. 2 are
notification/analytics-only gaps (booking-confirmed email + payment-failed email can
double-send under a retry; the money-critical logic beside them is correctly guarded) and are
**documented, not fixed** this ring (outside the explicit Ring 8 fix list; low severity, since
nothing money-bearing duplicates). 1 is a **real ledger-correctness bug** in
`charge.dispute.closed`'s `lost` branch (its own comment is stale/wrong) that is **flagged for
a dedicated future ring**, also not fixed this ring (out of this ring's webhook touch scope,
which was promo-claim only, and the correct fix needs its own CAS design since Stripe disputes
carry no Stripe-side cumulative total to recompute from).

---

## 2. Promo-increment retry double-count: fixed

**Re-verified against the live DB and the actual current code, not the stale sweep note** (rule:
surface a contradiction rather than build on a wrong premise). The Ring 8 plan item's framing
("webhook retry no longer over-counts current_uses") describes a bug that **already does not
exist** in `app/api/stripe/webhook/route.ts` today:

- `increment_promo_use()` (the OLD webhook-side increment the 2026-07-10 sweep flagged as
  non-idempotent-across-retries, sweep note at `app/api/stripe/webhook/route.ts:172`) was
  **already removed** from the webhook by the same day's later "reserve-at-checkout" refactor
  (commit `03b081b9f`). Confirmed by source-grep: 0 calls to `increment_promo_use` anywhere in
  `app/api/stripe/webhook/**` today. The function itself is a confirmed 0-caller dead RPC per
  the Ring 10 dead-RPC census in `_plans/BACKEND_IMPROVEMENT.md`.
- The promo count (`promo_codes.current_uses`) is incremented exactly once, **at checkout**, by
  the atomic `reserve_promo_use(booking, code)` RPC in
  `app/api/stripe/booking-pay-intent/route.ts`, guarded live by `bookings.promo_use_reserved`
  (confirmed a real column on the live DB: `promo_use_reserved`, `promo_use_released`,
  `member_discount_reserved` all exist; verified by a direct probe against the live REST API
  this round, not a stale local snapshot). Per its own commit message (`03b081b9f`), the RPC is
  "idempotent per booking (safe to call again on a retry/replay)".
- So the webhook's `payment_intent.succeeded` handler contains **zero** promo-count-mutating
  calls today. A claim-release retry of that event cannot double-count a promo redemption,
  because there is nothing in the retried code path that touches the counter at all.

**Still built, as explicitly instructed regardless of the above finding**: `promo_counted_at`
(additive `timestamptz`, migration
`supabase/migrations/20260711150000_backend_loop_promo_counted_flag.sql`, **NOT applied yet,
orchestrator applies live**). Since there is no live increment/reserve call left in the webhook
to gate, this is delivered as a genuine **CAS-claimed audit/reconcile marker** instead of a
second counter (a second counter next to `promo_use_reserved` would itself be a double-count
risk): the webhook claims it exactly once, the first time it observes a promo-bearing booking as
confirmed+paid, via `UPDATE bookings SET promo_counted_at = now() WHERE id = :id AND
promo_counted_at IS NULL`. It never calls `increment_promo_use` or `reserve_promo_use` again.
Code degrades gracefully if the column is not migrated yet (verified live: an `UPDATE` against a
missing column returns a `PGRST204` error object, it does not throw; the code additionally
wraps the call in `try/catch` and only logs, so the money-critical booking-confirm code right
above it is never blocked by this being observability-only).

Changed: `app/api/stripe/webhook/route.ts` (added `promo_code` to the `confirmedRows` select +
the CAS claim block), `supabase/migrations/20260711150000_backend_loop_promo_counted_flag.sql`
(new, not applied).

---

## 3. Reconcile coverage map (`app/api/cron/reconcile/route.ts`)

Read in full. Daily cron, read-only (SELECT + compare, never auto-fixes), pulls Stripe charges +
refunds from the last 48h and diffs against the DB, emails an admin digest on any mismatch.

### Catches
- **Booking payment succeeded but not marked / drifted**: `amount_drift` (Stripe
  `charge.amount_captured` vs `bookings.paid_amount`), `missing_booking` (a booking-type charge
  with no matching row at all).
- **Refund drift, both directions**: `refund_drift` (charge-loop, for charges created inside
  the 48h window) + `refund_without_db_record` (refund-loop, catches a refund issued OUTSIDE the
  app, e.g. directly in the Stripe dashboard, bypassing `issueRefund` + the `charge.refunded`
  webhook entirely, for booking-linked PIs regardless of when the original charge happened).
- **Missing payout ledger row**: `missing_payout` for any captured booking charge with no
  `salon_payouts` row (the webhook upsert never ran).
- **Retail/package purchase drift**: `purchase_amount_drift`, `purchase_refund_drift`,
  `missing_purchase`, mirroring the booking checks, for charges created inside the 48h window.
- **Gift-card activation drift (NEW this ring, see below)**: `missing_purchase` /
  `purchase_amount_drift` equivalents for `metadata.type==='gift_card'` charges.

### Misses (memo'd, not all fixable in one <=30-line change)
- **Salon gift-voucher (`voucher`) and discount/promo-voucher (`voucher_purchase`) purchases**:
  zero reconciliation. Before this ring these fell into the `non_booking` skip bucket
  alongside genuinely-unrelated charges, with no dedicated counter or check at all, the exact
  same blind spot `gift_card` was in. Same shape as the fix below; not fixed this ring (Ring 8
  explicitly asks to close the SINGLE biggest miss, not every miss).
- **`charge.dispute.closed` ('lost') ledger accuracy**: not reconciled at all. Combined with the
  correctness bug found in section 1, a lost dispute's ledger impact has no independent
  cross-check today.
- **Retail/package purchase refund on an OLD (>48h) charge**: the refund-loop (section 2 of the
  cron) only looks up `bookings`, never `retail_purchases`/`package_purchases`, so a purchase
  refunded well after its original charge (a common real pattern for a product return) is never
  re-checked once the charge falls outside the 48h charges-loop window. Explicitly self-flagged
  in the file's own pre-existing comment ("a refund today against an older purchase charge is
  NOT re-checked here"). Not fixed this ring (a second miss was already closed; this one is
  memo'd for the next reconcile-focused ring).
- **Walk-in charges**: deliberately excluded (own no-scheduled-booking-row/payout-path
  reasoning, matches the webhook's own scope), not a coverage gap by omission, an intentional
  design boundary.

### Fixed this ring: gift-card activation (the single biggest miss)
Chosen over the purchase-refund-aging gap because it was a **total blind spot** (0% detection
for a whole class of real captured money) rather than a partial one (the purchase-refund gap is
already covered for the common case, recent charges; only the aged tail was missing), and
because it matches the task's own example phrasing most directly ("payment succeeded but [the
record] not marked"). `gift-card-handler.ts`'s webhook CAS (`is_active false->true`) is the ONLY
place a paid gift card is ever activated; if that event is ever dropped or never redelivered,
real captured money left a permanently inert (`is_active:false`) card with zero detection.

Added (26 lines, inside the existing charges-loop, reuses the existing `Mismatch` kind union, no
new type needed): a `meta.type === "gift_card"` branch that checks `gift_cards` by
`stripe_payment_intent_id`, flags `missing_purchase` if no row exists, flags
`purchase_amount_drift` if a row exists but `is_active` is still `false` despite a captured
charge. Changed: `app/api/cron/reconcile/route.ts` (new branch + updated header comment
documenting the new coverage + the remaining voucher/voucher_purchase gap).

---

## 4. `vouchers/confirm` retire-or-keep memo

**Fresh grep this round** (web `app/`, `components*`, `lib/`, AND `solen-mobile/src`): **zero
live callers**, anywhere. Only self-references (the route file itself) and one comment in
`salon-voucher-handler.ts` describing the historical dead client-side confirm attempt
("`POST /api/vouchers/confirm` fired from an onSuccess callback that never ran").

**Recommendation: RETIRE to a 410 stub** (not done this ring, per explicit instruction: "do NOT
delete/change the route this ring").

Reasoning:
1. Zero live callers, web or mobile, confirmed fresh.
2. Fully superseded by `salon-voucher-handler.ts`'s webhook finalize, which does the SAME job
   (`vouchers.remaining_amount` set to face amount + recipient email) more reliably (fires
   regardless of 3DS/redirect/tab-close) and with a better guard (CAS via
   `.is("remaining_amount", null)`).
3. **Latent risk if kept, worth naming**: this route's write is a blind overwrite
   (`.update({remaining_amount: voucher.amount})` with no CAS on the CURRENT value), unlike the
   webhook's CAS-gated write. Voucher redemption/spend does not exist today (confirmed: 0
   callers on the `redeem_voucher`/`restore_voucher` RPCs per the Ring 10 dead-RPC census), so
   `remaining_amount` is never decremented anywhere in the live app, making this overwrite
   currently harmless. But if voucher spend is ever wired up, any caller who knows a
   `voucher_id` + its `payment_intent_id` (the route's only two inputs, and the PI id is not
   secret, e.g. it could appear in a receipt or be guessed/enumerated by an attacker who bought
   their OWN voucher once) could call this endpoint to **reset their voucher's remaining_amount
   back to full**, indefinitely, any time. This is a real business-logic exploit surface, latent
   only because the feature it would exploit does not exist yet.
4. Keeping it "gated" defensibly would require adding the SAME CAS guard the webhook already
   has, for a route with zero current callers, i.e. ongoing maintenance cost for no live benefit.

---

## 5. `pending_approval` referral completion gap: fixed

**Re-verified against the live code, not the sweep note's framing.** The sweep note (Ring 8
plan + `_plans/BACKEND_SWEEP_2026-07-10.md`) says "wire referral completion into the approve
transition (the webhook + confirm paths already call it)". Reading `app/api/bookings/[id]/
confirm/route.ts` in full showed this was **also stale**: that route did not import or call
`completeReferralForFirstBooking` at all before this fix, only the webhook
(`payment_intent.succeeded`) and the booking-create synchronous path
(`app/api/bookings/route.ts`, step 9, gated on `bookingStatus === "confirmed"`, i.e. instant
confirm or in-person payment only) called it.

**Bigger finding surfaced by this audit, worth naming explicitly**: there is currently **no live
frontend caller anywhere** (web `app/`, `components*`, or `solen-mobile/src`, all grepped fresh)
of `POST /api/bookings/[id]/confirm`. Its own status guard did not even accept
`"pending_approval"` before this fix (only `"pending"`/`"confirmed"`), so a manual-approval
salon's booking could never have been approved through this route even if a caller existed. This
means manual-approval salons have **no working owner-facing "approve this booking" UI in the
live product today**, a bigger gap than the narrow referral-completion ask. Not fixed this ring
(out of Ring 8's explicit scope, which was "wire the helper into the approve transition", not
"build the approve UI"); flagged here for the orchestrator to scope as its own follow-up.

**Fixed** (the literal Ring 8 ask, so the wiring is correct the moment an approve UI exists):
`app/api/bookings/[id]/confirm/route.ts` now (a) accepts `"pending_approval"` alongside
`"pending"`/`"confirmed"` in its pre-transition guard, and (b) calls
`completeReferralForFirstBooking(admin, booking.user_id, booking.referral_code)` on a genuine
`pending`/`pending_approval` -> `confirmed` transition (guarded by `wasAlreadyConfirmed`, never
re-run when this route is hit again on an already-confirmed booking). No change to the helper
itself (`lib/referral/complete-referral.ts`): it was already correct, its own compare-and-swap
(`.eq("status","pending")` on the `referrals` row) plus the live
`referrals_one_completed_per_referred_uidx` partial unique index (helper catches the `23505`)
already make a concurrent/duplicate call from ANY of the three call sites a safe no-op, verified
live this round (see kill test).

---

## 6. Kill test

`scripts/ring8-kill-test.ts` (`npx tsx scripts/ring8-kill-test.ts`), 18/18 scenarios pass:

- **Promo CAS shape** (section A): the real column is deliberately not live yet this build
  round (orchestrator applies the migration), and this sandbox has no raw-SQL execution path
  (no `exec_sql`/`pgexec` RPC, no `DATABASE_URL`) to create a throwaway table with the same
  column shape either (both confirmed by direct probe this round). So instead of one live
  Postgres exercise, four independent checks cover the same ground: the migration file's
  `ADD COLUMN IF NOT EXISTS` idempotency (regex on the file), the real webhook file containing
  the exact claim UPDATE + `.is(..., null)` guard + the confirmedRow gate (source-grep, so this
  test cannot silently drift from the deployed code), a logic-replica of the CAS predicate
  itself (first claim wins, repeat is a no-op), and an honest live-DB probe reporting whether
  the column has been applied yet (informational, not a pass/fail gate).
- **Referral completion idempotency** (section B): exercises the REAL live DB. Two throwaway
  auth users (created via `admin.auth.admin.createUser`, never real customers) + a throwaway
  `referrals` row. Calls the real `completeReferralForFirstBooking` twice with the same
  synthetic referred user: first call completes + credits both sides (verified 2
  `user_credits` rows), second call is a no-op (verified still exactly 2 rows, no double
  credit). Full cleanup in a `finally` block (credits + referral + both auth users deleted),
  verified no leftover state after the run.
- **Approve-transition wiring** (section C, source-grep): confirms
  `app/api/bookings/[id]/confirm/route.ts` imports + calls the helper and accepts
  `pending_approval`.

`npx tsc --noEmit` after all changes: 4 pre-existing errors remain, all in files this ring did
not touch (`app/api/admin/discovery/backfill/route.ts`,
`app/api/cron/discovery-ai-backfill/route.ts`, `scripts/ring1-kill-test-scenario.ts`), 0 new
errors introduced by this ring's changes.
