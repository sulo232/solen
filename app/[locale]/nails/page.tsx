import type { Metadata } from "next";
import CategoryPage from "@/components/CategoryPage";

export const metadata: Metadata = {
  title: "Nägel & Nailstudio in Basel — solen.ch",
  description: "Nagelstudios in Basel — Maniküre, Pediküre, Gel-Nägel. Online-Termine buchen.",
};

export default function Page() {
  return <CategoryPage category="nails" />;
}
