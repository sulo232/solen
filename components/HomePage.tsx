"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
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
// WeatherBanner removed — doesn't contribute to conversion (Phase 0.3)
import ReviewCarousel from "@/components/ReviewCarousel";
import TutorialTour from "@/components/TutorialTour";
import type { SalonCard as SalonCardType, LastMinuteSlot } from "@/lib/types";


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

// ─────────────────────────────────────────────────────────────────────────────
// Category grid data
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { key: "coiffeur",   label: "COIFFEUR",   count: "42",  grad: "linear-gradient(145deg,#D4870A,#E8624A)" },
  { key: "barbershop", label: "BARBER",     count: "18",  grad: "linear-gradient(145deg,#4A1E3C,#6BA3C8)" },
  { key: "nails",      label: "NAILS",      count: "24",  grad: "linear-gradient(145deg,#E8624A,#F2C144)" },
  { key: "spa",        label: "SPA",        count: "11",  grad: "linear-gradient(145deg,#7BA688,#6BA3C8)" },
  { key: "makeup",     label: "MAKEUP",     count: "8",   grad: "linear-gradient(145deg,#C9A96E,#E8624A)" },
  { key: "waxing",     label: "WAXING",     count: "15",  grad: "linear-gradient(145deg,#4A1E3C,#7BA688)" },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Quartier section data
// ─────────────────────────────────────────────────────────────────────────────

const QUARTIERS = [
  { slug: "grossbasel",  name: "Grossbasel"  },
  { slug: "kleinbasel",  name: "Kleinbasel"  },
  { slug: "gundeli",     name: "Gundeli"     },
  { slug: "st_johann",   name: "St. Johann"  },
  { slug: "iselin",      name: "Iselin"      },
  { slug: "bruderholz",  name: "Bruderholz"  },
  { slug: "breite",      name: "Breite"      },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// HomePage component
// ─────────────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const locale = useLocale();
  const [salons, setSalons] = useState<SalonCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastMinuteSlots, setLastMinuteSlots] = useState<LastMinuteSlot[]>([]);
  const [lastBookedSalon, setLastBookedSalon] = useState<{ name: string; slug: string } | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [newSalons, setNewSalons] = useState<SalonCardType[]>([]);
  const [trendingSalons, setTrendingSalons] = useState<SalonCardType[]>([]);
  const [nearbySalons, setNearbySalons] = useState<SalonCardType[]>([]);
  const [locationError, setLocationError] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [nextBooking, setNextBooking] = useState<{ date: string; salon: string } | null>(null);
  const [quartierCounts, setQuartierCounts] = useState<Record<string, number>>({});
  const [sections, setSections] = useState<Record<string, boolean>>({
    quartier: true, trending: true, nearby: true, new_salons: true,
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

    // Fetch quartier counts
    fetch("/api/salons/quartier-counts")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.counts) setQuartierCounts(data.counts);
      })
      .catch(() => {});

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
        <div className="relative z-10 max-w-5xl mx-auto px-4 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-10 lg:gap-16 items-center">

            {/* LEFT: editorial text stack */}
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              {!userName && (
                <motion.span variants={fadeUp}
                  className="font-heading font-bold text-[11px] uppercase tracking-[.22em] text-s-amber block mb-3">
                  Von Basel, für Basel
                </motion.span>
              )}
              <motion.h1 variants={fadeUp}
                className="font-display uppercase text-s-ink dark:text-s-dm-text"
                style={{ fontSize: "clamp(64px, 9vw, 130px)", letterSpacing: "0.01em", lineHeight: "0.87" }}>
                {userName ? (
                  <>Hallo{" "}<span className="text-s-coral">{userName}</span></>
                ) : (
                  <>BEAUTY<span className="text-s-coral">.</span><br />BASEL<span className="text-s-coral">.</span></>
                )}
              </motion.h1>
              <motion.p variants={fadeUp}
                className="mt-5 font-body italic text-s-ink/60 dark:text-s-dm-text/60 leading-[1.82] max-w-md"
                style={{ fontSize: "17px" }}>
                {userName && nextBooking
                  ? `Dein nächster Termin: ${nextBooking.date} bei ${nextBooking.salon}`
                  : userName
                    ? "Willkommen zurück — was darf's heute sein?"
                    : "Coiffeur, Barber, Nails & Spa — buche jetzt in deinem Quartier."}
              </motion.p>

              {/* Hero CTAs — two pill buttons */}
              <motion.div variants={fadeUp} className="mt-8 flex gap-3 flex-wrap">
                <Link href={`/${locale}/search`}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-pill bg-s-coral text-white font-heading font-bold text-sm uppercase tracking-[.04em] shadow-coral-glow hover:bg-s-coral-hover hover:shadow-coral-glow-hover hover:-translate-y-px active:translate-y-px active:shadow-pressed transition-all duration-150">
                  <Search size={15} aria-hidden="true" /> Salon finden
                </Link>
                <Link href={`/${locale}/last-minute`}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-pill border-[1.5px] border-s-ink/20 dark:border-white/20 text-s-ink dark:text-s-dm-text font-heading font-bold text-sm uppercase tracking-[.04em] hover:bg-s-ink hover:text-white hover:shadow-warm-md hover:-translate-y-px transition-all duration-150">
                  Last Minute →
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
      <section id="tour-services" className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-6 text-center">
          <span className="font-heading font-bold text-[11px] uppercase tracking-[.20em] text-s-amber dark:text-s-amber block mb-1">
            KATEGORIEN
          </span>
          <h2 className="font-heading font-extrabold text-s-ink dark:text-s-dm-text" style={{ fontSize: "clamp(26px, 3.5vw, 44px)", letterSpacing: "-0.02em" }}>
            Was suchst du?
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {CATEGORIES.map(({ key, label, count, grad }) => (
            <Link key={key} href={`/${locale}/${key}`}
              className="relative aspect-square rounded-[20px] overflow-hidden group"
              style={{ boxShadow: "0 1px 3px rgba(26,18,9,.07), 0 2px 8px rgba(26,18,9,.05)" }}>
              <div className="absolute inset-0 transition-transform duration-[250ms] group-hover:scale-[1.04] group-hover:-rotate-1"
                style={{ background: grad }} />
              <div className="absolute inset-0 bg-gradient-to-t from-s-ink/60 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 p-3">
                <div className="font-display text-[22px] text-white leading-none">{label}</div>
                <div className="text-[10px] font-heading font-semibold uppercase tracking-[.10em] text-white/55 mt-0.5">{count} Salons</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* WeatherBanner removed — Phase 0.3 */}

      {/* ── Wieder buchen? (logged-in users with past booking) ───────────── */}
      {sections.rebook && lastBookedSalon && (
        <section className="max-w-5xl mx-auto px-4 pt-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
            className="flex items-center gap-4 p-4 rounded-[20px]"
            style={{ background: "rgba(255,255,255,.62)", backdropFilter: "blur(16px) saturate(1.2)",
                     WebkitBackdropFilter: "blur(16px) saturate(1.2)",
                     border: "1px solid rgba(255,255,255,.55)",
                     boxShadow: "0 1px 3px rgba(26,18,9,.07), 0 2px 8px rgba(26,18,9,.05), inset 0 1px 0 rgba(255,255,255,.70)" }}>
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
              style={{ background: "rgba(232,98,74,.12)" }}>
              <RefreshCw size={18} className="text-s-coral" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-bold text-s-ink dark:text-s-dm-text text-sm">Wieder buchen?</p>
              <p className="text-xs text-s-ink/50 font-body truncate">Dein letzter Besuch: {lastBookedSalon.name}</p>
            </div>
            <Link href={`/${locale}/salon/${lastBookedSalon.slug}`}
              className="shrink-0 px-4 py-2 rounded-pill bg-s-coral text-white text-xs font-heading font-bold uppercase tracking-[.04em]"
              style={{ boxShadow: "0 2px 4px rgba(232,98,74,.25), 0 4px 16px rgba(232,98,74,.15)" }}>
              Nochmal
            </Link>
          </motion.div>
        </section>
      )}

      {/* ── Recently Viewed (returning users) ────────────────────────────── */}
      <RecentlyViewed />

      {/* ── Featured Salons ────────────────────────────────────────────────── */}
      {sections.featured && (
      <section className="py-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <span className="block font-heading font-bold text-[11px] uppercase tracking-[.22em] text-s-amber mb-2">
                Beliebt in Basel
              </span>
              <h2 className="font-heading font-extrabold text-s-ink dark:text-s-dm-text"
                style={{ fontSize: "clamp(26px, 3.5vw, 44px)", letterSpacing: "-0.02em" }}>
                Beliebte Salons
              </h2>
              <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 mt-1 font-body">
                Die bestbewerteten Salons in Basel
              </p>
            </div>
            <Link
              href={`/${locale}/coiffeur`}
              className="text-sm text-s-coral hover:underline font-body shrink-0 ml-4"
            >
              Alle ansehen →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <Skeleton key={i} variant="card" />)}
            </div>
          ) : salons.length === 0 ? (
            <EmptyState
              icon={Scissors}
              title="Noch keine Salons"
              message="Bald verfügbar — schau später wieder vorbei!"
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

      {/* ── Last-Minute Angebote ────────────────────────────────────────── */}
      {sections.last_minute && (
      <section id="tour-last-minute" className="py-20 overflow-hidden relative"
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
                style={{ color: "#F2C144" }}>Last Minute</span>
              <h2 className="font-heading font-extrabold text-white"
                style={{ fontSize: "clamp(26px, 3.5vw, 44px)", letterSpacing: "-0.02em" }}>
                Spare bis zu 50%
              </h2>
            </div>
            <Link href={`/${locale}/last-minute`}
              className="text-white/60 border border-white/20 text-xs px-4 py-2 rounded-pill font-heading font-bold uppercase tracking-[.04em] hover:text-white hover:border-white/40 transition-all">
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
                  Aktuell keine Last-Minute Angebote — schau bald wieder vorbei!
                </p>
              </div>
              <Link href={`/${locale}/last-minute`} className="shrink-0">
                <InteractiveHoverButton
                  text="Angebote ansehen"
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
        <section className="py-12">
          <div className="max-w-5xl mx-auto px-4">
            <div className="mb-6">
              <span className="block font-heading font-bold text-[11px] uppercase tracking-[.22em] text-s-amber mb-2">
                Trending
              </span>
              <h2 className="font-heading font-extrabold text-s-ink dark:text-s-dm-text"
                style={{ fontSize: "clamp(26px, 3.5vw, 44px)", letterSpacing: "-0.02em" }}>
                Trending in Basel
              </h2>
              <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 font-body mt-1">
                Die aktuell angesagtesten Salons
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
        <section className="py-12">
          <div className="max-w-5xl mx-auto px-4">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <span className="block font-heading font-bold text-[11px] uppercase tracking-[.22em] text-s-amber mb-2">
                  Standort
                </span>
                <h2 className="font-heading font-extrabold text-s-ink dark:text-s-dm-text"
                  style={{ fontSize: "clamp(26px, 3.5vw, 44px)", letterSpacing: "-0.02em" }}>
                  In deiner Nähe
                </h2>
                <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 font-body mt-1">
                  Salons ganz in deiner Nähe entdecken
                </p>
              </div>
              {nearbySalons.length > 0 && (
                <Link href={`/${locale}/coiffeur`} className="text-sm text-s-coral hover:underline font-body shrink-0 ml-4">
                  Alle ansehen →
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

      {/* ── Review Carousel ──────────────────────────────────────────────── */}
      {sections.reviews && <ReviewCarousel />}

      {/* ── Neue Salons Section ─────────────────────────────────────────────── */}
      {sections.new_salons && newSalons.length > 0 && (
        <section className="py-12">
          <div className="max-w-5xl mx-auto px-4">
            <div className="mb-6">
              <span className="block font-heading font-bold text-[11px] uppercase tracking-[.22em] text-s-amber mb-2">
                Neu dabei
              </span>
              <h2 className="font-heading font-extrabold text-s-ink dark:text-s-dm-text"
                style={{ fontSize: "clamp(26px, 3.5vw, 44px)", letterSpacing: "-0.02em" }}>
                Neue Salons
              </h2>
              <p className="text-sm text-s-ink/50 mt-1 font-body">
                Frisch auf Solen — entdecke die neuesten Salons in Basel
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

      {/* ── Quartier Section (Dark) ─────────────────────────────────────── */}
      {sections.quartier && Object.values(quartierCounts).some(c => c > 0) && (
      <section className="py-20 overflow-hidden relative" style={{ background: "#1A1209" }}>
        <div className="absolute w-[400px] h-[400px] rounded-full right-[-80px] top-[-80px] pointer-events-none"
          style={{ background: "rgba(232,98,74,.08)" }} />
        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <span className="block font-heading font-bold text-[11px] uppercase tracking-[.22em] mb-3"
            style={{ color: "#F2C144" }}>Dein Quartier</span>
          <h2 className="font-display text-white mb-2"
            style={{ fontSize: "clamp(36px, 5vw, 64px)", lineHeight: "0.87", letterSpacing: "0.01em" }}>
            ENTDECKE<br /><span style={{ color: "#E8624A" }}>BASEL</span>
          </h2>
          <p className="font-body italic mb-10 max-w-sm text-[15px] leading-[1.82]"
            style={{ color: "rgba(245,238,228,.45)" }}>
            Salons direkt in deinem Quartier — von Kleinbasel bis Bruderholz.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {QUARTIERS.filter(q => (quartierCounts[q.slug] ?? 0) > 0).map(({ slug, name }, i) => (
              <Link key={slug} href={`/${locale}/coiffeur?quartier=${slug}`}
                className="relative rounded-[20px] p-5 overflow-hidden hover:-translate-y-[3px] hover:opacity-90 transition-all duration-[250ms] group"
                style={{ border: "1px solid rgba(255,255,255,.10)", background: "rgba(255,255,255,.06)" }}>
                <p className="font-heading font-bold text-white text-[15px] mb-0.5">{name}</p>
                <p className="text-xs" style={{ color: "rgba(245,238,228,.45)" }}>
                  {quartierCounts[slug]} {quartierCounts[slug] === 1 ? "Salon" : "Salons"}
                </p>
                <span className="font-display text-[72px] absolute right-[-8px] bottom-[-20px] leading-none select-none pointer-events-none"
                  style={{ color: "rgba(255,255,255,.05)" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      )}

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
                  Hast du einen Salon?
                </h2>
                <p className="font-body italic text-white/70 text-lg leading-[1.82]">
                  Bring dein Business auf das nächste Level — erreiche tausende Kund:innen in Basel.
                </p>
              </div>
              <div className="shrink-0">
                <Link href={`/${locale}/partner`}
                  className="inline-flex items-center gap-2 px-10 py-4 rounded-pill bg-white text-s-ink font-heading font-bold text-sm uppercase tracking-[.04em] hover:bg-s-bg-base hover:-translate-y-px transition-all duration-150"
                  style={{ boxShadow: "0 2px 4px rgba(26,18,9,.12), 0 4px 16px rgba(26,18,9,.10)" }}>
                  Partner werden →
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
              { icon: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, label: "Sichere Zahlung — Stripe verschlüsselt" },
              { icon: <span className="text-sm font-bold">CH</span>, label: "Swiss Made — Entwickelt in Basel" },
              { icon: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>, label: "nDSG konform" },
              { icon: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>, label: "Kostenlose Stornierung bis 24h" },
              { icon: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>, label: "TWINT · Kreditkarte · Bar" },
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
