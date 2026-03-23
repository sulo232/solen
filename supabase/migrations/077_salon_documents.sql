CREATE TABLE IF NOT EXISTS public.salon_documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id uuid REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  document_type text NOT NULL CHECK (document_type IN (
    'trade_license', 'professional_cert', 'hygiene_cert',
    'id_proof', 'address_proof', 'other'
  )),
  file_url text NOT NULL,
  file_name text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note text,
  uploaded_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES profiles(id)
);

ALTER TABLE public.salon_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "salon_documents_owner_all" ON public.salon_documents
  FOR ALL USING (
    salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  );

CREATE POLICY "salon_documents_admin_all" ON public.salon_documents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
