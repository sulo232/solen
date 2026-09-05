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
//   5. lock: section-H2 clamp(18px,2vw,20px) SIZE broken on purpose: delivered value = 28px,
//      line-height 32px (look-recipe #2's 22/26 base, ROUNDED UP to the 28px display-anchor floor
//      per the same recipe file's own port-map rule #1, see SectionPrimitivesAirbnb.tsx's SIZE
//      CORRECTION note, 2nd repair round). SectionPrimitivesAirbnb.tsx. WEIGHT CORRECTION (1st
//      repair round, critic-measured, unchanged this pass): the class this direction sets is
//      `font-semibold`, which Tailwind resolves to 600, but a sitewide rule at
//      app/globals.css:269-271 (`main :is(.font-semibold, .font-bold) { font-weight: 500; }`,
//      exempting only `[data-surface="dashboard"]`) forces every non-dashboard `.font-semibold` in
//      the app, including this one, down to 500 at render. Measured live 2026-09-05: the rendered
//      title weight on this route is 500, not 600. This is an owner-locked sitewide rule
//      (off-limits, not forked or edited here), so the delivered weight on this direction is 500;
//      600 was never actually shippable through a `.font-semibold` class on a non-dashboard
//      surface, and this file no longer claims 600 as delivered.
//   6. lock: rail card-count-per-viewport about 1.6 broken on purpose: reference value = Airbnb's
//      measured about 2.2 cards visible across 390 (home-mobile.md). RecentlyViewedAirbnb.tsx,
//      TopCategoryRailsAirbnb.tsx.
//   7. lock: section-to-section spacing mb-4 (16px) broken on purpose: reference value = the
//      Airbnb review-rhythm number (35+24, rounded to 32+24=56) applied as the inter-section gap
//      (look-recipe #17), the only Airbnb page-rhythm number this capture measured.
//      SectionPrimitivesAirbnb.tsx.
//   8. FLOORS LAW MISS, not a lock this direction can close, listed here as repair-round-required
//      (critic-measured, previously reported only in a standalone note below, not in this block):
//      the ~33% imagery floor. Measured live at 390x844 with Playwright, signed out, 2026-09-05
//      (re-verified this repair round): this direction (?v=b) = 25.9% first-viewport photo share,
//      the live homepage (/en) = 27.9%. The critic's own separate pass on this same route measured
//      26.5% / 28.6%, within normal Playwright image-load timing variance of this figure; both
//      readings agree on the finding, this direction sits BELOW the floor and BELOW the live page,
//      not above either. This is INHERITED, not delivered: the gap and the shortfall both trace to
//      ContinueCard, ForYouAffinityRow and ForYouSalonRows (real, unmodified components, see the
//      Depicts list above) self-hiding for a signed-out visitor on the live page identically, so no
//      value inside this direction's own LOOK-FULL scope (a card-ratio, radius, shadow, ink,
//      title-size, rail-density or spacing change) can close it without either fabricating content
//      the seed data does not have for a guest session or widening the rail cards past the cited
//      Airbnb source measurement (see the PHOTOGRAPHIC SHARE note below for the full trace).
//   9. lock: FLOORS LAW 6 (>=28px display anchor) and 7b (>=1.8x body) broken on purpose in the
//      OTHER direction, i.e. CLOSED, not missed (2nd repair round, was reported as an unclosed
//      FLOORS LAW MISS in the 1st repair round). The 22px SectionTitle (item 5 above) was itself
//      the reason no element reached 28px; the photographic share here (25.9%) sits below the
//      ~33% threshold FLOORS LAW 6 needs to exempt a screen from the anchor, so the miss was real,
//      not a false alarm. Fix applied: SectionPrimitivesAirbnb.tsx's SectionTitle now renders at
//      28px/32px, per the recipe file's own port-map rule #1, which already names this exact
//      situation (an Airbnb value sitting just under the floor) and gives the rule to round up
//      rather than copy literally. Rendered size is now 28px (clears >=28px) at 2.0x the 14px body
//      (clears >=1.8x). This did not change the ~33% imagery-floor gap (item 8 above), which is a
//      separate, unrelated floor this direction still does not close, inherited from the live
//      page's own signed-out section-hiding, not from anything this item touches.
//   Kept, not broken: the home chrome (search pill, category pill row), the see-all ink-arrow
//   circle (already Solen's own Airbnb-derived recipe), secondary/meta text color (already close
//   to Airbnb's per the look-recipe's own port map), the button/chip 16px radius, the type family
//   (Inter/Inter Tight), no dark mode, WCAG AA text contrast, real data only, no hardcoded image
//   src.
//
// HARNESS ARTIFACT (repair round, disclosed, not patched): CategoryPillRow renders `null` on this
// route. The real component's own `isHome` check (app/[locale]/_components/layout/
// CategoryPillRow.tsx:122, `/^\/[a-z]{2}\/?$/`) only matches the bare `/en` root, never a
// `/en/dev/...` path, and `showCategoryChrome` (:139) is false everywhere else this pathname isn't
// a category route, so the row self-hides under this dev harness. It is imported unmodified above
// ("Kept, not broken" line, same as the live page), and the same regex mismatch hides it
// identically on directions a and c: it is a shared /dev/directions-0905 harness limitation, not a
// defect this direction introduced, and is not forked or patched here per the off-limits rule.
//
// Floors (customer-screen finished-pass, per this surface's own brief): (a) photo focal, every
// SalonCardAirbnb's near-square photo is the largest element per card. (b) one biggest element,
// the section title / see-all pairing is subordinate to the photo rail beneath it on every
// section. (c) real number, salon ratings, review counts and CHF prices are all live
// salonCardData batch data, never an invented value. (d) semantic colour, the pale-terracotta
// discount pill on SalonCardAirbnb (unchanged from the real SalonCard) plus the yellow rating
// star. (e) no dead-grey zone, every rendered section is either a real photo rail, a real
// editorial card, or a real review/walk-in band. (f) worst-case content, SalonCardAirbnb's own
// truncate/line-clamp rules are byte-identical to the real SalonCard's (untouched in this fork)
// and already hold the longest real seeded name/address there.
//
// PHOTOGRAPHIC SHARE, CORRECTED, full trace for Conflicts item 8 above (repair round,
// critic-measured, was falsely claimed "above the live page's own"): measured live at 390x844
// with Playwright (sum of <img> bounding-box area
// clipped to the first viewport, divided by 390x844), signed out, 2026-09-05: this direction
// (?v=b) = 25.9%, the live homepage (/en) = 27.9%. Both sit below the ~33% imagery floor; this
// direction is LOWER than the live page, not higher, and this file no longer claims otherwise.
// Checked whether the rail card width can be widened to close the gap: RecentlyViewedAirbnb.tsx
// and TopCategoryRailsAirbnb.tsx already set the card width to `(100vw-36px)/2.2`, which
// RecentlyViewedAirbnb.tsx's own header cites as 160.9px at 390, within 5px of the Airbnb
// reference's own measured 165px card (airbnb--home-mobile.md, "cards visible across 390: about
// 2.2"). Widening further would exceed the cited source measurement, so no additional lever exists
// inside this direction's own declared LOOK-FULL values without inventing a number; the honest
// number is reported instead of a corrected structure this direction cannot make without breaking
// its own citations. The gap versus the live page is mostly upstream of this fork: a signed-out
// visitor self-hides ContinueCard, ForYouAffinityRow and ForYouSalonRows (unmodified, real,
// "Depicts" list above) on both this direction and the live page alike, and neither this comparison
// route's harness nor this direction changes that.
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
      <div className="md:hidden sticky top-0 z-[55] bg-white"> {/* mockup-ok: repair round, restores the real page's app/[locale]/page.tsx:263 sticky classes, measured back in below */}
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
