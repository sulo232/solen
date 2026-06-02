-- Remove the [SEED] refund test data (V3-D421 dashboard testing, salon dda02178 "[TEST] Studio Goldschnitt").
-- Run top-to-bottom (FK order). Idempotent: safe to run if already removed.
delete from booking_disputes where booking_id in (select id from bookings where reference_code = 'SOLSEED1');
delete from bookings where reference_code = 'SOLSEED1';
delete from availability_slots where service_id in (
  select id from services where salon_id = 'dda02178-ab49-4bde-a716-b0dd00aec438' and name_de = '[SEED] Damen-Haarschnitt'
);
delete from services where salon_id = 'dda02178-ab49-4bde-a716-b0dd00aec438' and name_de = '[SEED] Damen-Haarschnitt';
