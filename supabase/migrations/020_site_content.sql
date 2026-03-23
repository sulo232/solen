CREATE TABLE IF NOT EXISTS site_content (
  key TEXT PRIMARY KEY,
  value_de TEXT,
  value_en TEXT,
  value_fr TEXT,
  content_type TEXT DEFAULT 'text',
  category TEXT DEFAULT 'general',
  sort_order INT DEFAULT 0,
  is_auto BOOLEAN DEFAULT false,
  auto_override TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);

-- RLS: anyone can read, only admins can write
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_content_read_public" ON site_content FOR SELECT USING (true);
CREATE POLICY "site_content_write_admin" ON site_content FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Seed current hardcoded content
INSERT INTO site_content (key, value_de, value_en, content_type, category, sort_order) VALUES
  ('hero_title', 'Dein Salon. Dein Stil. Dein Termin.', 'Your Salon. Your Style. Your Appointment.', 'text', 'hero', 0),
  ('hero_subtitle', 'Entdecke die besten Salons in Basel und buche deinen nächsten Termin in Sekunden.', 'Discover the best salons in Basel and book your next appointment in seconds.', 'text', 'hero', 1),
  ('hero_cta', 'Jetzt entdecken', 'Discover now', 'text', 'hero', 2),
  ('announcement_banner', '', '', 'text', 'banner', 0),
  ('stats_bookings', '0', '0', 'number', 'stats', 0),
  ('stats_salons', '0', '0', 'number', 'stats', 1),
  ('stats_users', '0', '0', 'number', 'stats', 2)
ON CONFLICT (key) DO NOTHING;
