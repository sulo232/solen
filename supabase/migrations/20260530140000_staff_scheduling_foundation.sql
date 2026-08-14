-- Staff scheduling foundation.
-- Applied directly to the live DB via Supabase MCP on 2026-05-30 (recorded as
-- migration "staff_scheduling_foundation"). The local megabuild track (069/070/
-- 072/073) was never pushed and the live DB is on a different lineage, so a blanket
-- `db push` is unsafe. This file documents the exact additive, idempotent change.
--
-- Owner-only RLS: staff_members.user_id is NOT deployed yet, so staff-self access
-- (the staff-facing "My schedule" view) is deferred to a later brick.
-- day_of_week uses 0=Sunday (matches the generate-slots cron's d.getDay()).

CREATE TABLE IF NOT EXISTS staff_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id UUID REFERENCES staff_members(id) ON DELETE CASCADE,
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_working BOOLEAN DEFAULT true,
  is_alternate_week BOOLEAN DEFAULT false,
  alternate_week_parity INTEGER DEFAULT 0 CHECK (alternate_week_parity IN (0,1)),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (salon_id, staff_member_id, day_of_week)
);
CREATE INDEX IF NOT EXISTS idx_staff_schedules_staff ON staff_schedules(staff_member_id);
CREATE INDEX IF NOT EXISTS idx_staff_schedules_salon ON staff_schedules(salon_id);
ALTER TABLE staff_schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "schedules_owner_manage" ON staff_schedules;
CREATE POLICY "schedules_owner_manage" ON staff_schedules FOR ALL
  USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()))
  WITH CHECK (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

CREATE TABLE IF NOT EXISTS salon_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_salon_closures_salon ON salon_closures(salon_id);
ALTER TABLE salon_closures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "closures_owner_manage" ON salon_closures;
CREATE POLICY "closures_owner_manage" ON salon_closures FOR ALL
  USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()))
  WITH CHECK (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
DROP POLICY IF EXISTS "closures_public_read" ON salon_closures;
CREATE POLICY "closures_public_read" ON salon_closures FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS staff_breaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id UUID REFERENCES staff_members(id) ON DELETE CASCADE,
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  specific_date DATE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason TEXT DEFAULT 'break',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_staff_breaks_staff ON staff_breaks(staff_member_id);
ALTER TABLE staff_breaks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "breaks_owner_manage" ON staff_breaks;
CREATE POLICY "breaks_owner_manage" ON staff_breaks FOR ALL
  USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()))
  WITH CHECK (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

CREATE TABLE IF NOT EXISTS staff_time_off (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id UUID REFERENCES staff_members(id) ON DELETE CASCADE,
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  approved_by UUID,
  status TEXT DEFAULT 'approved' CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_staff_time_off_staff ON staff_time_off(staff_member_id);
ALTER TABLE staff_time_off ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "timeoff_owner_manage" ON staff_time_off;
CREATE POLICY "timeoff_owner_manage" ON staff_time_off FOR ALL
  USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()))
  WITH CHECK (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

-- Store-chosen staff colour (free hex), used by the rota + calendar.
ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS accent_color TEXT;
