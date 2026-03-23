-- Migration 075: Customer-initiated booking dispute system
-- T&S §13: "solen.ch provides a channel for reporting issues"
-- SEPARATE from price_disputes (salon upcharges). This is customer complaints.

CREATE TABLE IF NOT EXISTS public.booking_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  issue_type text NOT NULL CHECK (issue_type IN ('quality', 'no_show_by_salon', 'wrong_service', 'overcharge', 'other')),
  description text NOT NULL CHECK (char_length(description) >= 20 AND char_length(description) <= 1000),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved', 'escalated')),
  salon_response text CHECK (salon_response IS NULL OR char_length(salon_response) <= 1000),
  salon_responded_at timestamptz,
  resolution text CHECK (resolution IS NULL OR char_length(resolution) <= 500),
  resolved_by uuid REFERENCES auth.users(id),
  resolved_at timestamptz,
  mediation_started_at timestamptz,
  mediation_deadline_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT one_complaint_per_booking UNIQUE (booking_id)
);

ALTER TABLE public.booking_disputes ENABLE ROW LEVEL SECURITY;

-- Customers can view and create disputes for their own bookings
CREATE POLICY "booking_disputes_select_reporter" ON public.booking_disputes
  FOR SELECT USING (reporter_id = auth.uid());

CREATE POLICY "booking_disputes_insert_reporter" ON public.booking_disputes
  FOR INSERT WITH CHECK (
    reporter_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_disputes.booking_id
      AND b.user_id = auth.uid()
      AND b.status = 'completed'
    )
  );

-- Salon owners can view and respond to disputes for their bookings
CREATE POLICY "booking_disputes_select_salon" ON public.booking_disputes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.salons s ON s.id = b.salon_id
      WHERE b.id = booking_disputes.booking_id AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY "booking_disputes_update_salon" ON public.booking_disputes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.salons s ON s.id = b.salon_id
      WHERE b.id = booking_disputes.booking_id AND s.owner_id = auth.uid()
    )
  );

-- Admins can do everything
CREATE POLICY "booking_disputes_admin_all" ON public.booking_disputes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_booking_disputes_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_disputes_updated_at
  BEFORE UPDATE ON public.booking_disputes
  FOR EACH ROW EXECUTE FUNCTION update_booking_disputes_updated_at();

-- Feature flag for kill switch
INSERT INTO public.feature_flags (key, enabled, description, updated_by)
VALUES ('dispute_reporting', true, 'Customer-initiated dispute reporting system', 'migration')
ON CONFLICT (key) DO NOTHING;
