"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { usePostHog } from "posthog-js/react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ChevronRight, ArrowRight } from "lucide-react";
import Footer from "@/components/layout/Footer";
import GuidedSearch from "@/components/ui/GuidedSearch";
import RecentlyViewed from "@/components/RecentlyViewed";
import { useCityDetection } from "@/hooks/useCityDetection";
import FeaturedSalonCarousel from "@/components/ui/FeaturedSalonCarousel";
import type { SalonCard as SalonCardType, LastMinuteSlot } from "@/lib/types";
import { useRecentVisits } from "@/hooks/useRecentVisits";
import TrustStatsBanner from "@/components/TrustStatsBanner";
import BrowseByCitySection from "@/components/BrowseByCitySection";
import TestimonialCarousel from "@/components/TestimonialCarousel";
import HomepageHero from "@/components/ui/HomepageHero";

// ─────────────────────────────────────────────────────────────────────────────
// HomePage — Fresha-inspired clean design
// White background, minimal sections, modern typography
// ─────────────────────────────────────────────────────────────────────────────

type HomePageProps = {
  initialData?: {
    salons: SalonCardType[];
    lastMinuteSlots: LastMinuteSlot[];
    newSalons: SalonCardType[];
    trendingSalons: SalonCardType[];
    categoryCounts: Record<string, number>;
    sections: Record<string, boolean>;
    salonsWithCoords?: number;
    categorySalons?: Record<string, SalonCardType[]>;
  }
};

const MAX_CATEGORY_SECTIONS = 3;

export default function HomePage({ initialData }: HomePageProps) {
  useCityDetection();
  const posthog = usePostHog();

  useEffect(() => {
    posthog?.capture("homepage_viewed");
  }, []);

  const locale = useLocale();
  const t = useTranslations("home") as any;
  const tNav = useTranslations("navigation") as any;
  const [categoryCounts] = useState<Record<string, number>>(initialData?.categoryCounts || {});
  const [categorySalons] = useState<Record<string, SalonCardType[]>>(initialData?.categorySalons ?? {});
  const [sections] = useState<Record<string, boolean>>(
    initialData?.sections || {
      trending: true, nearby: true, new_salons: true,
      rebook: true, reviews: true, last_minute: true, featured: true,
      social_proof: true, partner_cta: true,
    }
  );

  const { bubbleRank } = useRecentVisits();

  const orderedSectionKeys = useMemo(() => {
    const baseKeys = [
      { key: "coiffeur", label: tNav("coiffeur") as string },
      { key: "nails", label: tNav("nails") as string },
      { key: "barbershop", label: tNav("barbershop") as string },
      { key: "makeup", label: tNav("makeup") as string },
      { key: "waxing", label: tNav("waxing") as string },
    ];

    const sortedKeysData = bubbleRank(baseKeys.map(k => k.key as any));
    const result = [];
    for (const key of sortedKeysData) {
      const found = baseKeys.find(k => k.key === key);
      if (found) result.push(found);
    }
    return result;
  }, [bubbleRank, tNav]);

  const visibleSections = orderedSectionKeys.slice(0, MAX_CATEGORY_SECTIONS);
  const hasMoreCategories = orderedSectionKeys.length > MAX_CATEGORY_SECTIONS;

  return (
    <div className="min-h-screen bg-white">
      {/* GuidedSearch sheet */}
      <GuidedSearch categoryCounts={categoryCounts} hideTrigger />

      {/* Hero Section */}
      <HomepageHero categoryCounts={categoryCounts} reviewCount={2400} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Category Sections */}
        <section className="py-16 md:py-24">
          {visibleSections.map(({ key, label }, index) => {
            const salonsForCategory = categorySalons[key] || [];

            return (
              <div key={key} className={index > 0 ? "mt-16" : ""}>
                {/* Section Header */}
                <div className="flex items-end justify-between mb-8">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-[#101010]">
                      {label}
                    </h2>
                    <p className="mt-2 text-[#717171]">
                      {t("carousel.topRated") || "Top rated"} · {t("carousel.instantBook") || "Instant booking"}
                    </p>
                  </div>
                  <Link
                    href={`/${locale}/${key}`}
                    className="hidden md:flex items-center gap-2 text-sm font-semibold text-[#101010] hover:underline"
                  >
                    {t("carousel.viewAll") || "View all"}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                <FeaturedSalonCarousel 
                  salons={salonsForCategory} 
                  locale={locale} 
                  title={label} 
                  viewAllHref={`/${locale}/${key}`} 
                />

                {/* Mobile view all link */}
                <Link
                  href={`/${locale}/${key}`}
                  className="md:hidden mt-6 flex items-center justify-center gap-2 py-3 text-sm font-semibold text-[#101010] border border-[#E8E8E8] rounded-full hover:bg-[#F7F7F7] transition-colors"
                >
                  {t("carousel.viewAll") || "View all"} {label}
                  <ArrowRight className="w-4 h-4" />
                </Link>

                {/* Stats after first carousel */}
                {index === 0 && (
                  <div className="mt-16">
                    <TrustStatsBanner />
                  </div>
                )}
              </div>
            );
          })}

          {/* More categories button */}
          {hasMoreCategories && (
            <div className="mt-16 text-center">
              <Link
                href={`/${locale}/suchen?city=basel`}
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#101010] text-white font-semibold rounded-full hover:bg-[#2a2a2a] transition-colors"
              >
                {t("categories.more") || "Explore more categories"}
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </section>

        {/* Recently Viewed */}
        <section className="py-16 border-t border-[#E8E8E8]">
          <RecentlyViewed />
        </section>

      </main>

      {/* Browse by City - Full width */}
      <BrowseByCitySection />

      {/* Testimonials */}
      <section className="py-16 md:py-24 bg-[#F7F7F7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-[#101010]">
              {t("testimonials.title") || "What our customers say"}
            </h2>
            <p className="mt-3 text-[#717171]">
              {t("testimonials.subtitle") || "Thousands of happy customers book with us every day"}
            </p>
          </div>
          <TestimonialCarousel />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-[#101010]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            {t("cta.title") || "Ready to book your next appointment?"}
          </h2>
          <p className="mt-4 text-lg text-white/70">
            {t("cta.subtitle") || "Join thousands of satisfied customers booking with Solen"}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("openSearchSheet", { detail: { step: 1 } }))}
              className="px-8 py-4 bg-white text-[#101010] font-semibold rounded-full hover:bg-[#F7F7F7] transition-colors"
            >
              {t("cta.searchButton") || "Find a salon"}
            </button>
            <Link
              href={`/${locale}/fuer-salons`}
              className="px-8 py-4 border border-white/30 text-white font-semibold rounded-full hover:bg-white/10 transition-colors"
            >
              {t("cta.businessButton") || "For business"}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
