import type { Metadata } from "next";
import { buildAlternates } from "@/lib/seo";
import Hero from "./_components/homepage/Hero";
import RecentlyViewed from "./_components/homepage/RecentlyViewed";

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
      <Hero />
      <RecentlyViewed />
    </>
  );
}
