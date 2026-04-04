"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Clock, Star } from "lucide-react";
import { motion } from "framer-motion";
import ImageFallback from "@/components/ui/ImageFallback";

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

/** Read recently viewed salons from localStorage — safe to call outside useEffect only with SSR guard */
export function getRecentlyViewed(): RecentSalon[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as RecentSalon[];
  } catch {
    return [];
  }
}

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
  const t = useTranslations("recentlyViewed") as any;
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
        <Clock size={18} className="text-s-coral" />
        <h2 className="font-heading font-semibold text-lg text-s-ink dark:text-s-dm-text">
          {t("title")}
        </h2>
      </div>

      <div
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4"
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
      >
        {salons.map((salon, i) => (
          <motion.div
            key={salon.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className="snap-start shrink-0"
          >
            <Link
              href={`/${locale}/salon/${salon.slug}`}
              className="block w-[140px] sm:w-[160px] group"
            >
              <div className="relative w-[140px] sm:w-[160px] h-[100px] rounded-[12px] overflow-hidden bg-s-bg-sunken dark:bg-s-dm-surface mb-2">
                {salon.cover_photo_url ? (
                  <Image
                    src={salon.cover_photo_url}
                    alt={salon.name}
                    fill
                    className="object-cover transition-none"
                    sizes="160px"
                  />
                ) : (
                  <ImageFallback salonName={salon.name} className="absolute inset-0" />
                )}
              </div>
              <p className="text-sm font-medium text-s-ink dark:text-s-dm-text truncate group-hover:text-s-coral transition-colors">
                {salon.name}
              </p>
              {salon.average_rating > 0 && (
                <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 data-text flex items-center gap-0.5">
                  <Star size={10} className="fill-s-coral text-s-coral" /> {salon.average_rating.toFixed(1)}
                </p>
              )}
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
