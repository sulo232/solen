-- Waxing zone packages — per-salon bundled zone discount packages
CREATE TABLE IF NOT EXISTS waxing_zone_packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  zones TEXT[] NOT NULL,
  discount_percent SMALLINT NOT NULL DEFAULT 10 CHECK (discount_percent BETWEEN 1 AND 50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE waxing_zone_packages ENABLE ROW LEVEL SECURITY;

-- Salon owner full access
CREATE POLICY "salon_owner_waxing_packages" ON waxing_zone_packages
  FOR ALL USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

-- INSERT policy (Rule 12b)
CREATE POLICY "salon_owner_insert_waxing_packages" ON waxing_zone_packages
  FOR INSERT WITH CHECK (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

-- Staff read access
CREATE POLICY "staff_read_waxing_packages" ON waxing_zone_packages
  FOR SELECT USING (salon_id IN (
    SELECT sm.salon_id FROM staff_members sm
    JOIN profiles p ON p.id = auth.uid()
    WHERE sm.id = p.id AND sm.is_active = true
  ));

-- Index for salon lookups
CREATE INDEX IF NOT EXISTS idx_waxing_zone_packages_salon ON waxing_zone_packages(salon_id);
