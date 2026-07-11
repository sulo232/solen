-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
-- Perf pass C3: replace dashboard/clients' unbounded all-time completed-bookings pull + JS grouping
-- with one GROUP BY. Behavior-preserving: last_cut_date = most recent, visit_count = count, and
-- preferred_barber = the staff name from the MOST RECENT completed booking (matches current code;
-- "most frequent" is a separate parked product call). Uses idx_bookings_salon_status_starts.
CREATE OR REPLACE FUNCTION public.salon_client_summary(p_salon_id uuid)
RETURNS TABLE(user_id uuid, last_cut_date timestamptz, visit_count bigint, preferred_barber text)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = 'public', 'pg_temp'
AS $$
  SELECT
    t.user_id,
    max(t.starts_at) AS last_cut_date,
    count(*)::bigint AS visit_count,
    (array_agg(t.staff_name ORDER BY t.starts_at DESC))[1] AS preferred_barber
  FROM (
    SELECT b.user_id, b.starts_at, sm.name AS staff_name
    FROM public.bookings b
    LEFT JOIN public.staff_members sm ON sm.id = b.staff_member_id
    WHERE b.salon_id = p_salon_id AND b.status = 'completed' AND b.user_id IS NOT NULL
  ) t
  GROUP BY t.user_id;
$$;