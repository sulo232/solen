-- CRM / RFM Segmentation Materialized View
-- Calculates booking_count, total_spent, and segment_tag per client per salon

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

CREATE UNIQUE INDEX IF NOT EXISTS idx_client_rfm_id ON public.client_rfm_segments(client_id);
