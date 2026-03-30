"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { usePostHog } from "posthog-js/react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  RefreshCw,
  Search,
  Compass,
} from "lucide-react";
import SalonCard from "@/components/SalonCard";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import Footer from "@/components/layout/Footer";
// StickyMobileCTA removed — user requested removal of mobile "Salon entdecken" button
import LastMinuteCard from "@/components/LastMinuteCard";
// BlobBackground removed — V5 uses ambient-v5 CSS class
import GuidedSearch from "@/components/ui/GuidedSearch";
import AirbnbSearchBar from "@/components/ui/AirbnbSearchBar";
import CityCarouselSection from "@/components/ui/CityCarouselSection";
import RecentlyViewed from "@/components/RecentlyViewed";
import { useCityDetection } from "@/hooks/useCityDetection";
// WeatherBanner removed — doesn't contribute to conversion (Phase 0.3)
import ReviewCarousel from "@/components/ReviewCarousel";
import TutorialTour from "@/components/TutorialTour";
import FeaturedSalonCarousel from "@/components/ui/FeaturedSalonCarousel";
import type { SalonCard as SalonCardType, LastMinuteSlot } from "@/lib/types";
import { getPersistedCity } from "@/lib/city-cookie";
import { type CitySlug } from "@/lib/cities";
import { gridContainerVariants, gridItemVariants, headingVariants } from "@/lib/motion";
import { useRecentVisits } from "@/hooks/useRecentVisits";
import DiscoverCarousel from "@/components/ui/DiscoverCarousel";


// ─────────────────────────────────────────────────────────────────────────────
// Animation variants
// ─────────────────────────────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
} as const;

const categoryContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
} as const;

const categoryItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1], delay: i * 0.06 },
  }),
};


const fadeUp = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: {
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] },
  },
} as const;

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
  const [scrolledPast80, setScrolledPast80] = useState(false);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>(initialData?.categoryCounts || {});
  const salonsWithCoords = initialData?.salonsWithCoords ?? 0;

  const [salons, setSalons] = useState<SalonCardType[]>(initialData?.salons || []);
  const [categorySalons] = useState<Record<string, SalonCardType[]>>(initialData?.categorySalons ?? {});
  const [lastMinuteSlots, setLastMinuteSlots] = useState<LastMinuteSlot[]>(initialData?.lastMinuteSlots || []);
  const [newSalons, setNewSalons] = useState<SalonCardType[]>(initialData?.newSalons || []);
  const [trendingSalons, setTrendingSalons] = useState<SalonCardType[]>(initialData?.trendingSalons || []);

  useEffect(() => {
    setPersistedCity(getPersistedCity());
  }, []);

  useEffect(() => {
    const h = () => setScrolledPast80(window.scrollY > 80);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const { visits, recordVisit } = useRecentVisits();

  // Sort categories: bubble up topCategory, rest keep original order
  // Order: Entdecken (trending), then category carousels
  const orderedSectionKeys = useMemo(() => {
    const baseKeys = [
      { key: "coiffeur", label: tNav("coiffeur") as string },
      { key: "nails", label: tNav("nails") as string },
      { key: "barbershop", label: tNav("barbershop") as string },
      { key: "makeup", label: tNav("makeup") as string },
      { key: "waxing", label: tNav("waxing") as string },
    ];
    if (!visits.topCategory) return baseKeys;

    const topKey = baseKeys.find((k) => k.key === visits.topCategory);
    if (!topKey) return baseKeys;

    const rest = baseKeys.filter((k) => k.key !== visits.topCategory);
    return [topKey, ...rest];
  }, [visits.topCategory, tNav]);
  const [userName, setUserName] = useState<string | null>(null);
  const [nextBooking, setNextBooking] = useState<{ date: string; salon: string } | null>(null);
  const [sections, setSections] = useState<Record<string, boolean>>(
    initialData?.sections || {
      trending: true, nearby: true, new_salons: true,
      rebook: true, reviews: true, last_minute: true, featured: true,
      social_proof: true, partner_cta: true,
    }
  );
  const [showNearby, setShowNearby] = useState(false);

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
    // Single consolidated call for all user-specific data (bookings, profile, favorites)
    // Category counts are now SSR'd via initialData.categoryCounts
    fetch("/api/me")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) return;
        if (data.profile?.first_name) setUserName(data.profile.first_name);
        if (data.lastBooking?.slug) setLastBookedSalon({ slug: data.lastBooking.slug, name: data.lastBooking.name });
        if (data.nextBooking?.date) {
          const date = new Date(data.nextBooking.date).toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" });
          setNextBooking({ date, salon: data.nextBooking.salon });
        }
        if (Array.isArray(data.favorites)) setFavoriteIds(new Set(data.favorites as string[]));
      })
      .catch(() => {});

    // Try to passively fetch nearby if geolocation permission already granted
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          fetchNearby();
        }
      }).catch(() => {});
    }
  }, [locale, fetchNearby]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleFavoriteToggle = useCallback((salonId: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(salonId)) {
        next.delete(salonId);
        fetch(`/api/profile/favorites?salon_id=${salonId}`, { method: "DELETE" }).catch(() => {});
      } else {
        next.add(salonId);
        fetch("/api/profile/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ salon_id: salonId }),
        }).catch(() => {});
      }
      return next;
    });
  }, []);

  // ── Category grid visibility observer → drives header sticky row ──────
  const categoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = categoryRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        window.dispatchEvent(
          new CustomEvent("categoryGridVisibility", {
            detail: { visible: entry.isIntersecting },
          })
        );
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen hero-cinematic relative overflow-x-hidden">

      {/* GuidedSearch sheet — sheet-only, trigger rendered inline below */}
      <GuidedSearch categoryCounts={categoryCounts} hideTrigger />

      {/* ── Desktop Expanded Search Bar (Airbnb-style, hidden on scroll) ── */}
      <div className="hidden md:block max-w-4xl mx-auto px-6 pt-5 pb-2">
        <AirbnbSearchBar scrolledPast80={scrolledPast80} locale={locale} categoryCounts={categoryCounts} />
      </div>

      {/* ── Per-category Salon Carousels ────────────────────────────────── */}
      <div
        id="tour-services"
        ref={categoryRef}
        className="animate-in pt-6"
        style={{ animationDelay: "120ms" }}
      >
        {/* Entdecken — trending salons across all categories */}
        {trendingSalons.length > 0 && (
          <CityCarouselSection
            title={t("featured.entdecken")}
            viewAllHref={`/${locale}/discover`}
            viewAllLabel={t("featured.viewAll")}
            salons={trendingSalons}
            locale={locale}
            favoriteIds={favoriteIds}
            onFavoriteToggle={handleFavoriteToggle}
          />
        )}

        {orderedSectionKeys.map(({ key, label }) => {
          let catSalons = categorySalons[key] ?? [];
          if (catSalons.length === 0) return null;
          
          // Bubble up last visited salon to first position
          if (key === visits.topCategory && visits.lastVisitedSalonByCategory[key]) {
            const lastVisitedId = visits.lastVisitedSalonByCategory[key];
            const lastVisitedIndex = catSalons.findIndex(s => s.id === lastVisitedId);
            if (lastVisitedIndex > 0) {
              const lastVisited = catSalons[lastVisitedIndex];
              const others = catSalons.filter(s => s.id !== lastVisitedId);
              catSalons = [lastVisited, ...others];
            }
          }
          
          const href = persistedCity ? `/${locale}/${persistedCity}/${key}` : `/${locale}/${key}`;
          const handleVisit = () => {
            recordVisit(key);
          };
          return (
            <CityCarouselSection
              key={key}
              title={label}
              viewAllHref={href}
              viewAllLabel={t("featured.viewAll")}
              salons={catSalons}
              locale={locale}
              favoriteIds={favoriteIds}
              onFavoriteToggle={handleFavoriteToggle}
              onViewAll={handleVisit}
            />
          );
        })}
      </div>

      {/* WeatherBanner removed — Phase 0.3 */}

      {/* ── Wieder buchen? (logged-in users with past booking) ───────────── */}
      {sections.rebook && lastBookedSalon && (
        <section className="max-w-5xl mx-auto px-4 pt-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            className="flex items-center gap-4 p-4 border border-s-ink/[0.05] dark:border-white/[0.05] rounded-xl bg-s-bg-base/40 dark:bg-s-dm-surface/20">
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 bg-s-coral/[0.12] dark:bg-s-coral/[0.20]">
              <RefreshCw size={18} className="text-s-coral" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-bold text-s-ink dark:text-s-dm-text text-sm">{t("rebook.title")}</p>
              <p className="text-xs text-s-ink/50 font-body truncate">{t("rebook.lastVisit", { name: lastBookedSalon.name })}</p>
            </div>
            <Link href={`/${locale}/salon/${lastBookedSalon.slug}`}
              className="shrink-0 px-4 py-2 rounded-pill bg-s-coral text-white text-xs font-heading font-bold uppercase tracking-[.04em]"
              style={{ boxShadow: "0 2px 4px rgba(232,98,74,.25), 0 4px 16px rgba(232,98,74,.15)" }}
              aria-label={t("rebook.cta")}>
              {t("rebook.cta")}
            </Link>
          </motion.div>
        </section>
      )}

      {/* ── Recently Viewed (returning users) ────────────────────────────── */}
      <RecentlyViewed />

      {/* ── Discover Preview — step 5 per A.6 ──────────────────────────────── */}
      {/* z-[2] + opaque bg blocks any bleed from category icons above (A.5) */}
      <section className="animate-in max-w-base mx-auto px-0 py-8 md:py-12 overflow-hidden relative z-[2]" style={{ background: "#F5F0EB", animationDelay: "320ms" }}>
        <div className="max-w-5xl mx-auto px-4 mb-2 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="block font-body font-semibold text-[12px] uppercase mb-2" style={{ letterSpacing: "2.5px", color: "#E8735A" }}>{t("discover.eyebrow")}</span>
            <h2 className="font-heading font-extrabold text-s-ink dark:text-s-dm-text" style={{ fontSize: "clamp(24px, 3.5vw, 42px)", letterSpacing: "-0.02em", lineHeight: "1.0" }}>
              {t("discover.title")}
            </h2>
          </div>
          <Link href={`/${locale}/discover`}
            className="inline-flex items-center gap-2 text-sm font-heading font-bold text-white bg-s-ink dark:bg-s-dm-raised px-6 py-3 rounded-pill hover:brightness-[1.08] active:scale-[0.98] transition-[transform,filter] duration-150 shrink-0 self-start">
            {t("discover.catalogCta")} →
          </Link>
        </div>

        {/* The new horizontal swiper component replaces the static subset */}
        <DiscoverCarousel locale={locale} />
      </section>

      {/* ── Partner Teaser (slim) ────────────────────────────────────────── */}
      <section className="py-8 px-4 border-t border-s-ink/[0.06] dark:border-white/[0.06]">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm font-body text-s-ink/50 dark:text-s-dm-text/50">
            {t("partner.teaserPrompt")}{" "}
            <Link
              href={`/${locale}/partner`}
              className="font-heading font-bold text-s-coral hover:brightness-[1.06] transition-[filter] duration-150"
            >
              {t("partner.cta")} →
            </Link>
          </p>
        </div>
      </section>


      {/* ── Sticky Mobile CTA ────────────────────────────────────────────── */}
      {/* StickyMobileCTA removed — Phase 2 */}

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <Footer />

      {/* ── Tutorial Tour (first-visit logged-in users) ─────────────────── */}
      <TutorialTour isLoggedIn={!!userName} />
    </div>
  );
}
