-- Atomic queue re-sequence: renumber a salon's remaining waiting entries (1..N by current
-- order) in ONE statement, instead of an N-update loop in app code (which was non-atomic
-- and racy when two visits completed concurrently). Called after complete/no_show/cancel.
CREATE OR REPLACE FUNCTION resequence_walkin_queue(p_salon_id uuid)
RETURNS void
LANGUAGE sql
AS $$
  WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY position, joined_at) AS rn
    FROM barber_walkin_queue
    WHERE salon_id = p_salon_id AND status = 'waiting'
  )
  UPDATE barber_walkin_queue q
  SET position = ranked.rn
  FROM ranked
  WHERE q.id = ranked.id AND q.position IS DISTINCT FROM ranked.rn;
$$;
