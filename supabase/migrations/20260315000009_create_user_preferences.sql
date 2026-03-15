-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: create user_preferences table
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.user_preferences (
  user_id                 uuid        PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  favorite_quartier_ids   text[]      NOT NULL DEFAULT '{}',
  favorite_service_slugs  text[]      NOT NULL DEFAULT '{}',
  quartier_visit_counts   jsonb       NOT NULL DEFAULT '{}',
  last_booked_service     text,
  booking_intervals       jsonb       NOT NULL DEFAULT '{}',
  dismissed_nudges        jsonb       NOT NULL DEFAULT '{}',
  view_preference         text        NOT NULL DEFAULT 'list' CHECK (view_preference IN ('list','map')),
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "preferences_own"
  ON public.user_preferences FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
