"use client";

import { useLocale } from "next-intl";
import { Section, SectionTitle, SectionFrame } from "./SectionHeader";
import NearbyMap, { type NearbyMapSalon } from "./NearbyMap";
// NEARBY_SALON_IDS is a plain value module (no server-only imports), legal
// to import directly into this "use client" file. salonCardData.ts stays a
// type-only import: it's a Server module (next/headers via createServerSupabaseClient),
// so only its types (erased at compile time) may cross into the client bundle.
import { NEARBY_SALON_IDS } from "./nearbySalonIds";
import type { SalonCardDataMap } from "./salonCardData";

/**
 * In der Nähe - V3 (LIVE_TRUTH §Q51.2), MAP ONLY since 2026-08-05.
 *
 * A4 (owner 2026-08-05, verbatim): "I want to actually remove the in your near, make it just a
 * map, so people just gonna click on the map and open it". The horizontal SalonCard rail that
 * used to sit under the map is REMOVED (15 cards, 249.6px tall at 375 / 264px at 402). He
 * overruled the objection that the bookable per-salon tap-through goes with it. The map is the
 * tap target and always was: NearbyMap.tsx renders the whole tile as one `<a href>` to
 * `/{locale}/search?view=map` (measured live before this change: 343x156 at 375, 370x156 at 402),
 * so nothing new had to be wired for "click on the map and open it".
 *
 * Three things went WITH the cards because the cards were their only consumer, and leaving them
 * would be exactly the silent no-op this project's CLAUDE.md names as its #1 failure mode:
 *   1. `ScrollRow` + its `scrollRef` (SectionTitle renders desktop scroll-circle buttons only
 *      when a scrollRef is passed; with no row to scroll those would be dead affordances).
 *   2. The V3-D348 `sortByCategoryPicks` bend and the `useCustomerPrefs` fetch that fed it. Its
 *      only remaining output would have been the ORDER of the map's salon array, and NearbyMap
 *      re-sorts that array itself by review count for its de-collide pass while its centre is a
 *      plain mean, so the pref order provably changed nothing on screen.
 *   3. The `prefsOverride` test seam (no caller anywhere; RecentlyViewed.tsx and
 *      MobileCategoriesRow.tsx keep their own, untouched).
 *
 * NEARBY_SALON_IDS (nearbySalonIds.ts) is still the curated source of truth for WHICH salons are
 * here; coordinates/rating/review count come live from salonData (getSalonCardDataMap, batch-
 * fetched server-side in page.tsx). The name/slug/category validity gate below is kept verbatim
 * from the card rail on purpose, so the set of markers is identical to what shipped before.
 *
 * Real geo-distance ordering remains Phase 2 work.
 */

export default function Nearby({
  salonData = {},
  nearbyCount = null,
}: {
  /** Real coordinates/rating per salon id, batch-fetched server-side in page.tsx. */
  salonData?: SalonCardDataMap;
  /** Real count of active salons with coordinates (getNearbyTeaserCount in
   *  page.tsx), for the map-teaser label. Null/absent renders the count-free
   *  "Karte öffnen" label instead of a fabricated number. */
  nearbyCount?: number | null;
} = {}) {
  const locale = useLocale();
  // Real coordinates only; a salon with no lat/lng gets no marker, never a fake one. The
  // name/slug/category check is the same completeness gate the removed card rail applied, kept
  // so the marker set does not change with the cards.
  const mapSalons: NearbyMapSalon[] = NEARBY_SALON_IDS.map((id) => {
    const real = salonData[id];
    if (!real || !real.name || !real.slug || !real.category) return null;
    if (real.latitude == null || real.longitude == null) return null;
    return {
      id,
      latitude: real.latitude,
      longitude: real.longitude,
      rating: real.rating,
      reviewCount: real.reviewCount,
    };
  }).filter((s): s is NearbyMapSalon => s !== null);

  return (
    // V3-D120 (2026-05-24): section bg tint REMOVED per user "remove these
    // color dividing things." Future-state homepage = all-white substrate,
    // teal section-arrow buttons + typography rhythm carry section breaks.
    <Section>
      <SectionFrame>
        {/* linkPlacement="inline": with the card rail gone there is nothing to scroll, so this
            section has no scrollRef, and without one SectionTitle's right-hand slot would print
            the "Alle in deiner Nähe" text link at EVERY width. Measured at 402x874 before this
            line was added: the row showed the title chevron and that text link, both pointing at
            the same href, where every other rail on the page shows the chevron alone. The header
            now renders exactly as it did before the cards were removed. */}
        <SectionTitle
          title="In der Nähe"
          link={{ label: "Alle in deiner Nähe →", href: `/${locale}/search?nearby=true` }}
          linkPlacement="inline"
        />
        {/* mockup-ok: real Mapbox teaser (NearbyMap.tsx), owner-approved 2026-07-15
            per that component's header. Replaces the fabricated CSS-grid plus 3
            fixed MapPins block that shipped before it (V3-D348 tweak #2 origin). */}
        <NearbyMap
          salons={mapSalons}
          href={`/${locale}/search?view=map`}
          ariaLabel="Stores in der Nähe auf der Karte ansehen"
          countLabel={nearbyCount != null ? `${nearbyCount} Stores in der Nähe` : "Karte öffnen"}
        />
      </SectionFrame>
    </Section>
  );
}
