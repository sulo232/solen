-- Migration 032: Staff portfolio images
-- Instagram-style photo grid for staff members

CREATE TABLE IF NOT EXISTS public.staff_portfolio_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.staff_members(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.staff_portfolio_images ENABLE ROW LEVEL SECURITY;

-- Public can view portfolio images
CREATE POLICY "portfolio_images_select_public" ON public.staff_portfolio_images
  FOR SELECT USING (true);

-- Salon owners can manage their staff's portfolio images
CREATE POLICY "portfolio_images_manage_owner" ON public.staff_portfolio_images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.staff_members sm
      JOIN public.salons s ON s.id = sm.salon_id
      WHERE sm.id = staff_portfolio_images.staff_id
      AND s.owner_id = auth.uid()
    )
  );

-- Add bio column to staff_members if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'staff_members' AND column_name = 'bio'
  ) THEN
    ALTER TABLE public.staff_members ADD COLUMN bio text;
  END IF;
END $$;
