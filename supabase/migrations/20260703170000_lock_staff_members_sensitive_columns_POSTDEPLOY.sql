-- exists-check: net-new. Owner-greenlit staff-data RLS fix (2026-07-03).
--
-- *** POST-DEPLOY ONLY , DO NOT APPLY BEFORE THE CODE SHIPS. ***
-- Run this AFTER the commit "refactor(staff): explicit staff_members columns ..." is deployed.
-- Before that code is live, the deployed PDP (app/api/salons/[slug]) still does select(*) on
-- staff_members via the anon/authenticated client; revoking the columns first would make every
-- PDP/booking-detail staff read fail with "permission denied for column commission_rate".
--
-- What it does: locks staff_members.commission_rate + permissions to owner/admin. anon + authenticated
-- currently hold TABLE-level SELECT (all columns), so a column-only REVOKE is a no-op; instead remove
-- the table grant and re-grant only the public-safe columns. Owner/admin reads of the two sensitive
-- columns already go through the service-role client (which bypasses these grants).
REVOKE SELECT ON public.staff_members FROM anon, authenticated;
GRANT SELECT (
  id, salon_id, name, avatar_url, specialties, is_active, created_at, languages, average_rating,
  bio, instagram_url, years_experience, review_count, appointments_completed, clients_served,
  accent_color, slug, cover_photo_url, user_id, access_role, is_publicly_listed
) ON public.staff_members TO anon, authenticated;
