-- exists-check: net-new vs 20260712160000_create_missing_storage_buckets.sql (that created review/
-- salon-documents/formula buckets; this adds the staff-portfolio-images bucket found broken by the
-- backend-systems health check). Different bucket. APPLIED LIVE 2026-07-12 via MCP.
-- The staff-portfolio upload route targeted 'staff-portfolio-images' which never existed (only
-- nail-/barber-portfolio-images did), 500ing every call. Public (portfolios are shown publicly);
-- salon-owner-scoped INSERT (path <salon_id>/<staff_id>/..., folder[1] = salon_id).
insert into storage.buckets (id, name, public) values ('staff-portfolio-images','staff-portfolio-images', true)
on conflict (id) do nothing;

create policy "public_read_staff_portfolio_images" on storage.objects for select to public
  using (bucket_id = 'staff-portfolio-images');
create policy "salon_owners_upload_staff_portfolio_images" on storage.objects for insert to public
  with check (bucket_id = 'staff-portfolio-images' and (storage.foldername(name))[1] in (select id::text from salons where owner_id = auth.uid()));
