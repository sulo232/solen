-- Migration 034: Service add-ons
-- Allows salons to suggest related add-on services during booking

CREATE TABLE IF NOT EXISTS public.service_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  addon_service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(service_id, addon_service_id)
);

ALTER TABLE public.service_addons ENABLE ROW LEVEL SECURITY;

-- Public can view add-on suggestions
CREATE POLICY "addons_select_public" ON public.service_addons
  FOR SELECT USING (true);

-- Salon owners can manage their service add-ons
CREATE POLICY "addons_manage_owner" ON public.service_addons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.services s
      JOIN public.salons sal ON sal.id = s.salon_id
      WHERE s.id = service_addons.service_id
      AND sal.owner_id = auth.uid()
    )
  );
