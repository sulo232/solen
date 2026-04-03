"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { usePostHog } from "posthog-js/react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import Footer from "@/components/layout/Footer";
import GuidedSearch from "@/components/ui/GuidedSearch";
import RecentlyViewed from "@/components/RecentlyViewed";
import { useCityDetection } from "@/hooks/useCityDetection";
import TutorialTour from "@/components/TutorialTour";
import FeaturedSalonCarousel from "@/components/ui/FeaturedSalonCarousel";
import type { SalonCard as SalonCardType, LastMinuteSlot } from "@/lib/types";
import { getPersistedCity } from "@/lib/city-cookie";
import { type CitySlug } from "@/lib/cities";
import { useRecentVisits } from "@/hooks/useRecentVisits";
import DiscoverCarousel from "@/components/ui/DiscoverCarousel";
import TrustStatsBanner from "@/components/TrustStatsBanner";
import BrowseByCitySection from "@/components/BrowseByCitySection";
import TestimonialCarousel from "@/components/TestimonialCarousel";
import {
  blurFadeUp,
  slideUp,
  staggerContainer,
  staggerContainerWide,
  VIEWPORT,
  EASE,
  DUR,
  SPRING,
} from "@/lib/motion";

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

  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("home") as any;
  const tNav = useTranslations("navigation") as any;
  const [loading, setLoading] = useState(false);
  const [lastBookedSalon, setLastBookedSalon] = useState<{ name: string; slug: string } | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [nearbySalons, setNearbySalons] = useState<SalonCardType[]>([]);
  const [locationError, setLocationError] = useState(false);
  const [persistedCity, setPersistedCity] = useState<CitySlug | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>(initialData?.categoryCounts || {});
  const salonsWithCoords = initialData?.salonsWithCoords ?? 0;

  const [salons, setSalons] = useState<SalonCardType[]>(initialData?.salons || []);
  const [categorySalons] = useState<Record<string, SalonCardType[]>>(initialData?.categorySalons ?? {});
  const [lastMinuteSlots] = useState<LastMinuteSlot[]>(initialData?.lastMinuteSlots || []);

  useEffect(() => {
    setPersistedCity(getPersistedCity());
  }, []);

  const { recentCats, visitCategory, bubbleRank, isMounted } = useRecentVisits();

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

  const [sections, setSections] = useState<Record<string, boolean>>(
    initialData?.sections || {
      trending: true, nearby: true, new_salons: true,
      rebook: true, reviews: true, last_minute: true, featured: true,
      social_proof: true, partner_cta: true,
    }
  );

  const fetchNearby = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        fetch(`/api/salons?limit=6&sort=distance&lat=${latitude}&lng=${longitude}`)
          .then((r) => r.ok ? r.json() : null)
          .then((data) => {
            if (!data) { setLocationError(true); return; }
            setNearbySalons(data.items ?? []);
            setLocationError(false);
          })
          .catch(() => setLocationError(true));
      },
      () => setLocationError(true)
    );
  }, []);

  const fetchData = useCallback(async () => {
    fetch("/api/me")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) return;
        if (data.profile?.first_name) setUserName(data.profile.first_name);
        if (data.lastBooking?.slug) setLastBookedSalon({ slug: data.lastBooking.slug, name: data.lastBooking.name });
        if (Array.isArray(data.favorites)) setFavoriteIds(new Set(data.favorites as string[]));
      })
      .catch((err) => console.error("[HomePage] failed to fetch user data:", err));

    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          fetchNearby();
        }
      }).catch((err) => console.error("[HomePage] geolocation permission query failed:", err));
    }
  }, [locale, fetchNearby]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleFavoriteToggle = useCallback((salonId: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(salonId)) {
        next.delete(salonId);
        fetch(`/api/profile/favorites?salon_id=${salonId}`, { method: "DELETE" }).catch((err) => console.error("[HomePage] failed to remove favorite:", err));
      } else {
        next.add(salonId);
        fetch("/api/profile/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ salon_id: salonId }),
        }).catch((err) => console.error("[HomePage] failed to add favorite:", err));
      }
      return next;
    });
  }, []);

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-white bg-grain" style={{ backgroundSize: "100px 100px" }}>
      {/* GuidedSearch sheet — sheet-only, trigger rendered inline in header */}
      <GuidedSearch categoryCounts={categoryCounts} hideTrigger />

      <main className="max-w-[2520px] mx-auto pb-16">
        
        {/* ── 1. Category Snapshot Rows (Core Product — shown first) ── */}
        <section className="px-5 md:px-6 lg:px-10 xl:px-20 pt-6 pb-12 space-y-16">
          {orderedSectionKeys.map(({ key, label }) => {
            const salonsForCategory = categorySalons[key] || [];

            return (
              <div key={key}>
                <div className="-mx-5 md:-mx-6 lg:-mx-10 xl:-mx-20 px-5 md:px-6 lg:px-10 xl:px-20 relative">
                  <FeaturedSalonCarousel salons={salonsForCategory} locale={locale} title={label} viewAllHref={`/${locale}/${key}`} />
                </div>
              </div>
            );
          })}
        </section>

        {/* ── 1.5. Trust Stats Banner (social proof) ── */}
        <TrustStatsBanner />

        {/* ── 2. Entdecken — Discovery section ── */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={blurFadeUp}
          className="mx-auto px-5 md:px-6 lg:px-10 xl:px-20 py-12 border-t border-[#EBEBEB] relative z-[2]"
        >
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="font-heading font-semibold text-[22px] tracking-tight text-[#222222]" style={{ lineHeight: "1.1", letterSpacing: "0.5px" }}>
              {t("discover.title")}
            </h2>
            <Link href={`/${locale}/discover`}
              className="inline-flex items-center gap-1 text-[14px] font-body font-semibold text-[#222222] hover:text-[#717171] transition-colors duration-150 shrink-0">
              {t("discover.catalogCta")}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </Link>
          </div>

          <DiscoverCarousel locale={locale} />
        </motion.section>

        {/* ── 3. Wieder buchen? (logged-in users with past booking) ── */}
        {sections.rebook && lastBookedSalon && (
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            variants={slideUp}
            className="px-5 md:px-6 lg:px-10 xl:px-20 py-10 border-t border-[#EBEBEB]"
          >
            <div className="flex items-center gap-4 p-4 border border-[#EBEBEB] rounded-[16px] bg-white">
              <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 bg-[#F7F7F7]">
                <RefreshCw size={18} className="text-[#222222]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-medium text-[#222222] text-[15px]">{t("rebook.title")}</p>
                <p className="text-[14px] text-[#717171] font-body truncate mt-0.5">{t("rebook.lastVisit", { name: lastBookedSalon.name })}</p>
              </div>
              <Link href={`/${locale}/salon/${lastBookedSalon.slug}`}
                className="shrink-0 px-4 py-2.5 rounded-lg bg-s-coral text-white text-[14px] font-heading font-semibold transition-transform hover:scale-[1.02] active:scale-[0.98]"
                aria-label={t("rebook.cta")}>
                {t("rebook.cta")}
              </Link>
            </div>
          </motion.section>
        )}

        {/* ── 4. Recently Viewed ── */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={blurFadeUp}
          className="px-5 md:px-6 lg:px-10 xl:px-20 py-10 border-t border-[#EBEBEB]"
        >
          <RecentlyViewed />
        </motion.section>

        {/* ── 4.5. Browse by City ── */}
        <BrowseByCitySection />

        {/* ── 4.75. Testimonial Carousel ── */}
        <TestimonialCarousel />

        {/* ── 5. Partner CTA ── */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={blurFadeUp}
          className="py-12 px-5 md:px-6 lg:px-10 xl:px-20 border-t border-[#EBEBEB]"
        >
          <div
            className="rounded-[20px] overflow-hidden relative"
            style={{
              background: "linear-gradient(135deg, #FFF8F6 0%, #FFF5F0 60%, #FFF9F7 100%)",
              border: "1px solid rgba(232,98,74,0.12)",
            }}
          >
            <div className="px-8 py-10 sm:px-12 sm:py-12 flex flex-col md:flex-row items-start md:items-center gap-8">
              {/* Left: copy */}
              <div className="flex-1">
                <span className="inline-block text-[11px] font-heading font-bold uppercase tracking-[.12em] text-s-coral mb-3">
                  {t("partner.forSalonsStudios")}
                </span>
                <h2 className="font-heading font-extrabold text-[28px] sm:text-[34px] leading-[1.1] tracking-tight text-[#1A1A1A] mb-3" style={{ letterSpacing: "0.5px" }}>
                  {t("partner.title")}
                </h2>
                <p className="font-body text-[15px] sm:text-[16px] text-[#717171] max-w-[420px] leading-relaxed mb-6">
                  {t("partner.teaserPrompt") || "Erreiche Tausende Kunden, fülle deinen Kalender und verwalte dein Geschäft – alles an einem Ort."}
                </p>

                {/* Checklist */}
                <ul className="space-y-2 mb-7">
                  {[
                    t("partner.checklistFree"),
                    t("partner.checklistBookings"),
                    t("partner.checklistVisibility"),
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-[14px] font-body text-[#555555]">
                      <span
                        className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ background: "rgba(232,98,74,0.12)" }}
                        aria-hidden="true"
                      >
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
                  className="inline-flex items-center justify-center h-[46px] px-7 rounded-pill bg-s-coral text-white font-heading font-bold text-[14px] hover:brightness-[1.06] active:scale-[0.97] transition-[transform,filter,box-shadow] duration-200 self-start"
                  style={{ boxShadow: "0 2px 12px rgba(232,98,74,.28)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 0 24px rgba(232, 98, 74, 0.4), 0 2px 12px rgba(232,98,74,.28)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 2px 12px rgba(232,98,74,.28)";
                  }}
                >
                  {t("partner.cta")} →
                </Link>
              </div>

              {/* Right: decorative stat cards */}
              <div className="hidden md:flex flex-shrink-0 items-center justify-center">
                <div className="relative w-[220px] h-[220px]">
                  {/* Main card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={VIEWPORT}
                    transition={{ duration: DUR.slow, ease: EASE.out, delay: 0.15 }}
                    className="absolute top-0 left-0 right-0 bg-white rounded-[16px] p-5"
                    style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid rgba(0,0,0,0.05)" }}
                  >
                    <p className="text-[11px] font-heading font-bold uppercase tracking-wider text-[#AAAAAA] mb-1">{t("partner.newBookings")}</p>
                    <p className="font-heading font-extrabold text-[28px] text-[#1A1A1A] leading-tight">+47%</p>
                    <p className="text-[12px] font-body text-[#717171] mt-0.5">{t("partner.firstMonth")}</p>
                  </motion.div>
                  {/* Floating stat */}
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={VIEWPORT}
                    transition={{ duration: DUR.slow, ease: EASE.out, delay: 0.35 }}
                    className="absolute bottom-0 right-0 bg-white rounded-[14px] px-4 py-3"
                    style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.09)", border: "1px solid rgba(0,0,0,0.05)" }}
                  >
                    <p className="text-[11px] font-heading font-bold uppercase tracking-wider text-[#AAAAAA] mb-0.5">{t("partner.newCustomers")}</p>
                    <p className="font-heading font-extrabold text-[22px] text-s-coral leading-tight">120+</p>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>


      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <Footer />

      {/* ── Tutorial Tour (first-visit logged-in users) ─────────────────── */}
      <TutorialTour isLoggedIn={!!userName} />
    </div>
  );
}
