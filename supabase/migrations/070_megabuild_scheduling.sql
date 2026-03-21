-- ============================================================
-- MEGABUILD Phase 3: Scheduling Tables
-- staff_schedules, salon_closures, staff_breaks, staff_time_off
-- ============================================================

CREATE TABLE IF NOT EXISTS staff_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id UUID REFERENCES staff_members(id) ON DELETE CASCADE NOT NULL,
  salon_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL, end_time TIME NOT NULL,
  is_alternate_week BOOLEAN DEFAULT false,
  alternate_week_parity INTEGER DEFAULT 0 CHECK (alternate_week_parity IN (0, 1)),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(staff_member_id, day_of_week, alternate_week_parity)
);
ALTER TABLE staff_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schedules_salon_manage" ON staff_schedules FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  OR staff_member_id IN (SELECT id FROM staff_members WHERE user_id = auth.uid())
);

CREATE TABLE IF NOT EXISTS salon_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL, end_date DATE NOT NULL, reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE salon_closures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "closures_salon_manage" ON salon_closures FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
CREATE POLICY "closures_public_read" ON salon_closures FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS staff_breaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id UUID REFERENCES staff_members(id) ON DELETE CASCADE NOT NULL,
  salon_id UUID NOT NULL,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  specific_date DATE,
  start_time TIME NOT NULL, end_time TIME NOT NULL,
  reason TEXT DEFAULT 'break', created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE staff_breaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "breaks_manage" ON staff_breaks FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  OR staff_member_id IN (SELECT id FROM staff_members WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS staff_time_off (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id UUID REFERENCES staff_members(id) ON DELETE CASCADE NOT NULL,
  salon_id UUID NOT NULL,
  start_date DATE NOT NULL, end_date DATE NOT NULL,
  reason TEXT, approved_by UUID,
  status TEXT DEFAULT 'approved' CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE staff_time_off ENABLE ROW LEVEL SECURITY;
CREATE POLICY "timeoff_manage" ON staff_time_off FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  OR staff_member_id IN (SELECT id FROM staff_members WHERE user_id = auth.uid()));
