-- Migration 048: Promo codes table
-- Supports platform-wide and salon-specific promo codes

CREATE TABLE IF NOT EXISTS public.promo_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value numeric(10, 2) NOT NULL CHECK (discount_value > 0),
  min_booking_amount numeric(10, 2) DEFAULT 0,
  max_uses int DEFAULT NULL,
  current_uses int DEFAULT 0,
  salon_id uuid REFERENCES public.salons(id) ON DELETE CASCADE,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Index for fast code lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_promo_codes_code ON public.promo_codes (UPPER(code));

-- RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Public can validate codes (read-only, active only)
CREATE POLICY "promo_codes_public_read" ON public.promo_codes
  FOR SELECT USING (is_active = true);

-- Salon owners can manage their own codes
CREATE POLICY "promo_codes_salon_owner_insert" ON public.promo_codes
  FOR INSERT WITH CHECK (
    auth.uid() = created_by
    AND salon_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.salons WHERE id = salon_id AND owner_id = auth.uid())
  );

CREATE POLICY "promo_codes_salon_owner_update" ON public.promo_codes
  FOR UPDATE USING (
    auth.uid() = created_by
    AND salon_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.salons WHERE id = salon_id AND owner_id = auth.uid())
  );

-- Admins can manage all codes
CREATE POLICY "promo_codes_admin_all" ON public.promo_codes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
