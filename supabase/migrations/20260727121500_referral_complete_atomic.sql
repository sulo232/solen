-- exists-check: extends lib/referral/complete-referral.ts (npm run exists complete_referral,
-- 2026-07-27). Net-new piece is only this RPC function; the CAS/dedup checks upstream of it
-- (feature flag, first-booking count, one-referral-per-user) stay in application code, unchanged.
-- ============================================================
-- 20260727121500_referral_complete_atomic
-- data-money-09: lib/referral/complete-referral.ts did the referral CAS update and the two
-- user_credits inserts as two sequential app-level .from() calls, not one Postgres function.
-- Each PostgREST request is its own transaction (per _backend-system/LAW.md section 2), so a
-- hard crash between the CAS committing and the credit insert running (a serverless function
-- killed mid-request, a network partition) leaves the referral permanently 'completed' with no
-- credits ever granted, and no reconciliation cron catches it. The existing catch-block revert
-- (delete any credits, flip the referral back to 'pending') only runs if the process is still
-- alive to run it; it cannot fix a crash-only failure.
--
-- This function folds the CAS + both inserts into ONE Postgres function, so PostgREST's
-- one-request-one-transaction boundary makes them atomic: either both writes commit, or (on any
-- error, including the two user_credits rows failing to insert) the whole transaction rolls back
-- automatically and the referral row is exactly as if the call never happened, no manual revert
-- needed. Mirrors the existing redeem_user_credits/restore_user_credits RPC pattern
-- (20260703150856_credit_redemption_ledger_and_rpcs.sql).
--
-- Returns true if this call won the CAS and credited both sides, false if the referral was
-- already completed/gone (lost the race to a concurrent caller, the expected no-op path).
-- ============================================================

CREATE OR REPLACE FUNCTION public.complete_referral_and_credit(
  p_referral_id uuid,
  p_referrer_id uuid,
  p_referred_user_id uuid,
  p_reward_amount numeric,
  p_expires_at timestamptz
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public', 'pg_temp' AS $$
DECLARE
  v_rows int;
BEGIN
  UPDATE referrals
  SET referred_user_id = p_referred_user_id,
      status = 'completed',
      completed_at = now()
  WHERE id = p_referral_id AND status = 'pending';

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RETURN false;
  END IF;

  INSERT INTO user_credits (user_id, amount, remaining, source, source_id, expires_at)
  VALUES
    (p_referrer_id, p_reward_amount, p_reward_amount, 'referral', p_referral_id::text, p_expires_at),
    (p_referred_user_id, p_reward_amount, p_reward_amount, 'referral', p_referral_id::text, p_expires_at);

  RETURN true;
END $$;

REVOKE EXECUTE ON FUNCTION public.complete_referral_and_credit(uuid, uuid, uuid, numeric, timestamptz) FROM PUBLIC;
