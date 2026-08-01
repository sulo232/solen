"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "motion/react";
import ImageFallback from "@/components-legacy/ui/ImageFallback";
import { RatingStars } from "@/app/[locale]/_components/primitives";
import { safeCategory } from "@/app/[locale]/_components/salon/_shared";

interface RecentSalon {
  id: string;
  slug: string;
  name: string;
  cover_photo_url: string | null;
  average_rating: number;
  categories: string[];
  viewedAt: number;
  /** Single-category bridge (safeCategory) + photo alias, so this entry validates against
   *  the REAL homepage readers (RecentlyViewed.tsx / useRecentlyViewed.ts), which both key
   *  off `category` (singular) + `photoUrl`, not this file's own `categories[]` / `cover_photo_url`.
   *  Bug found + fixed 2026-08-01 (I4 dispatch): this file's STORAGE_KEY also didn't match the
   *  key either reader uses, so a real visit's write was invisible to both, silently, every time.
   *  See the STORAGE_KEY fix directly below for the other half of the same bug. */
  category: string;
  photoUrl: string | null;
}

// BUG FIX 2026-08-01 (I4 dispatch): was "solen_recently_viewed" (underscore), while BOTH real
// readers (app/[locale]/_components/homepage/RecentlyViewed.tsx and useRecentlyViewed.ts) read
// "solen.recently-viewed" (dot + hyphen). trackSalonView is the ONLY live call site touching this
// key (getRecentlyViewed + the default export below have zero importers, confirmed via
// `grep -rn "from \"@/components-legacy/RecentlyViewed\""`), so every real salon-page visit was
// writing to a key nothing ever read, a silent no-op: the homepage "Zuletzt angesehen" branch
// could never fire, it always fell back to "Top auf Solen" regardless of real view history.
const STORAGE_KEY = "solen.recently-viewed";
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
      // The two fields the real readers actually key off (see the interface comment above).
      category: safeCategory(salon.categories),
      photoUrl: salon.cover_photo_url ?? null,
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
      <div className="mb-4">
        <h2 className="font-heading text-s-ink" style={{ fontSize: 24 }}>
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
              className="block w-[180px] group"
            >
              {/* A3 LOCKED 2026-05-03: photos killed pre-launch — always Anton name on category color */}
              <div className="relative w-[180px] h-[120px] rounded-[12px] overflow-hidden mb-2">
                <ImageFallback salonName={salon.name} className="absolute inset-0" />
              </div>
              <p className="text-sm font-medium text-s-ink truncate group-hover:text-s-accent transition-colors">
                {salon.name}
              </p>
              {salon.average_rating > 0 && (
                <RatingStars value={salon.average_rating} size="sm" className="text-xs text-s-ink/40" />
              )}
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
