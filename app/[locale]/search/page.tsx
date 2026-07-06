import { Suspense } from "react";
import type { Metadata } from "next";
import SearchTemplate from "@/app/[locale]/_components/search/SearchTemplate";
import { buildAlternates } from "@/lib/seo";
import { getFilterAvailability } from "@/lib/search/filter-availability";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const titles: Record<string, string> = {
    de: "Salons in Basel suchen | solen.ch",
    en: "Search salons in Basel | solen.ch",
    fr: "Chercher des salons à Bâle | solen.ch",
    it: "Cerca saloni a Basilea | solen.ch",
  };
  const descriptions: Record<string, string> = {
    de: "Finde deinen perfekten Salon in Basel. Filter nach Kategorie, Verfügbarkeit und Preis.",
    en: "Find your perfect salon in Basel. Filter by category, availability and price.",
    fr: "Trouvez votre salon idéal à Bâle. Filtrez par catégorie, disponibilité et prix.",
    it: "Trova il tuo salone perfetto a Basilea. Filtra per categoria, disponibilità e prezzo.",
  };
  const alternates = buildAlternates("search", locale);

  return {
    title: titles[locale] ?? titles.de,
    description: descriptions[locale] ?? descriptions.de,
    alternates,
  };
}

export default async function SearchPage({ params }: Props) {
  // V3-D230 (2026-05-26): swapped legacy SplitView → unified SearchTemplate.
  // Server consumes `params` only; searchParams are read client-side via
  // useSearchParams inside SearchTemplate so URL filter chips stay live.
  const { locale } = await params;
  const filterAvailability = await getFilterAvailability();

  return (
    <main className="min-h-screen bg-s-bg-base">
      <Suspense>
        <SearchTemplate
          locale={locale}
          serviceFilter={null}
          filterAvailability={filterAvailability}
          breadcrumb={[
            { label: "Solen", href: `/${locale}` },
            { label: "Suche" },
          ]}
        />
      </Suspense>
    </main>
  );
}
