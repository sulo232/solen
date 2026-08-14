-- exists-check: gap-hunt H7 (2026-07-03). Registered-user right-to-erasure was fully dead:
-- request-deletion + profile/delete write profiles.deletion_requested_at + account_status and
-- the process-deletions cron scans deletion_requested_at, but NEITHER column existed on live
-- profiles, so a delete request 500'd and the cron never deleted anyone (revDSG/GDPR exposure).
-- Verified live before applying: profiles.email + stripe_customer_id exist, the BEFORE DELETE
-- anonymize trigger exists, data_deletion_log exists; only these two columns were missing.
-- Applied via apply_migration; mirrored here. Additive.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deletion_requested_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active';
-- Partial index: the cron scans "deletion_requested_at is not null and < now()-30d"; almost all
-- rows are null, so a partial index keeps the scan O(pending-deletions).
CREATE INDEX IF NOT EXISTS profiles_deletion_requested_idx
  ON public.profiles (deletion_requested_at)
  WHERE deletion_requested_at IS NOT NULL;
