-- ═══════════════════════════════════════════════
-- 006 – Bleaching & Add-ons (Theme 6)
-- • addons table – per-salon add-on catalogue
--   (name, price, active flag; salon controls via dashboard)
-- • bookings table – extras_bleaching + extras_addons columns
-- ═══════════════════════════════════════════════

-- 1. Add-ons catalogue (replaces the ad-hoc addons ref used in cal overlay)
CREATE TABLE IF NOT EXISTS addons (
  id          TEXT        NOT NULL,           -- e.g. 'pflegekur', 'balayage', or uuid for custom
  store_id    TEXT        NOT NULL,           -- matches stores.id (TEXT or INT cast as TEXT)
  name        TEXT        NOT NULL,
  price       DECIMAL(10,2) DEFAULT 0,
  active      BOOLEAN     DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, store_id)
);

CREATE INDEX IF NOT EXISTS idx_addons_store ON addons(store_id);

ALTER TABLE addons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read addons"   ON addons FOR SELECT USING (true);
CREATE POLICY "Auth insert addons"   ON addons FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth update addons"   ON addons FOR UPDATE USING (true);
CREATE POLICY "Auth delete addons"   ON addons FOR DELETE USING (true);

-- 2. Track bleaching wish + selected add-ons on each booking
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS extras_bleaching BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS extras_addons    TEXT;   -- JSON array of {id,name,price}
