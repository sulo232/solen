"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Scissors, Sparkles, FlowerIcon, Brush, Droplets } from "lucide-react";

/**
 * HomepageHero — Component Map §02 + §04
 *
 * Design intent: "This hero should feel confident and direct because
 * it's the first thing users see — left-aligned, no-nonsense, Bebas Neue."
 *
 * - Background: #F5F0EB (warm beige, NOT white, NOT gradient)
 * - Headline: Bebas Neue, left-aligned, max 1 coral accent word
 * - Subtitle: DM Sans 16px/400, max 320px, left-aligned
 * - Category pills: horizontal scroll, frosted white glass, SVG + label
 */

interface HomepageHeroProps {
  categoryCounts?: Record<string, number>;
  reviewCount?: number;
}

const CATEGORY_PILLS = [
  { key: "coiffeur",   icon: <Scissors size={18} strokeWidth={1.8} aria-hidden="true" /> },
  { key: "nails",      icon: <Sparkles size={18} strokeWidth={1.8} aria-hidden="true" /> },
  { key: "barbershop", icon: <Scissors size={18} strokeWidth={1.8} aria-hidden="true" /> },
  { key: "spa",        icon: <FlowerIcon size={18} strokeWidth={1.8} aria-hidden="true" /> },
  { key: "makeup",     icon: <Brush size={18} strokeWidth={1.8} aria-hidden="true" /> },
  { key: "waxing",     icon: <Droplets size={18} strokeWidth={1.8} aria-hidden="true" /> },
] as const;

export default function HomepageHero({ categoryCounts, reviewCount = 2400 }: HomepageHeroProps) {
  const t = useTranslations("home.hero") as any;
  const tNav = useTranslations("navigation") as any;
  const locale = useLocale();

  return (
    <section
      className="px-5 md:px-10 lg:px-20 pt-14 pb-0 text-left"
      aria-label={t("sub")}
      style={{ background: "#F5F0EB" }}
    >
      {/* ── Headline — Bebas Neue, left-aligned, 1 coral word max ── */}
      <h1
        className="font-display text-s-ink"
        style={{
          fontSize: "clamp(48px, 8vw, 64px)",
          lineHeight: 0.95,
          letterSpacing: "0.5px",
        }}
      >
        {t("headlineWord1")}
        <br />
        <span style={{ color: "#E8735A" }}>{t("headlineAccent")}</span>
        <br />
        {t("headlineWord2")}
      </h1>

      {/* ── Subtitle — DM Sans 16px, max 320px ── */}
      <p
        className="font-body text-base leading-relaxed"
        style={{
          color: "#6B5E54",
          marginTop: 16,
          maxWidth: 320,
        }}
      >
        {t("sub")}
      </p>

      {/* ── Category Pills — horizontal scroll, frosted white glass ── */}
      <div
        className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 md:-mx-10 md:px-10 lg:-mx-20 lg:px-20"
        style={{
          marginTop: 24,
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
          maskImage: "linear-gradient(to right, transparent 0%, black 20px, black calc(100% - 32px), transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 20px, black calc(100% - 32px), transparent 100%)",
        }}
        role="navigation"
        aria-label={tNav("categories")}
      >
        {CATEGORY_PILLS.map(({ key, icon }) => (
          <Link
            key={key}
            href={`/${locale}/${key}`}
            className="flex-shrink-0 inline-flex items-center gap-1.5 font-body text-sm font-medium active:scale-[0.97] transition-[transform,background,border-color] duration-150"
            style={{
              height: 40,
              padding: "0 16px",
              borderRadius: 99,
              border: "1.5px solid #D9D0C7",
              background: "rgba(255,255,255,0.55)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              color: "#2C2420",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)",
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "#FAF0EC";
              el.style.borderColor = "#E8735A";
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "rgba(255,255,255,0.55)";
              el.style.borderColor = "#D9D0C7";
            }}
            aria-label={tNav(key)}
          >
            <span style={{ color: "#8C8279" }}>{icon}</span>
            {tNav(key)}
          </Link>
        ))}
      </div>

      {/* ── Micro trust signal ── */}
      <div
        className="flex items-center gap-2.5 font-body font-medium"
        style={{ fontSize: 12, color: "#6B5E54", marginTop: 24, paddingBottom: 24 }}
        aria-label="Platform trust statistics"
      >
        <span className="flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#E8735A" aria-hidden="true">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          4.8 {t("trustRating")}
        </span>
        <span className="w-1 h-1 rounded-full" style={{ background: "#D9D0C7" }} aria-hidden="true" />
        <span>{reviewCount.toLocaleString("de-CH")}+ {t("trustReviews")}</span>
        <span className="w-1 h-1 rounded-full" style={{ background: "#D9D0C7" }} aria-hidden="true" />
        <span>{t("trustFree")}</span>
      </div>
    </section>
  );
}
