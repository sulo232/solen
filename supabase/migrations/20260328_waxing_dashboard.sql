-- R-CD5 Phase 1: Waxing dashboard tables
-- waxing_zone_preferences + waxing_sensitivity_log

-- 1. Zone preferences per client
CREATE TABLE IF NOT EXISTS waxing_zone_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  zones_selected TEXT[] NOT NULL,
  wax_type_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Sensitivity & reaction log (health-sensitive data)
CREATE TABLE IF NOT EXISTS waxing_sensitivity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  reaction_level TEXT NOT NULL CHECK (reaction_level IN ('none', 'mild', 'moderate', 'severe')),
  affected_zones TEXT[],
  medications TEXT,
  sun_exposure_recent BOOLEAN DEFAULT false,
  aftercare_provided TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS (mandatory — health-sensitive data)
ALTER TABLE waxing_zone_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE waxing_sensitivity_log ENABLE ROW LEVEL SECURITY;

-- Salon owner full access
CREATE POLICY "salon_owner_waxing_zones" ON waxing_zone_preferences
  FOR ALL USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

CREATE POLICY "salon_owner_waxing_sensitivity" ON waxing_sensitivity_log
  FOR ALL USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

-- Staff access (same salon)
CREATE POLICY "staff_waxing_zones" ON waxing_zone_preferences
  FOR ALL USING (salon_id IN (
    SELECT sm.salon_id FROM staff_members sm
    JOIN profiles p ON p.id = auth.uid()
    WHERE sm.id = p.id AND sm.is_active = true
  ));

CREATE POLICY "staff_waxing_sensitivity" ON waxing_sensitivity_log
  FOR ALL USING (salon_id IN (
    SELECT sm.salon_id FROM staff_members sm
    JOIN profiles p ON p.id = auth.uid()
    WHERE sm.id = p.id AND sm.is_active = true
  ));

-- INSERT policies (Rule 12b)
CREATE POLICY "salon_owner_insert_waxing_zones" ON waxing_zone_preferences
  FOR INSERT WITH CHECK (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

CREATE POLICY "salon_owner_insert_waxing_sensitivity" ON waxing_sensitivity_log
  FOR INSERT WITH CHECK (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

-- 4. Indexes for client lookups
CREATE INDEX idx_waxing_zones_client ON waxing_zone_preferences(client_id, salon_id);
CREATE INDEX idx_waxing_sensitivity_client ON waxing_sensitivity_log(client_id, salon_id);
