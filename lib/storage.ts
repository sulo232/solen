import type { SupabaseClient } from "@supabase/supabase-js";
import { getPublicEnv } from "@/lib/env";

/**
 * Mint a short-lived signed URL for an object in a PRIVATE Storage bucket
 * (client-photos, formula-photos, salon-documents). Pass the admin
 * (service-role) client: signing must work regardless of the caller's own
 * RLS grants, and the stored value is a bucket-relative PATH, never a
 * public URL (getPublicUrl() 404s on a private bucket).
 *
 * A failed sign must not become a broken <img src>: callers get null on
 * failure and must handle it (omit the photo, never pass the raw path
 * through as if it were a usable URL).
 */
export async function signedUrl(
  admin: SupabaseClient,
  bucket: string,
  path: string,
  expiresIn = 3600,
): Promise<string | null> {
  const { data, error } = await admin.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error || !data?.signedUrl) {
    console.error(`[storage] createSignedUrl failed for ${bucket}/${path}:`, error?.message ?? "no signedUrl returned");
    return null;
  }
  return data.signedUrl;
}

/**
 * Orphaned-storage sweep (five sites: app/api/admin/reports, the GDPR avatar purge at
 * lib/gdpr/purge-avatar-storage.ts, app/api/services/[id] and the two round-1 sites this
 * round REMOVED, app/api/staff/[id] and app/api/nail-inspo/images, see item 4/5 of the
 * round-2 fix for why). A row is easy to delete; the bytes it pointed at need their own
 * explicit removal, and a url is CLIENT-SUPPLIED data, never safe to hand straight to
 * storage.remove() without checking it actually names an object inside the bucket we expect
 * AND inside the caller's own folder.
 *
 * ROUND 1 CORRECTION: the first version of this helper checked bucket + traversal but never
 * checked OWNERSHIP, i.e. that the resolved path's first segment actually belongs to the row
 * being deleted. That is precisely what let one user's PATCH-writable avatar_url (or
 * staff_members.avatar_url) point at ANOTHER user's object and have it deleted out from
 * under them on the attacker's own delete. `ownerPrefix` is now a REQUIRED parameter, not a
 * convention a call site can forget: the path's first segment must equal it exactly. This
 * mirrors the guard app/api/salons/[slug]/gallery/route.ts hand-wrote for its own bucket
 * (first segment === the caller's own slug, at least two non-empty segments, no ".."
 * segment), generalised so every site stops hand-rolling copies of it.
 *
 * Pure and synchronous: never throws, never touches the network, safe to call on every url
 * a row might carry, including ones that are perfectly legitimate EXTERNAL links (e.g.
 * staff_members.instagram_url, nail_inspo_images.source_url) that must never be resolved to
 * a storage path at all.
 *
 * @param ownerPrefix the first path segment the object MUST have to count as this caller's
 *   own (a user id for "avatars", a salon slug for "salon-gallery", a salon id for
 *   "service-photos"). Never derive this from the url itself, it must come from the row
 *   being deleted, that is the whole guarantee.
 * @returns the bucket-relative object path, or null when `url` is empty, external (not on
 *   our own Supabase Storage origin), inside a DIFFERENT bucket than `bucket`, has fewer
 *   than two non-empty segments, contains a ".." path-traversal segment, or whose first
 *   segment does not equal `ownerPrefix`. null is the ordinary "nothing to remove" case
 *   here, not an error, callers should not log on a null return.
 */
export function objectPathForUrl(
  url: string | null | undefined,
  bucket: string,
  ownerPrefix: string,
): string | null {
  if (!url) return null;
  if (!ownerPrefix) return null; // nothing to prove ownership against, refuse rather than guess

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null; // not an absolute url at all, never throw on a malformed input
  }

  let ourOrigin: string;
  try {
    ourOrigin = new URL(getPublicEnv().NEXT_PUBLIC_SUPABASE_URL).origin;
  } catch {
    return null; // can't prove this is our storage, treat like an external url
  }
  if (parsed.origin !== ourOrigin) return null; // a real external link, e.g. an Instagram photo

  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = parsed.pathname.indexOf(marker);
  if (idx === -1) return null; // our project, but not this bucket

  const rawPath = parsed.pathname.slice(idx + marker.length);
  if (!rawPath) return null;

  // Decode repeatedly until the string stops changing (capped, so a malformed input can
  // never loop) rather than once: a single decode leaves a double-encoded ".." segment
  // (e.g. "%252e%252e") intact after the first pass. Defence in depth, no reviewer
  // demonstrated an exploit through this, but the fix is small and the traversal check
  // below is only as good as what it actually sees decoded.
  let path = rawPath;
  for (let i = 0; i < 5; i++) {
    let next: string;
    try {
      next = decodeURIComponent(path);
    } catch {
      return null; // malformed percent-encoding, never throw
    }
    if (next === path) break;
    path = next;
  }

  const segs = path.split("/");

  // The ownership check: without this, `path` merely proves the url resolves to SOME object
  // inside `bucket`, never that it belongs to the row being deleted, which is the gap round 1
  // left open. Require the gallery route's exact shape: >= 2 non-empty segments, first
  // segment === ownerPrefix, no ".." segment anywhere.
  if (segs.length < 2) return null;
  if (segs[0] !== ownerPrefix) return null;
  for (const seg of segs) {
    if (!seg || seg === "..") return null; // no empty segment, no traversal
  }

  return path;
}

/**
 * Removes the storage object a public url points at, IF `objectPathForUrl` resolves it
 * inside `bucket` AND `ownerPrefix`. Best-effort and never throws: every call site here is
 * cleanup that runs alongside a row delete that must still succeed even when the storage
 * side fails, so a failure is reported back (and console.error'd with `logPrefix`) rather
 * than raised.
 *
 * @param ownerPrefix see objectPathForUrl, must be the row being deleted's own id/slug,
 *   never derived from `url`.
 * @param logPrefix stable console.error prefix naming the caller, e.g. "[admin/reports]".
 */
export async function removeObjectForUrl(
  admin: SupabaseClient,
  url: string | null | undefined,
  bucket: string,
  ownerPrefix: string,
  logPrefix: string,
): Promise<{ removed: boolean; error: string | null }> {
  const path = objectPathForUrl(url, bucket, ownerPrefix);
  if (!path) return { removed: false, error: null };

  try {
    const { error } = await admin.storage.from(bucket).remove([path]);
    if (error) {
      console.error(`${logPrefix} storage remove failed for ${bucket}/${path}:`, error.message);
      return { removed: false, error: error.message };
    }
    return { removed: true, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(`${logPrefix} storage remove threw for ${bucket}/${path}:`, message);
    return { removed: false, error: message };
  }
}
