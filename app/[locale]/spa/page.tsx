import type { Metadata } from "next";
import CategoryPage from "@/components/CategoryPage";

export const metadata: Metadata = {
  title: "Spa & Wellness in Basel — solen.ch",
  description: "Finde die besten Spas und Wellness-Studios in Basel. Jetzt Termin buchen.",
};

export default function Page() {
  return <CategoryPage category="spa" />;
}
