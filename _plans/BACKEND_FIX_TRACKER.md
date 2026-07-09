# Backend fix tracker (2026-07-09) — fixing the audit findings

Source: _plans/BACKEND_AUDIT_INDEX.md (141 findings). Fix CRITICAL→HIGH. CODE fixes done by me (verify + commit, no push). DB/RLS = prod-DB migration = OWNER applies (I write the SQL).

## DB / migration fixes — OWNER must apply (I prepare SQL, do NOT auto-run)
- [ ] Reviews: restore restrictive INSERT policy requiring a completed booking (`reviews_insert_own` has no such WITH CHECK live). REVIEWS C1.
- [ ] Reviews: apply migration 060 (`moderation_status` + `removal_reason` columns) — every flag/hide 500s without it. REVIEWS C2/C3.
- [ ] discovery_items: add owner-scoped INSERT policy (Post-from-Discover is dead). SEARCH C1.
- [ ] bookings: add WITH CHECK / revoke customer UPDATE of status+money columns (self-complete → tier farming). LOYALTY C1.
- [ ] group_bookings: add INSERT/UPDATE policy (or SECURITY DEFINER) + fix create_group_booking to set starts_at/ends_at/price_paid. BOOKING sub-flow C.

## CODE fixes — Batch 1 (surgical auth/leak guards, self-contained) — IN PROGRESS
- [ ] spa/treatment-outcomes POST: add getActiveSalon ownership check (mirror the GET). DASHBOARD C1.
- [ ] GET /api/staff: add session + owner/admin check (leaks commission_rate/permissions). DASHBOARD H.
- [ ] /api/recommendations: select("*") → public column allowlist (leaks stripe_account_id/owner_id). SEARCH C2.
- [ ] /api/salons/verify: verify a signed token, drop the client salon_id fallback (IDOR). ONBOARDING C2.
- [ ] /api/notify/review-replied + review-posted: gate with internal secret + HTML-escape + rate limit. CROSSCUTTING C1/H2.
- [ ] guest walk-in-verify + bookings/[id]/quick-action: use admin client for token-gated lookup (guests 404). BOOKING sub-flow C.

## CODE fixes — Batch 2 (booking money/race)
- [ ] Customer cancel: issueRefund(paid_amount − fee), net the fee (currently no refund). BOOKING C1.
- [ ] Slot flip atomic: `.eq('status','available')` + 0-row→409 in booking-create, reschedule, express-rebook. BOOKING C2 / reschedule H / express-rebook H.
- [ ] Express-rebook confirm: don't set status='confirmed' without payment. BOOKING sub-flow C.
- [ ] Webhook payment_failed: only free the slot when this handler cancelled the booking. BOOKING E/H.
- [ ] abandon-sweep: cancel the Stripe PI; guard slot-free on a matched cancel. PAYMENTS C3/C4.
- [ ] pre-charge cron: add salon_id to PI metadata (payout ledger). PAYMENTS C1.
- [ ] retail/tips/gift-card: check charges_enabled before transfer_data. PAYMENTS C2.

## CODE fixes — Batch 3 (money/abuse + validation)
- [ ] PATCH /api/bookings/[id]: only salon/admin may set status='completed'. LOYALTY C2.
- [ ] create-payment-intent: derive amount server-side, don't trust client. LOYALTY M.
- [ ] /api/vouchers/create: add auth. PAYMENTS H.
- [ ] directory-claim OTP: rate limit + attempt cap. ONBOARDING C1.
- [ ] referral/complete: gate on a qualifying paid booking. AUTH H.
- [ ] verify-phone: key rate-limit on target phone; getClientIp trust platform header. AUTH H x2.
- [ ] Edge Functions: add a shared-secret request gate. CROSSCUTTING H3.
- [ ] recurring: fix preferred_day type (int vs text CHECK) + gate as unpaid. BOOKING sub-flow C/H.
- [ ] remaining HIGH/MEDIUM per per-flow docs.
