-- exists-check: net-new vs 037_price_offers.sql / 002_profiles.sql / the audit_fix_* trigger
-- migrations because those CREATE the tables + trigger functions, whereas this migration only
-- REVOKEs the public RPC EXECUTE grant on 6 already-existing trigger functions. grep of
-- supabase/migrations confirms no existing REVOKE EXECUTE on them, and get_advisors shows the
-- lints are still live. Nothing to extend, this is a pure grant-tightening delta.
--
-- Security-advisor fix (get_advisors 2026-07-18, lints 0028 + 0029
-- anon/authenticated_security_definer_function_executable): six SECURITY DEFINER TRIGGER
-- functions had EXECUTE reachable by anon + authenticated, so they were callable via the public
-- PostgREST RPC endpoint (/rest/v1/rpc/<name>). They are trigger-only: 0 .rpc() calls anywhere in
-- app/ or lib/ (grep-confirmed 2026-07-18; the only mentions are code comments). Exposing them as
-- RPC is pure attack surface. Revoking EXECUTE does NOT affect trigger firing: a trigger runs the
-- function with the table owner's rights when the trigger event occurs, independent of any role's
-- EXECUTE grant. Idempotent + additive (a tightening REVOKE, no data change). apply_migration
-- only, never db push / db reset.
revoke execute on function public.guard_booking_protected_fields() from public, anon, authenticated;
revoke execute on function public.guard_booking_status_escalation() from public, anon, authenticated;
revoke execute on function public.guard_profile_privilege_columns() from public, anon, authenticated;
revoke execute on function public.guard_salon_activation() from public, anon, authenticated;
revoke execute on function public.enforce_staff_daily_limit() from public, anon, authenticated;
revoke execute on function public.price_offers_lock_customer_columns() from public, anon, authenticated;
