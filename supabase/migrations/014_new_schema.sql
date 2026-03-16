-- Migration 014: Full solen.ch spec schema
-- Developer 1 — Phase 1

-- =============================================================================
-- UTILITY FUNCTIONS
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 1.1 PROFILES (alter existing table — preserves 5 existing rows)
-- =============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS bio text CHECK (char_length(bio) <= 500),
  ADD COLUMN IF NOT EXISTS hair_type text CHECK (hair_type IN ('straight', 'wavy', 'curly', 'coily', 'unknown')),
  ADD COLUMN IF NOT EXISTS age_group text CHECK (age_group IN ('child', 'teenager', 'adult', 'senior')),
  ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('male', 'female', 'non_binary', 'prefer_not_to_say')),
  ADD COLUMN IF NOT EXISTS is_first_visit_default boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS locale text DEFAULT 'de' CHECK (locale IN ('de', 'en')),
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'salon_owner', 'admin')),
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Set display_name NOT NULL with default for existing rows
UPDATE public.profiles SET display_name = 'User' WHERE display_name IS NULL;
ALTER TABLE public.profiles ALTER COLUMN display_name SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN display_name SET DEFAULT 'User';

-- updated_at trigger
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Auto-create profile on new auth.users INSERT
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, locale)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'locale', 'de')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR true); -- public can see display_name, avatar_url, bio

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- =============================================================================
-- 1.2 SALONS
-- =============================================================================

CREATE TABLE public.salons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description_de text,
  description_en text,
  categories text[] NOT NULL DEFAULT '{}',
  quartier text NOT NULL CHECK (quartier IN ('grossbasel', 'kleinbasel', 'gundeli', 'st_johann', 'iselin', 'bruderholz', 'breite')),
  address text NOT NULL,
  latitude numeric(10,7) NOT NULL,
  longitude numeric(10,7) NOT NULL,
  phone text,
  instagram_url text,
  cover_photo_url text,
  gallery_urls text[] DEFAULT '{}',
  opening_hours jsonb,
  average_rating numeric(3,2) DEFAULT 0,
  review_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  last_verified_at timestamptz DEFAULT now(),
  verification_warnings integer DEFAULT 0,
  last_minute_discount_percent integer DEFAULT 0 CHECK (last_minute_discount_percent BETWEEN 0 AND 100),
  last_minute_window_hours integer DEFAULT 6,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DROP TRIGGER IF EXISTS salons_updated_at ON public.salons;
CREATE TRIGGER salons_updated_at
  BEFORE UPDATE ON public.salons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "salons_select_active" ON public.salons
  FOR SELECT USING (is_active = true OR auth.uid() = owner_id);

CREATE POLICY "salons_update_owner" ON public.salons
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "salons_insert_owner" ON public.salons
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- =============================================================================
-- 1.3 STAFF_MEMBERS
-- =============================================================================

CREATE TABLE public.staff_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  name text NOT NULL,
  avatar_url text,
  specialties text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_select_public" ON public.staff_members
  FOR SELECT USING (is_active = true);

CREATE POLICY "staff_manage_owner" ON public.staff_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.salons s WHERE s.id = salon_id AND s.owner_id = auth.uid())
  );

-- =============================================================================
-- 1.4 SERVICES
-- =============================================================================

CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  name_de text NOT NULL,
  name_en text NOT NULL,
  category text NOT NULL CHECK (category IN ('coiffeur', 'barbershop', 'nails', 'spa', 'makeup', 'waxing')),
  duration_minutes integer NOT NULL,
  price numeric(8,2) NOT NULL,
  description_de text,
  description_en text,
  suitable_for text[] DEFAULT '{adult}',
  suitable_gender text[] DEFAULT '{male,female,non_binary}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "services_select_active" ON public.services
  FOR SELECT USING (is_active = true);

CREATE POLICY "services_manage_owner" ON public.services
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.salons s WHERE s.id = salon_id AND s.owner_id = auth.uid())
  );

-- =============================================================================
-- 1.5 AVAILABILITY_SLOTS
-- =============================================================================

CREATE TABLE public.availability_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  staff_member_id uuid REFERENCES public.staff_members(id) ON DELETE SET NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text DEFAULT 'available' CHECK (status IN ('available', 'booked', 'blocked')),
  price_override numeric(8,2),
  booked_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  booking_id uuid, -- FK added after bookings table created
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Partial index for Last-Minute query performance
CREATE INDEX idx_slots_lastminute ON public.availability_slots (salon_id, starts_at, status)
  WHERE status = 'available';

DROP TRIGGER IF EXISTS slots_updated_at ON public.availability_slots;
CREATE TRIGGER slots_updated_at
  BEFORE UPDATE ON public.availability_slots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "slots_select_available" ON public.availability_slots
  FOR SELECT USING (true); -- public can see slots to book

CREATE POLICY "slots_manage_owner" ON public.availability_slots
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.salons s WHERE s.id = salon_id AND s.owner_id = auth.uid())
  );

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.availability_slots;

-- =============================================================================
-- 1.6 BOOKINGS
-- =============================================================================

CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  staff_member_id uuid REFERENCES public.staff_members(id) ON DELETE SET NULL,
  slot_id uuid NOT NULL REFERENCES public.availability_slots(id) ON DELETE RESTRICT,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  price_paid numeric(8,2) NOT NULL,
  status text DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show')),
  is_first_visit boolean NOT NULL DEFAULT false,
  cancellation_reason text,
  cancelled_at timestamptz,
  is_recurring boolean DEFAULT false,
  recurring_group_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add FK from availability_slots.booking_id → bookings.id
ALTER TABLE public.availability_slots
  ADD CONSTRAINT fk_slots_booking FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE SET NULL;

DROP TRIGGER IF EXISTS bookings_updated_at ON public.bookings;
CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bookings_select_own" ON public.bookings
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.salons s WHERE s.id = salon_id AND s.owner_id = auth.uid())
  );

CREATE POLICY "bookings_insert_auth" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bookings_update_own" ON public.bookings
  FOR UPDATE USING (auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.salons s WHERE s.id = salon_id AND s.owner_id = auth.uid())
  );

-- =============================================================================
-- 1.7 RECURRING_BOOKING_RULES
-- =============================================================================

CREATE TABLE public.recurring_booking_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  staff_member_id uuid REFERENCES public.staff_members(id) ON DELETE SET NULL,
  frequency text NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'custom')),
  custom_interval_days integer,
  preferred_day text CHECK (preferred_day IN ('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun')),
  preferred_time time,
  next_booking_date date NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.recurring_booking_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recurring_select_own" ON public.recurring_booking_rules
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "recurring_manage_own" ON public.recurring_booking_rules
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- 1.9 CONVERSATIONS (before messages — messages references conversations)
-- =============================================================================

CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  last_message_at timestamptz,
  last_message_preview text,
  unread_count_customer integer DEFAULT 0,
  unread_count_salon integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(customer_id, salon_id)
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations_select_participant" ON public.conversations
  FOR SELECT USING (
    auth.uid() = customer_id OR
    EXISTS (SELECT 1 FROM public.salons s WHERE s.id = salon_id AND s.owner_id = auth.uid())
  );

CREATE POLICY "conversations_insert_auth" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "conversations_update_participant" ON public.conversations
  FOR UPDATE USING (
    auth.uid() = customer_id OR
    EXISTS (SELECT 1 FROM public.salons s WHERE s.id = salon_id AND s.owner_id = auth.uid())
  );

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- =============================================================================
-- 1.8 MESSAGES
-- =============================================================================

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) <= 2000),
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'booking_link')),
  image_url text,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select_participant" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND (
        c.customer_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.salons s WHERE s.id = c.salon_id AND s.owner_id = auth.uid())
      )
    )
  );

CREATE POLICY "messages_insert_participant" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND (
        c.customer_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.salons s WHERE s.id = c.salon_id AND s.owner_id = auth.uid())
      )
    )
  );

CREATE POLICY "messages_update_own" ON public.messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- =============================================================================
-- 1.10 REVIEWS
-- =============================================================================

CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_id uuid NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  staff_member_id uuid REFERENCES public.staff_members(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text CHECK (char_length(comment) <= 500),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_select_public" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "reviews_insert_own" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger: recalculate salon average_rating after each review
CREATE OR REPLACE FUNCTION public.update_salon_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.salons
  SET
    average_rating = (SELECT AVG(rating) FROM public.reviews WHERE salon_id = NEW.salon_id),
    review_count = (SELECT COUNT(*) FROM public.reviews WHERE salon_id = NEW.salon_id)
  WHERE id = NEW.salon_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS reviews_update_salon_rating ON public.reviews;
CREATE TRIGGER reviews_update_salon_rating
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_salon_rating();

-- =============================================================================
-- 1.11 USER_PREFERENCES
-- =============================================================================

CREATE TABLE public.user_preferences (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  favorite_quartier_ids text[] DEFAULT '{}',
  favorite_service_slugs text[] DEFAULT '{}',
  quartier_visit_counts jsonb DEFAULT '{}',
  last_booked_service text,
  booking_intervals jsonb DEFAULT '{}',
  dismissed_nudges jsonb DEFAULT '{}',
  view_preference text DEFAULT 'list' CHECK (view_preference IN ('list', 'map')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DROP TRIGGER IF EXISTS preferences_updated_at ON public.user_preferences;
CREATE TRIGGER preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "preferences_select_own" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "preferences_upsert_own" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- 3.2 DB FUNCTION: get_last_minute_slots
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_last_minute_slots(
  p_category text DEFAULT NULL,
  p_quartier text DEFAULT NULL
)
RETURNS TABLE (
  slot_id uuid,
  salon_id uuid,
  service_id uuid,
  staff_member_id uuid,
  starts_at timestamptz,
  ends_at timestamptz,
  original_price numeric,
  discounted_price numeric,
  discount_percent integer,
  salon_name text,
  salon_slug text,
  salon_cover_photo_url text,
  salon_quartier text,
  salon_average_rating numeric,
  service_name_de text,
  service_name_en text,
  service_category text,
  service_duration_minutes integer,
  staff_name text,
  staff_avatar_url text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id AS slot_id,
    s.salon_id,
    s.service_id,
    s.staff_member_id,
    s.starts_at,
    s.ends_at,
    svc.price AS original_price,
    ROUND(svc.price * (1 - sal.last_minute_discount_percent::numeric / 100), 2) AS discounted_price,
    sal.last_minute_discount_percent AS discount_percent,
    sal.name AS salon_name,
    sal.slug AS salon_slug,
    sal.cover_photo_url AS salon_cover_photo_url,
    sal.quartier AS salon_quartier,
    sal.average_rating AS salon_average_rating,
    svc.name_de AS service_name_de,
    svc.name_en AS service_name_en,
    svc.category AS service_category,
    svc.duration_minutes AS service_duration_minutes,
    sm.name AS staff_name,
    sm.avatar_url AS staff_avatar_url
  FROM public.availability_slots s
  JOIN public.salons sal ON sal.id = s.salon_id
  JOIN public.services svc ON svc.id = s.service_id
  LEFT JOIN public.staff_members sm ON sm.id = s.staff_member_id
  WHERE
    s.status = 'available'
    AND sal.is_active = true
    AND s.starts_at BETWEEN now() AND (now() + (sal.last_minute_window_hours || ' hours')::interval)
    AND (p_category IS NULL OR svc.category = p_category)
    AND (p_quartier IS NULL OR sal.quartier = p_quartier)
  ORDER BY s.starts_at ASC;
END;
$$ LANGUAGE plpgsql;
