-- Phase 8A: Fix review submission RLS policy

-- 1. Drop the old permissive policy that might be lingering/conflicting
DROP POLICY IF EXISTS "Public can insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can insert reviews after booking" ON public.reviews;

-- 2. Create the correct restricted, authenticated policy for inserting reviews
CREATE POLICY "Users can insert reviews after booking"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      -- They must have a confirmed or completed booking for that salon
      EXISTS (
        SELECT 1 FROM public.bookings b
        WHERE b.user_id = auth.uid()
        AND b.salon_id = reviews.salon_id
        AND b.status IN ('confirmed', 'completed')
      )
      -- Or the review was synced from Google
      OR source = 'google'
    )
  );
