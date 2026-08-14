-- exists-check: net-new vs 048_promo_codes.sql, 20260710100855_audit_fix_promo_reserve_at_checkout.sql
-- because those files define the promo_codes table and the reserve/release RPCs; no prior file
-- ever locked down EXECUTE on reserve_promo_use/release_promo_use, this is the missing lockdown.
--
-- Backend audit follow-up: reserve_promo_use / release_promo_use (added in
-- 20260710100855_audit_fix_promo_reserve_at_checkout.sql) were never locked down like the
-- six sibling money/credit/voucher/promo SECURITY DEFINER RPCs in
-- 20260706083445_revoke_anon_execute_money_rpcs.sql, so they remained EXECUTE-callable by
-- anon/authenticated (double-spend + griefing surface on the promo_codes counter). Both have
-- zero in-app anon callers: they are only invoked via the service-role admin client in
-- app/api/stripe/booking-pay-intent/route.ts, app/api/stripe/webhook/route.ts,
-- app/api/bookings/route.ts and app/api/cron/abandon-sweep/route.ts. service_role retains EXECUTE.
REVOKE EXECUTE ON FUNCTION public.reserve_promo_use(uuid, text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.release_promo_use(uuid) FROM anon, authenticated, PUBLIC;
