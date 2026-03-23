-- Migration 077: Geospatial Search

CREATE EXTENSION IF NOT EXISTS earthdistance CASCADE;

CREATE OR REPLACE FUNCTION get_nearby_salon_ids(
  lat double precision,
  lng double precision,
  max_dist_meters double precision DEFAULT 50000
)
RETURNS TABLE (
  salon_id uuid,
  distance_meters double precision
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as salon_id,
    earth_distance(
        ll_to_earth(s.latitude, s.longitude),
        ll_to_earth(lat, lng)
    ) as distance_meters
  FROM public.salons s
  WHERE s.is_active = true
    AND s.latitude IS NOT NULL
    AND s.longitude IS NOT NULL
    AND earth_distance(ll_to_earth(s.latitude, s.longitude), ll_to_earth(lat, lng)) <= max_dist_meters
  ORDER BY distance_meters ASC;
END;
$$;
