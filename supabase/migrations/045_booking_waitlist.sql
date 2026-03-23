-- Migration 045: Booking Waitlist
-- Phase 1.2 of roadmap-treatwell-v5

CREATE TABLE IF NOT EXISTS public.booking_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.services(id),
  preferred_date date,
  status text DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'booked', 'expired')),
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_booking_waitlist_user ON public.booking_waitlist(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_waitlist_salon ON public.booking_waitlist(salon_id);
CREATE INDEX IF NOT EXISTS idx_booking_waitlist_status ON public.booking_waitlist(status);

-- RLS
ALTER TABLE public.booking_waitlist ENABLE ROW LEVEL SECURITY;

-- Users can see their own waitlist entries
CREATE POLICY "waitlist_select_own" ON public.booking_waitlist
  FOR SELECT USING (auth.uid() = user_id);

-- Users can add themselves to waitlist
CREATE POLICY "waitlist_insert_own" ON public.booking_waitlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can remove their own entries
CREATE POLICY "waitlist_delete_own" ON public.booking_waitlist
  FOR DELETE USING (auth.uid() = user_id);

-- Salon owners can see waitlist for their salon
CREATE POLICY "waitlist_select_salon_owner" ON public.booking_waitlist
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.salons
      WHERE salons.id = booking_waitlist.salon_id
      AND salons.owner_id = auth.uid()
    )
  );
