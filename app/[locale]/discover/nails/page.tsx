import { Suspense } from "react";
import type { Metadata } from "next";
import NailDiscoveryGrid from "@/components/nail/NailDiscoveryGrid";
import Spinner from "@/components/ui/Spinner";

export const metadata: Metadata = {
  title: "Nail Designs entdecken | solen.ch",
  description: "Entdecke die neuesten Nail-Art Trends, Designs und Inspirationen von den besten Nagelstudios in Basel.",
  openGraph: {
    title: "Nail Designs entdecken | solen.ch",
    description: "Die neuesten Nail-Art Trends und Inspirationen aus Basel.",
  },
};

export default function NailDiscoveryPage() {
  return (
    <main className="min-h-screen bg-s-bg-base dark:bg-s-dm-bg">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold text-s-ink dark:text-s-dm-text">
            Nail Designs
          </h1>
          <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 mt-1">
            Entdecke Trends, Inspirationen und die besten Nail Artists in Basel
          </p>
        </div>

        <Suspense fallback={<div className="flex justify-center py-12"><Spinner /></div>}>
          <NailDiscoveryGrid />
        </Suspense>
      </div>
    </main>
  );
}
