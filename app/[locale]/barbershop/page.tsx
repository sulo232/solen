import type { Metadata } from "next";
import CategoryPage from "@/components/CategoryPage";
import { BarbershopAboveGrid, BarbershopBelowGrid } from "@/components/barber/BarbershopSections";

export const metadata: Metadata = {
  title: "Barbershop in Basel — solen.ch",
  description: "Barbershops in Basel — Haarschnitt, Bart-Trimm und Grooming. Jetzt online buchen.",
  openGraph: {
    title: "Barbershop in Basel — solen.ch",
    description: "Top Barbershops in Basel — Fade, Skin Fade, Bart. Jetzt online buchen.",
    type: "website",
  },
};

export default function Page() {
  return (
    <CategoryPage
      category="barbershop"
      aboveGrid={<BarbershopAboveGrid />}
      belowGrid={<BarbershopBelowGrid />}
    />
  );
}
