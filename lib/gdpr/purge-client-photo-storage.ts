import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * GDPR deletion completeness, storage half.
 *
 * WHY THIS EXISTS: the DB trigger `public.anonymize_financial_rows_on_profile_delete()`
 * (supabase/migrations/20260713150000_gdpr_deletion_completeness.sql) nulls
 * `client_photos.customer_id` / `photo_url` when a profile is deleted, but a
 * Postgres trigger cannot call the Supabase Storage API. The actual photo
 * BYTES in the private `client-photos` bucket would survive forever even
 * after the DB row pointing at them is scrubbed. This closes that gap.
 *
 * CALL ORDER (both callers must do this BEFORE the profile/auth delete):
 *   1. purgeClientPhotoStorage(admin, userIds), THIS, deletes the bytes
 *   2. admin.auth.admin.deleteUser(id), cascades to profiles,
 *      fires the trigger, nulls the DB rows
 * Doing it in the other order would still leave orphaned bytes: the trigger
 * nulls photo_url, so step 1 run afterward would have nothing left to look up.
 *
 * Used by:
 *   - app/api/cron/process-deletions/route.ts (the real 30-day-later deletion)
 *   - scripts/gdpr-deletion-completeness-check.mjs (the harden gate, same code path)
 */
export type PurgeClientPhotoStorageResult = {
  /** Storage paths that were found for these users. */
  pathsFound: number;
  /** Storage paths actually removed (0 if pathsFound is 0, no-op, not an error). */
  removed: number;
  /** Non-fatal: a failed lookup/removal is reported here, never thrown. */
  errors: string[];
};

const BUCKET = "client-photos";

/**
 * client_photos.photo_url now holds a bucket-relative PATH (changed 2026-08-14: this bucket is
 * private, so the getPublicUrl() link it used to store resolved to nothing and every client photo
 * rendered broken). storage.remove() wants exactly that path, so the common case is now the
 * fallback branch below, which was already written to accept it.
 *
 * The public-URL parsing stays because it costs nothing and this function must keep working on any
 * row written before that change. Deletion is the one path where guessing wrong means a customer
 * asked for their photos to be erased and they quietly were not, so it accepts BOTH shapes rather
 * than assuming the new one. Mirrors pathFromPublicUrl in purge-review-photo-storage.ts.
 */
function pathFromPublicUrl(url: string): string | null {
  const marker = `/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) {
    // No marker: either an already-relative path (accept) or something unusable (reject).
    return url.startsWith("http") ? null : url;
  }
  return decodeURIComponent(url.slice(idx + marker.length));
}

export async function purgeClientPhotoStorage(
  admin: SupabaseClient,
  userIds: string[],
): Promise<PurgeClientPhotoStorageResult> {
  const errors: string[] = [];
  if (userIds.length === 0) return { pathsFound: 0, removed: 0, errors };

  const { data: photos, error: findErr } = await admin
    .from("client_photos")
    .select("photo_url")
    .in("customer_id", userIds)
    .not("photo_url", "is", null);

  if (findErr) {
    errors.push(`client_photos lookup: ${findErr.message}`);
    return { pathsFound: 0, removed: 0, errors };
  }

  // client_photos.photo_url stores the FULL public URL (app/api/clients/[id]/photos/route.ts:85-94
  // writes `urlData.publicUrl`), but storage.remove() needs a BUCKET-RELATIVE path. Passing the URL
  // verbatim matched no object and removed nothing while returning no error: a silent no-op that
  // left erased customers' before/after photos in the bucket forever. Strip the marker the same way
  // the sibling purge-review-photo-storage.ts does. A raw path (no marker) is still accepted, so
  // older/hand-written rows keep working.
  const rawUrls = (photos ?? [])
    .map((p: { photo_url: string | null }) => p.photo_url)
    .filter((p: string | null): p is string => !!p);

  const paths = rawUrls
    .map((u) => pathFromPublicUrl(u))
    .filter((p: string | null): p is string => !!p);

  // Anything we could not turn into a real path would be a silent miss: surface it.
  const unparseable = rawUrls.length - paths.length;
  if (unparseable > 0) {
    errors.push(`client-photos: ${unparseable} photo_url value(s) could not be mapped to a storage path`);
  }

  if (paths.length === 0) return { pathsFound: 0, removed: 0, errors };

  const { data: removedData, error: removeErr } = await admin.storage.from(BUCKET).remove(paths);
  if (removeErr) {
    errors.push(`client-photos storage remove: ${removeErr.message}`);
    return { pathsFound: paths.length, removed: 0, errors };
  }

  return { pathsFound: paths.length, removed: removedData?.length ?? paths.length, errors };
}
