-- exists-check: net-new (no prior migration revokes RPC exposure on these trigger fns). Face 10 of the
-- backend hardening sweep; applied 2026-07-03 via MCP apply_migration, mirrored here for reproducibility.
-- Owns no table.

-- Revoke RPC EXECUTE on internal TRIGGER functions from PUBLIC (anon + authenticated inherit execute
-- via the default PUBLIC grant, so revoking from the roles directly is a no-op; revoke from PUBLIC).
-- These are trigger functions (fire in trigger context regardless of any role's execute grant), so
-- trigger behavior is unaffected; this only closes the /rest/v1/rpc surface. Notably
-- anonymize_financial_rows_on_profile_delete is the GDPR erasure routine and must not be anon-callable.
REVOKE EXECUTE ON FUNCTION public.anonymize_financial_rows_on_profile_delete() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_referral_code() FROM PUBLIC;
