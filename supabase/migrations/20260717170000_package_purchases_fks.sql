-- exists-check: adds two FK constraints to the LIVE package_purchases table. Not a new table.
--
-- #6 (live re-audit 2026-07-17). package_purchases carried only package_id -> service_packages.
-- Its salon_id and user_id had NO foreign key, unlike every sibling purchase table. Verified live:
-- retail_purchases has salon_id -> salons ON DELETE CASCADE and user_id -> auth.users ON DELETE SET
-- NULL. Without these, deleting/hard-removing a salon or user would orphan package-purchase money
-- rows with a dangling id and no referential signal. This mirrors retail_purchases exactly, which
-- is the established convention. Verified pre-apply: 0 orphan salon_id rows, 0 orphan user_id rows,
-- so the constraints validate cleanly. salon_id is NOT NULL (CASCADE), user_id is nullable (SET NULL),
-- matching retail_purchases' nullability, so the ON DELETE actions are the correct pair.
--
-- Idempotent via guarded DO blocks. Additive, forward-only.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'package_purchases_salon_id_fkey') then
    alter table public.package_purchases
      add constraint package_purchases_salon_id_fkey
      foreign key (salon_id) references public.salons(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'package_purchases_user_id_fkey') then
    alter table public.package_purchases
      add constraint package_purchases_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete set null;
  end if;
end $$;
