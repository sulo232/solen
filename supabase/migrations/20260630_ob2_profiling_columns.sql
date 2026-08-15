-- exists-check: `npm run exists acquisition_source` -> hit only in bookings table (not salons).
-- `npm run exists team_size` -> 0 hits. `npm run exists onboarding_goals` -> 0 hits.
-- OB-2 profiling columns on salons: acquisition_source, team_size, onboarding_goals.
-- Additive + idempotent. Do NOT run via `supabase db push/reset` (CASCADE data loss);
-- apply via apply_migration "ob2_profiling_columns" on the live project.

alter table public.salons
  add column if not exists acquisition_source text,
  add column if not exists team_size text,
  add column if not exists onboarding_goals text[];
