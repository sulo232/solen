// Grounded-in: app/[locale]/_components/homepage/salonCardData.ts (getSalonCardDataMap,
// getTopSalonIds, getTopSalonIdsByCategory, all real, imported unmodified, the same server
// functions app/[locale]/page.tsx calls once per render). This file only shapes their output
// into ordered feed sections; it runs no query of its own.
//
// reinvent-ok: CATEGORY_LABEL below is a zip of two already-canonical sources (SALON_CATEGORY_SLUGS
// from lib/validations.ts and CATEGORIES from app/[locale]/_components/homepage/searchCategories.ts,
// same array order, both imported not re-typed), not a third copy of the category name strings.
//
// Exists-check: `npm run exists home feed` (run before this file was written) returns two
// REMOVED hits, both read in full first: (1) AvailableThisWeek, the 7-day "Bald frei" rail,
// killed 2026-08-05, NOT revisited below (no time-window slot logic here). (2) the horizontal
// SalonCard rail that used to sit under the home map's "In der Nähe" heading, killed the same
// day, owner verbatim "I want to actually remove the in your near... make it just a map". THIS
// FILE DOES NOT REBUILD THAT SHAPE EITHER: no section below is titled "Near you"/"In der Nähe"
// and NEARBY_SALON_IDS is not imported. Sections here are "Popular Salons" (getTopSalonIds,
// the same cross-category top-rated query RecentlyViewed.tsx's own cold-start fallback already
// calls) and up to three per-category "Top rated" sections (getTopSalonIdsByCategory, the same
// query TopCategoryRails.tsx already calls for its four live rails). Both are the SAME real
// server functions the live, unremoved homepage sections already call today; nothing killed by
// name is reconstructed. `npm run exists directions-0905-r2 home` -> 0 matches, this surface has
// no round-2 folder yet.
//
// live-data-ok: every id below comes from a real Supabase query (getTopSalonIds,
// getTopSalonIdsByCategory) against the live salons table; getSalonCardDataMap batch-fetches
// each one's real name/photo/rating/price. A salon missing a required field (name/slug/category)
// is dropped from its section, never rendered with an invented fallback (same completeness gate
// app/[locale]/dev/directions-0905/home/_vc/HomeDirectionC.tsx's toFeedSalon already uses for
// this exact shape, reproduced here rather than imported since that file's own function is
// module-private, not exported).
//
// REPAIR 2026-09-06 (open item, this mockup only): the live "Atelier Haarwerk" seed row's
// cover_photo_url is photo-1560066984 (_plans/R2_LOOK_SYSTEMS.md C10: "no reference and no lock
// ... round 2 does not use photo-1560066984, mean HSV saturation 0.000"). It surfaced in this
// feed's Popular Salons rail because that query ranks by rating, not by photo. Per C10's own
// verdict, "swapping a seed row is the expected move, not fabrication", so toFeedSalon below
// drops any candidate carrying that exact photo (same completeness-gate shape as the
// name/slug/category checks already there) and the query naturally promotes the next real
// candidate into the slot. Scoped to this file only: the live salon row, other round-2 home
// variants and lib/category-photos.ts's own use of the same URL are untouched.

import type { SalonCardCategory } from "@/app/[locale]/_components/salon/_shared";
import {
  getSalonCardDataMap,
  getTopSalonIds,
  getTopSalonIdsByCategory,
  type SalonCardDataMap,
} from "@/app/[locale]/_components/homepage/salonCardData";
import { nameForLocale } from "@/lib/min-price-service";
import { SALON_CATEGORY_SLUGS } from "@/lib/validations";
import { CATEGORIES } from "@/app/[locale]/_components/homepage/searchCategories";

export interface HomeFeedSalon {
  id: string;
  slug: string;
  name: string;
  category: SalonCardCategory;
  rating: number | null;
  reviewCount: number | null;
  photoUrl?: string;
  priceFromCHF: number | null;
  priceFromService: string | null;
  postalCode?: string;
  city?: string;
}

export interface HomeFeedSection {
  key: string;
  title: string;
  /** Real destination this section's "See all" link points to; a category section points at
   * that category's own route, the cross-category section points at plain /search. */
  seeAllHref: string;
  salons: HomeFeedSalon[];
}

// Canonical category slug order (lib/validations.ts) zipped with the canonical display labels
// (searchCategories.ts CATEGORIES, same order), so this file declares no label string of its own.
const CATEGORY_ORDER = SALON_CATEGORY_SLUGS as SalonCardCategory[];
const CATEGORY_LABEL: Record<SalonCardCategory, string> = Object.fromEntries(
  CATEGORY_ORDER.map((slug, i) => [slug, CATEGORIES[i]?.label ?? slug]),
) as Record<SalonCardCategory, string>;

// C10: the one seed photo round 2 does not use (mean HSV saturation 0.000, no reference and no
// lock govern its content, _plans/R2_LOOK_SYSTEMS.md). Matched on the Unsplash photo id, not the
// full querystring, so it still catches the URL regardless of width/quality params.
const BANNED_SEED_PHOTO_ID = "1560066984";

function toFeedSalon(id: string, data: SalonCardDataMap, locale: string): HomeFeedSalon | null {
  const real = data[id];
  // Same completeness gate HomeDirectionC.tsx's toFeedSalon applies: a real row missing its
  // name, slug or category (safeCategory already ran once, inside getSalonCardDataMap itself)
  // is skipped, never rendered with an invented fallback.
  if (!real || !real.name || !real.slug || !real.category) return null;
  // C10 repair: a candidate carrying the banned seed photo is treated the same as one missing a
  // required field, dropped so the next real candidate from the same query fills the slot.
  if (real.photoUrl?.includes(BANNED_SEED_PHOTO_ID)) return null;
  return {
    id,
    slug: real.slug,
    name: real.name,
    category: real.category,
    rating: real.rating,
    reviewCount: real.reviewCount,
    photoUrl: real.photoUrl ?? undefined,
    priceFromCHF: real.priceFromCHF,
    priceFromService: nameForLocale(real.priceFromServiceNames, locale),
    postalCode: real.postalCode ?? undefined,
    city: real.city ?? undefined,
  };
}

/**
 * Assembles the direction-b home feed: one cross-category "Popular Salons" section (real
 * top-rated ids), followed by up to three real per-category "Top rated" sections. A salon
 * already placed in an earlier section is not repeated in a later one (same de-dup rule
 * HomeDirectionC.tsx already applies to its own curated breaks), so a thin seed catalogue never
 * shows one card twice on the same screen.
 */
export async function getHomeFeedBData(locale: string): Promise<HomeFeedSection[]> {
  const [topIds, byCategory] = await Promise.all([getTopSalonIds(10), getTopSalonIdsByCategory(12)]);

  const allIds = [...topIds, ...CATEGORY_ORDER.flatMap((c) => byCategory[c])];
  const salonData = await getSalonCardDataMap(allIds);

  const shown = new Set<string>();
  const sections: HomeFeedSection[] = [];

  const popular = topIds
    .map((id) => toFeedSalon(id, salonData, locale))
    .filter((s): s is HomeFeedSalon => s !== null)
    .slice(0, 8);
  if (popular.length >= 4) {
    for (const s of popular) shown.add(s.id);
    sections.push({ key: "popular", title: "Popular Salons", seeAllHref: `/${locale}/search`, salons: popular });
  }

  for (const category of CATEGORY_ORDER) {
    if (sections.length >= 4) break;
    const list = byCategory[category]
      .filter((id) => !shown.has(id))
      .map((id) => toFeedSalon(id, salonData, locale))
      .filter((s): s is HomeFeedSalon => s !== null)
      .slice(0, 6);
    if (list.length < 2) continue; // too thin to read as its own section, skip rather than pad
    for (const s of list) shown.add(s.id);
    sections.push({
      key: category,
      title: `Top rated - ${CATEGORY_LABEL[category]}`,
      seeAllHref: `/${locale}/${category}`,
      salons: list,
    });
  }

  return sections;
}
