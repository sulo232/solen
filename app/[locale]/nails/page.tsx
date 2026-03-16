import type { Metadata } from "next";
import CategoryPage from "@/components/CategoryPage";

export const metadata: Metadata = {
  title: "Nägel & Nailstudio in Basel — solen.ch",
  description: "Finde die besten Nagelstudios in Basel. Jetzt Termin buchen.",
};

export default function Page() {
  return <CategoryPage category="nails" />;
}
