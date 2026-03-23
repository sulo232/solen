import type { Metadata } from "next";
import CategoryPage from "@/components/CategoryPage";

export const metadata: Metadata = {
  title: "Makeup & Beauty in Basel — solen.ch",
  description: "Make-up Artists in Basel — Braut-Makeup, Abend-Look. Online buchen.",
};

export default function Page() {
  return <CategoryPage category="makeup" />;
}
