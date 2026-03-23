CREATE TABLE IF NOT EXISTS customer_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  auto_rule JSONB NOT NULL,
  icon TEXT DEFAULT 'Users',
  color TEXT DEFAULT '#4ECDC4',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_segment_members (
  segment_id UUID REFERENCES customer_segments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY(segment_id, user_id)
);

INSERT INTO customer_segments (name, description, auto_rule, icon, color) VALUES
  ('Power Bookers', '3+ Buchungen im letzten Monat', '{"type":"bookings_gte","value":3,"period_days":30}', 'Zap', '#FF6B6B'),
  ('High Spenders', 'Durchschnittliche Buchung > CHF 80', '{"type":"avg_price_gte","value":80}', 'DollarSign', '#D4AF77'),
  ('At Risk', 'War aktiv, aber keine Buchung seit 45+ Tagen', '{"type":"inactive_days","min_bookings":3,"inactive_days":45}', 'AlertTriangle', '#F59E0B'),
  ('New Users', 'Registriert vor weniger als 14 Tagen', '{"type":"registered_within_days","days":14}', 'UserPlus', '#4ECDC4'),
  ('Loyal', '10+ Buchungen insgesamt', '{"type":"total_bookings_gte","value":10}', 'Heart', '#EC4899');
