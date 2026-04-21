"use client";

import { useTranslations } from "next-intl";
import AirbnbSearchBar from "@/components/ui/AirbnbSearchBar";

/**
 * HomepageHero — DESIGN_SPEC section 4
 *
 * Design intent: "The search bar IS the hero. Clean, confident, immediate utility.
 * No Bebas headline. No category pills. Just search + trust line."
 *
 * - Background: #FAFAF8 (off-white)
 * - Search pill: centered, prominent
 * - Trust line: below search, DM Sans 13px, muted
 */

interface HomepageHeroProps {
  categoryCounts?: Record<string, number>;
  reviewCount?: number;
  locale: string;
}

export default function HomepageHero({ categoryCounts, reviewCount = 2400, locale }: HomepageHeroProps) {
  const t = useTranslations("home.hero") as any;

  return (
    <section
      className="flex flex-col items-center justify-center px-5 md:px-10 lg:px-20"
      style={{ paddingTop: 120, paddingBottom: 48, background: "#FAFAF8" }}
      aria-label={t("sub")}
    >
      {/* ── Subtitle — warm, inviting, centered ── */}
      <p
        className="font-body text-[15px] text-center mb-6"
        style={{ color: "#767676", maxWidth: 360 }}
      >
        {t("sub")}
      </p>

      {/* ── Search Bar — THIS IS THE HERO ── */}
      <div className="w-full max-w-[560px]">
        <AirbnbSearchBar scrolledPast80={false} locale={locale} categoryCounts={categoryCounts} />
      </div>

      {/* ── Trust line — DESIGN_SPEC section 4 ── */}
      <div
        className="flex items-center gap-2.5 font-body font-medium mt-5"
        style={{ fontSize: 13, color: "#767676" }}
        aria-label="Platform trust statistics"
      >
        <span className="flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#E8735A" aria-hidden="true">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          4.8 {t("trustRating")}
        </span>
        <span className="w-1 h-1 rounded-full" style={{ background: "#EBEBEB" }} aria-hidden="true" />
        <span>{reviewCount.toLocaleString("de-CH")}+ {t("trustReviews")}</span>
        <span className="w-1 h-1 rounded-full" style={{ background: "#EBEBEB" }} aria-hidden="true" />
        <span>{t("trustFree")}</span>
      </div>
    </section>
  );
}
