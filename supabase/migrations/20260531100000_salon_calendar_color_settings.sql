-- Per-salon operator-calendar color model (#28).
-- Additive + nullable → safe on the drifted DB. `calendar_color_by` drives WHICH
-- dimension colors appointments on the operator calendar; `category_colors` holds
-- optional custom hexes (NULL → the vibrant default palette in the app).
-- Applied remotely 2026-05-31 via Supabase MCP apply_migration (salon_calendar_color_settings).

alter table public.salons
  add column if not exists calendar_color_by text not null default 'category',
  add column if not exists category_colors jsonb;

-- enforce the two supported dimensions (status coloring deferred until check-in tracking exists)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'salons_calendar_color_by_check'
  ) then
    alter table public.salons
      add constraint salons_calendar_color_by_check
      check (calendar_color_by in ('category','staff'));
  end if;
end$$;

comment on column public.salons.calendar_color_by is 'Operator calendar coloring dimension: category (default) | staff. #28 per-salon color model.';
comment on column public.salons.category_colors is 'Optional per-salon category hex map, e.g. {"coiffeur":"#2563EB","barbershop":"#F97316",...}. NULL → app vibrant default palette.';
