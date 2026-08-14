-- exists-check: net-new repo file (ran `npm run exists deals_enabled` this turn: 0 matches).
-- Repo migration 054 defined notification_preferences.deals_enabled but it never reached
-- prod (schema drift), so this re-applies it idempotently to the live DB.
--
-- Off-peak / deal email opt-in. The off-peak alert code reads
-- notification_preferences.deals_enabled; without the column the query 400s (caught +
-- skipped, so alerts went to zero users). Additive + idempotent. Default false = every
-- existing user is opted OUT until they explicitly opt in (conservative marketing-consent
-- default; no backfill). Applied to prod 2026-06-24 via apply_migration.

ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS deals_enabled boolean DEFAULT false;
