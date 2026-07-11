-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new schedule of the EXISTING purge_past_available_slots fn (owner approved "4 do")
select cron.unschedule('purge-past-available-slots')
where exists (select 1 from cron.job where jobname = 'purge-past-available-slots');
select cron.schedule(
  'purge-past-available-slots',
  '15 4 * * 0',
  $$select public.purge_past_available_slots(7, 100000)$$
);
