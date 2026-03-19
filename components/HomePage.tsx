"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import {
  Scissors,
  Sparkles,
  Droplets,
  Palette,
  Zap,
  Clock,
  RefreshCw,
} from "lucide-react";
import SalonCard from "@/components/SalonCard";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import SearchBar from "@/components/ui/SearchBar";
import InteractiveHoverButton from "@/components/ui/interactive-hover-button";
import Footer from "@/components/layout/Footer";
import SocialProofStrip from "@/components/ui/SocialProofStrip";
import StickyMobileCTA from "@/components/ui/StickyMobileCTA";
import LastMinuteCard from "@/components/LastMinuteCard";
import RecentlyViewed from "@/components/RecentlyViewed";
import WeatherBanner from "@/components/WeatherBanner";
import ReviewCarousel from "@/components/ReviewCarousel";
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
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
} as const;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Category grid data
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { key: "coiffeur",   label: "Coiffeur",    Icon: Scissors  },
  { key: "barbershop", label: "Barbershop",  Icon: Scissors  },
  { key: "nails",      label: "Nails",       Icon: Sparkles  },
  { key: "spa",        label: "Spa & Massage", Icon: Droplets },
  { key: "makeup",     label: "Makeup",      Icon: Palette   },
  { key: "waxing",     label: "Waxing",      Icon: Zap       },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Quartier section data
// ─────────────────────────────────────────────────────────────────────────────

const QUARTIERS = [
  { slug: "grossbasel",  name: "Grossbasel",  bg: "from-s-coral/40 to-s-coral/10"   },
  { slug: "kleinbasel",  name: "Kleinbasel",  bg: "from-s-coral/40 to-s-coral/10" },
  { slug: "gundeli",     name: "Gundeli",     bg: "from-s-coral/30 to-blue-200"  },
  { slug: "st_johann",   name: "St. Johann",  bg: "from-amber-300/40 to-amber-100/10" },
  { slug: "iselin",      name: "Iselin",      bg: "from-purple-300/40 to-purple-100/10" },
  { slug: "bruderholz",  name: "Bruderholz",  bg: "from-green-300/40 to-green-100/10" },
  { slug: "breite",      name: "Breite",      bg: "from-rose-300/40 to-rose-100/10" },
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
  const [userName, setUserName] = useState<string | null>(null);
  const [nextBooking, setNextBooking] = useState<{ date: string; salon: string } | null>(null);
  const [quartierCounts, setQuartierCounts] = useState<Record<string, number>>({});

  const fetchData = useCallback(() => {
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

    // Fetch quartier counts
    fetch("/api/salons/quartier-counts")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.counts) setQuartierCounts(data.counts);
      })
      .catch(() => {});
  }, []);

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
    <div className="min-h-screen bg-s-bg-base overflow-x-hidden">

      {/* ── Hero with background blobs ─────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        {/* Decorative blobs */}
        <div className="absolute -top-32 -right-32 w-[400px] h-[400px] rounded-full bg-s-coral/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-[300px] h-[300px] rounded-full bg-s-amber/10 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-s-blue/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.h1
              variants={fadeUp}
              className="font-display uppercase leading-none text-s-ink"
              style={{ fontSize: "clamp(56px, 8vw, 110px)", letterSpacing: "0.04em" }}
            >
              {userName ? (
                <>Willkommen{" "}<span className="text-s-coral">{userName}</span></>
              ) : (
                <>Beauty<span className="text-s-coral">.</span> Basel<span className="text-s-coral">.</span></>
              )}
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="mt-4 text-base sm:text-lg text-s-ink/60 font-body max-w-xl mx-auto"
            >
              {userName && nextBooking
                ? `Dein nächster Termin: ${nextBooking.date} bei ${nextBooking.salon}`
                : "Coiffeur, Barbershop, Nails, Spa & mehr — buche jetzt in deinem Quartier."
              }
            </motion.p>
            <motion.div variants={fadeUp} className="mt-8">
              <SearchBar />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Social Proof ─────────────────────────────────────────────────── */}
      <SocialProofStrip />

      {/* ── Weather Banner ─────────────────────────────────────────────── */}
      <WeatherBanner />

      {/* ── Wieder buchen? (logged-in users with past booking) ───────────── */}
      {lastBookedSalon && (
        <section className="max-w-5xl mx-auto px-4 pt-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="flex items-center gap-4 p-4 rounded-card bg-s-coral/5 border border-s-coral/15"
          >
            <div className="w-10 h-10 rounded-full bg-s-coral/10 flex items-center justify-center shrink-0">
              <RefreshCw size={18} className="text-s-coral" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-semibold text-dark text-sm">Wieder buchen?</p>
              <p className="text-xs text-dark/50 font-body truncate">
                Dein letzter Besuch: {lastBookedSalon.name}
              </p>
            </div>
            <Link
              href={`/${locale}/salon/${lastBookedSalon.slug}`}
              className="shrink-0 px-4 py-2 rounded-button bg-s-coral text-white text-sm font-medium hover:bg-s-coral/90 transition-colors"
            >
              Nochmal buchen
            </Link>
          </motion.div>
        </section>
      )}

      {/* ── Recently Viewed (returning users) ────────────────────────────── */}
      <RecentlyViewed />

      {/* ── Category Grid ──────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4"
        >
          {CATEGORIES.map(({ key, label, Icon }) => (
            <motion.div key={key} variants={itemVariants}>
              <Link
                href={`/${locale}/${key}`}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-100 hover:border-s-coral/40 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 active:scale-95 group"
              >
                <Icon
                  size={32}
                  className="text-s-coral group-hover:scale-110 transition-transform duration-200"
                />
                <span
                  className="font-heading font-medium text-dark text-sm text-center leading-tight"
                 
                >
                  {label}
                </span>
                <span
                  className="text-xs text-dark/40 font-body"
                 
                >
                  Entdecken
                </span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Featured Salons ────────────────────────────────────────────────── */}
      <section className="py-10 bg-gray-50/50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="mb-6">
            <h2
              className="font-heading font-bold text-2xl text-dark"
             
            >
              Beliebte Salons
            </h2>
            <p
              className="text-sm text-dark/50 mt-1 font-body"
             
            >
              Die bestbewerteten Salons in Basel
            </p>
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
                  className="snap-start shrink-0 w-[280px] sm:w-[300px] md:w-auto md:shrink transition-transform duration-200 hover:scale-[1.02]"
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

      {/* ── Review Carousel ──────────────────────────────────────────────── */}
      <ReviewCarousel />

      {/* ── Neue Salons Section ─────────────────────────────────────────────── */}
      {newSalons.length > 0 && (
        <section className="py-10 bg-gray-50/50">
          <div className="max-w-5xl mx-auto px-4">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={20} className="text-s-coral" />
                <h2 className="font-heading font-bold text-2xl text-dark">
                  Neue Salons
                </h2>
              </div>
              <p className="text-sm text-dark/50 font-body">
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

      {/* ── Last-Minute Section ────────────────────────────────────────────── */}
      <section className="py-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={20} className="text-s-coral" />
              <h2
                className="font-heading font-bold text-2xl text-dark"
               
              >
                Last-Minute Angebote
              </h2>
            </div>
            <p
              className="text-sm text-dark/60 font-body"
             
            >
              Spare bis zu 50% auf kurzfristige Termine
            </p>
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
              className="rounded-2xl bg-gradient-to-r from-s-coral/5 to-s-coral/10 border border-s-coral/20 px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center gap-5"
            >
              <div className="flex-1">
                <p
                  className="text-sm text-dark/60 font-body"
                 
                >
                  Aktuell keine Last-Minute Angebote — schau bald wieder vorbei!
                </p>
              </div>
              <Link href={`/${locale}/last-minute`} className="shrink-0">
                <InteractiveHoverButton
                  text="Angebote ansehen"
                  className="w-44 border-s-coral/20"
                />
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* ── Quartier Section ───────────────────────────────────────────────── */}
      <section className="py-10 bg-gray-50/50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <span
                className="inline-block text-xs font-medium px-3 py-1 rounded-full mb-2 font-body bg-s-coral/[0.125] text-s-coral"
              >
                DEIN QUARTIER
              </span>
              <h2
                className="font-heading font-bold text-2xl text-dark"
               
              >
                Entdecke dein Quartier
              </h2>
            </div>
            <Link
              href={`/${locale}/coiffeur`}
              className="text-sm text-s-coral hover:underline font-body shrink-0 ml-4"
             
            >
              Alle ansehen →
            </Link>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4"
            style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
          >
            {QUARTIERS.map(({ slug, name, bg }) => {
              const count = quartierCounts[slug] ?? 0;
              return (
                <motion.div
                  key={slug}
                  variants={itemVariants}
                  className="snap-start shrink-0"
                >
                  <Link
                    href={`/${locale}/coiffeur?quartier=${slug}`}
                    className="block w-[200px] h-[250px] rounded-2xl overflow-hidden relative group"
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${bg}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark/70 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <p
                        className="font-heading font-bold text-white text-base leading-tight"
                       
                      >
                        {name}
                      </p>
                      <p
                        className="text-white/70 text-xs mt-0.5 font-body"
                       
                      >
                        {count > 0
                          ? `${count} ${count === 1 ? "Salon" : "Salons"}`
                          : "Bald hier"
                        }
                      </p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── Sticky Mobile CTA ────────────────────────────────────────────── */}
      <StickyMobileCTA />

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <Footer />
    </div>
  );
}
