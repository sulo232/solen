-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
-- Audit REVIEWS C2/C3: the app writes reviews.moderation_status / removal_reason (flag + admin
-- moderation) but the columns never existed live (migration 060 was never applied) -> every
-- flag/hide 500s. Purely additive + idempotent.
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'active'
    CHECK (moderation_status IN ('active','under_review','removed')),
  ADD COLUMN IF NOT EXISTS removal_reason TEXT;
CREATE INDEX IF NOT EXISTS reviews_moderation_status_idx ON public.reviews(moderation_status);