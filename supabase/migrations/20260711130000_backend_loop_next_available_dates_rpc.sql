-- exists-check: net-new vs salons_with_slot_in_hours (that one filters by hour window and returns matching ids; nothing returns the EARLIEST next date per salon; npm run exists next_available_dates = 0 matches)
-- Ring 2b (backend improvement loop): earliest next available Zurich date per salon, DISTINCT ON server-side.
-- Applied live via MCP apply_migration as backend_loop_next_available_dates_rpc on 2026-07-11.
-- Replaces the route-side fetch of every future slot row (1,470 rows to keep 6;
-- silently truncated at the PostgREST 1000-row cap). STABLE, public browse data.
create or replace function public.next_available_dates(p_salon_ids uuid[], p_after timestamptz)
returns table(salon_id uuid, next_date text)
language sql stable as $$
  select distinct on (s.salon_id)
    s.salon_id,
    to_char(s.starts_at at time zone 'Europe/Zurich', 'YYYY-MM-DD') as next_date
  from public.availability_slots s
  where s.status = 'available'
    and s.starts_at > p_after
    and s.salon_id = any(p_salon_ids)
  order by s.salon_id, s.starts_at asc
$$;
