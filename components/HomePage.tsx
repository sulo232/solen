"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import SalonCard from "@/components/SalonCard";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import SearchBar from "@/components/ui/SearchBar";
import InteractiveHoverButton from "@/components/ui/interactive-hover-button";
import Footer from "@/components/layout/Footer";
import SocialProofStrip from "@/components/ui/SocialProofStrip";
import LastMinuteCard from "@/components/LastMinuteCard";
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
  { slug: "grossbasel",  name: "Grossbasel",  bg: "from-teal/40 to-teal/10"   },
  { slug: "kleinbasel",  name: "Kleinbasel",  bg: "from-coral/40 to-coral/10" },
  { slug: "gundeli",     name: "Gundeli",     bg: "from-teal/30 to-blue-200"  },
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

  useEffect(() => {
    fetch("/api/salons?limit=8&sort=rating")
      .then((r) => r.json())
      .then((data) => setSalons(data.items ?? []))
      .catch(() => setSalons([]))
      .finally(() => setLoading(false));

    fetch("/api/salons?sort=last_minute&limit=4")
      .then((r) => r.json())
      .then((data) => setLastMinuteSlots(data.items ?? []))
      .catch(() => setLastMinuteSlots([]));
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-teal/8 via-white to-orange-50/5 pt-24 pb-14">
        <motion.div
          className="max-w-4xl mx-auto text-center px-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            variants={fadeUp}
            className="font-heading font-bold text-3xl sm:text-5xl text-dark leading-tight"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Finde deinen Salon in Basel
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="mt-4 text-base sm:text-lg font-body text-dark/50"
            style={{ fontFamily: "DM Sans, sans-serif" }}
          >
            Coiffeur, Barbershop, Nails, Spa &amp; mehr
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8">
            <SearchBar />
          </motion.div>
        </motion.div>
      </section>

      {/* ── Social Proof ─────────────────────────────────────────────────── */}
      <SocialProofStrip />

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
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-100 hover:border-teal/40 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group"
              >
                <Icon
                  size={32}
                  className="text-teal group-hover:scale-110 transition-transform duration-200"
                />
                <span
                  className="font-heading font-medium text-dark text-sm text-center leading-tight"
                  style={{ fontFamily: "Syne, sans-serif" }}
                >
                  {label}
                </span>
                <span
                  className="text-xs text-dark/40 font-body"
                  style={{ fontFamily: "DM Sans, sans-serif" }}
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
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              Beliebte Salons
            </h2>
            <p
              className="text-sm text-dark/50 mt-1 font-body"
              style={{ fontFamily: "DM Sans, sans-serif" }}
            >
              Die bestbewerteten Salons in Basel
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
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
                  <SalonCard salon={salon} locale={locale} showAvailability showDistance />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Last-Minute Section ────────────────────────────────────────────── */}
      <section className="py-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={20} className="text-coral" />
              <h2
                className="font-heading font-bold text-2xl text-dark"
                style={{ fontFamily: "Syne, sans-serif" }}
              >
                Last-Minute Angebote
              </h2>
            </div>
            <p
              className="text-sm text-dark/60 font-body"
              style={{ fontFamily: "DM Sans, sans-serif" }}
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
              className="rounded-2xl bg-gradient-to-r from-coral/5 to-coral/10 border border-coral/20 px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center gap-5"
            >
              <div className="flex-1">
                <p
                  className="text-sm text-dark/60 font-body"
                  style={{ fontFamily: "DM Sans, sans-serif" }}
                >
                  Aktuell keine Last-Minute Angebote — schau bald wieder vorbei!
                </p>
              </div>
              <Link href={`/${locale}/last-minute`} className="shrink-0">
                <InteractiveHoverButton
                  text="Angebote ansehen"
                  className="w-44 border-teal/20"
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
                className="inline-block text-xs font-medium px-3 py-1 rounded-full mb-2 font-body bg-teal/[0.125] text-teal"
                style={{
                  fontFamily: "DM Sans, sans-serif",
                }}
              >
                DEIN QUARTIER
              </span>
              <h2
                className="font-heading font-bold text-2xl text-dark"
                style={{ fontFamily: "Syne, sans-serif" }}
              >
                Entdecke dein Quartier
              </h2>
            </div>
            <Link
              href={`/${locale}/coiffeur`}
              className="text-sm text-teal hover:underline font-body shrink-0 ml-4"
              style={{ fontFamily: "DM Sans, sans-serif" }}
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
            {QUARTIERS.map(({ slug, name, bg }) => (
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
                      style={{ fontFamily: "Syne, sans-serif" }}
                    >
                      {name}
                    </p>
                    <p
                      className="text-white/70 text-xs mt-0.5 font-body"
                      style={{ fontFamily: "DM Sans, sans-serif" }}
                    >
                      Bald hier
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <Footer />
    </div>
  );
}
