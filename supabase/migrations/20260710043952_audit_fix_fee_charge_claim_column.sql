-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
-- charge-fee.ts double-charge race: two concurrent chargeFee calls for the SAME booking with
-- DIFFERENT kinds (cancellation vs no_show) both pass the null-status guard and both charge the
-- card (their Stripe idempotency keys differ by kind+amount, so Stripe does not collapse them).
-- The fee_charge_status CHECK enum has no spare 'charging' value and adding one needs a blocked
-- DROP CONSTRAINT, so add a dedicated claim column instead. chargeFee will claim this atomically
-- (claimed_at IS NULL AND status null/failed) BEFORE the Stripe call and release it on a decline,
-- so at most one fee charge is in flight per booking. Additive, idempotent.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS fee_charge_claimed_at timestamptz;