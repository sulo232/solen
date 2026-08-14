-- exists-check: COMMENT ON COLUMN only, on the LIVE bookings table. Additive, changes no data/DDL.
--
-- #17 (live re-audit 2026-07-17). bookings mixes two money-unit conventions with no in-schema
-- signal, and two columns are an active trap: numeric-typed but storing RAPPEN by code contract.
-- The rule (see _rules/DB_SCHEMA.md section 8): an INTEGER money column holds Rappen (1200 = CHF
-- 12.00), a numeric(x,2) holds CHF, EXCEPT tier_discount_amount and platform_fee which are numeric
-- but the only writers store Rappen into them (webhook / booking-pay-intent). Comparing a Rappen
-- column with a CHF column without converting is a silent 100x error. These comments make the unit
-- readable at the column so the next person does not have to reverse-engineer it from the writer.
comment on column public.bookings.paid_amount      is 'RAPPEN (integer). 1200 = CHF 12.00.';
comment on column public.bookings.refunded_amount  is 'RAPPEN (integer). Cumulative refunded.';
comment on column public.bookings.net_amount       is 'RAPPEN (integer).';
comment on column public.bookings.vat_amount       is 'RAPPEN (integer).';
comment on column public.bookings.fee_charged_amount is 'RAPPEN (integer). Cancellation/no-show fee actually charged.';
comment on column public.bookings.deposit_amount   is 'CHF (numeric 10,2).';
comment on column public.bookings.estimated_price  is 'CHF (numeric 10,2).';
comment on column public.bookings.final_price      is 'CHF (numeric 10,2).';
comment on column public.bookings.price_paid       is 'CHF (numeric 8,2).';
comment on column public.bookings.tier_discount_amount is 'TRAP: numeric type but RAPPEN by code contract (booking-pay-intent writes actualDiscountRappen). Do NOT treat as CHF.';
comment on column public.bookings.platform_fee     is 'TRAP: numeric(10,2) type but RAPPEN by code contract (webhook + pre-charge write Rappen). Do NOT treat as CHF.';
comment on column public.bookings.vat_rate         is 'RATE not money: e.g. 8.1 means 8.1 percent.';
