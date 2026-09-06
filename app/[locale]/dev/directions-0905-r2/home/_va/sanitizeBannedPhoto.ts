// Exists-check: `npm run exists "banned photo"` and `npm run exists "salon photo alternate"`
// (both run this session) surface exactly one prior loader of this shape:
// app/[locale]/dev/directions-0905-r2/confirmation/_lift/getAlternatePhoto.ts, written for the
// SAME banned asset and the SAME salon (its own header: "salon_id
// dd4a3e35-8b9c-4ee6-a52e-1fb71ce04f89 / atelier-haarwerk has 5 [portfolio photos], four of them
// not the banned asset"). Not imported cross-screen (that file lives under confirmation/_lift/,
// uses the admin client, and is scoped to ONE booked salon's own photo); this file re-derives the
// same real-table lookup for the home feed's shape, a MAP of many salons rather than one.
//
// WHY THIS FILE EXISTS: R2_LOOK_SYSTEMS.md CONFLICT C10 bans the greyscale seed photo
// (photo-1560066984, mean HSV saturation 0.000) sitewide for round 2, and the task brief says
// "pick another seeded salon or photo through the real loader, never a hardcoded src." The
// homepage's real rails (RecentlyViewed / ForYouSalonRows / TopCategoryRails) source photoUrl
// from getSalonCardDataMap(), which reads `salons.cover_photo_url` -- and salon dd4a3e35's real
// cover photo IS the banned asset. Two options were on the table: (a) drop that salon from the
// picked id lists (NEARBY_SALON_IDS / getTopSalonIds' real rating query) so it never renders at
// all, which either hand-edits a shared production data file used by the live homepage
// (NEARBY_SALON_IDS.ts, out of scope for a home-a-only repair) or fights a real, live,
// rating-ordered DB query with no honest way to exclude one id without hardcoding around it; or
// (b) the same real thing getAlternatePhoto.ts already does for this exact salon on the
// confirmation screen: keep the real salon, look up one more of ITS OWN real portfolio photos
// (salon_portfolio_images, public-read RLS, 174 live rows) that is not the banned asset. (b) is
// what this file does, generalised to every salon in a SalonCardDataMap rather than one booking's
// salon. Still the real salon, still a real photo, from a real table, never fabricated -- the
// same "swapping a seed row is the expected move, not fabrication" verdict C10 already gives.
//
// Scope: this file lives under directions-0905-r2/home/_va/ and is imported by HomeR2DirectionA
// only. It touches no shared production file (not NEARBY_SALON_IDS.ts, not salonCardData.ts, not
// the DB), so the repair is contained to this one mockup's own data-prep step, per the brief.

import { createServerSupabaseClient } from "@/lib/supabase";
import type { SalonCardData, SalonCardDataMap } from "@/app/[locale]/_components/homepage/salonCardData";

export const BANNED_GREYSCALE_PHOTO_ID = "photo-1560066984";

function isBanned(photoUrl: string | null): boolean {
  return !!photoUrl && photoUrl.includes(BANNED_GREYSCALE_PHOTO_ID);
}

/**
 * Returns a copy of `map` where any salon whose real `photoUrl` is the banned greyscale asset
 * has that field replaced with a real, non-banned photo from ITS OWN salon_portfolio_images row
 * (or `null` if it genuinely has none, which falls through to SalonCard's real missing-photo
 * fallback tile -- never a fabricated url). Salons whose photo is already clean pass through
 * unchanged, same object reference, so this is a no-op on every render once the seed data itself
 * is fixed.
 */
export async function sanitizeBannedPhotos(map: SalonCardDataMap): Promise<SalonCardDataMap> {
  const bannedIds = Object.entries(map)
    .filter(([, data]) => isBanned(data.photoUrl))
    .map(([id]) => id);
  if (bannedIds.length === 0) return map;

  const supabase = await createServerSupabaseClient();
  const { data: rows, error } = await supabase
    .from("salon_portfolio_images")
    .select("salon_id, image_url")
    .in("salon_id", bannedIds)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[sanitizeBannedPhotos] salon_portfolio_images fetch failed:", error);
    // No fabrication: fall through with the banned photo cleared to null rather than left in
    // place, so a missing-photo tile renders instead of the banned asset.
    return applyReplacements(map, bannedIds, new Map());
  }

  const altBySalon = new Map<string, string>();
  for (const row of rows ?? []) {
    const salonId = row.salon_id as string;
    const url = row.image_url as string;
    if (!altBySalon.has(salonId) && !isBanned(url)) altBySalon.set(salonId, url);
  }
  return applyReplacements(map, bannedIds, altBySalon);
}

function applyReplacements(
  map: SalonCardDataMap,
  bannedIds: string[],
  altBySalon: Map<string, string>,
): SalonCardDataMap {
  const next: SalonCardDataMap = { ...map };
  for (const id of bannedIds) {
    const current = next[id] as SalonCardData;
    next[id] = { ...current, photoUrl: altBySalon.get(id) ?? null };
  }
  return next;
}
