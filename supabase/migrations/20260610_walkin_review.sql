-- Walk-in guest reviews (token-gated POST /api/walkin/review).
-- A walk-in visit has NO bookings row (barber_walkin_queue is separate), so a walk-in
-- review can't carry a booking_id. Two changes make that valid + safe:
--   1) booking_id becomes nullable (it was NOT NULL UNIQUE in 014). Postgres treats NULLs
--      as distinct in a UNIQUE index, so many walk-in reviews (all booking_id NULL) coexist.
--   2) add walkin_queue_id to link the review to its visit + dedupe one review per visit
--      (a partial UNIQUE index), so the endpoint can UPSERT instead of risking duplicates.
-- Idempotent: safe to re-run; a no-op if booking_id is already nullable / column exists.

ALTER TABLE public.reviews ALTER COLUMN booking_id DROP NOT NULL;

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS walkin_queue_id uuid
  REFERENCES public.barber_walkin_queue(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS reviews_walkin_queue_id_unique
  ON public.reviews (walkin_queue_id)
  WHERE walkin_queue_id IS NOT NULL;
