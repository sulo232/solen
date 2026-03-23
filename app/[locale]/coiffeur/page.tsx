import type { Metadata } from "next";
import CategoryPage from "@/components/CategoryPage";
import { CoiffeurAboveGrid, CoiffeurBelowGrid } from "@/components/coiffeur/CoiffeurSections";

export const metadata: Metadata = {
  title: "Coiffeur in Basel — solen.ch",
  description: "Finde die besten Coiffeure in Basel. Buche online bei top-bewerteten Friseursalons.",
  openGraph: {
    title: "Coiffeur in Basel — solen.ch",
    description: "Top Coiffeure in Basel — Schnitt, Farbe, Styling. Jetzt online buchen.",
    type: "website",
  },
};

export default function Page() {
  return (
    <CategoryPage
      category="coiffeur"
      aboveGrid={<CoiffeurAboveGrid />}
      belowGrid={<CoiffeurBelowGrid />}
    />
  );
}
