"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { usePostHog } from "posthog-js/react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { RefreshCw, ChevronRight } from "lucide-react";
import Footer from "@/components/layout/Footer";
import GuidedSearch from "@/components/ui/GuidedSearch";
import RecentlyViewed from "@/components/RecentlyViewed";
import { useCityDetection } from "@/hooks/useCityDetection";
import TutorialTour from "@/components/TutorialTour";
import FeaturedSalonCarousel from "@/components/ui/FeaturedSalonCarousel";
import type { SalonCard as SalonCardType, LastMinuteSlot } from "@/lib/types";
import { useRecentVisits } from "@/hooks/useRecentVisits";
import DiscoverCarousel from "@/components/ui/DiscoverCarousel";
import TrustStatsBanner from "@/components/TrustStatsBanner";
import BrowseByCitySection from "@/components/BrowseByCitySection";
import TestimonialCarousel from "@/components/TestimonialCarousel";
import HomepageHero from "@/components/ui/HomepageHero";
import LastMinuteStrip from "@/components/ui/LastMinuteStrip";
import FloatingNavPill from "@/components/layout/FloatingNavPill";
import HowItWorks from "@/components/ui/HowItWorks";


// ─────────────────────────────────────────────────────────────────────────────
// HomePage component — V5 Component Map rebuild
// Background: #F5F0EB · No dividers · 32px section gaps · 88px bottom pad
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

/** Max category sections shown on homepage before "Mehr" button */
const MAX_CATEGORY_SECTIONS = 3;

export default function HomePage({ initialData }: HomePageProps) {
  useCityDetection();
  const posthog = usePostHog();

  useEffect(() => {
    posthog?.capture("homepage_viewed");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const locale = useLocale();
  const t = useTranslations("home") as any;
  const tNav = useTranslations("navigation") as any;
  const [lastBookedSalon, setLastBookedSalon] = useState<{ name: string; slug: string } | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [categoryCounts] = useState<Record<string, number>>(initialData?.categoryCounts || {});
  const [categorySalons] = useState<Record<string, SalonCardType[]>>(initialData?.categorySalons ?? {});
  const [lastMinuteSlots] = useState<LastMinuteSlot[]>(initialData?.lastMinuteSlots || []);

  const { bubbleRank } = useRecentVisits();

  // Sort categories: bubble up according to recentCats ranking
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

  const [sections] = useState<Record<string, boolean>>(
    initialData?.sections || {
      trending: true, nearby: true, new_salons: true,
      rebook: true, reviews: true, last_minute: true, featured: true,
      social_proof: true, partner_cta: true,
    }
  );

  const fetchData = useCallback(async () => {
    fetch("/api/me")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) return;
        if (data.profile?.first_name) setUserName(data.profile.first_name);
        if (data.lastBooking?.slug) setLastBookedSalon({ slug: data.lastBooking.slug, name: data.lastBooking.name });
      })
      .catch((err) => console.error("[HomePage] failed to fetch user data:", err));
  }, [locale]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Split categories: first 3 shown, rest behind "Mehr" button
  const visibleSections = orderedSectionKeys.slice(0, MAX_CATEGORY_SECTIONS);
  const hasMoreCategories = orderedSectionKeys.length > MAX_CATEGORY_SECTIONS;

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: "#F5F0EB" }}>
      {/* GuidedSearch sheet — sheet-only, trigger rendered inline in header */}
      <GuidedSearch categoryCounts={categoryCounts} hideTrigger />

      <main className="max-w-[1200px] mx-auto" style={{ paddingBottom: 88 }}>

        {/* ── 1. Hero ── */}
        <HomepageHero
          categoryCounts={categoryCounts}
          reviewCount={2400}
        />

        {/* ── 1.5. Last Minute Strip ── */}
        {sections.last_minute && lastMinuteSlots.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <LastMinuteStrip slots={lastMinuteSlots} />
          </div>
        )}

        {/* ── 2. Category Sections (max 3) ── */}
        <section className="px-5 md:px-10 lg:px-20" style={{ marginTop: 32 }}>
          {visibleSections.map(({ key, label }, index) => {
            const salonsForCategory = categorySalons[key] || [];

            return (
              <div key={key} style={{ marginTop: index === 0 ? 0 : 32 }}>
                <FeaturedSalonCarousel salons={salonsForCategory} locale={locale} title={label} viewAllHref={`/${locale}/${key}`} />

                {/* Platform Stats after first carousel */}
                {index === 0 && (
                  <div style={{ marginTop: 32 }}>
                    <TrustStatsBanner />
                  </div>
                )}
              </div>
            );
          })}

          {/* "Mehr Kategorien" button */}
          {hasMoreCategories && (
            <div className="flex justify-center" style={{ marginTop: 32 }}>
              <Link
                href={`/${locale}/search`}
                className="inline-flex items-center gap-2 font-body text-sm font-medium active:scale-[0.97] transition-[transform,background,border-color] duration-150"
                style={{
                  padding: "0 24px",
                  height: 48,
                  borderRadius: 99,
                  border: "1.5px solid #D9D0C7",
                  color: "#2C2420",
                  background: "transparent",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = "#FAF0EC";
                  (e.currentTarget as HTMLElement).style.borderColor = "#E8735A";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.borderColor = "#D9D0C7";
                }}
              >
                {t("categories.more") || "Mehr Kategorien entdecken"}
                <ChevronRight size={16} />
              </Link>
            </div>
          )}
        </section>

        {/* ── 2.5. So funktioniert's — PRE-LAUNCH ONLY ── */}
        <div style={{ marginTop: 32 }}>
          <HowItWorks />
        </div>

        {/* ── 3. Entdecken / Inspiration ── */}
        <section className="px-5 md:px-10 lg:px-20" style={{ marginTop: 32 }}>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <span className="block font-heading text-[11px] font-bold uppercase tracking-[.1em] text-s-coral mb-1">
                {t("discover.eyebrow")}
              </span>
              <h2
                className="font-display text-s-ink"
                style={{ fontSize: 32, lineHeight: 1 }}
              >
                {t("discover.title")}
              </h2>
            </div>
            <Link
              href={`/${locale}/discover`}
              className="font-body text-sm font-medium shrink-0 transition-colors duration-150 hover:text-[#D4654D]"
              style={{ color: "#E8735A" }}
            >
              {t("discover.catalogCta")} →
            </Link>
          </div>

          <DiscoverCarousel locale={locale} />
        </section>

        {/* ── 4. Wieder buchen? (logged-in users with past booking) ── */}
        {sections.rebook && lastBookedSalon && (
          <section className="px-5 md:px-10 lg:px-20" style={{ marginTop: 32 }}>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
              className="flex items-center gap-4 p-4 border border-s-ink/[0.08] rounded-[16px] bg-white">
              <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 bg-s-bg-sunken">
                <RefreshCw size={18} className="text-s-ink" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-medium text-s-ink text-[15px]">{t("rebook.title")}</p>
                <p className="text-sm text-s-ink/60 font-body truncate mt-0.5">{t("rebook.lastVisit", { name: lastBookedSalon.name })}</p>
              </div>
              <Link href={`/${locale}/salon/${lastBookedSalon.slug}`}
                className="shrink-0 px-4 py-2.5 rounded-btn bg-s-coral text-white text-sm font-heading font-semibold hover:brightness-[1.06] active:scale-[0.97] transition-[transform,filter] duration-150"
                aria-label={t("rebook.cta")}>
                {t("rebook.cta")}
              </Link>
            </motion.div>
          </section>
        )}

        {/* ── 5. Recently Viewed ── */}
        <section className="px-5 md:px-10 lg:px-20" style={{ marginTop: 32 }}>
          <RecentlyViewed />
        </section>

        {/* ── 6. City Selector (dark) ── */}
        <div style={{ marginTop: 32 }}>
          <BrowseByCitySection />
        </div>

        {/* 32px light gap between two dark sections */}
        <div style={{ height: 32, background: "#F5F0EB" }} aria-hidden="true" />

        {/* ── 7. Testimonials ── */}
        <TestimonialCarousel />

      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <Footer />

      {/* ── Floating Nav Pill (mobile only) ─── */}
      <FloatingNavPill />

      {/* ── Tutorial Tour (first-visit logged-in users) ─────────────────── */}
      <TutorialTour isLoggedIn={!!userName} />
    </div>
  );
}
