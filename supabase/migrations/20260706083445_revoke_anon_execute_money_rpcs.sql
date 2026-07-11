-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
-- E2E audit C3/S8: these SECURITY DEFINER money/credit/voucher/promo RPCs were
-- EXECUTE-callable by anon/authenticated (double-spend + griefing surface); they
-- have zero in-app anon callers (increment_promo_use + next_walkin_ticket_seq are
-- called via the service-role admin client). service_role retains EXECUTE.
REVOKE EXECUTE ON FUNCTION public.redeem_voucher(text, uuid, numeric, uuid, uuid, text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.redeem_user_credits(uuid, numeric, uuid, text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.restore_voucher(text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.restore_user_credits(text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_promo_use(text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.next_walkin_ticket_seq(uuid) FROM anon, authenticated, PUBLIC;