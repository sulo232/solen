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
// V3-D150 (2026-05-25): CategoryPromos ("Stöber nach Kategorie." swipeable
// promo cards) REMOVED from homepage per user. Browsing-by-category path
// still lives via MobileCategoriesRow "Für dich" tiles (slot 3) + Header
// dropdown. Component file kept on disk for revert.
// import CategoryPromos from "./_components/homepage/CategoryPromos";
import Entdecken from "./_components/homepage/Entdecken";
import FeaturedStylists from "./_components/homepage/FeaturedStylists";
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
  de: "Solen — Finde & buche die besten Salons in der Schweiz",
  en: "Solen — Discover & Book the Best Salons in Switzerland",
  fr: "Solen — Trouve & réserve les meilleurs salons en Suisse",
  it: "Solen — Trova e prenota i migliori saloni in Svizzera",
};

const DESCRIPTIONS: Record<string, string> = {
  de: "Entdecke Top-Salons für Coiffeur, Nails, Spa & mehr in Basel, Zürich und Bern. Online buchen, sofort bestätigt. ★ Bewertungen & Preise vergleichen.",
  en: "Discover top salons for haircuts, nails, spa & more in Basel, Zurich and Bern. Book online, instant confirmation. ★ Compare reviews & prices.",
  fr: "Découvre les meilleurs salons pour coiffeur, ongles, spa & plus à Bâle, Zurich et Berne. Réservation en ligne, confirmation immédiate. ★ Comparer.",
  it: "Scopri i migliori saloni per parrucchiere, unghie, spa e altro a Basilea, Zurigo e Berna. Prenota online, conferma immediata. ★ Confronta.",
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

export default async function Page() {
  return (
    <div className="relative overflow-hidden bg-white">
      {/* V3-D137 sunset halo SCRAPPED 2026-05-25 — user ditched, reverted
          to pre-halo state. Mockup at public/solen-header-light-variants.html
          kept on disk for revival reference. */}
      <Hero />
      {/* V3-D143 (2026-05-25): MobileCategoriesRow moved INSIDE FeedZone
          to fix the 8px overlap where the rising-panel's negative margin
          (-mt-6/-mt-8, designed for Hero-overlap) was eating into the
          bottom of the Für dich tiles. Inside FeedZone, tiles sit cleanly
          above RecentlyViewed and the rising-panel-over-Hero intent is
          preserved. Semantically also better — Für dich IS feed content. */}
      <FeedZone>
        <MobileCategoriesRow />
        <RecentlyViewed />
        <Nearby />
        <FeaturedStylists />
        <Entdecken />
        <Reviews />
        <BusinessTeaser />
      </FeedZone>
    </div>
  );
}
