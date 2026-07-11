-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
-- E2E audit H2: staff_members.commission_rate + permissions were readable by anon
-- via the anon key (RLS can't filter columns). Revoke column SELECT from anon only;
-- authenticated is kept so the owner dashboard (session client) still reads them.
REVOKE SELECT (commission_rate, permissions) ON public.staff_members FROM anon;

-- E2E audit L5 / advisor function_search_path_mutable: pin the one flagged function.
ALTER FUNCTION public.service_bundles_min_items() SET search_path = 'public, pg_temp';