-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
-- E2E audit S8: SECURITY DEFINER discovery/persona RPCs that trust a client user-id.
-- toggle_discovery_like/save are called by the AUTHENTICATED session client in
-- app/api/discovery/{like,save}/route.ts (auth-gated, p_user_id=user.id), so keep
-- authenticated, revoke only anon (closes the anon-direct-call vector). The residual
-- (an authenticated user calling directly with another user's p_user_id) needs an
-- auth.uid() rewrite, tracked separately.
REVOKE EXECUTE ON FUNCTION public.toggle_discovery_like(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.toggle_discovery_save(uuid, uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_customer_persona(jsonb) FROM anon, PUBLIC;
-- recent_searches + trending are called via the service-role admin client only.
REVOKE EXECUTE ON FUNCTION public.discovery_recent_searches(uuid, integer) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.discovery_trending_terms(integer, integer, integer) FROM anon, authenticated, PUBLIC;