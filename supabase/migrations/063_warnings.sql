-- Migration 063: Warning system
-- 3 warnings = salon frozen. Tracked per salon.

ALTER TABLE salons ADD COLUMN IF NOT EXISTS warning_count int DEFAULT 0;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS frozen_at timestamptz;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS frozen_reason text;

COMMENT ON COLUMN salons.warning_count IS 'Number of warnings (3 = frozen)';
COMMENT ON COLUMN salons.frozen_at IS 'Timestamp when salon was frozen';
COMMENT ON COLUMN salons.frozen_reason IS 'Reason for freezing the salon';
