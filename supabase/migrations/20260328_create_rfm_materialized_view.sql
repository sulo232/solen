-- CRM / RFM Segmentation Materialized View
-- Calculates booking_count, total_spent, and segment_tag per client per salon.
--
-- GUARDED (2026-06-03): this view joins `clients` + `bookings.client_id`, NEITHER of which exists
-- in the live schema yet (the live booking model uses bookings.user_id / profiles, and there is no
-- `clients` table). An unguarded CREATE MATERIALIZED VIEW aborts a whole `supabase db push` / `db
-- reset` with "relation clients does not exist" (IF NOT EXISTS does not suppress a missing-FROM
-- error). Wrap in a guard so the migration is a safe no-op until the clients-table refactor lands.
-- When that refactor ships, this view will build automatically on the next push.
DO $$
BEGIN
  IF to_regclass('public.clients') IS NOT NULL THEN
    EXECUTE $mv$
      CREATE MATERIALIZED VIEW IF NOT EXISTS public.client_rfm_segments AS
      SELECT
        c.id AS client_id,
        c.salon_id,
        COALESCE(COUNT(b.id), 0) AS booking_count,
        COALESCE(SUM(s.price), 0) AS total_spent,
        CASE
          WHEN COUNT(b.id) >= 4 AND COALESCE(SUM(s.price), 0) >= 500 THEN 'VIP'
          WHEN COUNT(b.id) >= 2 AND EXTRACT(DAY FROM NOW() - MAX(b.starts_at)) > 90 THEN 'Gefährdet'
          WHEN COUNT(b.id) = 1 AND EXTRACT(DAY FROM NOW() - MAX(b.starts_at)) < 30 THEN 'Neu'
          ELSE 'Regulär'
        END AS segment_tag,
        MAX(b.starts_at) AS last_visit_at
      FROM clients c
      LEFT JOIN bookings b ON c.id = b.client_id AND b.status = 'completed'
      LEFT JOIN services s ON b.service_id = s.id
      GROUP BY c.id, c.salon_id;
    $mv$;
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS idx_client_rfm_id ON public.client_rfm_segments(client_id)';
  ELSE
    RAISE NOTICE 'client_rfm_segments skipped: public.clients table not present (schema-drift; see project_db_schema_drift memory)';
  END IF;
END $$;
