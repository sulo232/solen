-- Migration 049: Referrals table + auto-generate referral code
-- Each user gets a unique referral code. Both sides earn CHF 10.

CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id uuid NOT NULL REFERENCES auth.users(id),
  referral_code text NOT NULL UNIQUE,
  referred_user_id uuid REFERENCES auth.users(id),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  reward_amount numeric(10, 2) DEFAULT 10.00,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Index for fast code lookup
CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals (referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals (referrer_id);

-- Auto-generate referral code for new users via trigger
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.referrals (referrer_id, referral_code, status)
  VALUES (
    NEW.id,
    'SOLEN-' || UPPER(SUBSTRING(REPLACE(NEW.id::text, '-', ''), 1, 8)),
    'pending'
  )
  ON CONFLICT (referral_code) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on profile creation (runs after auth signup)
DROP TRIGGER IF EXISTS trg_generate_referral_code ON public.profiles;
CREATE TRIGGER trg_generate_referral_code
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_referral_code();

-- RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Users can see their own referral codes
CREATE POLICY "referrals_own_read" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

-- System inserts via trigger (SECURITY DEFINER), no direct user inserts needed
-- Admin can see all
CREATE POLICY "referrals_admin_all" ON public.referrals
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
