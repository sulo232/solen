-- Migration: create_cities_table
CREATE TABLE IF NOT EXISTS public.cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_de TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  name_it TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  radius_km DOUBLE PRECISION DEFAULT 15,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed initial cities
INSERT INTO public.cities (slug, name_de, name_en, name_fr, name_it, display_order, latitude, longitude, radius_km) VALUES
  ('basel',   'Basel',   'Basel',   'Bâle',   'Basilea', 1, 47.5596, 7.5886, 12),
  ('zuerich', 'Zürich',  'Zurich',  'Zurich',  'Zurigo',  2, 47.3769, 8.5417, 20),
  ('bern',    'Bern',    'Berne',   'Berne',   'Berna',   3, 46.9480, 7.4474, 15);

-- RLS: Public read access
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cities are publicly readable" ON public.cities FOR SELECT USING (true);

-- Index for slug lookups
CREATE INDEX idx_cities_slug ON public.cities (slug);
CREATE INDEX idx_cities_active ON public.cities (is_active) WHERE is_active = true;

-- Migration: add_city_id_to_salons
ALTER TABLE public.salons ADD COLUMN city_id UUID REFERENCES public.cities(id);

-- Seed: All existing salons → Basel
UPDATE public.salons SET city_id = (SELECT id FROM public.cities WHERE slug = 'basel');

-- Index for city filtering
CREATE INDEX idx_salons_city_id ON public.salons (city_id);
CREATE INDEX idx_salons_city_category ON public.salons (city_id, categories) WHERE is_active = true;

-- Migration: add_preferred_city_to_profiles
ALTER TABLE public.profiles ADD COLUMN preferred_city TEXT DEFAULT NULL;
