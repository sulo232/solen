-- 011 – Add missing columns to stores table for onboarding wizard
-- These columns are referenced in obPublish() but were missing from the live table.
-- Run in Supabase SQL Editor, then: Supabase Dashboard → API → Reload schema cache
-- (or run: SELECT pg_notify('pgrst', 'reload schema'); )

ALTER TABLE stores ADD COLUMN IF NOT EXISTS opening_hours       TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS instagram           TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS cancellation_policy TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS categories          TEXT[];  -- array of category IDs
ALTER TABLE stores ADD COLUMN IF NOT EXISTS email               TEXT;    -- contact email from onboarding wizard

-- Enable RLS on stores (safe to run even if already enabled)
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Allow any authenticated user to INSERT a store (pending review)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'stores' AND policyname = 'Auth insert stores'
  ) THEN
    CREATE POLICY "Auth insert stores"
      ON stores FOR INSERT
      WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Allow anyone to read stores (public salon directory)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'stores' AND policyname = 'Public read stores'
  ) THEN
    CREATE POLICY "Public read stores"
      ON stores FOR SELECT
      USING (true);
  END IF;
END $$;

-- Refresh PostgREST schema cache so new columns are immediately visible
SELECT pg_notify('pgrst', 'reload schema');
