-- exists-check: CREATE OR REPLACE of an existing live function (salons_with_slot_in_hours);
-- net-new file, no schema object created. Corrects an already-applied migration WITHOUT editing
-- the historical file (editing 20260607182403 in place would never reach live and would diverge a
-- fresh rebuild). Apply live via MCP apply_migration.
--
-- FIX (deep-audit misc/salons-search): the period (time-of-day) availability filter extracted the
-- UTC hour from starts_at, but all salon opening hours + the user's "morning/afternoon/evening"
-- intent are Zurich-local. In summer (CEST, +02:00) an 08:00-12:00 "morning" filter was silently
-- matching 06:00-10:00 local slots. Cast to Europe/Zurich before EXTRACT so the hour window is local.
create or replace function public.salons_with_slot_in_hours(
  p_start_hour integer,
  p_end_hour integer,
  p_from timestamptz,
  p_to timestamptz
) returns table(salon_id uuid)
language sql
stable
as $$
  select distinct s.salon_id
  from public.availability_slots s
  where s.status = 'available'
    and s.starts_at >= p_from
    and s.starts_at <= p_to
    and extract(hour from s.starts_at at time zone 'Europe/Zurich') >= p_start_hour
    and extract(hour from s.starts_at at time zone 'Europe/Zurich') < p_end_hour;
$$;

grant execute on function public.salons_with_slot_in_hours(integer, integer, timestamptz, timestamptz) to anon, authenticated, service_role;
