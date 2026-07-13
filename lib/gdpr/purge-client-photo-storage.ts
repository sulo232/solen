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

  const paths = (photos ?? [])
    .map((p: { photo_url: string | null }) => p.photo_url)
    .filter((p: string | null): p is string => !!p);

  if (paths.length === 0) return { pathsFound: 0, removed: 0, errors };

  const { data: removedData, error: removeErr } = await admin.storage.from(BUCKET).remove(paths);
  if (removeErr) {
    errors.push(`client-photos storage remove: ${removeErr.message}`);
    return { pathsFound: paths.length, removed: 0, errors };
  }

  return { pathsFound: paths.length, removed: removedData?.length ?? paths.length, errors };
}
