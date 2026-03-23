import type { Metadata } from "next";
import CategoryPage from "@/components/CategoryPage";
import { MakeupAboveGrid, MakeupBelowGrid } from "@/components/makeup/MakeupSections";

export const metadata: Metadata = {
  title: "Makeup & Beauty in Basel — solen.ch",
  description: "Make-up Artists in Basel — Braut-Makeup, Abend-Look, Editorial. Online buchen.",
  openGraph: {
    title: "Makeup & Beauty in Basel — solen.ch",
    description: "Bridal, Editorial, Everyday — finde deinen Make-up Artist in Basel.",
    type: "website",
  },
};

export default function Page() {
  return (
    <CategoryPage
      category="makeup"
      aboveGrid={<MakeupAboveGrid />}
      belowGrid={<MakeupBelowGrid />}
    />
  );
}
