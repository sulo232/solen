-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
-- Audit REVIEWS C1: live reviews_insert_own only checks auth.uid()=user_id, so any logged-in user
-- can post unlimited fake reviews (booking_id NULL) for any salon. Tighten in place to require a
-- real confirmed/completed booking at that salon. NOTE: adapted to live schema -> the reviews table
-- has NO `source` column (migration 061's `OR source='google'` would error), and Google/walk-in
-- reviews insert via the service-role client which BYPASSES RLS, so no source exemption is needed.
-- ALTER in place (no DROP). The app route already requires a booking, so legit inserts are unaffected.
ALTER POLICY "reviews_insert_own" ON public.reviews
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.user_id = (SELECT auth.uid())
        AND b.salon_id = reviews.salon_id
        AND b.status IN ('confirmed','completed')
    )
  );