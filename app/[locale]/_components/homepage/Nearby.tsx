"use client";

import { useLocale } from "next-intl";
import { Section, SectionFrame } from "./SectionHeader";
import NearbyMap, { type NearbyMapSalon } from "./NearbyMap";
// The city name comes from the ONE canonical city table (lib/cities.ts), read through the same
// DEFAULT_CITY_SLUG every other surface resolves against, rather than a second "Basel" typed into
// a component. RecentlyViewedTiles.tsx hardcodes its own "Basel" string; that one is pre-existing
// and left alone here, but this new label does not add a third source of truth for the same fact.
import { CITIES, DEFAULT_CITY_SLUG } from "@/lib/cities";
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
  // Localised city name off the canonical table. `name_de` is the fallback for the three locales
  // that do not have their own key rather than an invented string.
  const cityRow = CITIES[DEFAULT_CITY_SLUG];
  const CITY =
    (locale === "en" ? cityRow?.name_en
      : locale === "fr" ? cityRow?.name_fr
      : locale === "it" ? cityRow?.name_it
      : cityRow?.name_de) ?? cityRow?.name_de ?? "";
  // Real coordinates only; a salon with no lat/lng gets no marker, never a fake one. The
  // name/slug/category check is the same completeness gate the removed card rail applied, kept
  // so the marker set does not change with the cards.
  //
  // COUNT NOTE (2026-09-04): this tile's own label now matches its own pins (M1, 2026-08-11), but
  // it does NOT match the count on the page its tap-through opens (`/search?view=map`, no filters,
  // which lists every active Basel salon). Measured live the same day: this curated list draws 15
  // (all 15 NEARBY_SALON_IDS pass the completeness check), the map page lists 20 (every is_active
  // Basel row, all 20 of which already carry coordinates). This is NOT a viewport/bounds filter,
  // NEARBY_SALON_IDS is a hand-picked subset that was never kept in sync with the live roster as
  // salons were added. Reconciling it means either widening this curated list to the full active
  // set (dropping the "curated teaser" concept) or relabeling the tile as a subset ("15 of 20"),
  // both product decisions, not a bug fix, so left for an explicit call rather than changed here.
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
        {/* mockup-ok , owner 2026-08-10, verbatim: "in your near thing, like, remove and just make
            it maps... I don't even want an arrow. I just want, like, a map. Like, just like a box,
            click on it, and it just opens the map. And I also want it to be more like city and,
            like, it shows, like, which city it is."

            So the SectionTitle is gone: no heading, no arrow. This is his SECOND pass on this
            section. On 2026-08-05 (A4) he took the salon card rail out and kept the map; now the
            chrome around the map goes too and the box carries its own label.

            The heading is not replaced with anything, and that is a decision rather than an
            oversight. FLOORS LAW 5 says a deletion must name what the screen KEEPS: it keeps 156px
            of live Mapbox tiles with real markers on them, plus a chip that now names the city. A
            map does not need a word above it saying it is a map. The one real cost, named rather
            than hidden: this section stops contributing a text anchor to the page's heading
            rhythm, so the sections above and below it sit closer in visual weight than before.

            "Click it and it opens the map" already held and still does: NearbyMap renders the
            whole tile as a single <a href> (measured 343x156 at 375 wide), so nothing new is
            wired here, the chrome around it is simply gone. */}
        <NearbyMap
          salons={mapSalons}
          href={`/${locale}/search?view=map`}
          ariaLabel={`Salons in ${CITY} auf der Karte ansehen`}
          // The CITY leads, because naming the city is the thing he asked for. The count follows
          // and drops out entirely rather than being invented. No separator dot between them: they
          // already differ in weight, and taste rule 2 says that contrast IS the separator.
          //
          // M1 (2026-08-11): the tile now counts what it DRAWS. The sweep found three different
          // numbers for one thing: the label said 20 Stores (a live count of every active salon
          // carrying coordinates), the tile plotted 15 pins (this id list, filtered for
          // completeness), and tapping through opened a map showing 12. Each number was honest on
          // its own and none of them agreed, which is exactly the kind of claim this project bans.
          // The label reads off `mapSalons` now, the same array handed to the map beside it, so the
          // number and the picture cannot drift apart. `nearbyCount` stays a prop for any caller
          // that wants the countrywide figure.
          countLabel={CITY}
          countSubLabel={mapSalons.length > 0 ? `${mapSalons.length} Salons` : null}
        />
      </SectionFrame>
    </Section>
  );
}
