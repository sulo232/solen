import type { Metadata } from "next";
import CategoryPage from "@/components/CategoryPage";

export const metadata: Metadata = {
  title: "Waxing in Basel — solen.ch",
  description: "Waxing Studios in Basel — Brazilian, Bein, Achsel. Termin online buchen.",
};

export default function Page() {
  return <CategoryPage category="waxing" />;
}
