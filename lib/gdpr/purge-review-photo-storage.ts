import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * GDPR deletion completeness, review-photos storage half.
 *
 * WHY THIS EXISTS: reviews.user_id is ON DELETE SET NULL (migration
 * 030_gdpr_support.sql), so the REVIEW ROW itself survives a deletion (the
 * rating is kept for salon aggregates, comment.free text is nulled by the
 * trigger in migration 20260713150000_gdpr_deletion_completeness.sql).
 * review_photos.review_id FKs to that SURVIVING reviews(id) ON DELETE
 * CASCADE (051_review_photos.sql), so nothing about deleting the profile
 * ever touches review_photos: it is not cascaded (the review row isn't
 * deleted) and no trigger runs on it. A reviewer's face/body/nails photo
 * would sit in the PUBLIC "review-photos" storage bucket forever, publicly
 * served, after "full" account deletion. This closes that gap, same shape
 * as lib/gdpr/purge-client-photo-storage.ts (row survives on a retained
 * parent, storage bytes need an explicit purge).
 *
 * Unlike client_photos, there is nothing worth keeping in a review_photos
 * row once the photo is gone (no separate business record, just
 * review_id/photo_url/sort_order), so this hard-deletes the DB rows AND the
 * storage bytes together, rather than nulling a surviving row in place.
 *
 * review_photos.photo_url stores the FULL PUBLIC URL, not a raw storage
 * path (the bucket is public, see app/api/reviews/[id]/photos/route.ts:90-96),
 * unlike client_photos where photo_url is a raw path (private bucket). The
 * storage path is recovered by stripping the
 * `.../object/public/review-photos/` prefix from the stored URL.
 *
 * CALL ORDER: run this BEFORE admin.auth.admin.deleteUser(id). There is no
 * strict ordering requirement against the trigger (review_photos has no FK
 * back to profiles for the delete to touch), but running it before keeps
 * the same convention as purgeClientPhotoStorage so there is only one
 * pattern to remember.
 *
 * Used by:
 *   - app/api/cron/process-deletions/route.ts (the real 30-day-later deletion)
 *   - scripts/gdpr-deletion-completeness-check.ts (the harden gate, same code path)
 */
export type PurgeReviewPhotoStorageResult = {
  /** review_photos rows found for this user's reviews. */
  pathsFound: number;
  /** Storage objects actually removed (0 if pathsFound is 0, no-op, not an error). */
  removed: number;
  /** Non-fatal: a failed lookup/removal is reported here, never thrown. */
  errors: string[];
};

const BUCKET = "review-photos";

function pathFromPublicUrl(url: string): string | null {
  const marker = `/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}

export async function purgeReviewPhotoStorage(
  admin: SupabaseClient,
  userIds: string[],
): Promise<PurgeReviewPhotoStorageResult> {
  const errors: string[] = [];
  if (userIds.length === 0) return { pathsFound: 0, removed: 0, errors };

  const { data: reviews, error: reviewsErr } = await admin
    .from("reviews")
    .select("id")
    .in("user_id", userIds);

  if (reviewsErr) {
    errors.push(`reviews lookup: ${reviewsErr.message}`);
    return { pathsFound: 0, removed: 0, errors };
  }

  const reviewIds = (reviews ?? []).map((r: { id: string }) => r.id);
  if (reviewIds.length === 0) return { pathsFound: 0, removed: 0, errors };

  const { data: photos, error: findErr } = await admin
    .from("review_photos")
    .select("id, photo_url")
    .in("review_id", reviewIds);

  if (findErr) {
    errors.push(`review_photos lookup: ${findErr.message}`);
    return { pathsFound: 0, removed: 0, errors };
  }

  const rows = photos ?? [];
  if (rows.length === 0) return { pathsFound: 0, removed: 0, errors };

  const paths = rows
    .map((p: { photo_url: string }) => pathFromPublicUrl(p.photo_url))
    .filter((p: string | null): p is string => !!p);

  let removed = 0;
  if (paths.length > 0) {
    const { data: removedData, error: removeErr } = await admin.storage.from(BUCKET).remove(paths);
    if (removeErr) {
      errors.push(`review-photos storage remove: ${removeErr.message}`);
    } else {
      removed = removedData?.length ?? paths.length;
    }
  }

  const photoIds = rows.map((p: { id: string }) => p.id);
  const { error: deleteErr } = await admin.from("review_photos").delete().in("id", photoIds);
  if (deleteErr) {
    errors.push(`review_photos row delete: ${deleteErr.message}`);
  }

  return { pathsFound: rows.length, removed, errors };
}
