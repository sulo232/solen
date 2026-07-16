// exists-check: net-new vs Nearby.tsx / ForYouSalonRows.tsx / forYouSalons.ts /
// SalonCard.tsx / lib/active-salon.ts / lib/verify-salon-client.ts because none
// of those hold a SERVER-side batch query for real salon card fields. Nearby.tsx
// + ForYouSalonRows.tsx are "use client" (can't run a Supabase query needing
// next/headers); forYouSalons.ts is a hardcoded demo array with no fetch at all;
// SalonCard.tsx is presentational only; lib/active-salon.ts + verify-salon-client.ts
// are single-salon session/verification helpers, not a batch-by-id fetch. This
// file is the one new piece: a plain server module page.tsx calls once.
//
// live-data-ok: salonCardData.ts queries real salons + services rows (rating,
// review_count, postal_code, address, min active price), no fabricated array.
//
// salonCardData (2026-07-13): server-side batch fetch of REAL salon fields
// (rating, review count, postal code, city, street address, cheapest active
// service price) for a fixed list of salon IDs. Wires the converged SalonCard
// (see SalonCard.tsx Row 3) to live DB data, replacing the hardcoded rating,
// address, and price fallbacks previously used by forYouSalons.ts / Nearby.tsx.
//
// Plain server module (no "use client"), imported ONLY by page.tsx (a Server
// Component). ForYouSalonRows.tsx / Nearby.tsx (both "use client") import just
// the `SalonCardDataMap` TYPE from here via `import type`, which TypeScript
// erases at compile time, so this file's actual Supabase/next-headers code
// never reaches the client bundle.
//
// Two bulk queries (salons + services), not a per-salon loop, mirrors the
// existing min-price-per-salon pattern in app/api/salons/route.ts (buildPriceTask
// + post-fetch reduce). No fabrication: a salon missing a field maps to `null`,
// the caller must omit that field rather than invent a value.

import { createServerSupabaseClient } from "@/lib/supabase";
import { postalToCity, safeCategory, type SalonCardCategory } from "../salon/_shared";

export interface SalonCardData {
  /** Salon name. Only null if the salon id wasn't found in the salons table. */
  name: string | null;
  /** Salon slug, for routing to /salon/[slug]. Same null contract as `name`. */
  slug: string | null;
  /** Bridged from the salons.categories array via safeCategory() (../salon/_shared.ts). */
  category: SalonCardCategory | null;
  /** Cover photo. Null when the salon has none, falls back to the category tile. */
  photoUrl: string | null;
  rating: number | null;
  reviewCount: number | null;
  postalCode: string | null;
  /** Derived from postalCode via postalToCity(), null when postalCode is null. */
  city: string | null;
  address: string | null;
  /** Cheapest ACTIVE service price for the salon, null if it has none. */
  priceFromCHF: number | null;
  /** Real coordinates (salons.latitude/longitude). Null when the salon has none,
   *  in which case it simply gets no marker on the Nearby map (never a fake one). */
  latitude: number | null;
  longitude: number | null;
}

export type SalonCardDataMap = Record<string, SalonCardData>;

/**
 * Batch-fetches real card fields for `salonIds`. Safe to call with a fixed,
 * small ID list (homepage demo rows): dedupes internally, runs exactly two
 * Supabase queries in parallel, never one query per salon.
 */
export async function getSalonCardDataMap(salonIds: string[]): Promise<SalonCardDataMap> {
  const uniqueIds = [...new Set(salonIds)];
  if (uniqueIds.length === 0) return {};

  const supabase = await createServerSupabaseClient();

  const [{ data: salons, error: salonsError }, { data: services, error: servicesError }] =
    await Promise.all([
      supabase
        .from("salons")
        .select("id, name, slug, categories, cover_photo_url, average_rating, review_count, postal_code, address, latitude, longitude")
        .in("id", uniqueIds),
      supabase
        .from("services")
        .select("salon_id, price")
        .eq("is_active", true)
        .in("salon_id", uniqueIds),
    ]);

  if (salonsError) console.error("[salonCardData] salons fetch failed:", salonsError);
  if (servicesError) console.error("[salonCardData] services fetch failed:", servicesError);

  // Cheapest active service price per salon, computed in JS from the bulk
  // services result (same shape as buildPriceTask() in app/api/salons/route.ts).
  const minPriceBySalon = new Map<string, number>();
  for (const svc of services ?? []) {
    const salonId = svc.salon_id as string;
    const price = svc.price as number;
    const current = minPriceBySalon.get(salonId);
    if (current === undefined || price < current) minPriceBySalon.set(salonId, price);
  }

  const map: SalonCardDataMap = {};
  for (const salon of salons ?? []) {
    const postalCode = (salon.postal_code as string | null) ?? null;
    map[salon.id as string] = {
      name: (salon.name as string | null) ?? null,
      slug: (salon.slug as string | null) ?? null,
      category: safeCategory((salon.categories as string[] | null) ?? null),
      photoUrl: (salon.cover_photo_url as string | null) ?? null,
      rating: (salon.average_rating as number | null) ?? null,
      reviewCount: (salon.review_count as number | null) ?? null,
      postalCode,
      city: postalCode ? postalToCity(postalCode) : null,
      address: (salon.address as string | null) ?? null,
      priceFromCHF: minPriceBySalon.get(salon.id as string) ?? null,
      latitude: (salon.latitude as number | null) ?? null,
      longitude: (salon.longitude as number | null) ?? null,
    };
  }
  return map;
}

/**
 * Top-rated salons for RecentlyViewed's "Top auf Solen" fallback (shown to
 * first-time visitors with no view history yet). Real query: active salons
 * with at least 8 reviews (a floor so a single 5-star review can't outrank
 * an established salon), ordered by rating desc. Returns [] on any query
 * error rather than throwing, so the fallback just renders nothing instead
 * of crashing the homepage.
 */
export async function getTopSalonIds(limit: number): Promise<string[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("salons")
    .select("id")
    .eq("is_active", true)
    .gte("review_count", 8)
    .order("average_rating", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[salonCardData] getTopSalonIds fetch failed:", error);
    return [];
  }
  return (data ?? []).map((row) => row.id as string);
}

/**
 * Count of active salons with real coordinates, for the Nearby map-teaser
 * label ("N Salons in der Nähe"). head/count query, no rows fetched. Null
 * on error, so the caller renders the count-free "Karte öffnen" label
 * instead of a fabricated number.
 */
export async function getNearbyTeaserCount(): Promise<number | null> {
  const supabase = await createServerSupabaseClient();
  const { count, error } = await supabase
    .from("salons")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true)
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  if (error) {
    console.error("[salonCardData] getNearbyTeaserCount fetch failed:", error);
    return null;
  }
  return count ?? null;
}
