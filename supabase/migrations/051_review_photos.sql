-- Migration 051: Review photos table
-- Phase 6: Allow customers to upload photos with reviews

CREATE TABLE IF NOT EXISTS public.review_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- RLS: public can read, only review author can insert
ALTER TABLE public.review_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "review_photos_select_public" ON public.review_photos
  FOR SELECT USING (true);

CREATE POLICY "review_photos_insert_own" ON public.review_photos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reviews r
      WHERE r.id = review_id AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "review_photos_delete_own" ON public.review_photos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.reviews r
      WHERE r.id = review_id AND r.user_id = auth.uid()
    )
  );

-- Index for fast lookup by review
CREATE INDEX IF NOT EXISTS idx_review_photos_review_id ON public.review_photos(review_id);
