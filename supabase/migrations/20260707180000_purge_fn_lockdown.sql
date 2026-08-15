-- Migration: 20260707180000_purge_fn_lockdown.sql
-- exists-check: fixes the function from 20260707170000. Append-only follow-up (migrations are never
--   edited in place once applied). Applied live 2026-07-07.
--
-- SECURITY FIX (council 2026-07-07): 20260707170000 revoked EXECUTE from anon/authenticated but NOT
-- from PUBLIC. Postgres grants EXECUTE to PUBLIC by default and a privilege check passes if EITHER the
-- role OR PUBLIC holds the grant, so the SECURITY DEFINER function was still callable by the anon role
-- (verified live: has_function_privilege('anon', ...) = true). Combined with an unbounded p_days, a
-- NEGATIVE p_days would target FUTURE slots -> anyone with the public anon key could wipe booking
-- availability platform-wide. This locks execution to service_role and clamps p_days >= 1 as
-- defense-in-depth (a SECURITY DEFINER function must not trust its caller's params). Matches the repo's
-- established pattern (20260703120000, 20260703090002). Verified after apply: anon/authenticated = false.

CREATE OR REPLACE FUNCTION public.purge_past_available_slots(p_days integer DEFAULT 30, p_limit integer DEFAULT 50000)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n integer;
  v_days integer := GREATEST(COALESCE(p_days, 30), 1);   -- never < 1 day: cannot target present/future
  v_limit integer := LEAST(GREATEST(COALESCE(p_limit, 50000), 1), 100000);
BEGIN
  WITH del AS (
    DELETE FROM availability_slots
    WHERE id IN (
      SELECT s.id FROM availability_slots s
      WHERE s.starts_at < now() - (v_days || ' days')::interval
        AND s.status = 'available'
        AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.slot_id = s.id)
      LIMIT v_limit
    )
    RETURNING 1
  )
  SELECT count(*) INTO n FROM del;
  RETURN n;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.purge_past_available_slots(integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_past_available_slots(integer, integer) TO service_role;
