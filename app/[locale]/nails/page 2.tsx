import type { Metadata } from "next";
import CategoryPage from "@/components/CategoryPage";
import { NailsAboveGrid, NailsBelowGrid } from "@/components/nail/NailsSections";

export const metadata: Metadata = {
  title: "Nägel & Nailstudio in Basel — solen.ch",
  description: "Nagelstudios in Basel — Maniküre, Pediküre, Gel-Nägel, Nail Art. Online-Termine buchen.",
  openGraph: {
    title: "Nailstudio in Basel — solen.ch",
    description: "Gel, Acryl, BIAB, Nail Art — finde dein Nailstudio in Basel und buche online.",
    type: "website",
  },
};

export default function Page() {
  return (
    <CategoryPage
      category="nails"
      aboveGrid={<NailsAboveGrid />}
      belowGrid={<NailsBelowGrid />}
    />
  );
}
