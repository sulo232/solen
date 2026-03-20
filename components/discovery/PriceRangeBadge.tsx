"use client";

interface PriceRangeBadgeProps {
  priceMin: number | null;
  priceMax: number | null;
}

function formatCHF(amount: number): string {
  return `CHF ${amount}`;
}

export default function PriceRangeBadge({ priceMin, priceMax }: PriceRangeBadgeProps) {
  if (!priceMin && !priceMax) return null;

  const label = priceMin && priceMax
    ? `${formatCHF(priceMin)}–${priceMax}`
    : priceMin ? `ab ${formatCHF(priceMin)}` : null;

  if (!label) return null;

  return (
    <span className="text-[10px] px-2 py-1 rounded-pill bg-white/90 dark:bg-s-dm-surface/90 text-s-ink dark:text-s-dm-text font-medium backdrop-blur-sm">
      {label}
    </span>
  );
}
