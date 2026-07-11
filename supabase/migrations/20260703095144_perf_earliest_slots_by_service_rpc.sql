-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
-- Perf: collapse the ~60 per-service availability queries in /api/salons?with_slots into ONE
-- LATERAL query. Partial index supports the per-service earliest-N-available lookup.
CREATE INDEX IF NOT EXISTS idx_availability_slots_service_avail
  ON public.availability_slots (service_id, starts_at) WHERE status = 'available';

-- Earliest p_per available slots per service, in one round-trip. SECURITY INVOKER: called by the
-- route's request client, so it respects the same availability_slots RLS the per-service query used.
CREATE OR REPLACE FUNCTION public.earliest_slots_by_service(
  p_service_ids uuid[], p_from timestamptz, p_to timestamptz, p_per integer
)
RETURNS TABLE(service_id uuid, starts_at timestamptz)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = 'public', 'pg_temp'
AS $$
  SELECT s.service_id, s.starts_at
  FROM unnest(p_service_ids) AS sid(service_id)
  CROSS JOIN LATERAL (
    SELECT a.service_id, a.starts_at
    FROM public.availability_slots a
    WHERE a.service_id = sid.service_id
      AND a.status = 'available'
      AND a.starts_at >= p_from
      AND a.starts_at <= p_to
    ORDER BY a.starts_at ASC
    LIMIT p_per
  ) s;
$$;