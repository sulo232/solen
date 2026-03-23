-- =============================================================================
-- 073_barber_foundation.sql — Barber category: walk-in queue, cut history,
-- loyalty programs, chairs, staff extensions
-- =============================================================================

-- WALK-IN QUEUE (with tracking_token for anonymous access)
CREATE TABLE IF NOT EXISTS barber_walkin_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  service_id UUID REFERENCES services(id),
  assigned_barber_id UUID REFERENCES staff_members(id),
  preferred_barber_id UUID REFERENCES staff_members(id),
  status TEXT NOT NULL DEFAULT 'waiting'
    CHECK (status IN ('waiting','in_chair','completed','no_show','cancelled')),
  position INTEGER NOT NULL,
  estimated_wait_minutes INTEGER,
  tracking_token TEXT NOT NULL UNIQUE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  called_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  join_method TEXT DEFAULT 'in_person'
    CHECK (join_method IN ('in_person','remote','kiosk')),
  converted_to_booking BOOLEAN DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_walkin_queue_active
  ON barber_walkin_queue(salon_id, status) WHERE status IN ('waiting','in_chair');
CREATE INDEX IF NOT EXISTS idx_walkin_tracking
  ON barber_walkin_queue(tracking_token);
ALTER TABLE barber_walkin_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "walkin_salon_all" ON barber_walkin_queue FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
CREATE POLICY "walkin_customer_select" ON barber_walkin_queue FOR SELECT USING (
  customer_id = auth.uid());

-- CUT HISTORY
CREATE TABLE IF NOT EXISTS barber_cut_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) NOT NULL,
  customer_id UUID,
  customer_name TEXT,
  booking_id UUID REFERENCES bookings(id),
  walkin_id UUID REFERENCES barber_walkin_queue(id),
  staff_member_id UUID REFERENCES staff_members(id),
  side_length TEXT,
  top_style TEXT CHECK (top_style IN (
    'scissors','textured','slicked_back','pompadour','crew',
    'buzz','flat_top','mohawk','freeform','other')),
  fade_type TEXT CHECK (fade_type IN (
    'skin','low','mid','high','taper','drop','temp','burst','none')),
  lineup BOOLEAN DEFAULT false,
  beard_style TEXT CHECK (beard_style IN (
    'full_shape','trim','sculpt','shave','goatee','stubble','none')),
  hair_design TEXT,
  product_used TEXT,
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cut_history_customer ON barber_cut_history(salon_id, customer_id);
ALTER TABLE barber_cut_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cut_history_salon" ON barber_cut_history FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
CREATE POLICY "cut_history_customer" ON barber_cut_history FOR SELECT USING (customer_id = auth.uid());

-- LOYALTY PROGRAMS
CREATE TABLE IF NOT EXISTS barber_loyalty_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Treuekarte',
  stamps_required INTEGER NOT NULL DEFAULT 10
    CHECK (stamps_required >= 3 AND stamps_required <= 20),
  reward_type TEXT NOT NULL DEFAULT 'free_service'
    CHECK (reward_type IN ('free_service','chf_discount','percentage_discount')),
  reward_value INTEGER DEFAULT 0
    CHECK (reward_value >= 0),
  reward_service_id UUID REFERENCES services(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(salon_id)
);
ALTER TABLE barber_loyalty_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "loyalty_program_owner" ON barber_loyalty_programs FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
CREATE POLICY "loyalty_program_public_read" ON barber_loyalty_programs FOR SELECT USING (is_active = true);

-- LOYALTY CARDS (partial unique: only ONE active card per program per client)
CREATE TABLE IF NOT EXISTS barber_loyalty_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES barber_loyalty_programs(id) ON DELETE CASCADE NOT NULL,
  salon_id UUID REFERENCES salons(id) NOT NULL,
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stamps INTEGER NOT NULL DEFAULT 0
    CHECK (stamps >= 0),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','redeemable','redeemed')),
  qr_token TEXT NOT NULL UNIQUE,
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_loyalty_one_active
  ON barber_loyalty_cards(program_id, customer_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_loyalty_cards_customer ON barber_loyalty_cards(customer_id);
ALTER TABLE barber_loyalty_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "loyalty_card_owner" ON barber_loyalty_cards FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
CREATE POLICY "loyalty_card_customer" ON barber_loyalty_cards FOR ALL USING (customer_id = auth.uid());

-- LOYALTY HISTORY
CREATE TABLE IF NOT EXISTS barber_loyalty_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES barber_loyalty_cards(id) NOT NULL,
  salon_id UUID REFERENCES salons(id) NOT NULL,
  customer_id UUID REFERENCES auth.users(id) NOT NULL,
  stamps_collected INTEGER NOT NULL,
  reward_type TEXT NOT NULL,
  reward_value INTEGER,
  completed_at TIMESTAMPTZ NOT NULL,
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE barber_loyalty_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "loyalty_history_owner" ON barber_loyalty_history FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
CREATE POLICY "loyalty_history_customer" ON barber_loyalty_history FOR SELECT USING (customer_id = auth.uid());

-- BARBER CHAIRS
CREATE TABLE IF NOT EXISTS barber_chairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  chair_count INTEGER NOT NULL DEFAULT 4
    CHECK (chair_count >= 1 AND chair_count <= 20),
  buffer_minutes INTEGER DEFAULT 5
    CHECK (buffer_minutes >= 0 AND buffer_minutes <= 30),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(salon_id)
);
ALTER TABLE barber_chairs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chairs_owner" ON barber_chairs FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
CREATE POLICY "chairs_public_read" ON barber_chairs FOR SELECT USING (true);

-- EXTEND EXISTING TABLES
ALTER TABLE staff_portfolio_images ADD COLUMN IF NOT EXISTS barber_style TEXT;
ALTER TABLE staff_portfolio_images ADD COLUMN IF NOT EXISTS fade_type TEXT;
ALTER TABLE staff_portfolio_images ADD COLUMN IF NOT EXISTS is_before_after BOOLEAN DEFAULT false;
ALTER TABLE staff_portfolio_images ADD COLUMN IF NOT EXISTS before_photo_url TEXT;

ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS cover_photo_url TEXT;
ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS accent_color TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_slug ON staff_members(slug) WHERE slug IS NOT NULL;

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS walkin_queue_id UUID REFERENCES barber_walkin_queue(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_express_rebook BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rebooked_from_id UUID REFERENCES bookings(id);
