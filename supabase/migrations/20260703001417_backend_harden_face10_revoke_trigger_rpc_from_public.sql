-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
-- Face 10 (correction): the prior REVOKE FROM anon,authenticated was a no-op because these functions
-- carry the default PUBLIC execute grant, which anon/authenticated inherit. Revoke from PUBLIC so the
-- RPC surface is actually closed. These are trigger functions (fire in trigger context regardless of
-- any role's execute grant), so trigger behavior is unaffected; only /rest/v1/rpc access is removed.
REVOKE EXECUTE ON FUNCTION public.anonymize_financial_rows_on_profile_delete() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_referral_code() FROM PUBLIC;