-- Phase 8: GDPR / nDSG compliance

-- Allow reviews to persist after user deletion (anonymized, not deleted)
ALTER TABLE public.reviews ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Deletion request log (for compliance auditing)
CREATE TABLE public.data_deletion_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  requested_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  tables_cleared text[] DEFAULT '{}'
);

ALTER TABLE public.data_deletion_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deletion_log_admin_only" ON public.data_deletion_log
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
