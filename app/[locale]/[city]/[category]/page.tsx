import { notFound } from "next/navigation";
import { unstable_setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import SearchTemplate from "@/app/[locale]/_components/search/SearchTemplate";
import type { SalonCategory } from "@/lib/types";
import { getActiveCityBySlug, getActiveCities, getCityName, type CitySlug } from "@/lib/cities";

export const dynamic = "force-dynamic";
// DB `cities WHERE is_active` is the runtime gate (2026-07-04 city-rollout refactor); a city
// enabled after build still resolves without a rebuild. See app/[locale]/[city]/page.tsx.
export const dynamicParams = true;

type Params = {
  locale: string;
  city: string;
  category: string;
};

const CATEGORIES = ["coiffeur", "nails", "barbershop", "spa"] as const;

const CATEGORY_NAMES: Record<string, Record<string, string>> = {
  coiffeur: { de: "Coiffeur", en: "Hair Salon", fr: "Coiffeur", it: "Parrucchiere" },
  nails: { de: "Nagelstudio", en: "Nails", fr: "Ongles", it: "Unghie" },
  barbershop: { de: "Barbershop", en: "Barbershop", fr: "Barbershop", it: "Barbershop" },
  spa: { de: "Spa", en: "Spa", fr: "Spa", it: "Spa" },
};

export async function generateStaticParams(): Promise<Params[]> {
  // Pre-render the currently-active set for build-time SSG; NOT the gate (dynamicParams
  // above handles a city enabled after this build without a rebuild).
  const active = await getActiveCities();
  const params: Params[] = [];
  for (const locale of ["de", "en", "fr", "it"]) {
    for (const c of active) {
      for (const category of CATEGORIES) {
        params.push({ locale, city: c.slug, category });
      }
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale, city, category } = await params;

  const row = await getActiveCityBySlug(city);
  if (!row || !(CATEGORIES as readonly string[]).includes(category)) {
    return {};
  }

  const cityName = getCityName(city, locale, row);
  const categoryName = CATEGORY_NAMES[category]?.[locale] || category;

  const titles: Record<string, string> = {
    de: `Beste ${categoryName} in ${cityName} — Jetzt buchen | Solen`,
    en: `Best ${categoryName} in ${cityName} — Book now | Solen`,
    fr: `Meilleurs ${categoryName} à ${cityName} — Réservez maintenant | Solen`,
    it: `Migliori ${categoryName} a ${cityName} — Prenota ora | Solen`,
  };

  const descriptions: Record<string, string> = {
    de: `Entdecke die besten ${categoryName} in ${cityName}. Vergleiche Bewertungen, Preise und Verfügbarkeit. Online-Buchung verfügbar.`,
    en: `Discover the best ${categoryName} in ${cityName}. Compare reviews, prices, and availability. Book online now.`,
    fr: `Découvrez les meilleurs ${categoryName} à ${cityName}. Comparez les avis, les prix et la disponibilité. Réservez en ligne.`,
    it: `Scopri i migliori ${categoryName} a ${cityName}. Confronta recensioni, prezzi e disponibilità. Prenota online.`,
  };

  return {
    title: titles[locale] || titles.de,
    description: descriptions[locale] || descriptions.de,
  };
}

function CityCategoryFaq({ cityName, categoryName }: { cityName: string; categoryName: string }) {
  return (
    <section className="px-5 md:px-6 lg:px-10 xl:px-20 py-12 border-t border-s-border max-w-[800px] mx-auto">
      {/* V3-D262 (W4, 2026-05-27): FAQ h2 to LOCKFILE Section spec (20-24px / 600 / -0.02em) */}
      <h2 className="font-heading text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink mb-6">
        Häufig gestellte Fragen
      </h2>
      <div className="space-y-3">
        <details className="border border-s-border rounded-input p-4 cursor-pointer">
          <summary className="font-body font-semibold text-base text-s-ink">
            Wie viel kostet ein Besuch bei einem {categoryName} in {cityName}?
          </summary>
          <p className="font-body text-sm text-s-ink-2 mt-3">
            Die Preise variieren je nach Salon und Service. Nutze unsere Filterfunktion um Salons nach Preisbereich zu vergleichen.
          </p>
        </details>

        <details className="border border-s-border rounded-input p-4 cursor-pointer">
          <summary className="font-body font-semibold text-base text-s-ink">
            Wie finde ich den besten {categoryName} in {cityName}?
          </summary>
          <p className="font-body text-sm text-s-ink-2 mt-3">
            Schau dir die Bewertungen an, vergleiche die Preise und lese die Erfahrungen anderer Kunden.
          </p>
        </details>

        <details className="border border-s-border rounded-input p-4 cursor-pointer">
          <summary className="font-body font-semibold text-base text-s-ink">
            Kann ich online einen Termin buchen?
          </summary>
          <p className="font-body text-sm text-s-ink-2 mt-3">
            Ja. Alle Salons auf Solen ermöglichen Online-Buchungen.
          </p>
        </details>
      </div>
    </section>
  );
}

export default async function Page({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, city, category } = await params;
  unstable_setRequestLocale(locale);

  const row = await getActiveCityBySlug(city);
  if (!row || !(CATEGORIES as readonly string[]).includes(category)) {
    notFound();
  }

  const cityName = getCityName(city, locale, row);
  const categoryName = CATEGORY_NAMES[category]?.[locale] || category;

  return (
    // V3-D262 (W4, 2026-05-27): rewired from broken handcrafted page (raw bare salon
    // divs + no filters) to SearchTemplate — same pattern as /makeup + /waxing fix
    // (V3-D241 in W2). City + service filter inherited via SearchTemplate props.
    <SearchTemplate
      locale={locale}
      serviceFilter={category as SalonCategory}
      cityFilter={city as CitySlug}
      breadcrumb={[
        { label: "Solen", href: `/${locale}` },
        { label: cityName, href: `/${locale}/${city}` },
        { label: categoryName },
      ]}
      hero={{
        title: `${categoryName} in ${cityName}`,
        subtitle: `Entdecke die besten ${categoryName} in ${cityName}. Vergleiche Bewertungen, Preise und Verfügbarkeit.`,
      }}
      belowSlot={<CityCategoryFaq cityName={cityName} categoryName={categoryName} />}
    />
  );
}
