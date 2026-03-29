"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Scissors,
  RefreshCw,
  Lock,
  Check,
  RotateCcw,
  CreditCard,
  Shield,
  MapPin,
} from "lucide-react";
import SalonCard from "@/components/SalonCard";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import Footer from "@/components/layout/Footer";
import SocialProofStrip from "@/components/ui/SocialProofStrip";
// StickyMobileCTA removed — user requested removal of mobile "Salon entdecken" button
import LastMinuteCard from "@/components/LastMinuteCard";
// BlobBackground removed — V5 uses ambient-v5 CSS class
import HomeSearchBar from "@/components/ui/HomeSearchBar";
import CitySelector from "@/components/ui/CitySelector";
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

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] },
  },
} as const;

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
  { key: "coiffeur",   label: "COIFFEUR",   Icon: CoiffeurIcon, color: "text-s-coral",       bgClass: "bg-s-coral/[0.08] dark:bg-s-coral/[0.15]" },
  { key: "barbershop", label: "BARBER",     Icon: BarberIcon,   color: "text-s-ink",         bgClass: "bg-s-ink/[0.06] dark:bg-white/[0.08]" },
  { key: "nails",      label: "NAILS",      Icon: NailsIcon,    color: "text-s-amber",       bgClass: "bg-s-yellow/[0.15] dark:bg-s-yellow/[0.12]" },
  { key: "spa",        label: "SPA",        Icon: SpaIcon,      color: "text-s-sage",        bgClass: "bg-s-sage/[0.12] dark:bg-s-sage/[0.15]" },
  { key: "makeup",     label: "MAKEUP",     Icon: MakeupIcon,   color: "text-s-sand",        bgClass: "bg-s-sand/[0.15] dark:bg-s-sand/[0.12]" },
  { key: "waxing",     label: "WAXING",     Icon: WaxingIcon,   color: "text-s-plum",        bgClass: "bg-s-plum/[0.10] dark:bg-s-plum/[0.20]" },
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
  }
};

export default function HomePage({ initialData }: HomePageProps) {
  useCityDetection();
  
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

  return (
    <div className="min-h-screen hero-cinematic relative overflow-x-hidden">

      {/* ── Hero (compact) ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-14 sm:pt-20 pb-10 sm:pb-14">
        <div className="relative z-10 max-w-5xl mx-auto px-4 w-full">
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="text-center">
            {/* Greeting / headline */}
            <motion.h1 variants={fadeUp}
              className="font-display uppercase text-s-ink dark:text-s-dm-text"
              style={{ fontSize: "clamp(40px, 7vw, 80px)", letterSpacing: "0.01em", lineHeight: "0.9" }}>
              {userName ? (
                <>{t("hero.hello")} <span className="text-s-coral">{userName}</span></>
              ) : (
                <>{t("hero.headlineWord1")}<span className="text-s-coral">.</span> {t("hero.headlineWord2")}<span className="text-s-coral">.</span></>
              )}
            </motion.h1>
            <motion.p variants={fadeUp}
              className="mt-3 font-body italic text-s-ink/60 dark:text-s-dm-text/60 leading-[1.7] max-w-md mx-auto"
              style={{ fontSize: "15px" }}>
              {userName && nextBooking
                ? t("hero.nextBooking", { date: nextBooking.date, salon: nextBooking.salon })
                : userName
                  ? t("hero.welcomeBack")
                  : t("hero.subtitle")}
            </motion.p>
          </motion.div>

          {/* Search bar right under greeting */}
          <div className="mt-10 max-w-4xl mx-auto relative">
            <div aria-hidden className="absolute -inset-3 md:-inset-5 bg-gradient-to-r from-s-coral/8 via-s-plum/6 to-s-amber/8 rounded-[40px] blur-2xl opacity-40 -z-10" />
            <HomeSearchBar />
          </div>

          {/* City selector — mobile only */}
          <div className="mt-3 flex justify-center md:hidden">
            <CitySelector />
          </div>

          {/* Small text links (Angebote, Buchungen, Partner) */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible"
            className="mt-4 flex items-center justify-center gap-4 sm:gap-6 flex-wrap">
            <Link href={`/${locale}/angebote`}
              className="text-xs font-heading font-bold uppercase tracking-[.06em] text-s-ink/50 dark:text-s-dm-text/50 hover:text-s-coral transition-colors"
              aria-label={t("cta.lastMinute")}>
              {t("cta.lastMinute")} →
            </Link>
            <Link href={`/${locale}/account/bookings`}
              className="text-xs font-heading font-bold uppercase tracking-[.06em] text-s-ink/50 dark:text-s-dm-text/50 hover:text-s-coral transition-colors">
              {t("hero.bookings")} →
            </Link>
            <Link href={`/${locale}/partner`}
              className="text-xs font-heading font-bold uppercase tracking-[.06em] text-s-ink/50 dark:text-s-dm-text/50 hover:text-s-coral transition-colors">
              {t("cta.partner")} →
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Category Grid ──────────────────────────────────────────────────── */}
      <section id="tour-services" className="py-10 md:py-14 bg-[--base]">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div variants={headingVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }}>
            <div className="mb-6 text-center">
              <span className="block font-heading font-bold text-[11px] uppercase tracking-[.20em] text-s-amber mb-1">
                {t("categories.label")}
              </span>
              <h2 className="font-heading font-extrabold text-s-ink dark:text-s-dm-text" style={{ fontSize: "clamp(24px, 3vw, 38px)", letterSpacing: "-0.02em" }}>
                {t("categories.title")}
              </h2>
            </div>
          </motion.div>

          {/* Unified squircle category row — all viewports */}
          <motion.div
            className="flex overflow-x-auto scrollbar-hide -mx-4 px-4 gap-5 pb-1"
            variants={categoryContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {CATEGORIES.map(({ key, label, Icon, color, bgClass }, i) => {
              const isEnabled = key !== 'spa' || CLIENT_FEATURE_FLAGS.isMassageSpaEnabled;
              return (
                <motion.div key={key} variants={categoryItemVariants} custom={i} className="flex-shrink-0">
                  <Link
                    href={isEnabled ? (persistedCity ? `/${locale}/${persistedCity}/${key}` : `/${locale}/${key}`) : '#'}
                    aria-disabled={!isEnabled}
                    className="flex flex-col items-center gap-2 w-[68px]"
                  >
                    <div
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center ${bgClass} ${isEnabled ? 'transition-transform duration-200 hover:scale-[1.05] active:scale-[0.97]' : 'opacity-40'}`}
                    >
                      <Icon className={`w-7 h-7 ${isEnabled ? color : 'text-s-ink/30'}`} animate />
                    </div>
                    <span className={`font-body text-[11px] font-medium text-center leading-tight whitespace-nowrap ${isEnabled ? 'text-s-ink dark:text-s-dm-text' : 'text-s-ink/35'}`}>
                      {label}
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── Discover Preview (Phase 3 Carousel) ─────────────────────────────────── */}
      <section className="max-w-base mx-auto px-0 py-8 md:py-12 overflow-hidden bg-[--raised]">
        <div className="max-w-5xl mx-auto px-4 mb-2 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="block font-heading font-bold text-[11px] uppercase tracking-[.22em] text-s-amber mb-2">{t("discover.eyebrow")}</span>
            <h2 className="font-display text-s-ink dark:text-s-dm-text" style={{ fontSize: "clamp(32px, 5vw, 48px)", letterSpacing: "0.01em", lineHeight: "0.95" }}>
              {t("discover.title")}
            </h2>
          </div>
          <Link href={`/${locale}/discover`}
            className="inline-flex items-center gap-2 text-sm font-heading font-bold text-s-ink/70 dark:text-s-dm-text border border-s-ink/10 dark:border-s-dm-border px-6 py-3 rounded-pill hover:border-s-coral/40 hover:text-s-coral active:scale-[0.98] transition-[transform,color,border-color] duration-150 shrink-0">
            {t("discover.catalogCta")} →
          </Link>
        </div>
        
        {/* The new horizontal swiper component replaces the static subset */}
        <DiscoverCarousel locale={locale} />
      </section>

      {/* WeatherBanner removed — Phase 0.3 */}

      {/* ── Wieder buchen? (logged-in users with past booking) ───────────── */}
      {sections.rebook && lastBookedSalon && (
        <section className="max-w-5xl mx-auto px-4 pt-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            className="flex items-center gap-4 p-4 card-v4">
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
      {sections.featured && (
        <section className="py-10 md:py-14 bg-[--base]">
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

      {/* ── Deals ────────────────────────────────────────── */}
      {sections.last_minute && (
      <section id="tour-last-minute" className="py-10 md:py-14 overflow-hidden relative bg-s-plum">
        <div className="max-w-5xl mx-auto px-4 relative z-10">
            <div className="flex items-end justify-between mb-7 flex-wrap gap-3">
              <div>
                <span className="block font-body font-bold text-[11px] uppercase tracking-[.10em] mb-2 text-s-yellow">
                  {t("lastMinute.eyebrow")}
                </span>
                <h2 className="font-body font-bold text-white"
                  style={{ fontSize: "clamp(24px, 3vw, 38px)", letterSpacing: "-0.04em" }}>
                  {t("lastMinute.title")}
                </h2>
              </div>
              <Link href={`/${locale}/deals`}
                className="text-sm font-body text-white/60 border border-white/20 px-4 py-2 rounded-pill hover:border-white/40 hover:text-white transition-colors duration-150 shrink-0"
                aria-label={t("lastMinute.viewAll")}>
                {t("lastMinute.viewAll")} →
              </Link>
            </div>

          {lastMinuteSlots.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-6">
              {lastMinuteSlots.map((slot) => (
                <LastMinuteCard key={slot.id} slot={slot} locale={locale} />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="rounded-[12px] bg-white/[0.08] border border-white/[0.12] px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center gap-6"
            >
              <div className="flex-1 w-full text-center sm:text-left">
                <p className="text-sm text-white/60 font-body">
                  {t("lastMinute.emptyMessage")}
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </section>
      )}

      {/* ── Trending Section ────────────────────────────────────────────────── */}
      {sections.trending && trendingSalons.length > 0 && (
        <section className="py-10 md:py-14 bg-[--raised]">
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
        <section className="py-10 md:py-14 bg-[--base]">
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

      {/* ── Map CTA — V4 Clean ──────────────────────────────────────────── */}
      <section className="py-10 md:py-14 bg-[--raised]">
        <div className="max-w-5xl mx-auto px-4">
          <div className="card-v4 p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-full bg-s-coral/[0.08] dark:bg-s-coral/[0.15] flex items-center justify-center shrink-0">
                <MapPin className="w-6 h-6 text-s-coral" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-s-ink dark:text-s-dm-text text-lg">
                  {t("map.title")}
                </h2>
                <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 font-body mt-0.5">
                  {t("map.eyebrow")}
                </p>
              </div>
            </div>
            <Link
              href={`/${locale}/search?view=map${persistedCity ? `&city=${persistedCity}` : ''}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-pill bg-s-ink dark:bg-white text-white dark:text-s-ink font-heading font-bold text-xs uppercase tracking-[.06em] hover:-translate-y-px hover:shadow-elevation-3 active:scale-[0.98] transition-[transform,box-shadow] duration-200 shrink-0"
            >
              <MapPin className="w-4 h-4" />
              {t("map.openCta")}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Review Carousel ──────────────────────────────────────────────── */}
      {sections.reviews && <ReviewCarousel />}

      {/* ── Neue Salons Section ─────────────────────────────────────────────── */}
      {sections.new_salons && newSalons.length > 0 && (
        <section className="py-10 md:py-14 bg-[--base]">
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



      {/* ── Partner Banner ─────────────────────────────────────────────────── */}
      {sections.partner_cta && (
      <section className="py-10 sm:py-14 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="rounded-card-lg overflow-hidden relative bg-gradient-to-br from-s-amber via-s-coral to-s-plum"
            style={{ boxShadow: "0 24px 72px rgba(26,18,9,.18)" }}>
            <div className="relative z-10 p-8 sm:p-12 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="max-w-xl text-center md:text-left">
                <h2 className="font-heading font-bold text-white mb-4 leading-tight"
                  style={{ fontSize: "clamp(24px, 3vw, 38px)", letterSpacing: "-0.02em" }}>
                  {t("partner.title")}
                </h2>
                <p className="font-body italic text-white/70 text-lg leading-[1.82]">
                  {t("partner.subtitle")}
                </p>
              </div>
              <div className="shrink-0">
                <Link href={`/${locale}/partner`}
                  className="inline-flex items-center gap-2 px-10 py-4 rounded-pill bg-white dark:bg-s-dm-text text-s-ink dark:text-s-dm-bg font-heading font-bold text-sm uppercase tracking-[.04em] hover:bg-s-bg-base dark:hover:bg-s-dm-text/90 hover:-translate-y-px transition-[background-color,transform] duration-150"
                  style={{ boxShadow: "0 2px 4px rgba(26,18,9,.12), 0 4px 16px rgba(26,18,9,.10)" }}
                  aria-label={t("partner.cta")}>
                  {t("partner.cta")} →
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      )}

      {/* ── Trust Strip ──────────────────────────────────────────────────── */}
      <div className="px-4 pb-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex gap-4 flex-wrap items-center px-5 py-4 rounded-card bg-white dark:bg-s-dm-surface border border-s-ink/[0.06] dark:border-white/[0.06] shadow-elevation-1">
            {[
              { icon: <Lock size={14} aria-hidden="true" />, label: t("trust.securePayment") },
              { icon: <Shield size={14} aria-hidden="true" />, label: t("trust.swissMade") },
              { icon: <Check size={14} aria-hidden="true" />, label: t("trust.gdprCompliant") },
              { icon: <RotateCcw size={14} aria-hidden="true" />, label: t("trust.freeCancellation") },
              { icon: <CreditCard size={14} aria-hidden="true" />, label: t("trust.paymentMethods") },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-xs text-s-ink/70 dark:text-s-dm-text/70">
                <div className="w-7 h-7 rounded-[8px] bg-s-bg-sunken dark:bg-s-dm-bg/50 flex items-center justify-center text-s-ink/50 dark:text-s-dm-text/50 shrink-0">{icon}</div>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sticky Mobile CTA ────────────────────────────────────────────── */}
      {/* StickyMobileCTA removed — Phase 2 */}

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <Footer />

      {/* ── Tutorial Tour (first-visit logged-in users) ─────────────────── */}
      <TutorialTour isLoggedIn={!!userName} />
    </div>
  );
}
