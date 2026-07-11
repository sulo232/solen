-- exists-check: net-new vs 016_booking_cron_columns.sql because that adds cron bookkeeping COLUMNS on bookings; no table logs cron RUNS (npm run exists cron_runs = 0 matches)
-- Ring 1 (backend improvement loop): cron run log for failure alerting + daily digest.
-- Applied live via MCP apply_migration as backend_loop_cron_runs_log on 2026-07-11.
-- Additive + idempotent. Service-role writes only (RLS enabled, no policies).
create table if not exists public.cron_runs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  ran_at timestamptz not null default now(),
  ok boolean not null,
  processed integer,
  duration_ms integer,
  errors jsonb
);
alter table public.cron_runs enable row level security;
create index if not exists idx_cron_runs_name_ran_at on public.cron_runs (name, ran_at desc);
create index if not exists idx_cron_runs_ran_at on public.cron_runs (ran_at desc);
