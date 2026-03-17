import type { Metadata } from "next";
import CategoryPage from "@/components/CategoryPage";

export const metadata: Metadata = {
  title: "Waxing in Basel — solen.ch",
  description: "Finde die besten Waxing-Studios in Basel. Jetzt Termin buchen.",
};

export default function Page() {
  return <CategoryPage category="waxing" />;
}
