-- exists-check: net-new. Payment-review HIGH backstop (2026-07-03). Applied via MCP apply_migration.
--
-- Backstops the referral-credit double-mint race: two concurrent completions (a manual PATCH-to-completed
-- + the auto-complete cron, or two PATCHes) could both pass the SELECT-then-INSERT idempotency check in
-- lib/referral/award-on-completion.ts before either wrote. This unique index makes the second insert of
-- the same (referral, user) credit fail with 23505, which the helper catches as a no-op. The award writes
-- two rows per referral (referrer + referee) that differ by user_id, so this only blocks a true duplicate.
-- Paired with an atomic CAS on the referral status (only one completion flips pending -> completed).
CREATE UNIQUE INDEX IF NOT EXISTS user_credits_referral_uniq
  ON public.user_credits (source, source_id, user_id)
  WHERE source = 'referral' AND source_id IS NOT NULL;
