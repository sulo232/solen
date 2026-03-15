-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: create bookings table + add FK to availability_slots
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.bookings (
  id                  uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid         NOT NULL REFERENCES public.profiles(id),
  salon_id            uuid         NOT NULL REFERENCES public.salons(id),
  service_id          uuid         NOT NULL REFERENCES public.services(id),
  staff_member_id     uuid         REFERENCES public.staff_members(id) ON DELETE SET NULL,
  slot_id             uuid         NOT NULL REFERENCES public.availability_slots(id),
  starts_at           timestamptz  NOT NULL,
  ends_at             timestamptz  NOT NULL,
  price_paid          numeric(8,2) NOT NULL CHECK (price_paid >= 0),
  status              text         NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','cancelled','completed','no_show')),
  is_first_visit      boolean      NOT NULL,
  cancellation_reason text,
  cancelled_at        timestamptz,
  is_recurring        boolean      NOT NULL DEFAULT false,
  recurring_group_id  uuid,
  created_at          timestamptz  NOT NULL DEFAULT now(),
  updated_at          timestamptz  NOT NULL DEFAULT now()
);

-- ── Back-fill FK on availability_slots ───────────────────────────────────────
ALTER TABLE public.availability_slots
  ADD CONSTRAINT availability_slots_booking_id_fkey
  FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE SET NULL;

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX idx_bookings_user    ON public.bookings (user_id, starts_at DESC);
CREATE INDEX idx_bookings_salon   ON public.bookings (salon_id, starts_at DESC);
CREATE INDEX idx_bookings_status  ON public.bookings (status);
CREATE INDEX idx_bookings_recurring ON public.bookings (recurring_group_id) WHERE recurring_group_id IS NOT NULL;

-- ── updated_at trigger ────────────────────────────────────────────────────────
CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Customers see their own bookings
CREATE POLICY "bookings_user_select"
  ON public.bookings FOR SELECT
  USING (user_id = auth.uid());

-- Salon owners see bookings for their salon
CREATE POLICY "bookings_salon_owner_select"
  ON public.bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.salons s
      WHERE s.id = bookings.salon_id AND s.owner_id = auth.uid()
    )
  );

-- Customers can create bookings
CREATE POLICY "bookings_user_insert"
  ON public.bookings FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Customers can cancel their own bookings
CREATE POLICY "bookings_user_cancel"
  ON public.bookings FOR UPDATE
  USING (user_id = auth.uid() AND status = 'confirmed')
  WITH CHECK (status = 'cancelled');
