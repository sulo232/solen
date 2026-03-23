import type { Metadata } from "next";
import CategoryPage from "@/components/CategoryPage";

export const metadata: Metadata = {
  title: "Coiffeur in Basel — solen.ch",
  description: "Finde die besten Coiffeure in Basel. Buche online bei top-bewerteten Friseursalons.",
};

export default function Page() {
  return <CategoryPage category="coiffeur" />;
}
