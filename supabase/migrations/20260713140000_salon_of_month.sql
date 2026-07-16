-- Migration: Salon of the Month, on/off toggle + real winner storage
-- Date: 2026-07-13
-- ============================================================================
-- exists-check: `npm run exists salon_of_month` hit only the admin picker
-- route (app/api/admin/salon-of-month/route.ts) and its zod schema. That route's
-- POST already validated a `month` + `reason` field but NEVER PERSISTED them
-- (it wrote a throwaway string into feature_flags.description) and nothing
-- ever READ the flag it wrote — a fully dead feature. `npm run exists
-- salon_of_month_winners` confirmed 0 matches — the winner-storage table
-- below is genuinely new. This migration adds the two pieces that were
-- missing: (1) a real `salon_of_month_winners` table so the admin's pick
-- (salon + month + reason) is actually stored + queryable, keyed so exactly
-- one row is "current" at a time; (2) seeds the on/off toggle into the
-- EXISTING `feature_flags` table (028_feature_flags.sql pattern, reused via
-- the existing generic /api/admin/feature-flags GET/PATCH route, no new flag
-- system invented).
-- ============================================================================

-- On/off toggle. Defaults OFF: nothing should render on the homepage until an
-- admin has both picked a real winner AND flipped this on. Reuses the exact
-- feature_flags shape from 028_feature_flags.sql, no new mechanism.
INSERT INTO public.feature_flags (key, enabled, description) VALUES
  ('salon_of_month', false, 'Show the "Salon of the Month" homepage section + public reader endpoint')
ON CONFLICT (key) DO NOTHING;

-- Real winner storage. One row per admin selection; `is_current` marks the
-- single active pick the public reader serves. History is kept (old rows
-- flip is_current=false rather than being deleted) so past winners aren't
-- silently lost.
CREATE TABLE IF NOT EXISTS public.salon_of_month_winners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  month text NOT NULL CHECK (month ~ '^\d{4}-\d{2}$'),
  reason text,
  is_current boolean NOT NULL DEFAULT true,
  selected_by uuid REFERENCES public.profiles(id),
  selected_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_salon_of_month_winners_salon_id ON public.salon_of_month_winners(salon_id);

-- At most one "current" winner at any time (partial unique index — the admin
-- POST route flips the previous current row to false before inserting the
-- new one, this is the DB-level backstop against that race/bug).
CREATE UNIQUE INDEX IF NOT EXISTS idx_salon_of_month_winners_one_current
  ON public.salon_of_month_winners (is_current)
  WHERE is_current;

ALTER TABLE public.salon_of_month_winners ENABLE ROW LEVEL SECURITY;

-- Same public-read / admin-write split as site_content (020_site_content.sql):
-- the data itself isn't sensitive (an editorial pick), reads are public,
-- writes only through the admin-checked route (which also uses the
-- service-role client, so this write policy is defense-in-depth).
CREATE POLICY "salon_of_month_winners_read_public" ON public.salon_of_month_winners
  FOR SELECT USING (true);

CREATE POLICY "salon_of_month_winners_write_admin" ON public.salon_of_month_winners
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
