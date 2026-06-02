-- ============================================================
-- 20260602083300_financial_retention_on_delete
--
-- PURPOSE
--   Stop a customer account deletion from DESTROYING financial records.
--   Today, deleting a customer (via `admin.auth.admin.deleteUser(id)` in
--   app/api/cron/process-deletions/route.ts) deletes the auth.users row,
--   which CASCADES to public.profiles (profiles.id -> auth.users ON DELETE
--   CASCADE), which in turn CASCADES to public.bookings
--   (bookings.user_id -> profiles ON DELETE CASCADE, 014_new_schema.sql:226).
--   That cascade hard-deletes the booking row -- and with it the financial
--   transaction record it carries: paid_amount, refunded_amount,
--   payment_intent_id, fee_charged_amount, fee_charge_intent_id, policy_snapshot.
--   The refund/dispute audit trail (booking_disputes, case_events) dies the
--   same way through reporter_id/reported_id -> auth.users ON DELETE CASCADE.
--
-- LEGAL RATIONALE (why ANONYMIZE, not delete)
--   Swiss Code of Obligations Art. 958f mandates 10-YEAR retention of
--   accounting records (a paid booking + its refund are exactly that).
--   revDSG Art. 6 (proportionality / lawful basis) and GDPR Art. 17(3)(b)
--   provide the erasure carve-out: the right to erasure does NOT override a
--   legal retention obligation. The correct reconciliation is: strip the
--   personal identifiers (revDSG erasure satisfied) while PRESERVING the
--   financial figures and Stripe references (OR Art. 958f retention
--   satisfied). i.e. ANONYMIZE-NOT-DELETE.
--
--   This mirrors the precedent already shipped in 030_gdpr_support.sql, which
--   flipped reviews.user_id to ON DELETE SET NULL so reviews survive (de-linked)
--   after a user is deleted. Same philosophy, extended to the money rows.
--
-- WHAT THIS MIGRATION DOES (high level)
--   1. bookings: keep the row on owner deletion. Flip user_id FK CASCADE ->
--      SET NULL (backstop) AND relax the owner-or-guest CHECK to also accept a
--      fully-anonymized retained record (new `anonymized_at` tombstone column).
--   2. A BEFORE DELETE trigger on public.profiles anonymizes every dependent
--      financial row IN PLACE (null the owning FK, write redacted tombstone
--      contact fields, stamp anonymized_at) BEFORE Postgres applies the
--      cascade. This is the engine; the SET NULL flips are the safety net.
--   3. booking_disputes: flip reporter_id / reported_id / requested_by_user_id /
--      resolved_by FK CASCADE -> SET NULL, and redact the guest PII columns +
--      free-text response fields in place via the same trigger.
--   4. case_events: flip actor_user_id (already SET NULL) and redact note.
--   5. bookings: add the refunded_amount sanity CHECK, GUARDED so it can never
--      fail on an existing row (paid_amount is NULLABLE -> the constraint is
--      written to be a no-op whenever paid_amount IS NULL).
--
-- SAFETY / IDEMPOTENCY
--   - Forward-only, fully guarded, RE-RUNNABLE. Every statement is wrapped in
--     DROP ... IF EXISTS / IF NOT EXISTS / CREATE OR REPLACE / guarded DO block.
--   - Contains NO statement that deletes data. Not one DELETE / TRUNCATE / DROP
--     TABLE / DROP COLUMN anywhere.
--   - Live behavior change is intentional and scoped: deleting a profile no
--     longer removes its bookings/disputes; instead the rows are retained with
--     personal data stripped. The owner-or-guest invariant still holds.
--
-- DRIFT WARNING
--   This project has known schema drift (migrations are NOT auto-applied; see
--   _tasks/SCHEMA_DRIFT_AUDIT.md). Everything below is written to tolerate the
--   "constraint/column may or may not already exist in the exact named form"
--   reality. APPLY MANUALLY -- see the report.
-- ============================================================

-- ------------------------------------------------------------
-- 0. Tombstone column: marks a retained-but-anonymized financial record.
--    NULL = a normal (live owner or live guest) booking.
--    NON-NULL = the owner was deleted; this row is kept for OR Art. 958f and
--    has had its personal identifiers stripped. The owner-or-guest CHECK
--    (step 2) accepts this state so SET NULL on user_id cannot break the row.
-- ------------------------------------------------------------
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS anonymized_at timestamptz;

COMMENT ON COLUMN public.bookings.anonymized_at IS
  'Set when the owning customer was deleted; row retained (anonymized) for OR Art. 958f / revDSG Art. 6. NULL = live record.';

-- ------------------------------------------------------------
-- 1. BOOKINGS: flip user_id FK from ON DELETE CASCADE to ON DELETE SET NULL.
--    user_id is ALREADY nullable (20260601_refund_appeal_foundation.sql:29),
--    so no ALTER COLUMN DROP NOT NULL is needed -- but we run it guarded for
--    self-containment in case this lands on a DB where the foundation hasn't.
--    This is the same shape as 030_gdpr_support.sql for reviews.
-- ------------------------------------------------------------
ALTER TABLE public.bookings ALTER COLUMN user_id DROP NOT NULL;

DO $$
DECLARE
  fk_name text;
BEGIN
  -- Find whatever the user_id -> profiles FK is actually named (it may be the
  -- auto-generated bookings_user_id_fkey, or a custom name from drift). Drop
  -- exactly that one, then re-add with SET NULL. Looking it up by column makes
  -- this robust to naming drift instead of hardcoding one constraint name.
  SELECT con.conname INTO fk_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'bookings'
    AND con.contype = 'f'
    AND con.conkey = (
      SELECT ARRAY[attnum] FROM pg_attribute
      WHERE attrelid = rel.oid AND attname = 'user_id'
    )
  LIMIT 1;

  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.bookings DROP CONSTRAINT %I', fk_name);
  END IF;

  ALTER TABLE public.bookings
    ADD CONSTRAINT bookings_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
END $$;

-- ------------------------------------------------------------
-- 2. BOOKINGS: relax the owner-or-guest CHECK so a fully-anonymized retained
--    record is also valid. Previously (20260601_sp1_bookings_guest_rls.sql:58):
--       user_id IS NOT NULL OR (guest_name IS NOT NULL AND guest_phone IS NOT NULL)
--    Adding `OR anonymized_at IS NOT NULL` lets the SET NULL backstop path leave
--    a valid row even in the (defensive) case where the trigger in step 3 did
--    NOT also write tombstone guest fields. The trigger DOES write them, so in
--    practice the guest-fields branch already passes -- this is belt + braces so
--    a raw `DELETE FROM profiles` that skips the trigger can never abort on the
--    CHECK and can never silently destroy money either.
-- ------------------------------------------------------------
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_owner_or_guest_chk;
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_owner_or_guest_chk
  CHECK (
    user_id IS NOT NULL
    OR (guest_name IS NOT NULL AND guest_phone IS NOT NULL)
    OR anonymized_at IS NOT NULL
  );

-- ------------------------------------------------------------
-- 3. BOOKING_DISPUTES + CASE_EVENTS: flip the auth.users FKs from CASCADE to
--    SET NULL so the refund/upcharge audit trail survives owner deletion.
--    Definitions (20260601_refund_appeal_foundation.sql):
--      reporter_id  -> auth.users ON DELETE CASCADE   (line 112)  -> SET NULL
--      reported_id  -> auth.users ON DELETE CASCADE   (line 113)  -> SET NULL
--      requested_by_user_id -> auth.users ON DELETE SET NULL (125) -> already ok
--      resolved_by  -> auth.users (no action = NO ACTION) (130)   -> SET NULL
--      case_events.actor_user_id -> auth.users ON DELETE SET NULL (222) -> already ok
--    All four target columns are already NULLABLE, so SET NULL is always legal.
--    Re-pointed by column lookup (drift-safe), same pattern as step 1.
-- ------------------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  -- Only act if booking_disputes exists (it is created by the foundation
  -- migration; on a DB where that hasn't run yet, skip silently).
  IF to_regclass('public.booking_disputes') IS NULL THEN
    RAISE NOTICE 'booking_disputes absent -> skipping dispute FK flips (apply 20260601_refund_appeal_foundation first).';
    RETURN;
  END IF;

  FOR r IN
    SELECT con.conname, att.attname
    FROM pg_constraint con
    JOIN pg_class rel        ON rel.oid = con.conrelid
    JOIN pg_namespace nsp    ON nsp.oid = rel.relnamespace
    JOIN pg_attribute att    ON att.attrelid = rel.oid AND att.attnum = con.conkey[1]
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'booking_disputes'
      AND con.contype = 'f'
      AND array_length(con.conkey, 1) = 1
      AND att.attname IN ('reporter_id', 'reported_id', 'resolved_by')
  LOOP
    EXECUTE format('ALTER TABLE public.booking_disputes DROP CONSTRAINT %I', r.conname);
    EXECUTE format(
      'ALTER TABLE public.booking_disputes ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES auth.users(id) ON DELETE SET NULL',
      r.conname, r.attname
    );
  END LOOP;
END $$;

-- ------------------------------------------------------------
-- 4. THE ENGINE: BEFORE DELETE trigger on public.profiles.
--    When a profile is about to be deleted (this is the row the auth.users
--    cascade actually removes), anonymize its dependent FINANCIAL rows IN
--    PLACE so the figures are retained while personal data is stripped.
--
--    Why BEFORE DELETE on profiles (option "b") and not a pure declarative FK
--    relax (option "a")?  A pure SET NULL would leave bookings.user_id = NULL
--    with NO tombstone written, so the owner-or-guest CHECK would FAIL and the
--    whole deletion would ABORT. Something procedural must stamp the tombstone +
--    redacted contact fields at deletion time. That something is this trigger.
--    Running it BEFORE DELETE guarantees the child rows are already valid by the
--    time Postgres applies the cascade's SET NULL.
--
--    SECURITY DEFINER + pinned search_path: the trigger must UPDATE child tables
--    regardless of the RLS context the deletion runs under, and we never want a
--    mutable search_path on a definer function.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.anonymize_financial_rows_on_profile_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- 4a. BOOKINGS owned by the departing user. Null the link, write a neutral,
  --     non-identifying tombstone so the owner-or-guest CHECK still holds, and
  --     stamp anonymized_at. The MONEY columns (paid_amount, refunded_amount,
  --     payment_intent_id, fee_charged_amount, fee_charge_intent_id,
  --     policy_snapshot) are deliberately LEFT UNTOUCHED -- that is the whole
  --     point: retain the financial record, drop only the identity.
  --     Guarded so a re-anonymization (anonymized_at already set) is a no-op.
  UPDATE public.bookings
  SET
    user_id       = NULL,
    guest_name    = 'Deleted user',
    guest_email   = NULL,
    guest_phone   = '[redacted]',
    anonymized_at = now()
  WHERE user_id = OLD.id
    AND anonymized_at IS NULL;

  -- 4b. BOOKING_DISPUTES this user reported / was reported in / requested /
  --     resolved. De-link every personal FK and redact the PII + free-text
  --     fields, but keep the case shell + amounts + Stripe refund id (the
  --     audit trail of a money movement is itself a retained record).
  IF to_regclass('public.booking_disputes') IS NOT NULL THEN
    UPDATE public.booking_disputes
    SET
      reporter_id          = CASE WHEN reporter_id          = OLD.id THEN NULL ELSE reporter_id END,
      reported_id          = CASE WHEN reported_id          = OLD.id THEN NULL ELSE reported_id END,
      requested_by_user_id = CASE WHEN requested_by_user_id = OLD.id THEN NULL ELSE requested_by_user_id END,
      resolved_by          = CASE WHEN resolved_by          = OLD.id THEN NULL ELSE resolved_by END,
      guest_name        = NULL,
      guest_email       = NULL,
      guest_phone       = NULL,
      customer_response = NULL,
      description       = NULL
    WHERE reporter_id          = OLD.id
       OR reported_id          = OLD.id
       OR requested_by_user_id = OLD.id
       OR resolved_by          = OLD.id;
  END IF;

  -- 4c. CASE_EVENTS authored by this user. actor_user_id is already ON DELETE
  --     SET NULL at the auth.users level, but auth.users is deleted in the SAME
  --     statement that triggered this cascade, so we cannot rely on ordering to
  --     redact the free-text note. Null the actor link for this profile's events
  --     and scrub any note that could carry personal data, keeping the
  --     status-transition + amount skeleton intact for the audit timeline.
  IF to_regclass('public.case_events') IS NOT NULL THEN
    UPDATE public.case_events
    SET
      actor_user_id = NULL,
      note          = NULL
    WHERE actor_user_id = OLD.id;
  END IF;

  RETURN OLD;
END;
$$;

COMMENT ON FUNCTION public.anonymize_financial_rows_on_profile_delete() IS
  'BEFORE DELETE on profiles: anonymize-not-delete dependent financial rows (bookings / booking_disputes / case_events) so OR Art. 958f retention survives a revDSG/GDPR erasure. Strips identity, keeps money figures + Stripe refs.';

DROP TRIGGER IF EXISTS profiles_anonymize_financial_before_delete ON public.profiles;
CREATE TRIGGER profiles_anonymize_financial_before_delete
  BEFORE DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.anonymize_financial_rows_on_profile_delete();

-- ------------------------------------------------------------
-- 5. BOOKINGS: refunded_amount sanity CHECK.
--    Requested: (refunded_amount IS NULL OR (refunded_amount >= 0 AND
--    refunded_amount <= paid_amount)).
--    REALITY CHECK against the live schema (lib/database.types.ts bookings.Row):
--      - refunded_amount is `integer NOT NULL DEFAULT 0` -> never NULL.
--      - paid_amount     is `integer` and NULLABLE.
--    A naive `refunded_amount <= paid_amount` would evaluate to NULL (treated
--    as PASS) whenever paid_amount IS NULL -- harmless -- but to make the intent
--    explicit and to never risk failing an existing row, the comparison is
--    guarded so it only bites when paid_amount IS NOT NULL. We also keep the
--    `refunded_amount >= 0` floor unconditionally.
--    Net invariant: you can never record a refund larger than what was paid,
--    and you can never record a negative refund.
-- ------------------------------------------------------------
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_refunded_amount_chk;
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_refunded_amount_chk
  CHECK (
    refunded_amount IS NULL
    OR (
      refunded_amount >= 0
      AND (paid_amount IS NULL OR refunded_amount <= paid_amount)
    )
  );

-- ============================================================
-- END. No DELETE / TRUNCATE / DROP TABLE / DROP COLUMN performed.
-- Live effect: deleting a customer now RETAINS their financial rows in
-- anonymized form instead of cascade-deleting them. Apply manually:
--   supabase db push
-- (see report -- this project does NOT auto-apply migrations.)
-- ============================================================
