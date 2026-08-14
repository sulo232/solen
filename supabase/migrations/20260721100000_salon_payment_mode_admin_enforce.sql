-- exists-check: net-new columns (npm run exists payment_mode_enforced / payment_mode_admin: 0 hits;
-- live snapshot has payment_mode + accepts_online_payment but NO enforcement columns). Extends the
-- EXISTING salons.payment_mode system (047 drift migration, values at_salon/deposit/prepay), does
-- not duplicate it.
--
-- Owner model (2026-07-20): the salon chooses how appointments are paid (payment_mode stays the
-- salon's own choice), the ADMIN can also set a mode, and when the admin ENFORCES, the admin's
-- choice wins and the salon's own control locks. Effective mode = payment_mode_enforced
-- ? coalesce(payment_mode_admin, payment_mode) : payment_mode (helper lib/bookings/payment-mode.ts).
-- Additive + idempotent; apply_migration only, never db push/reset.
alter table public.salons
  add column if not exists payment_mode_admin text
    check (payment_mode_admin in ('at_salon', 'deposit', 'prepay'));

alter table public.salons
  add column if not exists payment_mode_enforced boolean not null default false;

comment on column public.salons.payment_mode_admin is
  'Admin-selected payment mode; wins over payment_mode when payment_mode_enforced is true.';
comment on column public.salons.payment_mode_enforced is
  'When true the admin''s payment_mode_admin is enforced and the salon''s own payment_mode control is locked.';
