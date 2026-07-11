-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
-- Ring 12: discovery-images (public bucket) granted ANY authenticated user INSERT (upload) and DELETE
-- (wipe) on storage.objects. The DELETE policy was even named "discovery_admin_delete" but its predicate
-- only checked bucket_id, no admin role. Discovery images are admin-curated (written only by the
-- service-role admin routes staging/upload/thumb, which bypass RLS). Tighten both in place (non-destructive
-- ALTER, not DROP) to require a real platform-admin, so non-admin authenticated users can no longer upload
-- or delete. Service-role is unaffected (bypasses RLS); public SELECT is untouched.
ALTER POLICY "discovery_auth_upload bhqjat_0" ON storage.objects
  WITH CHECK (
    bucket_id = 'discovery-images'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
ALTER POLICY "discovery_admin_delete bhqjat_0" ON storage.objects
  USING (
    bucket_id = 'discovery-images'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );