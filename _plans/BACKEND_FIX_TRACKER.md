# Backend fix tracker (2026-07-09) — CODE fixes COMPLETE

Fixing the audit findings (_plans/BACKEND_AUDIT_INDEX.md, 141). Every CRITICAL/HIGH that is a CODE fix is committed. What remains is prod-DB (owner applies, SQL ready), one deploy-coupled item, and the MEDIUM/LOW tail.

## DONE — committed (CODE)
- [x] spa/treatment-outcomes POST ownership check — 0af9a2930
- [x] GET /api/staff auth + ownership — 0af9a2930
- [x] /api/recommendations column allowlist — 0af9a2930
- [x] notify/review-replied + review-posted: internal-secret + HTML-escape — 0af9a2930
- [x] guest walk-in-verify + quick-action: admin client after HMAC — 0af9a2930
- [x] express-rebook: atomic slot claim + no confirm-before-pay — 0c0f2e7a8
- [x] webhook payment_failed: guarded slot-free — 0c0f2e7a8
- [x] reschedule: atomic claim-slot + status guard (regression repair) — c02284ae1
- [x] pre-charge cron: salon_id in PI metadata — e51dbd23c
- [x] abandon-sweep: cancel PI + 0-row slot-free guard — e51dbd23c
- [x] retail/tips/walkin-tip/gift-cards: charges_enabled guard — e51dbd23c
- [x] /api/vouchers/create: session auth + session-derived customer — e51dbd23c
- [x] create-payment-intent: server-derived deposit + 400 on mismatch — 3b09031f2
- [x] directory/[id]/claim: rate-limit + OTP guess cap — 3b09031f2
- [x] referral/complete: qualifying-booking gate — 3b09031f2
- [x] verify-phone/send: per-phone rate limit — 3b09031f2
- [x] PATCH /api/bookings/[id]: only salon/admin set completed/no_show + terminal-state guard — 148a9eb3f
- [x] recurring: preferred_day day-key fix + ban/feature-flag guards — 148a9eb3f
- [x] getClientIp: prefer x-nf-client-connection-ip / x-real-ip over spoofable XFF — 148a9eb3f
- [x] customer cancel: refund base−fee, retain fee (verified correct; done by concurrent session) — edbcce81f

## OWNER APPLIES — prod-DB, SQL ready in _plans/DB_FIX_MIGRATIONS.md
Concrete blocker for each: these are production Row-Level-Security / column / function changes = owner-decision boundary (I never auto-run prod-DB writes). SQL is written and ready.
- [ ] Reviews INSERT policy requiring a completed booking — READY SQL (drop-in), verify with pg_policies after.
- [ ] moderation_status + removal_reason columns (migration 060) — READY SQL (drop-in).
- [ ] discovery_items per-op policies (restore INSERT + restrictive read) — READY SQL (drop-in).
- [ ] bookings status/money column lockdown — SQL sketch + why-naive-breaks-cancel in the doc. Blocker: needs SECURITY-DEFINER design + a test against cancel/reschedule before it's safe to apply. NOTE the API vector is already closed by the batch-4 PATCH guard; this only closes the direct-Supabase-REST vector.
- [ ] group_bookings INSERT policy + create_group_booking RPC (populate starts_at/ends_at/price_paid) — SQL sketch in the doc. Blocker: RPC rewrite must be tested end-to-end (a real 2-member group) before applying.

## DEPLOY-COUPLED — concrete blocker
- [ ] Edge Functions (supabase/functions/*) shared-secret request gate — CROSSCUTTING H3. Blocker: the fix must change the 7 edge functions AND whatever invokes them (their Supabase schedule / the caller) to pass the secret, deployed together; a half-applied version breaks the crons, and it can't be verified without a deploy (which I don't do). Mitigant already true: `verify_jwt` defaults on, so they require a valid JWT today (the gap is that the public anon key satisfies it). Hand to a deploy-time change.

## DEFERRED by severity (scope decision, not a punt)
- [ ] The ~90 MEDIUM/LOW findings are catalogued per-flow in _plans/*_BACKEND_AUDIT.md. Deferred until after the CRITICAL/HIGH sweep (this batch). Pick them up per-doc when prioritized; they are not lost — each has file:line + a fix direction in its audit doc.
