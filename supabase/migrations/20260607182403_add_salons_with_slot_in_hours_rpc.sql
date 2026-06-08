-- Period (time-of-day) availability filter for search.
-- Returns DISTINCT salon_ids with an available slot whose local hour is in
-- [p_start_hour, p_end_hour) within [p_from, p_to]. EXTRACT + DISTINCT in SQL so it
-- never hits PostgREST's row cap (the old fetch-all-then-JS-filter truncated the 14-day
-- no-date window at ~1000 rows -> only ~4 salons returned instead of all).
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
    and extract(hour from s.starts_at) >= p_start_hour
    and extract(hour from s.starts_at) < p_end_hour;
$$;

grant execute on function public.salons_with_slot_in_hours(integer, integer, timestamptz, timestamptz) to anon, authenticated, service_role;
