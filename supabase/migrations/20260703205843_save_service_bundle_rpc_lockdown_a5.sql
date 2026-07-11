-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
REVOKE EXECUTE ON FUNCTION public.save_service_bundle(uuid,uuid,text,text,numeric,smallint,boolean,uuid[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_service_bundle(uuid,uuid,text,text,numeric,smallint,boolean,uuid[]) TO service_role;