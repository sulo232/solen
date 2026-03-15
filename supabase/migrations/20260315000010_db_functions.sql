-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: database utility functions
-- ─────────────────────────────────────────────────────────────────────────────

-- ── get_last_minute_slots ─────────────────────────────────────────────────────
-- Called by /api/salons/last-minute and the Last-Minute page.
-- Returns fully hydrated slot objects with salon, service, staff data and
-- the calculated discounted price.

CREATE OR REPLACE FUNCTION public.get_last_minute_slots(
  p_category text DEFAULT NULL,
  p_quartier text DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id',               sl.id,
      'salon_id',         sl.salon_id,
      'service_id',       sl.service_id,
      'staff_member_id',  sl.staff_member_id,
      'starts_at',        sl.starts_at,
      'ends_at',          sl.ends_at,
      'status',           sl.status,
      'price_override',   sl.price_override,
      'created_at',       sl.created_at,
      'updated_at',       sl.updated_at,
      'discounted_price', ROUND(sv.price * (1 - s.last_minute_discount_percent::numeric / 100), 2),
      'salon', jsonb_build_object(
        'id',                          s.id,
        'name',                        s.name,
        'slug',                        s.slug,
        'cover_photo_url',             s.cover_photo_url,
        'quartier',                    s.quartier,
        'average_rating',              s.average_rating,
        'last_minute_discount_percent',s.last_minute_discount_percent
      ),
      'service', jsonb_build_object(
        'id',               sv.id,
        'name_de',          sv.name_de,
        'name_en',          sv.name_en,
        'duration_minutes', sv.duration_minutes,
        'price',            sv.price,
        'category',         sv.category
      ),
      'staff_member', CASE WHEN sm.id IS NOT NULL THEN jsonb_build_object(
        'id',         sm.id,
        'name',       sm.name,
        'avatar_url', sm.avatar_url
      ) ELSE NULL END
    )
    ORDER BY sl.starts_at ASC
  )
  INTO result
  FROM public.availability_slots sl
  JOIN public.salons   s  ON s.id  = sl.salon_id
  JOIN public.services sv ON sv.id = sl.service_id
  LEFT JOIN public.staff_members sm ON sm.id = sl.staff_member_id
  WHERE
    sl.status = 'available'
    AND sl.starts_at BETWEEN now() AND now() + (s.last_minute_window_hours || ' hours')::interval
    AND s.is_active = true
    AND (p_category IS NULL OR p_category = ANY(s.categories))
    AND (p_quartier IS NULL OR s.quartier = p_quartier);

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;
