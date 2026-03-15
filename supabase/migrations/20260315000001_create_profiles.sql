-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: create profiles table (extends auth.users)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.profiles (
  id                    uuid         PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name          text         NOT NULL,
  avatar_url            text,
  bio                   text         CHECK (char_length(bio) <= 500),
  hair_type             text         CHECK (hair_type IN ('straight','wavy','curly','coily','unknown')),
  age_group             text         CHECK (age_group IN ('child','teenager','adult','senior')),
  gender                text         CHECK (gender IN ('male','female','non_binary','prefer_not_to_say')),
  is_first_visit_default boolean     NOT NULL DEFAULT true,
  locale                text         NOT NULL DEFAULT 'de' CHECK (locale IN ('de','en')),
  role                  text         NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','salon_owner','admin')),
  onboarding_completed  boolean      NOT NULL DEFAULT false,
  created_at            timestamptz  NOT NULL DEFAULT now(),
  updated_at            timestamptz  NOT NULL DEFAULT now()
);

-- ── updated_at trigger ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Auto-create profile on new auth user ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own profile
CREATE POLICY "profiles_own_select"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_own_update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Public can read display_name, avatar_url, bio (for reviews)
CREATE POLICY "profiles_public_select"
  ON public.profiles FOR SELECT
  USING (true)
  WITH CHECK (false);  -- SELECT only, no insert/update via this policy

-- Salon owners can read profiles of their customers
CREATE POLICY "profiles_salon_owner_select"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.salons s
      JOIN public.bookings b ON b.salon_id = s.id
      WHERE s.owner_id = auth.uid()
        AND b.user_id = profiles.id
    )
  );
