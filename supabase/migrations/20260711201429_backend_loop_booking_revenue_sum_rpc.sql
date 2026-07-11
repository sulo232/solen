-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new (npm run exists booking_revenue = 0 matches); owner-approved micro-item
create or replace function public.booking_revenue_sum(p_salon_id uuid, p_since timestamptz)
returns numeric language sql stable as $$
  select coalesce(sum(coalesce(price_paid, 0)), 0)
  from public.bookings
  where salon_id = p_salon_id
    and status = 'completed'
    and starts_at >= p_since
$$;
revoke execute on function public.booking_revenue_sum(uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.booking_revenue_sum(uuid, timestamptz) to service_role;
