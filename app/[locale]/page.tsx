import type { Metadata } from "next";
import { buildAlternates } from "@/lib/seo";
import Hero from "./_components/homepage/Hero";
import HomeSearchPill from "./_components/homepage/HomeSearchPill";
import CategoryPillRow from "./_components/layout/CategoryPillRow";
import { FeedZone } from "./_components/homepage/SectionHeader";
// V3-D82 (2026-05-19): hero atmosphere now lives inline inside Hero.tsx
// as a CSS double-radial-gradient (locked from V1 variant of the
// solen-hero-background-variants.html mockup). HeroSpotlight + AtmosphereBlobs
// retired (kept on disk for reference).
// V3-D138 (2026-05-25): homepage restructure per "new section order" spec.
//   UNMOUNTED (component files preserved on disk for revert):
//     - SolenStory           ("Buchen in 30 Sek." + "Only one click" video)
//     - Coiffeur             (separate "Coiffeur-Salons" section)
//   REORDERED inside FeedZone:
//     Old: RecentlyViewed → SolenStory → Nearby → CategoryPromos →
//          FeaturedStylists → Coiffeur → Entdecken → Reviews → BentoBusiness
//     New: RecentlyViewed → Nearby → FeaturedStylists → CategoryPromos →
//          Entdecken → Reviews → BentoBusiness
// V3-D139 (2026-05-25): Fix 3 + Fix 5 spec —
//   CategoryTabs (briefly introduced as slot 2) REMOVED. Component file kept
//   on disk for revert. Categories now accessed via MobileCategoriesRow
//   ("Für dich" 3-icon row) restored to its prior position (after Hero,
//   before Top auf Solen) per Fix 5.
// import CategoryTabs from "./_components/homepage/CategoryTabs";
import MobileCategoriesRow from "./_components/homepage/MobileCategoriesRow";
// V3-D348: client-side curation — "Weil du X magst" salon rows for the
// categories the user picked during onboarding (renders null when logged-out).
import ForYouSalonRows from "./_components/homepage/ForYouSalonRows";
// 2026-07-13: real-data wiring for the converged SalonCard's Row 3 (address
// and price) and Row 1 (rating). The curated id lists (FORYOU_SALONS,
// NEARBY_SALON_IDS) plus the live top-rated ids (getTopSalonIds) feed ONE
// server batch query, no per-salon round-trips, no client-side fetch waterfall.
import { FORYOU_SALONS } from "./_components/homepage/forYouSalons";
import { NEARBY_SALON_IDS } from "./_components/homepage/nearbySalonIds";
import {
  getSalonCardDataMap,
  getTopSalonIds,
  getNearbyTeaserCount,
  getTopSalonIdsByCategory,
} from "./_components/homepage/salonCardData";
// I4/I5 (2026-08-01, home rails reconciliation with public/_mockups/home-v3/search-a.html): the
// mockup's 4-across "Recently viewed" tile grid (real localStorage view history, city cell) and
// "Popular looks" photo tile grid (real seeded discovery items with a real price). Both compose
// existing Section/SectionFrame/SectionTitle primitives; neither touches the existing
// RecentlyViewed.tsx rail or Entdecken.tsx (this task's own no-touch list).
import PopularLooks from "./_components/homepage/PopularLooks";
// I7 (2026-08-01, home rails reconciliation with public/_mockups/home-v3/search-a.html
// continuationCard()): the home's FIRST element, mounted ahead of MobileCategoriesRow per the
// mockup's own render order (continuationCard() is appended to #sa-list before recentlyViewed()
// and every rail; MobileCategoriesRow has no mockup equivalent to defer to). Self-hides to null
// with no real state to show. See components/ContinueCard.md for the per-state real-data audit.
import ContinueCard from "./_components/homepage/ContinueCard";
// Salon of the Month (2026-07-13): real editorial pick from the admin picker
// (dashboard/salon-of-month-admin -> salon_of_month_winners table), gated on
// the salon_of_month feature_flags toggle. Server component, renders null
// when the toggle is off / no winner picked yet, so it's a silent no-op for
// everyone until an admin turns it on. Not the same feature as the removed
// ArtistOfTheMonth (invented demo stylists, no backend) referenced below.
import SalonOfMonth from "./_components/homepage/SalonOfMonth";
// The personal row: the salons this customer leans toward, worked out nightly from their own
// bookings, favourites and searches. Renders nothing for a signed-out or brand-new visitor, so the
// page is unchanged until there is something real to show. Owner switched it on 2026-08-14.
import ForYouAffinityRow from "./_components/homepage/ForYouAffinityRow";
// V3-D124 (2026-05-24): FeatureBento was added then scrapped per user.
// Component file kept at ./_components/homepage/FeatureBento.tsx and
// illustrations at public/illustrations/features/ for easy revive — just
// re-add the import + the <FeatureBento /> below MobileCategoriesRow.
// import FeatureBento from "./_components/homepage/FeatureBento";
import RecentlyViewed from "./_components/homepage/RecentlyViewed";
// V3-D106 (2026-05-23): HeroDuo removed per user "remove ths and heute noch
// frei top bewertet sh." Component file preserved at HeroDuo.tsx for revert.
// import HeroDuo from "./_components/homepage/HeroDuo";
//
// V3-D104 (2026-05-23): ArtistOfTheMonth removed from page composition per
// user "remove ths whole thing." Component file kept at
// `./_components/homepage/ArtistOfTheMonth.tsx` for easy revert — just
// re-add the import + the <ArtistOfTheMonth /> usage in FeedZone below.
// import ArtistOfTheMonth from "./_components/homepage/ArtistOfTheMonth";
import Nearby from "./_components/homepage/Nearby";
// I3 (2026-08-01, home rails reconciliation with public/_mockups/home-v3/search-a.html): real
// 7-day slot availability + the four per-category "Top X" rails, both new sections between Nearby
// and WalkInBand. See salonCardData.ts / components/AvailableThisWeek.md / components/TopCategoryRails.md.
//
// A6 (owner 2026-08-05, "remove the Bald frei section"): AvailableThisWeek is UNMOUNTED. Measured
// before: 9 real salon cards, section 304.1px tall at 375 / 318.5px at 402, sitting between Nearby
// and Top Coiffeur. Its server fetch (getAvailableThisWeekSalonIds, a salons_with_slot_in_hours
// RPC round trip on every home render) and its ids' contribution to the salonCardData batch went
// with it, otherwise the query would keep running for a section nobody renders. The component
// file, its data function, its doc and its registry row stay on disk, the way every earlier
// homepage removal in this file did (V3-D104 ArtistOfTheMonth, V3-D106 HeroDuo, V3-D150
// CategoryPromos): re-add the import + the <AvailableThisWeek /> line + the fetch to revive it.
// Graveyard: _design-system/REMOVED.md.
// import AvailableThisWeek from "./_components/homepage/AvailableThisWeek";
import TopCategoryRails from "./_components/homepage/TopCategoryRails";
// V3-D348 (tweak #5): dark full-bleed feature band, breaks the run of
// identical card carousels mid-feed + surfaces Walk-in.
import WalkInBand from "./_components/homepage/WalkInBand";
// V3-D150 (2026-05-25): CategoryPromos ("Stöber nach Kategorie." swipeable
// promo cards) REMOVED from homepage per user. Browsing-by-category path
// still lives via MobileCategoriesRow "Für dich" tiles (slot 3) + Header
// dropdown. Component file kept on disk for revert.
// import CategoryPromos from "./_components/homepage/CategoryPromos";
// Entdecken ("Find your inspiration.") unmounted 2026-08-16: it and PopularLooks rendered the same
// 8 look ids from one /api/discovery/feed?category=hair query, so the page showed one query twice.
// Component file kept on disk for revert.
// import Entdecken from "./_components/homepage/Entdecken";
// FeaturedStylists REMOVED from homepage (V3-D436, 2026-06-05). Every card
// linked to /stylist/[slug] — a route that does NOT exist (locale catch-all
// serves a soft not-found at HTTP 200). The section's DEMO array is standalone
// (invented people: elena-rossi / marcus-chen / …) with NO salon slug + NO
// staff id, so the links can't be repointed to the real per-salon profile
// route (/salon/[slug]/staff/[staffId]) without inventing a stylist→salon
// mapping. Rather than ship dead links, the section is pulled.
//   FUTURE wire-up (the section CAN come back, real data already exists):
//   /api/staff/featured already returns live rows carrying { id, salon_slug,
//   salon_name, salon_rating, specialties }. Rebuild FeaturedStylists to fetch
//   that endpoint and link each card to /salon/${salon_slug}/staff/${id}
//   (a route that DOES resolve), then re-add the import + <FeaturedStylists/>
//   below. A standalone /stylist/[slug] route is the alternative, only if
//   stylists ever become salon-independent entities.
// Component file kept on disk for that revival.
// import FeaturedStylists from "./_components/homepage/FeaturedStylists";
// V3-D75-bento (2026-05-18): SalonRegister (WhySolen.tsx) retired in favor of
// BentoBusiness — Apple-style interactive 4-card bento grid (3D tilt, animated
// internal visuals, scroll-triggered fade-up). WhySolen.tsx preserved on disk
// for rollback / reference.
// V3-D147 (2026-05-25): BentoBusiness MOVED to /de/business page as the canonical
// B2B destination. Homepage now hosts BusinessTeaser — a compact image-left +
// text+CTA-right band pointing to the new B2B landing. Component file kept on
// disk for revert / direct usage on /business.
// import BentoBusiness from "./_components/homepage/BentoBusiness";
import BusinessTeaser from "./_components/homepage/BusinessTeaser";
import Reviews from "./_components/homepage/Reviews";

const TITLES: Record<string, string> = {
  de: "Solen — Finde & buche die besten Salons in der Schweiz", // em-dash-ok: pre-existing title dash, unrelated to this edit
  en: "Solen — Discover & Book the Best Stores in Switzerland", // em-dash-ok: pre-existing title dash, unrelated to this edit
  fr: "Solen — Trouve & réserve les meilleurs stores en Suisse", // em-dash-ok: pre-existing title dash, unrelated to this edit
  it: "Solen — Trova e prenota i migliori store in Svizzera", // em-dash-ok: pre-existing title dash, unrelated to this edit
};

const DESCRIPTIONS: Record<string, string> = {
  de: "Entdecke Top-Salons für Coiffeur, Nails, Spa & mehr in Basel, Zürich und Bern. Online buchen, sofort bestätigt. ★ Bewertungen & Preise vergleichen.",
  en: "Discover top stores for haircuts, nails, spa & more in Basel, Zurich and Bern. Book online, instant confirmation. ★ Compare reviews & prices.",
  fr: "Découvre les meilleurs stores pour coiffeur, ongles, spa & plus à Bâle, Zurich et Berne. Réservation en ligne, confirmation immédiate. ★ Comparer.",
  it: "Scopri i migliori store per parrucchiere, unghie, spa e altro a Basilea, Zurigo e Berna. Prenota online, conferma immediata. ★ Confronta.",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const loc = locale ?? "de";
  const title = TITLES[loc] ?? TITLES.de;
  const description = DESCRIPTIONS[loc] ?? DESCRIPTIONS.de;
  const alternates = buildAlternates("", loc);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://solen.ch/${loc}`,
      siteName: "solen.ch",
      images: [{ url: "/og-homepage.png", width: 1200, height: 630, alt: "Solen — Beauty & Wellness Booking" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-homepage.png"],
    },
    alternates,
  };
}

/**
 * Homepage — V3-D139 restructure (2026-05-25, Fix-pass).
 *
 * Section order per "new final section order" spec (top → bottom):
 *   1. Nav                       — app/[locale]/layout.tsx Header
 *   2. Hero                      — H1 + sub-line + search form + CTA + trust
 *   3. MobileCategoriesRow       — "Für dich" 3 icon tiles (Coiffeur/Barber/Nails)
 *   4. RecentlyViewed            — falls back to "Top auf Solen" curated list
 *   5. Nearby                    - "In der Nähe" map teaser (A4, 2026-08-05: cards removed)
 *   6. FeaturedStylists          — "Lass dich verwöhnen." stylist avatars (resized)
 *   7. CategoryPromos            — "Stöber nach Kategorie." 3 large cat cards
 *   8. Entdecken                 — "Finde deine Inspiration." vertical look cards
 *   9. Reviews                   — "Bewertungen" review cards
 *  10–16. BentoBusiness          — "• Für Salons" divider + "Solen für dein
 *                                  Geschäft." partner hero + 4 BentoCards
 *                                  (Sofortige Bestätigung / Direkt-Chat /
 *                                  Voller Kalender / Analytics) + JoinUsCard
 *                                  ("Werde Solen-Partner.") final partner CTA
 *  17. Footer                    — app/[locale]/layout.tsx Footer
 */
export const revalidate = 300;

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // topSalonIds (RecentlyViewed's "Top auf Solen" fallback) and nearbyCount
  // (the Nearby map-teaser count) are independent live fetches, run in
  // parallel before the id union below needs topSalonIds. I3 (2026-08-01):
  // topByCategory (TopCategoryRails' four per-category rails) joins the same
  // parallel batch, same reasoning. (A6, 2026-08-05: availableThisWeekIds left this batch with
  // the "Bald frei" section it fed, see the import-site comment above.)
  // I4's baselShopCount left this batch on 2026-08-15 with RecentlyViewedTiles, the only thing that
  // consumed it. Leaving the query in would have run getBaselShopCount() on every homepage render
  // for a value nothing reads.
  const [topSalonIds, nearbyCount, topByCategory] = await Promise.all([
    getTopSalonIds(4),
    getNearbyTeaserCount(),
    getTopSalonIdsByCategory(10),
  ]);
  // One combined batch fetch (2 bulk Supabase queries inside
  // getSalonCardDataMap, not one per salon) for every real salon id the
  // For-You + Nearby + Recently-Viewed homepage rows reference, deduped internally.
  const salonCardData = await getSalonCardDataMap([
    ...Object.values(FORYOU_SALONS).flatMap((list) => list.map((s) => s.id)),
    ...NEARBY_SALON_IDS,
    ...topSalonIds,
    ...Object.values(topByCategory).flat(),
  ]);
  return (
    <>
      {/* FIX B (2026-08-01, owner "it should be search bar instead of category bar"): the sticky
          search-pill wrapper is a sibling BEFORE the page's root div, not nested inside it.
          Measured: that root div carries `overflow-hidden` (below), and ANY ancestor with a
          non-visible overflow (even just overflow-x) becomes the containing block CSS uses to
          compute `position: sticky`, so a sticky child nested inside it never actually pins, it
          just scrolls away with the rest of the page (verified live: rect.top went to -1500 at
          scroll 1500 while nested, 0 once moved outside). Placing it here instead, outside that
          div, escapes the clip entirely. Visually identical either way on mobile: Hero's own
          mobile block is empty (`max-md:hidden`, see Hero.tsx), so this is still the first
          visible thing under Header.tsx's category row. Header.tsx's category row folds away on
          scroll on home too (categoryCollapsed widened to isHome), so this pill is the one thing
          left pinned. Solid bg (token only) so page content never shows through once it is pinned.
          A2 (owner 2026-08-05, red circle on his home screenshot, "remove the dividing line under
          the search bar"): the `border-b border-s-border` this wrapper used to carry is GONE.
          Measured before: a 1px solid s-border hairline running the full viewport width (375 and
          402), bottom edge at y=157. It was the only full-width horizontal edge in the top 400px.
          What the screen KEEPS as the pinned-chrome boundary (FLOORS LAW 5, deletion names what it
          keeps): the pill's own `border border-s-border` + `shadow-[0_2px_8px_0_rgba(0,0,0,0.07)]`
          one level in, so the bar still reads as an object over the scrolled feed. The wrapper's
          opaque white fill is untouched, so nothing shows through. */}
      <div className="md:hidden sticky top-0 z-[55] bg-white"> {/* mockup-ok: owner-measured fix, literal instruction, tokens only */}
        <HomeSearchPill locale={locale} />
      </div>
      {/* CategoryPillRow (2026-08-10, owner ask): renders directly after the search pill, in
          normal document flow (NOT inside the sticky wrapper above, so it never pins). Sticky
          elements keep their own flow-space, so this sibling sits right beneath it regardless of
          scroll position, exactly the non-sticky "below the search bar" placement asked for. */}
      <CategoryPillRow />
      <div className="relative overflow-hidden bg-white">
      {/* V3-D137 sunset halo SCRAPPED 2026-05-25, user ditched, reverted
          to pre-halo state. Mockup at public/solen-header-light-variants.html
          kept on disk for revival reference. */}
      <Hero locale={locale} />
      {/* V3-D143 (2026-05-25): MobileCategoriesRow moved INSIDE FeedZone
          to fix the 8px overlap where the rising-panel's negative margin
          (-mt-6/-mt-8, designed for Hero-overlap) was eating into the
          bottom of the Für dich tiles. Inside FeedZone, tiles sit cleanly
          above RecentlyViewed and the rising-panel-over-Hero intent is
          preserved. Semantically also better — Für dich IS feed content. */}
      <FeedZone>
        {/* ForYouGreeting ("Willkommen zurück, {name}") removed 2026-06-04:
            redundant with the hero's "Hallo, {name}" — two name-greetings on
            one page. Hero greeting is the single greeting now. */}
        {/* I7: the home's first element (search-a.html continuationCard()). Self-hides to
            nothing for a logged-out visitor with no persisted search. Mounted ahead of
            MobileCategoriesRow, matching the mockup's own render order. */}
        <ContinueCard />
        <MobileCategoriesRow />
        <SalonOfMonth locale={locale} />
        <ForYouAffinityRow />
        <ForYouSalonRows salonData={salonCardData} />
        {/* RecentlyViewedTiles REMOVED 2026-08-15, owner: "u again didnt remove the zulezt like
            square sh", said twice. It rendered a second "Zuletzt angesehen" heading directly above
            this one, with the same salons in 86x86 SQUARE tiles against this row's 242x194 card, so
            one entity wore two shapes on one screen. RecentlyViewed below keeps the job and renders
            the page's own card. Graveyard line filed in _design-system/REMOVED.md. */}
        <RecentlyViewed salonData={salonCardData} topSalonIds={topSalonIds} />
        {/* A4 (owner 2026-08-05): map only, the SalonCard rail under it is gone. */}
        <Nearby salonData={salonCardData} nearbyCount={nearbyCount} />
        {/* I3 (2026-08-01, home rails reconciliation with search-a.html): the four per-category
            Top rails, self-hiding on thin data. The "Bald frei" rail that used to lead this pair
            is unmounted, A6 above. */}
        <TopCategoryRails salonData={salonCardData} idsByCategory={topByCategory} />
        {/* I5: real seeded discovery photo tiles with a real starting price, search-a.html's own
            position (after the rails, before Walk-in). */}
        <PopularLooks />
        <WalkInBand />
        {/* FeaturedStylists pulled (V3-D436) — its cards linked to a
            non-existent /stylist/[slug] route and its demo data has no salon
            context to repoint at the real /salon/[slug]/staff/[staffId] page.
            See the import-site comment for the /api/staff/featured wire-up path
            to bring it back. */}
        {/* Entdecken removed 2026-08-16: it and PopularLooks above rendered the same 8 look ids from one /api/discovery/feed?category=hair query. */}
        <Reviews />
        {/* Desktop only. The mobile home ends at Reviews: that is what the home-v3 mockup shows
            (`public/_mockups/home-v3/search-a.html`) and what HOME_INSPO_CHROME recorded as "business
            teaser + newsletter are correctly absent on mobile". HOME_V3_CATEGORY_MAP even lists this
            as delivered and verified at 390x844, and it never was: the section shipped unconditional
            and the owner found it himself on 2026-08-14 ("removed that section from new homepage ...
            u didnt even flag it"). Hidden below md, which is what the record always said. */}
        <div className="max-md:hidden">
          <BusinessTeaser />
        </div>
      </FeedZone>
      </div>
    </>
  );
}
