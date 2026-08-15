-- exists-check: extends 20260709183852_audit_fix_discovery_items_rls_restore_v2.sql (already
-- applied live, so its CREATE POLICY bodies must be fixed via a follow-up ALTER POLICY migration,
-- not by editing the applied file) and 067_discovery.sql (owns discovery_items).
-- Perf V4-low: discovery_items_public_read/insert_own/update_own/delete_own/admin_items_all
-- (added in 20260709183852_audit_fix_discovery_items_rls_restore_v2.sql) re-check auth.uid()
-- per row instead of once per query. Wrap in (SELECT auth.uid()) so Postgres evaluates it as an
-- initplan (once per statement), matching the pattern already used elsewhere (see
-- 20260709183909_audit_fix_reviews_insert_requires_booking.sql, 20260709184246_audit_fix_bookings_status_escalation_guard.sql).
-- ALTER in place (no DROP); behavior is unchanged, only the evaluation cost per row.
ALTER POLICY "items_insert_own" ON public.discovery_items
  WITH CHECK (
    owner_user_id = (SELECT auth.uid())
    OR EXISTS (SELECT 1 FROM public.salons WHERE id = owner_salon_id AND owner_id = (SELECT auth.uid()))
  );

ALTER POLICY "items_update_own" ON public.discovery_items
  USING (
    owner_user_id = (SELECT auth.uid())
    OR EXISTS (SELECT 1 FROM public.salons WHERE id = owner_salon_id AND owner_id = (SELECT auth.uid()))
  )
  WITH CHECK (status IN ('staging','flagged','archived'));

ALTER POLICY "items_delete_own" ON public.discovery_items
  USING (
    owner_user_id = (SELECT auth.uid())
    OR EXISTS (SELECT 1 FROM public.salons WHERE id = owner_salon_id AND owner_id = (SELECT auth.uid()))
  );

ALTER POLICY "admin_items_all" ON public.discovery_items
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));
