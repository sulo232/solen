"use client";

import type { SalonCategory } from "@/lib/types";

interface CategoryHeroProps {
  category: SalonCategory;
  salonCount: number;
}

const CATEGORY_CONFIG: Record<SalonCategory, { label: string; subtitle: string; gradient: string }> = {
  coiffeur: {
    label: "Coiffeur",
    subtitle: "Die besten Coiffeure in Basel",
    gradient: "from-s-coral/15 via-s-coral/5 to-transparent",
  },
  barbershop: {
    label: "Barbershop",
    subtitle: "Klassische Barbershops in Basel",
    gradient: "from-dark/8 via-dark/3 to-transparent",
  },
  nails: {
    label: "Nails",
    subtitle: "Nagelstudios und Maniküre in Basel",
    gradient: "from-coral/12 via-coral/4 to-transparent",
  },
  spa: {
    label: "Spa & Massage",
    subtitle: "Wellness und Entspannung in Basel",
    gradient: "from-s-coral/12 via-blue-100/30 to-transparent",
  },
  makeup: {
    label: "Makeup",
    subtitle: "Professionelles Makeup in Basel",
    gradient: "from-purple-200/40 via-purple-100/15 to-transparent",
  },
  waxing: {
    label: "Waxing",
    subtitle: "Waxing Studios in Basel",
    gradient: "from-amber-200/40 via-amber-100/15 to-transparent",
  },
};

export default function CategoryHero({ category, salonCount }: CategoryHeroProps) {
  const config = CATEGORY_CONFIG[category];

  return (
    <div className={`bg-gradient-to-b ${config.gradient} pt-24 pb-8`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h1 className="font-heading font-bold text-2xl sm:text-4xl text-dark">
          {config.label} in Basel
        </h1>
        <p className="text-sm text-dark/50 mt-2 font-body">{config.subtitle}</p>
        {salonCount > 0 && (
          <p className="text-xs text-dark/40 mt-1 data-text">
            {salonCount} {salonCount === 1 ? "Salon" : "Salons"} verfügbar
          </p>
        )}
      </div>
    </div>
  );
}
