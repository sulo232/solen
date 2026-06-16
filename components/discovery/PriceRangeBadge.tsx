"use client";

import { formatCurrency } from "@/lib/format-currency";

interface PriceRangeBadgeProps {
  priceMin: number | null;
  priceMax: number | null;
}

export default function PriceRangeBadge({ priceMin, priceMax }: PriceRangeBadgeProps) {
  if (!priceMin && !priceMax) return null;

  const label = priceMin && priceMax
    ? `${formatCurrency(priceMin)}–${formatCurrency(priceMax)}`
    : priceMin ? `ab ${formatCurrency(priceMin)}` : null;

  if (!label) return null;

  return (
    <span className="text-[10px] px-2 py-1 rounded-pill bg-white/90 dark:bg-s-dm-surface/90 text-s-ink dark:text-s-dm-text font-medium backdrop-blur-sm">
      {label}
    </span>
  );
}
