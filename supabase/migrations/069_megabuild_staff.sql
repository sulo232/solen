-- ============================================================
-- MEGABUILD Phase 2: Staff System
-- staff_invites, staff_services, extend staff_members + profiles
-- ============================================================

CREATE TABLE IF NOT EXISTS staff_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) NOT NULL,
  email TEXT NOT NULL,
  staff_name TEXT,
  invited_by UUID NOT NULL,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT now() + INTERVAL '7 days',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE staff_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invites_salon_owner" ON staff_invites FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
);
CREATE POLICY "invites_by_token" ON staff_invites FOR SELECT USING (true);

ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS can_edit_schedule BOOLEAN DEFAULT true;
ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS can_view_own_bookings BOOLEAN DEFAULT true;
ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS can_manage_portfolio BOOLEAN DEFAULT true;
ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3,2) DEFAULT 0;
ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS staff_salon_id UUID;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birthday DATE;

CREATE TABLE IF NOT EXISTS staff_services (
  staff_member_id UUID REFERENCES staff_members(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (staff_member_id, service_id)
);
ALTER TABLE staff_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_services_public_read" ON staff_services FOR SELECT USING (true);
CREATE POLICY "staff_services_salon_write" ON staff_services FOR ALL USING (
  staff_member_id IN (
    SELECT id FROM staff_members WHERE salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  )
);
