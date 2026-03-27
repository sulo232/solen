-- Add sort_order to services for visual reordering
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_services_sort ON public.services(salon_id, sort_order);
