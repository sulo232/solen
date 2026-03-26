-- Add city_id to salon_directory
ALTER TABLE public.salon_directory
ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES public.cities(id) ON DELETE SET NULL;

-- Remove quartier from salon_directory
ALTER TABLE public.salon_directory
DROP COLUMN IF EXISTS quartier;

-- Create index for faster city lookups 
CREATE INDEX IF NOT EXISTS idx_salon_directory_city_id ON public.salon_directory(city_id);
