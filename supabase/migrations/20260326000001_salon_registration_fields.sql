-- Fix for missing Salon Registration fields
-- This ensures the salons table matches all data sent from the Next.js onboarding form

ALTER TABLE public.salons
  ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS description_de TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT,
  ADD COLUMN IF NOT EXISTS instagram_url TEXT,
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS tiktok_url TEXT,
  ADD COLUMN IF NOT EXISTS opening_hours JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS last_minute_discount_percent INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_minute_window_hours INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
