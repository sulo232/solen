-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
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

REVOKE ALL ON FUNCTION public.purge_past_available_slots(integer, integer) FROM anon, authenticated;