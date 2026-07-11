-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
CREATE OR REPLACE FUNCTION public.current_user_tier(uid uuid DEFAULT auth.uid())
 RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare
  gold_threshold int := 3;
  plat_threshold int := 6;
  window_months  int := 12;
  min_value_chf  numeric := 25;
  v        int;
  prev     text;
  computed text;
begin
  if uid is null then
    return 'base';
  end if;
  if uid <> auth.uid() and coalesce(auth.role(), '') <> 'service_role' then
    return 'base';
  end if;

  select count(*) into v
  from public.bookings b
  where b.user_id = uid
    and b.status = 'completed'
    and coalesce(b.refunded_amount, 0) <= 0
    and (case when coalesce(b.paid_amount, 0) > 0 then b.paid_amount / 100.0
              else coalesce(b.price_paid, b.estimated_price, 0) end) >= min_value_chf
    and b.starts_at >= now() - make_interval(months => window_months);

  computed := case
    when v >= plat_threshold then 'platinum'
    when v >= gold_threshold then 'gold'
    else 'base' end;

  select tier into prev from public.loyalty_status where user_id = uid;
  if prev = 'platinum' and computed = 'base' then
    return 'gold';
  end if;

  return computed;
end;
$function$;

CREATE OR REPLACE FUNCTION public.recompute_loyalty_status()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $func$
declare
  gold_threshold int := 3;
  plat_threshold int := 6;
  window_months  int := 12;
  min_value_chf  numeric := 25;
  affected int;
begin
  with q as (
    select b.user_id,
           count(*) filter (
             where b.status = 'completed'
               and coalesce(b.refunded_amount, 0) <= 0
               and (case when coalesce(b.paid_amount, 0) > 0 then b.paid_amount / 100.0
                         else coalesce(b.price_paid, b.estimated_price, 0) end) >= min_value_chf
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