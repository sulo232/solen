-- Add commission_rate to staff_members
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS commission_rate integer DEFAULT 0;
