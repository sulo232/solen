"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import SalonCard from "@/components/SalonCard";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { MapPin, Scissors } from "lucide-react";
import { getCityName, type CitySlug } from "@/lib/cities";
import type { SalonCard as SalonCardType, SalonCategory } from "@/lib/types";
import Link from "next/link";

const CATEGORIES: SalonCategory[] = [
  "coiffeur",
  "barbershop",
  "nails",
  "spa",
  "makeup",
  "waxing",
];

interface CityPageProps {
  city: CitySlug;
  locale: string;
  initialCategory?: SalonCategory;
}

export default function CityPage({ city, locale, initialCategory = undefined }: CityPageProps) {
  const t = useTranslations("home.featured");
  const tCityPage = useTranslations("cityPage");
  const tNav = useTranslations("navigation");
  const [salons, setSalons] = useState<SalonCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<SalonCategory | null>(initialCategory || null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const cityName = getCityName(city, locale);

  const fetchSalons = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ city, limit: "24", sort: "rating" });
    if (activeCategory) params.set("category", activeCategory);

    fetch(`/api/salons?${params}`)
      .then((r) => r.json())
      .then((data) => setSalons(data.items ?? []))
      .catch(() => setSalons([]))
      .finally(() => setLoading(false));
  }, [city, activeCategory]);

  useEffect(() => { fetchSalons(); }, [fetchSalons]);

  // Fetch favorites
  useEffect(() => {
    fetch("/api/profile/favorites")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        const favs = data?.favorites ?? [];
        setFavoriteIds(new Set(favs.map((f: { salon_id: string }) => f.salon_id)));
      })
      .catch(() => {});
  }, []);

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
    <main className="min-h-screen bg-s-bg-base dark:bg-s-dm-bg">
      {/* City header */}
      <section className="max-w-5xl mx-auto px-4 pt-12 pb-8">
        <div className="flex items-center gap-2 mb-2">
          <MapPin size={16} className="text-s-coral" />
          <span className="font-heading font-bold text-[11px] uppercase tracking-[.20em] text-s-amber">
            {cityName}
          </span>
        </div>
        <h1 className="font-heading font-extrabold text-s-ink dark:text-s-dm-text"
          style={{ fontSize: "clamp(26px, 4vw, 48px)", letterSpacing: "-0.02em" }}>
          {tCityPage("title", { cityName })}
        </h1>
        <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 font-body mt-1">
          {tCityPage("subtitle")}
        </p>
      </section>

      {/* Category filter chips */}
      <section className="max-w-5xl mx-auto px-4 pb-6">
        <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
          <Link
            href={`/${locale}/${city}`}
            className={`shrink-0 flex items-center px-4 py-2 rounded-pill text-sm font-heading font-bold uppercase tracking-[.04em] transition-all duration-150 ${
              activeCategory === null
                ? "bg-s-coral text-white shadow-coral-glow"
                : "bg-[--raised] dark:bg-s-dm-surface border border-s-ink/10 dark:border-white/10 text-s-ink/70 dark:text-s-dm-text/70 hover:border-s-ink/20"
            }`}
          >
            {tCityPage("all_categories")}
          </Link>
          {CATEGORIES.map((key) => (
            <Link
              key={key}
              href={`/${locale}/${city}/${key}`}
              className={`shrink-0 flex items-center px-4 py-2 rounded-pill text-sm font-heading font-bold uppercase tracking-[.04em] transition-all duration-150 ${
                activeCategory === key
                  ? "bg-s-coral text-white shadow-coral-glow"
                  : "bg-[--raised] dark:bg-s-dm-surface border border-s-ink/10 dark:border-white/10 text-s-ink/70 dark:text-s-dm-text/70 hover:border-s-ink/20"
              }`}
            >
              {tNav(key)}
            </Link>
          ))}
        </div>
      </section>

      {/* Salon grid */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} variant="card" />)}
          </div>
        ) : salons.length === 0 ? (
          <EmptyState
            icon={Scissors}
            title={t("emptyTitle")}
            message={t("emptyMessage")}
          />
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
          >
            {salons.map((salon) => (
              <motion.div
                key={salon.id}
                variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
              >
                <SalonCard
                  salon={salon}
                  locale={locale}
                  isFavorited={favoriteIds.has(salon.id)}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>
    </main>
  );
}
