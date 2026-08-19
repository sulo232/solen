"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import SalonCard from "@/components-legacy/SalonCard";
import { SkeletonCard } from "@/app/[locale]/_components/primitives";
import EmptyState from "@/components-legacy/ui/EmptyState";
import { MapPin, Scissors, Heart } from "lucide-react";
import { getCityName, type CitySlug } from "@/lib/cities";
import type { SalonCard as SalonCardType, SalonCategory } from "@/lib/types";
import Link from "next/link";
import { toast } from "@/app/[locale]/_components/primitives/Toast";

const CATEGORIES: SalonCategory[] = [
  "coiffeur",
  "barbershop",
  "nails",
  "spa",
];

interface CityPageProps {
  city: CitySlug;
  locale: string;
  initialCategory?: SalonCategory;
  /** Resolved server-side (app/[locale]/[city]/page.tsx via getCityName + the live DB row) so a
   *  city outside the static CITIES fallback (e.g. Luzern) still shows its real localized name
   *  instead of falling back to the bare slug. Optional so existing direct callers keep working. */
  cityName?: string;
}

export default function CityPage({ city, locale, initialCategory = undefined, cityName: cityNameProp }: CityPageProps) {
  const t = useTranslations("home.featured") as any;
  const tCityPage = useTranslations("cityPage");
  const tNav = useTranslations("navigation");
  const tToast = useTranslations("toasts");
  const [salons, setSalons] = useState<SalonCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<SalonCategory | null>(initialCategory || null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const cityName = cityNameProp ?? getCityName(city, locale);

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
        // API returns { items: salon[], total } — items are keyed by `id`.
        const items = data?.items ?? [];
        setFavoriteIds(new Set(items.map((s: { id: string }) => s.id)));
      })
      .catch((err) => console.error("[CityPage] failed to fetch favorites:", err));
  }, []);

  const handleFavoriteToggle = useCallback((salonId: string) => {
    const wasSaved = favoriteIds.has(salonId);
    // Optimistic flip.
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (wasSaved) next.delete(salonId); else next.add(salonId);
      return next;
    });
    if (wasSaved) {
      fetch(`/api/profile/favorites?salon_id=${salonId}`, { method: "DELETE" })
        .then((r) => { if (!r.ok) throw new Error(`${r.status}`); })
        .catch((err) => {
          console.error("[CityPage] failed to remove favorite:", err);
          setFavoriteIds((p) => new Set(p).add(salonId)); // revert
          toast.error(tToast("saveFailed"), { action: { label: tToast("retry"), onClick: () => handleFavoriteToggle(salonId) } });
        });
    } else {
      fetch("/api/profile/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salon_id: salonId }),
      })
        .then((r) => { if (!r.ok) throw new Error(`${r.status}`); })
        .then(() => {
          toast.success(tToast("savedToFavorites"), {
            icon: Heart,
            iconClassName: "bg-s-love-soft text-[#FF3366]",
            action: { label: tToast("view"), onClick: () => { window.location.href = `/${locale}/profile/favorites`; } },
          });
        })
        .catch((err) => {
          console.error("[CityPage] failed to add favorite:", err);
          setFavoriteIds((p) => { const n = new Set(p); n.delete(salonId); return n; }); // revert
          toast.error(tToast("saveFailed"), { action: { label: tToast("retry"), onClick: () => handleFavoriteToggle(salonId) } });
        });
    }
  }, [favoriteIds, locale, tToast]);

  return (
    <main className="min-h-screen bg-white">
      {/* City header, V3-D263 (W4, 2026-05-27): s-amber to s-ink-2 (eyebrow per LOCKFILE §2); s-coral chip to TabPill ink-fill pattern.
          Caps removed 2026-07-26 (no-caps gate, project CLAUDE.md taste rule #10): normal case,
          12px, weight 600, tracking dropped (house replacement for a label that loses caps). */}
      {/* mockup-ok: saloncard-before-after/index.html, owner-approved 2026-07-26 */}
      <section className="max-w-5xl mx-auto px-4 pt-12 pb-8">
        <div className="flex items-center gap-2 mb-2">
          <MapPin size={16} strokeWidth={1.9} className="text-s-ink-2" />
          <span className="font-body text-[12px] font-semibold text-s-ink-2">
            {cityName}
          </span>
        </div>
        <h1 className="font-heading text-s-ink font-semibold"
          style={{ fontSize: "clamp(25px, 4vw, 40px)", letterSpacing: "-0.03em", lineHeight: 1 }}>
          {tCityPage("title", { cityName })}
        </h1>
        <p className="text-sm text-s-ink-2 font-body mt-1">
          {tCityPage("subtitle")}
        </p>
      </section>

      {/* Category filter chips, V3-D263: TabPill pattern (LOCKFILE §5): active = ink-fill + white, inactive = white + hairline.
          All-caps transform removed 2026-07-26 (no-caps gate, project CLAUDE.md taste rule #10):
          text-sm (14px) kept, the caps transform + tracking dropped, weight raised to 600 to
          hold legibility without it. Active-state fill color is a separate, pre-existing axis
          left untouched this pass (out of scope, caps-only change). */}
      {/* mockup-ok: saloncard-before-after/index.html, owner-approved 2026-07-26 */}
      <section className="max-w-5xl mx-auto px-4 pb-6">
        <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
          <Link
            href={`/${locale}/${city}`}
            className={`shrink-0 flex items-center px-4 py-2 rounded-pill text-sm font-heading font-semibold transition-[transform,filter,border-color,background-color] duration-150 ${
              activeCategory === null
                ? "bg-s-ink text-white"
                : "bg-white border border-s-border text-s-ink-2 hover:border-s-ink"
            }`}
          >
            {tCityPage("all_categories")}
          </Link>
          {CATEGORIES.map((key) => (
            <Link
              key={key}
              href={`/${locale}/${city}/${key}`}
              className={`shrink-0 flex items-center px-4 py-2 rounded-pill text-sm font-heading font-semibold transition-[transform,filter,border-color,background-color] duration-150 ${
                activeCategory === key
                  ? "bg-s-ink text-white"
                  : "bg-white border border-s-border text-s-ink-2 hover:border-s-ink"
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
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
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
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
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
