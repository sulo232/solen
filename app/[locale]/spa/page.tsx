import type { Metadata } from "next";
import CategoryPage from "@/components/CategoryPage";

export const metadata: Metadata = {
  title: "Spa & Wellness in Basel — solen.ch",
  description: "Spa & Wellness in Basel — Massagen, Gesichtsbehandlungen, Sauna. Jetzt buchen.",
};

export default function Page() {
  return <CategoryPage category="spa" />;
}
