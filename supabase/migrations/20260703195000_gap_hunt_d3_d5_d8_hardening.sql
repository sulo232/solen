-- exists-check: gap-hunt D3/D5/D8 (2026-07-03). Applied via apply_migration; mirrored here.
-- D3: profiles.no_show_count was a phantom column the no-show cron already increments.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS no_show_count integer NOT NULL DEFAULT 0;

-- D5: spa_features had NO flag row and the non-money read path fails open, so the gate was
-- silently enabled. Seeded fail-closed. barber_features=true is deliberately live (loyalty).
INSERT INTO public.feature_flags (key, enabled, description)
VALUES ('spa_features', false, 'Spa category feature set (launch-gated)')
ON CONFLICT (key) DO NOTHING;

-- D8: generate-slots is SELECT-then-INSERT with no unique constraint; prod had 55,994 exact
-- duplicate slot pairs. Deduped (kept the booked row when a group had one, else the oldest),
-- then locked with a unique index (NULLS NOT DISTINCT: staff_member_id can be NULL).
DELETE FROM public.availability_slots a
USING (
  SELECT id, row_number() OVER (
    PARTITION BY salon_id, service_id, staff_member_id, starts_at
    ORDER BY (status <> 'available') DESC, created_at ASC, id ASC
  ) AS rn
  FROM public.availability_slots
) r
WHERE a.id = r.id AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS availability_slots_dedup_uniq
  ON public.availability_slots (salon_id, service_id, staff_member_id, starts_at)
  NULLS NOT DISTINCT;
