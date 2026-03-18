-- Migration 065: Social media fields
-- Add Facebook, TikTok, and website URLs to salons.
-- instagram_url already exists.

ALTER TABLE salons ADD COLUMN IF NOT EXISTS facebook_url text;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS tiktok_url text;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS website_url text;
