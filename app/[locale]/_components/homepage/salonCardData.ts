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
// reinvent-ok: SALON_CATEGORY_SLUGS is the CANONICAL category-slug source (lib/validations.ts,
// the same enum safeCategory() above validates against) - reused here rather than a new
// inline ["coiffeur","barbershop","nails","spa"] array, per the owner's reinvent-data rule.
import { SALON_CATEGORY_SLUGS } from "@/lib/validations";
import {
  minPriceService,
  MIN_PRICE_SERVICE_COLUMNS,
  type PricedServiceRow,
  type ServiceNameLocale,
} from "@/lib/min-price-service";

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
  /** Name of the service that priceFromCHF came from, in all four locales. Art. 13 PBV: an
   *  advertised from-price must name the concrete offer it buys. Null when the salon has no
   *  active service. Read it with nameForLocale() rather than indexing by hand, so the de/en
   *  fallback stays in one place. */
  priceFromServiceNames: Record<ServiceNameLocale, string | null> | null;
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
        // The service names travel with the price because Art. 13 PBV makes a from-price lawful
        // in advertising only when the copy names the concrete offer it buys. This query used to
        // select the price alone, so the homepage card could never render the service even while
        // the API half was working. Column list and the pick rule now both come from
        // lib/min-price-service.ts, shared with app/api/salons/route.ts, because two independent
        // copies of one legal rule is how they drifted to different locale coverage.
        .from("services")
        .select(`salon_id, ${MIN_PRICE_SERVICE_COLUMNS}`)
        .eq("is_active", true)
        .in("salon_id", uniqueIds),
    ]);

  if (salonsError) console.error("[salonCardData] salons fetch failed:", salonsError);
  if (servicesError) console.error("[salonCardData] services fetch failed:", servicesError);

  // Cheapest active service price per salon, computed in JS from the bulk
  // services result (same shape as buildPriceTask() in app/api/salons/route.ts).
  const rowsBySalon = new Map<string, PricedServiceRow[]>();
  for (const svc of services ?? []) {
    const salonId = svc.salon_id as string;
    const list = rowsBySalon.get(salonId);
    if (list) list.push(svc as PricedServiceRow);
    else rowsBySalon.set(salonId, [svc as PricedServiceRow]);
  }
  const minBySalon = new Map<string, ReturnType<typeof minPriceService>>();
  for (const [salonId, rows] of rowsBySalon) minBySalon.set(salonId, minPriceService(rows));

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
      priceFromCHF: minBySalon.get(salon.id as string)?.minPrice ?? null,
      priceFromServiceNames: minBySalon.get(salon.id as string)?.names ?? null,
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

/**
 * I4 (home rails reconciliation, RecentlyViewedTiles.tsx's city cell): count of active salons in
 * Basel, the only active city right now (_plans/HOME_V3_CATEGORY_MAP.md ask 1/1b: the Städte row
 * was removed precisely because Basel is the sole real city and a list of empty cities would be
 * dishonest). Same postal-code-prefix heuristic postalToCity() (../salon/_shared.ts) already uses
 * site-wide to bridge a salon to a city label ("4" -> Basel), not a new city-matching mechanism.
 * head/count query, no rows fetched, same shape as getNearbyTeaserCount above. Null on error, so
 * the caller can render a count-free label instead of a fabricated number.
 */
export async function getBaselShopCount(): Promise<number | null> {
  const supabase = await createServerSupabaseClient();
  const { count, error } = await supabase
    .from("salons")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true)
    .like("postal_code", "4%");

  if (error) {
    console.error("[salonCardData] getBaselShopCount fetch failed:", error);
    return null;
  }
  return count ?? null;
}

/**
 * I3 (home rails reconciliation): real salon ids with a live `status='available'`
 * booking slot inside the next 7 days, ordered by rating desc, for the homepage
 * "Available this week" rail. Same 7-day bound + membership test as
 * CategoryMobileRails.tsx's own per-category "Available this week" rail
 * (`salons_with_slot_in_hours` RPC, already granted to anon/authenticated/
 * service_role, migration 20260607182403_add_salons_with_slot_in_hours_rpc.sql),
 * just scoped across every category instead of one route. The RPC returns
 * DISTINCT salon_ids with a real slot in the window; no per-service slot label
 * is fetched because this rail only needs membership + rating order, not a
 * "next slot" caption. Returns [] on any error, so the caller self-hides.
 */
export async function getAvailableThisWeekSalonIds(limit: number): Promise<string[]> {
  const supabase = await createServerSupabaseClient();
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const { data: slotRows, error: slotError } = await supabase.rpc("salons_with_slot_in_hours", {
    p_start_hour: 0,
    p_end_hour: 24,
    p_from: now.toISOString(),
    p_to: weekFromNow.toISOString(),
  });
  if (slotError) {
    console.error("[salonCardData] getAvailableThisWeekSalonIds RPC failed:", slotError);
    return [];
  }
  const ids = [...new Set((slotRows ?? []).map((row) => row.salon_id))];
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from("salons")
    .select("id")
    .eq("is_active", true)
    .in("id", ids)
    .order("average_rating", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[salonCardData] getAvailableThisWeekSalonIds salons fetch failed:", error);
    return [];
  }
  return (data ?? []).map((row) => row.id as string);
}

/**
 * I3 (home rails reconciliation): top-rated salon ids per category, for the
 * homepage's four "Top <Category>" rails. Same shape as CategoryMobileRails.tsx's
 * own `top` calc (average_rating != null, sorted desc, no review-count floor ,
 * unlike getTopSalonIds' cross-category "Top auf Solen" fallback above, which
 * does apply an 8-review floor), just computed for all 4 categories in one query
 * instead of one API call per category route. A salon carrying more than one
 * category (e.g. coiffeur + barbershop) can legally appear in more than one
 * rail, same as the real per-category rails already do. Returns an
 * all-empty-arrays map on error, so every rail self-hides rather than crashing.
 */
export async function getTopSalonIdsByCategory(limit: number): Promise<Record<SalonCardCategory, string[]>> {
  const result: Record<SalonCardCategory, string[]> = { coiffeur: [], barbershop: [], nails: [], spa: [] };
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("salons")
    .select("id, categories, average_rating")
    .eq("is_active", true)
    .not("average_rating", "is", null)
    .order("average_rating", { ascending: false })
    .limit(500);

  if (error) {
    console.error("[salonCardData] getTopSalonIdsByCategory fetch failed:", error);
    return result;
  }
  for (const row of data ?? []) {
    const cats = (row.categories as string[] | null) ?? [];
    for (const cat of SALON_CATEGORY_SLUGS as SalonCardCategory[]) {
      if (cats.includes(cat) && result[cat].length < limit) {
        result[cat].push(row.id as string);
      }
    }
  }
  return result;
}
