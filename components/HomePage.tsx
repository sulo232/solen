"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { usePostHog } from "posthog-js/react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
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


// ─────────────────────────────────────────────────────────────────────────────
// HomePage component
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
  // Order: Entdecken (trending), then category carousels
  const orderedSectionKeys = useMemo(() => {
    const baseKeys = [
      { key: "coiffeur", label: tNav("coiffeur") as string },
      { key: "nails", label: tNav("nails") as string },
      { key: "barbershop", label: tNav("barbershop") as string },
      { key: "makeup", label: tNav("makeup") as string },
      { key: "waxing", label: tNav("waxing") as string },
    ];
    
    // Sort the keys based on the recentCats array ranking
    const sortedKeysData = bubbleRank(baseKeys.map(k => k.key as any));
    
    // Rebuild the array of objects in the new sorted order
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

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-white">
      {/* GuidedSearch sheet — sheet-only, trigger rendered inline in header */}
      <GuidedSearch categoryCounts={categoryCounts} hideTrigger />

      <main className="max-w-[2520px] mx-auto pb-16">

        {/* ── 0. Hero ── */}
        <HomepageHero
          categoryCounts={categoryCounts}
          reviewCount={2400}
        />

        {/* ── 0.5. Last Minute Strip ── */}
        {sections.last_minute && lastMinuteSlots.length > 0 && (
          <LastMinuteStrip slots={lastMinuteSlots} />
        )}

        {/* ── 1. Category Snapshot Rows (Core Product — shown first) ── */}
        <section className="px-5 md:px-6 lg:px-10 xl:px-20 pt-6 pb-12 space-y-16">
          {orderedSectionKeys.map(({ key, label }, index) => {
            const salonsForCategory = categorySalons[key] || [];

            return (
              <div key={key}>
                <div className="-mx-5 md:-mx-6 lg:-mx-10 xl:-mx-20 px-5 md:px-6 lg:px-10 xl:px-20 relative">
                  <FeaturedSalonCarousel salons={salonsForCategory} locale={locale} title={label} viewAllHref={`/${locale}/${key}`} />
                </div>
                {/* Trust stats after first carousel, matching vision layout */}
                {index === 0 && (
                  <div className="-mx-5 md:-mx-6 lg:-mx-10 xl:-mx-20 mt-16">
                    <TrustStatsBanner />
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* ── 2. Entdecken — Pinterest-style Discovery intro (secondary, after listings) ── */}
        <section className="mx-auto px-5 md:px-6 lg:px-10 xl:px-20 py-12 border-t border-s-ink/[0.08]">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <span className="block font-heading text-[10px] font-bold uppercase tracking-[.14em] text-s-coral mb-2">
                {t("discover.eyebrow")}
              </span>
              <h2
                className="font-heading font-bold text-s-ink"
                style={{ fontSize: "22px", lineHeight: "1.1", letterSpacing: "-.01em" }}
              >
                {t("discover.title")}
              </h2>
            </div>
            <Link
              href={`/${locale}/discover`}
              className="font-heading font-semibold shrink-0 transition-colors duration-150 hover:text-s-coral"
              style={{ fontSize: "13px", color: "#E8624A" }}
            >
              {t("discover.catalogCta")} →
            </Link>
          </div>

          <DiscoverCarousel locale={locale} />
        </section>

        {/* ── 3. Wieder buchen? (logged-in users with past booking) ── */}
        {sections.rebook && lastBookedSalon && (
          <section className="px-5 md:px-6 lg:px-10 xl:px-20 py-10 border-t border-s-ink/[0.08]">
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
                className="shrink-0 px-4 py-2.5 rounded-lg bg-s-coral text-white text-sm font-heading font-semibold hover:brightness-[1.08] active:scale-[0.97] transition-[transform,filter] duration-150"
                aria-label={t("rebook.cta")}>
                {t("rebook.cta")}
              </Link>
            </motion.div>
          </section>
        )}

        {/* ── 4. Recently Viewed ── */}
        <section className="px-5 md:px-6 lg:px-10 xl:px-20 py-10 border-t border-s-ink/[0.08]">
          <RecentlyViewed />
        </section>

        {/* ── 4.5. Browse by City ── */}
        <BrowseByCitySection />

        {/* ── 4.75. Testimonial Carousel ── */}
        <TestimonialCarousel />

        {/* ── 5. Partner CTA ── */}
        <section className="py-12 px-5 md:px-6 lg:px-10 xl:px-20">
          <div
            className="rounded-[20px] overflow-hidden relative"
            style={{ background: "#1A0806" }}
          >
            {/* Ambient glows */}
            <div className="pointer-events-none absolute -top-24 -right-12 w-[480px] h-[480px] rounded-full" style={{ background: "radial-gradient(circle, rgba(232,98,74,.15) 0%, transparent 60%)" }} aria-hidden="true" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 w-[300px] h-[300px] rounded-full" style={{ background: "radial-gradient(circle, rgba(212,135,10,.08) 0%, transparent 65%)" }} aria-hidden="true" />

            <div className="relative px-8 py-12 sm:px-14 sm:py-14 flex flex-col md:flex-row items-start md:items-center gap-10">
              {/* Left: copy */}
              <div className="flex-1 min-w-0">
                <span className="inline-block font-heading font-bold uppercase tracking-[.14em] mb-4" style={{ fontSize: "10px", color: "rgba(232,98,74,.75)" }}>
                  {t("partner.forSalonsStudios")}
                </span>
                <h2
                  className="font-display text-white mb-4 tracking-[.01em]"
                  style={{ fontSize: "clamp(40px, 5vw, 56px)", lineHeight: 0.9 }}
                >
                  {t("partner.title")}
                </h2>
                <p
                  className="font-body max-w-[400px] leading-relaxed mb-7"
                  style={{ fontSize: "15px", color: "rgba(255,255,255,.5)" }}
                >
                  {t("partner.teaserPrompt") || "Erreiche Tausende Kunden, fülle deinen Kalender und verwalte dein Geschäft – alles an einem Ort."}
                </p>

                {/* Checklist */}
                <ul className="space-y-2.5 mb-8">
                  {[
                    t("partner.checklistFree"),
                    t("partner.checklistBookings"),
                    t("partner.checklistVisibility"),
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 font-body" style={{ fontSize: "14px", color: "rgba(255,255,255,.55)" }}>
                      <span className="flex-shrink-0 w-[18px] h-[18px] rounded-full flex items-center justify-center" style={{ background: "rgba(232,98,74,.22)" }} aria-hidden="true">
                        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                          <path d="M1 3.5L3.5 6L8 1" stroke="#E8624A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/${locale}/partner`}
                  className="inline-flex items-center justify-center h-[48px] px-8 rounded-pill bg-s-coral text-white font-heading font-bold text-sm hover:brightness-[1.08] active:scale-[0.97] transition-[transform,filter] duration-150"
                  style={{ boxShadow: "0 4px 20px rgba(232,98,74,.45)" }}
                >
                  {t("partner.cta")} →
                </Link>
              </div>

              {/* Right: frosted stat cards */}
              <div className="hidden md:grid grid-cols-1 gap-3 flex-shrink-0 w-[200px]">
                {[
                  { label: t("partner.newBookings"), value: "+47%", sub: t("partner.firstMonth"), color: "#FFFFFF" },
                  { label: t("partner.newCustomers"), value: "120+", sub: "", color: "#E8624A" },
                  { label: "CHF 0", value: "Setup", sub: "", color: "rgba(255,255,255,.6)" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-[14px] px-5 py-4"
                    style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.1)" }}
                  >
                    <p className="font-heading font-bold uppercase tracking-wider mb-1" style={{ fontSize: "9px", color: "rgba(255,255,255,.35)" }}>{stat.label}</p>
                    <p className="font-heading font-extrabold leading-tight" style={{ fontSize: "24px", color: stat.color }}>{stat.value}</p>
                    {stat.sub && <p className="font-body mt-0.5" style={{ fontSize: "11px", color: "rgba(255,255,255,.35)" }}>{stat.sub}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>


      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <Footer />

      {/* ── Tutorial Tour (first-visit logged-in users) ─────────────────── */}
      <TutorialTour isLoggedIn={!!userName} />
    </div>
  );
}
