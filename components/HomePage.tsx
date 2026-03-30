"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { usePostHog } from "posthog-js/react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Scissors,
  RefreshCw,
  MapPin,
} from "lucide-react";
import SalonCard from "@/components/SalonCard";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import Footer from "@/components/layout/Footer";
// StickyMobileCTA removed — user requested removal of mobile "Salon entdecken" button
import LastMinuteCard from "@/components/LastMinuteCard";
// BlobBackground removed — V5 uses ambient-v5 CSS class
import GuidedSearch from "@/components/ui/GuidedSearch";
import RecentlyViewed from "@/components/RecentlyViewed";
import { useCityDetection } from "@/hooks/useCityDetection";
// WeatherBanner removed — doesn't contribute to conversion (Phase 0.3)
import ReviewCarousel from "@/components/ReviewCarousel";
import TutorialTour from "@/components/TutorialTour";
import type { SalonCard as SalonCardType, LastMinuteSlot } from "@/lib/types";
import { CLIENT_FEATURE_FLAGS } from "@/lib/feature-flags";
import { getPersistedCity } from "@/lib/city-cookie";
import { type CitySlug } from "@/lib/cities";
import { gridContainerVariants, gridItemVariants, headingVariants } from "@/lib/motion";


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

import { CoiffeurIcon } from "@/components/icons/category/CoiffeurIcon";
import { BarberIcon } from "@/components/icons/category/BarberIcon";
import { NailsIcon } from "@/components/icons/category/NailsIcon";
import { SpaIcon } from "@/components/icons/category/SpaIcon";
import { MakeupIcon } from "@/components/icons/category/MakeupIcon";
import { WaxingIcon } from "@/components/icons/category/WaxingIcon";
import DiscoverCarousel from "@/components/ui/DiscoverCarousel";

// ─────────────────────────────────────────────────────────────────────────────
// Category grid data
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { key: "coiffeur",   label: "Coiffeur",   Icon: CoiffeurIcon },
  { key: "barbershop", label: "Barber",     Icon: BarberIcon   },
  { key: "nails",      label: "Nails",      Icon: NailsIcon    },
  { key: "spa",        label: "Spa",        Icon: SpaIcon      },
  { key: "makeup",     label: "Makeup",     Icon: MakeupIcon   },
  { key: "waxing",     label: "Waxing",     Icon: WaxingIcon   },
] as const;


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
  const [loading, setLoading] = useState(false);
  const [lastBookedSalon, setLastBookedSalon] = useState<{ name: string; slug: string } | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [nearbySalons, setNearbySalons] = useState<SalonCardType[]>([]);
  const [locationError, setLocationError] = useState(false);
  const [persistedCity, setPersistedCity] = useState<CitySlug | null>(null);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>(initialData?.categoryCounts || {});
  const salonsWithCoords = initialData?.salonsWithCoords ?? 0;

  const [salons, setSalons] = useState<SalonCardType[]>(initialData?.salons || []);
  const [lastMinuteSlots, setLastMinuteSlots] = useState<LastMinuteSlot[]>(initialData?.lastMinuteSlots || []);
  const [newSalons, setNewSalons] = useState<SalonCardType[]>(initialData?.newSalons || []);
  const [trendingSalons, setTrendingSalons] = useState<SalonCardType[]>(initialData?.trendingSalons || []);

  useEffect(() => {
    setPersistedCity(getPersistedCity());
  }, []);
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

      {/* ── Hero (compact) ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-14 sm:pt-20 pb-10 sm:pb-14 min-h-[500px] flex flex-col justify-end">
        {/* Background Image & Gradient */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=2874&auto=format&fit=crop')",
          }}
          aria-hidden="true"
        />
        <div 
          className="absolute inset-0 z-0 dark:hidden"
          style={{ 
            background: "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(245,240,235,0.8) 50%, #F5F0EB 100%)"
          }}
          aria-hidden="true"
        />
        <div 
          className="absolute inset-0 z-0 hidden dark:block"
          style={{ 
            background: "linear-gradient(180deg, rgba(18,18,18,0.3) 0%, rgba(18,18,18,0.9) 60%, #121212 100%)"
          }}
          aria-hidden="true"
        />
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 w-full mt-auto">
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="text-left">
            {/* Greeting / headline */}
            <motion.h1 variants={fadeUp}
              className="font-display uppercase text-s-ink dark:text-s-dm-text"
              style={{ fontSize: "clamp(32px, 5vw, 60px)", letterSpacing: "0.01em", lineHeight: "0.92" }}>
              {userName ? (
                <>{t("hero.hello")} <span className="text-s-coral">{userName}</span></>
              ) : (
                <>{t("hero.headlineWord1")}<span className="text-s-coral">.</span> {t("hero.headlineWord2")}<span className="text-s-coral">.</span></>
              )}
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="mt-3 font-body font-medium text-s-ink/50 dark:text-s-dm-text/50"
              style={{ fontSize: "18px" }}
            >
              {userName && nextBooking
                ? t("hero.nextBooking", { date: nextBooking.date, salon: nextBooking.salon })
                : t("hero.aiTagline")}
            </motion.p>
          </motion.div>

          {/* Guided search — Airbnb-style step-by-step discovery funnel */}
          <div className="mt-6 w-full max-w-2xl">
            <GuidedSearch />
          </div>

          {/* Trust chips */}
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            {[
              t("trust.freeCancellation"),
              t("trust.securePayment"),
              t("trust.swissMade"),
              t("trust.paymentMethods"),
            ].map((text, i, arr) => (
              <span key={text} className="flex items-center gap-1.5">
                <span className="text-[11px] font-heading text-s-ink/40 dark:text-s-dm-text/40 whitespace-nowrap">
                  {text}
                </span>
                {i < arr.length - 1 && (
                  <span className="text-s-ink/20 dark:text-s-dm-text/20 text-[11px]">·</span>
                )}
              </span>
            ))}
          </div>

          {/* Small text links — Buchungen only when logged in */}
          {userName && (
            <motion.div variants={fadeUp} initial="hidden" animate="visible"
              className="mt-5 flex items-center gap-5 flex-wrap">
              <Link href={`/${locale}/account/bookings`}
                className="text-xs font-heading font-bold uppercase tracking-[.06em] text-s-ink/40 dark:text-s-dm-text/40 hover:text-s-coral transition-colors">
                {t("hero.bookings")} →
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* ── Category Grid ──────────────────────────────────────────────────── */}
      <section id="tour-services" ref={categoryRef} className="py-10 md:py-14">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div variants={headingVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }}>
            <div className="mb-6">
              <span className="block font-heading font-bold text-[11px] uppercase tracking-[.20em] text-s-amber mb-1">
                {t("categories.label")}
              </span>
              <h2 className="font-heading font-extrabold text-s-ink dark:text-s-dm-text" style={{ fontSize: "clamp(24px, 3vw, 38px)", letterSpacing: "-0.02em" }}>
                {t("categories.title")}
              </h2>
            </div>
          </motion.div>

          {/* Unified category row — all viewports */}
          <motion.div
            className="flex overflow-x-auto scrollbar-hide -mx-4 px-4 gap-6 pb-1"
            variants={categoryContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {CATEGORIES
              .filter(({ key }) => key !== 'spa' || CLIENT_FEATURE_FLAGS.isMassageSpaEnabled)
              .map(({ key, label, Icon }, i) => (
                <motion.div key={key} variants={categoryItemVariants} custom={i} className="flex-shrink-0">
                  <Link
                    href={persistedCity ? `/${locale}/${persistedCity}/${key}` : `/${locale}/${key}`}
                    className="flex flex-col items-center gap-2.5 w-[62px] transition-transform duration-200 hover:scale-[1.05] active:scale-[0.97]"
                  >
                    <Icon className="w-7 h-7 text-s-coral" animate />
                    <span className="font-body text-[11px] font-medium text-center leading-tight whitespace-nowrap text-s-ink dark:text-s-dm-text">
                      {label}
                    </span>
                  </Link>
                </motion.div>
              ))}
          </motion.div>
        </div>
      </section>

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

      {/* ── Featured Salons ────────────────────────────────────────────────── */}
      {sections.featured && salons.length > 0 && (
        <section className="py-10 md:py-14">
          <div className="max-w-5xl mx-auto px-4">
            <motion.div variants={headingVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }}>
              <div className="flex items-end justify-between mb-6">
                <div>
                  <span className="block font-heading font-bold text-[11px] uppercase tracking-[.20em] text-s-amber mb-1">
                    {t("featured.eyebrow")}
                  </span>
                  <h2 className="font-heading font-extrabold text-s-ink dark:text-s-dm-text"
                    style={{ fontSize: "clamp(24px, 3vw, 38px)", letterSpacing: "-0.02em" }}>
                    {t("featured.title")}
                  </h2>
                  <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 mt-1 font-body">
                    {t("featured.subtitle")}
                  </p>
                </div>
                <Link
                  href={`/${locale}/coiffeur`}
                  className="text-sm font-body text-s-ink/60 border border-s-ink/10 px-4 py-2 rounded-pill hover:border-s-coral/40 hover:text-s-coral transition-colors duration-150 shrink-0"
                  aria-label={t("featured.viewAll")}>
                  {t("featured.viewAll")} →
                </Link>
              </div>
            </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <Skeleton key={i} variant="card" />)}
            </div>
          ) : salons.length === 0 ? (
            <EmptyState
              icon={Scissors}
              illustration="coming-soon"
              title={t("featured.emptyTitle")}
              message={t("featured.emptyMessage")}
            />
          ) : (
            <motion.div
              className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8"
              variants={gridContainerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
            >
              {salons.map((salon, i) => (
                <motion.div
                  key={salon.id}
                  variants={gridItemVariants}
                  custom={i}
                >
                  <SalonCard
                    salon={salon}
                    locale={locale}
                    showAvailability
                    showDistance
                    isFavorited={favoriteIds.has(salon.id)}
                    onFavoriteToggle={handleFavoriteToggle}
                    animated={false}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>
      )}

      {/* ── Discover Preview (Phase 3 Carousel) ─────────────────────────────────── */}
      <section className="max-w-base mx-auto px-0 py-8 md:py-12 overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 mb-2 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="block font-heading font-bold text-[11px] uppercase tracking-[.22em] text-s-amber mb-2">{t("discover.eyebrow")}</span>
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

      {/* ── Deals ────────────────────────────────────────── */}
      {sections.last_minute && lastMinuteSlots.length > 0 && (
      <section id="tour-last-minute" className="py-10 md:py-14">
        <div className="max-w-5xl mx-auto px-4">
            <div className="flex items-end justify-between mb-7 flex-wrap gap-3">
              <div>
                <span className="block font-heading font-bold text-[11px] uppercase tracking-[.20em] mb-2 text-s-amber">
                  {t("lastMinute.eyebrow")}
                </span>
                <h2 className="font-heading font-extrabold text-s-ink dark:text-s-dm-text"
                  style={{ fontSize: "clamp(24px, 3vw, 38px)", letterSpacing: "-0.02em" }}>
                  {t("lastMinute.title")}
                </h2>
              </div>
              <Link href={`/${locale}/deals`}
                className="text-sm font-body text-s-ink/50 border border-s-ink/10 px-4 py-2 rounded-pill hover:border-s-coral/30 hover:text-s-coral transition-colors duration-150 shrink-0"
                aria-label={t("lastMinute.viewAll")}>
                {t("lastMinute.viewAll")} →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-6">
              {lastMinuteSlots.map((slot) => (
                <LastMinuteCard key={slot.id} slot={slot} locale={locale} />
              ))}
            </div>
        </div>
      </section>
      )}

      {/* ── Trending Section ────────────────────────────────────────────────── */}
      {sections.trending && trendingSalons.length > 0 && (
        <section className="py-10 md:py-14">
          <div className="max-w-5xl mx-auto px-4">
            <motion.div variants={headingVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }}>
              <div className="flex items-end justify-between mb-6">
                <div>
                  <span className="block font-heading font-bold text-[11px] uppercase tracking-[.20em] text-s-amber mb-1">
                    {t("trending.eyebrow")}
                  </span>
                  <h2 className="font-heading font-extrabold text-s-ink dark:text-s-dm-text"
                    style={{ fontSize: "clamp(24px, 3vw, 38px)", letterSpacing: "-0.02em" }}>
                    {t("trending.title")}
                  </h2>
                  <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 font-body mt-1">
                    {t("trending.subtitle")}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8"
              variants={gridContainerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
            >
              {trendingSalons.map((salon, i) => (
                <motion.div key={salon.id} variants={gridItemVariants} custom={i}>
                  <SalonCard salon={salon} locale={locale} isFavorited={favoriteIds.has(salon.id)} onFavoriteToggle={handleFavoriteToggle} animated={false} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* ── Near You Section ────────────────────────────────────────────────── */}
      {sections.nearby && (showNearby || nearbySalons.length > 0) && (
        <section className="py-10 md:py-14">
          <div className="max-w-5xl mx-auto px-4">
            <motion.div variants={headingVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }}>
              <div className="flex items-end justify-between mb-6">
                <div>
                  <span className="block font-heading font-bold text-[11px] uppercase tracking-[.20em] text-s-amber mb-1">
                    {t("nearby.eyebrow")}
                  </span>
                  <h2 className="font-heading font-extrabold text-s-ink dark:text-s-dm-text"
                    style={{ fontSize: "clamp(24px, 3vw, 38px)", letterSpacing: "-0.02em" }}>
                    {t("nearby.title")}
                  </h2>
                  <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 font-body mt-1">
                    {t("nearby.subtitle")}
                  </p>
                </div>
                {nearbySalons.length > 0 && (
                  <Link href={`/${locale}/coiffeur`} className="text-sm font-body text-s-ink/60 border border-s-ink/10 px-4 py-2 rounded-pill hover:border-s-coral/40 hover:text-s-coral transition-colors duration-150 shrink-0" aria-label={t("nearby.viewAll")}>
                    {t("nearby.viewAll")} →
                  </Link>
                )}
              </div>
            </motion.div>

            <motion.div
              className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8"
              variants={gridContainerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
            >
              {nearbySalons.map((salon, i) => (
                <motion.div key={salon.id} variants={gridItemVariants} custom={i}>
                  <SalonCard salon={salon} locale={locale} showDistance isFavorited={favoriteIds.has(salon.id)} onFavoriteToggle={handleFavoriteToggle} animated={false} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* ── Map CTA — visual card with map-tint bg ─────────────────────── */}
      {salonsWithCoords >= 3 && (
        <section className="py-10 md:py-14">
          <div className="max-w-5xl mx-auto px-4">
            <Link
              href={`/${locale}/search?view=map${persistedCity ? `&city=${persistedCity}` : ''}`}
              className="block relative overflow-hidden rounded-card-lg group"
              style={{
                background: "linear-gradient(135deg, rgba(107,163,200,0.18) 0%, rgba(107,163,200,0.08) 50%, rgba(232,98,74,0.06) 100%)",
                border: "1px solid rgba(107,163,200,0.20)",
              }}
            >
              {/* Map grid pattern overlay */}
              <div className="absolute inset-0 opacity-[0.06]" style={{
                backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(107,163,200,0.8) 28px, rgba(107,163,200,0.8) 29px), repeating-linear-gradient(90deg, transparent, transparent 28px, rgba(107,163,200,0.8) 28px, rgba(107,163,200,0.8) 29px)",
              }} aria-hidden />
              {/* Pin decoration */}
              <div className="absolute top-4 right-6 opacity-20" aria-hidden>
                <MapPin className="w-16 h-16 text-s-blue" />
              </div>
              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-8">
                <div>
                  <span className="block font-heading font-bold text-[11px] uppercase tracking-[.20em] text-s-blue/70 mb-1">
                    {t("map.eyebrow")}
                  </span>
                  <h2 className="font-heading font-bold text-s-ink dark:text-s-dm-text" style={{ fontSize: "clamp(18px, 2.5vw, 24px)" }}>
                    {t("map.title")}
                  </h2>
                </div>
                <span className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-pill bg-white/90 dark:bg-s-dm-surface/90 text-s-ink dark:text-s-dm-text font-heading font-bold text-xs uppercase tracking-[.06em] group-hover:-translate-y-px transition-[transform,box-shadow] duration-200"
                  style={{ boxShadow: "0 2px 8px rgba(26,18,9,.10)" }}>
                  <MapPin className="w-3.5 h-3.5 text-s-coral" />
                  {t("map.openCta")}
                </span>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* ── Review Carousel ──────────────────────────────────────────────── */}
      {sections.reviews && <ReviewCarousel />}

      {/* ── Neue Salons Section ─────────────────────────────────────────────── */}
      {sections.new_salons && newSalons.length > 0 && (
        <section className="py-10 md:py-14">
          <div className="max-w-5xl mx-auto px-4">
            <motion.div variants={headingVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }}>
              <div className="flex items-end justify-between mb-6">
                <div>
                  <span className="block font-heading font-bold text-[11px] uppercase tracking-[.20em] text-s-amber mb-1">
                    {t("newSalons.eyebrow")}
                  </span>
                  <h2 className="font-heading font-extrabold text-s-ink dark:text-s-dm-text"
                    style={{ fontSize: "clamp(24px, 3vw, 38px)", letterSpacing: "-0.02em" }}>
                    {t("newSalons.title")}
                  </h2>
                  <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 mt-1 font-body">
                    {t("newSalons.subtitle")}
                  </p>
                </div>
              </div>
            </motion.div>
            <motion.div
              className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8"
              variants={gridContainerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
            >
              {newSalons.map((salon, i) => (
                <motion.div key={salon.id} variants={gridItemVariants} custom={i}>
                  <SalonCard
                    salon={salon}
                    locale={locale}
                    isFavorited={favoriteIds.has(salon.id)}
                    onFavoriteToggle={handleFavoriteToggle}
                    animated={false}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Last-Minute section moved to after Beliebte Salons — Phase 0.3 */}



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
