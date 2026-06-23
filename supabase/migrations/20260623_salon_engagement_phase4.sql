-- exists-check: net-new, ADDITIVE + idempotent. Phase 4 of the search→book points system
-- (_tasks/SEARCH_BOOK_POINTS_SPEC.md). Per-SALON engagement score (the popularity/quality ranking
-- side), mirrors the user_salon_affinity + loyalty recompute pattern. NOT a dup of salons.explore_score
-- (admin/solen-score owned — left untouched) or user_salon_affinity (per-USER). v1 = captured signals
-- (kept bookings + favorites + reviews); the search→book CONVERSION rate folds in once the search
-- camera is wired. Admin-read only (no select policy; the recommendations route reads via service-role).

create table if not exists public.salon_engagement (
  salon_id   uuid primary key references public.salons(id) on delete cascade,
  score      numeric not null default 0,   -- decayed weighted engagement (the popularity signal)
  bookings   integer not null default 0,
  favorites  integer not null default 0,
  reviews    integer not null default 0,
  updated_at timestamptz not null default now()
);
create index if not exists idx_salon_engagement_score on public.salon_engagement (score desc);
alter table public.salon_engagement enable row level security; -- admin/service-role only (no select policy)

create or replace function public.recompute_salon_engagement()
returns integer
language plpgsql
security definer
set search_path = public
as $func$
declare
  w_booking  numeric := 0.5;
  w_favorite numeric := 0.4;
  w_review   numeric := 0.35;
  decay_days numeric := 90;   -- salon popularity decays slower than personal affinity (60d)
  window_days int := 365;
  affected int;
begin
  with ev as (
    select b.salon_id, w_booking as w, b.created_at, 'booking'::text as src
    from public.bookings b
    where b.status in ('completed','confirmed') and coalesce(b.refunded_amount,0)=0
      and b.created_at >= now() - make_interval(days => window_days)
    union all
    select f.salon_id, w_favorite, f.created_at, 'favorite'
    from public.favorites f
    where f.salon_id is not null and f.created_at >= now() - make_interval(days => window_days)
    union all
    select r.salon_id, w_review, r.created_at, 'review'
    from public.reviews r
    where r.salon_id is not null and coalesce(r.is_hidden,false)=false
      and r.created_at >= now() - make_interval(days => window_days)
  ),
  agg as (
    select salon_id,
           round(sum(w * exp(- extract(epoch from (now()-created_at)) / 86400.0 / decay_days))::numeric, 4) as score,
           count(*) filter (where src='booking')  as bookings,
           count(*) filter (where src='favorite') as favorites,
           count(*) filter (where src='review')   as reviews
    from ev
    where salon_id is not null
    group by salon_id
  )
  insert into public.salon_engagement as se (salon_id, score, bookings, favorites, reviews, updated_at)
  select salon_id, score, bookings, favorites, reviews, now() from agg
  on conflict (salon_id) do update set
    score = excluded.score, bookings = excluded.bookings,
    favorites = excluded.favorites, reviews = excluded.reviews, updated_at = now();
  get diagnostics affected = row_count;
  return affected;
end;
$func$;

revoke execute on function public.recompute_salon_engagement() from public, anon, authenticated;
