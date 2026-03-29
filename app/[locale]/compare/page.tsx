import type { Metadata } from "next";
import ComparePageClient from "./ComparePageClient";

export const metadata: Metadata = {
  title: "Salons vergleichen | Solen",
  description: "Vergleiche mehrere Salons auf einen Blick — Bewertungen, Preise, Öffnungszeiten und mehr.",
};

interface ComparePageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ compare?: string }>;
}

export default async function ComparePage({ params, searchParams }: ComparePageProps) {
  const { locale } = await params;
  const { compare } = await searchParams;

  // Parse IDs from query param: ?compare=id1,id2,id3
  const ids = compare
    ? compare
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
        .slice(0, 4) // max 4
    : [];

  return <ComparePageClient locale={locale} initialIds={ids} />;
}
