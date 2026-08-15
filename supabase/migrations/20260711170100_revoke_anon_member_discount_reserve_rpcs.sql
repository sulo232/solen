-- exists-check: net-new vs 20260710103441_audit_fix_member_discount_reserve.sql, which defines the
-- reserve_member_discount/release_member_discount RPCs; no prior file ever locked down EXECUTE on
-- them, this is the missing lockdown (same gap + same fix shape as
-- 20260711170000_revoke_anon_promo_reserve_rpcs.sql for the sibling promo functions).
--
-- Backend audit follow-up: reserve_member_discount / release_member_discount (added in
-- 20260710103441_audit_fix_member_discount_reserve.sql) were never locked down like the six
-- sibling money/credit/voucher/promo SECURITY DEFINER RPCs in
-- 20260706083445_revoke_anon_execute_money_rpcs.sql, so they remained EXECUTE-callable by
-- anon/authenticated (Solen Plus discount-cap bypass / griefing surface on other users'
-- bookings). Both have zero in-app anon callers: they are only invoked via the service-role
-- admin client in app/api/stripe/booking-pay-intent/route.ts. service_role retains EXECUTE.
REVOKE EXECUTE ON FUNCTION public.reserve_member_discount(uuid, uuid, text, integer) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.release_member_discount(uuid) FROM anon, authenticated, PUBLIC;
