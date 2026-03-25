import type { Metadata } from "next";
import { SpaBelowGrid } from "@/components/spa/SpaSections";

export const metadata: Metadata = {
  title: "Spa & Wellness in Basel — solen.ch",
  description: "Spa & Wellness in Basel — Massagen, Gesichtsbehandlungen, Sauna. Jetzt buchen.",
  openGraph: {
    title: "Spa & Wellness in Basel — solen.ch",
    description: "Entspannung pur — Massagen, Gesichtsbehandlungen und Day-Spa-Pakete in Basel.",
    type: "website",
  },
  alternates: {
    canonical: "https://solen.ch/de/spa",
    languages: { de: "https://solen.ch/de/spa", en: "https://solen.ch/en/spa", fr: "https://solen.ch/fr/spa", it: "https://solen.ch/it/spa" },
  },
};

export default function Page() {
  return (
    <div className="min-h-screen pt-24 pb-16 flex flex-col items-center justify-center">
      <SpaBelowGrid />
    </div>
  );
}
