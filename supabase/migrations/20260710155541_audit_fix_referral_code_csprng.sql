-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
-- The referral code was 'SOLEN-<first 8 hex of the user UUID>' , fully deterministic from a
-- value that leaks publicly (reviews endpoint returned raw user_id), so anyone's money-granting
-- referral code was computable with zero guessing. Generate it from a CSPRNG instead
-- (gen_random_uuid is cryptographically strong), 12 hex chars = 48 bits, not derived from identity.
-- Loop-until-unique replaces ON CONFLICT DO NOTHING so a (near-impossible) collision still yields a code.
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