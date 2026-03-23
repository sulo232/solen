-- Phase 7.2: Review update/delete RLS policies

-- Allow users to edit their review within 48 hours of creation
CREATE POLICY "reviews_update_own_48h" ON public.reviews
  FOR UPDATE USING (
    auth.uid() = user_id AND created_at > now() - interval '48 hours'
  );

-- Allow users to delete their own reviews
CREATE POLICY "reviews_delete_own" ON public.reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Allow admins to delete any review (moderation)
CREATE POLICY "reviews_delete_admin" ON public.reviews
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
