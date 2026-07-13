-- exists-check: extends supabase/migrations/20260602083300_financial_retention_on_delete.sql +
-- 20260703001317_backend_harden_face10_searchpath_and_gdpr_trigger.sql (same trigger function,
-- CREATE OR REPLACE, same name); net-new vs 039_loyalty/002_profiles/058_client_tags/
-- 030_gdpr_support/040_client_notes/053_salon_groups/080_salon_drafts/004_salon_photos because
-- none of those touch the anonymize_financial_rows_on_profile_delete() trigger or the specific
-- gap tables below (client_formulas, intake_form_responses, client_photos, nail_design_history,
-- nail_client_preferences, package_purchases, gift_cards, group_bookings, tips, staff_members,
-- salon_clients, user_salon_affinity, user_style_affinity, spa_treatment_outcomes), confirmed via
-- grep across supabase/migrations/*.sql before writing this file.
--
-- REVISED 2026-07-13 (reviewer punch list): review_photos and 4 untracked/live-only
-- tables (user_salon_affinity, user_style_affinity, search_events, spa_treatment_outcomes)
-- were re-audited column-by-column against lib/database.types.ts Relationships arrays
-- (which reflect the REAL introspected FK, not just the column's existence):
--   - review_photos is NOT a trigger fix (it has a real FK, ON DELETE CASCADE, to
--     reviews(id), 051_review_photos.sql). The gap is that reviews.user_id is SET
--     NULL (not deleted), so the parent review row SURVIVES and review_photos is
--     never cascaded. Fixed at the APPLICATION layer (hard delete row + storage
--     bytes, a Postgres trigger cannot call the Storage API), see
--     lib/gdpr/purge-review-photo-storage.ts, wired into
--     app/api/cron/process-deletions/route.ts BEFORE the auth delete. No trigger
--     change needed here.
--   - user_style_affinity.user_id LOOKED like a gap (empty Relationships in
--     lib/database.types.ts), but reading the actual tracked migration
--     (20260623124500_user_style_affinity.sql:11) shows
--     `user_id uuid not null references auth.users(id) on delete cascade`, a
--     real FK that already cascade-deletes the row. The empty Relationships
--     array is a false signal here: Supabase's type generator omits FKs that
--     target a table outside the "public" schema (auth.users isn't part of
--     the exported Database type), so "empty Relationships" only proves "no
--     FK to a public-schema table", not "no FK at all". Confirmed fine, no
--     trigger change needed.
--   - user_salon_affinity.user_id has the SAME shape (empty Relationships,
--     composite PK: user_id + salon_id, no own id column) but, UNLIKE
--     user_style_affinity, has NO tracked migration file anywhere in this
--     repo creating it (confirmed by grep across supabase/migrations/*.sql;
--     20260623124500's own header calls it "live-only"), so its real FK
--     (if any) can't be read from source. Defensively hard-deleted in the
--     trigger below (wrapped in EXCEPTION, same risk class as salon_clients):
--     harmless even if it turns out to already cascade, closes the gap if it
--     doesn't.
--   - spa_treatment_outcomes.client_id: also an EMPTY Relationships entry, NOT
--     NULL, and (like user_salon_affinity) has NO tracked migration file at all
--     in this repo (confirmed by grep; only referenced from
--     app/api/dashboard/spa/treatment-outcomes/route.ts and
--     lib/database.types.ts), so it can't be confirmed either way. This table
--     DOES have its own id PK though, so it is defensively anonymized in place
--     (client_id nulled + skin_before/skin_after/follow_up_notes scrubbed),
--     mirroring the barber_cut_history pattern. Added to the trigger below.
--   - search_events.user_id: DOES have real named FK entries in
--     lib/database.types.ts (search_events_user_id_fkey, against
--     profiles/profile_summaries/public_profiles), so a real constraint exists
--     and is already enforced by Postgres on profile deletion. No dangling risk,
--     nothing added here for it.
--
-- ============================================================
-- 20260713150000_gdpr_deletion_completeness
--
-- PURPOSE
--   Close the gap between "the account got deleted" and "no PII survives".
--   The existing BEFORE DELETE trigger on public.profiles
--   (public.anonymize_financial_rows_on_profile_delete, migrations
--   20260602083300 + 20260703001317) already anonymizes bookings /
--   booking_disputes / case_events / barber_walkin_queue /
--   barber_cut_history / reviews.comment. This migration finds every OTHER
--   table that carries a customer_id / client_id / user_id column pointing
--   at the departing profile with NO FK at all (so Postgres cascade never
--   touches it, and nothing else ever cleans it either) and extends the SAME
--   trigger function to scrub it too.
--
-- HOW THE GAP WAS FOUND
--   lib/database.types.ts Tables was walked column-by-column for every
--   customer_id / client_id / user_id / organizer_user_id / purchaser_user_id
--   column, then cross-checked against every CREATE TABLE in
--   supabase/migrations/*.sql for the ACTUAL FK definition + ON DELETE
--   action. Result: most CRM tables (client_notes, client_tags,
--   spa/waxing/makeup/coiffeur dashboards, price_offers, loyalty_stamps,
--   conversations, messages, voucher_purchases) already CASCADE via a real
--   FK to profiles(id)/auth.users(id), those need nothing here. The tables
--   below do NOT have any FK on that column (several say so explicitly in
--   their own migration comment, e.g. nail_design_history: "customer_id
--   intentionally has no FK, supports guest bookings") so a deleted
--   customer's rows there survive FOREVER with a dangling id plus free-text
--   notes / photo paths / health-adjacent preferences. That is the concrete
--   leftover this migration removes.
--
-- WHY ANONYMIZE-IN-PLACE (not hard delete) FOR THESE
--   Mirrors the already-shipped precedent for barber_walkin_queue /
--   barber_cut_history (migration 20260703001317): the salon's operational
--   record (a completed cut, a redeemed package session, a walk-in queue
--   entry) stays for the salon's own business continuity, but every column
--   that identifies OR describes the departing person (name, photo, notes,
--   allergy notes, email, phone) is nulled. This is MORE conservative than
--   the sibling CRM tables (nail/spa/waxing/makeup/coiffeur dashboards),
--   which already hard-CASCADE-delete their client_id-linked rows outright
--   on profile deletion, anonymizing in place here is strictly safer.
--
-- staff_members IS DELIBERATELY NOT TOUCHED beyond user_id
--   staff_members.user_id links a login (if the staff member ever created a
--   personal Solen account) to their PUBLIC salon listing (name, avatar,
--   bio, content the SALON manages, not the departing account's private
--   data). Nulling user_id severs the login link (the actual sensitive bit:
--   proof that this specific auth account could access this listing).
--   Redacting name/avatar/bio would break the salon's live public booking
--   page for a still-employed stylist merely because they deleted their
--   unrelated personal customer account, a product/business call, not ours
--   to make silently. FLAGGED for the owner, not auto-applied.
--
-- retail_sales.customer_id / sales.client_id are DELIBERATELY NOT TOUCHED
--   retail_sales.customer_id has no FK and is never actually written by
--   app/api/dashboard/nail/retail-sales/route.ts (grep confirms no code path
--   sets it), dead column, nothing to scrub. sales.client_id FKs to
--   salon_clients(id), a SEPARATE salon-owned contact-book identity space,
--   not directly this Solen account, out of scope for erasing one Solen
--   account's PII (touching another controller's independent records would
--   be overreach, not a fix).
--
-- salon_clients IS HANDLED DEFENSIVELY (wrapped in its own EXCEPTION block)
--   salon_clients.profile_id DOES FK to profiles (confirmed via
--   lib/database.types.ts Relationships) and the table carries
--   email/name/phone/notes, but it has NO tracked migration file in this
--   repo (live-only schema, same drift class as client-photos / the old
--   staff-portfolio-images per _rules/BACKEND_SYSTEMS.md). Its exact
--   nullability can't be confirmed offline, so the UPDATE below is wrapped
--   in BEGIN/EXCEPTION so an unexpected constraint on this ONE untracked
--   table logs a WARNING instead of aborting the entire account deletion
--   for every table after it.
--
-- SAFETY / IDEMPOTENCY (same contract as 20260602083300)
--   Forward-only, fully guarded (to_regclass / ALTER ... IF EXISTS /
--   CREATE OR REPLACE), re-runnable, contains no DELETE/TRUNCATE/DROP.
--   ALTER COLUMN ... DROP NOT NULL is idempotent (no-op if already nullable
--   or if the table doesn't exist, thanks to the IF EXISTS guard).
-- ============================================================

-- ------------------------------------------------------------
-- 0. Relax NOT NULL on every customer_id/user_id column this migration will
--    need to NULL out below. Each is guarded so a missing table/column or an
--    already-nullable column is a silent no-op.
-- ------------------------------------------------------------
ALTER TABLE IF EXISTS public.client_formulas          ALTER COLUMN customer_id DROP NOT NULL;
ALTER TABLE IF EXISTS public.intake_form_responses     ALTER COLUMN customer_id DROP NOT NULL;
ALTER TABLE IF EXISTS public.client_photos             ALTER COLUMN customer_id DROP NOT NULL;
ALTER TABLE IF EXISTS public.nail_design_history       ALTER COLUMN customer_id DROP NOT NULL;
ALTER TABLE IF EXISTS public.nail_client_preferences   ALTER COLUMN customer_id DROP NOT NULL;
ALTER TABLE IF EXISTS public.package_purchases         ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE IF EXISTS public.spa_treatment_outcomes     ALTER COLUMN client_id DROP NOT NULL;

-- ------------------------------------------------------------
-- 1. THE ENGINE: extend the existing profiles BEFORE DELETE trigger
--    function. Same name -> the already-installed trigger
--    (profiles_anonymize_financial_before_delete) picks this up on the next
--    deletion automatically, no trigger re-create needed.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.anonymize_financial_rows_on_profile_delete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  UPDATE public.bookings
  SET user_id = NULL, guest_name = 'Deleted user', guest_email = NULL,
      guest_phone = '[redacted]', anonymized_at = now()
  WHERE user_id = OLD.id AND anonymized_at IS NULL;

  IF to_regclass('public.booking_disputes') IS NOT NULL THEN
    UPDATE public.booking_disputes
    SET reporter_id = CASE WHEN reporter_id = OLD.id THEN NULL ELSE reporter_id END,
        reported_id = CASE WHEN reported_id = OLD.id THEN NULL ELSE reported_id END,
        requested_by_user_id = CASE WHEN requested_by_user_id = OLD.id THEN NULL ELSE requested_by_user_id END,
        resolved_by = CASE WHEN resolved_by = OLD.id THEN NULL ELSE resolved_by END,
        guest_name = NULL, guest_email = NULL, guest_phone = NULL,
        customer_response = NULL, description = NULL
    WHERE reporter_id = OLD.id OR reported_id = OLD.id
       OR requested_by_user_id = OLD.id OR resolved_by = OLD.id;
  END IF;

  IF to_regclass('public.case_events') IS NOT NULL THEN
    UPDATE public.case_events SET actor_user_id = NULL, note = NULL WHERE actor_user_id = OLD.id;
  END IF;

  -- Added 2026-07-03 (Face 10): scrub barber PII (no customer_id FK so nothing cascades).
  IF to_regclass('public.barber_walkin_queue') IS NOT NULL THEN
    UPDATE public.barber_walkin_queue
    SET customer_id = NULL, customer_name = 'Deleted user', customer_phone = '[redacted]'
    WHERE customer_id = OLD.id;
  END IF;

  IF to_regclass('public.barber_cut_history') IS NOT NULL THEN
    UPDATE public.barber_cut_history
    SET customer_id = NULL, customer_name = 'Deleted user', notes = NULL, photo_url = NULL
    WHERE customer_id = OLD.id;
  END IF;

  -- reviews.comment is free text with potential PII; null it but keep the rating for aggregates.
  IF to_regclass('public.reviews') IS NOT NULL THEN
    UPDATE public.reviews SET comment = NULL WHERE user_id = OLD.id;
  END IF;

  -- ==========================================================
  -- Added 2026-07-13 (GDPR deletion completeness): tables with a
  -- customer_id/user_id column that has NO FK to profiles/auth.users at
  -- all, so nothing above (and no cascade) ever touched them.
  -- ==========================================================

  -- client_formulas: hair-colour formulas + free-text notes about this customer.
  IF to_regclass('public.client_formulas') IS NOT NULL THEN
    UPDATE public.client_formulas
    SET customer_id = NULL, notes = NULL
    WHERE customer_id = OLD.id;
  END IF;

  -- intake_form_responses: filled-in health/preference intake forms.
  IF to_regclass('public.intake_form_responses') IS NOT NULL THEN
    UPDATE public.intake_form_responses
    SET customer_id = NULL, responses = '{}'::jsonb, ai_recommendation = NULL
    WHERE customer_id = OLD.id;
  END IF;

  -- client_photos: before/after/progress photos of this customer. The
  -- storage BYTES are removed by the application layer (Postgres can't call
  -- the Storage API) BEFORE this trigger fires, see
  -- lib/gdpr/purge-client-photo-storage.ts, called from
  -- app/api/cron/process-deletions/route.ts ahead of admin.auth.admin.deleteUser().
  -- This UPDATE clears the DB pointer regardless, so even an out-of-band
  -- profile delete (bypassing the cron) never leaves a dangling photo path.
  IF to_regclass('public.client_photos') IS NOT NULL THEN
    UPDATE public.client_photos
    SET customer_id = NULL, photo_url = NULL
    WHERE customer_id = OLD.id;
  END IF;

  -- nail_design_history: "customer_id intentionally has no FK, supports
  -- guest bookings" (072_nail_foundation.sql), but a REGISTERED customer's
  -- id still needs to be scrubbed on deletion.
  IF to_regclass('public.nail_design_history') IS NOT NULL THEN
    UPDATE public.nail_design_history
    SET customer_id = NULL, notes = NULL, photo_url = NULL
    WHERE customer_id = OLD.id;
  END IF;

  -- nail_client_preferences: allergy + skin-sensitivity notes.
  IF to_regclass('public.nail_client_preferences') IS NOT NULL THEN
    UPDATE public.nail_client_preferences
    SET customer_id = NULL, allergy_notes = NULL, notes = NULL
    WHERE customer_id = OLD.id;
  END IF;

  -- package_purchases: which customer bought which service package.
  IF to_regclass('public.package_purchases') IS NOT NULL THEN
    UPDATE public.package_purchases
    SET user_id = NULL
    WHERE user_id = OLD.id;
  END IF;

  -- gift_cards: purchaser identity (recipient_email is the GIFTEE, a
  -- different person, and is left alone).
  IF to_regclass('public.gift_cards') IS NOT NULL THEN
    UPDATE public.gift_cards
    SET purchaser_user_id = NULL, purchaser_email = NULL
    WHERE purchaser_user_id = OLD.id;
  END IF;

  -- group_bookings: the organizer's identity snapshot (mirrors the
  -- bookings.guest_name tombstone pattern above).
  IF to_regclass('public.group_bookings') IS NOT NULL THEN
    UPDATE public.group_bookings
    SET organizer_user_id = NULL, organizer_name = 'Deleted user',
        organizer_phone = NULL, notes = NULL
    WHERE organizer_user_id = OLD.id;
  END IF;

  -- tips: who left the tip (nullable already; amount + Stripe ref retained,
  -- same anonymize-not-delete philosophy as the money columns on bookings).
  IF to_regclass('public.tips') IS NOT NULL THEN
    UPDATE public.tips
    SET user_id = NULL
    WHERE user_id = OLD.id;
  END IF;

  -- staff_members: sever the login link only. Public listing content
  -- (name/avatar/bio) is the salon's own business data and is deliberately
  -- left untouched, see the migration header comment for why.
  IF to_regclass('public.staff_members') IS NOT NULL THEN
    UPDATE public.staff_members
    SET user_id = NULL
    WHERE user_id = OLD.id;
  END IF;

  -- salon_clients: untracked/live-only table (no migration file in this
  -- repo), so wrapped defensively, a schema surprise here must not abort
  -- the rest of the deletion.
  IF to_regclass('public.salon_clients') IS NOT NULL THEN
    BEGIN
      UPDATE public.salon_clients
      SET profile_id = NULL, email = NULL, name = 'Deleted client', phone = NULL, notes = NULL
      WHERE profile_id = OLD.id;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'anonymize_financial_rows_on_profile_delete: salon_clients scrub failed for profile %: %', OLD.id, SQLERRM;
    END;
  END IF;

  -- user_salon_affinity: untracked/live-only, no FK at all on user_id (empty
  -- Relationships in lib/database.types.ts), COMPOSITE PK (user_id, salon_id)
  -- so the column cannot be nulled, hard-delete the row instead. Wrapped
  -- defensively like salon_clients (untracked schema).
  IF to_regclass('public.user_salon_affinity') IS NOT NULL THEN
    BEGIN
      DELETE FROM public.user_salon_affinity WHERE user_id = OLD.id;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'anonymize_financial_rows_on_profile_delete: user_salon_affinity delete failed for profile %: %', OLD.id, SQLERRM;
    END;
  END IF;

  -- user_style_affinity is DELIBERATELY NOT touched here: confirmed via
  -- 20260623124500_user_style_affinity.sql:11 to already carry
  -- `user_id uuid not null references auth.users(id) on delete cascade`, so
  -- Postgres cascade-deletes its rows on profile deletion with no help
  -- needed from this trigger. See the migration header for why the
  -- generated types.ts looked like a gap here and wasn't one.

  -- spa_treatment_outcomes: client_id has no FK (empty Relationships in
  -- lib/database.types.ts) but the table has its own id PK, so anonymize in
  -- place (mirrors barber_cut_history): the salon's operational record
  -- (booking_id/salon_id/staff_member_id) stays, everything identifying or
  -- describing the departing client (client_id, before/after skin notes,
  -- follow-up notes) is scrubbed.
  IF to_regclass('public.spa_treatment_outcomes') IS NOT NULL THEN
    BEGIN
      UPDATE public.spa_treatment_outcomes
      SET client_id = NULL, skin_before = NULL, skin_after = NULL, follow_up_notes = NULL
      WHERE client_id = OLD.id;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'anonymize_financial_rows_on_profile_delete: spa_treatment_outcomes scrub failed for profile %: %', OLD.id, SQLERRM;
    END;
  END IF;

  RETURN OLD;
END;
$function$;

COMMENT ON FUNCTION public.anonymize_financial_rows_on_profile_delete() IS
  'BEFORE DELETE on profiles: anonymize-not-delete every dependent row that carries this account''s PII (financial rows retained per OR Art. 958f; CRM/CRM-adjacent rows have their identity + free text scrubbed). Extended 2026-07-13 for the full GDPR deletion-completeness audit, see migration 20260713150000 for the exhaustive table-by-table rationale.';

-- ============================================================
-- END. No DELETE / TRUNCATE / DROP TABLE / DROP COLUMN performed.
-- Apply manually (this project does not auto-apply migrations).
-- ============================================================
