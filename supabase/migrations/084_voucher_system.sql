-- Migration 084: Voucher system (Stripe Promotion Codes integration)
-- Extends promo_codes table and adds voucher_purchases tracking

-- 1. Extend promo_codes table with Stripe integration fields
ALTER TABLE public.promo_codes
  ADD COLUMN IF NOT EXISTS stripe_coupon_id text,
  ADD COLUMN IF NOT EXISTS stripe_promotion_code_id text,
  ADD COLUMN IF NOT EXISTS is_purchased_voucher boolean DEFAULT false;

-- Index for Stripe ID lookups
CREATE INDEX IF NOT EXISTS idx_promo_codes_stripe_coupon_id ON public.promo_codes (stripe_coupon_id);
CREATE INDEX IF NOT EXISTS idx_promo_codes_stripe_promotion_code_id ON public.promo_codes (stripe_promotion_code_id);

-- 2. Create voucher_purchases table to track purchased vouchers
CREATE TABLE IF NOT EXISTS public.voucher_purchases (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  promo_code_id uuid REFERENCES public.promo_codes(id) ON DELETE SET NULL,
  amount_paid numeric(10, 2) NOT NULL CHECK (amount_paid > 0),
  stripe_payment_intent_id text NOT NULL UNIQUE,
  recipient_email text,
  is_gift boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.voucher_purchases IS 'Tracks purchased vouchers (Gutscheine) with Stripe Payment Intents';

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_voucher_purchases_customer_id ON public.voucher_purchases (customer_id);
CREATE INDEX IF NOT EXISTS idx_voucher_purchases_promo_code_id ON public.voucher_purchases (promo_code_id);
CREATE INDEX IF NOT EXISTS idx_voucher_purchases_stripe_payment_intent_id ON public.voucher_purchases (stripe_payment_intent_id);

-- RLS policies
ALTER TABLE public.voucher_purchases ENABLE ROW LEVEL SECURITY;

-- Customers can see their own purchased vouchers
CREATE POLICY "voucher_purchases_customer_read" ON public.voucher_purchases
  FOR SELECT USING (auth.uid() = customer_id);

-- Customers can create voucher purchase records (called by backend after payment)
-- Note: In practice, this will be done via admin client in webhook/API routes
CREATE POLICY "voucher_purchases_customer_insert" ON public.voucher_purchases
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Admins can view all voucher purchases
CREATE POLICY "voucher_purchases_admin_all" ON public.voucher_purchases
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
