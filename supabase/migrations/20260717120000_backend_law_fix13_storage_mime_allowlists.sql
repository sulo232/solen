-- exists-check: ran `npm run exists allowed_mime_types`, `npm run exists "storage.buckets mime"`,
-- and `npm run exists backend_law_fix13` this session, 0 matches every time, net-new.
-- _plans/BACKEND_LAW.md fix-loop #13 / _backend-system/LAW.md section 10 ("type validation:
-- magic bytes AND the bucket's allowed_mime_types, both layers") + audit finding STOR-04
-- (_backend-system/audit/file-storage.md). The app-layer file.type check is a string the
-- ATTACKER controls; the bucket setting is the layer they cannot touch.
--
-- Live catalog queried this session (Storage REST API, GET /storage/v1/bucket, service-role,
-- read-only), NOT migration files (project convention, LAW.md STOR-06 / project rule "verify
-- bucket config against live project, never migration files"). 14 buckets exist live; 11 had
-- allowed_mime_types = null. Each row below is grounded in the ACTUAL upload code for that
-- bucket (grepped `.storage.from("<bucket>")` across app/ + lib/), never guessed from the
-- bucket's name. 4 of the 11 null buckets are left untouched, see the note at the bottom.
--
-- Forward-only, idempotent: a plain UPDATE ... WHERE id = '<bucket>' is a no-op safe re-run,
-- matches the existing house pattern (20260710155420_audit_fix_service_photos_bucket_mime_allowlist.sql).

-- 1. discovery-images (public). THREE writers, all confirmed to store real image bytes:
--    app/api/admin/discovery/upload/route.ts:39 and app/api/admin/discovery/staging/route.ts:85
--    both sharp-convert to webp and upload with contentType:"image/webp" explicitly;
--    app/api/discovery/thumb/[id]/route.ts:172 persists whatever content-type TikTok's CDN
--    itself reports (imgRes.headers.get("content-type") || "image/jpeg", almost always jpeg for
--    TikTok's thumbnail CDN). A storage-persist failure on the thumb-cache path is already
--    non-blocking (route.ts:175 just logs and keeps serving the fetched bytes to the user), so a
--    rare non-matching content-type from TikTok degrades gracefully rather than breaking a page.
--    file_size_limit already 5242880 (5MB) live, unchanged.
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp']
WHERE id = 'discovery-images';

-- 2. formula-photos (private). app/api/dashboard/coiffeur/formula-photo/route.ts:47 validates
--    ONLY `file.type.startsWith("image/")` (no enumerated list) and :74 uploads with
--    `contentType: file.type` (the client's raw mime, unconverted). The app itself accepts ANY
--    image/* subtype today, so an enumerated 3-type list would be NARROWER than what the route
--    actually allows (would reject a real image/heic or image/gif upload that passes the app
--    check today). Using the wildcard form instead, the same pattern already live on
--    `chat-media` (`allowed_mime_types = ['image/*','video/mp4','video/webm']`, proving Supabase
--    Storage supports this glob), matches the app's real scope exactly, no wider and no narrower.
--    file_size_limit: the app checks 10MB (route.ts:54), but _backend-system/LAW.md section 10
--    ("upload path") flags several routes' 10MB checks as themselves ABOVE Netlify's real ~6MB
--    raw / ~4.5MB effective-base64 sync-function body ceiling, so copying 10MB here would just
--    encode the same bug into the bucket. Setting 5242880 (5MB) instead: safely under Netlify's
--    real ceiling, and it converges with the other 4 image buckets that are already locked at
--    5MB (client-photos, service-photos, review-photos and salon-gallery below). This is a
--    DEVIATION from the app's stated 10MB, flagged: the app-layer check itself should be lowered
--    to match in a follow-up (separate fix, not a bucket-config change, out of this migration's
--    scope).
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/*'],
    file_size_limit = 5242880
WHERE id = 'formula-photos';

-- 3. review-photos (public). app/api/reviews/[id]/photos/route.ts:59 enumerates exactly
--    ['image/jpeg','image/png','image/webp'] and :63 caps at 5MB. Bucket now matches exactly.
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp'],
    file_size_limit = 5242880
WHERE id = 'review-photos';

-- 4. salon-documents (private). app/api/salon/documents/route.ts:47 enumerates exactly
--    ['application/pdf','image/jpeg','image/png'] (business-license / hygiene-cert uploads,
--    genuinely PDFs, not just images, confirmed by the route's own `document_type` enum:
--    trade_license/professional_cert/hygiene_cert/id_proof/address_proof/other). Bucket now
--    matches exactly.
--    file_size_limit: same 10MB-above-Netlify's-real-ceiling issue as formula-photos above
--    (route.ts:48). Set to 5242880 for the same reasoning: below Netlify's real ceiling,
--    converges with the rest of the fleet. Same flagged deviation: the app-layer 10MB check
--    should be lowered to match in a follow-up, out of this migration's scope.
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['application/pdf','image/jpeg','image/png'],
    file_size_limit = 5242880
WHERE id = 'salon-documents';

-- 5. salon-gallery (public). app/api/salons/[slug]/gallery/route.ts:54 enumerates exactly
--    ['image/jpeg','image/png','image/webp'] and :62 caps at 5MB. Bucket now matches exactly
--    (this is also the STOR-04 gap the file-storage audit named explicitly).
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp'],
    file_size_limit = 5242880
WHERE id = 'salon-gallery';

-- 6. nail-portfolio-images (public). app/api/admin/nail/generate/route.ts:132-135 is the one
--    live writer: downloads a fal.ai-generated image and re-uploads with
--    `contentType: "image/webp"` explicitly, always. No app-layer file_size_limit exists for
--    this path (it is a server-to-server re-upload of an AI-generated image, not a user-supplied
--    File with a size check), so file_size_limit is deliberately left null, nothing to align to.
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/webp']
WHERE id = 'nail-portfolio-images';

-- 7. db-backups (private). lib/backup/export.ts:101 is the ONLY writer (nightly cron), always
--    `contentType: "application/json"`. Not a user-facing upload path (no client-controlled
--    file.type to defend against here), but the bucket-layer allowlist is still cheap defense in
--    depth against any future caller reusing this bucket for something else. No app-layer size
--    check exists (JSON export size follows table row counts, not a client-supplied file), so
--    file_size_limit is deliberately left null.
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['application/json']
WHERE id = 'db-backups';

-- NOT touched, and why (4 of the 11 null buckets): gift-card-assets, nail-inspo-images,
-- barber-portfolio-images, staff-portfolio-images. Live-checked this session (Storage REST
-- `list` on each): ZERO objects in all four. Grepped `app/` + `lib/` for `.storage.from(...)`
-- referencing any of the four: ZERO code paths write to any of them (gift-card-assets is a
-- graveyard bucket for the killed/hidden gift-card feature; nail-inspo-images and
-- barber-portfolio-images are named in roadmap docs for features never built;
-- staff-portfolio-images is referenced only descriptively in a migration comment, never
-- written). Setting an allowlist for a bucket with no real writer and no stored objects would
-- be inventing a requirement with nothing to ground it against (house rule: don't invent a
-- value that isn't locked in real code). Left null. Flagged for the owner: either delete these
-- 4 as dead/pre-provisioned buckets (zero data loss, the file-storage audit already recommended
-- this for 4 of the same names) or set a real allowlist once a real feature starts writing to
-- them and there is app code to derive it from.
