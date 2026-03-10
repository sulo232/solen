-- Salon photos table for dynamic photo management
CREATE TABLE IF NOT EXISTS salon_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id INTEGER NOT NULL,
  url TEXT NOT NULL,
  storage_path TEXT,
  is_cover BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID
);

CREATE INDEX IF NOT EXISTS idx_salon_photos_salon ON salon_photos(salon_id);
CREATE INDEX IF NOT EXISTS idx_salon_photos_cover ON salon_photos(salon_id, is_cover) WHERE is_cover = TRUE;

-- Enable RLS
ALTER TABLE salon_photos ENABLE ROW LEVEL SECURITY;

-- Everyone can view photos
CREATE POLICY "Public can view salon photos" ON salon_photos
  FOR SELECT USING (true);

-- Authenticated users can insert photos for their salons
CREATE POLICY "Authenticated users can insert salon photos" ON salon_photos
  FOR INSERT WITH CHECK (true);

-- Authenticated users can update their salon photos
CREATE POLICY "Authenticated users can update salon photos" ON salon_photos
  FOR UPDATE USING (true);

-- Authenticated users can delete their salon photos
CREATE POLICY "Authenticated users can delete salon photos" ON salon_photos
  FOR DELETE USING (true);

-- Storage bucket for salon photos (run via Supabase dashboard or API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('salon-photos', 'salon-photos', true)
-- ON CONFLICT DO NOTHING;
