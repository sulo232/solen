-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
-- Rotate existing PENDING referral codes that are still the old deterministic
-- 'SOLEN-<first 8 hex of referrer UUID>' (guessable, and computable from the user_id the
-- public reviews endpoint used to leak) to fresh CSPRNG codes. The trigger already mints
-- CSPRNG for new users; this closes the exposure for the 31 existing pending rows. Completed
-- referrals are left untouched. gen_random_uuid() is evaluated per row so each gets a distinct
-- value; the UNIQUE(referral_code) constraint would raise on the (negligible) collision.
UPDATE public.referrals
SET referral_code = 'SOLEN-' || UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 12))
WHERE status = 'pending'
  AND referral_code = 'SOLEN-' || upper(substring(replace(referrer_id::text, '-', ''), 1, 8));