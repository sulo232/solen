# Backend core-issue sweep , 2026-07-10

Owner ask: "go look into more of the same core issues, not only in the booking flow but everywhere. It's a loop." Follow-on to the 9-flow audit (`_plans/BACKEND_AUDIT_INDEX.md`, 141 findings, all fixed). This sweep covered the ~359 API routes the flow-audit never individually opened, hunting the SAME six recurring root-cause classes.

## Method
- Workflow: 10 domain finders (walk-in/queue, conversations/chat, gift-cards/vouchers/loyalty, admin-authz, dashboard-CRM/clients, staff/analytics, availability/slots/services, discovery/UGC, profile/account, stripe/money-crons) read every route in their domain, then EACH candidate got 3 default-refute skeptics (>=2/3 to confirm). All sonnet, read-only.
- The money-credit + stripe-money-crons verifiers were killed by a session limit on the first run; the workflow was RESUMED (cached finders replay free) so those clusters got re-verified. Authoritative tally: **24 confirmed** (5 C, 4 H, 11 M, 4 L).
- Every schema-drift claim was independently re-verified against the LIVE DB (information_schema / pg_policies), not just code.
- Independent orchestrator cross-checks (all CLEAN): all 24 cron routes enforce CRON_SECRET; all 50 admin routes enforce `profiles.role='admin'`; zero public tables with RLS disabled; no exploitable NULL-with_check write policy (only benign group_bookings UPDATE, which backfills USING); discovery UGC 0-policy tables are all admin-client or SECURITY-DEFINER-RPC writes.

## Fixed + committed (5 batches, coder-built + loop-reviewer PASS each)
- **Batch 1** `ac8c02e5c` , notifications bell (phantom `profiles.salon_id` -> getActiveSalonId), off-peak email HTML injection + missing throttle, admin/tos/notify RLS-truncated broadcast (-> admin client), coming-soon-notify + partner/leads IP rate limits.
- **Batch 2** `462741003` , 9 phantom-column silent no-ops (reviews.reply->salon_response, services.name->name_de, staff first/last->name, salons.status->is_active + removed a FABRICATED 42/18/24/11 fallback, bookings.total_price->price_paid, messages.salon_id gone->inbox_unread 0, bookings.stripe_payment_intent_id->payment_intent_id, referrals.salon_id gone->honest 0, reminder_log missing->guarded zeros).
- **Batch 3** `a23de923c` , CRITICAL /api/slots unauth PII leak (booked_by/booking_id/client_id -> explicit safe columns), save-card booking_id IDOR, slots/[id] staff-ownership check, client-notes arbitrary-salon_id authz, staff/invite email HTML injection, discovery/interactions + analytics/track-view rate limits.
- **Batch 4** `eca3682db` , vouchers/validate accepted an UNPAID voucher (now gated on the webhook-set `remaining_amount` paid marker), vouchers/confirm had no auth + no PI->voucher linkage + leaked the code (now requires `voucher.stripe_payment_intent_id === payment_intent_id`), walkin/queue/[id] DELETE double-refund race (atomic `.eq('status','waiting')` CAS).
- **Batch 5** `1f65b45db` , gift-cards/purchase charged-but-no-card (RLS-blocked session insert, unchecked -> admin insert + check + cancel PI on failure), walk-in confirm cross-tenant PI guard (`pi.metadata.salon_id === booking.salon_id`).
- **DB** `apply_migration audit_fix_price_offers_lock_amount` (verified live) , BEFORE UPDATE trigger `trg_price_offers_lock_customer_columns` stops a price-offer customer rewriting amount_chf/salon_id/customer_id/description via direct REST (the RLS UPDATE with_check was NULL). Additive; owner/service-role updates unaffected.

## NOT hot-patched (flagged, see _tasks/INCOMPLETE_FEATURES.md)
- `stripe/booking-pay-intent:227` promo max_uses race + `:338` member-discount use-cap race , bounded over-redemption; correct fix is atomic reserve-at-creation on the most critical money file, NOT a hot-patch. Recommend accept + schedule the refactor. **Owner call.**
- `conversations/[id]/messages:33` read-receipt no-op , messaging is a disabled feature; fix needs an RLS/design decision when revived. Latent.
- Voucher redemption/spend path does not exist (buy-only). Incomplete feature; if built, use the gift-cards/redeem optimistic-lock pattern.

## Batch 6 (in progress) , purchase refund reconciliation gap + rollback-alert ambiguity
- `app/api/cron/reconcile/route.ts` had ZERO reconciliation for package/retail PURCHASE refunds (only `bookings` was checked). Confirmed live linkage: retail_purchases is keyed on `stripe_payment_intent_id`, PI metadata.type="retail_purchase" set at creation (app/api/salon/retail/purchase/route.ts). package_purchases has no live creation route (Pakete killed 2026-06-11, routes deleted 2026-06-13, REMOVED.md) so its branch is defensive-only for legacy rows. Adding a parallel purchase_amount_drift / purchase_refund_drift / missing_purchase check in the same charge loop, bookings logic untouched.
- `lib/bookings/issue-refund.ts` + `lib/purchases/issue-purchase-refund.ts` STRIPE_FAILED rollback: alertAdmin fired the same payload whether the CAS revert matched a row (clean) or no-op'd (drift left behind). Adding `rollback_reverted: boolean` to the alert payload from the revert's own `.select().maybeSingle()` result.

## Recurring themes confirmed again (same as the 141-audit)
Phantom-column silent no-ops were the single biggest class this sweep (10 of 24) , dashboards silently reporting 0 because a query named a column the live DB never had. Second: service-role routes missing their own ownership check. The DB/RLS LAYER itself is now clean; the remaining risk lives in code that trusts client identity/amounts or reads drifted columns.
