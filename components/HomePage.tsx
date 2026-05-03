"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { usePostHog } from "posthog-js/react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { RefreshCw } from "lucide-react";
import Footer from "@/components/layout/Footer";
import GuidedSearch from "@/components/ui/GuidedSearch";
import RecentlyViewed from "@/components/RecentlyViewed";
import { useCityDetection } from "@/hooks/useCityDetection";
import TutorialTour from "@/components/TutorialTour";
import FeaturedSalonCarousel from "@/components/ui/FeaturedSalonCarousel";
import type { SalonCard as SalonCardType, LastMinuteSlot } from "@/lib/types";
import { useRecentVisits } from "@/hooks/useRecentVisits";
// KILLED per DESIGN_SPEC §4: DiscoverCarousel, TrustStatsBanner, HowItWorks removed
import BrowseByCitySection from "@/components/BrowseByCitySection";
import TestimonialCarousel from "@/components/TestimonialCarousel";
// HomepageHero (V5) replaced 2026-05-02 per Q49 — see new HeroAboveFold below.
import HeroAboveFold from "@/components/home/HeroAboveFold";
import TrustStatsBanner from "@/components/home/TrustStatsBanner";
import NearbySection from "@/components/home/NearbySection";
import DiscoverSection from "@/components/home/DiscoverSection";
import LastMinuteStrip from "@/components/ui/LastMinuteStrip";
// FloatingNavPill removed 2026-05-02 per Q58 (web drops bottom nav; hamburger header + avatar dropdown only).


// ─────────────────────────────────────────────────────────────────────────────
// HomePage component — V5 Component Map rebuild
// Background: #FFFFFF · No dividers · 32-48px section gaps · 88px bottom pad
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
    <div className="min-h-screen relative overflow-x-hidden bg-white">
      {/* GuidedSearch sheet — sheet-only, trigger rendered inline (Q49 search card opens via [data-gs-trigger]) */}
      <GuidedSearch categoryCounts={categoryCounts} hideTrigger />

      <main className="max-w-[1280px] mx-auto" style={{ paddingBottom: 88 }}>

        {/* Q51 home rhythm — 9 slots in priority order. Each section is conditional;
            sections with no data return null and the next slot moves up. Q49 above-fold
            is slot 0a (always renders). Q51 #6 Spotlight deferred (needs admin curation
            UI + spotlight_salons table — Phase 4.b backlog). */}

        {/* ── 0a. Q49 Above-fold ── */}
        <HeroAboveFold />

        {/* ── 0b. Recently Viewed (conditional — renders empty if no localStorage history) ── */}
        <section className="px-5 md:px-10 lg:px-20" style={{ marginTop: 32 }}>
          <RecentlyViewed />
        </section>

        {/* ── 1. Last Minute Strip (conditional) ── */}
        {sections.last_minute && lastMinuteSlots.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <LastMinuteStrip slots={lastMinuteSlots} />
          </div>
        )}

        {/* ── 2. Q51 Nearby — geolocation-aware salon strip ── */}
        <div style={{ marginTop: 40 }}>
          <NearbySection />
        </div>

        {/* ── 3. Per-category sections (affinity-reordered up to MAX_CATEGORY_SECTIONS) ── */}
        <section className="px-5 md:px-10 lg:px-20" style={{ marginTop: 40 }}>
          {visibleSections.map(({ key, label }, index) => {
            const salonsForCategory = categorySalons[key] || [];
            return (
              <div key={key} style={{ marginTop: index === 0 ? 0 : 40 }}>
                <FeaturedSalonCarousel salons={salonsForCategory} locale={locale} title={label} viewAllHref={`/${locale}/${key}`} />
              </div>
            );
          })}
        </section>

        {/* ── 4. Q51 Discover (Pinterest+booking-bridge) ── */}
        <div style={{ marginTop: 48 }}>
          <DiscoverSection />
        </div>

        {/* ── Wieder buchen? (logged-in users with past booking — out-of-spec but kept) ── */}
        {sections.rebook && lastBookedSalon && (
          <section className="px-5 md:px-10 lg:px-20" style={{ marginTop: 48 }}>
            <div className="flex items-center gap-4 p-4 border border-s-ink/[0.08] rounded-card bg-white shadow-elevation-1">
              <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 bg-s-bg-sunken">
                <RefreshCw size={18} className="text-s-ink" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading text-s-ink text-[15px]">{t("rebook.title")}</p>
                <p className="text-sm text-s-ink-secondary font-body truncate mt-0.5">{t("rebook.lastVisit", { name: lastBookedSalon.name })}</p>
              </div>
              <Link href={`/${locale}/salon/${lastBookedSalon.slug}`}
                className="shrink-0 px-5 py-2.5 rounded-btn bg-s-coral text-white text-sm font-body font-semibold hover:brightness-[1.06] active:scale-[0.97] transition-[transform,filter] duration-150"
                aria-label={t("rebook.cta")}>
                {t("rebook.cta")}
              </Link>
            </div>
          </section>
        )}

        {/* ── 5. Browse by City (dark section) ── */}
        <div style={{ marginTop: 48 }}>
          <BrowseByCitySection />
        </div>

        {/* ── 6. Spotlight — DEFERRED Phase 4.b (needs spotlight_salons table + admin curation) ── */}

        {/* Breathing gap */}
        <div style={{ height: 48 }} aria-hidden="true" />

        {/* ── 7. Testimonials (only if real reviews exist) ── */}
        <TestimonialCarousel />

        {/* ── 8. Q51 Trust Stats — 4-tile stat strip ── */}
        <div style={{ marginTop: 48 }}>
          <TrustStatsBanner />
        </div>

      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <Footer />

      {/* FloatingNavPill removed 2026-05-02 per Q58 (web drops bottom nav). Mobile native/PWA can re-introduce later. */}

      {/* ── Tutorial Tour (first-visit logged-in users) ─────────────────── */}
      <TutorialTour isLoggedIn={!!userName} />
    </div>
  );
}
