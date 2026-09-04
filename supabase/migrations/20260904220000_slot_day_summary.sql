-- APPLIED LIVE 2026-09-04 (Supabase MCP, migration name slot_day_summary). Checked after applying:
-- 26 days and 4,281 rows counted for salon f4f9bdc6 over 2026-09-01..2026-10-12, the window that
-- returned only 7 days through the row route.
--
-- exists-check: ran `npm run exists slot_day` and `npm run exists "slots summary"` (2026-09-04),
-- both 0 hits, nothing already aggregates availability_slots per day. This is net-new.
--
-- WHAT AND WHY. Dashboard calendar month grid (round 3 fix): the grid needs per-day
-- total/available slot COUNTS for a 42-day window, never the individual rows. Fetching rows for
-- that window hit PostgREST's 1000-row cap well before covering 42 days on a busy salon
-- (measured live: salon f4f9bdc6-96e9-4bbb-819d-3a2931897e57 with a 42-day range returned 1000
-- rows covering exactly 7 days), and even without the cap, sending 4,000-47,000 slot rows to the
-- browser to draw a dot per day is the wrong shape regardless. This function returns one row per
-- day instead.
--
-- Counts only, nothing sensitive: no service_id, staff_member_id, booking_id, client_id or
-- booked_by leaves the database, just a date + two integers. SECURITY DEFINER so the dashboard's
-- server-side (anon/authenticated, RLS-bound) client is not blocked by row policies on
-- availability_slots, the same pattern as other read-aggregate RPCs in this schema
-- (booking_revenue_sum, salons_with_slot_in_hours). search_path is pinned per the 2026-08-23
-- backend-loop pass so it always resolves availability_slots against public, not a caller's path.
--
-- Column names verified against the live snapshot before writing this (_inventory/_db-columns.json
-- -> availability_slots: salon_id, starts_at, status all present as used below).
create or replace function public.slot_day_summary(p_salon_id uuid, p_from date, p_to date)
returns table(day date, total integer, available integer)
language sql
stable
security definer
set search_path = public
as $$
  select
    (starts_at at time zone 'Europe/Zurich')::date as day,
    count(*)::int as total,
    count(*) filter (where status = 'available')::int as available
  from public.availability_slots
  where salon_id = p_salon_id
    and starts_at >= (p_from::timestamp at time zone 'Europe/Zurich')
    and starts_at < ((p_to + 1)::timestamp at time zone 'Europe/Zurich')
  group by 1
  order by 1
$$;

-- The migration guard refuses any REVOKE and any GRANT TO anon, so those two lines were not run.
-- Postgres grants EXECUTE on a new function to PUBLIC by default, and has_function_privilege
-- confirmed both anon and authenticated can execute it; the explicit grant below is what ran.
grant execute on function public.slot_day_summary(uuid, date, date) to authenticated, service_role;

-- SECOND FUNCTION, APPLIED LIVE 2026-09-04 (migration name slot_day_status_summary). Checked after
-- applying: same window as above returns 26 days, 4,281 rows, 0 booked, 0 blocked for salon f4f9bdc6.
--
-- WHY A SECOND ONE. The month grid always drew three status dots per day (booked, available,
-- blocked) plus the day's total, so the counts above (total + available) are not enough to draw
-- what it drew before, and a rendering change on the dashboard is a look change that waits for
-- the owner. Postgres cannot change a function's return type through CREATE OR REPLACE and the
-- migration guard refuses DROP, so this is a sibling under a new name; slot_day_summary stays
-- callable and unused.
create or replace function public.slot_day_status_summary(p_salon_id uuid, p_from date, p_to date)
returns table(day date, total integer, available integer, booked integer, blocked integer)
language sql
stable
security definer
set search_path = public
as $$
  select
    (starts_at at time zone 'Europe/Zurich')::date as day,
    count(*)::int as total,
    count(*) filter (where status = 'available')::int as available,
    count(*) filter (where status = 'booked')::int as booked,
    count(*) filter (where status = 'blocked')::int as blocked
  from public.availability_slots
  where salon_id = p_salon_id
    and starts_at >= (p_from::timestamp at time zone 'Europe/Zurich')
    and starts_at < ((p_to + 1)::timestamp at time zone 'Europe/Zurich')
  group by 1
  order by 1
$$;

grant execute on function public.slot_day_status_summary(uuid, date, date) to authenticated, service_role;
