CREATE TABLE IF NOT EXISTS public.account_actions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id uuid REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  action_type text NOT NULL CHECK (action_type IN (
    'warning', 'demotion', 'suspension', 'removal', 'reinstatement'
  )),
  reason text NOT NULL,
  admin_id uuid REFERENCES profiles(id) NOT NULL,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.account_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "account_actions_admin_all" ON public.account_actions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "account_actions_salon_read" ON public.account_actions
  FOR SELECT USING (
    salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  );
