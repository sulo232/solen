import type { Metadata } from "next";
import CategoryPage from "@/components/CategoryPage";
import { MakeupAboveGrid, MakeupBelowGrid } from "@/components/makeup/MakeupSections";

export const metadata: Metadata = {
  title: "Makeup & Beauty in Basel — solen.ch",
  description: "Make-up Artists in Basel — Braut-Makeup, Editorial, Abend-Look. Online buchen.",
  openGraph: {
    title: "Makeup & Beauty in Basel — solen.ch",
    description: "Professionelle Make-up Artists für jeden Anlass — Hochzeit, Editorial, Alltag.",
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
