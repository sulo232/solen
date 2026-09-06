// Exists-check: `npm run exists home` (run this session) returns 129 matches: the real homepage
// (app/[locale]/page.tsx) + its ~40 section components, all real and composed unmodified below;
// round 1's three home directions at app/[locale]/dev/directions-0905/home/_va|_vb|_vc (read in
// full before this file was written, see the STRUCTURE DIFF note below); and 31 REMOVED hits,
// none re-proposed here (no availability pill, no per-city rail, no "Bald frei" strip, no Nearby
// card rail, no second RecentlyViewedTiles square row, all correctly absent from every real
// component this file imports). `npm run exists CategoryPillRow` -> the real component (see
// CategoryPillRowKit.tsx's own exists-check for why this direction renders a kit-pill row instead
// of importing it). `npm run exists directions-0905-r2 home` -> no round-2 home file exists yet;
// this is the first.
//
// Grounded-in: ./HeroQueryBuilderR2.tsx (this folder's own copy of round 1's HeroQueryBuilder.tsx,
// forked 2026-09-06 to fix a critic finding, see its own header for the full reasoning),
// ./sanitizeBannedPhoto.ts (this folder's own post-fetch repair for the same critic pass, see its
// own header), app/[locale]/dev/directions-0905/home/_va/_liveHomepageExports.ts (FeedZone
// re-export, same reasoning as round 1's own use of it), app/[locale]/_components/homepage/
// RecentlyViewed.tsx, ForYouSalonRows.tsx, TopCategoryRails.tsx, SalonOfMonth.tsx, Reviews.tsx,
// Nearby.tsx, dynamic/PopularLooksLazy.tsx, WalkInBand.tsx, BusinessTeaser.tsx, forYouSalons.ts,
// nearbySalonIds.ts, salonCardData.ts (all real, live, unmodified, the exact functions
// app/[locale]/page.tsx itself calls), and app/[locale]/dev/directions-0905-r2/_kit/ (KitProvider
// here; SectionTitle inside HeroQueryBuilderR2.tsx; see the "system" note below for why nothing
// else in this file needs a kit component).
//
// REPAIR PASS 2026-09-06 (two items, this file's own scope only, per the brief "repair ONE
// mockup and nothing else"):
// 1. off-ramp anchor size 31.2px vs the kit's 28px token (A5 closed-ramp violation, also a
//    sameness break against home b/c, both of which already render their one anchor through the
//    kit's SectionTitle). Cause: round 1's HeroQueryBuilder.tsx renders its own H1 at
//    `text-[clamp(30px,8vw,44px)]`, 8vw of 390px = 31.2px, never routed through the kit at all.
//    Fix: ./HeroQueryBuilderR2.tsx, a local fork that swaps that H1 for
//    `<SectionTitle as="anchor">` (28px/500, TYPE_RAMP.anchor), replacing the import above.
//    Nothing else in HeroQueryBuilder's copy changed (greeting, subtitle, FreshaQueryPill mount,
//    all the same lines). The shared round-1 file itself is untouched, so round 1's own direction
//    A is unaffected by this repair.
// 2. banned seed photo `photo-1560066984` rendered in-fold (C10): the real getTopSalonIds(4)
//    query (rating >= floor, no fabrication) surfaces salon `dd4a3e35-8b9c-4ee6-a52e-1fb71ce04f89`
//    (Atelier Haarwerk, coiffeur, Basel, rating 4.56/25 reviews), whose real
//    `salons.cover_photo_url` IS the banned greyscale asset -- measured live, two renders of it in
//    the RecentlyViewed/TopCategoryRails coiffeur cards. Fix: ./sanitizeBannedPhoto.ts, applied to
//    the batch-fetched salonCardData map before any rail reads it, replaces that one salon's
//    photoUrl with a real, non-banned photo from ITS OWN salon_portfolio_images row (the same real
//    table and the same salon the confirmation screen's getAlternatePhoto.ts already uses for this
//    exact banned-photo case), never a different salon and never a hardcoded src. NEARBY_SALON_IDS
//    and getTopSalonIds() themselves are untouched (shared production files, out of scope here).
//
// STRUCTURE DIFF FROM ROUND 1's DIRECTION A (required by the brief, one line): round 1's A
// (app/[locale]/dev/directions-0905/home/_va/HomeVariantA.tsx) put the four "Fresha-named slots"
// (Recommended, New on Solen, Trending, Reviews) at the TOP of the feed and RecentlyViewed near
// the tail, after Reviews; this direction reads fresha--home.md's own measured finding literally
// instead ("Next section heading 'Recently viewed' begins to appear at the very bottom edge" of
// the hero capture, i.e. RecentlyViewed is the FIRST rail Fresha's own home renders after its
// search bar) and moves RecentlyViewed to lead the feed, directly under the category row, with
// Recommended/Trending/New-on-Solen/Reviews following in that order. ContinueCard (a Solen-only
// continuation banner, no Fresha equivalent in either capture file) is dropped so the feed order
// matches what was actually captured rather than round 1's own invented lead-in; logged as a
// deviation, not silent (it self-hid on every guest render anyway, so nothing observable is lost
// for a signed-out visitor, the state this route always renders in). ForYouAffinityRow (a second,
// narrower "for you" affinity strip round 1 stacked directly above ForYouSalonRows) is also
// dropped for the same reason: it has no Fresha anchor and round 1's own two-row "Recommended" was
// never named in either capture file, only in round 1's own brief.
//
// Sources: _plans/R2_LOOK_SYSTEMS.md Part A (the base recipes: A1 pill, A5 type ramp, A6 spacing,
// A7 card treatment, A8 colour) via _kit; _design-system/references/fresha--home.md (placement:
// query pill leads, then the category row, then RecentlyViewed as the very next section per its
// own measured finding, see STRUCTURE DIFF above) and
// _design-system/references/fresha--look-recipes.md (Section H2 home examples "Empfohlen",
// "Trending", 22px/600 Fresha-side, ROUNDED per A5 to Solen's own locked 18px section-heading
// tier, already what every real component below renders via SectionHeader.tsx's
// clamp(18px,2vw,20px), verified live at 390px = 18).
//
// Conflicts (named per the brief, not silently resolved):
// - COLLISION [chrome], same one round 1's direction A already logged: the live mobile entry
//   point is HomeSearchPill (2026-08-01 owner decision), and this direction replaces that pill's
//   slot with the Fresha-shaped query builder, for comparison purposes only, same as round 1 A.
// - The query builder carries 3 segments (Service | City | Time), not Fresha's 4 (Treatment |
//   Location | Date | Time): named in FreshaQueryPill.tsx's own header (unchanged, imported by
//   reference).
// - Airbnb's search-field dropdown anatomy (per-field category list / place list / date picks):
//   NOT rebuilt, same reasoning as round 1 A (the real SearchOverlay already exists and is wired
//   to /search; forking a disconnected second one would duplicate real product code).
// - Fresha's own purple-filled date/time quick-pick pills and the decorative hero gradient
//   (fresha--home.md's two named conflicts) are NOT ported: neither appears anywhere in this
//   direction's structure (no date/time dropdown is rebuilt here at all, and the hero carries no
//   gradient, only the real Hero copy HeroQueryBuilder.tsx already ships).
//
// floors: (a) photo focal -> every rail below renders real salon-card photography via the live
//   SalonCard component, unchanged; RecentlyViewed leading the feed (moved up from round 1 A's
//   tail position) raises first-viewport photo share further than round 1 A's already-measured
//   40.0%, since a real photo rail now sits immediately under the category row instead of another
//   copy block, and no longer includes the banned greyscale photo after the repair pass above;
//   (b) one biggest element -> the hero anchor inside HeroQueryBuilderR2.tsx, the kit's
//   `SectionTitle as="anchor"` (28px, TYPE_RAMP.anchor), the single largest text on the first
//   viewport, clearing FLOORS LAW 6 exactly at its 28px floor after the repair pass above; (c) a
//   real tabular number -> real prices and ratings on every salon card, fetched through the same
//   batch loaders app/[locale]/page.tsx itself calls; (d) a semantic-colour moment -> the real
//   discount pill / rating star each SalonCard renders when the underlying seeded data carries
//   one, plus WalkInBand's own real availability treatment further down; (e) no dead-grey zone ->
//   sections alternate white/sunken per each component's own existing treatment, untouched here;
//   (f) worst-case content -> unchanged, every card component already truncates per its own locked
//   anatomy, this file only reorders and never restyles a section.
//
// system: lift. KitProvider wraps the tree for the kit-authored controls on this screen
// (CategoryPillRowKit's <Pill>, and after the repair pass HeroQueryBuilderR2's <SectionTitle>),
// neither of which reads system context at all (A1 has no per-system delta, per _kit/Pill.tsx's
// own header; SectionTitle is a base-recipe text component, per its own header, "Part B systems
// change GROUPING devices, not the type ramp itself"). Every OTHER visible surface on this screen is
// a real, unmodified, already-locked production component (SalonCard's photo-card recipe: shadow-
// whisper, no border), which already matches what "lift" would deliver for a photo-card variant
// (A7 base: border false / shadow true for a photo card) and matches what "rule" or "tray" would
// ALSO render here, since this screen never renders a card with a border or a hairline divider
// between cards in the first place: there is no visible system delta to apply, on any of the
// three, to a screen this photo-rail-dominant. "lift" is named rather than left unset because
// every other round-2 file names one (_kit/README.md: "a mockup belongs to exactly one") and
// because it is, of the three, the one whose one-sentence definition ("a soft shadow and the gap
// between cards do all the work") is the literal, unmodified description of what SalonCard,
// RecentlyViewed's thumbnails, and every other rail already do.

import HeroQueryBuilderR2 from "./HeroQueryBuilderR2";
import { FeedZone } from "@/app/[locale]/dev/directions-0905/home/_va/_liveHomepageExports";
import { CategoryPillRowKit } from "./CategoryPillRowKit";
import { sanitizeBannedPhotos } from "./sanitizeBannedPhoto";
import RecentlyViewed from "@/app/[locale]/_components/homepage/RecentlyViewed";
import ForYouSalonRows from "@/app/[locale]/_components/homepage/ForYouSalonRows";
import TopCategoryRails from "@/app/[locale]/_components/homepage/TopCategoryRails";
import SalonOfMonth from "@/app/[locale]/_components/homepage/SalonOfMonth";
import Reviews from "@/app/[locale]/_components/homepage/Reviews";
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
import { KitProvider } from "../../_kit";

export default async function HomeR2DirectionA({ locale }: { locale: string }) {
  // Same parallel-batch data pattern as the real page and round 1's direction A: one Promise.all
  // for the independent live fetches, then one combined getSalonCardDataMap batch for every real
  // salon id any rail on this direction references, never a per-salon round trip.
  const [topSalonIds, nearbyCount, topByCategory] = await Promise.all([
    getTopSalonIds(4),
    getNearbyTeaserCount(),
    getTopSalonIdsByCategory(10),
  ]);
  const rawSalonCardData = await getSalonCardDataMap([
    ...Object.values(FORYOU_SALONS).flatMap((list) => list.map((s) => s.id)),
    ...NEARBY_SALON_IDS,
    ...topSalonIds,
    ...Object.values(topByCategory).flat(),
  ]);
  // REPAIR (C10): swap the banned greyscale seed photo for a real, non-banned portfolio photo of
  // the SAME salon, see ./sanitizeBannedPhoto.ts. Runs after the real batch fetch, before any
  // rail below reads photoUrl.
  const salonCardData = await sanitizeBannedPhotos(rawSalonCardData);

  return (
    <KitProvider system="lift">
      <div className="relative overflow-hidden bg-white">
        {/* First viewport: Fresha's query builder leads (fresha--home.md item 3), then the
            category row directly beneath it, same position the live page holds it in. */}
        <HeroQueryBuilderR2 locale={locale} />
        <CategoryPillRowKit locale={locale} />

        <FeedZone>
          {/* Fresha-literal order: RecentlyViewed leads (fresha--home.md's own measured finding,
              see STRUCTURE DIFF above), then Recommended, Trending, New on Solen, Reviews. */}
          <RecentlyViewed salonData={salonCardData} topSalonIds={topSalonIds} />
          <ForYouSalonRows salonData={salonCardData} />
          <TopCategoryRails salonData={salonCardData} idsByCategory={topByCategory} />
          <SalonOfMonth locale={locale} />
          <Reviews />

          {/* Remaining real sections, kept at the tail in the live page's own relative order. */}
          <Nearby salonData={salonCardData} nearbyCount={nearbyCount} />
          <PopularLooksLazy />
          <WalkInBand />
          <div className="max-md:hidden">
            <BusinessTeaser />
          </div>
        </FeedZone>

        {/* 125px spacer: HideInBooking.tsx strips the real bottom nav on every /dev route, so this
            measures the fold as it renders on the live product (BottomNav's own header comment
            gives 125px). No chrome is drawn here, only the space it would occupy. */}
        <div style={{ height: 125 }} aria-hidden="true" />
      </div>
    </KitProvider>
  );
}
