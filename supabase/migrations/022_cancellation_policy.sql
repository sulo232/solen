ALTER TABLE salons ADD COLUMN IF NOT EXISTS cancellation_fee_type TEXT DEFAULT 'free' CHECK (cancellation_fee_type IN ('free', 'flat', 'percentage'));
ALTER TABLE salons ADD COLUMN IF NOT EXISTS cancellation_fee_value NUMERIC(8,2) DEFAULT 0;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS free_cancel_hours INT DEFAULT 24;

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reschedule_requested_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reschedule_to TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reschedule_status TEXT CHECK (reschedule_status IN ('pending', 'approved', 'rejected'));
