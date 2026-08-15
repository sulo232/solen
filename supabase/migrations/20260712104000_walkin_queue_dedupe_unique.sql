-- exists-check: net-new vs 073_barber_foundation.sql (creates barber_walkin_queue),
-- 20260602120000_walkin_foundations.sql (adds the position uniqueness index) and
-- 20260531_walkin_ticket_code.sql (adds the ticket_code uniqueness index); none of
-- those add a customer_id/customer_phone uniqueness index, which is this file's delta.
--
-- 20260712104000_walkin_queue_dedupe_unique
--
-- lib/walkin/join.ts already runs an application-level dedupe SELECT before insert
-- (a customer/phone with an active waiting/in_chair ticket gets that ticket back
-- instead of a new one), but that check-then-insert is not atomic: two concurrent
-- join requests from the same person can both pass the SELECT and both INSERT,
-- minting two free tickets for one person. Add the missing DB-level uniqueness so
-- the second concurrent insert fails with 23505 instead of silently succeeding.
-- NULL customer_id / customer_phone never collide (partial index), so anonymous
-- guests with no phone are unaffected (they stay on the IP rate-limit fallback).

CREATE UNIQUE INDEX IF NOT EXISTS uq_walkin_queue_salon_customer_active
  ON public.barber_walkin_queue (salon_id, customer_id)
  WHERE status IN ('waiting', 'in_chair') AND customer_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_walkin_queue_salon_phone_active
  ON public.barber_walkin_queue (salon_id, customer_phone)
  WHERE status IN ('waiting', 'in_chair') AND customer_phone IS NOT NULL;
