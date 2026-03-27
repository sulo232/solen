-- R-CD6 Phase 1: Makeup dashboard tables
-- Tables: makeup_face_charts, bridal_workflows, makeup_kit_items

CREATE TABLE IF NOT EXISTS makeup_face_charts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  foundation_brand TEXT,
  foundation_shade TEXT,
  undertone TEXT,
  zones JSONB DEFAULT '{}',
  eye_look TEXT,
  lip_colour TEXT,
  products_used JSONB DEFAULT '[]',
  reference_photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bridal_workflows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_date DATE NOT NULL,
  event_type TEXT DEFAULT 'bridal',
  trial_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  final_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  inspiration_urls TEXT[],
  approved_look_photo_url TEXT,
  notes TEXT,
  status TEXT DEFAULT 'trial_pending'
    CHECK (status IN ('trial_pending', 'trial_done', 'look_approved', 'day_of_scheduled', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS makeup_kit_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  product_name TEXT NOT NULL,
  shade TEXT,
  category TEXT,
  quantity INT DEFAULT 1,
  expiry_date DATE,
  cost_per_unit NUMERIC(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE makeup_face_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bridal_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE makeup_kit_items ENABLE ROW LEVEL SECURITY;

-- RLS policies (ALL = SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "salon_owner_face_charts" ON makeup_face_charts
  FOR ALL USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
CREATE POLICY "salon_owner_bridal" ON bridal_workflows
  FOR ALL USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
CREATE POLICY "salon_owner_kit" ON makeup_kit_items
  FOR ALL USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

-- Indexes
CREATE INDEX idx_face_charts_client ON makeup_face_charts(client_id, salon_id);
CREATE INDEX idx_bridal_client ON bridal_workflows(client_id, salon_id);
CREATE INDEX idx_kit_expiry ON makeup_kit_items(salon_id, expiry_date);
