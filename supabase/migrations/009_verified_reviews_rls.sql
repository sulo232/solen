-- Verified reviews: only allow reviews from users who completed a booking
-- Run via Supabase SQL Editor

-- Add booking verification check for reviews
-- Note: This is a soft enforcement. The insert policy checks if the user
-- has at least one confirmed booking at the salon.

-- Drop existing permissive insert policy if it exists
DROP POLICY IF EXISTS "Users can insert reviews" ON reviews;

-- Create new policy requiring a confirmed booking
CREATE POLICY "Users can insert reviews after booking"
  ON reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      -- Allow if user has a confirmed booking at this salon
      EXISTS (
        SELECT 1 FROM bookings
        WHERE bookings.user_id = auth.uid()
        AND bookings.salon_id = reviews.salon_id
        AND bookings.status IN ('confirmed', 'completed')
      )
      -- Or allow Google-sourced reviews (synced externally)
      OR source = 'google'
    )
  );

-- Allow salon owners to reply to reviews
DROP POLICY IF EXISTS "Salon owners can update reviews" ON reviews;

CREATE POLICY "Salon owners can reply to reviews"
  ON reviews FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = reviews.salon_id
      AND stores.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = reviews.salon_id
      AND stores.user_id = auth.uid()
    )
  );

-- Service role bypass
CREATE POLICY "Service role full access on reviews"
  ON reviews FOR ALL
  USING (auth.role() = 'service_role');
