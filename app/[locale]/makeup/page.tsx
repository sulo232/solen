import type { Metadata } from "next";
import CategoryPage from "@/components/CategoryPage";

export const metadata: Metadata = {
  title: "Makeup & Beauty in Basel — solen.ch",
  description: "Finde die besten Makeup-Artists und Beauty-Studios in Basel. Jetzt Termin buchen.",
};

export default function Page() {
  return <CategoryPage category="makeup" />;
}
