"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Scissors, Sparkles, FlowerIcon, Brush } from "lucide-react";
import AirbnbSearchBar from "@/components/ui/AirbnbSearchBar";

interface HomepageHeroProps {
  categoryCounts?: Record<string, number>;
  reviewCount?: number;
}

const CATEGORY_CHIPS = [
  { key: "coiffeur",   icon: <Scissors size={12} aria-hidden="true" /> },
  { key: "nails",      icon: <Sparkles size={12} aria-hidden="true" /> },
  { key: "barbershop", icon: <Scissors size={12} aria-hidden="true" /> },
  { key: "spa",        icon: <FlowerIcon size={12} aria-hidden="true" /> },
  { key: "makeup",     icon: <Brush size={12} aria-hidden="true" /> },
] as const;

export default function HomepageHero({ categoryCounts, reviewCount = 2400 }: HomepageHeroProps) {
  const t = useTranslations("home.hero") as any;
  const tNav = useTranslations("navigation") as any;
  const locale = useLocale();

  return (
    <section
      className="px-5 md:px-6 lg:px-10 xl:px-20 pt-12 pb-10 text-center"
      aria-label={t("sub")}
    >
      {/* Eyebrow */}
      <div className="inline-flex items-center gap-1.5 mb-3.5" aria-hidden="true">
        <span className="w-1.5 h-1.5 rounded-full bg-s-coral opacity-60" />
        <span className="font-heading text-[11px] font-bold uppercase tracking-[.12em] text-s-coral">
          {t("eyebrow")}
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-s-coral opacity-60" />
      </div>

      {/* Headline — Bebas Neue, coral accent on last word */}
      <h1
        className="font-display text-s-ink dark:text-s-dm-text mb-3.5 leading-[.88] tracking-[.01em]"
        style={{ fontSize: "clamp(56px, 8vw, 100px)" }}
      >
        {(() => {
          const words = t("headlineWord1") as string;
          const accent = t("headlineWord2") as string;
          return (
            <>
              {words}{" "}
              <span className="text-s-coral">{accent}</span>
            </>
          );
        })()}
      </h1>

      {/* Subtitle */}
      <p className="font-body text-[15px] text-s-ink/60 dark:text-s-dm-text/60 max-w-[420px] mx-auto mb-8 leading-relaxed">
        {t("sub")}
      </p>

      {/* Search bar — hero mode (not scrolled) */}
      <div className="max-w-[680px] mx-auto mb-4">
        <AirbnbSearchBar
          scrolledPast80={false}
          locale={locale}
          categoryCounts={categoryCounts}
        />
      </div>

      {/* Category quick-chips */}
      <div
        className="flex flex-wrap justify-center gap-2 mb-4"
        role="navigation"
        aria-label={tNav("categories")}
      >
        {CATEGORY_CHIPS.map(({ key, icon }) => (
          <Link
            key={key}
            href={`/${locale}/${key}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-pill text-xs font-heading font-semibold
              bg-s-ink/[0.04] dark:bg-white/[0.06]
              text-s-ink/60 dark:text-s-dm-text/60
              border border-s-ink/[0.08] dark:border-white/[0.08]
              hover:bg-s-coral/[0.08] hover:text-s-coral hover:border-s-coral/20
              transition-[background,color,border-color] duration-150"
            aria-label={tNav(key)}
          >
            {icon}
            {tNav(key)}
          </Link>
        ))}
      </div>

      {/* Micro trust signal */}
      <div
        className="flex items-center justify-center gap-2.5 text-xs text-s-ink/40 dark:text-s-dm-text/40 font-body font-medium"
        aria-label="Platform trust statistics"
      >
        <span className="flex items-center gap-1">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="#E8624A" aria-hidden="true">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          4.8 {t("trustRating")}
        </span>
        <span className="w-1 h-1 rounded-full bg-s-ink/[0.15] dark:bg-white/[0.15]" aria-hidden="true" />
        <span>{reviewCount.toLocaleString()}+ {t("trustReviews")}</span>
        <span className="w-1 h-1 rounded-full bg-s-ink/[0.15] dark:bg-white/[0.15]" aria-hidden="true" />
        <span>{t("trustFree")}</span>
      </div>
    </section>
  );
}
