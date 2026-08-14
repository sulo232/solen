-- =============================================================================
-- NOT APPLIED, this is the C1 switch-on. Do NOT run this migration yet.
--
-- What it does: removes the `OR true` from the base table's SELECT policy
-- (availability_slots_select_4c9184_m), so public.availability_slots becomes
-- owner-only for SELECT. The customer-facing read path has already been moved
-- to public.availability_slots_public (the safe-columns barrier view, migration
-- 20260712160500_c1_availability_slots_public_view.sql, applied live 2026-07-12),
-- and the session/anon-client route handlers that used to read the base table
-- directly (app/api/availability/[salon_id]/route.ts, app/api/slots/route.ts GET)
-- now read the view instead. This migration closes the leak the view was built
-- to route around: today ANY caller (anon or authenticated, owner or not) can
-- SELECT * from availability_slots, including client_id/booked_by/booking_id/
-- price_override/block_reason, because of the `OR true`.
--
-- Before applying: TEST as a real non-owner logged-in customer
-- (dev-login ?email=) that the booking + availability screens still work, per
-- the RLS-CLIENT-TRAP lesson (_rules/LESSONS_LEARNED.md). Applying this without
-- that test can break booking for everyone: any code path this repo (or a
-- future consumer) still has that reads public.availability_slots directly
-- with the session/anon client, instead of the view, will silently start
-- returning ZERO rows for every non-owner caller the moment this lands, not an
-- error, an empty result, which is exactly the shape of bug that lesson warns
-- about.
--
-- Checklist before applying:
--   1. Re-grep the live app for every remaining session/anon-client
--      `.from("availability_slots")` SELECT (app/api/bookings/route.ts,
--      express-rebook, cancel, reschedule, recurring, stripe/booking-pay-intent
--      all still read the base table for their write-transaction slot
--      resolution step). Some of these already switch to the admin client for
--      GUEST callers (isGuest ? admin : session), but NOT necessarily for a
--      LOGGED-IN customer, e.g. app/api/bookings/route.ts:181's `slotQuery`
--      runs on the plain session client whenever `user` is set. This was NOT
--      re-audited row-by-row in this pass (out of this task's scope), so do
--      not assume it is already safe, confirm it live with step 2 below.
--   2. Log in as a NON-owner test customer (GET /api/dev/login?to=/salon/<slug>
--      in dev, never in prod) and walk: salon page -> pick a date -> pick a
--      time -> complete a booking. Confirm slots render and the booking
--      succeeds.
--   3. Log in as the salon OWNER and confirm the dashboard calendar
--      (/dashboard/calendar) still loads and the "last-minute" badge still
--      shows on any slot with a price_override set (app/api/slots/route.ts
--      GET re-attaches price_override via the admin client, unaffected by this
--      flip either way, but the owner-only base-table read path this migration
--      restricts is what the RLS check below now gates).
--   4. Only after both (2) and (3) pass, apply via the standard live-DB
--      migration flow (never `supabase db push`/`reset`, additive
--      `apply_migration` only per _plans/WORKLOG.md conventions).
--
-- exists-check: extends 014_new_schema.sql (the base policy)
-- =============================================================================

ALTER POLICY availability_slots_select_4c9184_m ON public.availability_slots
  USING (
    EXISTS (
      SELECT 1 FROM public.salons
      WHERE salons.id = availability_slots.salon_id
        AND salons.owner_id = (SELECT auth.uid())
    )
  );
