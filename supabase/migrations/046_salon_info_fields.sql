-- Migration 046: Add structured salon info fields
-- These support the "Saloninfo" section on the salon profile page

ALTER TABLE public.salons
  ADD COLUMN IF NOT EXISTS atmosphere TEXT,
  ADD COLUMN IF NOT EXISTS expertise TEXT,
  ADD COLUMN IF NOT EXISTS products TEXT,
  ADD COLUMN IF NOT EXISTS nearest_transport TEXT;

COMMENT ON COLUMN public.salons.atmosphere IS 'Salon atmosphere description (e.g., Modern, Gemütlich)';
COMMENT ON COLUMN public.salons.expertise IS 'Salon expertise/specializations';
COMMENT ON COLUMN public.salons.products IS 'Products used (e.g., Olaplex, Kérastase)';
COMMENT ON COLUMN public.salons.nearest_transport IS 'Nearest public transport stop (e.g., Tram 8, Barfüsserplatz)';
