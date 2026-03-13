-- 012: Fix services.store_id (UUID → bigint) + add vacation range columns to blocked_dates
-- services has 0 rows so it's safe to drop/re-add the column
ALTER TABLE services DROP COLUMN IF EXISTS store_id;
ALTER TABLE services ADD COLUMN store_id bigint REFERENCES stores(id) ON DELETE CASCADE;

-- Add vacation date range support to blocked_dates for obPublish() vacation entries
ALTER TABLE blocked_dates ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE blocked_dates ADD COLUMN IF NOT EXISTS end_date DATE;

-- Refresh PostgREST schema cache
SELECT pg_notify('pgrst', 'reload schema');
