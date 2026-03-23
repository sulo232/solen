import type { Metadata } from "next";
import CategoryPage from "@/components/CategoryPage";
import { WaxingAboveGrid, WaxingBelowGrid } from "@/components/waxing/WaxingSections";

export const metadata: Metadata = {
  title: "Waxing in Basel — solen.ch",
  description: "Waxing Studios in Basel — Brazilian, Bein, Achsel, Gesicht. Termin online buchen.",
  openGraph: {
    title: "Waxing in Basel — solen.ch",
    description: "Professionelles Waxing in Basel — alle Körperzonen. Jetzt Termin buchen.",
    type: "website",
  },
};

export default function Page() {
  return (
    <CategoryPage
      category="waxing"
      aboveGrid={<WaxingAboveGrid />}
      belowGrid={<WaxingBelowGrid />}
    />
  );
}
