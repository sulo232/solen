-- Migration: 20260707170000_purge_past_available_slots_fn.sql
-- exists-check: no existing purge function/cron (npm run exists = 0; audit confirmed no DELETE in any
--   cron). New. Defining the function does NOT delete anything; it only runs when called.
--
-- Phase-2 [YOU-2]. availability_slots grows as generate-slots rolls a 30-day window forward and past
-- slots are never cleaned. TODAY the backlog is small (~1,985 past+available+never-booked rows, measured
-- live , the audit's "137k dead rows" was wrong; the table is 99.4% CURRENT/FUTURE available supply).
-- This is forward-hygiene: without it, ~100k slots/month accumulate as dead past rows over a year.
--
-- Safety: deletes ONLY slots that are (a) older than p_days, (b) still 'available' (never booked/blocked),
-- and (c) referenced by ZERO bookings (so the ON DELETE RESTRICT FK from bookings.slot_id can never
-- trip, and no history is lost). Bounded by p_limit so a cron run cannot exceed its time budget.
-- SECURITY DEFINER + revoked from anon/authenticated: only the service-role cron may call it.

CREATE OR REPLACE FUNCTION public.purge_past_available_slots(p_days integer DEFAULT 30, p_limit integer DEFAULT 50000)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n integer;
BEGIN
  WITH del AS (
    DELETE FROM availability_slots
    WHERE id IN (
      SELECT s.id FROM availability_slots s
      WHERE s.starts_at < now() - (p_days || ' days')::interval
        AND s.status = 'available'
        AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.slot_id = s.id)
      LIMIT p_limit
    )
    RETURNING 1
  )
  SELECT count(*) INTO n FROM del;
  RETURN n;
END;
$$;

-- MUST revoke from PUBLIC (not just anon/authenticated): Postgres grants EXECUTE to PUBLIC by default
-- and a privilege check passes if PUBLIC holds it, so revoking only the named roles leaves it open.
-- (See the hardening in 20260707180000; kept correct here too for a clean fresh apply.)
REVOKE EXECUTE ON FUNCTION public.purge_past_available_slots(integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_past_available_slots(integer, integer) TO service_role;
