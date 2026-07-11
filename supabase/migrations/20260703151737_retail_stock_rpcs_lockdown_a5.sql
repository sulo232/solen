-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
-- A5 R5-audit fix (HIGH security): the stock RPCs are SECURITY DEFINER and default-granted EXECUTE
-- to PUBLIC/anon/authenticated , any user could mutate ANY salon's stock. They are only ever called
-- server-side by the webhook settle + refund path (service_role admin client), so lock execution to
-- service_role (+ postgres) only.
REVOKE EXECUTE ON FUNCTION public.decrement_retail_stock(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_retail_stock(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_retail_stock(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_retail_stock(uuid) TO service_role;