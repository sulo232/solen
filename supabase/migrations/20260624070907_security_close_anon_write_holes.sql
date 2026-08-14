-- exists-check: net-new — mirrors prod migration security_close_anon_write_holes (applied via apply_migration, version 20260624070907), absent from the repo. Removes always-true write policies originally defined in 004_salon_photos.sql / 039_loyalty.sql etc.; this is the security remediation, not a duplicate of those.
-- Close the anonymous-write holes flagged by the security advisor.
-- 5 of these tables (addons, inventory, salon_photos, staff_calendars, sms_reminders)
-- are dead/empty legacy: 0 rows, integer salon_id that cannot join uuid salons.id, no
-- live write-path. So we simply REMOVE the always-true `{public}` write policies (no
-- owner policy is possible or needed; service_role still bypasses RLS if ever used).
-- loyalty_stamps is live (9 rows) but written only via the service_role admin client
-- (app/api/loyalty/award), so removing the public self-insert kills the self-grant
-- fraud vector without affecting legitimate awards.

-- addons
drop policy if exists "Auth insert addons" on public.addons;
drop policy if exists "Auth update addons" on public.addons;
drop policy if exists "Auth delete addons" on public.addons;

-- inventory
drop policy if exists "Auth insert inventory" on public.inventory;
drop policy if exists "Auth update inventory" on public.inventory;
drop policy if exists "Auth delete inventory" on public.inventory;

-- salon_photos
drop policy if exists "Authenticated users can insert salon photos" on public.salon_photos;
drop policy if exists "Authenticated users can update salon photos" on public.salon_photos;
drop policy if exists "Authenticated users can delete salon photos" on public.salon_photos;

-- staff_calendars
drop policy if exists "Auth write staff_cal" on public.staff_calendars;
drop policy if exists "Auth update staff_cal" on public.staff_calendars;
drop policy if exists "Auth delete staff_cal" on public.staff_calendars;

-- sms_reminders  (also drop the public SELECT — it exposed phone + message PII)
drop policy if exists "Auth insert reminders" on public.sms_reminders;
drop policy if exists "Auth update reminders" on public.sms_reminders;
drop policy if exists "Public read reminders" on public.sms_reminders;

-- loyalty_stamps  (live; service_role award bypasses RLS, so this only blocks self-grant fraud)
drop policy if exists "loyalty_stamps_insert_system" on public.loyalty_stamps;
