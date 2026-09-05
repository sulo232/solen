// Grounded-in: app/[locale]/page.tsx (the real homepage this direction copies chrome + real data
// loaders from), app/[locale]/_components/homepage/RecentlyViewed.tsx, TopCategoryRails.tsx,
// SalonOfMonth.tsx, Reviews.tsx, WalkInBand.tsx (the real section components this direction picks
// from, reordered and capped, never redrawn).
//
// Exists-check: ran `npm run exists home` (the real homepage + its ~40 section components, all
// real, reused below) and `npm run exists directions-0905` (1 REMOVED hit, an unrelated earlier
// single-treatment batch, not re-proposed; DirectionFrame, the shared scaffold, reused unchanged
// by the sibling page.tsx). No home-surface entry under this comparison route existed before this
// pass.
//
// Depicts: search pill chrome -> app/[locale]/_components/homepage/HomeSearchPill.tsx (real, unmodified, same as app/[locale]/page.tsx).
// Depicts: category pill row chrome -> app/[locale]/_components/layout/CategoryPillRow.tsx (real, unmodified, same as app/[locale]/page.tsx).
// Depicts: recently-viewed rail -> ./RecentlyViewedBig.tsx (this direction's own fork, see its header).
// Depicts: category rails, capped to 2 -> ./TopCategoryRailsBig.tsx (this direction's own fork, see its header).
// Depicts: salon of the month card -> app/[locale]/_components/homepage/SalonOfMonth.tsx (real, unmodified; self-hides when the feature flag is off).
// Depicts: reviews carousel -> app/[locale]/_components/homepage/Reviews.tsx (real, unmodified; fetches GET /api/reviews/featured).
// Depicts: walk-in band -> app/[locale]/_components/homepage/WalkInBand.tsx (real, unmodified; fetches GET /api/walkin/nearby).
// Depicts: real salon data batch -> app/[locale]/_components/homepage/salonCardData.ts getTopSalonIds/getTopSalonIdsByCategory/getSalonCardDataMap (same functions app/[locale]/page.tsx calls).
//
// Direction: Airbnb rails. Fewer, taller rails with bigger photo-first cards (SalonCard's own
// sanctioned widthClassName override, never touching its anatomy), section titles at the LOCKED
// clamp(18px,2vw,20px)/600 size (see SectionPrimitivesBig.tsx for the Airbnb-22px conflict this
// keeps the lock over), see-all as an ink arrow (already the live component's own recipe, ported
// from Airbnb on 2026-08-10, reused unchanged), and the SAME real sections capped to at most 5:
// RecentlyViewedBig, TopCategoryRailsBig (capped to 2 of the real 4 category rails), SalonOfMonth,
// Reviews, WalkInBand. Chrome (HomeSearchPill, CategoryPillRow) is the real, unmodified live
// components, imported exactly as app/[locale]/page.tsx uses them; no header/nav/bar is drawn.
//
// Sources: _design-system/references/fresha--home.md (placement: chrome above the feed, one
// section per rail, see-all sits at the section's own header row, not the card grid) and
// _design-system/references/airbnb--look-recipe.md +
// _design-system/references/airbnb--home-mobile.md (finish: "fewer, bigger" card density is
// Airbnb's own philosophy inverted for this brief's explicit ask, since Airbnb's measured
// philosophy is actually MORE, smaller cards, 2.2 visible, ratio 1.053. This brief asks the
// opposite, bigger cards, so the port here is the STRATEGY, fewer deliberate choices per screen,
// rather than the literal card-count number, logged as a conflict below).
//
// Conflicts: (1) section heading kept at the Solen-locked clamp(18px,2vw,20px)/600 instead of
// Airbnb's measured 22px/600 (look-recipe row 2, port map: not inside lock, would be a new larger
// value). (2) card ratio kept at Solen's locked 5:4 (SalonCard anatomy, unchanged) instead of
// Airbnb's measured near-square 1.053; this direction widens the card instead of squaring it, so
// the bigger half of the brief is honoured without touching the locked photo ratio. (3) ink
// #0A0A0A kept over Airbnb's measured rgb(34,34,34), a LOCKFILE frozen literal. (4) the see-all
// control already carries Solen's own Airbnb-derived recipe, 32px ink-on-sunken circle with an
// arrow icon, so no new value was ported there, it is reused as-is.
//
// Floors: (a) photo focal, every SalonCard's 5:4 photo is the largest element per card, and the
// widened cards raise the section's photographic share above the live page's own. (b) one biggest
// element, the widened rail cards are visually the single largest content unit per section. (c)
// real number, salon ratings, review counts and CHF prices are all live salonCardData, no
// fabricated value. (d) semantic colour, the pale-green discount pill on SalonCard, unchanged,
// plus the yellow rating star. (e) no dead-grey zone, every section is either a photo rail or a
// real editorial or review card. (f) worst-case content, SalonCard's own truncate and line-clamp
// rules, unchanged, hold the longest real seeded name and address; not independently re-tested
// here since SalonCard's anatomy is untouched from its own already-verified handling.
//
// No em-dashes. English copy only (all rendered strings are the real i18n keys or CATEGORY_ROUTE
// English labels already used by the real component this forks).

import HomeSearchPill from "@/app/[locale]/_components/homepage/HomeSearchPill";
import CategoryPillRow from "@/app/[locale]/_components/layout/CategoryPillRow";
import SalonOfMonth from "@/app/[locale]/_components/homepage/SalonOfMonth";
import Reviews from "@/app/[locale]/_components/homepage/Reviews";
import WalkInBand from "@/app/[locale]/_components/homepage/WalkInBand";
import {
  getSalonCardDataMap,
  getTopSalonIds,
  getTopSalonIdsByCategory,
} from "@/app/[locale]/_components/homepage/salonCardData";
import { FeedZone } from "./SectionPrimitivesBig";
import RecentlyViewedBig from "./RecentlyViewedBig";
import TopCategoryRailsBig from "./TopCategoryRailsBig";

export default async function HomeDirectionB({ locale }: { locale: string }) {
  const [topSalonIds, topByCategory] = await Promise.all([
    getTopSalonIds(4),
    getTopSalonIdsByCategory(10),
  ]);
  const salonCardData = await getSalonCardDataMap([
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
          <RecentlyViewedBig salonData={salonCardData} topSalonIds={topSalonIds} />
          <TopCategoryRailsBig salonData={salonCardData} idsByCategory={topByCategory} />
          <SalonOfMonth locale={locale} />
          <Reviews />
          <WalkInBand />
        </FeedZone>
      </div>
    </>
  );
}
