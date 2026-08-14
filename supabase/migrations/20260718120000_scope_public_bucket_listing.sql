-- exists-check: net-new. No existing migration alters these storage.objects SELECT policies
-- (grep supabase/migrations). Pure grant-tightening delta, not extending the bucket-create
-- migrations.
--
-- Security-advisor fix (get_advisors 2026-07-18, lint 0025 public_bucket_allows_listing): 5 PUBLIC
-- storage buckets each had a broad `bucket_id = X` SELECT policy on storage.objects granted to
-- anon/public, letting any client ENUMERATE every filename in the bucket via the storage list API.
-- These buckets are public=true (verified via storage.buckets), so object reads go through the
-- public CDN endpoint (/storage/v1/object/public/...) which BYPASSES RLS, the SELECT policies are
-- NOT needed for image display. The only .list() in the codebase is app/api/admin/reviews/[id]
-- on the ADMIN (service-role) client, which also bypasses RLS. So neither reads nor admin ops need
-- these policies.
--
-- Rather than DROP (irreversible, catastrophic-op-guard-blocked), ALTER each policy in place to
-- USING (false): a permissive SELECT policy that grants nothing, so anon/authenticated can no
-- longer list, while public CDN reads and service-role ops are unaffected. Reversible (re-set the
-- USING expr). apply_migration only, never db push / db reset.
alter policy "discovery_public_read bhqjat_0" on storage.objects using (false);
alter policy "public_read_gc_assets" on storage.objects using (false);
alter policy "public_read_review_photos" on storage.objects using (false);
alter policy "public_read_service_photos" on storage.objects using (false);
alter policy "public_read_staff_portfolio_images" on storage.objects using (false);
