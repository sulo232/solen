-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: create recurring_booking_rules table
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.recurring_booking_rules (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid        NOT NULL REFERENCES public.profiles(id),
  salon_id             uuid        NOT NULL REFERENCES public.salons(id),
  service_id           uuid        NOT NULL REFERENCES public.services(id),
  staff_member_id      uuid        REFERENCES public.staff_members(id) ON DELETE SET NULL,
  frequency            text        NOT NULL CHECK (frequency IN ('weekly','biweekly','monthly','custom')),
  custom_interval_days integer     CHECK (custom_interval_days > 0),
  preferred_day        text        CHECK (preferred_day IN ('mon','tue','wed','thu','fri','sat','sun')),
  preferred_time       time,
  next_booking_date    date        NOT NULL,
  is_active            boolean     NOT NULL DEFAULT true,
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_recurring_active
  ON public.recurring_booking_rules (next_booking_date)
  WHERE is_active = true;

ALTER TABLE public.recurring_booking_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recurring_user_manage"
  ON public.recurring_booking_rules FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
