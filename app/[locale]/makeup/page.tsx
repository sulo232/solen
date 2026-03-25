import type { Metadata } from "next";
import { MakeupBelowGrid } from "@/components/makeup/MakeupSections";

export const metadata: Metadata = {
  title: "Makeup & Beauty in Basel — solen.ch",
  description: "Make-up Artists in Basel — Braut-Makeup, Editorial, Abend-Look. Online buchen.",
  openGraph: {
    title: "Makeup & Beauty in Basel — solen.ch",
    description: "Professionelle Make-up Artists für jeden Anlass — Hochzeit, Editorial, Alltag.",
    type: "website",
  },
  alternates: {
    canonical: "https://solen.ch/de/makeup",
    languages: { de: "https://solen.ch/de/makeup", en: "https://solen.ch/en/makeup", fr: "https://solen.ch/fr/makeup", it: "https://solen.ch/it/makeup" },
  },
};

export default function Page() {
  return (
    <div className="min-h-screen pt-24 pb-16 flex flex-col items-center justify-center">
      <MakeupBelowGrid />
    </div>
  );
}
