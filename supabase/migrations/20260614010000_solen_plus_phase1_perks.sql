-- Solen Plus loyalty Phase 1: member-deal gate + member-discount (commission-waiver) plumbing.
-- Mirror of the live migration applied via apply_migration (name: solen_plus_phase1_perks).
-- ADDITIVE + IDEMPOTENT ONLY. No drops. See _design-system/LOYALTY_STRUCTURE.md §12.
-- Funding = option (c): Solen waives part of its OWN Connect application_fee, capped per salon.

-- 1) members-only deal gate on promo_codes (null = everyone)
alter table public.promo_codes add column if not exists min_tier text;
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'promo_codes_min_tier_chk'
  ) then
    alter table public.promo_codes
      add constraint promo_codes_min_tier_chk
      check (min_tier is null or min_tier in ('gold','platinum')) not valid;
  end if;
end$$;

-- 2) per-tier knob values (so % + use-caps are DATA, not code). PLACEHOLDER values; calibrate.
create table if not exists public.tier_perks (
  tier                        text primary key check (tier in ('base','gold','platinum')),
  discount_pct                numeric not null default 0,      -- 0.05 = 5%
  max_discount_uses_per_window int,                            -- null = unlimited
  cancel_grace_per_month      int not null default 0,
  reschedule_free             boolean not null default false,
  prime_time_early_access     boolean not null default false,
  walkin_priority             boolean not null default false,
  tier_up_gift                boolean not null default false,
  updated_at                  timestamptz not null default now()
);

insert into public.tier_perks
  (tier, discount_pct, max_discount_uses_per_window, cancel_grace_per_month,
   reschedule_free, prime_time_early_access, walkin_priority, tier_up_gift)
values
  ('base',     0.00, 0,    0, false, false, false, false),
  ('gold',     0.05, 2,    1, true,  false, false, false),   -- PLACEHOLDER %/uses
  ('platinum', 0.10, 4,    2, true,  true,  true,  true)     -- PLACEHOLDER %/uses
on conflict (tier) do nothing;

alter table public.tier_perks enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='tier_perks'
      and policyname='tier_perks_read_all'
  ) then
    create policy tier_perks_read_all on public.tier_perks for select using (true);
  end if;
end$$;

-- 3) audit on bookings: what tier + discount was applied at booking time (payout reconciliation + use counting)
alter table public.bookings add column if not exists applied_tier text;
alter table public.bookings add column if not exists tier_discount_amount numeric;

-- 4) per-salon cap on how much commission Solen will waive to fund the member discount
alter table public.salons add column if not exists member_commission_waiver_rate numeric not null default 0.02;

-- 5) ON-READ tier (source of truth for perk gating). Mirrors recompute_loyalty_status() EXACTLY.
--    If you calibrate thresholds, change BOTH this fn AND recompute_loyalty_status() together.
create or replace function public.current_user_tier(uid uuid default auth.uid())
returns text
language plpgsql
security definer
stable
set search_path to 'public'
as $function$
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

  -- Self-only: a logged-in user may only resolve their OWN tier; the service_role
  -- (server/admin client + the recompute path) may resolve any uid. auth.uid() is null
  -- for service_role, so the first term is NULL there and the AND short-circuits to false.
  if uid <> auth.uid() and coalesce(auth.role(), '') <> 'service_role' then
    return 'base';
  end if;

  select count(*) into v
  from public.bookings b
  where b.user_id = uid
    and b.status = 'completed'
    and coalesce(b.refunded_amount, 0) <= 0
    and coalesce(b.final_price, b.price_paid, b.estimated_price, 0) >= min_value_chf
    and b.starts_at >= now() - make_interval(months => window_months);

  computed := case
    when v >= plat_threshold then 'platinum'
    when v >= gold_threshold then 'gold'
    else 'base' end;

  -- gentle soft-drop: a lapsed platinum cushions to gold (same rule as recompute_loyalty_status)
  select tier into prev from public.loyalty_status where user_id = uid;
  if prev = 'platinum' and computed = 'base' then
    return 'gold';
  end if;

  return computed;
end;
$function$;

revoke execute on function public.current_user_tier(uuid) from public, anon;
grant  execute on function public.current_user_tier(uuid) to authenticated, service_role;
