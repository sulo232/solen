-- 059: Solen Score — computed nightly, drives gold pins + tier badges
ALTER TABLE salons
  ADD COLUMN IF NOT EXISTS solen_score int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS solen_tier text DEFAULT 'grey'
    CHECK (solen_tier IN ('gold', 'teal', 'grey', 'dark')),
  ADD COLUMN IF NOT EXISTS score_details jsonb DEFAULT '{}';

COMMENT ON COLUMN salons.solen_score IS 'Solen Score 0-100, computed nightly';
COMMENT ON COLUMN salons.solen_tier IS 'gold(80+), teal(60-79), grey(40-59), dark(0-39)';

CREATE INDEX IF NOT EXISTS idx_salons_tier ON salons(solen_tier) WHERE is_active = true;
