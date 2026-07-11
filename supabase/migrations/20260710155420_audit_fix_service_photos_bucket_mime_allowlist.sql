-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
-- Defense-in-depth for the service-photos upload (public bucket had no MIME allowlist,
-- letting arbitrary HTML/SVG be hosted on the trusted *.supabase.co domain). The app-layer
-- allowlist is added in the route; this makes the Storage layer reject non-images too.
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp']
WHERE id = 'service-photos';