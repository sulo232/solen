-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
-- recompute_user_style_affinity is a batch recompute called ONLY via the service-role
-- admin client in app/api/cron/style-affinity-recompute; no user should trigger it.
REVOKE EXECUTE ON FUNCTION public.recompute_user_style_affinity() FROM anon, authenticated, PUBLIC;