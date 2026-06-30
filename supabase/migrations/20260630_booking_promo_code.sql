-- exists-check: net-new. `npm run exists "booking promo"` -> 0 matches; `npm run exists promo_code`
-- confirmed the bookings table has NO promo_code column today (live snapshot 2026-06-30); the only
-- promo_code DB column is voucher_purchases.promo_code_id (unrelated). So this additive column is new.
--
-- Promo-code charge fix (2026-06-30): the booking flow collected a promo code and the
-- /api/promo/validate endpoint told the customer "you save CHF X", but the discount was
-- never applied to the Stripe charge (booking-pay-intent ignored promos entirely). To apply
-- it server-side, the code that drove the discount must be PERSISTED on the booking so:
--   1. booking-pay-intent (which only receives booking_id) can re-validate + subtract it, and
--   2. the webhook (payment_intent.succeeded) can increment promo_codes.current_uses once paid.
-- Additive + idempotent (project rule: never db push/reset; ADD COLUMN IF NOT EXISTS only).
alter table public.bookings add column if not exists promo_code text;
comment on column public.bookings.promo_code is
  'Uppercased promo code the customer applied at booking. Re-validated server-side in /api/stripe/booking-pay-intent before any discount; promo_codes.current_uses is incremented once (idempotently) by the Stripe webhook on payment success.';

-- Atomic promo-redemption counter. The webhook (payment_intent.succeeded) calls this ONCE per
-- paid booking (the processed_webhook_events claim makes the whole event run at most once). A
-- read-then-write in the route would lose a count under concurrent redemptions of the SAME code
-- from different bookings; this does the increment in a single statement so concurrent paid
-- redemptions are counted correctly. Respects max_uses: it never increments past the cap (returns
-- the unchanged current_uses in that case). Case-insensitive on the code (codes are stored upper).
-- SECURITY DEFINER so the service-role webhook can run it; SET search_path pins the schema.
create or replace function public.increment_promo_use(p_code text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uses integer;
begin
  update public.promo_codes
     set current_uses = coalesce(current_uses, 0) + 1
   where upper(code) = upper(p_code)
     and (max_uses is null or coalesce(current_uses, 0) < max_uses)
  returning current_uses into v_uses;
  return v_uses; -- null when no row matched (unknown code or already at cap)
end;
$$;
