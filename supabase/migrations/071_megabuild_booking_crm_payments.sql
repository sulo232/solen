-- ============================================================
-- MEGABUILD Phase 4: Booking, CRM, Payment Tables
-- guest_bookings, group_bookings, service_packages, package_purchases,
-- client_formulas, intake_form_responses, client_photos, tips, gift_cards,
-- extend referrals, group booking RPC
-- ============================================================

-- Services enhancements
ALTER TABLE services ADD COLUMN IF NOT EXISTS buffer_minutes INTEGER DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS processing_minutes INTEGER DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS finishing_minutes INTEGER DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS photo_urls TEXT[] DEFAULT '{}';
ALTER TABLE services ADD COLUMN IF NOT EXISTS daily_limit_per_staff INTEGER;

-- Guest bookings
CREATE TABLE IF NOT EXISTS guest_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  guest_name TEXT NOT NULL, guest_phone TEXT NOT NULL, guest_email TEXT,
  account_created BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE guest_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "guest_salon_read" ON guest_bookings FOR SELECT USING (
  booking_id IN (SELECT id FROM bookings WHERE salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())));

-- Group bookings
CREATE TABLE IF NOT EXISTS group_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_user_id UUID, organizer_name TEXT NOT NULL, organizer_phone TEXT,
  salon_id UUID REFERENCES salons(id) NOT NULL,
  group_size INTEGER NOT NULL,
  event_type TEXT CHECK (event_type IN ('bridal','birthday','corporate','other')),
  notes TEXT, stripe_payment_intent_id TEXT, total_amount INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE group_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "group_organizer_read" ON group_bookings FOR SELECT USING (
  organizer_user_id = auth.uid() OR salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

-- FK for group_booking_id (safe — table now exists)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_group_booking')
  THEN ALTER TABLE bookings ADD CONSTRAINT fk_group_booking FOREIGN KEY (group_booking_id) REFERENCES group_bookings(id);
  END IF;
END $$;

-- Service packages
CREATE TABLE IF NOT EXISTS service_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) NOT NULL,
  service_id UUID REFERENCES services(id) NOT NULL,
  name TEXT NOT NULL, total_sessions INTEGER NOT NULL, bonus_sessions INTEGER DEFAULT 0,
  price INTEGER NOT NULL, is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "packages_public_read" ON service_packages FOR SELECT USING (is_active = true);
CREATE POLICY "packages_salon_manage" ON service_packages FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

CREATE TABLE IF NOT EXISTS package_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES service_packages(id) NOT NULL,
  user_id UUID NOT NULL, salon_id UUID NOT NULL,
  sessions_total INTEGER NOT NULL, sessions_used INTEGER DEFAULT 0,
  stripe_payment_intent_id TEXT, purchased_at TIMESTAMPTZ DEFAULT now(), expires_at TIMESTAMPTZ
);
ALTER TABLE package_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "purchases_own_read" ON package_purchases FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "purchases_salon_read" ON package_purchases FOR SELECT USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

-- CRM tables
CREATE TABLE IF NOT EXISTS client_formulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL, customer_id UUID NOT NULL, booking_id UUID REFERENCES bookings(id),
  brand TEXT, product_line TEXT, mix_formula TEXT NOT NULL, developer_volume TEXT,
  processing_minutes INTEGER, notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE client_formulas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "formulas_salon_manage" ON client_formulas FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

CREATE TABLE IF NOT EXISTS intake_form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL, customer_id UUID NOT NULL, template_key TEXT NOT NULL,
  responses JSONB NOT NULL DEFAULT '{}', ai_recommendation TEXT, filled_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE intake_form_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "intake_salon_manage" ON intake_form_responses FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
CREATE POLICY "intake_customer_read" ON intake_form_responses FOR SELECT USING (customer_id = auth.uid());

CREATE TABLE IF NOT EXISTS client_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL, customer_id UUID NOT NULL, booking_id UUID REFERENCES bookings(id),
  photo_url TEXT NOT NULL,
  photo_type TEXT CHECK (photo_type IN ('before','after','progress')),
  published_to_discovery BOOLEAN DEFAULT false, discovery_item_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE client_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "photos_salon_manage" ON client_photos FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

-- Payment tables
CREATE TABLE IF NOT EXISTS tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) NOT NULL,
  staff_member_id UUID REFERENCES staff_members(id),
  salon_id UUID NOT NULL, amount INTEGER NOT NULL,
  stripe_payment_intent_id TEXT, created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE tips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tips_salon_read" ON tips FOR SELECT USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

CREATE TABLE IF NOT EXISTS gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) NOT NULL,
  code TEXT UNIQUE NOT NULL, original_amount INTEGER NOT NULL, remaining_amount INTEGER NOT NULL,
  purchaser_user_id UUID, purchaser_email TEXT,
  recipient_email TEXT, recipient_name TEXT, message TEXT,
  stripe_payment_intent_id TEXT, expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gc_public_check" ON gift_cards FOR SELECT USING (true);
CREATE POLICY "gc_salon_manage" ON gift_cards FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

-- Extend existing referrals table (Decision D5 — do NOT create referral_codes)
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS code TEXT UNIQUE;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS max_uses INTEGER DEFAULT 10;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS reward_amount INTEGER DEFAULT 1000;

-- Group booking atomic RPC
CREATE OR REPLACE FUNCTION create_group_booking(
  p_organizer_name TEXT, p_salon_id UUID, p_group_size INTEGER,
  p_event_type TEXT, p_members JSONB
) RETURNS UUID AS $$
DECLARE v_group_id UUID; v_member JSONB; v_slot_status TEXT;
BEGIN
  FOR v_member IN SELECT * FROM jsonb_array_elements(p_members) LOOP
    SELECT status INTO v_slot_status FROM availability_slots
    WHERE id = (v_member->>'slot_id')::UUID FOR UPDATE;
    IF v_slot_status != 'available' THEN
      RAISE EXCEPTION 'Slot % is not available', v_member->>'slot_id';
    END IF;
  END LOOP;
  INSERT INTO group_bookings (organizer_name, salon_id, group_size, event_type)
  VALUES (p_organizer_name, p_salon_id, p_group_size, p_event_type)
  RETURNING id INTO v_group_id;
  FOR v_member IN SELECT * FROM jsonb_array_elements(p_members) LOOP
    INSERT INTO bookings (salon_id, slot_id, service_id, staff_member_id, group_booking_id, status, payment_status)
    VALUES (p_salon_id, (v_member->>'slot_id')::UUID, (v_member->>'service_id')::UUID,
            (v_member->>'staff_member_id')::UUID, v_group_id, 'pending', 'pending');
    UPDATE availability_slots SET status = 'booked' WHERE id = (v_member->>'slot_id')::UUID;
  END LOOP;
  RETURN v_group_id;
END; $$ LANGUAGE plpgsql;
