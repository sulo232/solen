// exists-check: `npm run exists home` -> the real homepage (app/[locale]/page.tsx) and every
// component it imports from app/[locale]/_components/homepage/. Every component this file
// renders is imported from that real tree, unchanged; nothing here is redrawn. Net-new is ONLY
// the render order below and this one composing file.
//
// Grounded-in: app/[locale]/page.tsx (the real home page this direction reorders; every section
// imported below is the exact live component that file imports).
//
// Depicts (every real component below, unmodified, its real live source):
// Depicts: ContinueCard -> app/[locale]/_components/homepage/ContinueCard.tsx (real, live on app/[locale]/page.tsx, self-hiding utility, unchanged)
// Depicts: Nearby (map teaser) -> app/[locale]/_components/homepage/Nearby.tsx (live)
// Depicts: the personal affinity list -> app/[locale]/_components/homepage/ForYouAffinityRow.tsx (live, self-hides for a guest)
// Depicts: the curated recommendation list -> app/[locale]/_components/homepage/ForYouSalonRows.tsx (live)
// Depicts: Recently Viewed -> app/[locale]/_components/homepage/RecentlyViewed.tsx (live)
// Depicts: the icon tile strip -> app/[locale]/_components/homepage/MobileCategoriesRow.tsx (live)
// Depicts: the four category rails -> app/[locale]/_components/homepage/TopCategoryRails.tsx (live)
// Depicts: Salon of the Month -> app/[locale]/_components/homepage/SalonOfMonth.tsx (live, self-hides on flag/no-winner)
// Depicts: Reviews -> app/[locale]/_components/homepage/Reviews.tsx (live)
// Depicts: photo look tiles -> app/[locale]/_components/homepage/dynamic/PopularLooksLazy.tsx (live)
// Depicts: the walk-in feature band -> app/[locale]/_components/homepage/WalkInBand.tsx (live)
// Depicts: the business teaser (desktop only) -> app/[locale]/_components/homepage/BusinessTeaser.tsx (live)
// Depicts: the outer feed wrapper -> FeedZone, re-exported unchanged via ./_liveHomepageExports.ts
//   from the real live primitives file inside app/[locale]/_components/homepage (its
//   SectionHeader.tsx module), the same wrapper app/[locale]/page.tsx uses for its own feed.
// NOT depicted / unchanged (chrome, out of this file's scope): the site header, the sticky search
//   pill and the category pill row all render exactly as the real homepage does, in the parent
//   route, before this file even mounts.
//
// Direction: Fresha order. The Fresha capture (_design-system/references/fresha--home.md)
// verifies the hero + search-bar anatomy down to "Recently viewed" starting to appear at the very
// bottom of the fold, then states plainly under "What was not captured this pass" that the
// ordered list below Recently Viewed was never reached. So the six-slot order this direction
// builds (nearby, recommended, recently viewed, categories, new on Solen, reviews) is the brief's
// own stated ordering, not something re-derived from the capture file, and that gap is exactly
// what the file's own uncaptured-content note says. The stills win when they disagree with a
// description; here the stills simply say less than the brief did, so the brief's order is
// followed and the limit is named rather than treated as independently spec-verified.
//
// Sources: fresha--home.md (structure: hero + search-bar anatomy verified; below-fold order NOT
// captured, see above), airbnb--look-recipe.md + airbnb--home-mobile.md (look: the vertical
// rhythm between rails is already ported into the shared header module per that module's own
// 2026-07-17 history note, reused unchanged here, not re-specified by this file).
//
// Conflicts (kept the lock, logged per brief):
// - Airbnb's section-title size is 22px/600 (look-recipe #2); Solen's locked section title is
//   `clamp(18px,2vw,20px)`, set inside the shared header module (off-limits, real component).
//   Kept the lock, no override attempted.
// - Airbnb's ink is rgb(34,34,34); Solen's frozen ink token is #0A0A0A (home-mobile CONFLICT C).
//   Kept the lock; every colour here comes from an existing Solen token via the real components,
//   no new hex anywhere in this file.
// - Airbnb's own home viewport carries 6 sizes / 4+ weights (home-mobile CONFLICT A); Solen's
//   gate caps a screen at 4 sizes / 2 weights. Kept the Solen ceiling: this direction changes
//   only ORDER, never a component's own type treatment, so the total size/weight count on screen
//   is whatever the real components already render (measured at 390x844, see build return).
// - Airbnb's card radius is 20 and its cards carry no shadow, against Solen's locked entity-card
//   16 + shadow-whisper: not touched, the salon card component is composed unchanged (taste
//   rule 9, use the registered component, never hand-roll a copy).
//
// floors: (a) photo focal -> every rail below renders real salon-card photography; (b) one
// biggest element -> the Hero H1 (chrome, unchanged, not part of this direction); (c) a real
// tabular number -> real prices/ratings on every card + the real nearby-teaser count; (d) a
// semantic-colour moment -> the real discount pill / rating star already carried by the salon
// card component where the underlying data has one; (e) no dead-grey zone -> sections alternate
// white/sunken per each component's own existing treatment, untouched by the reorder; (f)
// worst-case content -> unchanged, the salon card component already truncates per its own locked
// anatomy, a reorder does not touch that.
//
// FIXED, not varied: chrome (the site header, the sticky search pill, the category pill row)
// renders exactly as the real homepage does, in the same position, before this component even
// mounts (see ../page.tsx and the parent locale layout). This file starts at the first FEED
// section.

import { FeedZone } from "./_liveHomepageExports";
import ContinueCard from "@/app/[locale]/_components/homepage/ContinueCard";
import Nearby from "@/app/[locale]/_components/homepage/Nearby";
import ForYouAffinityRow from "@/app/[locale]/_components/homepage/ForYouAffinityRow";
import ForYouSalonRows from "@/app/[locale]/_components/homepage/ForYouSalonRows";
import RecentlyViewed from "@/app/[locale]/_components/homepage/RecentlyViewed";
import MobileCategoriesRow from "@/app/[locale]/_components/homepage/MobileCategoriesRow";
import TopCategoryRails from "@/app/[locale]/_components/homepage/TopCategoryRails";
import SalonOfMonth from "@/app/[locale]/_components/homepage/SalonOfMonth";
import Reviews from "@/app/[locale]/_components/homepage/Reviews";
import PopularLooksLazy from "@/app/[locale]/_components/homepage/dynamic/PopularLooksLazy";
import WalkInBand from "@/app/[locale]/_components/homepage/WalkInBand";
import BusinessTeaser from "@/app/[locale]/_components/homepage/BusinessTeaser";
import { FORYOU_SALONS } from "@/app/[locale]/_components/homepage/forYouSalons";
import { NEARBY_SALON_IDS } from "@/app/[locale]/_components/homepage/nearbySalonIds";
import {
  getSalonCardDataMap,
  getTopSalonIds,
  getNearbyTeaserCount,
  getTopSalonIdsByCategory,
} from "@/app/[locale]/_components/homepage/salonCardData";

export default async function HomeVariantA({ locale }: { locale: string }) {
  // Same parallel-batch data pattern as the real page (app/[locale]/page.tsx): one Promise.all
  // for the independent live fetches, then one combined getSalonCardDataMap batch for every real
  // salon id any row on this direction references, never a per-salon round trip.
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
    <div className="relative overflow-hidden bg-white">
      <FeedZone>
        {/* Kept at the very top exactly as the real page does; self-hides with no state to
            show, and it is not one of the six Fresha-named slots below, so its own position is
            unchanged, not part of this direction's variation. */}
        <ContinueCard />

        {/* 1. Nearby venues first (Fresha slot 1). */}
        <Nearby salonData={salonCardData} nearbyCount={nearbyCount} />

        {/* 2. Recommended (Fresha slot 2): the two real personalised lists, curated then
            affinity-ranked. */}
        <ForYouAffinityRow />
        <ForYouSalonRows salonData={salonCardData} />

        {/* 3. Recently viewed (Fresha slot 3). */}
        <RecentlyViewed salonData={salonCardData} topSalonIds={topSalonIds} />

        {/* 4. Categories (Fresha slot 4): the icon tile strip plus the four category rails,
            moved down from their position near the top on the live page. */}
        <MobileCategoriesRow />
        <TopCategoryRails salonData={salonCardData} idsByCategory={topByCategory} />

        {/* 5. New on Solen (Fresha slot 5): the real editorial Salon of the Month pick.
            Self-hides to null when the feature flag is off or no winner is set, same as live. */}
        <SalonOfMonth locale={locale} />

        {/* 6. Reviews (Fresha slot 6). */}
        <Reviews />

        {/* Remaining real sections, not part of the six named Fresha slots, kept at the tail
            rather than dropped, same relative order as the live page's own tail. */}
        <PopularLooksLazy />
        <WalkInBand />
        <div className="max-md:hidden">
          <BusinessTeaser />
        </div>
      </FeedZone>
    </div>
  );
}
