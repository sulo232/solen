-- Migration 078: Trending Aggregation

CREATE OR REPLACE VIEW public.v_trending_salons AS
SELECT 
  s.id as salon_id,
  s.solen_score,
  COALESCE(recent_bookings.count, 0) as recent_booking_count,
  (s.solen_score * 0.4 + COALESCE(recent_bookings.count, 0) * 10) as trending_score
FROM public.salons s
LEFT JOIN (
  SELECT salon_id, COUNT(*) as count
  FROM public.bookings
  WHERE created_at > now() - interval '14 days'
  GROUP BY salon_id
) recent_bookings ON recent_bookings.salon_id = s.id
WHERE s.is_active = true
ORDER BY trending_score DESC;

-- Note: In production with millions of rows, this should be a MATERIALIZED VIEW refreshed nightly.
-- For now, a standard view works perfectly and is always up-to-date.
