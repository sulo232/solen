import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Heart, Award, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { toast } from "@/app/[locale]/_components/primitives/Toast";
import { formatQuartier } from "@/lib/basel-neighborhoods";
import { formatPrice } from "@/lib/format";
import type { SalonCard } from "@/lib/types";
import { DEMO_SALONS } from "@/lib/demo-data";
import ImageFallback from "@/components-legacy/ui/ImageFallback";

interface FeaturedSalonCarouselProps {
  salons: SalonCard[];
  locale: string;
  title?: string;
  viewAllHref?: string;
}

export default function FeaturedSalonCarousel({ salons, locale, title, viewAllHref }: FeaturedSalonCarouselProps) {
  const t = useTranslations("home") as any;
  const tToast = useTranslations("toasts");

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
        // API returns { items: salon[], total } — items keyed by `id`.
        const items = data?.items ?? [];
        setFavoriteIds(new Set(items.map((s: { id: string }) => s.id)));
      })
      .catch((err) => console.error("[FeaturedSalonCarousel] failed fetching favorites:", err));
  }, []);

  const handleFavoriteToggle = (salonId: string) => {
    const wasSaved = favoriteIds.has(salonId);
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (wasSaved) next.delete(salonId); else next.add(salonId);
      return next;
    });
    if (wasSaved) {
      fetch(`/api/profile/favorites?salon_id=${salonId}`, { method: "DELETE" })
        .then((r) => { if (!r.ok) throw new Error(`${r.status}`); })
        .catch((err) => {
          console.error("[FeaturedSalonCarousel] remove favorite failed:", err);
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
            action: { label: tToast("view"), onClick: () => { window.location.href = `/${locale}/profile/favorites`; } },
          });
        })
        .catch((err) => {
          console.error("[FeaturedSalonCarousel] add favorite failed:", err);
          setFavoriteIds((p) => { const n = new Set(p); n.delete(salonId); return n; }); // revert
          toast.error(tToast("saveFailed"), { action: { label: tToast("retry"), onClick: () => handleFavoriteToggle(salonId) } });
        });
    }
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
            <button onClick={() => scroll("left")} aria-label={t("carousel.previousSalons")} className="w-8 h-8 rounded-full border border-s-border bg-white flex items-center justify-center text-s-ink hover:bg-s-bg-sunken active:scale-[0.97] transition-[background-color,transform] duration-150">
              <ChevronLeft size={15} aria-hidden="true" />
            </button>
            <button onClick={() => scroll("right")} aria-label={t("carousel.nextSalons")} className="w-8 h-8 rounded-full border border-s-border bg-white flex items-center justify-center text-s-ink hover:bg-s-bg-sunken active:scale-[0.97] transition-[background-color,transform] duration-150">
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
  // A3 LOCKED 2026-05-03: photos killed pre-launch. Card cover always renders
  // solid category color + Anton uppercase salon name via ImageFallback.
  const showRating = (salon.review_count ?? 0) >= 3;
  const locationParts = [formatQuartier(salon.quartier), salon.city_name ?? "Basel"].filter(Boolean);
  const locationText = locationParts.join(", ");

  // DESIGN_SPEC §3.1: max 1 badge per card, only on 4.9+ rating OR 50+ reviews
  const badge = (() => {
    if (salon.average_rating >= 4.9 && salon.review_count >= 10)
      return { text: "Top bewertet", color: "#0A0A0A" };
    if (salon.review_count > 50)
      return { text: "Beliebt", color: "#1A8754" };
    return null;
  })();

  const cardContent = (
    <div className="">
      {/* ── Cover (1:1 SQUARE) — A3 LOCKED 2026-05-03: solid category color + Anton name only ── */}
      <div className="relative w-full aspect-square overflow-hidden rounded-[18px]">
        <ImageFallback category={salon.categories?.[0]} salonName={salon.name} className="absolute inset-0" />

        {/* Badge: top-left, max 1, frosted pill — DESIGN_SPEC 3.5 */}
        {badge && (
          <div className="absolute top-3 left-3 z-[2]">
            <span
              className="font-body font-semibold text-[12px] uppercase tracking-[0.5px] px-3 py-1 rounded-pill"
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
              {/* Heart save state uses --heart-active #FF3366 (HeartButton canon, V3-D103) */}
              <Heart
                className="w-[18px] h-[18px] transition-colors duration-200"
                style={isFavorited ? { fill: "#FF3366", color: "#FF3366" } : { fill: "transparent" }}
                strokeWidth={2}
              />
            </motion.div>
          </button>
        )}
      </div>

      {/* ── Content — no box, floats on page bg (SOLEN_DESIGN locked 2026-04-21) ── */}
      <div className="flex flex-col gap-1" style={{ padding: "12px 2px 0" }}>
        {/* Q26: Anton uppercase salon name + locked letter-spacing */}
        <h3 className="font-heading text-[15px] uppercase leading-[1.1] truncate text-s-ink" style={{ letterSpacing: "0.01em" }}>
          {salon.name}
        </h3>

        {/* Q43 + SOLEN_UI #5b: amber star (NOT coral); tabular-nums on rating + count */}
        {showRating && (
          <div className="flex items-center gap-1">
            <Star size={14} stroke="none" className="fill-s-star" aria-hidden />
            <span className="font-body font-semibold text-[14px] text-s-ink tabular-nums">
              {(Math.round(salon.average_rating * 10) / 10).toFixed(1)}
            </span>
            <span className="font-body text-[14px] text-s-ink-2 tabular-nums">
              ({salon.review_count ?? 0})
            </span>
          </div>
        )}

        {/* Location — Figtree 14px/400 */}
        <p className="font-body text-[14px] truncate text-s-ink-2">
          {locationText}
        </p>

        {/* Q43: tabular numerics + formatPrice (CHF prefix per spec) */}
        <p className="font-body text-[14px] text-s-ink-2 tabular-nums">
          {salon.min_price != null ? (() => {
            const currencyLocale = locale === "de" ? "de-CH" : locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : "en-GB";
            return tCommon("fromPrice", { price: formatPrice(salon.min_price, currencyLocale) });
          })() : "Ab CHF 45"}
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
