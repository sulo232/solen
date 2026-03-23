-- Migration 039: Loyalty stamp cards
-- Salon opt-in stamp card system

CREATE TABLE IF NOT EXISTS public.loyalty_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  stamps_needed int NOT NULL DEFAULT 10 CHECK (stamps_needed >= 3 AND stamps_needed <= 20),
  reward_text text NOT NULL DEFAULT 'Gratisbehandlung',
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(salon_id)
);

CREATE TABLE IF NOT EXISTS public.loyalty_stamps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loyalty_card_id uuid NOT NULL REFERENCES public.loyalty_cards(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  stamped_at timestamptz DEFAULT now()
);

ALTER TABLE public.loyalty_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_stamps ENABLE ROW LEVEL SECURITY;

-- Public can view active loyalty cards
CREATE POLICY "loyalty_cards_select_public" ON public.loyalty_cards
  FOR SELECT USING (is_active = true);

-- Salon owners can manage their loyalty cards
CREATE POLICY "loyalty_cards_manage_owner" ON public.loyalty_cards
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.salons s WHERE s.id = loyalty_cards.salon_id AND s.owner_id = auth.uid())
  );

-- Customers can view their own stamps
CREATE POLICY "loyalty_stamps_select_own" ON public.loyalty_stamps
  FOR SELECT USING (customer_id = auth.uid());

-- Salon owners can view stamps for their cards
CREATE POLICY "loyalty_stamps_select_salon" ON public.loyalty_stamps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.loyalty_cards lc
      JOIN public.salons s ON s.id = lc.salon_id
      WHERE lc.id = loyalty_stamps.loyalty_card_id AND s.owner_id = auth.uid()
    )
  );

-- System inserts stamps (via service role in API routes)
CREATE POLICY "loyalty_stamps_insert_system" ON public.loyalty_stamps
  FOR INSERT WITH CHECK (true);
