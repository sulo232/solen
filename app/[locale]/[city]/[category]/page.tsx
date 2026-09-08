import { notFound } from "next/navigation";
import { unstable_setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import SearchTemplate from "@/app/[locale]/_components/search/SearchTemplate";
import type { SalonCategory } from "@/lib/types";
import { getActiveCityBySlug, getActiveCities, getCityName, type CitySlug } from "@/lib/cities";
import { getFilterAvailability } from "@/lib/search/filter-availability";
import { buildAlternates, generateBreadcrumbSchema, safeJsonLd } from "@/lib/seo";

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
  const alternates = buildAlternates(`${city}/${category}`, locale);

  const titles: Record<string, string> = {
    de: `Beste ${categoryName} in ${cityName} - Termin buchen | Solen`,
    en: `Best ${categoryName} in ${cityName} - Book appointment | Solen`,
    fr: `Meilleurs ${categoryName} à ${cityName} - Prendre rendez-vous | Solen`,
    it: `Migliori ${categoryName} a ${cityName} - Prenota appuntamento | Solen`,
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
    alternates,
  };
}

// A7-city-category-seo (2026-07-27): the FAQ used to be German-only literal copy served
// verbatim under /en/, /fr/, /it/ too. Content is now built per locale + interpolated with
// the real city/category name, never a hardcoded "Basel". A locale with no entry here falls
// back to de rather than rendering mismatched text.
const CITY_CATEGORY_FAQ_COPY: Record<
  string,
  {
    heading: string;
    items: (cityName: string, categoryName: string) => { q: string; a: string }[];
  }
> = {
  de: {
    heading: "Häufig gestellte Fragen",
    items: (cityName, categoryName) => [
      {
        q: `Wie viel kostet ein Besuch bei einem ${categoryName} in ${cityName}?`,
        a: "Die Preise variieren je nach Salon und Service. Nutzen Sie unsere Filterfunktion, um Salons nach Preisbereich zu vergleichen.",
      },
      {
        q: `Wie finde ich den besten ${categoryName} in ${cityName}?`,
        a: "Schauen Sie sich die Bewertungen an, vergleichen Sie die Preise und lesen Sie die Erfahrungen anderer Kunden.",
      },
      {
        q: "Kann ich online einen Termin buchen?",
        a: "Ja. Alle Salons auf Solen ermöglichen Online-Buchungen.",
      },
    ],
  },
  en: {
    heading: "Frequently asked questions",
    items: (cityName, categoryName) => [
      {
        q: `How much does a visit to a ${categoryName} in ${cityName} cost?`,
        a: "Prices vary by store and service. Use our filter to compare stores by price range.",
      },
      {
        q: `How do I find the best ${categoryName} in ${cityName}?`,
        a: "Check the reviews, compare prices and read other customers' experiences.",
      },
      {
        q: "Can I book an appointment online?",
        a: "Yes. Every store on Solen supports online booking.",
      },
    ],
  },
  fr: {
    heading: "Questions fréquentes",
    items: (cityName, categoryName) => [
      {
        q: `Combien coûte une visite chez un ${categoryName} à ${cityName}?`,
        a: "Les prix varient selon le store et le service. Utilise notre filtre pour comparer les stores par fourchette de prix.",
      },
      {
        q: `Comment trouver le meilleur ${categoryName} à ${cityName}?`,
        a: "Consulte les avis, compare les prix et lis les expériences des autres clients.",
      },
      {
        q: "Puis-je réserver un rendez-vous en ligne?",
        a: "Oui. Tous les stores sur Solen permettent la réservation en ligne.",
      },
    ],
  },
  it: {
    heading: "Domande frequenti",
    items: (cityName, categoryName) => [
      {
        q: `Quanto costa una visita da un ${categoryName} a ${cityName}?`,
        a: "I prezzi variano in base allo store e al servizio. Usa il nostro filtro per confrontare gli store per fascia di prezzo.",
      },
      {
        q: `Come trovo il miglior ${categoryName} a ${cityName}?`,
        a: "Guarda le recensioni, confronta i prezzi e leggi le esperienze degli altri clienti.",
      },
      {
        q: "Posso prenotare un appuntamento online?",
        a: "Sì. Tutti gli store su Solen permettono la prenotazione online.",
      },
    ],
  },
};

function CityCategoryFaq({
  locale,
  cityName,
  categoryName,
}: {
  locale: string;
  cityName: string;
  categoryName: string;
}) {
  const copy = CITY_CATEGORY_FAQ_COPY[locale] || CITY_CATEGORY_FAQ_COPY.de;
  const items = copy.items(cityName, categoryName);

  return (
    <section className="px-5 md:px-6 lg:px-10 xl:px-20 py-12 border-t border-s-border max-w-[800px] mx-auto">
      {/* V3-D262 (W4, 2026-05-27): FAQ h2 to LOCKFILE Section spec (20-24px / 600 / -0.02em) */}
      <h2 className="font-heading text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink mb-6">
        {copy.heading}
      </h2>
      {/* mockup-ok: S1 fix, one grouped list card (rounded-card + border-s-border), rows share
          a hairline instead of each carrying its own border/rounded/padding chrome (approved
          public/_mockups/fixes-refined) */}
      <div className="rounded-card border border-s-border bg-white overflow-hidden">
        {items.map((item) => (
          <details key={item.q} className="border-t border-s-border p-4 cursor-pointer first:border-t-0">
            <summary className="font-body font-semibold text-base text-s-ink">{item.q}</summary>
            <p className="font-body text-sm text-s-ink-2 mt-3">{item.a}</p>
          </details>
        ))}
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
  const filterAvailability = await getFilterAvailability();
  const breadcrumb = generateBreadcrumbSchema([
    { name: "Solen", item: buildAlternates("", locale).canonical },
    { name: cityName, item: buildAlternates(city, locale).canonical },
    { name: categoryName },
  ]);

  return (
    // V3-D262 (W4, 2026-05-27): rewired from broken handcrafted page (raw bare salon
    // divs + no filters) to SearchTemplate, same pattern as /makeup + /waxing fix
    // (V3-D241 in W2). City + service filter inherited via SearchTemplate props.
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumb) }} />
    <SearchTemplate
      locale={locale}
      serviceFilter={category as SalonCategory}
      cityFilter={city as CitySlug}
      filterAvailability={filterAvailability}
      breadcrumb={[
        { label: "Solen", href: `/${locale}` },
        { label: cityName, href: `/${locale}/${city}` },
        { label: categoryName },
      ]}
      hero={{
        title: `${categoryName} in ${cityName}`,
        subtitle: `Entdecke die besten ${categoryName} in ${cityName}. Vergleiche Bewertungen, Preise und Verfügbarkeit.`,
      }}
      belowSlot={<CityCategoryFaq locale={locale} cityName={cityName} categoryName={categoryName} />}
    />
    </>
  );
}
