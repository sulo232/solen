"use client";

import { ShoppingBag } from "lucide-react";

interface ProductRecommendationsProps {
  products: string[];
  locale: string;
}

const TITLES: Record<string, string> = {
  de: "Produkte für diesen Look",
  en: "Products for this look",
  fr: "Produits pour ce look",
  it: "Prodotti per questo look",
};

export default function ProductRecommendations({ products, locale }: ProductRecommendationsProps) {
  if (!products || products.length === 0) return null;

  return (
    <div className="mt-4 px-1">
      {/* V3-D346 Pass-2 (2026-05-29): amber → neutral ink (A9) — products aren't a warning/semantic state. */}
      <div className="p-4 rounded-[16px] bg-s-ink/5 border border-s-border">
        <div className="flex items-center gap-2 mb-3">
          <ShoppingBag size={14} className="text-s-ink-3" />
          <span className="text-xs font-medium text-s-ink">{TITLES[locale] ?? TITLES.en}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {products.map((product) => (
            <span
              key={product}
              className="text-xs px-3 py-1.5 rounded-pill bg-s-bg-sunken text-s-ink/70 border border-s-border font-medium"
            >
              {product}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
