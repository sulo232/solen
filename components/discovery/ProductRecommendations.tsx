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
      <div className="p-4 rounded-[16px] bg-s-amber/5 dark:bg-s-dm-surface border border-s-amber/10 dark:border-s-amber/10">
        <div className="flex items-center gap-2 mb-3">
          <ShoppingBag size={14} className="text-s-amber" />
          <span className="text-xs font-medium text-s-amber">{TITLES[locale] ?? TITLES.en}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {products.map((product) => (
            <span
              key={product}
              className="text-xs px-3 py-1.5 rounded-pill bg-s-amber/10 dark:bg-s-amber/10 text-s-amber dark:text-s-amber border border-s-amber/20 dark:border-s-amber/20 font-medium"
            >
              {product}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
