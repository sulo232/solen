import type { Metadata } from "next";
import { WaxingBelowGrid } from "@/components/waxing/WaxingSections";

export const metadata: Metadata = {
  title: "Waxing in Basel — solen.ch",
  description: "Waxing Studios in Basel — Brazilian, Bein, Achsel, Gesicht. Termin online buchen.",
  openGraph: {
    title: "Waxing in Basel — solen.ch",
    description: "Professionelles Waxing in Basel — alle Körperzonen. Jetzt Termin buchen.",
    type: "website",
  },
  alternates: {
    canonical: "https://solen.ch/de/waxing",
    languages: { de: "https://solen.ch/de/waxing", en: "https://solen.ch/en/waxing", fr: "https://solen.ch/fr/waxing", it: "https://solen.ch/it/waxing" },
  },
};

export default function Page() {
  return (
    <div className="min-h-screen pt-24 pb-16 flex flex-col items-center justify-center">
      <WaxingBelowGrid />
    </div>
  );
}
