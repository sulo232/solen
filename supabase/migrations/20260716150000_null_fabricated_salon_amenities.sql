-- exists-check: net-new vs supabase/migrations/20260530_seed_salon_amenities.sql (the ONLY
-- prior migration touching these 9 columns; forward-only, never edited). Not a duplicate of
-- 019_badges.sql / 077_salon_documents.sql / 053_salon_groups.sql / 080_salon_drafts.sql /
-- 004_salon_photos.sql / 061_service_gender.sql / 034_service_addons.sql /
-- 017_salon_analytics.sql (unrelated tables/columns), because this is the deliberate INVERSE
-- of 20260530's seed, not a new feature.
--
-- Undoes supabase/migrations/20260530_seed_salon_amenities.sql: that migration set nine
-- salons boolean columns (wheelchair_accessible, near_public_transport, kid_friendly,
-- pet_friendly, wifi_friendly, lgbtq_friendly, woman_owned, family_owned, student_discount)
-- from `abs(hashtext(id || salt)) % 100 < N`, a deterministic hash of the row's own id, not
-- a real answer any salon ever gave. Verified on prod 2026-07-16 (read-only SQL): all 20
-- active salons still exactly equalled the hash output, meaning no owner had ever corrected
-- a value. 7 salons falsely claimed wheelchair access and 8 falsely claimed LGBTQ+ welcome,
-- and both rendered to real customers as SalonAdditionalInfo badges and as live search
-- filter facets: a wheelchair user filtering for step-free access got a coin flip, not a
-- fact. This is real-world harm, not a cosmetic bug.
--
-- Prod data was already nulled manually (service-role UPDATE, verified 0 non-null columns
-- remaining) on 2026-07-16, before this file existed. This migration exists purely so a
-- FRESH `supabase db reset` reproduces that same corrected (NULL = unknown) state instead
-- of re-running the idempotent 20260530 seed and recreating the lie. Each column is only
-- nulled where it STILL exactly equals its original hash expression (same salt/threshold as
-- the source migration), so a value a real owner has since corrected via the dashboard
-- survives untouched. Scoped to `where is_active`, mirroring the original seed's scope.
--
-- seed-ok: this migration REMOVES fabrication (nulls hash-derived values back to unknown),
-- it does not add fabricated data. The hash/modulo expressions below exist only to IDENTIFY
-- rows that still carry the untouched seeded value, not to synthesize a new one.
update salons set
  wheelchair_accessible = case when wheelchair_accessible = (abs(hashtext(id::text || 'wheel'))   % 100 < 45) then null else wheelchair_accessible end,
  near_public_transport = case when near_public_transport = (abs(hashtext(id::text || 'transit')) % 100 < 70) then null else near_public_transport end,
  kid_friendly          = case when kid_friendly          = (abs(hashtext(id::text || 'kid'))     % 100 < 40) then null else kid_friendly end,
  pet_friendly          = case when pet_friendly          = (abs(hashtext(id::text || 'pet'))     % 100 < 30) then null else pet_friendly end,
  wifi_friendly         = case when wifi_friendly         = (abs(hashtext(id::text || 'wifi'))    % 100 < 78) then null else wifi_friendly end,
  lgbtq_friendly        = case when lgbtq_friendly        = (abs(hashtext(id::text || 'lgbtq'))   % 100 < 45) then null else lgbtq_friendly end,
  woman_owned           = case when woman_owned           = (abs(hashtext(id::text || 'woman'))   % 100 < 42) then null else woman_owned end,
  family_owned          = case when family_owned          = (abs(hashtext(id::text || 'family'))  % 100 < 38) then null else family_owned end,
  student_discount      = case when student_discount      = (abs(hashtext(id::text || 'student')) % 100 < 50) then null else student_discount end
where is_active;
