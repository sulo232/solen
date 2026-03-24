-- Salon onboarding wizard draft persistence
-- One draft per user, auto-deleted when salon is created

CREATE TABLE IF NOT EXISTS public.salon_drafts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  draft_data jsonb NOT NULL DEFAULT '{}',
  current_step int DEFAULT 1,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.salon_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "salon_drafts_own" ON public.salon_drafts
  FOR ALL USING (user_id = auth.uid());
