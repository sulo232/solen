-- Badge definitions
CREATE TABLE IF NOT EXISTS salon_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_de TEXT NOT NULL,
  name_en TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Star',
  color TEXT NOT NULL DEFAULT '#4ECDC4',
  bg_color TEXT NOT NULL DEFAULT 'rgba(78,205,196,0.1)',
  auto_rule JSONB,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Badge assignments to salons
CREATE TABLE IF NOT EXISTS salon_badge_assignments (
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES salon_badges(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES profiles(id),
  is_override_removal BOOLEAN DEFAULT false,
  PRIMARY KEY(salon_id, badge_id)
);

-- RLS
ALTER TABLE salon_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_badge_assignments ENABLE ROW LEVEL SECURITY;

-- Public read for badges
CREATE POLICY "Anyone can read badges" ON salon_badges FOR SELECT USING (true);
-- Admin insert/update/delete
CREATE POLICY "Admins manage badges" ON salon_badges FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Public read for assignments (non-override-removal only)
CREATE POLICY "Anyone can read badge assignments" ON salon_badge_assignments FOR SELECT USING (is_override_removal = false);
-- Admin manage assignments
CREATE POLICY "Admins manage badge assignments" ON salon_badge_assignments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Seed default system badges
INSERT INTO salon_badges (name_de, name_en, icon, color, bg_color, auto_rule, is_system) VALUES
  ('Beliebter Salon', 'Popular Salon', 'Star', '#D4AF77', 'rgba(212,175,119,0.1)', '{"type":"rating_and_reviews","min_rating":4.5,"min_reviews":10}', true),
  ('Trending', 'Trending', 'TrendingUp', '#FF6B6B', 'rgba(255,107,107,0.1)', '{"type":"bookings_growth","min_percent":20,"period":"week"}', true),
  ('Neu auf Solen', 'New on Solen', 'Sparkles', '#4ECDC4', 'rgba(78,205,196,0.1)', '{"type":"created_within_days","days":30}', true),
  ('Verifiziert', 'Verified', 'ShieldCheck', '#22C55E', 'rgba(34,197,94,0.1)', '{"type":"verified_within_months","months":6}', true);
