"use client";

import Link from "next/link";
import { Calendar } from "lucide-react";
import type { DiscoveryItem } from "@/lib/types";

interface BookCTAProps {
  item: DiscoveryItem;
  locale: string;
}

const CATEGORY_ROUTES: Record<string, string> = {
  hair: "coiffeur",
  beard: "barbershop",
  nails: "nails",
  makeup: "makeup",
  waxing: "waxing",
};

const CTA_LABELS: Record<string, string> = {
  de: "Jetzt buchen",
  en: "Book now",
  fr: "Réserver",
  it: "Prenota ora",
};

export default function BookCTA({ item, locale }: BookCTAProps) {
  const route = CATEGORY_ROUTES[item.category] ?? "coiffeur";
  const priceLabel = item.price_min && item.price_max
    ? `CHF ${item.price_min}–${item.price_max}`
    : item.price_min ? `ab CHF ${item.price_min}` : null;

  const href = `/${locale}/${route}${item.style_name ? `?style=${encodeURIComponent(item.style_name)}` : ""}`;

  return (
    <div className="mt-6 px-1">
      <div className="p-4 rounded-card bg-white dark:bg-s-dm-surface border border-s-ink/5 dark:border-white/5 flex items-center justify-between gap-4">
        <div>
          {priceLabel && (
            <p className="text-sm font-medium text-s-ink dark:text-s-dm-text">{priceLabel}</p>
          )}
          <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mt-0.5">
            {locale === "de" ? "Preise variieren je nach Salon" : locale === "fr" ? "Prix varient selon le salon" : locale === "it" ? "I prezzi variano in base al salone" : "Prices vary by salon"}
          </p>
        </div>
        <Link
          href={href}
          className="flex items-center gap-2 px-5 py-2.5 rounded-button bg-s-coral hover:bg-s-coral-hover text-white text-sm font-medium transition-colors shrink-0"
        >
          <Calendar size={14} />
          {CTA_LABELS[locale] ?? CTA_LABELS.de}
        </Link>
      </div>
    </div>
  );
}
