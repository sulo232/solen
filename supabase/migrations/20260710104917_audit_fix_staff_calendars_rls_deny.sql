-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
-- staff_calendars is a dead/legacy table (ZERO code references, and its salon_id is INTEGER while
-- salons.id is UUID, so it cannot even reference the real salons table). Its public-read policy
-- (USING true) leaked internal staff scheduling + personal notes to any anon caller. With no working
-- ownership predicate and no legitimate consumer, deny all non-service-role reads (service_role still
-- bypasses RLS for any future admin use). Closes the leak; the policy can be rebuilt if the table is
-- ever revived with a fixed schema. In-place ALTER, no drop.
ALTER POLICY "Public read staff_cal" ON public.staff_calendars USING (false);