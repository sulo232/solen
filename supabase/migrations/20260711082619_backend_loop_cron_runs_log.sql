-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
-- Ring 1 (backend improvement loop): cron run log for failure alerting + daily digest.
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