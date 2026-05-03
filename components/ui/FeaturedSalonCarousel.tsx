import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Heart, Award, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/format-currency";
import type { SalonCard } from "@/lib/types";
import { DEMO_SALONS } from "@/lib/demo-data";
import ImageFallback from "@/components/ui/ImageFallback";

interface FeaturedSalonCarouselProps {
  salons: SalonCard[];
  locale: string;
  title?: string;
  viewAllHref?: string;
}

export default function FeaturedSalonCarousel({ salons, locale, title, viewAllHref }: FeaturedSalonCarouselProps) {
  const t = useTranslations("home") as any;

  const salonsWithPhotos = salons.filter(
    (s) => !!s.cover_photo_url || (s.gallery_urls && s.gallery_urls.length > 0)
  );
  const useReal = salonsWithPhotos.length >= 3;
  // DEMO — shown when no real salon data exists yet
  const salonsToShow = useReal ? salonsWithPhotos.slice(0, 8) : DEMO_SALONS;

  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/profile/favorites")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        const favs = data?.favorites ?? [];
        setFavoriteIds(new Set(favs.map((f: { salon_id: string }) => f.salon_id)));
      })
      .catch((err) => console.error("[FeaturedSalonCarousel] failed fetching favorites:", err));
  }, []);

  const handleFavoriteToggle = (salonId: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(salonId)) {
        next.delete(salonId);
        fetch(`/api/profile/favorites?salon_id=${salonId}`, { method: "DELETE" }).catch(console.error);
      } else {
        next.add(salonId);
        fetch("/api/profile/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ salon_id: salonId }),
        }).catch(console.error);
      }
      return next;
    });
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div className="mt-10 -mx-4 group/section relative">
      <div className="flex items-end justify-between px-6 mb-5">
        {/* Title + subtitle — Pattern A: DM Sans 28px/700 */}
        <div>
          <h2 className="font-heading text-s-ink" style={{ fontSize: 22, lineHeight: 1.25 }}>
            {title || t("heroCarousel.label")}
          </h2>
          <p className="font-body mt-1 text-[14px] text-s-ink-secondary">
            {t("carousel.topRated") || "Top bewertet"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View all text link */}
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="font-body font-medium text-s-ink hover:underline transition-colors duration-150"
              style={{ fontSize: 14 }}
              aria-label={`Alle ${title} ansehen`}
            >
              {t("carousel.viewAll") || "Alle ansehen"} →
            </Link>
          )}
          {/* Nav arrows */}
          <div className="hidden md:flex items-center gap-1.5">
            <button onClick={() => scroll("left")} aria-label={t("carousel.previousSalons")} className="w-8 h-8 rounded-full border border-s-ink/[0.08] bg-white flex items-center justify-center text-s-ink hover:shadow-elevation-1 active:scale-[0.97] transition-[box-shadow,transform] duration-150">
              <ChevronLeft size={15} aria-hidden="true" />
            </button>
            <button onClick={() => scroll("right")} aria-label={t("carousel.nextSalons")} className="w-8 h-8 rounded-full border border-s-ink/[0.08] bg-white flex items-center justify-center text-s-ink hover:shadow-elevation-1 active:scale-[0.97] transition-[box-shadow,transform] duration-150">
              <ChevronRight size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal scroll container */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide px-6 pb-4 snap-x snap-mandatory"
        style={{ WebkitOverflowScrolling: "touch", overscrollBehaviorX: "contain" } as React.CSSProperties}
      >
        {salonsToShow.map((salon, index) => (
          <SalonHeroCard
            key={salon.id}
            salon={salon}
            locale={locale}
            index={index}
            isFavorited={favoriteIds.has(salon.id)}
            onFavoriteToggle={useReal ? handleFavoriteToggle : undefined}
            isDemo={!useReal}
          />
        ))}
      </div>
    </div>
  );
}

// ── Card ─────────────────────────────────────────────────────────────────────

interface SalonHeroCardProps {
  salon: SalonCard;
  locale: string;
  index: number;
  isFavorited: boolean;
  onFavoriteToggle?: (salonId: string) => void;
  isDemo?: boolean;
}

function SalonHeroCard({ salon, locale, index, isFavorited, onFavoriteToggle, isDemo }: SalonHeroCardProps) {
  const t = useTranslations("home") as any;
  const [heartBouncing, setHeartBouncing] = useState(false);
  const tCommon = useTranslations("common");
  const photo = salon.cover_photo_url ?? salon.gallery_urls?.[0] ?? null;
  const showRating = (salon.review_count ?? 0) >= 3;
  const locationParts = [salon.quartier, salon.city_name ?? "Basel"].filter(Boolean);
  const locationText = locationParts.join(", ");

  // DESIGN_SPEC §3.1: max 1 badge per card, only on 4.9+ rating OR 50+ reviews
  const badge = (() => {
    if (salon.average_rating >= 4.9 && salon.review_count >= 10)
      return { text: "Top bewertet", color: "#E8624A" };
    if (salon.review_count > 50)
      return { text: "Beliebt", color: "#1A8754" };
    return null;
  })();

  const cardContent = (
    <div className="">
      {/* ── Image (1:1 SQUARE — locked 2026-04-20, no box wrapper — text floats on page bg) ── */}
      <div className="relative w-full aspect-square overflow-hidden bg-s-bg-sunken rounded-[18px]">
        {photo ? (
          <Image
            src={photo}
            alt={`${salon.name} — Salon in ${salon.quartier || "Basel"}`}
            fill
            sizes="(max-width: 768px) 100vw, 320px"
            className="object-cover"
            style={{ objectPosition: "center top" }}
            priority={index < 2}
          />
        ) : (
          <ImageFallback category={salon.categories?.[0]} salonName={salon.name} className="absolute inset-0" />
        )}

        {/* Badge: top-left, max 1, frosted pill — DESIGN_SPEC 3.5 */}
        {badge && (
          <div className="absolute top-3 left-3 z-[2]">
            <span
              className="font-body font-semibold text-[11px] uppercase tracking-[0.5px] px-3 py-1 rounded-pill"
              style={{
                background: "rgba(255,255,255,0.9)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                color: badge.color,
              }}
            >
              {badge.text}
            </span>
          </div>
        )}

        {/* Heart: white circle — DESIGN_SPEC 3.1 */}
        {!isDemo && onFavoriteToggle && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onFavoriteToggle(salon.id);
              setHeartBouncing(true);
              setTimeout(() => setHeartBouncing(false), 500);
            }}
            className="absolute top-3 right-3 z-[2] rounded-full flex items-center justify-center shadow-elevation-1"
            style={{ width: 36, height: 36, minWidth: 44, minHeight: 44, background: "rgba(255,255,255,0.9)" }}
            aria-pressed={isFavorited}
            aria-label={isFavorited ? t("removeFavorite") : t("addFavorite")}
          >
            <motion.div
              animate={heartBouncing ? { scale: [1, 1.3, 1] } : { scale: 1 }}
              transition={heartBouncing ? { type: "spring", stiffness: 400, damping: 15, duration: 0.4 } : { duration: 0 }}
            >
              <Heart
                className={`w-[18px] h-[18px] transition-colors duration-200 ${
                  isFavorited ? "fill-s-coral stroke-s-coral" : "fill-transparent stroke-s-ink/30"
                }`}
                strokeWidth={2}
              />
            </motion.div>
          </button>
        )}
      </div>

      {/* ── Content — no box, floats on page bg (SOLEN_DESIGN locked 2026-04-21) ── */}
      <div className="flex flex-col gap-1" style={{ padding: "12px 2px 0" }}>
        {/* Name — Fraunces 15px/700 (serif heading, warm editorial) */}
        <h3 className="font-heading text-[15px] leading-[1.25] truncate text-s-ink">
          {salon.name}
        </h3>

        {/* Rating — coral star + score + count */}
        {showRating && (
          <div className="flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#E8624A" aria-hidden="true">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <span className="font-body font-semibold text-[14px] text-s-ink">
              {(Math.round(salon.average_rating * 10) / 10).toFixed(1)}
            </span>
            <span className="font-body text-[14px] text-s-ink-secondary">
              ({salon.review_count ?? 0})
            </span>
          </div>
        )}

        {/* Location — DM Sans 14px/400 */}
        <p className="font-body text-[14px] truncate text-s-ink-secondary">
          {locationText}
        </p>

        {/* Price — DM Sans 14px/400 */}
        <p className="font-body text-[14px] text-s-ink-secondary">
          {salon.min_price != null ? (() => {
            const currencyLocale = locale === "de" ? "de-CH" : locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : "en-GB";
            return tCommon("fromPrice", { price: formatCurrency(salon.min_price, currencyLocale) });
          })() : "Ab CHF 45.–"}
        </p>
      </div>
    </div>
  );

  if (isDemo) {
    return (
      <div
        className="flex-shrink-0 snap-start select-none w-[200px] md:w-[240px] lg:w-[260px]"
        aria-hidden="true"
      >
        {cardContent}
      </div>
    );
  }

  return (
    <Link
      href={`/${locale}/salon/${salon.slug}`}
      className="flex-shrink-0 snap-start group cursor-pointer w-[200px] md:w-[240px] lg:w-[260px] transition-transform duration-[250ms] ease-out-warm hover:-translate-y-[3px]"
      aria-label={salon.name}
      prefetch={false}
    >
      {cardContent}
    </Link>
  );
}
