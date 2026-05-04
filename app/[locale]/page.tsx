import type { Metadata } from "next";
import { buildAlternates } from "@/lib/seo";

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
 * Homepage — V2 rebuild SHELL (2026-05-03).
 *
 * Intentionally empty body. The previous v2 hero attempt was deleted because
 * it violated LIVE_TRUTH §7 (horizontal-segmented search bar — banned), used
 * plum that didn't match the palette, and briefly reintroduced cream-as-page-bg
 * (retired per CLAUDE.md). Better to have a clean slate than to keep the broken
 * attempt as a reference the AI might pull from.
 *
 * Awaiting external HTML design mockup from user (will live at
 * `public/solen-v2-design.html` or similar). When mockup arrives:
 *   1. Parse the HTML, extract spec, compare against LIVE_TRUTH "locked & surviving"
 *      table in `_tasks/V2_REBUILD_LOG.md` — flag conflicts BEFORE implementing
 *   2. Implement homepage hero first as a route-scoped component in
 *      `app/[locale]/_components/`, judge in isolation
 *   3. Add other sections one at a time once hero locks
 *
 * Header, footer, cookie banner come from `app/[locale]/layout.tsx` (still legacy
 * `components-legacy/layout/*` until the route-by-route migration reaches chrome).
 */
export const revalidate = 300;

export default async function Page() {
  return <></>;
}
