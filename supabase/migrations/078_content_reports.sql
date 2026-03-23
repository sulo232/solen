CREATE TABLE IF NOT EXISTS public.content_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  target_type text NOT NULL CHECK (target_type IN ('salon', 'review', 'user')),
  target_id uuid NOT NULL,
  reason text NOT NULL CHECK (reason IN (
    'inappropriate', 'spam', 'fake', 'ip_violation', 'other'
  )),
  details text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'action_taken', 'dismissed')),
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content_reports_insert_auth" ON public.content_reports
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "content_reports_admin_all" ON public.content_reports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
