import type { Metadata } from "next";
import { Suspense } from "react";
import Skeleton from "@/components/ui/Skeleton";
import TreatmentsClient from "./TreatmentsClient";

type Props = {
  params: Promise<{ locale: string; slug: string[] }>;
};

function toTitle(parts: string[]): string {
  return parts
    .map((s) => s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(" › ");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const parts = slug ?? [];
  const pageTitle = toTitle(parts);
  const title = pageTitle
    ? `${pageTitle} in Basel — solen.ch`
    : "Behandlungen in Basel — solen.ch";
  const description = pageTitle
    ? `Finde die besten Salons für ${pageTitle} in Basel. Vergleiche Preise, lies Bewertungen und buche online auf solen.ch.`
    : "Entdecke alle Behandlungen in Basel. Coiffeur, Spa, Nails, Makeup und mehr — online buchen auf solen.ch.";

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
  };
}

export default async function Page(_props: Props) {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-32 pb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} variant="card" />
            ))}
          </div>
        </div>
      }
    >
      <TreatmentsClient />
    </Suspense>
  );
}
