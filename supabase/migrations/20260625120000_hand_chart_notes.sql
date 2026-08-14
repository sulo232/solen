-- exists-check: net-new vs 040_client_notes.sql / 058_client_tags.sql because
-- `npm run exists hand_chart_notes` returns 0 matches and the live DB has no
-- public.hand_chart_notes (PostgREST PGRST205). This adds a distinct per-salon
-- per-customer hand-chart table; it REUSES the client_notes RLS shape (the
-- salons.owner_id = auth.uid() ownership check) rather than duplicating notes.
--
-- Migration: hand_chart_notes
-- Real persistence for the nail hand-chart (per-finger notes), replacing the
-- in-memory mockDb Map in app/api/nail/hand-chart/route.ts. One row per
-- (salon, customer); `notes` is a jsonb map of finger key -> note string.
-- RLS mirrors public.client_notes: the salon owner manages rows for salons
-- they own (FOR ALL via the salons.owner_id = auth.uid() ownership check).

CREATE TABLE IF NOT EXISTS public.hand_chart_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (salon_id, customer_id)
);

ALTER TABLE public.hand_chart_notes ENABLE ROW LEVEL SECURITY;

-- Salon owners can manage notes for their salon (mirrors client_notes_manage_salon)
DROP POLICY IF EXISTS "hand_chart_notes_manage_salon" ON public.hand_chart_notes;
CREATE POLICY "hand_chart_notes_manage_salon" ON public.hand_chart_notes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.salons s WHERE s.id = hand_chart_notes.salon_id AND s.owner_id = auth.uid())
  );
