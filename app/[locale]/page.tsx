import type { Metadata } from "next";
import HomePage from "@/components/HomePage";
import { generateWebsiteSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "solen.ch — Beauty & Wellness Booking in Basel",
  description: "Entdecke die besten Salons in Basel. Coiffeur, Barbershop, Nails, Spa, Makeup, Waxing — online buchen auf solen.ch.",
  openGraph: {
    title: "solen.ch — Beauty & Wellness Booking in Basel",
    description: "Entdecke die besten Salons in Basel. Coiffeur, Barbershop, Nails, Spa, Makeup, Waxing — online buchen.",
    type: "website",
    url: "https://solen.ch/de",
    siteName: "solen.ch",
  },
  alternates: {
    canonical: "https://solen.ch/de",
    languages: { de: "https://solen.ch/de", en: "https://solen.ch/en", fr: "https://solen.ch/fr", it: "https://solen.ch/it" },
  },
};

export default function Page() {
  const jsonLd = generateWebsiteSchema("de");
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div>
        <HomePage />
      </div>
    </>
  );
}
