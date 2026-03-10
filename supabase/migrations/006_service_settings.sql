-- ═══════════════════════════════════════════════
-- 006 – Services & Team Customization
-- • specialties + bookable columns on store_staff
-- • service_settings JSONB on salons
-- ═══════════════════════════════════════════════

-- 1. Extend store_staff with specialties and bookable flag
ALTER TABLE store_staff ADD COLUMN IF NOT EXISTS specialties TEXT;
ALTER TABLE store_staff ADD COLUMN IF NOT EXISTS bookable BOOLEAN DEFAULT true;

-- 2. Per-salon haircut preset and add-on configuration
ALTER TABLE salons ADD COLUMN IF NOT EXISTS service_settings JSONB DEFAULT '{}';

-- Index for fast lookup of preset services per salon
CREATE INDEX IF NOT EXISTS idx_services_salon_category ON services(salon_id, category);
