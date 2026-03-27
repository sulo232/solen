-- Add languages text array to staff_members table
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{}'::text[];

-- Optional: Add index on languages for fast filtering if needed later
CREATE INDEX idx_staff_members_languages ON public.staff_members USING GIN (languages);
