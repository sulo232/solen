-- exists-check: net-new, and the reason is the finding itself. migrations/005_reviews_trust.sql:46
-- DID intend this exact policy ("Anyone can upload review photos"), but wrote it as
-- `CREATE POLICY IF NOT EXISTS`, which POSTGRES DOES NOT SUPPORT. Proved live on prod this
-- session, not assumed: executing that syntax returns `42601 :: syntax error at or near "not"`.
-- So the statement never ran, and pg_policies today shows 0 INSERT policies for this bucket.
-- There is nothing to reuse or extend, only an intent that never executed.
--
-- HOW IT HID FOR SO LONG (STOR-12, open across multiple audit rounds):
-- 005 created the BUCKET with `INSERT .. ON CONFLICT DO NOTHING` (valid, so it worked) and then
-- tried to create 5 policies with the invalid syntax (so none of them did). Three of those five
-- were later re-added by other migrations under different names, which is why only this one and
-- a moot service_role one stayed missing. Reads were re-added as `public_read_review_photos`, so
-- viewing worked and nobody looked further. Writes never worked, and
-- app/api/reviews/[id]/photos/route.ts uses createServerSupabaseClient() (RLS APPLIES), swallows
-- the upload error (`if (uploadErr) { console.error(...); continue; }`), then unconditionally
-- returns `{ success: true, photos: [] }`.
--
-- Measured on prod 2026-07-16:
--   storage.objects where bucket_id='review-photos'  = 0
--   review_photos rows                               = 0
--   reviews                                          = 260
-- The feature has NEVER worked, not once, across 260 reviews, while telling every customer it
-- had. This is LAW.md's own myth in the wild: "a migration that runs successfully means the
-- feature works". Here the migration did not even run the statement, and a swallowed error plus
-- an unconditional success response kept it invisible.
--
-- THE POLICY: mirrors the established house shape exactly (salon_owners_upload_client_photos /
-- _formula_photos / _salon_documents / chat-media all gate INSERT on the first path segment
-- belonging to the caller). The route writes `${reviewId}/${uuid}.${ext}`, so
-- (storage.foldername(name))[1] is the review id, and a caller may only write under a review
-- they authored.
--
-- Deliberately NOT the 005 intent ("Anyone can upload"): that would let any caller write into
-- any review's folder. The bucket is PUBLIC-read, so anything written here is world-readable.
-- Restoring the original wording verbatim would ship a 5-year-old mistake just because it was
-- the original mistake.
--
-- Deliberately NOT service_role: the point is that the customer's own authenticated request
-- writes its own photo. Routing this through the admin client instead would bypass RLS and
-- re-open the cross-tenant storage class the storage gate exists to stop.
--
-- Scoped to `authenticated`: reviews.user_id is NULLABLE (guest/imported reviews) and auth.uid()
-- is NULL for anon, so `user_id = auth.uid()` must never be reachable by an anonymous caller
-- against a NULL-authored review. Restricting the role makes that match impossible.

create policy "review_authors_upload_review_photos"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'review-photos'
    and (storage.foldername(name))[1] in (
      select r.id::text from reviews r where r.user_id = auth.uid()
    )
  );
