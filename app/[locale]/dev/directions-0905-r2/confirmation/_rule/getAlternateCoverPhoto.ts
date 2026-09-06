/**
 * Exists-check: `npm run exists "cover photo"` and `npm run exists gallery` (run this turn)
 * surface `salons.gallery_urls` (already selected by the real `lib/salon-detail.ts` loader) and
 * `salons.cover_photo_url`, no existing dev-route loader that swaps ONE salon's own cover for a
 * different real photo of the SAME salon. Net-new, small, single-purpose, the same pattern
 * `../../../directions-0905/confirmation/_vc/getCancellationInfo.ts` already established for a
 * column `seedBooking.ts`'s own BOOKING_SELECT does not carry.
 *
 * Why this exists: R2_LOOK_SYSTEMS.md CONFLICT C10 (verdict DECIDE): round 2 does not use
 * `photo-1560066984` (mean HSV saturation 0.000, greyscale), and the orchestrator brief repeats
 * this by name. The real, shared `getSeedBooking()` loader (off-limits, not forked) resolves to
 * whichever confirmed+paid booking exists first in the live DB; queried directly this session
 * (`scratchpad/r2/check-booking.mjs`), that booking's salon is "Atelier Haarwerk"
 * (dd4a3e35-8b9c-4ee6-a52e-1fb71ce04f89), and its `cover_photo_url` is exactly the banned hash.
 * "Swapping a seed row is the expected move, not fabrication" (C10), but the swap has to go
 * THROUGH the real loader, never a hardcoded `src` (orchestrator override + FLOORS LAW 2 /
 * no-decorative-image-gate). This file is that swap: it reads the SAME salon's own real
 * `gallery_urls` column (confirmed live, `scratchpad/r2/check-gallery.mjs`: 11 real Unsplash
 * URLs, index 0 is the banned hash, index 1 onward are not) and returns the first entry whose
 * URL does not contain the banned hash. Still the real salon, still a real photo of it, never an
 * invented image.
 *
 * Grounded-in: lib/salon-detail.ts (the real loader that already selects `gallery_urls` off
 * `salons` for the live salon PDP; this file selects the same column, nothing new to the schema).
 *
 * Server-only, admin client, dev-only route (same acceptable-bypass note seedBooking.ts and
 * getCancellationInfo.ts already document for this folder).
 */
import { createAdminSupabaseClient } from "@/lib/supabase";

const BANNED_HASH = "photo-1560066984";

export async function getAlternateCoverPhoto(salonId: string, fallback: string | null): Promise<string | null> {
  const supabase = createAdminSupabaseClient();
  const { data } = await supabase
    .from("salons")
    .select("gallery_urls")
    .eq("id", salonId)
    .maybeSingle();

  const gallery = (data?.gallery_urls as string[] | null) ?? [];
  const alternate = gallery.find((url) => !url.includes(BANNED_HASH));
  if (alternate) return alternate;

  // Fallback only fires if the salon's own gallery is empty or every entry is the banned hash
  // (neither is true for the live seed row, confirmed this session): the real cover, banned hash
  // and all, is still a real photo of a real salon, never an invented one.
  return fallback;
}
