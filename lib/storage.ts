import type { SupabaseClient } from "@supabase/supabase-js";

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
