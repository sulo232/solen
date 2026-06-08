-- ============================================================
-- 20260602150000_walkin_ticket_seq
-- Robust walk-in ticket numbering. Replaces the fragile "count today's rows +
-- timezone-offset" scheme (which could drift at DST edges and skip/collide if rows
-- were deleted) with a MONOTONIC per-salon counter incremented ATOMICALLY in the DB.
-- No daily reset, no timezone math — the number is always unique and reliable.
--
-- ticket_code = 'A' + the counter value (zero-padded to 2): A01, A02 … A100, A1000.
-- ============================================================

ALTER TABLE public.salons
  ADD COLUMN IF NOT EXISTS walkin_ticket_seq integer NOT NULL DEFAULT 0;

-- Atomic next-number: UPDATE ... RETURNING is a single statement, so concurrent joins
-- can't get the same number (no read-then-write race). SECURITY DEFINER so the
-- service-role callers (and any future authed path) always get a value.
CREATE OR REPLACE FUNCTION public.next_walkin_ticket_seq(p_salon_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.salons
     SET walkin_ticket_seq = COALESCE(walkin_ticket_seq, 0) + 1
   WHERE id = p_salon_id
  RETURNING walkin_ticket_seq;
$$;
