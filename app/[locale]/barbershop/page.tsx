import type { Metadata } from "next";
import CategoryPage from "@/components/CategoryPage";

export const metadata: Metadata = {
  title: "Barbershop in Basel — solen.ch",
  description: "Finde die besten Barbershops in Basel. Jetzt Termin buchen.",
};

export default function Page() {
  return <CategoryPage category="barbershop" />;
}
