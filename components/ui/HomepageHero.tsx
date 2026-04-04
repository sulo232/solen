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
      className="px-5 md:px-6 lg:px-10 xl:px-20 pt-14 pb-12 text-center"
      aria-label={t("sub")}
      style={{
        background: [
          "radial-gradient(ellipse 70% 60% at 10% 80%, rgba(232,98,74,.07) 0%, transparent 65%)",
          "radial-gradient(ellipse 55% 45% at 88% 20%, rgba(242,193,68,.05) 0%, transparent 60%)",
          "radial-gradient(ellipse 40% 50% at 55% 100%, rgba(107,163,200,.04) 0%, transparent 70%)",
          "#ffffff",
        ].join(", "),
      }}
    >
      {/* Eyebrow */}
      <div className="inline-flex items-center gap-1.5 mb-4" aria-hidden="true">
        <span className="w-[5px] h-[5px] rounded-full bg-s-coral opacity-60" />
        <span className="font-heading text-[11px] font-bold uppercase tracking-[.12em] text-s-coral">
          {t("eyebrow")}
        </span>
        <span className="w-[5px] h-[5px] rounded-full bg-s-coral opacity-60" />
      </div>

      {/* Headline — Bebas Neue, 3-line dramatic layout matching vision */}
      <h1
        className="font-display text-s-ink mb-4 tracking-[.01em]"
        style={{ fontSize: "clamp(64px, 9vw, 108px)", lineHeight: 0.88 }}
      >
        {t("headlineWord1")}
        <br />
        <em className="text-s-coral not-italic">{t("headlineAccent")}</em>
        <br />
        {t("headlineWord2")}
      </h1>

      {/* Subtitle */}
      <p className="font-body text-base text-s-ink/60 max-w-[420px] mx-auto mb-8 leading-relaxed">
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
        className="flex flex-wrap justify-center gap-2 mb-5"
        role="navigation"
        aria-label={tNav("categories")}
      >
        {CATEGORY_CHIPS.map(({ key, icon }) => (
          <Link
            key={key}
            href={`/${locale}/${key}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-pill text-xs font-heading font-semibold border transition-[background,color,border-color] duration-150 active:scale-[0.97]"
            style={{
              background: "#FAF6EF",
              color: "#6A5040",
              borderColor: "#E8D8CC",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = "rgba(232,98,74,.08)";
              (e.currentTarget as HTMLElement).style.color = "#E8624A";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(232,98,74,.25)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "#FAF6EF";
              (e.currentTarget as HTMLElement).style.color = "#6A5040";
              (e.currentTarget as HTMLElement).style.borderColor = "#E8D8CC";
            }}
            aria-label={tNav(key)}
          >
            {icon}
            {tNav(key)}
          </Link>
        ))}
      </div>

      {/* Micro trust signal */}
      <div
        className="flex items-center justify-center gap-2.5 font-body font-medium"
        style={{ fontSize: "12px", color: "#9A7A60" }}
        aria-label="Platform trust statistics"
      >
        <span className="flex items-center gap-1">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="#E8624A" aria-hidden="true">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          4.8 {t("trustRating")}
        </span>
        <span className="w-1 h-1 rounded-full" style={{ background: "#D4C4B4" }} aria-hidden="true" />
        <span>{reviewCount.toLocaleString()}+ {t("trustReviews")}</span>
        <span className="w-1 h-1 rounded-full" style={{ background: "#D4C4B4" }} aria-hidden="true" />
        <span>{t("trustFree")}</span>
      </div>
    </section>
  );
}
