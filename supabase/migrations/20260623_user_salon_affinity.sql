-- exists-check: net-new, ADDITIVE + idempotent. Phase 3 of the search→book points system
-- (_tasks/SEARCH_BOOK_POINTS_SPEC.md). Mirrors the loyalty_status recompute pattern
-- (20260614000000_loyalty_status_rank_phase2.sql): a per-(user,salon) DERIVED affinity score,
-- recomputed from the search_events funnel (NOT an incrementing wallet). NOT a dup of loyalty_status
-- (that's visit-frequency RANK, not per-salon engagement) or discovery-algorithm.ts (item popularity).
-- v1 = search funnel only (clicks + attributed books); discovery_interactions signals added later.

create table if not exists public.user_salon_affinity (
  user_id       uuid not null references auth.users(id) on delete cascade,
  salon_id      uuid not null references public.salons(id) on delete cascade,
  score         numeric not null default 0,   -- decayed weighted sum (the "points")
  clicks        integer not null default 0,   -- raw search clicks on this salon (in window)
  books         integer not null default 0,   -- attributed search→book at this salon (in window)
  last_event_at timestamptz,
  updated_at    timestamptz not null default now(),
  primary key (user_id, salon_id)
);

create index if not exists idx_user_salon_affinity_user_score
  on public.user_salon_affinity (user_id, score desc);

alter table public.user_salon_affinity enable row level security;
drop policy if exists user_salon_affinity_select_own on public.user_salon_affinity;
create policy user_salon_affinity_select_own on public.user_salon_affinity
  for select using (auth.uid() = user_id);

-- The recompute: read all of a user's recent search clicks (resolved to a salon), weight each
-- (a booked click counts as a book = 0.5 and subsumes its click; else 0.25), exponentially decay by
-- age, sum per (user, salon), and OVERWRITE the row. Idempotent; re-tunable; runs on the cron.
-- Weights mirror lib/points/weights.ts (kept in sync by comment, like the loyalty thresholds do).
create or replace function public.recompute_user_salon_affinity()
returns integer
language plpgsql
security definer
set search_path = public
as $func$
declare
  w_click    numeric := 0.25;  -- lib/points/weights.ts POINTS.click
  w_book     numeric := 0.5;   -- POINTS.bookViaSearch
  decay_days numeric := 60;    -- exp(-age_days/decay_days): ~37% weight at 60 days
  window_days int := 365;      -- bound the scan (older events ignored)
  affected int;
begin
  with ev as (
    select se.user_id,
           case se.clicked_type
             when 'salon'   then se.clicked_id
             when 'service' then sv.salon_id
             when 'stylist' then st.salon_id
           end as salon_id,
           se.booked,
           se.created_at
    from public.search_events se
    left join public.services      sv on se.clicked_type = 'service' and sv.id = se.clicked_id
    left join public.staff_members st on se.clicked_type = 'stylist' and st.id = se.clicked_id
    where se.user_id is not null
      and se.clicked_id is not null
      and se.created_at >= now() - make_interval(days => window_days)
  ),
  agg as (
    select user_id, salon_id,
           round(sum(
             (case when booked then w_book else w_click end)
             * exp(- extract(epoch from (now() - created_at)) / 86400.0 / decay_days)
           )::numeric, 4) as score,
           count(*) filter (where not booked) as clicks,
           count(*) filter (where booked)     as books,
           max(created_at) as last_event_at
    from ev
    where salon_id is not null
    group by user_id, salon_id
  )
  insert into public.user_salon_affinity as ua
    (user_id, salon_id, score, clicks, books, last_event_at, updated_at)
  select user_id, salon_id, score, clicks, books, last_event_at, now()
  from agg
  on conflict (user_id, salon_id) do update set
    score = excluded.score,
    clicks = excluded.clicks,
    books = excluded.books,
    last_event_at = excluded.last_event_at,
    updated_at = now();
  get diagnostics affected = row_count;
  return affected;
end;
$func$;

revoke execute on function public.recompute_user_salon_affinity() from public, anon, authenticated;
