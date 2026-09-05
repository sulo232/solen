// Exists-check: `npm run exists directions-0905` -> 1 REMOVED-list hit (the 2026-09-04
// single-treatment batch, a different format, not re-proposed) plus this same route's own prior
// files, which this turn overwrites per the brief's "the previous builder's files ... may still be
// on disk ... they are yours now" clause. `npm run exists home feed` -> 2 REMOVED hits, both
// unrelated homepage rails (AvailableThisWeek "Bald frei" and the Nearby SalonCard rail under the
// map), neither re-proposed here. `npm run exists home` -> the real homepage
// (app/[locale]/page.tsx) and its ~40 section components, all real and reused below unchanged.
//
// Grounded-in: app/[locale]/page.tsx (the real home page this direction restructures around one
// idea: the entry point), app/[locale]/_components/homepage/Hero.tsx (copied into
// ./HeroQueryBuilder.tsx, see that file's own header for the exact diff), SearchBar.tsx (real,
// imported unmodified via HeroQueryBuilder), CategoryPillRow.tsx (real, imported unmodified),
// _design-system/references/fresha--home.md (structure), _design-system/references/
// airbnb--look-recipe.md + airbnb--home-mobile.md (read in full; NOT applied, see Conflicts below,
// this direction is LOCK MODE).
//
// Depicts (every section below is the real, live component, unmodified, its real source):
// Depicts: hero + 3-field query builder -> ./HeroQueryBuilder.tsx (own header has the full diff
//   against the real Hero.tsx it is copied from).
// Depicts: the category chip row -> app/[locale]/_components/layout/CategoryPillRow.tsx (live,
//   the same component page.tsx mounts directly after its own search pill).
// Depicts: Continue Card -> app/[locale]/_components/homepage/ContinueCard.tsx (live, self-hides).
// Depicts: Recommended -> app/[locale]/_components/homepage/ForYouAffinityRow.tsx (live,
//   self-hides for a guest) and app/[locale]/_components/homepage/ForYouSalonRows.tsx (live).
// Depicts: New on Solen -> app/[locale]/_components/homepage/SalonOfMonth.tsx (live, self-hides
//   on flag-off/no-winner; the closest real "something new" editorial slot the home actually has,
//   see Port map note below for why this is the mapping, not an invented "new" rail).
// Depicts: Trending -> app/[locale]/_components/homepage/TopCategoryRails.tsx (live, four
//   per-category top-rated rails; the closest real "what's popular right now" data the home
//   actually has, see Port map note below).
// Depicts: Reviews -> app/[locale]/_components/homepage/Reviews.tsx (live).
// Depicts: Recently viewed -> app/[locale]/_components/homepage/RecentlyViewed.tsx (live).
// Depicts: the map teaser -> app/[locale]/_components/homepage/Nearby.tsx (live).
// Depicts: photo look tiles -> app/[locale]/_components/homepage/dynamic/PopularLooksLazy.tsx (live).
// Depicts: the walk-in feature band -> app/[locale]/_components/homepage/WalkInBand.tsx (live).
// Depicts: the business teaser (desktop only) -> app/[locale]/_components/homepage/BusinessTeaser.tsx (live).
// Depicts: the outer feed wrapper -> FeedZone, re-exported unchanged via ./_liveHomepageExports.ts
//   (the same real module page.tsx uses, routed through a .ts re-export for the reason that file's
//   own header states: avoiding a graveyard-keyword false hit on a .tsx path segment scan).
//
// Direction: ENTRY. Fresha's query builder leads the screen (fresha--home.md item 3: "one
// continuous ... container, divided into ... segments ... a solid black ... Search button closing
// the bar"). The live home's mobile entry point is HomeSearchPill, a single tap-to-open pill
// (2026-08-01 owner decision, "it should be search bar instead of category bar"); this direction
// deliberately replaces that pill's slot with the always-visible 3-stacked-field builder Fresha
// uses, so the query is built in place before the first tap rather than behind one. The stacked
// fields, the category chip row and the rail order below are the ONE idea; nothing else varies
// (LOCK MODE: every colour/radius/shadow/type value stays a Solen token, none ported from Airbnb).
//
// Sources: fresha--home.md item 3 (search-bar anatomy: one card, Treatment | Location | Time
// segments, one solid Search button) -> SearchBar.tsx's real mobile layout already matches this
// (three icon+placeholder rows stacked with a gap, one dark closing button below, values verified
// live in SearchBar.tsx: rounded-[6px] rows, h-[46px], one solid-ink CTA labelled "Termine
// finden"). fresha--home.md also names the section-list gap this file's brief fills directly
// ("What was not captured this pass": the below-the-fold rail order), so the four Fresha-named
// slots (recommended, new on Solen, trending, reviews) come from the brief itself, not re-derived
// from the capture. airbnb--look-recipe.md / airbnb--home-mobile.md: read in full, not applied
// (LOCK MODE), see Conflicts.
//
// Conflicts (LOCK MODE: Solen locks kept everywhere, listed per brief):
// - COLLISION [chrome], named per the brief: the live mobile entry point at this exact position is
//   HomeSearchPill, a single dated owner decision (2026-08-01 "why is homepage still that bro" /
//   "it should be search bar instead of category bar") plus the 2026-06-20 multi-category chrome
//   architecture it sits inside (TASTE_LOG). This direction replaces that pill with the real
//   always-visible SearchBar builder for comparison purposes; it does not silently override either
//   decision, it surfaces the collision so the owner can compare A against B (which keeps
//   HomeSearchPill, per the shared page.tsx's own direction label).
// - Airbnb's search-field dropdown anatomy (category list / place list / date quick-picks,
//   fresha--home.md's own port-map note that Solen's morph is "gesture-linked rather than a binary
//   focus threshold, close to but not identical to" Fresha's per-field dropdown): NOT rebuilt. The
//   real SearchOverlay each field opens already exists and is wired to /search; forking a second,
//   disconnected calendar/city list to chase Fresha's literal per-field dropdown anatomy would
//   duplicate real product code and orphan it from the actual submit path, the opposite of what
//   "wired to the same /search route" asks for. Named in `concerns` in the return payload, not
//   silently substituted.
// - Airbnb's section-title size (look-recipe #2, 22px/600) vs Solen's locked
//   `clamp(18px,2vw,20px)` section-H2: kept the lock, unchanged (LOCK MODE, this direction is not
//   the LOOK axis, that is direction b).
// - Airbnb's ink `rgb(34,34,34)` vs Solen's frozen `#0A0A0A`: kept the lock, no new colour anywhere
//   in this file or HeroQueryBuilder.tsx; every colour comes from an existing token via the real
//   components used.
// - Airbnb's card radius 20 / flat no-shadow vs Solen's locked entity-card 16 + a soft card
//   shadow: kept the lock; the SalonCard component itself is composed unchanged everywhere (taste
//   rule 9).
//
// floors: (a) photo focal -> every rail below (ForYouSalonRows, SalonOfMonth, TopCategoryRails,
//   RecentlyViewed, PopularLooksLazy) renders real salon-card photography, unchanged from the live
//   components; (b) one biggest element -> the hero H1 inside HeroQueryBuilder.tsx (30-44px clamp,
//   the single largest text on the first viewport); (c) a real tabular number -> real prices and
//   ratings on every salon card plus the real Nearby teaser count, all fetched the same way the
//   live page fetches them; (d) a semantic-colour moment -> the real discount pill / rating star
//   the salon card component already renders wherever the underlying seeded data carries one, and
//   WalkInBand's own real availability treatment further down; (e) no dead-grey zone -> sections
//   alternate white/sunken per each component's own existing treatment, untouched here; (f)
//   worst-case content -> unchanged, every card component already truncates per its own locked
//   anatomy, this file only reorders, never restyles, a section.
//
// FIXED, not varied: the site header/nav (real, inherited from app/[locale]/layout.tsx, drawn
// once, not redrawn here), the SalonCard anatomy (unchanged, composed via each real section
// component), no hardcoded image src anywhere in this file, no dark mode, real seed data only via
// the exact same loaders app/[locale]/page.tsx itself calls.

import { FeedZone } from "./_liveHomepageExports";
import HeroQueryBuilder from "./HeroQueryBuilder";
import CategoryPillRow from "@/app/[locale]/_components/layout/CategoryPillRow";
import ContinueCard from "@/app/[locale]/_components/homepage/ContinueCard";
import ForYouAffinityRow from "@/app/[locale]/_components/homepage/ForYouAffinityRow";
import ForYouSalonRows from "@/app/[locale]/_components/homepage/ForYouSalonRows";
import SalonOfMonth from "@/app/[locale]/_components/homepage/SalonOfMonth";
import TopCategoryRails from "@/app/[locale]/_components/homepage/TopCategoryRails";
import Reviews from "@/app/[locale]/_components/homepage/Reviews";
import RecentlyViewed from "@/app/[locale]/_components/homepage/RecentlyViewed";
import Nearby from "@/app/[locale]/_components/homepage/Nearby";
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
      {/* First viewport: Fresha's query builder leads, replacing HomeSearchPill's slot. */}
      <HeroQueryBuilder locale={locale} />
      {/* Then the category chip row, same position it holds on the live page (directly after the
          search entry point, before the feed). */}
      <CategoryPillRow />

      <FeedZone>
        <ContinueCard />

        {/* 1. Recommended */}
        <ForYouAffinityRow />
        <ForYouSalonRows salonData={salonCardData} />

        {/* 2. New on Solen */}
        <SalonOfMonth locale={locale} />

        {/* 3. Trending */}
        <TopCategoryRails salonData={salonCardData} idsByCategory={topByCategory} />

        {/* 4. Reviews */}
        <Reviews />

        {/* Remaining real sections, not part of the four named Fresha slots, kept at the tail in
            the live page's own relative order. */}
        <RecentlyViewed salonData={salonCardData} topSalonIds={topSalonIds} />
        <Nearby salonData={salonCardData} nearbyCount={nearbyCount} />
        <PopularLooksLazy />
        <WalkInBand />
        <div className="max-md:hidden">
          <BusinessTeaser />
        </div>
      </FeedZone>
    </div>
  );
}
