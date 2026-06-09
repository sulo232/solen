-- Fix: the vouchers_recipients_see_own RLS policy queried auth.users in its USING
-- clause (SELECT email FROM auth.users WHERE id = auth.uid()). The `authenticated`
-- role cannot read auth.users, so EVERY voucher SELECT failed with
-- 42501 "permission denied for table users" -> /api/profile/vouchers 500'd for all users.
-- auth.email() reads the JWT claim (no table access) with identical semantics.
-- Applied to the live DB 2026-06-09 via apply_migration fix_vouchers_recipients_rls_auth_email.

DROP POLICY IF EXISTS vouchers_recipients_see_own ON public.vouchers;
CREATE POLICY vouchers_recipients_see_own ON public.vouchers
  FOR SELECT
  USING (recipient_email = auth.email());
