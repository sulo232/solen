-- Migration 033: Guest checkout support
-- Salons can opt-in to allow guest bookings (no account required)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'salons' AND column_name = 'allow_guest_checkout'
  ) THEN
    ALTER TABLE public.salons ADD COLUMN allow_guest_checkout boolean DEFAULT false;
  END IF;
END $$;

-- Add guest info columns to bookings for guest bookings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'guest_name'
  ) THEN
    ALTER TABLE public.bookings ADD COLUMN guest_name text;
    ALTER TABLE public.bookings ADD COLUMN guest_phone text;
    ALTER TABLE public.bookings ADD COLUMN guest_email text;
  END IF;
END $$;
