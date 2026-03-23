-- ============================================================
-- NAIL FOUNDATION TABLES
-- Migration 072: Nail category mega-build
-- ============================================================

-- ============================================================
-- PREREQUISITE: Ensure staff_services exists (megabuild may not be deployed)
-- ============================================================
CREATE TABLE IF NOT EXISTS staff_services (
  staff_member_id UUID REFERENCES staff_members(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (staff_member_id, service_id)
);

-- ============================================================
-- NAIL DESIGN HISTORY
-- customer_id intentionally has no FK — supports guest bookings
-- ============================================================
CREATE TABLE IF NOT EXISTS nail_design_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) NOT NULL,
  customer_id UUID NOT NULL,
  booking_id UUID REFERENCES bookings(id),
  staff_member_id UUID REFERENCES staff_members(id),
  shape TEXT CHECK (shape IN ('round','square','almond','coffin','stiletto','oval','squoval','ballerina','lipstick','edge')),
  length TEXT CHECK (length IN ('natural','short','medium','long','extra_long')),
  material TEXT CHECK (material IN ('natural','gel','acrylic','dip_powder','biab','shellac','polygel','press_on','gel_x')),
  style_category TEXT CHECK (style_category IN ('french','ombre','chrome','3d','marble','minimalist','glitter','abstract','floral','geometric','solid','negative_space','encapsulated','cat_eye','aurora','velvet','glazed_donut')),
  color_primary TEXT,
  color_secondary TEXT,
  color_brand TEXT,
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_nail_history_customer ON nail_design_history(salon_id, customer_id);
ALTER TABLE nail_design_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nail_history_salon" ON nail_design_history FOR ALL
  USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
CREATE POLICY "nail_history_customer" ON nail_design_history FOR SELECT
  USING (customer_id = auth.uid());

-- ============================================================
-- NAIL CLIENT PREFERENCES
-- ============================================================
CREATE TABLE IF NOT EXISTS nail_client_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) NOT NULL,
  customer_id UUID NOT NULL,
  preferred_shape TEXT,
  preferred_length TEXT,
  preferred_material TEXT,
  preferred_brand TEXT,
  allergies TEXT[] DEFAULT '{}',
  allergy_severity TEXT DEFAULT 'mild' CHECK (allergy_severity IN ('mild','moderate','severe')),
  allergy_notes TEXT,
  skin_sensitivity TEXT CHECK (skin_sensitivity IN ('normal','sensitive','very_sensitive')),
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(salon_id, customer_id)
);
ALTER TABLE nail_client_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nail_prefs_salon" ON nail_client_preferences FOR ALL
  USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
CREATE POLICY "nail_prefs_customer" ON nail_client_preferences FOR SELECT
  USING (customer_id = auth.uid());

-- ============================================================
-- NAIL INSPO BOARDS
-- ============================================================
CREATE TABLE IF NOT EXISTS nail_inspo_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'My Inspo',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE nail_inspo_boards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inspo_boards_own" ON nail_inspo_boards FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- NAIL INSPO IMAGES (FK to auth.users fixed from audit)
-- ============================================================
CREATE TABLE IF NOT EXISTS nail_inspo_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  board_id UUID REFERENCES nail_inspo_boards(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id),
  image_url TEXT NOT NULL,
  source_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE nail_inspo_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inspo_own" ON nail_inspo_images FOR ALL USING (user_id = auth.uid());
CREATE POLICY "inspo_salon_read" ON nail_inspo_images FOR SELECT USING (
  booking_id IN (SELECT id FROM bookings WHERE salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())));

-- ============================================================
-- NAIL STATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS nail_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  station_count INTEGER NOT NULL DEFAULT 4,
  has_uv_lamps BOOLEAN DEFAULT true,
  uv_lamp_count INTEGER DEFAULT 4,
  sterilization_buffer_minutes INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(salon_id)
);
ALTER TABLE nail_stations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stations_salon" ON nail_stations FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
CREATE POLICY "stations_public_read" ON nail_stations FOR SELECT USING (true);

-- ============================================================
-- NAIL DYNAMIC PRICING RULES
-- ============================================================
CREATE TABLE IF NOT EXISTS nail_dynamic_pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('peak','off_peak','day_special','demand','segment')),
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME,
  end_time TIME,
  price_modifier NUMERIC(4,2) NOT NULL CHECK (price_modifier BETWEEN 0.5 AND 2.0),
  label_de TEXT,
  label_en TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE nail_dynamic_pricing_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pricing_salon" ON nail_dynamic_pricing_rules FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
CREATE POLICY "pricing_public_read" ON nail_dynamic_pricing_rules FOR SELECT USING (is_active = true);

-- ============================================================
-- NAIL RETAIL PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS nail_retail_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  image_url TEXT,
  category TEXT CHECK (category IN ('cuticle_oil','hand_cream','press_on','nail_kit','polish','other')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE nail_retail_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "retail_salon" ON nail_retail_products FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
CREATE POLICY "retail_public_read" ON nail_retail_products FOR SELECT USING (is_active = true);

-- ============================================================
-- EXTEND EXISTING TABLES
-- ============================================================

-- Staff tier pricing
ALTER TABLE staff_services ADD COLUMN IF NOT EXISTS price_override INTEGER;
ALTER TABLE staff_services ADD COLUMN IF NOT EXISTS tier_label TEXT CHECK (tier_label IN ('junior','standard','senior','master'));

-- Services: nail-specific fields
ALTER TABLE services ADD COLUMN IF NOT EXISTS material_type TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS curing_minutes INTEGER DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS station_required BOOLEAN DEFAULT false;
ALTER TABLE services ADD COLUMN IF NOT EXISTS reminder_cycle_days INTEGER;

-- Staff portfolio: nail-specific metadata
ALTER TABLE staff_portfolio_images ADD COLUMN IF NOT EXISTS nail_style TEXT;
ALTER TABLE staff_portfolio_images ADD COLUMN IF NOT EXISTS nail_shape TEXT;
ALTER TABLE staff_portfolio_images ADD COLUMN IF NOT EXISTS nail_material TEXT;
ALTER TABLE staff_portfolio_images ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Feature flag
INSERT INTO feature_flags (key, enabled, description)
VALUES ('nail_features', false, 'Nail category extended features')
ON CONFLICT (key) DO NOTHING;
