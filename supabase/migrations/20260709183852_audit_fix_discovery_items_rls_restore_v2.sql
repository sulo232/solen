-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
-- Audit SEARCH C1/H: restrict the drifted world-readable discovery_items read + add the missing
-- per-op policies. Non-destructive: ALTER the existing read in place (no DROP), CREATE the absent
-- policies guarded by IF NOT EXISTS (idempotent). Verified safe: 1071/1071 rows are 'published'
-- (1070 active) so restricting read to published+active hides only the 1 inactive row.
ALTER POLICY "discovery_items_public_read" ON public.discovery_items
  USING (status = 'published' AND is_active = true);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='discovery_items' AND policyname='items_insert_own') THEN
    CREATE POLICY "items_insert_own" ON public.discovery_items FOR INSERT
      WITH CHECK (owner_user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.salons WHERE id = owner_salon_id AND owner_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='discovery_items' AND policyname='items_update_own') THEN
    CREATE POLICY "items_update_own" ON public.discovery_items FOR UPDATE
      USING (owner_user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.salons WHERE id = owner_salon_id AND owner_id = auth.uid()))
      WITH CHECK (status IN ('staging','flagged','archived'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='discovery_items' AND policyname='items_delete_own') THEN
    CREATE POLICY "items_delete_own" ON public.discovery_items FOR DELETE
      USING (owner_user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.salons WHERE id = owner_salon_id AND owner_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='discovery_items' AND policyname='admin_items_all') THEN
    CREATE POLICY "admin_items_all" ON public.discovery_items FOR ALL
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;