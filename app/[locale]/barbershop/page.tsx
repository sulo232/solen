import type { Metadata } from "next";
import CategoryPage from "@/components/CategoryPage";

export const metadata: Metadata = {
  title: "Barbershop in Basel — solen.ch",
  description: "Barbershops in Basel — Haarschnitt, Bart-Trimm und Grooming. Jetzt online buchen.",
};

export default function Page() {
  return <CategoryPage category="barbershop" />;
}
