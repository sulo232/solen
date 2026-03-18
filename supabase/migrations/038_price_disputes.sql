-- Migration 038: Price disputes (post-visit upcharge)
-- Salon can request price adjustment after appointment, customer can dispute

CREATE TABLE IF NOT EXISTS public.price_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  original_amount decimal(10,2) NOT NULL,
  requested_amount decimal(10,2) NOT NULL CHECK (requested_amount > 0),
  salon_reason text NOT NULL CHECK (char_length(salon_reason) <= 500),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'auto_approved', 'customer_approved', 'disputed', 'resolved')),
  customer_response text,
  admin_decision text CHECK (admin_decision IS NULL OR admin_decision IN ('approved', 'rejected', 'compromised')),
  admin_amount decimal(10,2),
  resolved_by uuid REFERENCES auth.users(id),
  resolved_at timestamptz,
  auto_approve_at timestamptz DEFAULT now() + interval '48 hours',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT one_dispute_per_booking UNIQUE (booking_id),
  CONSTRAINT max_upcharge CHECK (requested_amount <= original_amount * 1.5)
);

ALTER TABLE public.price_disputes ENABLE ROW LEVEL SECURITY;

-- Customers can view disputes for their bookings
CREATE POLICY "disputes_select_customer" ON public.price_disputes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings b WHERE b.id = price_disputes.booking_id AND b.user_id = auth.uid()
    )
  );

-- Salon owners can view disputes for their bookings
CREATE POLICY "disputes_select_salon" ON public.price_disputes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.salons s ON s.id = b.salon_id
      WHERE b.id = price_disputes.booking_id AND s.owner_id = auth.uid()
    )
  );

-- Salon owners can create disputes for their bookings
CREATE POLICY "disputes_insert_salon" ON public.price_disputes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.salons s ON s.id = b.salon_id
      WHERE b.id = price_disputes.booking_id AND s.owner_id = auth.uid()
    )
  );

-- Customers can update dispute status (approve/dispute)
CREATE POLICY "disputes_update_customer" ON public.price_disputes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.bookings b WHERE b.id = price_disputes.booking_id AND b.user_id = auth.uid()
    )
  );

-- Admins can view and update all disputes
CREATE POLICY "disputes_admin_all" ON public.price_disputes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
