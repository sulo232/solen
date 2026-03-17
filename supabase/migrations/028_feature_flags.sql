-- Migration 028: Feature flags + kill switch + user banning
-- Date: 2026-03-17
-- ============================================================================

CREATE TABLE public.feature_flags (
  key text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT true,
  description text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id)
);

INSERT INTO public.feature_flags (key, enabled, description) VALUES
  ('bookings', true, 'Allow new bookings to be created'),
  ('payments', true, 'Allow Stripe payment intents'),
  ('messaging', true, 'Allow new DM messages'),
  ('reviews', true, 'Allow new reviews'),
  ('registration', true, 'Allow new salon registrations'),
  ('last_minute', true, 'Show Last Minute offers'),
  ('maintenance_mode', false, 'Global kill switch — blocks ALL write operations');

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feature_flags_select_public" ON public.feature_flags
  FOR SELECT USING (true);

CREATE POLICY "feature_flags_modify_admin" ON public.feature_flags
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- User banning
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS banned_at timestamptz,
  ADD COLUMN IF NOT EXISTS ban_reason text;

CREATE TRIGGER feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
