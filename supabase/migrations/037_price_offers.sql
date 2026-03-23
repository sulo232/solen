-- Migration 037: Price offers in chat
-- Salon owners can send price offers to customers during conversations

CREATE TABLE IF NOT EXISTS public.price_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description text NOT NULL CHECK (char_length(description) <= 500),
  amount_chf decimal(10,2) NOT NULL CHECK (amount_chf > 0),
  photo_url text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  stripe_payment_intent_id text,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT now() + interval '48 hours'
);

ALTER TABLE public.price_offers ENABLE ROW LEVEL SECURITY;

-- Participants can view price offers in their conversations
CREATE POLICY "price_offers_select_participant" ON public.price_offers
  FOR SELECT USING (
    auth.uid() = customer_id OR
    EXISTS (
      SELECT 1 FROM public.salons s WHERE s.id = price_offers.salon_id AND s.owner_id = auth.uid()
    )
  );

-- Salon owners can create price offers
CREATE POLICY "price_offers_insert_salon" ON public.price_offers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.salons s WHERE s.id = price_offers.salon_id AND s.owner_id = auth.uid()
    )
  );

-- Salon owners and customers can update offer status
CREATE POLICY "price_offers_update_participant" ON public.price_offers
  FOR UPDATE USING (
    auth.uid() = customer_id OR
    EXISTS (
      SELECT 1 FROM public.salons s WHERE s.id = price_offers.salon_id AND s.owner_id = auth.uid()
    )
  );

-- Add 'price_offer' to message_type CHECK constraint
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_message_type_check;
ALTER TABLE public.messages ADD CONSTRAINT messages_message_type_check
  CHECK (message_type IN ('text', 'image', 'booking_link', 'price_offer'));
