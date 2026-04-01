import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { unstable_setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type Params = {
  locale: string;
  city: string;
  category: string;
};

const CITIES = ["basel", "zurich", "bern"];
const CATEGORIES = ["coiffeur", "nails", "barbershop", "spa", "makeup", "waxing"];

const CITY_NAMES: Record<string, Record<string, string>> = {
  basel: { de: "Basel", en: "Basel", fr: "Bâle", it: "Basilea" },
  zurich: { de: "Zürich", en: "Zurich", fr: "Zurich", it: "Zurigo" },
  bern: { de: "Bern", en: "Bern", fr: "Berne", it: "Berna" },
};

const CATEGORY_NAMES: Record<string, Record<string, string>> = {
  coiffeur: { de: "Coiffeur", en: "Hair Salon", fr: "Coiffeur", it: "Parrucchiere" },
  nails: { de: "Nagelstudio", en: "Nails", fr: "Ongles", it: "Unghie" },
  barbershop: { de: "Barbershop", en: "Barbershop", fr: "Barbershop", it: "Barbershop" },
  spa: { de: "Spa", en: "Spa", fr: "Spa", it: "Spa" },
  makeup: { de: "Makeup", en: "Makeup", fr: "Maquillage", it: "Trucco" },
  waxing: { de: "Waxing", en: "Waxing", fr: "Épilation", it: "Ceretta" },
};

export async function generateStaticParams(): Promise<Params[]> {
  const params: Params[] = [];
  for (const locale of ["de", "en", "fr", "it"]) {
    for (const city of CITIES) {
      for (const category of CATEGORIES) {
        params.push({ locale, city, category });
      }
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale, city, category } = params;

  if (!CITIES.includes(city) || !CATEGORIES.includes(category)) {
    return {};
  }

  const cityName = CITY_NAMES[city]?.[locale] || city;
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
    title: titles[locale] || titles["de"],
    description: descriptions[locale] || descriptions["de"],
  };
}

export default async function Page({
  params,
}: {
  params: Params;
}) {
  unstable_setRequestLocale(params.locale);
  const { city, category, locale } = params;

  if (!CITIES.includes(city) || !CATEGORIES.includes(category)) {
    notFound();
  }

  const t = await getTranslations("home");
  const cityName = CITY_NAMES[city]?.[locale] || city;
  const categoryName = CATEGORY_NAMES[category]?.[locale] || category;

  const admin = createAdminSupabaseClient();
  const { data: salons = [] } = await admin
    .from("salons")
    .select("*")
    .eq("is_active", true)
    .eq("is_test", false)
    .ilike("city", city);

  const filteredSalons = salons.filter(
    (salon) => salon.categories?.includes(category) ?? false
  );

  return (
    <div className="min-h-screen bg-white">
      <section className="px-5 md:px-6 lg:px-10 xl:px-20 py-12 border-b border-[#EBEBEB]">
        <h1 className="font-heading font-bold text-[28px] md:text-[36px] text-[#222222] mb-3">
          {categoryName} in {cityName}
        </h1>
        <p className="font-body text-[16px] text-[#6A6A6A] max-w-[600px] leading-relaxed">
          Entdecke die besten {categoryName} in {cityName}. Vergleiche Bewertungen, Preise und Verfügbarkeit von {filteredSalons.length} {categoryName}-Salons.
        </p>
      </section>

      <section className="px-5 md:px-6 lg:px-10 xl:px-20 py-12">
        {filteredSalons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSalons.map((salon) => (
              <div key={salon.id} className="border border-[#EBEBEB] rounded-[16px] p-4">
                <h3 className="font-heading font-bold text-[16px] text-[#222222]">
                  {salon.name}
                </h3>
                <p className="font-body text-[14px] text-[#6A6A6A] mt-1">
                  ★ {salon.average_rating || 0} ({salon.review_count || 0} reviews)
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="font-body text-[16px] text-[#6A6A6A]">
              Noch keine Salons in dieser Kategorie
            </p>
          </div>
        )}
      </section>

      <section className="px-5 md:px-6 lg:px-10 xl:px-20 py-12 border-t border-[#EBEBEB] max-w-[800px] mx-auto">
        <h2 className="font-heading font-bold text-[22px] text-[#222222] mb-6">
          Häufig gestellte Fragen
        </h2>
        <div className="space-y-6">
          <details className="border border-[#EBEBEB] rounded-[12px] p-4 cursor-pointer">
            <summary className="font-body font-semibold text-[15px] text-[#222222]">
              Wie viel kostet ein Besuch bei einem {categoryName} in {cityName}?
            </summary>
            <p className="font-body text-[14px] text-[#6A6A6A] mt-3">
              Die Preise variieren je nach Salon und Service. Nutze unsere Filterfunktion um Salons nach Preisbereich zu vergleichen.
            </p>
          </details>

          <details className="border border-[#EBEBEB] rounded-[12px] p-4 cursor-pointer">
            <summary className="font-body font-semibold text-[15px] text-[#222222]">
              Wie finde ich den besten {categoryName} in {cityName}?
            </summary>
            <p className="font-body text-[14px] text-[#6A6A6A] mt-3">
              Schau dir die Bewertungen an, vergleiche die Preise und lese die Erfahrungen anderer Kunden.
            </p>
          </details>

          <details className="border border-[#EBEBEB] rounded-[12px] p-4 cursor-pointer">
            <summary className="font-body font-semibold text-[15px] text-[#222222]">
              Kann ich online einen Termin buchen?
            </summary>
            <p className="font-body text-[14px] text-[#6A6A6A] mt-3">
              Ja! Alle Salons auf Solen ermöglichen Online-Buchungen.
            </p>
          </details>
        </div>
      </section>
    </div>
  );
}
