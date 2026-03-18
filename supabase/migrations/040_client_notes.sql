-- Migration 040: Client notes
-- Salon staff can add private notes on clients

CREATE TABLE IF NOT EXISTS public.client_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note text NOT NULL CHECK (char_length(note) <= 1000),
  note_type text DEFAULT 'permanent' CHECK (note_type IN ('booking', 'permanent')),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.client_notes ENABLE ROW LEVEL SECURITY;

-- Salon owners can manage notes for their salon
CREATE POLICY "client_notes_manage_salon" ON public.client_notes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.salons s WHERE s.id = client_notes.salon_id AND s.owner_id = auth.uid())
  );

-- Customers can see their own booking notes (but NOT permanent/staff notes)
CREATE POLICY "client_notes_select_own_booking" ON public.client_notes
  FOR SELECT USING (customer_id = auth.uid() AND note_type = 'booking');

-- Customers can create booking notes
CREATE POLICY "client_notes_insert_booking" ON public.client_notes
  FOR INSERT WITH CHECK (customer_id = auth.uid() AND note_type = 'booking');
