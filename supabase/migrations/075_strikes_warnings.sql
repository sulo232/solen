-- Migration 075: Strikes and Warnings tracking
-- Allows enforcement of ToS §3.3, §4.4, §6.6

CREATE TABLE IF NOT EXISTS public.account_warnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid REFERENCES public.salons(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('warning', 'strike', 'suspension')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.account_warnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "account_warnings_select_admin" ON public.account_warnings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "account_warnings_select_salon" ON public.account_warnings
  FOR SELECT USING (
    salon_id IN (SELECT id FROM public.salons WHERE owner_id = auth.uid())
  );

CREATE POLICY "account_warnings_select_user" ON public.account_warnings
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- Admins can insert/update
CREATE POLICY "account_warnings_all_admin" ON public.account_warnings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_account_warnings_salon_id ON public.account_warnings(salon_id);
CREATE INDEX IF NOT EXISTS idx_account_warnings_user_id ON public.account_warnings(user_id);
