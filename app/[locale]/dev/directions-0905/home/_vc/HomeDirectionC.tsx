// Grounded-in: app/[locale]/page.tsx (the real homepage this direction re-arranges) and
// app/[locale]/_components/homepage/SalonCard.tsx (the real, unmodified card component).
//
// Exists-check: `npm run exists directions-0905` -> 1 REMOVED hit (an earlier single-treatment
// comparison batch, a different route and a different format, not re-proposed here) plus
// DirectionFrame (the shared scaffold, reused unchanged by page.tsx, not touched by this file).
// `npm run exists home feed` -> 2 REMOVED hits, both read in full before writing this file:
// (1) the 7-day soon rail unmounted 2026-08-05, not rendered anywhere below; (2) the per-salon
// card rail that used to sit under the home map, unmounted 2026-08-05 in favor of a map-only
// teaser, owner verbatim "make it just a map, so people just gonna click on the map and open it".
// THIS FILE DOES REVISIT THAT SHAPE, on purpose and named rather than silent: that 2026-08-05
// change removed a row of cards from the LIVE production home page. This file is a dev-only
// comparison route, not a change to the live page, and the 2026-09-05 brief for this exact
// exercise names "one column of full-width cards" as the single idea to build and compare against
// two sibling directions. Logged as a conflict in the structured result handed back for this
// surface; the owner decides which direction, if any, replaces the live feed.
//
// Depicts: full-width card feed -> app/[locale]/_components/homepage/SalonCard.tsx (unchanged, only its existing widthClassName override prop is used)
// Depicts: curated nearby order -> app/[locale]/_components/homepage/nearbySalonIds.ts (NEARBY_SALON_IDS, the real id list Nearby.tsx already reads for its own live fields)
// Depicts: because-you-like breaks -> app/[locale]/_components/homepage/forYouSalons.ts (FORYOU_SALONS, the same curated ids ForYouSalonRows.tsx renders today)
// Depicts: top-rated break -> app/[locale]/_components/homepage/salonCardData.ts (getTopSalonIds, the same query RecentlyViewed.tsx's cold-start fallback already calls)
// Depicts: real rating/price/photo/address fields -> app/[locale]/_components/homepage/salonCardData.ts (getSalonCardDataMap, the same batch fetch page.tsx calls once per render)
// Depicts: sticky search field + category strip -> app/[locale]/_components/homepage/HomeSearchPill.tsx and app/[locale]/_components/layout/CategoryPillRow.tsx (both imported unmodified, this surface's FIXED chrome)
// Depicts: entrance motion on first paint -> NET-NEW: no existing homepage feed component animates its own mount, this direction adds one per the locked ENTER RECIPE in _design-system/MOTION.md
//
// Sources: _design-system/references/fresha--home.md (structure: its own capture could not reach
// a scrolled Fresha home feed, see that file's own not-captured note, so no Fresha section-order
// value is ported here beyond the general instruction in this exercise's brief to drop the rail
// shape); _design-system/references/airbnb--look-recipe.md and
// _design-system/references/airbnb--home-mobile.md, both read in full (finish values considered:
// card radius 20px, card ratio 1.053, ink #222222, all three logged as conflicts below and NOT
// applied, since SalonCard's own baked radius/ratio/ink are untouched per this surface's rule that
// the card's anatomy stays the same). MOTION.md's locked ENTER RECIPE (opacity 0->1, scale
// 0.96->1, blur 8px->0, 280ms, cubic-bezier(0.16,1,0.3,1)) is used for the one entrance animation
// below, in place of the brief's own shorthand of it ("opacity, y and scale"): the actual
// gate-enforced recipe requires opacity+scale+BLUR together, not a y-offset, so the locked file's
// real values were used over the paraphrase of them.
//
// measure-ok: every Airbnb value named below (radius 20px, ratio 1.053, ink #222222, the
// six-size/four-weight budget) is copied verbatim from the already-measured reference files cited
// above (airbnb--look-recipe.md, airbnb--home-mobile.md), not re-eyeballed here, and every one is
// logged as a conflict and NOT applied to this file's markup; nothing in this file was sized off a
// reference image directly.
//
// Conflicts (locks kept over the reference, listed rather than applied):
// - Airbnb's own entity card radius measures 20px and its home feed card ratio measures 1.053
//   (near-square); SalonCard's already-shipping values (22px radius, 5/4 ratio) are untouched,
//   since this surface's one rule for the card is that its shape stays the same. A full-width
//   column makes the existing 5/4 photo bigger than Airbnb's near-square tile, a side effect of
//   going full-width, not a deliberate ratio port.
// - Airbnb's ink is #222222; Solen's frozen ink token is #0A0A0A. Left as-is, a frozen literal,
//   owner call only, already logged in the reference file itself.
// - Airbnb's own home screen carries six distinct sizes and four-plus weights in one viewport.
//   This file adds zero new sizes or weights beyond what the reused chrome and the reused card
//   already render (an 18px heading recipe borrowed from the existing SectionTitle component,
//   a 14px name and a 12px/400 meta/price, both already baked into SalonCard). The heading and the
//   name are written as font-semibold (600) but RENDER at weight 500: app/globals.css:269-271 maps
//   .font-semibold and .font-bold to 500 inside main on every non-dashboard surface, the same
//   sitewide rule direction b's files disclose. Measured with getComputedStyle, not read off the class.
// - The brief's own phrase "nearby, sorted by distance" is not literally true here: no geolocation
//   exists on this dev route, and presenting an un-sorted list as sorted would be a fabricated
//   claim (CLAUDE.md taste rule 1). The curated nearby id order is used verbatim, un-resorted, and
//   the on-page label says "Nearby" only, never a distance claim.
// - The curated because-you-like id lists overlap the curated nearby id list heavily in this seed
//   data set (ten of twelve ids already sit in the fifteen-salon nearby list). Rather than show one
//   card twice on the same screen, each break below only surfaces an id not already placed earlier
//   in the feed. Two of the four categories have zero non-duplicate salons in this seed data and
//   are skipped rather than repeating a card; that is a property of the current seed rows, not a
//   gap invented by this file.
// - This real, unmodified category strip self-gates on the live route pattern (home, a category
//   segment, or discover route); none of those match this dev URL, so it renders nothing here.
//   Not reimplemented: this surface's rule is that this strip is reused exactly, not redrawn, and
//   a component legitimately rendering nothing off its own recognized routes is a known
//   limitation of testing it here, not a gap this file should paper over.

import HomeSearchPill from "@/app/[locale]/_components/homepage/HomeSearchPill";
import CategoryPillRow from "@/app/[locale]/_components/layout/CategoryPillRow";
import { SalonCard } from "@/app/[locale]/_components/homepage/SalonCard";
import { NEARBY_SALON_IDS } from "@/app/[locale]/_components/homepage/nearbySalonIds";
import {
  FORYOU_SALONS,
  FORYOU_LABEL,
  FORYOU_CATEGORIES,
  type ForYouCategory,
} from "@/app/[locale]/_components/homepage/forYouSalons";
import {
  getSalonCardDataMap,
  getTopSalonIds,
  type SalonCardDataMap,
} from "@/app/[locale]/_components/homepage/salonCardData";
import { nameForLocale } from "@/lib/min-price-service";
import { FeedZone, SectionTitle } from "./homeSectionPrimitives";
import { FeedEnter } from "./FeedEnter";

interface FeedSalonItem {
  kind: "salon";
  id: string;
  slug: string;
  name: string;
  category: "coiffeur" | "barbershop" | "nails" | "spa";
  rating: number | null;
  reviewCount: number | null;
  photoUrl?: string;
  priceFromCHF: number | null;
  priceFromService: string | null;
  postalCode?: string;
  city?: string;
}

interface FeedBreakItem {
  kind: "break";
  title: string;
}

type FeedItem = FeedSalonItem | FeedBreakItem;

function toFeedSalon(
  id: string,
  category: FeedSalonItem["category"],
  locale: string,
  data: SalonCardDataMap,
): FeedSalonItem | null {
  const real = data[id];
  // Same completeness gate the live Nearby.tsx row already applies: an id missing its name, slug
  // or category is skipped, never rendered with an invented fallback.
  if (!real || !real.name || !real.slug || !real.category) return null;
  return {
    kind: "salon",
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

export default async function HomeDirectionC({ locale }: { locale: string }) {
  const forYouAllIds = FORYOU_CATEGORIES.flatMap((c) => FORYOU_SALONS[c].map((s) => s.id));
  const topIds = await getTopSalonIds(8);
  const allIds = [...NEARBY_SALON_IDS, ...forYouAllIds, ...topIds];
  const salonData = await getSalonCardDataMap(allIds);

  const nearby = NEARBY_SALON_IDS.map((id) => {
    const real = salonData[id];
    if (!real || !real.category) return null;
    return toFeedSalon(id, real.category, locale, salonData);
  }).filter((s): s is FeedSalonItem => s !== null);

  const shownIds = new Set(nearby.map((s) => s.id));

  // A curation break only fires for a salon not already placed in the spine above.
  const curatedBreaks: { category: ForYouCategory; item: FeedSalonItem }[] = [];
  for (const category of FORYOU_CATEGORIES) {
    const candidate = FORYOU_SALONS[category].find((s) => !shownIds.has(s.id));
    if (!candidate) continue;
    const item = toFeedSalon(candidate.id, category, locale, salonData);
    if (!item) continue;
    curatedBreaks.push({ category, item });
    shownIds.add(item.id);
  }

  const topRated = topIds
    .filter((id) => !shownIds.has(id))
    .map((id) => {
      const real = salonData[id];
      if (!real || !real.category) return null;
      return toFeedSalon(id, real.category, locale, salonData);
    })
    .filter((s): s is FeedSalonItem => s !== null);
  for (const item of topRated) shownIds.add(item.id);

  // Interleave: a chunk of nearby cards, one curated break, repeat, then a top-rated break, then
  // whatever nearby cards remain. Curated order preserved throughout, never re-sorted.
  const feed: FeedItem[] = [];
  let nearbyIdx = 0;
  let breakIdx = 0;
  const chunk = 4;
  let topRatedPlaced = false;
  while (nearbyIdx < nearby.length) {
    for (let i = 0; i < chunk && nearbyIdx < nearby.length; i++, nearbyIdx++) {
      feed.push(nearby[nearbyIdx]);
    }
    if (breakIdx < curatedBreaks.length) {
      const { category, item } = curatedBreaks[breakIdx];
      feed.push({ kind: "break", title: `Because you like ${FORYOU_LABEL[category]}` });
      feed.push(item);
      breakIdx++;
    } else if (!topRatedPlaced && topRated.length > 0) {
      feed.push({ kind: "break", title: "Top rated on Solen" });
      for (const item of topRated) feed.push(item);
      topRatedPlaced = true;
    }
  }

  return (
    <>
      <div className="md:hidden sticky top-0 z-[55] bg-white">
        <HomeSearchPill locale={locale} />
      </div>
      <CategoryPillRow />
      <div className="relative overflow-hidden bg-white">
        <FeedZone>
          <FeedEnter>
            <div className="px-3 md:px-4">
              <SectionTitle title="Nearby" />
            </div>
            <div className="mt-2 flex flex-col gap-5 px-3 pb-6 md:px-4">
              {feed.map((entry, i) =>
                entry.kind === "break" ? (
                  <div key={`break-${i}`} className="pt-2">
                    <SectionTitle title={entry.title} linkPlacement="inline" />
                  </div>
                ) : (
                  <SalonCard
                    key={entry.id}
                    slug={entry.slug}
                    salonId={entry.id}
                    name={entry.name}
                    rating={entry.rating}
                    reviewCount={entry.reviewCount}
                    category={entry.category}
                    photoUrl={entry.photoUrl}
                    variant="service"
                    priceFromCHF={entry.priceFromCHF}
                    priceFromService={entry.priceFromService}
                    citySelected={false}
                    postalCode={entry.postalCode}
                    city={entry.city}
                    widthClassName="w-full"
                  />
                ),
              )}
            </div>
          </FeedEnter>
        </FeedZone>
      </div>
    </>
  );
}
