-- Migration 060: Review moderation status
-- Adds moderation_status enum field and removal_reason for ToS §7.2 legal defensibility.
-- The flag flow: salon flags → 'under_review' → admin decides → 'removed' or back to 'active'.
-- Additive only — no existing columns changed.

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'active'
    CHECK (moderation_status IN ('active', 'under_review', 'removed')),
  ADD COLUMN IF NOT EXISTS removal_reason TEXT;

-- Index for admin moderation queue (filter by under_review quickly)
CREATE INDEX IF NOT EXISTS reviews_moderation_status_idx ON public.reviews(moderation_status);

-- ⚠️ MANUAL STEP: Run this in Supabase SQL Editor before deploying Phase 2 code.
-- Verify after running: SELECT count(*), moderation_status FROM reviews GROUP BY moderation_status;
-- Expected: all existing reviews show moderation_status = 'active'
