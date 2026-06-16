-- Solen Status (GO-modeled loyalty rank), phase 2 snapshot. ADDITIVE + idempotent.
-- Applied live to project tocfnsmxmdxkrcmjzzdw on 2026-06-14 via apply_migration; this
-- file mirrors it so repo<->remote stay aligned. Spec: _design-system/LOYALTY_STRUCTURE.md.
-- Thresholds mirror lib/loyalty/status.ts (Gold=3, Platinum=6, 12-month window, CHF 25 floor).
-- Safe to re-run (IF NOT EXISTS / CREATE OR REPLACE, no drops).

create table if not exists public.loyalty_status (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  tier           text not null default 'base' check (tier in ('base','gold','platinum')),
  visits         integer not null default 0,
  next_tier      text check (next_tier in ('gold','platinum')),
  next_threshold integer,
  to_next        integer,
  window_start   timestamptz not null default now(),
  valid_through  timestamptz,
  source         text not null default 'computed' check (source in ('computed','seed')),
  updated_at     timestamptz not null default now()
);

alter table public.loyalty_status enable row level security;
drop policy if exists loyalty_status_select_own on public.loyalty_status;
create policy loyalty_status_select_own on public.loyalty_status
  for select using (auth.uid() = user_id);

create or replace function public.recompute_loyalty_status()
returns integer
language plpgsql
security definer
set search_path = public
as $func$
declare
  gold_threshold int := 3;
  plat_threshold int := 6;
  window_months  int := 12; -- 12mo (gentle decay), matches current_user_tier() + lib/loyalty/status.ts. Live was patched to 12; this file was stale at 6.
  min_value_chf  numeric := 25;
  affected int;
begin
  with q as (
    select b.user_id,
           count(*) filter (
             where b.status = 'completed'
               and coalesce(b.refunded_amount, 0) <= 0
               and coalesce(b.final_price, b.price_paid, b.estimated_price, 0) >= min_value_chf
               and b.starts_at >= now() - make_interval(months => window_months)
           ) as visits
    from public.bookings b
    where b.user_id is not null
    group by b.user_id
  ),
  derived as (
    select user_id, visits,
           case when visits >= plat_threshold then 'platinum'
                when visits >= gold_threshold then 'gold'
                else 'base' end as computed_tier
    from q
  )
  insert into public.loyalty_status as ls
    (user_id, tier, visits, next_tier, next_threshold, to_next, window_start, valid_through, source, updated_at)
  select
    d.user_id,
    case when prev.tier = 'platinum' and d.computed_tier = 'base' then 'gold'
         else d.computed_tier end as tier,
    d.visits,
    case when d.computed_tier = 'base' then 'gold'
         when d.computed_tier = 'gold' then 'platinum' else null end,
    case when d.computed_tier = 'base' then gold_threshold
         when d.computed_tier = 'gold' then plat_threshold else null end,
    case when d.computed_tier = 'base' then greatest(0, gold_threshold - d.visits)
         when d.computed_tier = 'gold' then greatest(0, plat_threshold - d.visits)
         else null end,
    now() - make_interval(months => window_months),
    (date_trunc('month', now()) + interval '3 months' - interval '1 day'),
    'computed',
    now()
  from derived d
  left join public.loyalty_status prev on prev.user_id = d.user_id
  on conflict (user_id) do update set
    tier = excluded.tier,
    visits = excluded.visits,
    next_tier = excluded.next_tier,
    next_threshold = excluded.next_threshold,
    to_next = excluded.to_next,
    window_start = excluded.window_start,
    valid_through = excluded.valid_through,
    source = 'computed',
    updated_at = now();
  get diagnostics affected = row_count;
  return affected;
end;
$func$;

revoke execute on function public.recompute_loyalty_status() from public, anon, authenticated;
