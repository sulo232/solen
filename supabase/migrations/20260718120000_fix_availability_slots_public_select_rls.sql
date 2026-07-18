-- exists-check: `npm run exists -- "availability_slots select policy"` = 0 matches (net-new
-- migration file). The policy this adds does not exist yet, confirmed live via the orchestrator's
-- pg_policies dump (availability_slots currently has ONLY the owner-only select/insert/update/
-- delete policies, no public select) and independently via the live PostgREST OpenAPI schema
-- (lib/supabase.ts's admin client) for the table's real columns/status values. Not a duplicate of
-- lib/supabase.ts / lib/salon-hours.ts / lib/salon-detail.ts / lib/active-salon.ts /
-- lib/booking-state.ts (app code, not RLS) or lib/alert-admin.ts / scripts/exists.mjs (unrelated).
--
-- Fix: availability_slots has NO public/customer SELECT policy live, only the owner-only
-- policies (availability_slots_select_4c9184_m and the owner ALL/write policies) added during a
-- June/July hardening pass that over-reached: it correctly locked WRITES to the salon owner but
-- also replaced the original public-read policy from migration 014 (`slots_select_available
-- USING (true)`), leaving zero SELECT access for a logged-in non-owner customer via the RLS
-- session client. app/api/bookings/route.ts resolves the chosen slot with that session client
-- for a logged-in customer (`db = isGuest ? admin : supabase`), so it always reads 0 candidate
-- slots and every logged-in online booking 409s ("Slot not available"). Guest bookings are
-- unaffected (they use the service-role admin client, which bypasses RLS).
--
-- Fix: add back a public SELECT policy, but scoped to `status = 'available'` (NOT a blanket
-- USING(true) like the original). This is the tightest predicate that satisfies every real
-- session-client read of this table (bookings POST slot-resolve, reschedule's new-slot search,
-- express-rebook, express-rebook/confirm, recurring bookings, last-minute) -- every one of them
-- already filters `.eq("status", "available")` on the query itself. A booked/blocked row (which
-- carries booked_by / booking_id / client_id -- another customer's identity) stays invisible to
-- everyone except the salon owner (existing owner-only policy, untouched) and the service-role
-- admin client (existing routes that need to read a booked slot, e.g. booking-pay-intent's
-- re-verify, already use `admin`, not the session client).
--
-- Multiple permissive policies for the same command (SELECT) on the same table are OR'd by
-- Postgres, so this is purely additive: the existing owner-only SELECT policy is untouched and
-- still grants the owner all-status visibility into their own salon's slots.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'availability_slots'
      AND policyname = 'availability_slots_select_public_available'
  ) THEN
    CREATE POLICY "availability_slots_select_public_available" ON public.availability_slots
      FOR SELECT
      USING (status = 'available');
  END IF;
END $$;
