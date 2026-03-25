-- =====================================================
-- Migration 082: Pricing Rules
-- =====================================================
-- Purpose: Add pricing_rules table for dynamic pricing
-- indicators on salon cards (weekend surcharges,
-- last-minute discounts, etc.)
-- Author: quick-wins-p1-agent
-- Date: 2026-03-25
-- Related: _tasks/roadmap-quick-wins.md Phase 1
-- =====================================================

-- Create pricing_rules table
CREATE TABLE IF NOT EXISTS pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('weekend_surcharge', 'last_minute_discount', 'peak_hour_surcharge', 'off_peak_discount', 'holiday_surcharge')),
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday, NULL=all days
  modifier_type TEXT NOT NULL CHECK (modifier_type IN ('fixed_chf', 'percentage')),
  modifier_value NUMERIC NOT NULL CHECK (modifier_value > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for efficient salon lookups
CREATE INDEX idx_pricing_rules_salon_id ON pricing_rules(salon_id);
CREATE INDEX idx_pricing_rules_active ON pricing_rules(salon_id, is_active) WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Public read access (for displaying pricing indicators on salon cards)
CREATE POLICY "pricing_rules_select_public" ON pricing_rules
  FOR SELECT
  USING (is_active = true);

-- RLS Policy: Salon owners can manage their own pricing rules
CREATE POLICY "pricing_rules_insert_owner" ON pricing_rules
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM salons
      WHERE salons.id = pricing_rules.salon_id
      AND salons.user_id = auth.uid()
    )
  );

CREATE POLICY "pricing_rules_update_owner" ON pricing_rules
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM salons
      WHERE salons.id = pricing_rules.salon_id
      AND salons.user_id = auth.uid()
    )
  );

CREATE POLICY "pricing_rules_delete_owner" ON pricing_rules
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM salons
      WHERE salons.id = pricing_rules.salon_id
      AND salons.user_id = auth.uid()
    )
  );

-- Update trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_pricing_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pricing_rules_updated_at
  BEFORE UPDATE ON pricing_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_pricing_rules_updated_at();

-- Add comment to table
COMMENT ON TABLE pricing_rules IS 'Dynamic pricing rules for salons (weekend surcharges, last-minute discounts, etc.). Used to display pricing indicators on salon cards.';
