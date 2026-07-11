-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
-- Perf pass C1: replace the O(salons) serial COUNT loop in analytics/benchmarks with one GROUP BY.
-- Index for the created_at window aggregation (the composites added earlier key on starts_at).
CREATE INDEX IF NOT EXISTS idx_bookings_salon_created ON public.bookings (salon_id, created_at);

-- SECURITY INVOKER: when the benchmarks route calls this via the service-role admin client, RLS is
-- bypassed so it returns the platform-wide per-salon counts; any non-admin caller is RLS-filtered to
-- their own visible rows (near-empty), so leaving the default grant is safe. Returns only salons that
-- have bookings in the window; the caller defaults the rest to 0 against its active-salon list.
CREATE OR REPLACE FUNCTION public.booking_counts_by_salon(p_since timestamptz)
RETURNS TABLE(salon_id uuid, cnt bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = 'public', 'pg_temp'
AS $$
  SELECT b.salon_id, count(*)::bigint AS cnt
  FROM public.bookings b
  JOIN public.salons s ON s.id = b.salon_id AND s.is_active = true
  WHERE b.created_at >= p_since
  GROUP BY b.salon_id;
$$;