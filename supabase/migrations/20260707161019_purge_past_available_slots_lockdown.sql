-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
-- Council 2026-07-07: the prior migration revoked from anon/authenticated but NOT from PUBLIC, so the
-- SECURITY DEFINER function was executable by the anon role (verified live). With an unbounded p_days a
-- negative value would target FUTURE slots. Lock it to service_role only + clamp p_days positive.
CREATE OR REPLACE FUNCTION public.purge_past_available_slots(p_days integer DEFAULT 30, p_limit integer DEFAULT 50000)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n integer;
  v_days integer := GREATEST(COALESCE(p_days, 30), 1);      -- never < 1 day: cannot target the present/future
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