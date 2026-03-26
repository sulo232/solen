"use client";

import { useTranslations } from "next-intl";
import type { SalonCategory } from "@/lib/types";

interface CategoryHeroProps {
  category: SalonCategory;
  salonCount: number;
}

const CATEGORY_GRADIENTS: Record<SalonCategory, string> = {
  coiffeur: "from-s-coral/15 via-s-coral/5 to-transparent",
  barbershop: "from-dark/8 via-dark/3 to-transparent",
  nails: "from-s-coral/12 via-s-coral/4 to-transparent",
  spa: "from-s-coral/12 via-blue-100/30 to-transparent",
  makeup: "from-purple-200/40 via-purple-100/15 to-transparent",
  waxing: "from-amber-200/40 via-amber-100/15 to-transparent",
};

export default function CategoryHero({ category, salonCount }: CategoryHeroProps) {
  const t = useTranslations("categoryHero");
  const gradient = CATEGORY_GRADIENTS[category];

  return (
    <div className={`bg-gradient-to-b ${gradient} pt-24 pb-8`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h1 className="font-heading font-bold text-2xl sm:text-4xl text-s-ink">
          {t("title", { category: t(`categories.${category}`) })}
        </h1>
        <p className="text-sm text-s-ink/50 mt-2 font-body">{t("subtitle", { category: t(`categories.${category}`) })}</p>
        {salonCount > 0 && (
          <p className="text-xs text-s-ink/40 mt-1 data-text">
            {t("salonCount", { count: salonCount })}
          </p>
        )}
      </div>
    </div>
  );
}
