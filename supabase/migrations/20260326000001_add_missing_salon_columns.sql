-- Migration: Add missing columns to the salons table
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS google_place_id text;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS cancellation_policy text;
