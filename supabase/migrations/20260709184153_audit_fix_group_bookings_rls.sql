-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
-- Audit BOOKING sub-flow C: group_bookings had only a SELECT policy, so create_group_booking()
-- (not SECURITY DEFINER) was denied on its own INSERT -> the feature never completed one call.
-- Additive owner-scoped INSERT/UPDATE policies (idempotent, no DROP). NOTE: the RPC also omits
-- NOT-NULL bookings.starts_at/ends_at/price_paid; that function rewrite is a separate step.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='group_bookings' AND policyname='group_bookings_insert_own') THEN
    CREATE POLICY "group_bookings_insert_own" ON public.group_bookings FOR INSERT TO authenticated
      WITH CHECK (organizer_user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='group_bookings' AND policyname='group_bookings_update_own') THEN
    CREATE POLICY "group_bookings_update_own" ON public.group_bookings FOR UPDATE TO authenticated
      USING (organizer_user_id = auth.uid());
  END IF;
END $$;