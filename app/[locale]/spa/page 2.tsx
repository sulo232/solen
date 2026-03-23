import type { Metadata } from "next";
import CategoryPage from "@/components/CategoryPage";
import { SpaBelowGrid } from "@/components/spa/SpaSections";

export const metadata: Metadata = {
  title: "Spa & Wellness in Basel — solen.ch",
  description: "Spa & Wellness in Basel — Massagen, Gesichtsbehandlungen, Sauna. Jetzt buchen.",
  openGraph: {
    title: "Spa & Wellness in Basel — solen.ch",
    description: "Entspannung pur — Massagen, Gesichtsbehandlungen und Day-Spa-Pakete in Basel.",
    type: "website",
  },
};

export default function Page() {
  return (
    <CategoryPage
      category="spa"
      belowGrid={<SpaBelowGrid />}
    />
  );
}
