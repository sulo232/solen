"use client";

import Link from "next/link";
import { Calendar, Sparkles, Clock } from "lucide-react";
import type { DiscoveryItem } from "@/lib/types";
import { formatCurrency } from "@/lib/format-currency";

interface BookCTAProps {
  item: DiscoveryItem;
  locale: string;
}

const CATEGORY_ROUTES: Record<string, string> = {
  hair: "coiffeur",
  beard: "barbershop",
  nails: "nails",
};

// Default price ranges when AI doesn't provide them
const DEFAULT_PRICES: Record<string, { min: number; max: number }> = {
  hair: { min: 45, max: 120 },
  beard: { min: 25, max: 55 },
  nails: { min: 35, max: 90 },
};

const CTA_LABELS: Record<string, string> = {
  de: "Jetzt buchen",
  en: "Book now",
  fr: "Réserver",
  it: "Prenota ora",
};

export default function BookCTA({ item, locale }: BookCTAProps) {
  const route = CATEGORY_ROUTES[item.category] ?? "coiffeur";

  // Use AI-estimated prices, or defaults for the category
  const defaults = DEFAULT_PRICES[item.category] ?? DEFAULT_PRICES.hair;
  const priceMin = item.price_min ?? defaults.min;
  const priceMax = item.price_max ?? defaults.max;

  // Build booking URL with auto-select params
  const params = new URLSearchParams();
  if (item.style_name) params.set("style", item.style_name);
  params.set("category", item.category);
  if (item.tags?.length > 0) params.set("service", item.tags[0]);
  params.set("from", "discovery");
  params.set("ref", item.id);

  const href = `/${locale}/${route}?${params.toString()}`;

  // Estimated time
  const estimatedTime = (item as any).estimated_time_minutes;

  return (
    <div className="mt-6 px-1">
      {/* V3-D346 Pass-2 (2026-05-29): amber gradient + accent → neutral ink card (A9). */}
      <div className="p-5 rounded-[16px] bg-s-ink/5 border border-s-border">
        {/* Style context */}
        {item.style_name && (
          <div className="flex items-center gap-1.5 mb-3">
            <Sparkles size={12} className="text-s-ink-3" />
            <p className="text-xs text-s-ink font-medium">{item.style_name}</p>
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-s-ink">
              {formatCurrency(priceMin, locale)}–{formatCurrency(priceMax, locale)}
            </p>
            <p className="text-[12px] text-s-ink/40 mt-0.5">
              {locale === "de" ? "Geschätzte Preisspanne" : "Estimated price range"}
            </p>
            {estimatedTime && (
              <div className="flex items-center gap-1 mt-1">
                <Clock size={10} className="text-s-ink/30" />
                <p className="text-[12px] text-s-ink/30">~{estimatedTime} min</p>
              </div>
            )}
          </div>
          <Link
            href={href}
            className="flex items-center gap-2 px-5 py-3 rounded-pill bg-s-ink hover:brightness-[1.06] text-white text-[12px] font-heading uppercase tracking-[.06em] transition-colors shrink-0 shadow-warm-sm"
          >
            <Calendar size={14} />
            {CTA_LABELS[locale] ?? CTA_LABELS.de}
          </Link>
        </div>
      </div>
    </div>
  );
}
