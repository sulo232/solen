-- Create salon_last_minute_settings table
CREATE TABLE IF NOT EXISTS public.salon_last_minute_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  enabled boolean DEFAULT false,
  global_discount_percent integer DEFAULT 10 CHECK (global_discount_percent > 0 AND global_discount_percent < 100),
  service_overrides jsonb DEFAULT '{}'::jsonb, -- { "service_id": discount_percent, ... }
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(salon_id)
);

-- Add RLS policies
ALTER TABLE public.salon_last_minute_settings ENABLE ROW LEVEL SECURITY;

-- Salon owner can read/update their own last-minute settings
CREATE POLICY "Users can read their salon last-minute settings"
  ON public.salon_last_minute_settings FOR SELECT
  USING (
    salon_id IN (
      SELECT id FROM salons WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their salon last-minute settings"
  ON public.salon_last_minute_settings FOR UPDATE
  USING (
    salon_id IN (
      SELECT id FROM salons WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their salon last-minute settings"
  ON public.salon_last_minute_settings FOR INSERT
  WITH CHECK (
    salon_id IN (
      SELECT id FROM salons WHERE user_id = auth.uid()
    )
  );

-- Admin can read all
CREATE POLICY "Admins can read all last-minute settings"
  ON public.salon_last_minute_settings FOR SELECT
  USING (auth.jwt() ->> 'is_admin' = 'true');

-- Index for fast lookups by salon_id
CREATE INDEX IF NOT EXISTS idx_salon_last_minute_settings_salon_id
  ON public.salon_last_minute_settings(salon_id);

-- Update last_minute_slots table to include discount tracking if not already present
ALTER TABLE public.availability_slots
  ADD COLUMN IF NOT EXISTS last_minute_discount_percent integer DEFAULT 0;
