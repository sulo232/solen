-- Enable the btree_gist extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Add strict EXCLUDE USING constraint to mathematically prevent double bookings
ALTER TABLE public.availability_slots
ADD CONSTRAINT prevent_double_booking 
EXCLUDE USING gist (
  staff_member_id WITH =,
  tstzrange(starts_at, ends_at) WITH &&
) WHERE (status IN ('booked', 'blocked'));
