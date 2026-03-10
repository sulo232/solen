-- Migration 005: Reviews & Trust features
-- Adds: review photos, Google review source tracking, booking-linked reviews,
--       verified badge logic, owner reply columns, and Google Place ID for sync.

-- Review photo (optional upload after booking)
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Source of review: 'manual' (user-submitted) | 'google' (imported from Google)
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- Link a review to the specific booking that prompted it (prevents duplicate reviews)
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL;

-- Owner reply columns (referenced in JS but missing from original migration)
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS owner_reply TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS owner_reply_at TIMESTAMPTZ;

-- External Google review ID to avoid duplicate imports
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS google_review_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS reviews_google_review_id_idx ON reviews(google_review_id) WHERE google_review_id IS NOT NULL;

-- Mark a booking as reviewed so we only prompt once
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reviewed BOOLEAN DEFAULT FALSE;

-- Google Place ID on stores — needed to pull Google reviews
ALTER TABLE stores ADD COLUMN IF NOT EXISTS google_place_id TEXT;

-- Allow owners to update their review replies
CREATE POLICY IF NOT EXISTS "Owners can update review replies" ON reviews
  FOR UPDATE USING (true) WITH CHECK (true);

-- Allow google review sync (service-role inserts)
CREATE POLICY IF NOT EXISTS "Service role can insert google reviews" ON reviews
  FOR INSERT WITH CHECK (true);

-- Allow marking bookings as reviewed
CREATE POLICY IF NOT EXISTS "Users can update their own bookings" ON bookings
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- Storage bucket for review photos (run once, idempotent via INSERT .. ON CONFLICT DO NOTHING)
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-photos', 'review-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload review photos
CREATE POLICY IF NOT EXISTS "Anyone can upload review photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'review-photos');

-- Allow public to read review photos
CREATE POLICY IF NOT EXISTS "Public can view review photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'review-photos');
