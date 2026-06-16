-- ═══════════════════════════════════════════════
-- 007 – Per-Stylist Availability
-- • stylist_availability table (weekly hours + exceptions)
-- • RLS: public SELECT, owner-only INSERT/UPDATE/DELETE
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS stylist_availability (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  stylist_id   UUID        NOT NULL REFERENCES store_staff(id) ON DELETE CASCADE,
  -- For weekly recurring schedule: date is NULL, day_of_week 0=Mon … 6=Sun
  -- For date-specific exceptions: date is set, day_of_week is NULL
  date         DATE,
  day_of_week  SMALLINT    CHECK (day_of_week BETWEEN 0 AND 6),
  start_time   TIME,
  end_time     TIME,
  is_available BOOLEAN     NOT NULL DEFAULT true,
  booked       BOOLEAN     NOT NULL DEFAULT false,
  exceptions   JSONB       DEFAULT '[]',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Useful indexes
CREATE INDEX IF NOT EXISTS idx_stylavail_stylist ON stylist_availability(stylist_id);
CREATE INDEX IF NOT EXISTS idx_stylavail_date    ON stylist_availability(stylist_id, date);

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE stylist_availability ENABLE ROW LEVEL SECURITY;

-- Anyone may read availability (needed for the booking flow)
CREATE POLICY "Public read stylist_availability"
  ON stylist_availability FOR SELECT USING (true);

-- Only the salon owner who owns the stylist may insert/update/delete.
-- Chain: stylist_availability.stylist_id → store_staff.id
--        store_staff.store_id (text comparison) → salons.id → salons.owner_id = auth.uid()
CREATE POLICY "Owner insert stylist_availability"
  ON stylist_availability FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1
      FROM store_staff ss
      JOIN salons sa ON sa.id::text = ss.store_id::text
      WHERE ss.id = stylist_id
        AND sa.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owner update stylist_availability"
  ON stylist_availability FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1
      FROM store_staff ss
      JOIN salons sa ON sa.id::text = ss.store_id::text
      WHERE ss.id = stylist_id
        AND sa.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owner delete stylist_availability"
  ON stylist_availability FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1
      FROM store_staff ss
      JOIN salons sa ON sa.id::text = ss.store_id::text
      WHERE ss.id = stylist_id
        AND sa.owner_id = auth.uid()
    )
  );
