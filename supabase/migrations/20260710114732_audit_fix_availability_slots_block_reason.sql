-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
-- generate-slots' nightly capacity limiter flips availability_slots.status available->blocked and NOTHING
-- ever reverts it, so capacity blocks accumulate permanently (a slot blocked on a busy night stays
-- unavailable forever even after capacity frees) => lost booking capacity. The revert can't be shipped
-- safely without distinguishing a CAPACITY block from a salon-owner MANUAL block (both write status='blocked').
-- Add a block_reason marker so the nightly pass can revert ONLY its own capacity blocks. Additive, nullable
-- (legacy blocks stay null => never auto-reverted, conservative).
ALTER TABLE public.availability_slots
  ADD COLUMN IF NOT EXISTS block_reason text
    CHECK (block_reason IS NULL OR block_reason IN ('manual','capacity','vacation','system'));

CREATE INDEX IF NOT EXISTS availability_slots_capacity_block_idx
  ON public.availability_slots (salon_id, starts_at) WHERE block_reason = 'capacity';