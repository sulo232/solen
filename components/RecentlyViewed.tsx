"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale } from "next-intl";
import { Clock } from "lucide-react";
import { motion } from "framer-motion";

interface RecentSalon {
  id: string;
  slug: string;
  name: string;
  cover_photo_url: string | null;
  average_rating: number;
  categories: string[];
  viewedAt: number;
}

const STORAGE_KEY = "solen_recently_viewed";
const MAX_ITEMS = 5;

/** Save a salon view to localStorage */
export function trackSalonView(salon: {
  id: string;
  slug: string;
  name: string;
  cover_photo_url?: string | null;
  average_rating?: number;
  categories?: string[];
}) {
  if (typeof window === "undefined") return;
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as RecentSalon[];
    const filtered = stored.filter((s) => s.id !== salon.id);
    const entry: RecentSalon = {
      id: salon.id,
      slug: salon.slug,
      name: salon.name,
      cover_photo_url: salon.cover_photo_url ?? null,
      average_rating: salon.average_rating ?? 0,
      categories: salon.categories ?? [],
      viewedAt: Date.now(),
    };
    const updated = [entry, ...filtered].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage full or unavailable — ignore
  }
}

export default function RecentlyViewed() {
  const locale = useLocale();
  const [salons, setSalons] = useState<RecentSalon[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as RecentSalon[];
      if (stored.length > 0) setSalons(stored);
    } catch {
      // ignore
    }
  }, []);

  // Don't render if no recently viewed salons
  if (salons.length === 0) return null;

  return (
    <section className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock size={18} className="text-teal" />
        <h2 className="font-heading font-semibold text-lg text-dark dark:text-dm-text">
          Zuletzt angesehen
        </h2>
      </div>

      <div
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4"
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
      >
        {salons.map((salon, i) => (
          <motion.div
            key={salon.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className="snap-start shrink-0"
          >
            <Link
              href={`/${locale}/salon/${salon.slug}`}
              className="block w-[160px] group"
            >
              <div className="relative w-[160px] h-[100px] rounded-xl overflow-hidden bg-gray-100 dark:bg-dm-surface mb-2">
                {salon.cover_photo_url ? (
                  <Image
                    src={salon.cover_photo_url}
                    alt={salon.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="160px"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-dark/10 dark:text-white/10 font-heading text-3xl">
                    {salon.name[0]}
                  </div>
                )}
              </div>
              <p className="text-sm font-medium text-dark dark:text-dm-text truncate group-hover:text-teal transition-colors">
                {salon.name}
              </p>
              {salon.average_rating > 0 && (
                <p className="text-xs text-dark/40 dark:text-dm-text/40 font-data">
                  ★ {salon.average_rating.toFixed(1)}
                </p>
              )}
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
