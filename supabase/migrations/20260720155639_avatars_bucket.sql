-- Avatars bucket for the profile avatar upload feature (app/api/profile/avatar/route.ts).
-- exists-check: `npm run exists "avatar upload"` ran this turn, 0 matches; no "avatars" bucket
-- existed. Applied live via the Storage admin API (supabase.storage.createBucket, service-role
-- key) rather than raw SQL, since this repo has no MCP apply_migration/execute_sql tool wired
-- into this session; file restored here for fresh-env reproducibility (recipe in
-- _rules/DB_SCHEMA.md section 7). Public bucket (matches the service-photos/salon-gallery/
-- review-photos "public content" family, not the private client-photos/formula-photos family,
-- since avatars render via plain <img>/<Image> across the app, e.g. Header, SalonReviews,
-- salon team, with no signed-URL machinery anywhere in this codebase).
--
-- file_size_limit is 50 MB (52428800 bytes), NOT 100 MB: the live project rejected a
-- createBucket call requesting a 100 MB fileSizeLimit ("The object exceeded the maximum
-- allowed size"), confirming the live Storage plan caps a bucket's own limit below 100 MB;
-- 50 MB was the largest value that succeeded (empirically tested this run). The app-layer
-- route still enforces the owner-specified 100 MB INPUT cap before ever touching Storage
-- (client-side canvas downscale to a small JPEG happens before the network request, so a
-- real upload never approaches either ceiling); a raw POST between 50-100 MB will fail at
-- the Storage layer with a distinct, logged error rather than a silent 500.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 52428800, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;
