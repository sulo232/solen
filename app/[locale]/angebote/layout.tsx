import type { Metadata } from "next";
import type { ReactNode } from "react";

interface Props {
  params: Promise<{ locale: string }>;
  children: ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const titles: Record<string, string> = {
    de: "Angebote — Letzte freie Termine | solen.ch",
    en: "Deals — Last-minute slots | solen.ch",
    fr: "Offres — Dernières disponibilités | solen.ch",
    it: "Offerte — Ultimi posti disponibili | solen.ch",
  };
  const descriptions: Record<string, string> = {
    de: "Spontan einen Termin buchen? Entdecke Last-Minute Angebote bei Salons in Basel.",
    en: "Book a spontaneous appointment? Discover last-minute deals at salons in Basel.",
    fr: "Réserver un rendez-vous spontané? Découvrez les offres last-minute à Bâle.",
    it: "Prenotare un appuntamento spontaneo? Scopri le offerte last-minute a Basilea.",
  };
  return {
    title: titles[locale] ?? titles.de,
    description: descriptions[locale] ?? descriptions.de,
  };
}

export default function AngeboteLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
