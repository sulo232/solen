-- exists-check: net-new (no benchmark/analytics RPC existed). Perf pass C1; applied 2026-07-03 via
-- MCP apply_migration, mirrored here. Owns no table.

-- Replaces the O(salons) serial COUNT loop in app/api/analytics/benchmarks (edge-timeout bomb at ~1k
-- salons) with one GROUP BY. Index keys on created_at (the earlier composites key on starts_at).
CREATE INDEX IF NOT EXISTS idx_bookings_salon_created ON public.bookings (salon_id, created_at);

-- SECURITY INVOKER: the benchmarks route calls this via the service-role admin client (RLS bypassed ->
-- platform-wide counts). Any non-admin caller is RLS-filtered to near-nothing, so the default grant is
-- safe. Returns only salons with bookings in the window; the caller defaults the rest to 0.
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
