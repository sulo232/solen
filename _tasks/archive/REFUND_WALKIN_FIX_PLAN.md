# Refund / Dispute / Upcharge + Walk-in — Remediation Plan

> Built from: 6 discovery agents → audit (`REFUND_WALKIN_AUDIT.md`) → 3 review agents → Diagnostic v2 → 5-member expert council → code-level adjudication of every contradiction. This plan is the execution artifact for the fix wave.
> Companion doc: `_tasks/REFUND_WALKIN_AUDIT.md` (the evidence). This doc is the decisions + sequencing.

---

## 1. Settled contradictions (adjudicated by reading the code, not by vote)

| Claim | Verdict | Evidence |
|---|---|---|
| N7 `charge.refunded` `.single()` causes an infinite retry-storm | **FALSE (downgraded).** The founder-CTO was right vs 3 specialists. | `webhook/route.ts:323` destructures only `data`, ignores `error`; `:324` guards `if (payout)`. Zero rows → `payout=null` → skip → no throw. |
| …but the refund-ledger decrement is buggy | **TRUE (narrow).** | `:325-332` does `gross - charge.amount_refunded` (cumulative) against an already-decremented gross → over-decrements across *multiple* partial refunds. Rare. |
| N8 salon double-*charged* on refund | **FALSE — it's a display/invoice error, not fund loss.** | No `transfers.create`/`payouts.create` anywhere → settlement is automatic Connect destination charges; `reverse_transfer` is the only real clawback. `salon_payouts` is display-only (read by earnings/invoices/revenue). |
| Payout ledger doesn't cover all charge types | **TRUE (new, from payments architect).** | Single writer is `type:"booking"` (`webhook:125`); walk-in skipped (`:73`); upcharge/fee charges write no payout row → salon revenue + platform commission under-reported. |
| FK cascade destroys financial records on account deletion | **TRUE (cheap fix exists).** | `bookings.user_id … ON DELETE CASCADE` (`014_new_schema.sql:226`); the SET NULL precedent already shipped for reviews (`030_gdpr_support.sql:8`). |
| C4 "no policy exists" | **FALSE — policy engine exists.** | 5 `salons` policy cols + `dashboard/settings` CancellationTab + `cron/no-show`→`chargeFee` all exist; gap is the walk-in *queue* path isn't wired to them. |
| H1 "no money moves" | **OVERSTATED.** | Deposit IS captured (`approve-increase:52`); only the *increase difference* PI is phantom (`confirm:false`). |
| C5 active double-charge | **LATENT.** | Needs a booking in both payment models at once; nothing on the live path produces it. Killed for free by Decision A. |
| M9 "no SMS provider" | **STALE — delete.** | seven.io IS wired (`walk-in/route.ts:88`); System B's only blocker is C3. |
| charge-fee `?? 1` commission | **NON-ISSUE.** | It's `DEFAULT_COMMISSION_RATE_PERCENT` (15); the agent misread a history comment. |

---

## 2. Council synthesis (5 lenses)

**Where all five converged:** the synchronous money core (`issueRefund` / `chargeUpcharge` / `chargeOffSession`) is correct — do not rewrite it. The danger is the layers around it.

**Payments architect** — *flip C2 before C1* (C1 fails loud with typed errors; C2 fails silent + compounding). The webhook is the deliberate source-of-truth, so a dead endpoint silently desyncs every refund/payout/saved-card. Correct C1 = create-booking → `booking-pay-intent` → `<PaymentElement>` → `confirmPayment` → **webhook is the truth for "paid"** (never the client promise) + a new abandonment-sweeper cron + one server-trusted price source (incl. discounts). N3 needs **both** an FE 3DS consumer **and** a `payment_intent.succeeded` branch for `type:"upcharge"`. New finding: the payout ledger must cover ALL charge types via one reconciler.

**Trust & Safety** — *C1 is protective until fixed* (no charge = no chargeback); the real risk **begins at the C1 cutover**. #1 chargeback driver is **N4 (silent no-show fee)**, which can fire **today**. A thin-volume new Swiss Stripe account hits card-network monitoring at ~0.65-0.9% dispute ratio — very few disputes to get flagged. **Minimum contract: no money move without a contemporaneous, stored receipt** (it doubles as representment evidence). Off-session charges need a proper MIT/SCA agreement set up at the *first* charge or you eat the fraud liability. Net-of-refund the upcharge cap.

**Swiss/EU legal** — #1 is **N9**, and worse than stated: the cascade destroys *bookings* rows (OR Art. 958f wants 10-yr retention). Reconcile via **anonymize-not-delete** (revDSG Art. 6 / GDPR 17(3)(b) carve-out) — the FK flip is the cheapest highest-leverage fix. Silent off-session debits (N1/N2/N4) are a real consumer-law + PSD2 "unauthorized transaction" exposure, not just UX. Group **N3/H1/C1** as one finding: "the system records financial states it cannot prove." Needs formal legal review: Connect account type → merchant-of-record, retention scope, no-show terms, privacy/ROPA/DPAs/data-residency.

**Distributed systems** — #1: **there is no ledger and no reconciliation loop**, only mutable per-row state. Build a **daily Stripe-vs-DB reconciliation cron (~80 lines, worth half the punch list)**. Make `net_paid` a DB generated column + CHECK (closes the partial-refund-then-upcharge hole structurally). Webhook needs **advance-only `payment_status` guards** (order-safe) + failure classification (retryable vs not). Collapse the smeared state machine onto `booking_disputes` as source of truth; add a `partially_refunded` dispute status.

**Pragmatic founder-CTO (the counter-voice)** — *you have zero customers; your volume is hand-watchable.* The audit audited "the system you built, not the system you need to launch." **Shrink the launch scope** instead of fixing everything: book→pay→refund is a complete product; **defer upcharge + walk-in to v2** and ~30 findings + 2 features disappear. Non-negotiables: C1, C2, N1, empty-refund guard. Defer-with-documented-risk: N9 full rewrite (disable self-serve delete), N10 observability infra (be your own alerting), N12 representment, VAT credit-notes, N6 (don't enable products you can't refund), H7. Don't spawn 40 agents — ~6 items qualify; most findings are "one decision away from disappearing."

---

## 3. My own first-principles take (independent of the council)

Three structural truths I'd stake the plan on:

**(a) Solen built the hard 20% and skipped the unglamorous 80%.** The correct, race-safe money primitives are done and verified. What's missing is wiring (the charge firing), comms (the customer being told), reconciliation (a ledger you can audit), and durability (records that survive deletion). That's an *inverted* build order — and it's good news: the algorithmically-hard part is finished. Most of what remains is wiring, deletion, and a few guards, not new money logic.

**(b) Three of the worst findings are one disease.** C1 ("paid" but charges nothing), N3 ("approved" but charges nothing), H1 ("charged" but charges nothing) are the same bug: **a money-moved status written before Stripe confirms it.** One principle cures all three — *never write `paid`/`charged`/`refunded` until the webhook confirms the corresponding Stripe event.* Fix the principle, not the three symptoms. This is also the legal exposure ("states it cannot prove") and the trust exposure (lying to salon/customer) — same root.

**(c) C2 is re-connecting the brain, not "an ops task."** The codebase *deliberately* made the webhook the source of truth (issue-refund defers payout reconciliation to it; paid-state + saved-card come from it; the walk-in backstop is it). Until it's confirmed live on Netlify, every other money fix is unverifiable. So C2 is genuinely first — and the payments architect's "silent+compounding beats loud+contained" ordering is right.

**Where I overrule the founder (he's too aggressive on one point):** he says defer N9 entirely. Wrong for the *FK flip*. An accidental account deletion **irreversibly destroys financial records** — and irreversible data-loss is the one category you never defer even at zero scale, because if it fires once before you fix it, the records are gone and can't be reconstructed. So: **do the one-migration FK flip now**, defer only the full anonymize-service + intake. Nuance the founder missed.

**Where I side with distributed-systems over the founder:** build the **reconciliation cron** even at zero scale — not because you can't watch by hand, but because *it is the enabling condition that makes "defer everything else and watch" actually safe.* It converts silent drift into a visible daily diff, so deferring the edge-case fixes stops being a gamble. It's the cheapest insurance that legitimizes the founder's whole strategy.

**My synthesized position (a genuine third path, not an average):**
1. **C2 first** (re-connect the brain; ops; gates verifiability).
2. **Two decisions that DELETE work** (A: full-prepay canonical; B: System A canonical).
3. **The "never assert unproven money status" principle** (collapses C1+N3+H1).
4. **Scope-cut to lean v1** (book/pay/refund; defer upcharge + walk-in) — the single highest-leverage, zero-code move.
5. **Cheap irreversible-loss prevention now** (FK flip), defer the rest of compliance.
6. **The reconciliation cron as the safety net** that makes deferral safe.
7. **N1 receipt rides with C1 as a launch gate** — no real charge without a receipt.

---

## 4. The decisions that gate everything (Layer 0 — no code)

- **Decision A — payment model.** Full-prepay (`paid_amount` + saved card) canonical; retire deposit-hold **for the appointment path only** (manual-capture is load-bearing for walk-in — verified co-dependency). *Recommend: yes.* → deletes C5, H1; enables System B retirement.
- **Decision B — canonical dispute system.** System A (`booking_disputes`) is the one; delete the legacy surfaces (System C reads, the broken legacy pages, `admin/disputes`). Keep System D (chargebacks) separate. *Recommend: yes.* → deletes H3, H4, M7, L3.
- **Scope — v1 launch surface.** Lean (book→pay→refund) and defer upcharge + walk-in to v2. *Recommend: yes — drops the blocking list from ~12 to ~4.*
- **Ops (user-only, can't be done by code):** (1) re-point the Stripe webhook to the Netlify domain + enable the events the in-code switch handles (`charge.refunded`, `setup_intent.succeeded`, `payout.*`, `account.application.deauthorized` — the header comment at `webhook:16` omits them; fix it); (2) confirm in the Stripe dashboard whether payouts are automatic (they are, per code) so `salon_payouts` stays display-only; (3) decide seed-vs-remove for `platform_settings`/`warnings`.
- **User policy (only if walk-in/upcharge are in v1):** no-show = capture/partial/release?; cash walk-ins get a number without paying?; re-file after rejection = cooldown vs escalate-only?

---

## 5. Recommended critical path (lean v1 = "trustworthy money")

Smallest ordered sequence to a system that takes money safely end-to-end:

1. **C2 — re-point + verify the webhook** (ops, minutes). Send a test event. Nothing below is verifiable until this is green.
2. **Decide A + B + scope** (20 min of thinking; deletes more work than it creates).
3. **C1 — real Stripe Elements + create-then-charge** (FE mockups in progress by user). Server half (`booking-pay-intent`) already exists + is idempotent. Confirmation UI reads booking state (pending until webhook), never asserts paid from the client. One server-trusted price source incl. discounts. **+ new abandonment-sweeper cron** (cancel `pending` bookings with no succeeded PI after ~30 min, free the slot). Save the card with the correct off-session/MIT agreement for later charges.
4. **N1 (+N2/N4) receipt contract** — wire the existing `refund_processed` / upcharge-charged / no-show-fee templates; store the send on `case_events` as representment evidence. **Launch gate: no real charge ships without it.** N4 (no-show) gets a *pre*-charge notice.
5. **FK flip migration** — `bookings.user_id` + `booking_disputes.reporter_id/reported_id` → `ON DELETE SET NULL` (+ make nullable), mirroring migration 030. Stops account deletion from destroying financial records. (Disable self-serve account deletion until the full anonymize-service ships.)
6. **H2 — `pre-charge` cron idempotency** (route through `chargeOffSession`; one focused change). Prevents a real off-session double-charge on cron retry.
7. **Reconciliation cron** — daily Stripe-vs-DB diff (refunds/charges/payouts), alert on mismatch. The safety net that makes deferring everything else safe.
8. **Empty-refund guard** — block the refund UI / surface an error when `paid_amount` is null so a free booking can't wedge a case at `salon_approved`.

That's the launch bar. Everything else layers after, prioritized by what real transactions actually surface.

---

## 6. Full remediation — classification for the fix wave

Each item tagged: **[SAFE-NOW]** (decision-independent, low blast radius, run an agent now) · **[GATED:A/B/Scope/Policy/Ops]** · blast radius.

| Item | Class | Blast | Notes |
|---|---|---|---|
| C2 webhook re-point | GATED:Ops | HIGH | user-only |
| C1 charge wiring | GATED:Scope (in v1) | HIGH | user doing FE; new sweeper cron |
| N1 refund receipt | **SAFE-NOW** | LOW | template exists, additive |
| N2/N4 charge receipts | SAFE-NOW (if those charges in v1) | LOW | additive; N4 pre-notice |
| FK flip migration | SAFE-NOW* | MED | *needs migration sign-off (money schema) |
| H2 pre-charge idempotency | **SAFE-NOW** | MED | additive idempotency key |
| Reconciliation cron | **SAFE-NOW** | LOW | net-new, additive |
| empty-refund guard | **SAFE-NOW** | LOW | one guard |
| net_paid generated col + CHECK | SAFE-NOW* | MED | *migration; closes partial-refund-then-upcharge |
| H5 staff-auth predicate | GATED:Policy | LOW | owner-only vs staff? one-line if staff |
| H9 walk-in paid_amount | GATED:Scope(walk-in) | MED | unblocks H6 analytics (×3 readers) |
| H6 fabricated analytics | GATED:Scope(walk-in) | LOW | after H9 signal |
| C3 walk-in insert | GATED:Policy(cash) | MED | admin client + slot strategy + guest fields |
| C4 no-show wiring | GATED:Policy | HIGH | wire existing policy engine to queue no_show |
| N5 walk-in refund → issueRefund | GATED:Scope(walk-in) | MED | add reverse_transfer; route through chokepoint |
| H1/C5 System B retire | GATED:A | HIGH | scope to appointment path; keep deposit_held for walk-in |
| H3/H4/M7 legacy removal | GATED:B | MED | `dashboard/bookings/page.tsx` shared — one agent owns it |
| L3 DROP price_disputes | GATED:B (LAST) | LOW | only after reads removed; table already absent live |
| N3 SCA completion | GATED:Scope(upcharge) | MED | FE confirmCardPayment + webhook upcharge branch |
| payout ledger all-types | GATED:Scope | MED | one reconciler for booking/upcharge/fee/walk-in |
| webhook advance-only guards | SAFE-NOW | MED | order-safety on payment_status |
| H7 re-file cooldown | GATED:Policy | LOW | needs warnings table |
| H8 upcharge email link | GATED:Scope(upcharge) | LOW | additive |
| M3 homepage /walk-in 404 | GATED:Scope(walk-in) | LOW | fix or hide |
| M1/L1 seed tables | SAFE-NOW* | LOW | *migration; or remove dead reads |
| M4 i18n walk-in pay | GATED:Scope(walk-in) | LOW | |
| M6 pay-intent error handling | GATED:Scope(walk-in) | MED | |
| N9 full anonymize-service | GATED:Policy (defer) | MED | after FK flip |
| N10 observability infra | defer (be your own alerting) | LOW | one webhook-to-phone on payment_failed/dispute |
| N12 chargeback representment | defer | LOW | manual in Stripe dashboard |
| VAT credit-notes | defer | LOW | accountant handles at this scale |
| N6 non-booking refunds | defer (don't enable those products) | LOW | |
| L5 RLS-disabled tables | separate ticket | MED | data exposure, orthogonal |

**Parallel batches (non-overlapping files) for the post-decision wave:**
- **Batch A (SAFE-NOW, run regardless):** N1 receipt · H2 idempotency · reconciliation cron · empty-refund guard · webhook advance-only guards. (Touch: refund routes, pre-charge cron, new cron file, dispute route, webhook. No overlap with the gated batches.)
- **Batch B (GATED:A — System B retire):** owns `confirm-price`, `approve-increase`, `create-payment-intent` manual-capture, `/checkout`, `deposit_held` appointment branch, `dashboard/bookings/page.tsx` (shared with Batch C → **one agent owns this file**).
- **Batch C (GATED:B — legacy removal):** ReportProblemModal, DisputeNotification, respond-adjustment, approve-increase page, dashboard/disputes, admin/disputes, auto-complete guard. Then **L3 DROP last.**
- **Batch D (GATED:Scope walk-in):** C3, C4, N5, H9, H6, M3, M4, M6 — sequential mini-project (cancellation-policy model is the internal prerequisite for C4).
- **Batch E (GATED:Scope upcharge):** N3 (FE + webhook), H8, payout-ledger-all-types.

**Ordering hazards (do not invert):** L3 DROP only after Batch C removes the reads · retiring deposit-hold must be appointment-only (keep walk-in) · H6 needs H9's signal first · two agents must not both edit `dashboard/bookings/page.tsx` · never modify the verified-good chokepoints (`issue-refund.ts`, `dispute-engine.ts`, `off-session-charge.ts`).

---

## 7. Launch Risk Ledger (defer-with-documented-risk)

For each deferred item: the manual fallback + the volume threshold to automate. (Founder-CTO's framing — this *is* the risk management at zero scale.)

- **N9 full anonymize-service** → disable self-serve account deletion; handle the (near-zero) requests by hand. Automate when deletion requests > ~1/month. *(FK flip is NOT deferred — it ships now.)*
- **N10 observability** → founder is the alerting system via Stripe dashboard + Netlify logs; wire one webhook-to-phone on `payment_intent.payment_failed` + `charge.dispute.created`. Automate (Sentry) at > ~50 txns/week.
- **N12 chargeback representment** → handle each dispute manually in Stripe. Automate when disputes > ~2/month.
- **VAT credit-notes** → accountant handles in the books; confirm VAT-registration threshold first. Automate post-CHF-100k.
- **N6 non-booking refunds** → don't enable gift cards/vouchers/packages/tips at launch; each becomes refundable when its product ships.
- **H7 re-file cooldown, partial-refund model holes, SLA dead column, guest-token TTL, two-open-directions** → watch in `case_events`; fix the first one that actually fires.

---

## 8. What runs autonomously now vs what waits

**Can run now (decision-independent, won't be rework, won't break walk-in):** N1 receipt wiring · H2 pre-charge idempotency · the reconciliation cron · empty-refund guard · webhook advance-only guards. *(net_paid col + FK flip are safe but are migrations → need a one-word sign-off.)*

**Must wait for a decision (running blind here = rework or breakage):** everything in Batches B/C/D/E. The founder + sequencing agent both flagged the concrete failure mode — an agent that greps `deposit_held` and deletes it **breaks walk-in capture**, and deleting legacy surfaces before Decision B (or DROP-ing `price_disputes` before its reads are gone) causes live 500s.

So the honest answer to "run many agents now" is: **the productive autonomous set is ~5 items, not 40.** The big wave fires correctly-scoped *after* the 3 decisions — which is faster overall, because half of those 40 would otherwise build things that get deleted.
