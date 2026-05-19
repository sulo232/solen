import type { Metadata } from "next";
import { buildAlternates } from "@/lib/seo";
import Hero from "./_components/homepage/Hero";
import { FeedZone } from "./_components/homepage/SectionHeader";
// V3-D82 (2026-05-19): hero atmosphere now lives inline inside Hero.tsx
// as a CSS double-radial-gradient (locked from V1 variant of the
// solen-hero-background-variants.html mockup). HeroSpotlight + AtmosphereBlobs
// retired (kept on disk for reference).
import RecentlyViewed from "./_components/homepage/RecentlyViewed";
// V3-D75 (2026-05-18): LastMinute retired per user "ditch last minute".
// Replaced by ArtistOfTheMonth — curated featured-stylist carousel using
// AnimatedTestimonials primitive (Aceternity-style). LastMinute.tsx file
// preserved for now in case we want to re-introduce as a promo banner later.
import ArtistOfTheMonth from "./_components/homepage/ArtistOfTheMonth";
import Nearby from "./_components/homepage/Nearby";
// V3-D75-promos (2026-05-18): Uber-style swipeable category promo cards.
// Adds a top-level browsing path BY category between location-based (Nearby)
// and stylist-focused (FeaturedStylists) feeds.
import CategoryPromos from "./_components/homepage/CategoryPromos";
import Coiffeur from "./_components/homepage/Coiffeur";
import Entdecken from "./_components/homepage/Entdecken";
import FeaturedStylists from "./_components/homepage/FeaturedStylists";
// V3-D75-bento (2026-05-18): SalonRegister (WhySolen.tsx) retired in favor of
// BentoBusiness — Apple-style interactive 4-card bento grid (3D tilt, animated
// internal visuals, scroll-triggered fade-up). WhySolen.tsx preserved on disk
// for rollback / reference.
import BentoBusiness from "./_components/homepage/BentoBusiness";
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
 * Homepage — V3 rebuild (V2-D26 typography + V2-D15-3 brand pivot).
 *
 * Section-by-section port from `public/solen-v2-homepage.html`:
 *   ✅ §13 Hero (this commit)
 *   ⏳ §16 SalonCard primitive (next)
 *   ⏳ Recently Viewed / Last-Minute / Nearby / 4 categories
 *   ⏳ Looks (entdecken) / Loyalty / City picker / Spotlight
 *   ⏳ Reviews testimonial / Trust banner
 *
 * Header, footer, cookie banner still come from `app/[locale]/layout.tsx`
 * (legacy `components-legacy/layout/*`) — header port is its own commit.
 */
export const revalidate = 300;

export default async function Page() {
  return (
    <div className="relative overflow-hidden bg-white">
      {/* V3-D86 (2026-05-19): atmosphere wash REMOVED per user direction —
          pure white + (selectively) very-soft off-white sections (Airbnb
          pattern). Decorative gradients fail the "earned by function" test;
          they don't help users scan, trust, or act. Background returns to
          plain white; off-white feature-section bgs added per-section as
          needed (TBD which sections — user picks). */}
      <Hero />
      {/* All feed sections sit inside a rising-panel FeedZone (V2-D41-fu
          rising-panel pattern locked 2026-05-09). Hero zone keeps the
          colorful wash; feed zone is a calmer white-glass surface that
          rises with rounded top corners + upward shadow. */}
      <FeedZone>
        <RecentlyViewed />
        <ArtistOfTheMonth />
        <Nearby />
        <CategoryPromos />
        {/* V2-D46: action-copy stylist showcase between geo+category feeds */}
        <FeaturedStylists />
        <Coiffeur />
        {/* V2-D49f: Entdecken preview — TikTok-style vertical look cards
            sit between category browse + social proof per discovery rhythm. */}
        <Entdecken />
        <Reviews />
        {/* V3-D75-bento: B2B interactive bento grid (4 features) */}
        <BentoBusiness />
      </FeedZone>
    </div>
  );
}
