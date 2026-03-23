-- Migration 042: Off-peak discount slots
-- Salons can set discounts for specific hours

CREATE TABLE IF NOT EXISTS public.off_peak_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  day_of_week int NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday
  start_time time NOT NULL,
  end_time time NOT NULL,
  discount_percent int NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 50),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

ALTER TABLE public.off_peak_slots ENABLE ROW LEVEL SECURITY;

-- Public can view active off-peak slots
CREATE POLICY "off_peak_select_public" ON public.off_peak_slots
  FOR SELECT USING (is_active = true);

-- Salon owners can manage their off-peak slots
CREATE POLICY "off_peak_manage_owner" ON public.off_peak_slots
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.salons s WHERE s.id = off_peak_slots.salon_id AND s.owner_id = auth.uid())
  );
