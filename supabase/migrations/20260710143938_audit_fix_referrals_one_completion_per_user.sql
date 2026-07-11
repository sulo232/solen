-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
-- Close the double-credit TOCTOU: the referral-completion helper's "user already redeemed" check is a
-- SELECT-then-act on a DIFFERENT row than the CAS locks, so two concurrent completions with two different
-- codes both pass and both credit. A partial unique index makes "at most one COMPLETED referral per
-- referred user" an atomic DB invariant; the helper catches the 23505 unique-violation and treats it as
-- {completed:false}. Safe to create: user_credits has 0 rows (no completion has ever happened), so there
-- are no existing duplicate completed rows to violate it.
CREATE UNIQUE INDEX IF NOT EXISTS referrals_one_completed_per_referred_uidx
  ON public.referrals (referred_user_id)
  WHERE status = 'completed' AND referred_user_id IS NOT NULL;