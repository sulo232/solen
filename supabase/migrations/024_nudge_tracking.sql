ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS avg_booking_interval_days INT;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS last_nudge_sent_at TIMESTAMPTZ;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS welcome_step INT DEFAULT 0;
