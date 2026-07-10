-- exists-check: net-new vs 049_referrals.sql because migrations are append-only timestamped
-- files; this one REDEFINES generate_referral_code() from 049 (does not edit it in place) so
-- file-order application yields the CSPRNG version, plus a one-time rotation of existing rows.
--
-- Security fix (backend sweep ring 9, 2026-07-10): referral codes were guessable.
-- The original generate_referral_code() (049_referrals.sql) minted
--   'SOLEN-' || UPPER(SUBSTRING(REPLACE(NEW.id::text,'-',''),1,8))
-- i.e. the first 8 hex chars of the user's own UUID, uppercased. That UUID leaked on the
-- public reviews endpoint, so anyone's money-granting referral code was computable with zero
-- guessing. This migration redefines the generator to use a CSPRNG (gen_random_uuid, 12 hex,
-- not derived from identity) and rotates any existing PENDING deterministic codes.
-- Applied live via the Supabase MCP the same day; committed here so a fresh provision from
-- migration files does NOT regenerate the weak 049 definition.

CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code text;
  attempts int := 0;
BEGIN
  LOOP
    new_code := 'SOLEN-' || UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 12));
    BEGIN
      INSERT INTO public.referrals (referrer_id, referral_code, status)
      VALUES (NEW.id, new_code, 'pending');
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      attempts := attempts + 1;
      IF attempts >= 5 THEN
        RAISE;
      END IF;
    END;
  END LOOP;
  RETURN NEW;
END;
$$;

-- Rotate existing pending deterministic codes to fresh CSPRNG codes. Completed referrals
-- are left untouched. Idempotent: only rows still matching the old derivation are updated.
UPDATE public.referrals
SET referral_code = 'SOLEN-' || UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 12))
WHERE status = 'pending'
  AND referral_code = 'SOLEN-' || upper(substring(replace(referrer_id::text, '-', ''), 1, 8));
