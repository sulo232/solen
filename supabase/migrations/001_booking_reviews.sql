CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id INTEGER,
  user_id UUID,
  guest_name TEXT,
  guest_phone TEXT,
  guest_email TEXT,
  service_name TEXT,
  service_price DECIMAL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id INTEGER NOT NULL,
  user_id UUID,
  reviewer_name TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE stores ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS lat DECIMAL;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS lng DECIMAL;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS cancellation_policy TEXT DEFAULT '24h Stornierungsfrist';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS avg_rating DECIMAL DEFAULT 0;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Enable RLS on bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view bookings" ON bookings
  FOR SELECT USING (true);

CREATE POLICY "Public can insert bookings" ON bookings
  FOR INSERT WITH CHECK (true);

-- Enable RLS on reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view reviews" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Public can insert reviews" ON reviews
  FOR INSERT WITH CHECK (true);
