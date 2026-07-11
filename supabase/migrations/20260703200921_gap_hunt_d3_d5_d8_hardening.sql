-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
-- D3: no-show counter column the cron already increments (phantom until now).
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS no_show_count integer NOT NULL DEFAULT 0;

-- D5: seed the missing spa_features flag row fail-closed (barber_features=true is live, untouched).
INSERT INTO public.feature_flags (key, enabled, description)
VALUES ('spa_features', false, 'Spa category feature set (launch-gated)')
ON CONFLICT (key) DO NOTHING;

-- D8: dedup availability_slots (56k exact-duplicate pairs), keeping the booked row when a group
-- has one, else the oldest; then a unique index so the generator cannot re-create duplicates.
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