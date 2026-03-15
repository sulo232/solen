-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: create reviews table + trigger to update salon rating
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.reviews (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id        uuid        NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  user_id         uuid        NOT NULL REFERENCES public.profiles(id),
  booking_id      uuid        NOT NULL UNIQUE REFERENCES public.bookings(id),
  staff_member_id uuid        REFERENCES public.staff_members(id) ON DELETE SET NULL,
  rating          smallint    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment         text        CHECK (char_length(comment) <= 500),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reviews_salon ON public.reviews (salon_id, created_at DESC);

-- ── Trigger: recalculate salon average_rating + review_count ─────────────────
CREATE OR REPLACE FUNCTION public.update_salon_rating()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.salons
  SET
    average_rating = (
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM public.reviews
      WHERE salon_id = NEW.salon_id
    ),
    review_count = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE salon_id = NEW.salon_id
    )
  WHERE id = NEW.salon_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER reviews_update_salon_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_salon_rating();

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_public_select"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "reviews_user_insert"
  ON public.reviews FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    -- Validate the booking belongs to this user and is completed
    AND EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id
        AND b.user_id = auth.uid()
        AND b.status = 'completed'
    )
  );
