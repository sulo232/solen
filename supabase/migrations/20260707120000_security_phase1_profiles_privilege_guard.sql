-- Migration: 20260707120000_security_phase1_profiles_privilege_guard.sql
-- exists-check: net-new vs 002_profiles.sql / 014_new_schema.sql , those CREATE the
--   profiles table + its RLS policies; this ADDS a privilege-column guard trigger that
--   none of them have. Migrations are append-only (never edit an applied one), so a new
--   timestamped file is the correct additive pattern. `npm run exists profiles_privilege`
--   and `guard_profile` = 0 matches.
--
-- Phase-1 security audit (2026-07-07), CRITICAL #1.
--
-- Live hole (confirmed via pg_policies, not visible to the Supabase linter because
-- the WITH CHECK is not literally `true`): the profiles UPDATE policy only checks
-- row ownership , WITH CHECK ((auth.uid() = id)) , and has NO column restriction.
-- RLS/WITH CHECK cannot express column-level limits, so any authenticated user can
-- PATCH their own row (e.g. via app/api/profile/route.ts:62, which passes a zod body
-- straight into .update()) and set role='admin' / is_admin=true, escalating to admin.
-- Every S6 "profiles.role === 'admin'" check across the app then trusts that.
--
-- Fix: a BEFORE UPDATE trigger that reverts the privilege/safety columns to their
-- previous values for any caller that is NOT the service_role. The only legitimate
-- writer of these columns is the server-side admin path (app/api/admin/users/route.ts:67)
-- which uses the service-role client (createAdminSupabaseClient) -> auth.role()='service_role'
-- and is therefore allowed through. Normal profile self-updates (display_name, locale,
-- avatar, birthday, stripe_customer_id, referral_code, no_show_count) are unaffected.
--
-- Idempotent + additive + reversible (DROP TRIGGER ... to undo). No data change.

CREATE OR REPLACE FUNCTION public.guard_profile_privilege_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- auth.role() reflects the request's JWT role: 'anon' | 'authenticated' | 'service_role'.
  -- Only the service role (trusted server code holding the service-role key) may change
  -- these columns; everyone else keeps the prior values.
  IF (SELECT auth.role()) IS DISTINCT FROM 'service_role' THEN
    NEW.role           := OLD.role;
    NEW.is_admin       := OLD.is_admin;
    NEW.is_suspended   := OLD.is_suspended;
    NEW.account_status := OLD.account_status;
  END IF;
  RETURN NEW;
END;
$$;

-- CREATE OR REPLACE TRIGGER (Postgres 14+) is idempotent without a DROP.
CREATE OR REPLACE TRIGGER trg_guard_profile_privilege_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profile_privilege_columns();
