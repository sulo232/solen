-- R-CD2 Phase 1: Coiffeur Dashboard — extend client_formulas + consultation_notes
-- ============================================================

-- 1. Extend client_formulas with coiffeur-specific zone columns
ALTER TABLE client_formulas ADD COLUMN IF NOT EXISTS shade_code TEXT;
ALTER TABLE client_formulas ADD COLUMN IF NOT EXISTS root_formula JSONB DEFAULT '{}';
ALTER TABLE client_formulas ADD COLUMN IF NOT EXISTS mid_lengths_formula JSONB DEFAULT '{}';
ALTER TABLE client_formulas ADD COLUMN IF NOT EXISTS ends_formula JSONB DEFAULT '{}';
ALTER TABLE client_formulas ADD COLUMN IF NOT EXISTS staff_member_id UUID REFERENCES staff_members(id) ON DELETE SET NULL;

-- 2. Create consultation_notes table
CREATE TABLE IF NOT EXISTS consultation_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  hair_condition TEXT,
  scalp_condition TEXT,
  current_dislikes TEXT,
  desired_outcome TEXT,
  allergies TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (mandatory Rule 12b)
ALTER TABLE consultation_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "salon_owner_consultation_notes" ON consultation_notes
  FOR ALL USING (
    salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_consultation_notes_client ON consultation_notes(client_id, salon_id);
CREATE INDEX IF NOT EXISTS idx_client_formulas_shade ON client_formulas(salon_id, shade_code) WHERE shade_code IS NOT NULL;
