-- exists-check: net-new migration, ADDITIVE (CREATE OR REPLACE the existing function only; no table
-- change). Extends recompute_user_salon_affinity() (20260623_user_salon_affinity.sql) to also consume
-- the ALREADY-CAPTURED engagement signals — kept bookings, favorites, reviews — not just the (still
-- empty) search funnel. Verified via read-only dry-run: 121 affinity rows from real data. Discovery
-- saves DEFERRED (their items have owner_salon_id = null, so they resolve to no salon yet).
-- Weights mirror lib/points/weights.ts.

create or replace function public.recompute_user_salon_affinity()
returns integer
language plpgsql
security definer
set search_path = public
as $func$
declare
  w_click    numeric := 0.25;  -- search click (POINTS.click)
  w_book     numeric := 0.5;   -- search-attributed booking (POINTS.bookViaSearch); extra credit on top of the booking signal
  w_booking  numeric := 0.5;   -- a kept booking (POINTS.booking); repeat bookings compound = natural rebook reward
  w_favorite numeric := 0.4;   -- favorited the salon (POINTS.favorite)
  w_review   numeric := 0.35;  -- left a visible review (POINTS.review)
  decay_days numeric := 60;    -- exp(-age_days/decay_days): ~37% weight at 60 days
  window_days int := 365;
  affected int;
begin
  with ev as (
    -- search clicks/books (dormant until /api/search/event is wired into the UI)
    select se.user_id,
           case se.clicked_type
             when 'salon'   then se.clicked_id
             when 'service' then sv.salon_id
             when 'stylist' then st.salon_id
           end as salon_id,
           (case when se.booked then w_book else w_click end) as w,
           se.created_at,
           (not se.booked) as is_click,
           false as is_booking
    from public.search_events se
    left join public.services      sv on se.clicked_type = 'service' and sv.id = se.clicked_id
    left join public.staff_members st on se.clicked_type = 'stylist' and st.id = se.clicked_id
    where se.user_id is not null and se.clicked_id is not null
      and se.created_at >= now() - make_interval(days => window_days)
    union all
    -- kept bookings (completed/confirmed, unrefunded). Repeat bookings at a salon compound.
    select b.user_id, b.salon_id, w_booking, b.created_at, false, true
    from public.bookings b
    where b.user_id is not null
      and b.status in ('completed','confirmed')
      and coalesce(b.refunded_amount, 0) = 0
      and b.created_at >= now() - make_interval(days => window_days)
    union all
    -- favorites
    select f.user_id, f.salon_id, w_favorite, f.created_at, false, false
    from public.favorites f
    where f.user_id is not null and f.salon_id is not null
      and f.created_at >= now() - make_interval(days => window_days)
    union all
    -- reviews (visible only)
    select r.user_id, r.salon_id, w_review, r.created_at, false, false
    from public.reviews r
    where r.user_id is not null and r.salon_id is not null
      and coalesce(r.is_hidden, false) = false
      and r.created_at >= now() - make_interval(days => window_days)
  ),
  agg as (
    select user_id, salon_id,
           round(sum(w * exp(- extract(epoch from (now() - created_at)) / 86400.0 / decay_days))::numeric, 4) as score,
           count(*) filter (where is_click)   as clicks,   -- search clicks (search funnel)
           count(*) filter (where is_booking) as books,    -- kept bookings at this salon
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
