-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: create availability_slots table + Realtime
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.availability_slots (
  id              uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id        uuid         NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  service_id      uuid         NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  staff_member_id uuid         REFERENCES public.staff_members(id) ON DELETE SET NULL,
  starts_at       timestamptz  NOT NULL,
  ends_at         timestamptz  NOT NULL,
  status          text         NOT NULL DEFAULT 'available' CHECK (status IN ('available','booked','blocked')),
  price_override  numeric(8,2),
  booked_by       uuid         REFERENCES public.profiles(id) ON DELETE SET NULL,
  booking_id      uuid,        -- FK added after bookings table is created
  created_at      timestamptz  NOT NULL DEFAULT now(),
  updated_at      timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT slots_ends_after_starts CHECK (ends_at > starts_at)
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
-- Powers the Last-Minute query (partial index on available slots only)
CREATE INDEX idx_slots_lastminute
  ON public.availability_slots (salon_id, starts_at, status)
  WHERE status = 'available';

CREATE INDEX idx_slots_salon_date
  ON public.availability_slots (salon_id, starts_at)
  WHERE status = 'available';

CREATE INDEX idx_slots_service
  ON public.availability_slots (service_id, starts_at)
  WHERE status = 'available';

-- ── updated_at trigger ────────────────────────────────────────────────────────
CREATE TRIGGER slots_updated_at
  BEFORE UPDATE ON public.availability_slots
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "slots_public_select"
  ON public.availability_slots FOR SELECT
  USING (true);

CREATE POLICY "slots_owner_manage"
  ON public.availability_slots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.salons s
      WHERE s.id = availability_slots.salon_id AND s.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.salons s
      WHERE s.id = availability_slots.salon_id AND s.owner_id = auth.uid()
    )
  );

-- ── Enable Supabase Realtime ───────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.availability_slots;
