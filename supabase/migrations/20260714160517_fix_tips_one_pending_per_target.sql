-- applied live via MCP apply_migration 2026-07-14; file backfilled for fresh-env reproducibility.
-- exists-check: net-new partial unique indexes. DB backstop for the tip double-charge race:
-- at most one pending tip per booking / per walk-in. A concurrent second pending insert now
-- fails with 23505, which the tips route catches and routes into the reuse-existing-open-tip
-- path (single PaymentIntent). Verified no existing duplicate pending rows before creation.
CREATE UNIQUE INDEX IF NOT EXISTS tips_one_pending_per_booking
  ON public.tips (booking_id)
  WHERE status = 'pending' AND booking_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS tips_one_pending_per_walkin
  ON public.tips (walkin_queue_id)
  WHERE status = 'pending' AND walkin_queue_id IS NOT NULL;
