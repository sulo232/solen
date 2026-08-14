-- exists-check: net-new vs 051_review_photos.sql (that creates the review_photos TABLE + its RLS;
-- this creates the STORAGE BUCKETS review-photos/salon-documents/formula-photos in storage.buckets +
-- storage.objects policies, which never existed , the deep-audit R2 found the upload routes writing
-- to buckets that were not created). Different object class (storage bucket vs table).
-- APPLIED LIVE 2026-07-12 via MCP. Privacy per owner: review-photos public, documents + formulas private.
insert into storage.buckets (id, name, public) values
  ('review-photos','review-photos', true),
  ('salon-documents','salon-documents', false),
  ('formula-photos','formula-photos', false)
on conflict (id) do nothing;

create policy "public_read_review_photos" on storage.objects for select to public
  using (bucket_id = 'review-photos');
create policy "salon_owners_read_salon_documents" on storage.objects for select to public
  using (bucket_id = 'salon-documents' and (storage.foldername(name))[1] in (select id::text from salons where owner_id = auth.uid()));
create policy "salon_owners_upload_salon_documents" on storage.objects for insert to public
  with check (bucket_id = 'salon-documents' and (storage.foldername(name))[1] in (select id::text from salons where owner_id = auth.uid()));
create policy "salon_owners_read_formula_photos" on storage.objects for select to public
  using (bucket_id = 'formula-photos' and (storage.foldername(name))[1] in (select id::text from salons where owner_id = auth.uid()));
create policy "salon_owners_upload_formula_photos" on storage.objects for insert to public
  with check (bucket_id = 'formula-photos' and (storage.foldername(name))[1] in (select id::text from salons where owner_id = auth.uid()));
