"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  Scissors,
  RefreshCw,
  Search,
} from "lucide-react";
import SalonCard from "@/components/SalonCard";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import InteractiveHoverButton from "@/components/ui/interactive-hover-button";
import Footer from "@/components/layout/Footer";
import SocialProofStrip from "@/components/ui/SocialProofStrip";
import StickyMobileCTA from "@/components/ui/StickyMobileCTA";
import LastMinuteCard from "@/components/LastMinuteCard";
import BlobBackground from "@/components/ui/BlobBackground";
import HeroVisualCard from "@/components/ui/HeroVisualCard";
import HomeSearchBar from "@/components/ui/HomeSearchBar";
import RecentlyViewed from "@/components/RecentlyViewed";
import { useCityDetection } from "@/hooks/useCityDetection";
// WeatherBanner removed — doesn't contribute to conversion (Phase 0.3)
import ReviewCarousel from "@/components/ReviewCarousel";
import TutorialTour from "@/components/TutorialTour";
import type { SalonCard as SalonCardType, LastMinuteSlot } from "@/lib/types";
import { CLIENT_FEATURE_FLAGS } from "@/lib/feature-flags";
import { getPersistedCity } from "@/lib/city-cookie";
import { type CitySlug } from "@/lib/cities";


// ─────────────────────────────────────────────────────────────────────────────
// Animation variants
// ─────────────────────────────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1, y: 0,
    transition: { type: "spring", stiffness: 320, damping: 28 },
  },
} as const;

const fadeUp = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: {
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { type: "spring", stiffness: 300, damping: 30, mass: 0.8 },
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
  { key: "coiffeur",   label: "COIFFEUR",   count: "42",  Icon: CoiffeurIcon, color: "text-s-coral", bg: "rgba(232,98,74,.05)" },
  { key: "barbershop", label: "BARBER",     count: "18",  Icon: BarberIcon,   color: "text-s-ink", bg: "rgba(26,18,9,.05)" },
  { key: "nails",      label: "NAILS",      count: "24",  Icon: NailsIcon,    color: "text-s-amber", bg: "rgba(242,193,68,.05)" },
  { key: "spa",        label: "SPA",        count: "11",  Icon: SpaIcon,      color: "text-[#7BA688]", bg: "rgba(123,166,136,.05)" },
  { key: "makeup",     label: "MAKEUP",     count: "8",   Icon: MakeupIcon,   color: "text-[#C9A96E]", bg: "rgba(201,169,110,.05)" },
  { key: "waxing",     label: "WAXING",     count: "15",  Icon: WaxingIcon,   color: "text-[#4A1E3C]", bg: "rgba(74,30,60,.05)" },
] as const;


// ─────────────────────────────────────────────────────────────────────────────
// HomePage component
// ─────────────────────────────────────────────────────────────────────────────

export default function HomePage() {
  useCityDetection();
  
  const locale = useLocale();
  const t = useTranslations("home");
  const [salons, setSalons] = useState<SalonCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastMinuteSlots, setLastMinuteSlots] = useState<LastMinuteSlot[]>([]);
  const [lastBookedSalon, setLastBookedSalon] = useState<{ name: string; slug: string } | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [newSalons, setNewSalons] = useState<SalonCardType[]>([]);
  const [trendingSalons, setTrendingSalons] = useState<SalonCardType[]>([]);
  const [nearbySalons, setNearbySalons] = useState<SalonCardType[]>([]);
  const [locationError, setLocationError] = useState(false);
  const [persistedCity, setPersistedCity] = useState<CitySlug | null>(null);

  useEffect(() => {
    setPersistedCity(getPersistedCity());
  }, []);
  const [userName, setUserName] = useState<string | null>(null);
  const [nextBooking, setNextBooking] = useState<{ date: string; salon: string } | null>(null);
  const [sections, setSections] = useState<Record<string, boolean>>({
    trending: true, nearby: true, new_salons: true,
    rebook: true, reviews: true, last_minute: true, featured: true,
    social_proof: true, partner_cta: true,
  });
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
          .then((r) => r.json())
          .then((data) => {
            setNearbySalons(data.items ?? []);
            setLocationError(false);
          })
          .catch(() => setLocationError(true));
      },
      () => setLocationError(true)
    );
  }, []);

  const fetchData = useCallback(() => {
    // Fetch homepage section visibility config
    fetch("/api/homepage-sections")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.sections) setSections(data.sections);
      })
      .catch(() => {}); // Default to all-visible on error

    fetch("/api/salons?limit=8&sort=rating")
      .then((r) => r.json())
      .then((data) => setSalons(data.items ?? []))
      .catch(() => setSalons([]))
      .finally(() => setLoading(false));

    fetch("/api/salons?sort=last_minute&limit=4")
      .then((r) => r.json())
      .then((data) => setLastMinuteSlots(data.items ?? []))
      .catch(() => setLastMinuteSlots([]));

    // Fetch last completed booking for "Wieder buchen?" widget
    fetch("/api/bookings?status=completed&limit=1&sort=recent")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        const booking = data?.bookings?.[0] ?? data?.items?.[0];
        if (booking?.salon_name && booking?.salon_slug) {
          setLastBookedSalon({ name: booking.salon_name, slug: booking.salon_slug });
        }
      })
      .catch(() => {});

    // Fetch user profile for dynamic hero text
    fetch("/api/profile")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.display_name) {
          const firstName = data.display_name.split(" ")[0];
          setUserName(firstName);
        }
      })
      .catch(() => {});

    // Fetch next upcoming booking for hero subtext
    fetch("/api/bookings?status=confirmed&limit=1&sort=upcoming")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        const booking = data?.bookings?.[0] ?? data?.items?.[0];
        if (booking?.starts_at && booking?.salon_name) {
          setNextBooking({
            date: new Date(booking.starts_at).toLocaleDateString("de-CH", { weekday: "short", day: "numeric", month: "short" }),
            salon: booking.salon_name,
          });
        }
      })
      .catch(() => {});

    // Fetch user favorites
    fetch("/api/profile/favorites")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        const favs = data?.favorites ?? [];
        setFavoriteIds(new Set(favs.map((f: { salon_id: string }) => f.salon_id)));
      })
      .catch(() => {});

    // Fetch newest salons
    fetch("/api/salons?limit=6&sort=newest")
      .then((r) => r.json())
      .then((data) => setNewSalons(data.items ?? []))
      .catch(() => setNewSalons([]));

    // Fetch trending salons
    fetch("/api/salons/trending")
      .then((r) => r.json())
      .then((data) => setTrendingSalons(data.items ?? []))
      .catch(() => setTrendingSalons([]));



    // Try to passively fetch nearby if permission already granted
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          fetchNearby();
        }
      }).catch(() => {});
    }
  }, [fetchNearby]);

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
    <div className="min-h-screen bg-transparent relative overflow-x-hidden">
      <BlobBackground zone={1} />

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-16 sm:py-24 min-h-[80vh] flex items-center">
        {/* Mobile text legibility gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-s-bg-base/90 to-transparent pointer-events-none md:hidden" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-10 lg:gap-16 items-center">

            {/* LEFT: editorial text stack */}
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              {!userName && (
                <motion.span variants={fadeUp}
                  className="font-heading font-bold text-[11px] uppercase tracking-[.22em] text-s-amber block mb-3">
                  {t("hero.byline")}
                </motion.span>
              )}
              <motion.h1 variants={fadeUp}
                className="font-display uppercase text-s-ink dark:text-s-dm-text"
                style={{ fontSize: "clamp(64px, 9vw, 130px)", letterSpacing: "0.01em", lineHeight: "0.87" }}>
                {userName ? (
                  <>{t("hero.hello")}{" "}<span className="text-s-coral">{userName}</span></>
                ) : (
                  <>BEAUTY<span className="text-s-coral">.</span><br />BUCHEN<span className="text-s-coral">.</span></>
                )}
              </motion.h1>
              <motion.p variants={fadeUp}
                className="mt-5 font-body italic text-s-ink/60 dark:text-s-dm-text/60 leading-[1.82] max-w-md"
                style={{ fontSize: "17px" }}>
                {userName && nextBooking
                  ? t("hero.nextBooking", { date: nextBooking.date, salon: nextBooking.salon })
                  : userName
                    ? t("hero.welcomeBack")
                    : t("hero.subtitle")}
              </motion.p>

              {/* Hero CTAs — two pill buttons */}
              <motion.div variants={fadeUp} className="mt-8 flex gap-3 flex-wrap">
                <Link href={`/${locale}/search`}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-pill bg-s-coral text-white font-heading font-bold text-sm uppercase tracking-[.04em] shadow-coral-glow hover:brightness-[1.06] hover:shadow-coral-glow-hover hover:-translate-y-px active:translate-y-px active:shadow-pressed transition-all duration-150"
                  aria-label={t("cta.findSalon")}>
                  <Search size={15} aria-hidden="true" /> {t("cta.findSalon")}
                </Link>
                <Link href={`/${locale}/last-minute`}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-pill border-[1.5px] border-s-ink/20 dark:border-white/20 text-s-ink dark:text-s-dm-text font-heading font-bold text-sm uppercase tracking-[.04em] hover:bg-s-ink hover:text-white hover:shadow-warm-md hover:-translate-y-px transition-all duration-150"
                  aria-label={t("cta.lastMinute")}>
                  {t("cta.lastMinute")} →
                </Link>
              </motion.div>
            </motion.div>

            {/* RIGHT: floating hero visual card (desktop only) */}
            <HeroVisualCard />
          </div>
        </div>
      </section>

      {/* ── Search Bar ─────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 -mt-6 relative z-20 mb-12">
        <HomeSearchBar />
      </section>

      {/* ── Social Proof ─────────────────────────────────────────────────── */}
      <SocialProofStrip />

      {/* ── Category Grid ──────────────────────────────────────────────────── */}
      <section id="tour-services" className="max-w-5xl mx-auto px-4 py-16 md:py-24">
        <div className="mb-6 text-center">
          <span className="font-heading font-bold text-[11px] uppercase tracking-[.20em] text-s-amber dark:text-s-amber block mb-1">
            {t("categories.label")}
          </span>
          <h2 className="font-heading font-extrabold text-s-ink dark:text-s-dm-text" style={{ fontSize: "clamp(26px, 3.5vw, 44px)", letterSpacing: "-0.02em" }}>
            {t("categories.title")}
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {CATEGORIES.filter(c => c.key !== 'spa' || CLIENT_FEATURE_FLAGS.isMassageSpaEnabled).map(({ key, label, count, Icon, color, bg }) => (
            <Link key={key} href={persistedCity ? `/${locale}/${persistedCity}/${key}` : `/${locale}/${key}`}
              className="relative aspect-square rounded-[20px] bg-white dark:bg-s-dm-surface overflow-hidden group hover:scale-[1.03] hover:-rotate-1 transition-all duration-[250ms] flex flex-col items-center justify-center p-4 border border-s-ink/10 dark:border-s-dm-border"
              style={{ boxShadow: "0 1px 3px rgba(26,18,9,.05), 0 2px 8px rgba(26,18,9,.03)" }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors duration-300" style={{ backgroundColor: bg }}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
              <div className="font-display text-[18px] text-s-ink dark:text-s-dm-text leading-none text-center">
                {label}
              </div>
              <div className="text-[10px] font-heading font-semibold uppercase tracking-[.10em] text-s-ink/50 dark:text-s-dm-text/50 mt-1">
                {count} {t("categories.salonsCount")}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Discover Preview (Phase 3 Carousel) ─────────────────────────────────── */}
      <section className="max-w-base mx-auto px-0 py-8 md:py-12 overflow-hidden bg-s-bg-base/80 dark:bg-s-dm-bg">
        <div className="max-w-5xl mx-auto px-4 mb-2 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="block font-heading font-bold text-[11px] uppercase tracking-[.22em] text-s-amber mb-2">Entdecken</span>
            <h2 className="font-display text-s-ink dark:text-s-dm-text" style={{ fontSize: "clamp(32px, 5vw, 48px)", letterSpacing: "0.01em", lineHeight: "0.95" }}>
              FINDE DEINE<br /><span className="text-s-coral">INSPIRATION</span>
            </h2>
          </div>
          <Link href={`/${locale}/discover`}
            className="inline-flex items-center gap-2 text-sm font-heading font-bold text-s-ink dark:text-s-dm-text border border-s-ink/10 dark:border-s-dm-border px-6 py-3 rounded-btn hover:bg-s-ink hover:text-white dark:hover:bg-white dark:hover:text-s-ink transition-all shrink-0">
            Katalog öffnen →
          </Link>
        </div>
        
        {/* The new horizontal swiper component replaces the static subset */}
        <DiscoverCarousel locale={locale} />
      </section>

      {/* WeatherBanner removed — Phase 0.3 */}

      {/* ── Wieder buchen? (logged-in users with past booking) ───────────── */}
      {sections.rebook && lastBookedSalon && (
        <section className="max-w-5xl mx-auto px-4 pt-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
            className="flex items-center gap-4 p-4 rounded-[20px]"
            style={{ background: "var(--glass-bg-subtle)", backdropFilter: "blur(16px) saturate(1.2)",
                     WebkitBackdropFilter: "blur(16px) saturate(1.2)",
                     border: "1px solid var(--glass-border-subtle)",
                     boxShadow: "0 1px 3px rgba(26,18,9,.07), 0 2px 8px rgba(26,18,9,.05), var(--glass-shadow-inset)" }}>
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
              style={{ background: "rgba(232,98,74,.12)" }}>
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
      <section className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <span className="block font-heading font-bold text-[11px] uppercase tracking-[.22em] text-s-amber mb-2">
                {t("featured.eyebrow")}
              </span>
              <h2 className="font-heading font-extrabold text-s-ink dark:text-s-dm-text"
                style={{ fontSize: "clamp(26px, 3.5vw, 44px)", letterSpacing: "-0.02em" }}>
                {t("featured.title")}
              </h2>
              <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 mt-1 font-body">
                {t("featured.subtitle")}
              </p>
            </div>
            <Link
              href={`/${locale}/coiffeur`}
              className="text-sm font-body text-s-ink/60 border border-s-ink/10 px-4 py-2 rounded-btn hover:border-s-ink/20 hover:text-s-ink transition-all shrink-0 ml-4"
              aria-label={t("featured.viewAll")}>
              {t("featured.viewAll")} →
            </Link>
          </div>

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
            <div
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible md:snap-none md:mx-0 md:px-0 md:pb-0"
              style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
            >
              {salons.map((salon) => (
                <div
                  key={salon.id}
                  className="snap-start shrink-0 w-[280px] sm:w-[300px] md:w-auto md:shrink"
                >
                  <SalonCard
                    salon={salon}
                    locale={locale}
                    showAvailability
                    showDistance
                    isFavorited={favoriteIds.has(salon.id)}
                    onFavoriteToggle={handleFavoriteToggle}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      )}

      {/* ── Deals ────────────────────────────────────────── */}
      {sections.last_minute && (
      <section id="tour-last-minute" className="py-16 md:py-24 overflow-hidden relative"
        style={{ background: "#4A1E3C" }}>
        {/* Deco blobs on dark */}
        <div className="absolute w-[360px] h-[360px] rounded-full right-[-80px] top-[-80px] pointer-events-none"
          style={{ background: "rgba(232,98,74,.14)" }} />
        <div className="absolute w-[240px] h-[240px] rounded-full left-[-50px] bottom-[-50px] pointer-events-none"
          style={{ background: "rgba(107,163,200,.08)" }} />
        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <div className="flex items-end justify-between mb-7 flex-wrap gap-3">
            <div>
              <span className="block font-heading font-bold text-[11px] uppercase tracking-[.22em] mb-2"
                style={{ color: "#F2C144" }}>Deals</span>
              <h2 className="font-heading font-extrabold text-white"
                style={{ fontSize: "clamp(26px, 3.5vw, 44px)", letterSpacing: "-0.02em" }}>
                Aktuelle Deals
              </h2>
            </div>
            <Link href={`/${locale}/deals`}
              className="text-sm font-body text-white/60 border border-white/20 px-4 py-2 rounded-btn hover:border-white/40 hover:text-white transition-all"
              aria-label="Alle ansehen">
              Alle ansehen →
            </Link>
          </div>

          {lastMinuteSlots.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              className="rounded-card bg-white/[0.08] border border-white/[0.12] px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center gap-6"
            >
              <div className="flex-1">
                <p className="text-sm text-white/60 font-body">
                  {t("lastMinute.emptyMessage")}
                </p>
              </div>
              <Link href={`/${locale}/deals`} className="shrink-0">
                <InteractiveHoverButton
                  text="Angebote entdecken"
                  className="w-44 border-white/20"
                />
              </Link>
            </motion.div>
          )}
        </div>
      </section>
      )}

      {/* ── Trending Section ────────────────────────────────────────────────── */}
      {sections.trending && trendingSalons.length > 0 && (
        <section className="py-16 md:py-24">
          <div className="max-w-5xl mx-auto px-4">
            <div className="mb-6">
              <span className="block font-heading font-bold text-[11px] uppercase tracking-[.22em] text-s-amber mb-2">
                {t("trending.eyebrow")}
              </span>
              <h2 className="font-heading font-extrabold text-s-ink dark:text-s-dm-text"
                style={{ fontSize: "clamp(26px, 3.5vw, 44px)", letterSpacing: "-0.02em" }}>
                {t("trending.title")}
              </h2>
              <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 font-body mt-1">
                {t("trending.subtitle")}
              </p>
            </div>

            <div
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible md:snap-none md:mx-0 md:px-0 md:pb-0"
              style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
            >
              {trendingSalons.map((salon) => (
                <div key={salon.id} className="snap-start shrink-0 w-[280px] sm:w-[300px] md:w-auto md:shrink">
                  <SalonCard salon={salon} locale={locale} isFavorited={favoriteIds.has(salon.id)} onFavoriteToggle={handleFavoriteToggle} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Near You Section ────────────────────────────────────────────────── */}
      {sections.nearby && (showNearby || nearbySalons.length > 0) && (
        <section className="py-16 md:py-24">
          <div className="max-w-5xl mx-auto px-4">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <span className="block font-heading font-bold text-[11px] uppercase tracking-[.22em] text-s-amber mb-2">
                  {t("nearby.eyebrow")}
                </span>
                <h2 className="font-heading font-extrabold text-s-ink dark:text-s-dm-text"
                  style={{ fontSize: "clamp(26px, 3.5vw, 44px)", letterSpacing: "-0.02em" }}>
                  {t("nearby.title")}
                </h2>
                <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 font-body mt-1">
                  {t("nearby.subtitle")}
                </p>
              </div>
              {nearbySalons.length > 0 && (
                <Link href={`/${locale}/coiffeur`} className="text-sm font-body text-s-ink/60 border border-s-ink/10 px-4 py-2 rounded-btn hover:border-s-ink/20 hover:text-s-ink transition-all shrink-0 ml-4" aria-label={t("nearby.viewAll")}>
                  {t("nearby.viewAll")} →
                </Link>
              )}
            </div>

            <div
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible md:snap-none md:mx-0 md:px-0 md:pb-0"
              style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
            >
              {nearbySalons.map((salon) => (
                <div key={salon.id} className="snap-start shrink-0 w-[280px] sm:w-[300px] md:w-auto md:shrink">
                  <SalonCard salon={salon} locale={locale} showDistance isFavorited={favoriteIds.has(salon.id)} onFavoriteToggle={handleFavoriteToggle} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Map Preview Section (Phase 3) ──────────────────────────────────── */}
      <section className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4">
          <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="block font-heading font-bold text-[11px] uppercase tracking-[.22em] text-s-amber mb-2">
                In deiner Nähe
              </span>
              <h2 className="font-heading font-extrabold text-s-ink dark:text-s-dm-text"
                style={{ fontSize: "clamp(26px, 3.5vw, 44px)", letterSpacing: "-0.02em" }}>
                SALONS AUF DER KARTE
              </h2>
            </div>
            <Link href={`/${locale}/search?view=map${persistedCity ? `&city=${persistedCity}` : ''}`}
              className="inline-flex items-center gap-2 text-sm font-heading font-bold text-s-ink dark:text-s-dm-text border border-s-ink/10 dark:border-s-dm-border px-6 py-3 rounded-btn hover:bg-s-ink hover:text-white dark:hover:bg-white dark:hover:text-s-ink transition-all shrink-0">
              Karte öffnen →
            </Link>
          </div>

          <Link href={`/${locale}/search?view=map${persistedCity ? `&city=${persistedCity}` : ''}`} className="block group">
            <div className="relative w-full h-[300px] md:h-[400px] rounded-[24px] overflow-hidden bg-s-bg-base/30 dark:bg-s-dm-surface/30 border border-s-ink/10 dark:border-s-dm-border shadow-warm-sm group-hover:shadow-warm-md transition-shadow">
              {/* Map abstract background */}
              <div className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxyZWN0IHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI2LCAxOCwgOSwgMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4=')]"></div>
              
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-s-bg-base/80 dark:to-s-dm-background/80" />
              
              {/* Floating map pins */}
              <div className="absolute top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-500 group-hover:-translate-y-2">
                <div className="w-10 h-10 rounded-full bg-white shadow-warm-md flex items-center justify-center border-2 border-s-coral text-s-coral">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3" fill="white"></circle></svg>
                </div>
              </div>

              <div className="absolute top-1/3 right-1/4 transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-500 delay-75 group-hover:-translate-y-2">
                <div className="w-8 h-8 rounded-full bg-s-coral shadow-coral-glow flex items-center justify-center text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3" fill="white"></circle></svg>
                </div>
              </div>

              <div className="absolute bottom-1/3 left-1/3 transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-500 delay-150 group-hover:-translate-y-2">
                <div className="w-10 h-10 rounded-full bg-white shadow-warm-md flex items-center justify-center border-2 border-s-ink text-s-ink">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3" fill="white"></circle></svg>
                </div>
              </div>
              
              {/* Overlay CTA */}
              <div className="absolute bottom-6 inset-x-0 flex justify-center">
                <div className="px-6 py-3 rounded-full bg-white/90 backdrop-blur-sm border border-s-ink/10 shadow-warm-md text-s-ink font-heading font-bold text-xs tracking-wider uppercase flex items-center gap-2 group-hover:scale-105 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  Karte erkunden
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ── Review Carousel ──────────────────────────────────────────────── */}
      {sections.reviews && <ReviewCarousel />}

      {/* ── Neue Salons Section ─────────────────────────────────────────────── */}
      {sections.new_salons && newSalons.length > 0 && (
        <section className="py-16 md:py-24">
          <div className="max-w-5xl mx-auto px-4">
            <div className="mb-6">
              <span className="block font-heading font-bold text-[11px] uppercase tracking-[.22em] text-s-amber mb-2">
                {t("newSalons.eyebrow")}
              </span>
              <h2 className="font-heading font-extrabold text-s-ink dark:text-s-dm-text"
                style={{ fontSize: "clamp(26px, 3.5vw, 44px)", letterSpacing: "-0.02em" }}>
                {t("newSalons.title")}
              </h2>
              <p className="text-sm text-s-ink/50 mt-1 font-body">
                {t("newSalons.subtitle")}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {newSalons.map((salon) => (
                <SalonCard
                  key={salon.id}
                  salon={salon}
                  locale={locale}
                  isFavorited={favoriteIds.has(salon.id)}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Last-Minute section moved to after Beliebte Salons — Phase 0.3 */}



      {/* ── Partner Banner ─────────────────────────────────────────────────── */}
      {sections.partner_cta && (
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="rounded-[20px] overflow-hidden relative"
            style={{ background: "linear-gradient(135deg,#D4870A 0%,#E8624A 55%,#4A1E3C 100%)",
                     boxShadow: "0 24px 72px rgba(26,18,9,.18)" }}>
            {/* Inner blobs */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full pointer-events-none"
              style={{ background: "rgba(255,255,255,.12)", filter: "blur(60px)", transform: "translate(50%,-50%)" }} />
            <div className="relative z-10 p-8 sm:p-12 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="max-w-xl text-center md:text-left">
                <h2 className="font-heading font-bold text-white mb-4 leading-tight"
                  style={{ fontSize: "clamp(26px, 4vw, 52px)", letterSpacing: "-0.02em" }}>
                  {t("partner.title")}
                </h2>
                <p className="font-body italic text-white/70 text-lg leading-[1.82]">
                  {t("partner.subtitle")}
                </p>
              </div>
              <div className="shrink-0">
                <Link href={`/${locale}/partner`}
                  className="inline-flex items-center gap-2 px-10 py-4 rounded-pill bg-white text-s-ink font-heading font-bold text-sm uppercase tracking-[.04em] hover:bg-s-bg-base hover:-translate-y-px transition-all duration-150"
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
      <div className="px-4 pb-16">
        <div className="max-w-5xl mx-auto">
          <div className="flex gap-4 flex-wrap items-center px-5 py-4 rounded-[16px] bg-s-bg-base/50 dark:bg-s-dm-surface/50 backdrop-blur-[8px] border border-white/25 dark:border-white/10 shadow-warm-xs">
            {[
              { icon: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, label: t("trust.securePayment") },
              { icon: <span className="text-sm font-bold">CH</span>, label: t("trust.swissMade") },
              { icon: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>, label: t("trust.gdprCompliant") },
              { icon: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>, label: t("trust.freeCancellation") },
              { icon: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>, label: t("trust.paymentMethods") },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-xs text-s-ink/70 dark:text-s-dm-text/70">
                <div className="w-7 h-7 rounded-[8px] bg-white dark:bg-s-dm-surface border border-s-ink/08 dark:border-white/08 flex items-center justify-center text-s-ink/60 dark:text-s-dm-text/60 shadow-warm-xs shrink-0">{icon}</div>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sticky Mobile CTA ────────────────────────────────────────────── */}
      <StickyMobileCTA />

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <Footer />

      {/* ── Tutorial Tour (first-visit logged-in users) ─────────────────── */}
      <TutorialTour isLoggedIn={!!userName} />
    </div>
  );
}
