-- exists-check: `npm run exists rejected_at` => 0 hits (column missing from the live DB snapshot;
-- salons already has rejection_reason + approved_at + registration_completed, but no rejected_at).
-- Net-new additive column on salons; not a duplicate of any existing salon_* migration.
-- 20260624: salons.rejected_at , the resubmit discriminator for store-owner onboarding (PATH-B).
--
-- After PATH-B, /api/salon/go-live sets registration_completed=true and LEAVES is_active=false,
-- so the salon enters admin review. The "submitted/pending" state (registration_completed=true,
-- is_active=false, approved_at=null) is INDISTINGUISHABLE from a "rejected" salon that was sent
-- back, since both have approved_at=null. rejected_at is the discriminator: an admin stamps it on
-- rejection so a resubmitted-but-not-yet-approved salon (rejected_at != null, approved_at=null) is
-- distinguishable from a never-reviewed pending one (rejected_at=null, approved_at=null). The
-- existing rejection_reason holds the human-readable note; rejected_at is the machine-readable flag.
-- Additive + idempotent. NOT applied here , the orchestrator applies it out-of-band.
ALTER TABLE salons ADD COLUMN IF NOT EXISTS rejected_at timestamptz;
COMMENT ON COLUMN salons.rejected_at IS 'When an admin rejected the salon submission (PATH-B onboarding). Non-null + approved_at IS NULL distinguishes a rejected/resubmitted salon from a never-reviewed pending one. rejection_reason holds the reason text.';
