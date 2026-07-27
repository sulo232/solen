-- exists-check: net-new. `npm run exists cron_lock` returned 0 matches (2026-07-27).
-- cron_runs (lib/cron-run.ts) is the closest neighbor but is observability-only
-- (a log of completed runs), not an overlap guard; see data-money-08.
-- ============================================================
-- 20260727120000_cron_locks
-- data-money-08: none of the 26 cron routes have an overlap guard today. Each
-- cron's own per-row idempotency filter (status=confirmed, fee_charge_status
-- IS NULL, etc.) protects against re-processing the SAME row twice, but says
-- nothing about two overlapping runs of the SAME cron interleaving writes (a
-- manual workflow_dispatch colliding with a scheduled tick, or a GH Actions
-- client timeout that does not actually cancel the underlying Netlify
-- function). This table backs a simple atomic claim: INSERT ... ON CONFLICT
-- DO NOTHING on a unique `name` column is a single-statement CAS enforced by
-- Postgres itself, which survives PostgREST's connection-pooled architecture
-- (a true session-scoped pg_try_advisory_lock does not, since a cron run
-- spans many separate HTTP-request-shaped Postgres transactions that are not
-- guaranteed to reuse the same pooled connection).
--
-- `expires_at` is a TTL safety valve: if a cron run crashes without releasing
-- its own lock (a hard process kill, not caught by the wrapper's try/finally),
-- the lock self-expires instead of permanently wedging that cron. Set
-- generously (15 min) relative to Solen's cron cadence (nothing runs more
-- often than every few minutes; see .github/workflows/cron-jobs.yml).
--
-- Additive + idempotent. Consumed by lib/cron-run.ts's withCronRun wrapper
-- (acquire at start, release in a finally, fail-open if this table is not
-- yet live so existing crons never break because of this migration alone).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.cron_locks (
  name text PRIMARY KEY,
  acquired_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

COMMENT ON TABLE public.cron_locks IS
  'Overlap guard for app/api/cron/* routes (data-money-08). One row per cron name while a run is in flight; released on completion, self-expires via expires_at if a run crashes without releasing.';

-- RLS: service-role only (lib/cron-run.ts uses createAdminSupabaseClient, same
-- pattern as cron_runs). No public policies, matching cron_runs' own posture.
ALTER TABLE public.cron_locks ENABLE ROW LEVEL SECURITY;
