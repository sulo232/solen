"use client";

import Link from "next/link";
import { Scissors, User, Sparkles, Waves, Palette, Zap } from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";
import type { SalonCategory } from "@/lib/types";

interface ServiceTileProps {
  category: SalonCategory;
  minPrice?: number;
  isFavorite?: boolean;
  locale?: string;
}

const categoryConfig: Record<SalonCategory, { label: string; Icon: React.FC<{ className?: string }> }> = {
  coiffeur: { label: "Coiffeur", Icon: Scissors },
  barbershop: { label: "Barbershop", Icon: User },
  nails: { label: "Nägel", Icon: Sparkles },
  spa: { label: "Spa", Icon: Waves },
  makeup: { label: "Makeup", Icon: Palette },
  waxing: { label: "Waxing", Icon: Zap },
};

export default function ServiceTile({ category, minPrice, isFavorite = false, locale = "de" }: ServiceTileProps) {
  const { label, Icon } = categoryConfig[category];

  return (
    <Link
      href={`/${locale}/${category}`}
      className="relative flex-shrink-0 flex flex-col items-center justify-center gap-2 w-28 h-28 rounded-card bg-white dark:bg-s-dm-surface shadow-warm-sm hover:shadow-warm-lg hover:-translate-y-[5px] transition-all duration-250 p-3"
    >
      {isFavorite && (
        <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-pill bg-s-coral text-white text-[9px] font-medium leading-none">
          Favorit
        </span>
      )}
      <div className="w-10 h-10 rounded-pill bg-s-coral/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-s-coral" />
      </div>
      <div className="text-center">
        <p className="text-xs font-medium text-s-ink">{label}</p>
        {minPrice != null && (
          <p className="text-[10px] data-text text-s-ink/50 mt-0.5">ab {formatCurrency(minPrice, locale)}</p>
        )}
      </div>
    </Link>
  );
}
