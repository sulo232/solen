import type { Metadata } from "next";
import { buildAlternates } from "@/lib/seo";
import Hero from "./_components/homepage/Hero";
import { FeedZone } from "./_components/homepage/SectionHeader";
import { AtmosphereBlobs } from "./_components/homepage/AtmosphereBlobs";
import { AtmosphereGrain } from "./_components/homepage/AtmosphereGrain";
import RecentlyViewed from "./_components/homepage/RecentlyViewed";
import LastMinute from "./_components/homepage/LastMinute";
import Nearby from "./_components/homepage/Nearby";
import Coiffeur from "./_components/homepage/Coiffeur";
import Entdecken from "./_components/homepage/Entdecken";
import FeaturedStylists from "./_components/homepage/FeaturedStylists";
import SalonRegister from "./_components/homepage/WhySolen";
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
    <>
      {/* V2-D45 (2026-05-09): atmosphere blobs — 6 heavily-blurred
          organic shapes in V3 palette (no pink/coral). Adds personality
          + warm anchors (sandy beige + cream) over the all-blue body
          wash. Sits z-0, fixed, pointer-events-none, isolated. Content
          siblings render above by document order. */}
      <AtmosphereBlobs />
      {/* V2-D45-3 (2026-05-09): subtle film-grain noise overlay via SVG
          feTurbulence. Adds editorial / tactile texture. opacity 0.05 +
          overlay blend = barely-there. No asset weight (procedural). */}
      <AtmosphereGrain />
      <Hero />
      {/* All feed sections sit inside a rising-panel FeedZone (V2-D41-fu
          rising-panel pattern locked 2026-05-09). Hero zone keeps the
          colorful wash; feed zone is a calmer white-glass surface that
          rises with rounded top corners + upward shadow. */}
      <FeedZone>
        <RecentlyViewed />
        <LastMinute />
        <Nearby />
        {/* V2-D46: action-copy stylist showcase between geo+category feeds */}
        <FeaturedStylists />
        <Coiffeur />
        {/* V2-D49f: Entdecken preview — TikTok-style vertical look cards
            sit between category browse + social proof per discovery rhythm. */}
        <Entdecken />
        <Reviews />
        {/* V2-D46: B2B salon-register CTA */}
        <SalonRegister />
      </FeedZone>
    </>
  );
}
