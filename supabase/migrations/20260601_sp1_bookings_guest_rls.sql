-- SP-1 Guest booking: bookings RLS rewrite + REVOKE INSERT FROM anon + owner-or-guest CHECK.
--
-- Master plan _tasks/REFUND_APPEAL_PLAN.md §10b.6 + subplan _tasks/refund-appeal/SP1-guest-booking.md
-- "Schema / DB changes" section. The guest COLUMNS + the partial-unique index on reference_code
-- already shipped in 20260601_refund_appeal_foundation (SP-0); this forward-only, guarded migration
-- carries ONLY the policy/grant/constraint edits SP-1 owns. All statements are idempotent
-- (DROP POLICY IF EXISTS … CREATE POLICY / DROP CONSTRAINT IF EXISTS … ADD CONSTRAINT / REVOKE).
--
-- Net intent: RLS stays deny-by-default. Guests NEVER touch the table through RLS — guest rows
-- (user_id IS NULL) are reachable only via the token-gated SERVICE-ROLE path (resolveBookingActor()
-- in lib/bookings/authorize.ts, which bypasses RLS). Logged-in users keep the verified G1 behavior.

-- 1. INSERT — keep strict. The logged-in path stays gated by `auth.uid() = user_id`. We do NOT add
--    an anon/authenticated path for user_id IS NULL rows; guest inserts go exclusively through the
--    service-role admin client. Re-create idempotently so the migration is self-contained.
DROP POLICY IF EXISTS bookings_insert_auth ON public.bookings;
CREATE POLICY bookings_insert_auth ON public.bookings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Hardening (§10b.6): even a leaked anon key must not be able to create a guest row directly. The
-- only guest write path is our server route (service-role). `authenticated` keeps INSERT (gated by
-- the WITH CHECK above). anon has no INSERT grant today; REVOKE is defense-in-depth + explicit intent.
REVOKE INSERT ON public.bookings FROM anon;

-- 2. SELECT — explicitly exclude guest rows (user_id IS NULL) from every non-service-role reader.
--    A NULL-user row is readable through RLS ONLY by the salon owner (the salon must service its
--    bookings). The guest reads via the SP-2 token-gated service-role route. anon gets nothing.
DROP POLICY IF EXISTS bookings_select_own ON public.bookings;
CREATE POLICY bookings_select_own ON public.bookings
  FOR SELECT
  USING (
    (user_id IS NOT NULL AND auth.uid() = user_id)
    OR EXISTS (
      SELECT 1 FROM public.salons s
      WHERE s.id = bookings.salon_id AND s.owner_id = auth.uid()
    )
  );

-- 3. UPDATE — mirror the SELECT guard so an anon/non-owner cannot mutate a guest row through RLS.
--    Guest-initiated mutations (cancel, refund-request) go through SP-2/SP-3 service-role routes
--    after resolveBookingActor() verifies the token.
DROP POLICY IF EXISTS bookings_update_own ON public.bookings;
CREATE POLICY bookings_update_own ON public.bookings
  FOR UPDATE
  USING (
    (user_id IS NOT NULL AND auth.uid() = user_id)
    OR EXISTS (
      SELECT 1 FROM public.salons s
      WHERE s.id = bookings.salon_id AND s.owner_id = auth.uid()
    )
  );

-- 4. Integrity guard (defense in depth): a booking must have an owner OR guest contact, so no row
--    can exist with neither a user nor a way to identify the guest. SP-3/SP-5 rely on this holding.
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_owner_or_guest_chk;
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_owner_or_guest_chk
  CHECK (user_id IS NOT NULL OR (guest_name IS NOT NULL AND guest_phone IS NOT NULL));

-- NOTE: the partial-unique index on reference_code (bookings_reference_code_key) already exists
-- from the SP-0 foundation migration, so SP-1 does NOT (re)create it.
