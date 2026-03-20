"use client";

import type { DiscoveryItem } from "@/lib/types";

interface DescriptionCardProps {
  item: DiscoveryItem;
  locale: string;
}

function getLocalizedDescription(item: DiscoveryItem, locale: string): string | null {
  const key = `description_${locale}` as keyof DiscoveryItem;
  return (item[key] as string | null) ?? item.description;
}

const FALLBACKS: Record<string, string> = {
  de: "Keine Beschreibung verfügbar.",
  en: "No description available.",
  fr: "Aucune description disponible.",
  it: "Nessuna descrizione disponibile.",
};

export default function DescriptionCard({ item, locale }: DescriptionCardProps) {
  const desc = getLocalizedDescription(item, locale);

  return (
    <div className="mt-4 px-1">
      <div className="p-4 rounded-card bg-s-bg-surface dark:bg-s-dm-surface border border-s-ink/5 dark:border-white/5">
        <p className="text-sm text-s-ink/80 dark:text-s-dm-text/80 leading-relaxed whitespace-pre-line">
          {desc || FALLBACKS[locale] || FALLBACKS.de}
        </p>
      </div>
    </div>
  );
}
