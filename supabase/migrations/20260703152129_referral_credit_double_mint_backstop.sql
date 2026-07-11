-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
-- Backstop the referral-credit double-mint race (payment reviewer HIGH): two concurrent completions
-- (manual PATCH + auto-complete cron, or two PATCHes) could both pass the SELECT-then-INSERT idempotency
-- check. A unique index makes the second insert fail (23505), which the award helper catches as a no-op.
-- The two award rows per referral differ by user_id (referrer vs referee), so this only blocks a DUPLICATE
-- of the same (referral, user) pair. Safe: user_credits has 0 rows today.
CREATE UNIQUE INDEX IF NOT EXISTS user_credits_referral_uniq
  ON public.user_credits (source, source_id, user_id)
  WHERE source = 'referral' AND source_id IS NOT NULL;