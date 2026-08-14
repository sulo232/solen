-- exists-check: replaces the LIVE partial unique index salon_payouts_pi_key in place. Not new.
--
-- CRITICAL (live re-audit 2026-07-17). salon_payouts_pi_key was a PARTIAL unique index:
--   CREATE UNIQUE INDEX salon_payouts_pi_key ON salon_payouts (stripe_payment_intent_id)
--     WHERE (stripe_payment_intent_id IS NOT NULL)
-- All three payout writers (webhook/route.ts:272 booking-pay, :391 off-session upcharge,
-- webhook/purchase-handler.ts:60 retail) do `.upsert(..., { onConflict: "stripe_payment_intent_id" })`.
-- Supabase-js emits `ON CONFLICT (stripe_payment_intent_id)` with NO predicate, and Postgres cannot
-- use a PARTIAL index as the arbiter for a predicate-less ON CONFLICT. Reproduced live (rolled back):
--   INSERT ... ON CONFLICT (stripe_payment_intent_id) DO NOTHING
--   -> 42P10 "there is no unique or exclusion constraint matching the ON CONFLICT specification"
-- So every payout write threw and the webhook, which never checked the error, proceeded as if it
-- succeeded. The salon_payouts table is EMPTY (0 rows), consistent with every write having failed
-- since inception. Once live this would record NO payout ledger row for any booking payment,
-- off-session charge, or retail purchase, while the money moved through Stripe.
--
-- FIX: a NON-partial unique index on stripe_payment_intent_id. On PG 17 (NULLS DISTINCT default,
-- confirmed 17.6) a full unique index allows multiple NULLs exactly like the partial one did, so
-- enforcement is unchanged for the NULL case, and now the bare ON CONFLICT matches. No code change
-- needed. Verified pre-apply: 0 duplicate non-null pi_ids (a full unique index cannot fail to build).
--
-- Create-new-then-drop-old so uniqueness is never lost for even an instant. Idempotent/forward-only.
create unique index if not exists salon_payouts_pi_key_full
  on public.salon_payouts (stripe_payment_intent_id);
drop index if exists salon_payouts_pi_key;
alter index salon_payouts_pi_key_full rename to salon_payouts_pi_key;
