import type { Metadata } from "next";
import { buildAlternates } from "@/lib/seo";
import Hero from "./_components/homepage/Hero";
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
  getAvailableThisWeekSalonIds,
  getTopSalonIdsByCategory,
  getBaselShopCount,
} from "./_components/homepage/salonCardData";
// I4/I5 (2026-08-01, home rails reconciliation with public/_mockups/home-v3/search-a.html): the
// mockup's 4-across "Recently viewed" tile grid (real localStorage view history, city cell) and
// "Popular looks" photo tile grid (real seeded discovery items with a real price). Both compose
// existing Section/SectionFrame/SectionTitle primitives; neither touches the existing
// RecentlyViewed.tsx rail or Entdecken.tsx (this task's own no-touch list).
import RecentlyViewedTiles from "./_components/homepage/RecentlyViewedTiles";
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
import AvailableThisWeek from "./_components/homepage/AvailableThisWeek";
import TopCategoryRails from "./_components/homepage/TopCategoryRails";
// V3-D348 (tweak #5): dark full-bleed feature band, breaks the run of
// identical card carousels mid-feed + surfaces Walk-in.
import WalkInBand from "./_components/homepage/WalkInBand";
// V3-D150 (2026-05-25): CategoryPromos ("Stöber nach Kategorie." swipeable
// promo cards) REMOVED from homepage per user. Browsing-by-category path
// still lives via MobileCategoriesRow "Für dich" tiles (slot 3) + Header
// dropdown. Component file kept on disk for revert.
// import CategoryPromos from "./_components/homepage/CategoryPromos";
import Entdecken from "./_components/homepage/Entdecken";
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
  de: "Solen — Finde & buche die besten Stores in der Schweiz", // em-dash-ok: pre-existing title dash, unrelated to this edit
  en: "Solen — Discover & Book the Best Stores in Switzerland", // em-dash-ok: pre-existing title dash, unrelated to this edit
  fr: "Solen — Trouve & réserve les meilleurs stores en Suisse", // em-dash-ok: pre-existing title dash, unrelated to this edit
  it: "Solen — Trova e prenota i migliori store in Svizzera", // em-dash-ok: pre-existing title dash, unrelated to this edit
};

const DESCRIPTIONS: Record<string, string> = {
  de: "Entdecke Top-Stores für Coiffeur, Nails, Spa & mehr in Basel, Zürich und Bern. Online buchen, sofort bestätigt. ★ Bewertungen & Preise vergleichen.",
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
 *   5. Nearby                    — "In der Nähe" location-based salon cards
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
  // availableThisWeekIds (AvailableThisWeek's real 7-day slot rail) and
  // topByCategory (TopCategoryRails' four per-category rails) join the same
  // parallel batch, same reasoning.
  // I4 (2026-08-01): baselShopCount joins the same parallel batch, same reasoning as the I3 ids
  // above , RecentlyViewedTiles' city cell needs a real active-salon count, never a fabricated one.
  const [topSalonIds, nearbyCount, availableThisWeekIds, topByCategory, baselShopCount] = await Promise.all([
    getTopSalonIds(4),
    getNearbyTeaserCount(),
    getAvailableThisWeekSalonIds(10),
    getTopSalonIdsByCategory(10),
    getBaselShopCount(),
  ]);
  // One combined batch fetch (2 bulk Supabase queries inside
  // getSalonCardDataMap, not one per salon) for every real salon id the
  // For-You + Nearby + Recently-Viewed homepage rows reference, deduped internally.
  const salonCardData = await getSalonCardDataMap([
    ...Object.values(FORYOU_SALONS).flatMap((list) => list.map((s) => s.id)),
    ...NEARBY_SALON_IDS,
    ...topSalonIds,
    ...availableThisWeekIds,
    ...Object.values(topByCategory).flat(),
  ]);
  return (
    <div className="relative overflow-hidden bg-white">
      {/* V3-D137 sunset halo SCRAPPED 2026-05-25 — user ditched, reverted
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
        <ForYouSalonRows salonData={salonCardData} />
        {/* I4: real localStorage view-history tile row, search-a.html's own position (directly
            above the "Top on Solen" rail RecentlyViewed.tsx's fallback title renders below). Builds
            nothing when there is no real history , never a fabricated substitute. */}
        <RecentlyViewedTiles baselShopCount={baselShopCount} />
        <RecentlyViewed salonData={salonCardData} topSalonIds={topSalonIds} />
        <Nearby salonData={salonCardData} nearbyCount={nearbyCount} />
        {/* I3 (2026-08-01, home rails reconciliation with search-a.html): real 7-day slot
            availability, then the four per-category Top rails, both self-hiding on thin data. */}
        <AvailableThisWeek salonData={salonCardData} salonIds={availableThisWeekIds} />
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
        <Entdecken />
        <Reviews />
        <BusinessTeaser />
      </FeedZone>
    </div>
  );
}
