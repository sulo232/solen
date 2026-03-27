-- R-CD3-P1: Fade Blueprint table for per-client zone-by-zone guard specifications
CREATE TABLE IF NOT EXISTS fade_blueprints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  staff_member_id UUID REFERENCES staff_members(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  top_guard TEXT,
  sides_guard TEXT,
  back_guard TEXT,
  neckline_style TEXT,
  fade_type TEXT,
  lineup BOOLEAN DEFAULT false,
  beard_style TEXT,
  products_used TEXT[],
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE fade_blueprints ENABLE ROW LEVEL SECURITY;

-- Salon owners and staff can manage blueprints
CREATE POLICY "salon_owner_fade_blueprints" ON fade_blueprints
  FOR ALL USING (
    salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  );

-- INSERT policy for salon owners (Rule 12b)
CREATE POLICY "salon_owner_fade_blueprints_insert" ON fade_blueprints
  FOR INSERT WITH CHECK (
    salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  );

-- Clients can view their own blueprints
CREATE POLICY "client_view_fade_blueprints" ON fade_blueprints
  FOR SELECT USING (client_id = auth.uid());

CREATE INDEX idx_fade_blueprints_client ON fade_blueprints(client_id, salon_id);
CREATE INDEX idx_fade_blueprints_salon ON fade_blueprints(salon_id, created_at DESC);
