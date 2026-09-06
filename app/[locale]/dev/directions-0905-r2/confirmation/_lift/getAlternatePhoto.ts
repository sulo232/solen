// exists-check: `npm run exists "salon photo alternate"` and `npm run exists "directions-0905-r2
// confirmation"` (both run this turn) return 0 matches for a loader of this shape. `npm run
// exists confirmation` surfaces getSeedBooking (the shared booking loader, unedited, imported
// not copied) and getCancellationInfo.ts (the pattern this file's admin-client/dev-only shape
// follows). No existing loader queries salon_portfolio_images for a non-banned substitute photo.
//
// Depicts: an alternate real photo for the booked salon -> salon_portfolio_images (174 real rows
// live, confirmed this run: salon_id dd4a3e35-8b9c-4ee6-a52e-1fb71ce04f89 / atelier-haarwerk has
// 5, four of them not the banned asset)
//
// WHY THIS FILE EXISTS: R2_LOOK_SYSTEMS.md CONFLICT C10 bans the greyscale seed photo
// (photo-1560066984, mean HSV saturation 0.000) and the task brief says "pick another seeded
// salon or photo through the real loader, never a hardcoded src." getSeedBooking() (shared, off
// limits per "import its loader, do not copy files") resolves whichever confirmed booking sorts
// first, and that salon's OWN cover_photo_url happens to be the banned asset. Rather than either
// (a) hardcoding a different salon's photo as this booking's picture, which would show a photo
// of a salon the customer did not book, dishonest regardless of it being "real", or (b) forking
// getSeedBooking()'s own row-resolution logic to pick a different booking, which would duplicate
// a file the brief says to import not copy, this loader does the narrowest real thing: for the
// SAME booked salon, look up one more of ITS OWN real portfolio photos that is not the banned
// asset. Still the real salon, still a real photo, from a real table, never fabricated.
//
// Server-only, admin client, dev-only route (same acceptable-bypass note seedBooking.ts and
// getCancellationInfo.ts already document for this folder: this never runs in a real request
// path, only inside /dev/directions-0905-r2/confirmation).
import { createAdminSupabaseClient } from "@/lib/supabase";

const BANNED_GREYSCALE_PHOTO_ID = "photo-1560066984";

/** Returns a real, non-banned portfolio photo URL for the given salon, or null if none exists
 * (never fabricated: a genuinely photo-less salon still falls through to the missing-photo
 * fallback in LiftConfirmationView.tsx). */
export async function getAlternatePhoto(salonId: string): Promise<string | null> {
  const supabase = createAdminSupabaseClient();
  const { data } = await supabase
    .from("salon_portfolio_images")
    .select("image_url")
    .eq("salon_id", salonId)
    .order("sort_order", { ascending: true })
    .limit(10);

  const alt = (data ?? []).find((row) => !row.image_url?.includes(BANNED_GREYSCALE_PHOTO_ID));
  return alt?.image_url ?? null;
}

export { BANNED_GREYSCALE_PHOTO_ID };
