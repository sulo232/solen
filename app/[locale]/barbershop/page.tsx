import type { Metadata } from "next";
import { Suspense } from "react";
import CategoryPage from "@/components/CategoryPage";
import { BarbershopAboveGrid, BarbershopBelowGrid } from "@/components/barber/BarbershopSections";

export const metadata: Metadata = {
  title: "Barbershop in Basel — solen.ch",
  description: "Barbershops in Basel — Haarschnitt, Bart-Trimm und Grooming. Walk-in oder online buchen.",
  openGraph: {
    title: "Barbershop in Basel — solen.ch",
    description: "Finde den besten Barbershop in deiner Nähe. Skin Fades, Bart-Design, Walk-in Queue.",
    type: "website",
  },
};

export default function Page() {
  return (
    <CategoryPage
      category="barbershop"
      aboveGrid={
        <Suspense fallback={null}>
          <BarbershopAboveGrid />
        </Suspense>
      }
      belowGrid={<BarbershopBelowGrid />}
    />
  );
}
