-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
-- Face 10: revoke RPC EXECUTE on internal TRIGGER functions from anon + authenticated. These are
-- trigger functions never meant to be callable via /rest/v1/rpc; the triggers still fire in the
-- definer context regardless of the caller's execute grant, so this only closes the RPC exposure.
-- (Notably anonymize_financial_rows_on_profile_delete, the GDPR erasure routine.)
REVOKE EXECUTE ON FUNCTION public.anonymize_financial_rows_on_profile_delete() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_referral_code() FROM anon, authenticated;