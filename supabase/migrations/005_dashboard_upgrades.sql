-- ═══════════════════════════════════════════════
-- 005 – Salon Dashboard Upgrades
-- • inventory table (replaces localStorage)
-- • sms_reminders (scheduled reminder jobs)
-- • staff_calendars (per-stylist availability blocks)
-- • photo_type column on salon_photos (before/after)
-- ═══════════════════════════════════════════════

-- 1. Per-salon product inventory
CREATE TABLE IF NOT EXISTS inventory (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id    INTEGER     NOT NULL,
  name        TEXT        NOT NULL,
  stock       INTEGER     DEFAULT 0,
  min_stock   INTEGER     DEFAULT 5,
  price       DECIMAL(10,2) DEFAULT 0,
  category    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_salon ON inventory(salon_id);

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read inventory"  ON inventory FOR SELECT USING (true);
CREATE POLICY "Auth insert inventory"  ON inventory FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth update inventory"  ON inventory FOR UPDATE USING (true);
CREATE POLICY "Auth delete inventory"  ON inventory FOR DELETE USING (true);

-- 2. SMS reminder queue (auto-fire before appointments)
CREATE TABLE IF NOT EXISTS sms_reminders (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id       INTEGER     NOT NULL,
  booking_id     UUID,
  phone          TEXT        NOT NULL,
  message        TEXT        NOT NULL,
  scheduled_for  TIMESTAMPTZ NOT NULL,
  sent_at        TIMESTAMPTZ,
  status         TEXT        DEFAULT 'pending',  -- pending | sent | failed | cancelled
  error_msg      TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_reminders_salon    ON sms_reminders(salon_id);
CREATE INDEX IF NOT EXISTS idx_sms_reminders_status   ON sms_reminders(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_sms_reminders_booking  ON sms_reminders(booking_id);

ALTER TABLE sms_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read reminders"   ON sms_reminders FOR SELECT USING (true);
CREATE POLICY "Auth insert reminders"   ON sms_reminders FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth update reminders"   ON sms_reminders FOR UPDATE USING (true);

-- 3. Per-stylist calendar blocks (working hours / time-off per staff member)
CREATE TABLE IF NOT EXISTS staff_calendars (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id    INTEGER     NOT NULL,
  staff_name  TEXT        NOT NULL,
  date        DATE        NOT NULL,
  start_time  TIME,
  end_time    TIME,
  block_type  TEXT        DEFAULT 'working',  -- working | off | break
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_cal_salon ON staff_calendars(salon_id);
CREATE INDEX IF NOT EXISTS idx_staff_cal_date  ON staff_calendars(salon_id, date);

ALTER TABLE staff_calendars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read staff_cal"  ON staff_calendars FOR SELECT USING (true);
CREATE POLICY "Auth write staff_cal"   ON staff_calendars FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth update staff_cal"  ON staff_calendars FOR UPDATE USING (true);
CREATE POLICY "Auth delete staff_cal"  ON staff_calendars FOR DELETE USING (true);

-- 4. Add photo_type to salon_photos for before/after gallery
ALTER TABLE salon_photos ADD COLUMN IF NOT EXISTS photo_type TEXT DEFAULT 'gallery';
-- photo_type values: 'gallery' | 'before' | 'after' | 'cover'

-- 5. Add service_revenue to bookings for profitable-service analytics
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_revenue DECIMAL(10,2);

-- 6. Add crm_photo_url to bookings (before-service photo taken at appointment)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS crm_photo_url TEXT;
