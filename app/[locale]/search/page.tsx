import { Suspense } from "react";
import type { Metadata } from "next";
import SplitView from "@/components-legacy/search/SplitView";
import { buildAlternates } from "@/lib/seo";

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

export default async function SearchPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;

  return (
    <main className="min-h-screen bg-white">
      <Suspense>
        <SplitView locale={locale} initialFilters={sp} />
      </Suspense>
    </main>
  );
}
