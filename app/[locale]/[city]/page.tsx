import { notFound } from "next/navigation";
import { getActiveCityBySlug, getCityName, getActiveCities, type CitySlug } from "@/lib/cities";
import { buildAlternates } from "@/lib/seo";
import CityPage from "@/components-legacy/CityPage";

interface Props {
  params: Promise<{ locale: string; city: string }>;
}

// DB `cities WHERE is_active` is the runtime gate (2026-07-04 city-rollout refactor), not a
// hardcoded slug list, so the admin Staedte toggle actually adds/removes a routable city.
// `force-dynamic` (matches app/[locale]/[city]/[category]/page.tsx's existing convention) so
// the gate is re-evaluated against the LIVE DB on every request, not just at build/prerender
// time , without it, a city that was active at build time keeps serving cached static HTML
// even after being disabled, and a city disabled at build time never got a static page to
// dynamically-render in the first place. `dynamicParams = true` additionally lets a city
// enabled AFTER build resolve without a rebuild (generateStaticParams only pre-renders the
// active set AT BUILD TIME as a warm-cache convenience, not the gate).
export const dynamic = "force-dynamic";
export const dynamicParams = true;

export default async function CityRoute({ params }: Props) {
  const { city, locale } = await params;
  const row = await getActiveCityBySlug(city);
  if (!row) {
    notFound();
  }

  return <CityPage city={city as CitySlug} locale={locale} cityName={getCityName(city, locale, row)} />;
}

export async function generateStaticParams() {
  // Pre-render the currently-active set for build-time SSG; NOT the gate (see
  // dynamicParams above) , a city enabled after this build still resolves live.
  const active = await getActiveCities();
  return active.map((c) => ({ city: c.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { city, locale } = await params;
  const row = await getActiveCityBySlug(city);
  if (!row) return {};

  const cityName = getCityName(city, locale, row);
  const alternates = buildAlternates(city, locale);
  return {
    title: `Salons in ${cityName} | Solen`,
    description: `Finde die besten Salons in ${cityName}. Coiffeur, Barber, Nails & mehr, jetzt buchen auf Solen.`,
    alternates,
  };
}
