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
  Paintbrush,
  Droplets,
  Sparkles,
  Flame,
  ScissorsLineDashed,
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
import FeaturedSalonCarousel from "@/components/ui/FeaturedSalonCarousel";
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
// Category card data (A.2 — photo cards with skeleton-first)
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { key: "coiffeur",   label: "Coiffeur", LucideIcon: Scissors          },
  { key: "barbershop", label: "Barber",   LucideIcon: ScissorsLineDashed },
  { key: "nails",      label: "Nails",    LucideIcon: Paintbrush         },
  { key: "spa",        label: "Spa",      LucideIcon: Droplets           },
  { key: "makeup",     label: "Makeup",   LucideIcon: Sparkles           },
  { key: "waxing",     label: "Waxing",   LucideIcon: Flame              },
] as const;

// Drop a jpg into /public/images/categories/ to upgrade any card instantly
const CATEGORY_IMAGES: Record<string, string | null> = {
  coiffeur:   "/images/categories/coiffeur.jpg",
  barbershop: "/images/categories/barbershop.jpg",
  nails:      "/images/categories/nails.jpg",
  spa:        null,
  makeup:     null,
  waxing:     null,
};


// ─────────────────────────────────────────────────────────────────────────────
// CategoryPhotoCard (A.2 — skeleton-first photo card)
// ─────────────────────────────────────────────────────────────────────────────

type CategoryPhotoCardProps = {
  href: string;
  label: string;
  LucideIcon: React.ElementType;
  imgSrc: string | null;
  count: number;
  populated: boolean;
  animationIndex: number;
};

function CategoryPhotoCard({ href, label, LucideIcon, imgSrc, count, populated, animationIndex }: CategoryPhotoCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const showPopulatedState = populated && imgSrc && !imgError;

  return (
    <motion.div
      variants={categoryItemVariants}
      custom={animationIndex}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      style={{ flexShrink: 0, scrollSnapAlign: "start" }}
    >
      <Link
        href={href}
        style={{
          display: "block",
          width: "140px",
          borderRadius: "14px",
          overflow: "hidden",
          background: "#FFFFFF",
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "none",
          textDecoration: "none",
        }}
        className="active:scale-[0.97] active:opacity-85 transition-[transform,opacity] duration-[120ms] ease-out"
        aria-label={label}
      >
        {/* Photo area — 4:3 */}
        <div style={{ position: "relative", width: "140px", height: "105px", borderRadius: "14px 14px 0 0", overflow: "hidden" }}>
          {/* Skeleton gradient (always behind) */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(135deg, #EDE8E2 0%, #E3DDD6 100%)",
            }}
          />
          {/* Shimmer overlay — 2 cycles then stops */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: "linear-gradient(90deg, transparent 0%, rgba(245,240,235,0.7) 40%, transparent 80%)",
              backgroundSize: "200% 100%",
              animation: "skeletonShimmer 1.8s ease-in-out 2",
            }}
          />
          {/* Curated/dynamic image */}
          {showPopulatedState && (
            <img
              src={imgSrc!}
              alt={label}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: imgLoaded ? 1 : 0,
                transition: "opacity 300ms ease",
              }}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              loading={animationIndex < 2 ? "eager" : "lazy"}
            />
          )}
          {/* Category icon centered */}
          <div style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: showPopulatedState && imgLoaded ? 0 : 0.6,
            transition: "opacity 300ms ease",
          }}>
            <LucideIcon size={32} strokeWidth={1.5} color="#C4BBB2" />
          </div>
        </div>

        {/* Content area */}
        <div style={{ padding: "10px 12px 12px" }}>
          <p style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "14px", color: "#1A1A1A", margin: 0, lineHeight: 1.2 }}>
            {label}
          </p>
          <p style={{ fontFamily: "var(--font-body)", fontWeight: 400, fontSize: "12px", color: showPopulatedState ? "#8A8178" : "#B5AFA8", margin: "4px 0 0", lineHeight: 1.2 }}>
            {showPopulatedState
              ? (count === 1 ? "1 Salon" : `${count} Salons`)
              : "Bald verfügbar"}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

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
      <section className="relative overflow-hidden pt-14 sm:pt-20 pb-10 sm:pb-14 min-h-[500px] flex flex-col justify-end bg-[#F5F0EB] dark:bg-s-dm-bg">

        <div className="relative z-10 max-w-5xl mx-auto px-4 w-full mt-auto">
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="text-left">
            {/* Greeting / headline */}
            <motion.h1 variants={fadeUp}
              className="font-display uppercase text-s-ink dark:text-s-dm-text"
              style={{ fontSize: "clamp(42px, 5vw, 60px)", letterSpacing: "0.01em", lineHeight: "0.92" }}>
              {userName ? (
                <>{t("hero.hello")} <span className="text-s-coral">{userName}</span></>
              ) : (
                <>{t("hero.headlineWord1")}<span className="text-s-coral">.</span> {t("hero.headlineWord2")}<span className="text-s-coral">.</span></>
              )}
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="mt-3 font-body font-normal text-s-ink/50 dark:text-s-dm-text/50"
              style={{ fontSize: "17px" }}
            >
              {userName && nextBooking
                ? t("hero.nextBooking", { date: nextBooking.date, salon: nextBooking.salon })
                : t("hero.aiTagline")}
            </motion.p>
          </motion.div>

          {/* Guided search — Airbnb-style step-by-step discovery funnel */}
          <div className="mt-6 w-full max-w-2xl">
            <GuidedSearch categoryCounts={categoryCounts} />
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

      {/* ── Category Cards (A.2 — skeleton-first photo cards) ──────────────── */}
      <section id="tour-services" ref={categoryRef} className="pt-8 pb-6 relative z-[1]">
        <div className="max-w-5xl mx-auto">
          <span className="block font-body font-semibold text-[12px] uppercase mb-4 px-6" style={{ letterSpacing: "2.5px", color: "#E8735A" }}>
            {t("categories.label")}
          </span>

          {/* Horizontal scroll row */}
          <div
            className="flex overflow-x-auto gap-[14px] pb-1"
            style={{
              scrollSnapType: "x mandatory",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
              padding: "0 24px",
            }}
          >
            {CATEGORIES
              .filter(({ key }) => key !== 'spa' || CLIENT_FEATURE_FLAGS.isMassageSpaEnabled)
              .map(({ key, label, LucideIcon }, i) => {
                const href = persistedCity ? `/${locale}/${persistedCity}/${key}` : `/${locale}/${key}`;
                const imgSrc = CATEGORY_IMAGES[key];
                const count = categoryCounts[key] ?? 0;
                const hasPhoto = !!imgSrc; // file existence checked at runtime via onError
                const populated = hasPhoto || count > 0;

                return (
                  <CategoryPhotoCard
                    key={key}
                    href={href}
                    label={label}
                    LucideIcon={LucideIcon}
                    imgSrc={imgSrc}
                    count={count}
                    populated={populated}
                    animationIndex={i}
                  />
                );
              })}
          </div>
        </div>
      </section>

      {/* ── "BELIEBT IN DEINER NÄHE" salon carousel (A.3 — step 4) ─────────── */}
      <section className="pb-8 relative z-[1]">
        <FeaturedSalonCarousel salons={salons} locale={locale} />
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

      {/* ── Discover Preview — step 5 per A.6 ──────────────────────────────── */}
      {/* z-[2] + opaque bg blocks any bleed from category icons above (A.5) */}
      <section className="max-w-base mx-auto px-0 py-8 md:py-12 overflow-hidden relative z-[2]" style={{ background: "#F5F0EB" }}>
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
