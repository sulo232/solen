-- Migration 053: Multi-location salon chains
-- Phase 10: salon_groups table + group_id on salons

CREATE TABLE IF NOT EXISTS public.salon_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  description text,
  website text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.salon_groups ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "salon_groups_public_read" ON public.salon_groups
  FOR SELECT USING (true);

-- Admin-only write
CREATE POLICY "salon_groups_admin_write" ON public.salon_groups
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Add group_id to salons (nullable — most salons are independent)
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.salon_groups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_salons_group_id ON public.salons(group_id) WHERE group_id IS NOT NULL;
