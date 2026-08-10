-- Salon sign-up: persist the contact email and the Google listing the address box resolves.
--
-- exists-check: net-new vs 046_salon_info_fields.sql (read it, same ALTER ... ADD COLUMN IF NOT
-- EXISTS pattern on public.salons, but it adds four unrelated profile-text fields and is long
-- since applied), 014_new_schema.sql / 004_salon_photos.sql / 053_salon_groups.sql /
-- 080_salon_drafts.sql / 077_salon_documents.sql / 017_salon_analytics.sql /
-- 011_stores_schema_fix.sql (different tables entirely). The one real near-duplicate is
-- 20260326000001_add_missing_salon_columns.sql, see the note below for why it cannot be the file
-- that lands this. A historical migration is never edited in place, so this is a new file.
--
-- Owner decision 1 (TASTE_LOG 2026-08-09), verbatim "1 A but is it legal": A, save both, and the
-- legal question was answered yes with conditions in the same entry. Until now the sign-up form
-- collected both and app/api/salons/route.ts threw them away, because neither column existed on
-- public.salons. Verified live 2026-08-09: information_schema.columns returns 0 rows for
-- email / google_place_id on public.salons.
--
-- Why 20260326000001_add_missing_salon_columns.sql does not cover this: it carries the same two
-- ALTERs, but it predates the live column snapshot (2026-07-12) and its columns are still absent,
-- so it never ran and a forward-only runner will never reach back for it. This file is the one
-- that actually applies. Both are IF NOT EXISTS, so they cannot collide.
--
-- LEGAL CONSTRAINT, from that same taste-log entry: only the Google PLACE ID may be kept
-- indefinitely (Places policy: the place ID "is exempt from the caching restrictions"). The copied
-- name, address, phone and rating may not. So this adds the ID and nothing else from Places, and
-- the column comments below carry the rule to whoever reads the schema next.
--
-- Additive and idempotent: two nullable columns, no backfill, no constraint on existing rows.

ALTER TABLE public.salons
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS google_place_id TEXT;

COMMENT ON COLUMN public.salons.email IS 'Contact address the salon typed at sign-up. Its purpose is stated at the point of entry (i18n key salonRegistration.step1.emailUse) and is limited to contacting them about their own salon: no marketing use without a separate opt-in, and delete it when the salon leaves.';

COMMENT ON COLUMN public.salons.google_place_id IS 'Google Places place ID ONLY. The ID may be stored indefinitely; the name, address, phone and rating from Places may not, so they are deliberately not stored here and must be fetched fresh if ever needed.';
