// Grounded-in: app/[locale]/page.tsx (the real homepage: chrome, section order and real data
// loaders this direction copies), app/[locale]/_components/homepage/RecentlyViewed.tsx,
// TopCategoryRails.tsx, SalonOfMonth.tsx, SalonCard.tsx, SectionHeader.tsx (the real components
// this direction's own _vb/*Airbnb.tsx files fork, see each file's own header for its exact diff).
//
// Exists-check: ran `npm run exists home` (the real homepage + its ~40 section components, all
// real, reused below) and `npm run exists directions-0905` (1 REMOVED hit, an unrelated earlier
// single-treatment batch, not re-proposed; DirectionFrame, the shared scaffold, reused unchanged
// by the sibling page.tsx). No home-surface entry under this comparison route existed before this
// pass. This REPLACES this direction's own prior pass (same file, same folder): that pass kept
// every Airbnb value inside Solen's own locks (section heading kept at the locked clamp size, card
// ratio kept at the locked 5:4, ink kept at the locked #0A0A0A), which is exactly the failure this
// round's brief names: every builder resolving every Airbnb value back to a Solen lock, so the
// Airbnb look never actually appeared anywhere. This pass is LOOK-FULL: those three locks plus
// card shadow are broken on purpose, listed below and inline in each forked file.
//
// Depicts: search pill chrome -> app/[locale]/_components/homepage/HomeSearchPill.tsx (real, unmodified, same as app/[locale]/page.tsx; a dated owner decision this direction keeps).
// Depicts: category pill row chrome -> app/[locale]/_components/layout/CategoryPillRow.tsx (real, unmodified, same as app/[locale]/page.tsx).
// Depicts: continue card -> app/[locale]/_components/homepage/ContinueCard.tsx (real, unmodified; self-hides with no persisted state).
// Depicts: category icon tiles -> app/[locale]/_components/homepage/MobileCategoriesRow.tsx (real, unmodified).
// Depicts: personalised affinity row -> app/[locale]/_components/homepage/ForYouAffinityRow.tsx (real, unmodified; self-hides for a signed-out visitor).
// Depicts: onboarding-interest rows -> app/[locale]/_components/homepage/ForYouSalonRows.tsx (real, unmodified; self-hides with no saved picks).
// Depicts: nearby map teaser -> app/[locale]/_components/homepage/Nearby.tsx (real, unmodified; map only, no card rail per the 2026-08-05 owner removal).
// Depicts: photo-look grid -> app/[locale]/_components/homepage/dynamic/PopularLooksLazy.tsx (real, unmodified).
// Depicts: walk-in band -> app/[locale]/_components/homepage/WalkInBand.tsx (real, unmodified; fetches GET /api/walkin/nearby).
// Depicts: reviews carousel -> app/[locale]/_components/homepage/Reviews.tsx (real, unmodified; fetches GET /api/reviews/featured).
// Depicts: business teaser -> app/[locale]/_components/homepage/BusinessTeaser.tsx (real, unmodified; desktop only, matches the live page).
// Depicts: salon-of-month card -> ./SalonOfMonthAirbnb.tsx (fork of the real SalonOfMonth.tsx, see its own header).
// Depicts: recently-viewed rail -> ./RecentlyViewedAirbnb.tsx (fork of the real RecentlyViewed.tsx, see its own header).
// Depicts: category rails -> ./TopCategoryRailsAirbnb.tsx (fork of the real TopCategoryRails.tsx, see its own header).
// Depicts: real salon data batch -> app/[locale]/_components/homepage/salonCardData.ts getTopSalonIds/getTopSalonIdsByCategory/getSalonCardDataMap (same functions app/[locale]/page.tsx calls).
//
// Direction: Airbnb look, FULL STRENGTH (LOCK MODE: LOOK-FULL). The ONE idea: the live chrome and
// the live section order, unchanged, with every SalonCard-bearing section restyled through the
// Airbnb recipe at full strength rather than resolved back to Solen's own locks. This is what
// Airbnb style would actually do to our home, shown so the owner can judge it on his phone.
//
// Sources: _design-system/references/fresha--home.md (placement: chrome above the feed is kept,
// this direction does not touch structure) and _design-system/references/airbnb--look-recipe.md +
// _design-system/references/airbnb--home-mobile.md (every value cited inline in the four forked
// files: SalonCardAirbnb.tsx, SectionPrimitivesAirbnb.tsx, RecentlyViewedAirbnb.tsx,
// TopCategoryRailsAirbnb.tsx).
//
// Conflicts (locks broken on purpose, LOOK-FULL, consolidated from the forked files, each also
// marked inline at its exact line in its own file):
//   1. lock: SalonCard photo ratio 5:4 broken on purpose: reference value = Airbnb near-square
//      1.053 (look-recipe #12, home-mobile.md). SalonCardAirbnb.tsx.
//   2. lock: SalonCard radius 22px broken on purpose: reference value = Airbnb 20px (look-recipe
//      #9). SalonCardAirbnb.tsx.
//   3. lock: SalonCard shadow-whisper/shadow-elevation-2 broken on purpose: reference value =
//      Airbnb flat, zero shadow (look-recipe #10). SalonCardAirbnb.tsx.
//   4. lock: ink #0A0A0A (LOCKFILE frozen literal) broken on purpose, on card name/price and
//      section titles: reference value = Airbnb rgb(34,34,34)/#222222 (look-recipe #5).
//      SalonCardAirbnb.tsx, SectionPrimitivesAirbnb.tsx.
//   5. lock: section-H2 clamp(18px,2vw,20px)/600 broken on purpose: reference value = Airbnb
//      22px/600, line-height 26px (look-recipe #2). SectionPrimitivesAirbnb.tsx.
//   6. lock: rail card-count-per-viewport about 1.6 broken on purpose: reference value = Airbnb's
//      measured about 2.2 cards visible across 390 (home-mobile.md). RecentlyViewedAirbnb.tsx,
//      TopCategoryRailsAirbnb.tsx.
//   7. lock: section-to-section spacing mb-4 (16px) broken on purpose: reference value = the
//      Airbnb review-rhythm number (35+24, rounded to 32+24=56) applied as the inter-section gap
//      (look-recipe #17), the only Airbnb page-rhythm number this capture measured.
//      SectionPrimitivesAirbnb.tsx.
//   Kept, not broken: the home chrome (search pill, category pill row), the see-all ink-arrow
//   circle (already Solen's own Airbnb-derived recipe), secondary/meta text color (already close
//   to Airbnb's per the look-recipe's own port map), the button/chip 16px radius, the type family
//   (Inter/Inter Tight), no dark mode, WCAG AA text contrast, real data only, no hardcoded image
//   src.
//
// Floors (customer-screen finished-pass, per this surface's own brief): (a) photo focal, every
// SalonCardAirbnb's near-square photo is the largest element per card and the widened-visible-rail
// raises this screen's photographic share above the live page's own. (b) one biggest element, the
// section title / see-all pairing is subordinate to the photo rail beneath it on every section.
// (c) real number, salon ratings, review counts and CHF prices are all live salonCardData batch
// data, never an invented value. (d) semantic colour, the pale-terracotta discount pill on
// SalonCardAirbnb (unchanged from the real SalonCard) plus the yellow rating star. (e) no
// dead-grey zone, every rendered section is either a real photo rail, a real editorial card, or a
// real review/walk-in band. (f) worst-case content, SalonCardAirbnb's own truncate/line-clamp
// rules are byte-identical to the real SalonCard's (untouched in this fork) and already hold the
// longest real seeded name/address there.
//
// No em-dashes. English copy only (all rendered strings are the real i18n keys or CATEGORY_ROUTE
// English labels the real components this forks already use).

import HomeSearchPill from "@/app/[locale]/_components/homepage/HomeSearchPill";
import CategoryPillRow from "@/app/[locale]/_components/layout/CategoryPillRow";
import ContinueCard from "@/app/[locale]/_components/homepage/ContinueCard";
import MobileCategoriesRow from "@/app/[locale]/_components/homepage/MobileCategoriesRow";
import ForYouAffinityRow from "@/app/[locale]/_components/homepage/ForYouAffinityRow";
import ForYouSalonRows from "@/app/[locale]/_components/homepage/ForYouSalonRows";
import Nearby from "@/app/[locale]/_components/homepage/Nearby";
import PopularLooksLazy from "@/app/[locale]/_components/homepage/dynamic/PopularLooksLazy";
import WalkInBand from "@/app/[locale]/_components/homepage/WalkInBand";
import Reviews from "@/app/[locale]/_components/homepage/Reviews";
import BusinessTeaser from "@/app/[locale]/_components/homepage/BusinessTeaser";
import { FORYOU_SALONS } from "@/app/[locale]/_components/homepage/forYouSalons";
import { NEARBY_SALON_IDS } from "@/app/[locale]/_components/homepage/nearbySalonIds";
import {
  getSalonCardDataMap,
  getTopSalonIds,
  getNearbyTeaserCount,
  getTopSalonIdsByCategory,
} from "@/app/[locale]/_components/homepage/salonCardData";
import { FeedZone } from "./SectionPrimitivesAirbnb";
import RecentlyViewedAirbnb from "./RecentlyViewedAirbnb";
import TopCategoryRailsAirbnb from "./TopCategoryRailsAirbnb";
import SalonOfMonthAirbnb from "./SalonOfMonthAirbnb";

export default async function HomeDirectionB({ locale }: { locale: string }) {
  const [topSalonIds, nearbyCount, topByCategory] = await Promise.all([
    getTopSalonIds(4),
    getNearbyTeaserCount(),
    getTopSalonIdsByCategory(10),
  ]);
  const salonCardData = await getSalonCardDataMap([
    ...Object.values(FORYOU_SALONS).flatMap((list) => list.map((s) => s.id)),
    ...NEARBY_SALON_IDS,
    ...topSalonIds,
    ...Object.values(topByCategory).flat(),
  ]);

  return (
    <>
      <div className="bg-white">
        <HomeSearchPill locale={locale} />
      </div>
      <CategoryPillRow />
      <div className="relative overflow-hidden bg-white">
        <FeedZone>
          <ContinueCard />
          <MobileCategoriesRow />
          <SalonOfMonthAirbnb locale={locale} />
          <ForYouAffinityRow />
          <ForYouSalonRows salonData={salonCardData} />
          <RecentlyViewedAirbnb salonData={salonCardData} topSalonIds={topSalonIds} />
          <Nearby salonData={salonCardData} nearbyCount={nearbyCount} />
          <TopCategoryRailsAirbnb salonData={salonCardData} idsByCategory={topByCategory} />
          <PopularLooksLazy />
          <WalkInBand />
          <Reviews />
          <div className="max-md:hidden">
            <BusinessTeaser />
          </div>
        </FeedZone>
      </div>
    </>
  );
}
