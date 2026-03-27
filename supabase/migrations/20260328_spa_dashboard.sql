-- R-CD4 Phase 1: Spa dashboard tables

CREATE TABLE IF NOT EXISTS spa_treatment_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  room_type TEXT DEFAULT 'treatment',
  capacity INT DEFAULT 1,
  prep_buffer_minutes INT DEFAULT 15,
  cooldown_buffer_minutes INT DEFAULT 10,
  equipment TEXT[],
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wellness_journals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  staff_member_id UUID REFERENCES staff_members(id) ON DELETE SET NULL,
  tension_areas TEXT[],
  pain_level INT CHECK (pain_level BETWEEN 1 AND 10),
  skin_condition TEXT,
  pressure_preference TEXT,
  products_used TEXT[],
  aftercare_notes TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE spa_treatment_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_journals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "salon_owner_spa_rooms" ON spa_treatment_rooms
  FOR ALL USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
CREATE POLICY "salon_owner_wellness_journals" ON wellness_journals
  FOR ALL USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

CREATE INDEX idx_wellness_journals_client ON wellness_journals(client_id, salon_id);
CREATE INDEX idx_spa_treatment_rooms_salon ON spa_treatment_rooms(salon_id);
