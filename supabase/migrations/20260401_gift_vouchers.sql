-- Migration: Gift Vouchers Table
-- Purpose: Support gift voucher purchases, personalization, and redemption

CREATE TABLE IF NOT EXISTS public.vouchers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  buyer_id uuid REFERENCES auth.users(id),
  buyer_email text,
  recipient_email text NOT NULL,
  recipient_name text,
  amount numeric(8, 2) NOT NULL CHECK (amount > 0),
  code text UNIQUE NOT NULL DEFAULT upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 8)),
  message text,
  redeemed_at timestamptz,
  redeemed_by uuid REFERENCES auth.users(id),
  remaining_amount numeric(8, 2),
  expires_at timestamptz DEFAULT now() + INTERVAL '1 year',
  created_at timestamptz DEFAULT now(),
  stripe_payment_intent_id text
);

-- Index for fast code lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_vouchers_code ON public.vouchers (UPPER(code));
CREATE INDEX IF NOT EXISTS idx_vouchers_salon_id ON public.vouchers (salon_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_recipient_email ON public.vouchers (recipient_email);
CREATE INDEX IF NOT EXISTS idx_vouchers_redeemed_at ON public.vouchers (redeemed_at);

-- RLS
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

-- Public can read unredeemed vouchers by code (for redemption)
CREATE POLICY "vouchers_public_read_by_code" ON public.vouchers
  FOR SELECT USING (redeemed_at IS NULL);

-- Buyers can see their own vouchers
CREATE POLICY "vouchers_buyers_see_own" ON public.vouchers
  FOR SELECT USING (buyer_id = auth.uid());

-- Recipients can see vouchers sent to their email (for redemption)
CREATE POLICY "vouchers_recipients_see_own" ON public.vouchers
  FOR SELECT USING (recipient_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Salon owners can see vouchers for their salons
CREATE POLICY "vouchers_salon_owners_see_own" ON public.vouchers
  FOR SELECT USING (
    salon_id IN (SELECT id FROM public.salons WHERE owner_id = auth.uid())
  );

-- Admins can see all vouchers
CREATE POLICY "vouchers_admin_all" ON public.vouchers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Users can insert vouchers (for purchases)
CREATE POLICY "vouchers_authenticated_insert" ON public.vouchers
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Only admins and salon owners can update voucher redemption
CREATE POLICY "vouchers_update_redemption" ON public.vouchers
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    OR salon_id IN (SELECT id FROM public.salons WHERE owner_id = auth.uid())
  );
