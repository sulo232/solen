-- Backend loop 2026-08-23, storage and scale pass. APPLIED LIVE via apply_migration
-- (name: backend_loop_fk_indexes_money_tables). This file is the replayable record, written
-- because the 2026-07-17 audit's item 9 found a live RLS change with no migration file at all,
-- which a fresh environment or a restore would silently not reproduce.
--
-- exists-check: `npm run exists credit_redemptions` returns the table itself and nothing else;
-- package_purchases, voucher_redemptions and salon_of_month_winners are likewise real base
-- tables in _inventory/_db-snapshot.json. This EXTENDS them with indexes, it creates no table.
-- No REMOVED.md entry covers any of them, and grep over supabase/migrations finds zero hits for
-- any of the seven index names below, so none of these already exists.
--
-- WHAT AND WHY. Seven foreign-key columns on money tables had no covering index, so Postgres
-- scanned the whole child table on every parent delete and on every join through that key.
-- Measured before applying, via pg_constraint joined to pg_index rather than read off the
-- linter: 7 of 260 foreign-key columns in the public schema were uncovered. After: 0 of 260.
--
-- These seven were missed because they sit on tables created AFTER the 2026-06-24 pass that
-- added 142 such indexes. Not a regression, a gap that opened behind a completed sweep.
--
-- Additive and idempotent. No drops, no data change.

create index if not exists credit_redemptions_booking_id_idx
  on public.credit_redemptions (booking_id);
create index if not exists credit_redemptions_user_id_idx
  on public.credit_redemptions (user_id);

create index if not exists package_purchases_salon_id_idx
  on public.package_purchases (salon_id);
create index if not exists package_purchases_user_id_idx
  on public.package_purchases (user_id);

create index if not exists voucher_redemptions_booking_id_idx
  on public.voucher_redemptions (booking_id);
create index if not exists voucher_redemptions_user_id_idx
  on public.voucher_redemptions (user_id);

create index if not exists salon_of_month_winners_selected_by_idx
  on public.salon_of_month_winners (selected_by);
