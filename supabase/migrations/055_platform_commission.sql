-- Phase 14: Platform commission tracking
-- platform_settings: singleton row for global config (commission rate, etc.)
-- salon_payouts: tracks gross/commission/net per booking payment

-- Platform settings (singleton config table)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Admin-only access
CREATE POLICY "platform_settings_admin_select" ON public.platform_settings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "platform_settings_admin_update" ON public.platform_settings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "platform_settings_admin_insert" ON public.platform_settings
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Seed default commission rate (15%)
INSERT INTO public.platform_settings (key, value)
VALUES ('commission', '{"rate_percent": 15}')
ON CONFLICT (key) DO NOTHING;

-- Salon payouts table
CREATE TABLE IF NOT EXISTS public.salon_payouts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  stripe_payment_intent_id text,
  gross_amount numeric(10, 2) NOT NULL DEFAULT 0,
  commission_percent numeric(5, 2) NOT NULL DEFAULT 15,
  commission_amount numeric(10, 2) NOT NULL DEFAULT 0,
  net_amount numeric(10, 2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'recorded' CHECK (status IN ('recorded', 'transferred', 'failed')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.salon_payouts ENABLE ROW LEVEL SECURITY;

-- Salon owners see their own payouts
CREATE POLICY "salon_payouts_owner_select" ON public.salon_payouts
  FOR SELECT USING (
    salon_id IN (SELECT id FROM public.salons WHERE owner_id = auth.uid())
  );
-- Admin sees all
CREATE POLICY "salon_payouts_admin_select" ON public.salon_payouts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_salon_payouts_salon ON public.salon_payouts(salon_id);
CREATE INDEX IF NOT EXISTS idx_salon_payouts_booking ON public.salon_payouts(booking_id);
CREATE INDEX IF NOT EXISTS idx_salon_payouts_created ON public.salon_payouts(created_at);
