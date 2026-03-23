-- Migration 041: Review replies
-- Salon owners can reply to reviews (public or private)

CREATE TABLE IF NOT EXISTS public.review_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  reply_text text NOT NULL CHECK (char_length(reply_text) <= 500),
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(review_id)
);

ALTER TABLE public.review_replies ENABLE ROW LEVEL SECURITY;

-- Public can view public replies
CREATE POLICY "review_replies_select_public" ON public.review_replies
  FOR SELECT USING (is_public = true);

-- Salon owners can view all replies (including private) for their salon
CREATE POLICY "review_replies_select_salon" ON public.review_replies
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.salons s WHERE s.id = review_replies.salon_id AND s.owner_id = auth.uid())
  );

-- Review authors can view private replies addressed to them
CREATE POLICY "review_replies_select_author" ON public.review_replies
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.reviews r WHERE r.id = review_replies.review_id AND r.user_id = auth.uid())
  );

-- Salon owners can create and update replies
CREATE POLICY "review_replies_manage_salon" ON public.review_replies
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.salons s WHERE s.id = review_replies.salon_id AND s.owner_id = auth.uid())
  );
