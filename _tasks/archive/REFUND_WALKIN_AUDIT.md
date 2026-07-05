# Refund / Dispute / Upcharge + Walk-in — System Audit

> Diagnostic produced 2026-06-02 from 6 parallel read-only discovery agents (code + LIVE Supabase DB).
> Scope: everything built this session (refund/dispute/upcharge spine, the 3 customer screens, the 3 operator dashboards) + the walk-in/queue system + their backends + money movement + DB reality + cross-cutting (auth/abuse/i18n/errors/deploy/concurrency).
> Confidence tags: **[C]** = corroborated by ≥2 independent agents; **[DB-verified]** = confirmed against the live database; **[1]** = single-agent, needs verification.

---

## 0. Executive summary

**The canonical money core is genuinely well-built. The danger is everything around it.**

The unified dispute spine — `booking_disputes` + `case_events` + the single `issueRefund` chokepoint + `chargeUpcharge` — is sound: compare-and-set (CAS) status guards, deterministic Stripe idempotency keys, integer-Rappen discipline, review-first (no silent auto-approve), correct role auth, and refund-can't-exceed-paid enforced in three places. **Do not rewrite this.**

The risk concentrates in five rings around that core:

1. **The free-booking gap (G2).** Online booking creates a row but **never charges Stripe**. So for most bookings there is *no payment to refund or upcharge against* — the well-built spine often has nothing to operate on.
2. **Parallel legacy systems.** Three older dispute/upcharge surfaces still exist and are partly *live + reachable*; several 400 silently, one emails customers a dead link, and one legacy charge path is a **phantom charge** (marks "charged", moves no money).
3. **Walk-in is split-brained and half-broken.** The pay-gated tokenless flow (System A) is real and good. The staff-added flow (System B) is **100% broken at the DB layer** and never enters the live queue.
4. **Ops landmines.** The Stripe webhook must be re-pointed post-Netlify or money state silently desyncs; `platform_settings` and `warnings` tables are **absent from the live DB**.
5. **Abuse / i18n / error-handling gaps** around the edges.

**Two pivotal decisions gate most of the fix work** (see §4): (A) Is **full-prepay** the canonical payment model (retire the deposit-hold model)? (B) Is **System A** the one canonical dispute system (delete the legacy surfaces)? Both look strongly "yes" from the code, but they're product calls.

---

## 1. System map

### Dispute / upcharge surfaces (four coexisting)

| Sys | What | Table | Status | Entry points |
|-----|------|-------|--------|--------------|
| **A** | Unified refund + upcharge engine (canonical) | `booking_disputes` + `case_events` | **Live, well-built** | Customer: `bookings/[id]/{report,refund,upcharge}`; Salon: `dashboard/{refunds,upcharge}`; Admin: `dashboard/cases`. APIs: `bookings/[id]/{report,dispute,refund,escalate}`, `admin/booking-disputes/*`, `dashboard/disputes` |
| **B** | Legacy manual-capture price-confirm / increase-approve | `bookings.*` columns (`deposit_held`, `final_price`, `price_increase_*`) | **Legacy, partly live** | Salon "Preis bestätigen" button `dashboard/bookings/page.tsx:289` → `stripe/confirm-price` → `stripe/approve-increase` |
| **C** | Legacy `price_disputes` upcharge (48h silent auto-approve) | `price_disputes` | **Dead insert path, live read paths** | `admin/disputes` route, `dashboard/disputes` page, `cron/auto-complete`, broken `respond-adjustment` page |
| **D** | Stripe card-network chargeback handler | (none — notify only) | **Notify-only stub** | `stripe/webhook` `charge.dispute.created` → emails admin, no DB record |

**A is canonical** (only system with both money directions, CAS+idempotency, review-first, guest support, audit timeline, live nav). **C is fully superseded** by A (`direction='upcharge'`). **B overlaps A's upcharge** but on a different payment model. **D is orthogonal** — keep separate (it's real card-network chargebacks), just link it to the booking + write a `case_events` note.

### Two payment models (the root split)

- **Full-prepay** (`paid_amount` Rappen + saved card off-session) — what the foundation migration, `issueRefund`, and `chargeUpcharge` all assume. **Canonical-in-progress.**
- **Deposit-hold** (`capture_method:"manual"` → `payment_status:"deposit_held"`) — what System B + `create-payment-intent` + `/checkout` + `release-*` crons assume. **Legacy, currently unreachable from the live consumer path.**

A booking is normally in *one* model, which is the only thing preventing System A + System B from both charging it. **Nothing enforces that exclusivity.**

### Walk-in (two subsystems that don't share state)

- **System A (real, matches vision):** `walk-in-join` → `pay-intent` (manual-capture hold) → `confirm` → `createWalkinTicket` → `barber_walkin_queue`. **Pay gates the number.** Capture on complete, refund on cancel, webhook backstop, race-safe ticket codes, daily reset (date-scoped count), atomic resequence RPC, live EWMA wait-time, "free in X min" search. **This is the good path.**
- **System B (broken):** dashboard `WalkInModal` → `POST /api/bookings/walk-in` → writes a `bookings` row, **no queue entry, no ticket**. Depends on a dead SMS link to ever reach payment.

---

## 2. Findings by severity

### CRITICAL

- **C1 — Online booking never charges; every "online payment" is a free booking. [C]**
  `components-legacy/booking/PayConfirmStep.tsx:103` POSTs `/api/bookings`, then routes straight to `/confirmation`. It never mounts Stripe Elements, never calls `confirmPayment`, never calls `booking-pay-intent` (which has **no caller anywhere**). `app/api/bookings/route.ts` POST inserts the booking and makes **zero Stripe calls** (sets `payment_status:"none"`, expects a webhook that never fires because no PaymentIntent exists). Result: customer believes they paid, salon sees a confirmed booking, Stripe sees nothing, `paid_amount` stays null. **Downstream:** refund throws `NO_PAID_AMOUNT`, upcharge throws `INVALID_AMOUNT`/`NO_SAVED_CARD` — the entire post-booking money lifecycle is dead on these bookings. *(The server half — `booking-pay-intent` — is fully real and idempotent; it's just never called.)*

- **C2 — Stripe webhook re-point after the Netlify migration (silent money desync). [C]**
  `_tasks/INCOMPLETE_FEATURES.md:41`: "If left at the Vercel URL, payments break silently." This is load-bearing here: `issueRefund` (`lib/bookings/issue-refund.ts:183-190`) deliberately does **not** reconcile `salon_payouts` and defers to the `charge.refunded` webhook as the single canonical reconciler; the walk-in webhook backstop (`lib/barber/walkin-ticket.ts:93-101`) guarantees a paid hold still gets a ticket if the client drops. If the endpoint is dead: refunds claw back at Stripe but payouts never decrement (salon overpaid), saved cards never persist (so later upcharge/fee charges fail `NO_SAVED_CARD`), and dropped walk-in confirms strand a charged card with no ticket. Signature verification itself is correct. **Unverifiable from code — must be checked in the Stripe dashboard.**

- **C3 — Walk-in booking creation is 100% broken (System B). [DB-verified]**
  `app/api/bookings/walk-in/route.ts:59-73` inserts into `bookings` via the **RLS-scoped** client with no `user_id`, no `slot_id`, no guest fields. **Three independent blockers, confirmed against the live DB:** (1) RLS `bookings_insert_auth WITH CHECK (auth.uid() = user_id)` rejects (salon owner's uid ≠ null user_id); (2) `slot_id` is NOT NULL with no default and walk-ins have no slot; (3) `bookings_owner_or_guest_chk` requires `guest_name`+`guest_phone` when `user_id` is null, and the insert sets neither. No walk-in booking can be created today.

- **C4 — No-show holds silently expire; no policy to capture or release. [C]**
  `app/api/walkin/queue/[id]/route.ts:78-89` deliberately skips `no_show` "so the salon's cancellation policy can decide" — **but that policy doesn't exist** (no dashboard setting, no column). A no-show hold is neither captured (charge the flake) nor released; it expires (~7 days) — customer pays nothing, salon gets nothing. The headline anti-flake mechanism of the walk-in vision is absent.

- **C5 — Double-charge risk: System A upcharge vs System B approve-increase. [C]**
  Both can add money to the same completed booking via different mechanics (B: `approve-increase/route.ts:59` PI for the difference; A: `chargeUpcharge` off-session, `dispute-engine.ts:305`). **No shared idempotency namespace, no mutual status guard.** In practice each requires a different payment-model state, so normally only one fires — but a mixed-state booking (manual-capture + saved card) could be charged by both. Closing this requires either retiring B (decision A) or adding cross-guards.

### HIGH

- **H1 — Legacy `approve-increase` is a phantom charge. [1, money-agent]**
  `app/api/stripe/approve-increase/route.ts:59-67` creates the price-increase-difference PI with `confirm:false` and no customer → **never charged** — then flips the booking to `payment_status:"charged"` (`:70`). The salon is told the increase was collected; no money moves. Bounded to the legacy deposit flow (currently unreachable), but a live trap if that flow is ever re-enabled. Also leaks an orphan uncaptured PI each call.

- **H2 — `pre-charge` cron has no idempotency key. [1, money-agent]**
  `app/api/cron/pre-charge/route.ts:75` is the only off-session charge that bypasses the shared `chargeOffSession` primitive and passes **no idempotencyKey**. If the cron overlaps/retries before `payment_status` flips (`:80`), the customer is double-charged the full amount.

- **H3 — Three+ legacy dispute surfaces are live, reachable, and 400 silently. [C]**
  - `components-legacy/disputes/ReportProblemModal.tsx:46` (customer, in `ProfilePage.tsx:24`) POSTs old `{issue_type,description}` — missing `wants_refund` → 400.
  - `components-legacy/dashboard/DisputeNotification.tsx:32` (salon, rendered in `dashboard/bookings/page.tsx:304`) PATCHes `{salon_response}` with no `action` → 400. (Also uses retired `s-coral`.)
  - `bookings/[id]/respond-adjustment/page.tsx` + `bookings/[id]/approve-increase/page.tsx` send `action:"dispute"`, rejected by `upchargeRespondSchema` (`approve|decline` only) → 400. Both read dead `original_amount`/`auto_approve_at` fields, and `respond-adjustment` computes the delta wrong (in System A `requested_amount` already *is* the difference).
  - Legacy admin `dashboard/disputes/page.tsx:79` → `admin/disputes/route.ts:22` reads the dead `price_disputes` table → admin sees an empty queue and may think there are no disputes while real cases sit in `booking_disputes`.

- **H4 — A second LIVE upcharge path emails customers a dead link. [C]**
  `dashboard/bookings/page.tsx:289` "Preis bestätigen" → `stripe/confirm-price` writes `bookings.final_price`/`price_increase_requested_at` (never a `booking_disputes` row) and emails `/de/bookings/{id}/approve-increase` (locale hardcoded; points at the broken page). The canonical `dashboard/upcharge` queue never sees it.

- **H5 — Walk-in queue staff-auth predicate is wrong. [1, cross-cutting]**
  `app/api/walkin/queue/[id]/route.ts:41-44` gates the capture/refund PATCH with `staff_members.id == user.id`, but the auth↔staff link is `staff_members.user_id`. Effect: assigned staff are silently 403'd; only the salon owner can advance/cancel the queue. Clear bug (should be `.eq("user_id", user.id)`) — unless owner-only is intended.

- **H6 — Walk-in analytics are fabricated. [1, walk-in]**
  `app/api/dashboard/walkin-analytics/route.ts:55-77`: trend sparklines are literally `Math.random()`/`Math.sin(i)`; `avg_wait = 12 + (n % 10)`; and it filters on `bookings.is_walkin` — a column that **does not exist anywhere** — so every metric collapses to 0. Anything a salon decides from this tab is noise.

- **H7 — No cooldown / lifetime cap on re-filing after rejection. [1, cross-cutting]**
  The `booking_disputes_one_open_per_dir` index excludes `salon_rejected`/`void`/`admin_rejected`, so a customer whose refund was rejected can immediately open a new one, and a declined/void upcharge can be re-requested — looping. Only `paymentLimiter` (3/hr) brakes it. A proper escalation path exists for rejected refunds, so unlimited re-filing is both abuse surface and worse UX.

- **H8 — Canonical upcharge screen has no inbound link. [1, UI-wiring]**
  `/bookings/[id]/upcharge` is referenced only by its own page; the canonical upcharge email (`dispute/route.ts:182`) ships no URL. The working approve/decline screen is essentially unreachable through the product.

- **H9 — Walk-in payment stored in the wrong unit for the dispute engine. [DB-verified]**
  Walk-in writes `price_paid` (CHF) and never `paid_amount` (Rappen, `:67`). If a walk-in is ever disputed/upcharged, the cap base reads 0 → upcharge always rejected, nothing refundable. Also a live mixed-unit hazard: admin dispute payloads select `price_paid` (CHF) alongside `paid_amount`/`refunded_amount` (Rappen) — a 100× display foot-gun.

### MEDIUM

- **M1 — `platform_settings` table is absent from the live DB. [DB-verified]** Commission is un-configurable platform-wide (frozen at the 15% default via `DEFAULT_COMMISSION_RATE_PERCENT`); the admin commission + homepage-sections endpoints error on read. No silent money loss on the dispute path (caps use `paid_amount`; 15% is a safe fallback), but admin can't change the rate. `walkin/pay-intent/route.ts:91` uses `.single()` (vs the dispute engine's graceful `maybeSingle()`) on this missing table — confirm it degrades rather than 500s.
- **M2 — Post-payment "Cancel" on the walk-in pay screen is a no-op refund. [1]** `walk-in-pay/page.tsx:211-215` shows "payment will be refunded" but issues no refund and doesn't cancel the queue entry (TODO in code). The `/queue/[token]` cancel IS real; this one isn't.
- **M3 — Homepage walk-in CTA 404s. [1]** `WalkInBand.tsx:17` links to `/walk-in`, which doesn't exist (only `/walk-in-join`, `/walk-in-pay`). The PDP entry (`SalonWalkInPanel`) is correct.
- **M4 — i18n: walk-in pay flow is off next-intl with hardcoded German. [1]** `walk-in-pay/page.tsx` ships a hand-rolled inline dict + raw German strings shown to en/fr/it (`:235,249,314,751`), and `WalkInPaymentForm.tsx` hardcodes German payment errors (`:39,49,55,57`) — the live Stripe error surface. *(The refund/report/upcharge customer flow + all 3 dashboards are fully localized in all 4 locales — verified.)*
- **M5 — `getSession()` vs `getUser()` for auth decisions. [1]** `refund/route.ts:18` and `lib/bookings/authorize.ts:66-70` (all 5 report/dispute/upcharge/escalate routes) use `getSession()`, which `middleware.ts:137` explicitly calls unsafe for auth decisions. Mitigated by ownership re-checks (the routes never move money on session identity alone), but it diverges from the project's own stated rule.
- **M6 — `pay-intent` Stripe call unguarded; bare `catch{}` without logging. [1]** `walkin/pay-intent/route.ts:125` has no try/catch (unhandled 500, no log, on the customer's first pay step); `WalkInPaymentForm.tsx:57` swallows the error with no `console.error` (violates the project error rule). Also `customer_name`/`customer_phone` go into Stripe metadata as unvalidated free text (Stripe rejects >500 chars → unhandled throw).
- **M7 — `auto-complete` cron is blind to the canonical dispute table. [C]** `cron/auto-complete/route.ts:21` guards on `price_disputes` (dead). Open System A cases don't block auto-completion, and the query errors if `price_disputes` is absent live.
- **M8 — Walk-in queue `position` insert race. [1]** `select max(position)+1 → insert` with no unique constraint on active `(salon_id, position)`. Concurrent joins collide (cosmetic ordering). Resequence-on-departure is correctly atomic.
- **M9 — SMS provider is not wired. [C]** `app/api/bookings/walk-in/route.ts:82-101` advertises an SMS pay-link but no provider exists, so System B walk-ins can never reach payment. Returns 201 "success" with `sms_sent:false`.

### LOW

- **L1 — `warnings` table absent from live DB. [DB-verified]** Admin `warn_customer`/`warn_salon` actions (`action/route.ts:281`) throw on insert. (All other admin actions are fine.)
- **L2 — Escalate reason picker is dead input.** `RefundCaseView.tsx:765` collects `escReason`, never sent in the POST (`:142`).
- **L3 — `price_disputes` table never dropped; no DROP migration.** Dead insert path, live read paths. Cleanup debt.
- **L4 — Stripe chargeback (System D) is notify-only.** No DB record, no representment, not linked to the booking.
- **L5 — 16 unrelated tables have RLS disabled** (`discovery_*`, `waitlist`, `platform_stats`, `test_table`, …) — anon-key read/write. Out of scope but a live data-exposure issue worth a separate ticket.
- **L6 — `description` min-length inconsistent** (`createCaseSchema` ≥20 vs legacy `disputeSchema` ≥5).

---

## 3. What's verified-GOOD (do not break)

- **Single refund chokepoint** `lib/bookings/issue-refund.ts:135` — real `stripe.refunds.create`, `reverse_transfer` + `refund_application_fee` for Connect, deterministic idempotency key, CAS on `refunded_amount`. All 6 refund callers route through it.
- **Upcharge off-session** `chargeUpcharge` → `chargeOffSession` — real PI, `off_session:true,confirm:true`, +50% cap checked twice, SCA parked gracefully, key `upcharge:{id}:{amount}`.
- **Auth:** dashboard routes correctly gated in `middleware.ts` (cases = admin-only; refunds/upcharge = salon-owner); admin APIs all check `role==='admin'`; no cross-salon action; guest enumeration handled.
- **Refund ≤ paid** enforced at create, salon-approve, and chokepoint. **Upcharge ≤ +50%** enforced twice. Customer must explicitly approve upcharge (no silent auto-approve).
- **Concurrency:** refund double-spend, upcharge double-charge, and walk-in ticket double-issue are all race-safe (CAS + partial unique indexes + 23505 retry).
- **Walk-in System A** (pay-gated tokenless): real holds, capture-on-complete, refund-on-cancel, webhook backstop, daily reset, atomic resequence, adaptive EWMA wait-time, "free in X min" search.
- **DB foundation landed [DB-verified]:** `booking_disputes` (all new columns), `case_events`, `barber_walkin_queue` (+ `ticket_code`/`payment_intent_id`/`tracking_token`), the partial unique indexes, and all CHECK constraints match the code's enums. Schema drift is **partial, not total**.
- **i18n** of the canonical refund/dispute/upcharge flow is complete in de/en/fr/it.

---

## 4. The two pivotal decisions (gate most fixes)

- **Decision A — Is full-prepay the canonical payment model?** If yes: retire System B (`confirm-price`, `approve-increase`, manual-capture in `create-payment-intent`, the `/checkout` page, the `deposit_held` PATCH branch, `release-*` crons' deposit logic) — which also kills C5 (double-charge) and H1 (phantom charge). If both models stay: System B needs an idempotency key + a "no open System-A upcharge exists" guard. *Code strongly implies full-prepay is the target.*
- **Decision B — Is System A the one canonical dispute system?** If yes: delete System C reads (`admin/disputes` route, `dashboard/disputes` page, `respond-adjustment`+`approve-increase` pages, the `auto-complete` `price_disputes` guard), remove the legacy `ReportProblemModal`/`DisputeNotification` renders, drop `price_disputes`. Keep System D (chargebacks) separate but linked. *Everything points to yes.*

---

## 5. What's left to do (gap list, pre-prioritization)

1. Wire real Stripe Elements + create-then-charge on the booking path (fix C1/G2). *(User is doing FE mockups for this.)*
2. Re-point the Stripe webhook to Netlify + verify signature/events (C2).
3. Fix walk-in booking creation: admin client + slot_id strategy + guest fields (C3).
4. Build the salon cancellation policy (data model + dashboard) and wire no-show capture/release (C4, M2).
5. Resolve Decision A → retire or guard System B (C5, H1).
6. Resolve Decision B → delete/redirect the legacy dispute surfaces (H3, H4, M7, L3).
7. Migrate `pre-charge` cron onto `chargeOffSession` (H2).
8. Fix walk-in staff-auth predicate (H5).
9. Unify walk-in into one queue (System B → write to `barber_walkin_queue` or QR into the pay-gated flow) (split-brain).
10. Replace fabricated walk-in analytics with a real source (H6, needs an `is_walkin` signal or a queue join).
11. Add a re-file cooldown/cap after rejection/void (H7).
12. Link the canonical upcharge email → the upcharge screen (H8).
13. Populate `paid_amount` (Rappen) on the walk-in path; stop selecting `price_paid` in admin payloads (H9).
14. Seed `platform_settings` (commission + refund policy) and `warnings`, or remove the dead reads (M1, L1).
15. i18n the walk-in pay flow (M4); harden `pay-intent` error handling + metadata validation (M6).
16. Fix the homepage `/walk-in` CTA (M3).
17. Verify first runs of the money crons (release-payments/deposits, pre-charge, no-show, auto-complete) (deploy).
18. Minor: escalate reason wiring (L2), description min-length (L6), queue-position race (M8), chargeback DB record (L4), RLS-disabled tables (L5, separate ticket).

---

## 6. Conflicts to resolve in review

- **`charge-fee.ts` commission fallback:** `INCOMPLETE_FEATURES.md:108` says this was RESOLVED to `DEFAULT_COMMISSION_RATE_PERCENT`; the cross-cutting agent flagged it as still `?? 1`. Likely the agent read the "kept for history" block. **Verify the current line.**
- **Migration-applied state:** the DB agent confirmed the dispute foundation + walk-in tables ARE live, contradicting the worst-case schema-drift fear. Treat the DB-verified findings as authoritative over the static-only agents' "unverified" caveats.

---

## 7. Open questions for the user (product calls, not code)

1. **Payment model:** full-prepay canonical, retire deposit-hold? (Decision A)
2. **Dispute system:** delete the legacy surfaces, System A is the one? (Decision B)
3. **No-show policy:** on a walk-in no-show, capture the full hold, a partial fee, or release? (Drives C4 + the cancellation-policy data model.)
4. **Cash/in-person walk-ins:** should staff be able to add a walk-in who gets a number *without* online payment (cash), or is pay-gated the only path? (Drives the System B fix direction.)
5. **Re-file policy:** force escalate-only after a refund rejection, or allow a new case with a cooldown?
6. **Webhook:** has the Stripe webhook been re-pointed to the Netlify domain? (Can't be checked from code.)

---

# Diagnostic v2 — post-review (the sharper picture)

> Produced after 3 review agents (adversarial verifier + completeness critic + sequencing strategist) challenged Diagnostic v1 above. This section CORRECTS v1 and ADDS what it missed. Where v2 conflicts with v1, **v2 wins.**

## 8. Corrections to v1 (verified)

- **C4 was partly wrong.** The headline (walk-in *queue* no-show hold is neither captured nor released — `walkin/queue/[id]/route.ts:78-89`) is CONFIRMED. But the parenthetical "(no dashboard setting, no column)" is **FALSE**: the 5 policy columns exist live (`salons.cancellation_fee_type/_value`, `free_cancel_hours`, `no_show_fee_type/_value`), the dashboard `CancellationTab` exists (`dashboard/settings/page.tsx:1177`), and a working no-show charge engine already runs for the *appointment* path (`cron/no-show/route.ts:70-95` → `chargeFee`). **Real gap = the walk-in queue path isn't wired to the existing policy engine.** Much smaller than v1 implied.
- **H1 overstated.** The deposit capture in `approve-increase` IS real money (`:52`); only the price-*increase difference* PI is phantom (`confirm:false`, never confirmed). Restate as "the increase portion is never charged," not "no money moves." Bounded to the unreachable legacy deposit flow.
- **C5 is latent, not actively firing.** The A-vs-B double-charge needs a booking simultaneously in full-prepay AND deposit-hold state — nothing on the live path produces that. Real (no exclusivity is enforced) but a guard-on-cleanup item, not a routinely-reachable CRITICAL.
- **M9 is stale — DELETE it.** seven.io SMS IS wired (`walk-in/route.ts:88-100`, gated on `SEVEN_IO_API_KEY`). System B's only blocker is C3 (the insert fails before SMS is reached).
- **`price_disputes` is ALREADY absent from the live DB** (`to_regclass=false`). So H3/M7's "reads a dead table" is actually "errors on a missing table" — strengthens them. L3 (DROP migration) only matters as cleanup of the migration files; the live table is already gone, so the reads must be removed to stop 500s.
- **charge-fee.ts conflict SETTLED:** it uses `DEFAULT_COMMISSION_RATE_PERCENT` (15), not `?? 1`. v1 §6 was right; the cross-cutting agent misread a history comment. **No action.**
- **`deposit_held` is CO-OWNED by walk-in System A** (`webhook:103-107`, `walkin-ticket.ts:178`, `walkin/queue/[id]:62`). **Decision A's "retire deposit-hold" must be scoped to the APPOINTMENT path only** — manual-capture is load-bearing for walk-in. An agent that greps `deposit_held` and deletes it all would break walk-in capture/refund. (Highest-value sequencing catch.)
- **`is_walkin` blast radius is 3×:** the phantom column is read in `walkin-analytics`, `barber/pl-comparison`, AND `barber-leaderboard`. One signal fix (H9) unblocks all three.

## 9. New findings the audit MISSED (verified against code)

### CRITICAL (new)
- **N1 — A refund is issued with ZERO customer notification.** Salon-approve (`dispute/route.ts:454-472`) and admin refund/approve (`admin/booking-disputes/[id]/action/route.ts:92-246`) issue the refund + write `case_events` + `logAuditEvent` but make **no** customer email/notification. The `refund_processed` template EXISTS (`lib/notifications.ts:112`) and is **never called**. Money leaves Stripe, the case flips to `refunded`, the customer is told nothing. Cheap to fix (template exists), high impact (trust + chargeback magnet).

### HIGH (new)
- **N3 — Upcharge SCA (3-D Secure) dead-ends; UI shows "approved" while NO money is captured.** `chargeUpcharge` returns `requires_action`+`clientSecret` (`dispute-engine.ts:319`), the route surfaces it at HTTP 200 (`dispute/route.ts:346`), but `UpchargeApproveView.tsx:178` treats any `res.ok` as success and never mounts `confirmCardPayment`. `client_secret` has **no consumer anywhere**. Every upcharge needing 3DS (common on Swiss/EU cards under PSD2) silently fails-to-charge while showing "approved." Structural, not edge.
- **N5 — Walk-in cancel refund bypasses `issueRefund` AND omits the Connect reversal.** `walkin/queue/[id]/route.ts:86` calls `stripe.refunds.create({payment_intent})` directly with **no `reverse_transfer`/`refund_application_fee`**. Customer refunded, salon keeps the transferred funds, platform eats the loss. (A 7th refund path — contradicts v1's "all 6 callers route through the chokepoint.") No `case_events`, no notification.
- **N6 — 5 non-booking money types have NO refund path.** Gift cards, vouchers, packages, salon retail, tips all create PaymentIntents; none are refundable (grep: zero `refund` refs; `issueRefund` hard-rejects `source!=="booking"`). v1's system map silently scoped to bookings+walk-in.
- **N7 — `charge.refunded` webhook reconciler throws on the no-payout-row case.** `webhook/route.ts:323` uses `.single()` on `salon_payouts`; for any free booking (C1 majority) or walk-in there's no row → throws → idempotency claim released → **Stripe retries the event forever** (retry-storm). The "robust canonical reconciler" isn't robust on its most common edge.
- **N9 — DSG/GDPR vs Swiss bookkeeping is unhandled.** `cron/process-deletions` only scans `profiles` (guests have no profile → their `booking_disputes.guest_*` + `case_events.note` PII have no erasure path). `booking_disputes.reporter_id` is `ON DELETE CASCADE` to `auth.users` → deleting a customer **destroys the financial audit trail** for refunds that moved real money (violates OR Art. 958f 10-year retention). Need anonymize-not-delete on financial rows + a guest-PII path. The deletion cron is also a stub.
- **N10 — No error monitoring/alerting anywhere.** No Sentry/captureException (grep: zero). Every money-move failure (stuck upcharges, failed captures, the N7 retry-storm, failed off-session fees) surfaces only as `console.error` in Netlify logs nobody watches.

### MEDIUM (new)
- **N2/N4 — No notification on upcharge-charged (N2) or no-show/late fee charged (N4).** Templates exist, never wired. A silently-debited card is a chargeback magnet.
- **N8 — Possible double-decrement of the salon payout.** `reverse_transfer:true` (Stripe auto-claws from the connected balance) PLUS the manual `salon_payouts` decrement (`webhook:325`). If any payout cron consumes `net_amount`, the salon is debited twice. Needs Stripe-dashboard confirmation of whether the ledger is consumed or display-only.
- **N11 — `logAuditEvent` swallows ALL errors** (`lib/audit.ts:23` `catch {}`). The dispute-engine leans on it as the redundant trail when `case_events` fails — but it's silent-on-failure. (Also: `audit_log` live presence unverified.)
- **N12 — Chargeback never reconciles the Connect clawback or dispute fee**; no `charge.dispute.closed` handler (a *won* dispute never re-credits). Salon payout ledger overstates by the chargeback amount.
- **SLA — the 30-day escalation is a dead column.** `mediation_deadline_at` is written (`action/route.ts:54`) and read by **nothing**; no cron enforces/surfaces it. An escalated case sits forever.
- **Partial-refund model holes:** (a) a partial refund flips the dispute to terminal `refunded` (no `partially_refunded` dispute status) → the case view misrepresents "30 of 100" as fully refunded; (b) **partial-refund-then-upcharge is unguarded** — the +50% upcharge cap is computed off gross `paid_amount`, ignoring `refunded_amount` (`dispute/route.ts:108`, `dispute-engine.ts:276`). After refunding 50/100 the salon can still upcharge 50.
- **Free-booking + report wedges the case.** On a C1 free booking, salon-approve → `issueRefund` throws `NO_PAID_AMOUNT` → case stuck at `salon_approved`, customer sees "approved" then nothing. No alert.
- **Guest token TTL vs escalation lifetime.** Guest access token TTL is 30 days; escalation runs a 30-day mediation window — a guest can be locked out of their own still-open dispute.
- **Two open directions at once.** `one_open_per_dir` permits a simultaneous open refund AND open upcharge on the same booking, with no cross-direction guard.

## 10. Corrected severity ranking (what to actually worry about)

1. **C1** — free bookings (no charge). The linchpin: the whole spine has nothing to operate on until this lands.
2. **C2** — webhook re-point (ops; gates all reconciliation).
3. **C3** — walk-in creation 100% broken (3 DB blockers).
4. **N1** — refund issued with no customer notification (trust + chargeback; cheap fix).
5. **N3** — upcharge silently fails on 3DS cards (EU-market structural).
6. **N7** — webhook retry-storm on no-payout-row.
7. **N5** — walk-in refund leaks Connect funds.
8. **C4** — walk-in no-show neither captured nor released (now: just wire the existing policy engine).
9. **N9 / N10** — compliance (retention vs erasure) + zero observability.
10. **N6** — 5 money types unrefundable.
11. **H2** (pre-charge idempotency), **H5** (staff predicate), **H9** (walk-in paid_amount) — safe-now, decision-independent.
12. Then the dead-surface removals (H3/H4/M7, gated on Decision B), and the polish/edge items.

## 11. Critical path (corrected)

`C2 (webhook, ops)` → `Decide A + B` → `C1/G2 (real charge; user doing FE mockups)` → `retire System B (appointment-path only!)` → `H2 (idempotency)` → `H9 (walk-in paid_amount)`. That six-step core = trustworthy money. **N1 (notification) is a cheap parallel win that should ride along early.** Everything else layers after.

**Decision gates (Layer 0, no code):** Decision A (full-prepay canonical, retire deposit-hold *for appointments only*), Decision B (System A canonical, delete legacy surfaces), and user policy calls: no-show capture vs release, cash walk-ins allowed?, re-file cooldown vs escalate-only. Plus the ops check: is the webhook re-pointed?
