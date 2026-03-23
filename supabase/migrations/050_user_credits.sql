-- Migration 050: User credits table + optional date_of_birth on profiles
-- Credits can come from referrals, promo codes, or birthday bonuses

CREATE TABLE IF NOT EXISTS public.user_credits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  amount numeric(10, 2) NOT NULL CHECK (amount > 0),
  remaining numeric(10, 2) NOT NULL CHECK (remaining >= 0),
  source text NOT NULL CHECK (source IN ('referral', 'promo', 'birthday', 'manual')),
  source_id text,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_credits_user ON public.user_credits (user_id);
CREATE INDEX IF NOT EXISTS idx_user_credits_active ON public.user_credits (user_id, remaining) WHERE remaining > 0;

-- Add optional date_of_birth to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth date;

-- RLS
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- Users can see their own credits
CREATE POLICY "user_credits_own_read" ON public.user_credits
  FOR SELECT USING (auth.uid() = user_id);

-- Only system (admin/API) can insert/update credits
CREATE POLICY "user_credits_admin_manage" ON public.user_credits
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
