import type { SupabaseClient } from "@supabase/supabase-js";
import { removeObjectForUrl } from "@/lib/storage";

/**
 * GDPR deletion completeness, avatar storage half.
 *
 * WHY THIS EXISTS: same shape as lib/gdpr/purge-client-photo-storage.ts and
 * lib/gdpr/purge-review-photo-storage.ts, a Postgres trigger cannot call the Supabase
 * Storage API, so the erasure trigger (migration 20260713150000) nulls profiles.avatar_url
 * on account deletion but the actual bytes stay behind in the PUBLIC "avatars" bucket,
 * publicly served, forever, after a "full" account deletion. Found 2026-08-26: the cron
 * that erases accounts purges client-photos and review-photos storage but never avatars,
 * even though app/api/profile/avatar/route.ts is a live writer to that exact bucket.
 *
 * profiles.avatar_url stores the FULL PUBLIC URL (app/api/profile/avatar/route.ts:96,
 * `urlData.publicUrl`), path shape `<user.id>/<timestamp>.<ext>` (route.ts:84).
 *
 * CALL ORDER: run this BEFORE admin.auth.admin.deleteUser(id), same reasoning as the two
 * sibling purges, the erasure trigger nulls avatar_url on the cascade, so running this
 * after would have nothing left to look up.
 *
 * Used by: app/api/cron/process-deletions/route.ts (the real 30-day-later deletion).
 */
export type PurgeAvatarStorageResult = {
  /** profiles.avatar_url values found for these users. */
  pathsFound: number;
  /** Storage objects actually removed (0 if pathsFound is 0, no-op, not an error). */
  removed: number;
  /** Non-fatal: a failed lookup/removal is reported here, never thrown. */
  errors: string[];
};

const BUCKET = "avatars";

export async function purgeAvatarStorage(
  admin: SupabaseClient,
  userIds: string[],
): Promise<PurgeAvatarStorageResult> {
  const errors: string[] = [];
  if (userIds.length === 0) return { pathsFound: 0, removed: 0, errors };

  // `id` is selected alongside `avatar_url` so each url can be checked against ITS OWN
  // user's storage folder, not just against the "avatars" bucket in general. Round-1 review
  // finding (CHAIN A): PATCH /api/profile's avatar_url is an unrestricted z.string().url(),
  // so an attacker can copy a victim's public avatar url into their own profile, then
  // request their own erasure; without the per-row id here this purge would delete
  // whatever url the attacker's row carried, i.e. the victim's file. Passing this row's own
  // id as the ownerPrefix closes that: a url pointing into someone else's folder resolves
  // to null in objectPathForUrl and is silently skipped, exactly like any other url that
  // fails the bucket check.
  const { data: profiles, error: findErr } = await admin
    .from("profiles")
    .select("id, avatar_url")
    .in("id", userIds)
    .not("avatar_url", "is", null);

  if (findErr) {
    errors.push(`profiles avatar_url lookup: ${findErr.message}`);
    return { pathsFound: 0, removed: 0, errors };
  }

  const rows = (profiles ?? []).filter(
    (p: { id: string; avatar_url: string | null }): p is { id: string; avatar_url: string } =>
      !!p.avatar_url,
  );

  if (rows.length === 0) return { pathsFound: 0, removed: 0, errors };

  let removed = 0;
  let pathsFound = 0;
  for (const row of rows) {
    // ownerPrefix = row.id, this user's own folder (path shape `<user.id>/<timestamp>.<ext>`
    // per the header comment above), never derived from the url itself.
    const result = await removeObjectForUrl(admin, row.avatar_url, BUCKET, row.id, "[gdpr avatar purge]");
    // removeObjectForUrl returns removed:false, error:null for a url that simply isn't in
    // this bucket/prefix (nothing to count as "found"), and removed:false, error:<message> for a
    // real removal failure, the two must stay distinguishable the same way the sibling
    // purges track pathsFound vs removed.
    if (result.error !== null) {
      errors.push(`avatars storage remove (${row.avatar_url}): ${result.error}`);
      pathsFound += 1;
    } else if (result.removed) {
      pathsFound += 1;
      removed += 1;
    }
  }

  return { pathsFound, removed, errors };
}
