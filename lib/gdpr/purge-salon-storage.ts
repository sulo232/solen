import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * GDPR deletion completeness, salon storage half.
 *
 * WHY THIS EXISTS: same shape as lib/gdpr/purge-avatar-storage.ts and its two
 * siblings, a Postgres cascade cannot call the Supabase Storage API. `salons`
 * has ON DELETE CASCADE from `profiles`, so when a salon owner's account is
 * erased the salon row and its child rows vanish, but every FILE uploaded for
 * that salon (gallery photos, business documents, service photos, client
 * before/after photos) stays behind in its bucket forever. The erasure cron
 * already purges client-photos, review-photos and avatars for exactly this
 * reason; it purged nothing salon-scoped before this file existed.
 * `salon-documents` is a PRIVATE bucket holding the owner's business
 * registration documents, the most sensitive of the four, which is why it
 * matters most that this runs before the cascade destroys the only record of
 * which files belonged to which salon.
 *
 * BUCKET PATH SHAPES, each read from the real upload route, two are NESTED:
 *   salon-gallery    `${salonId}/${fileName}`                        flat
 *     (app/api/salons/[slug]/gallery/route.ts, [slug] param is the salon id)
 *   salon-documents  `${salonId}/${Date.now()}-${rand}.${ext}`       flat
 *     (app/api/salon/documents/route.ts)
 *   service-photos   `${salonId}/${serviceId}/${Date.now()}.${ext}` nested
 *     (app/api/services/[id]/photos/route.ts)
 *   client-photos    `${salonId}/${customerId}/${Date.now()}.${ext}` nested
 *     (app/api/clients/[id]/photos/route.ts)
 *
 * THE TRAP: `.list(prefix)` returns FOLDERS as entries with `id === null`,
 * not the files inside them (same filter as app/api/admin/reviews/[id]/route.ts,
 * `f.id !== null`, which only works there because review-photos is flat). For
 * the two nested buckets above, listing only the salon's own folder returns a
 * list of customer/service ID folders, never a file, so removing straight
 * from that list would silently remove nothing while reporting no error.
 * Each nested bucket is listed one level deeper, per folder entry, before
 * anything is removed.
 *
 * CALL ORDER: run this BEFORE the salon row is deleted (either via
 * admin.auth.admin.deleteUser(id) cascading through profiles, or the direct
 * `salons` delete in the admin test-salon route), same reasoning as the three
 * sibling purges, after the delete there is no way left to know which files
 * belonged to which salon.
 *
 * Used by:
 *   - app/api/cron/process-deletions/route.ts (the real 30-day-later deletion)
 *   - app/api/admin/test-salon/route.ts (direct salon-row delete)
 */
export type PurgeSalonStorageResult = {
  /** Storage objects found across all four buckets for these salons. */
  pathsFound: number;
  /** Storage objects actually removed (0 if pathsFound is 0, no-op, not an error). */
  removed: number;
  /** Non-fatal: a failed list/removal is reported here, never thrown. */
  errors: string[];
};

const FLAT_BUCKETS = ["salon-gallery", "salon-documents"] as const;
const NESTED_BUCKETS = ["service-photos", "client-photos"] as const;

export async function purgeSalonStorage(
  admin: SupabaseClient<Database>,
  salonIds: string[],
): Promise<PurgeSalonStorageResult> {
  const errors: string[] = [];
  if (salonIds.length === 0) return { pathsFound: 0, removed: 0, errors };

  let pathsFound = 0;
  let removed = 0;

  for (const salonId of salonIds) {
    // Flat buckets: one level, `${salonId}/${fileName}`. `.list(salonId)` returns
    // the files directly, filtered the same way as the reviews-photos precedent
    // (`f.id !== null`, a folder entry has a null id and no bytes to remove).
    for (const bucket of FLAT_BUCKETS) {
      const { data: files, error: listErr } = await admin.storage.from(bucket).list(salonId);
      if (listErr) {
        errors.push(`${bucket} list (${salonId}): ${listErr.message}`);
        continue;
      }
      const paths = (files ?? [])
        .filter((f) => f.id !== null)
        .map((f) => `${salonId}/${f.name}`);
      if (paths.length === 0) continue;
      pathsFound += paths.length;
      const { data: removedData, error: removeErr } = await admin.storage.from(bucket).remove(paths);
      if (removeErr) {
        errors.push(`${bucket} remove (${salonId}): ${removeErr.message}`);
      } else {
        removed += removedData?.length ?? paths.length;
      }
    }

    // Nested buckets: two levels, `${salonId}/${subId}/${fileName}`. Listing only
    // `salonId` here would return the serviceId/customerId FOLDERS (id === null,
    // no bytes), not the files inside them, exactly the trap above. Each folder
    // entry is listed again, one level deeper, before anything is removed.
    for (const bucket of NESTED_BUCKETS) {
      const { data: subfolders, error: listErr } = await admin.storage.from(bucket).list(salonId);
      if (listErr) {
        errors.push(`${bucket} list (${salonId}): ${listErr.message}`);
        continue;
      }
      const folderNames = (subfolders ?? [])
        .filter((f) => f.id === null)
        .map((f) => f.name);
      if (folderNames.length === 0) continue;

      for (const folderName of folderNames) {
        const subPrefix = `${salonId}/${folderName}`;
        const { data: files, error: subListErr } = await admin.storage.from(bucket).list(subPrefix);
        if (subListErr) {
          errors.push(`${bucket} list (${subPrefix}): ${subListErr.message}`);
          continue;
        }
        const paths = (files ?? [])
          .filter((f) => f.id !== null)
          .map((f) => `${subPrefix}/${f.name}`);
        if (paths.length === 0) continue;
        pathsFound += paths.length;
        const { data: removedData, error: removeErr } = await admin.storage.from(bucket).remove(paths);
        if (removeErr) {
          errors.push(`${bucket} remove (${subPrefix}): ${removeErr.message}`);
        } else {
          removed += removedData?.length ?? paths.length;
        }
      }
    }
  }

  return { pathsFound, removed, errors };
}
