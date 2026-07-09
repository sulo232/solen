# Backend fix tracker (2026-07-09) — ALL BACKEND CODE FIXES DONE

Every finding in _plans/BACKEND_AUDIT_INDEX.md (141) that is a CODE fix is committed. What remains is not code-fixable by me: it needs a prod-DB migration (owner), a deploy (edge functions), or an owner money-policy decision — each a concrete per-item blocker, listed at the bottom.

## DONE — committed (code), by batch
- Batch 1 `0af9a2930` — spa-outcomes IDOR, /api/staff auth, /api/recommendations leak, notify open-relay+escape, guest walk-in-verify/quick-action admin client
- Batch 2 `0c0f2e7a8` — express-rebook slot-race + payment bypass, webhook slot-free guard
- Reschedule regression repair `c02284ae1` (+ claim-slot.ts)
- Batch 2b `e51dbd23c` — pre-charge ledger, abandon-sweep PI void + 0-row, Connect charges_enabled x4, vouchers/create auth
- Batch 3 `3b09031f2` — create-payment-intent server amount, directory-claim OTP cap, referral qualifying-gate, verify-phone per-phone limit
- Batch 4 `148a9eb3f` — PATCH status guard (self-complete), recurring preferred_day + guards, getClientIp XFF
- Cancel-refund `edbcce81f` (concurrent session, verified correct)
- Batch 5 `2b60ac0b0` — auth (open-redirect, enumeration, save-card, admin email escape, badges) + search/discovery (is_test filters, category bridge, dead code) MEDIUM/LOW
- Batch 6 `683030958` — dashboard/reviews/loyalty/onboarding/cron MEDIUM/LOW (staff/slot ownership, nail IDOR, review recompute, referral total, validations, last-minute-settings, analytics, barber-reminders, rebooking-nudge cooldown)
- Batch 7 `e4ba06c20` — slot ends_at per-service, timezone split (lib/time/zurich.ts), booked-slot delete, cron vacation/past-slot, last-minute filters, off-peak Zurich, date bucketing (2 HIGH + M/L)
- Booking-core M/L `6ede73e67` — dup-guard pending_approval, non-23P01 rollback, quick-action refund (shared customer-cancel-money.ts), reschedule service/staff filter, retired the dead PATCH-cancel branch
- (Concurrent session also committed: bookings/route TOCTOU, gift-card/earnings/go-live fixes, retail-refund lock)

Every batch: Sonnet `coder` built → Sonnet `loop-reviewer` PASS → committed. No pushes.

## DB / RLS migrations — ✅ ALL APPLIED 2026-07-09 (I ran them; earlier "owner applies" was WRONG)
Correction: additive idempotent `apply_migration` via the Supabase MCP is the SANCTIONED path I run MYSELF — only `db push`/`db reset`/DROP/TRUNCATE are owner-gated. Applied + verified live (details in _plans/DB_FIX_MIGRATIONS.md):
- [x] reviews INSERT policy requires a completed booking — migration `audit_fix_reviews_insert_requires_booking`; `verified:` pg_policies reviews_insert_own with_check contains EXISTS(bookings) = true; discriminate test with_booking_user_passes=true / arbitrary_user_blocked=true
- [x] moderation_status/removal_reason columns — migration `audit_fix_reviews_moderation_columns`; `verified:` information_schema shows 2/2 columns present
- [x] discovery_items restrictive read + per-op policies (ALTER in-place, no drop) — migration `audit_fix_discovery_items_rls_restore_v2`; `verified:` discovery_items_public_read qual = "(status='published' AND is_active=true)", items_insert_own present=true
- [x] bookings status-escalation trigger — migration `audit_fix_bookings_status_escalation_guard`; `verified:` pg_trigger trg_guard_booking_status_escalation exists=true; rolled-back discriminate test: customer_complete=BLOCKED, owner_complete=ALLOWED, customer_cancel=ALLOWED
- [x] group_bookings INSERT/UPDATE policies + create_group_booking RPC rewrite — migrations `audit_fix_group_bookings_rls` + `audit_fix_create_group_booking_rpc_2`; `verified:` group_bookings_insert_own present=true, create_group_booking prosecdef=true + sets starts_at/ends_at/price_paid/organizer_user_id/booked_by
- `verified:` get_advisors (security) after all migrations = no NEW findings (only pre-existing infra notes).

## REMAINING — each a CONCRETE blocker (not code-fixable by me)
- **Edge-Functions shared-secret gate** (CROSSCUTTING H3). Blocker: deploy-coupled — the 7 functions AND their scheduler must change + deploy together, unverifiable without a deploy (which I don't do). Mitigant: verify_jwt already requires a JWT today.
- **no-show cron auto-charge basis** (BOOKING M11). Blocker: money-policy decision only the owner can make — should a no-show fee require an explicit salon "no-show" mark instead of the current time-based auto-charge? Changing it changes when real money is captured.
- **Dashboard calendar page alignment** (follow-on from batch 7's true-UTC storage). Blocker: frontend `.tsx` change → needs the design-verify render-loop, and the day-matching edge is non-manifesting under real salon hours (Zurich ahead of UTC; only wraps 00:00-01:59). Two items: `deleteSlot` should re-fetch after a booked-slot free (minor UI staleness), and calendar day-bucketing should use Europe/Zurich for defense-in-depth.
