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
          <h2 className="font-heading font-bold text-s-ink" style={{ fontSize: 24, lineHeight: 1.2 }}>
            {title || t("heroCarousel.label")}
          </h2>
          <p className="font-body mt-1" style={{ fontSize: 14, color: "rgba(26,18,9,0.55)" }}>
            <span style={{ color: "#E8624A" }}>{t("carousel.topRated") || "Top bewertet"}</span>
            <span style={{ color: "rgba(26,18,9,0.55)" }}> · Sofort buchbar</span>
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
            <button onClick={() => scroll("left")} aria-label={t("carousel.previousSalons")} className="w-8 h-8 rounded-full border border-s-ink/[0.08] bg-white flex items-center justify-center text-s-ink hover:shadow-elevation-1 active:scale-[0.95] transition-[box-shadow,transform] duration-150">
              <ChevronLeft size={15} aria-hidden="true" />
            </button>
            <button onClick={() => scroll("right")} aria-label={t("carousel.nextSalons")} className="w-8 h-8 rounded-full border border-s-ink/[0.08] bg-white flex items-center justify-center text-s-ink hover:shadow-elevation-1 active:scale-[0.95] transition-[box-shadow,transform] duration-150">
              <ChevronRight size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal scroll container */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide px-6 pb-4 snap-x snap-mandatory"
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

  // Dynamic badge from DB conditions (spec §12) — max 1 badge per card
  const badge = (() => {
    if (salon.average_rating >= 4.9 && salon.review_count >= 5)
      return { text: "★ Höchste Bewertung", color: "#E8624A" };
    if (salon.review_count > 50)
      return { text: "Beliebt", color: "#2C2420" };
    // "Neu" = created within last 30 days
    if (salon.created_at) {
      const age = Date.now() - new Date(salon.created_at).getTime();
      if (age < 30 * 24 * 60 * 60 * 1000) return { text: "Neu", color: "#2C2420" };
    }
    if (salon.review_count === 0) return { text: t("new"), color: "#2C2420" };
    return null;
  })();

  const cardContent = (
    <div
      className="rounded-[16px] overflow-hidden bg-white"
      style={{ boxShadow: "0 2px 12px rgba(44,36,32,0.08)" }}
    >
      {/* ── Image (200px fixed height) ── */}
      <div
        className="relative w-full overflow-hidden bg-s-bg-sunken"
        style={{ height: 200 }}
      >
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

        {/* Badge: top-left — dynamic from DB, glass pill */}
        {badge && (
          <div className="absolute top-3 left-3 z-[2]">
            <span
              className="font-heading font-semibold text-[11px] px-3 py-1 rounded-pill"
              style={{
                background: "rgba(255,255,255,0.92)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                color: badge.color,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)",
              }}
            >
              {badge.text}
            </span>
          </div>
        )}

        {/* Favorite heart: top-right — hidden on demo cards */}
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
            className="absolute top-2 right-2 z-[2] rounded-full flex items-center justify-center transition-[background-color] duration-200 hover:bg-black/30 shadow-sm"
            style={{ width: 36, height: 36, minWidth: 44, minHeight: 44, background: "rgba(0,0,0,0.25)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
            aria-pressed={isFavorited}
            aria-label={isFavorited ? t("removeFavorite") : t("addFavorite")}
          >
            <motion.div
              animate={heartBouncing ? { scale: [1, 1.3, 1] } : { scale: 1 }}
              transition={heartBouncing ? { type: "spring", stiffness: 400, damping: 15, duration: 0.4 } : { duration: 0 }}
            >
              <Heart
                className={`w-[18px] h-[18px] transition-colors duration-200 ${
                  isFavorited ? "fill-s-coral stroke-s-coral" : "fill-transparent stroke-white"
                }`}
                strokeWidth={2}
                style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.45))" }}
              />
            </motion.div>
          </button>
        )}
      </div>

      {/* ── Text below image ── */}
      <div style={{ padding: "12px 14px 14px" }} className="flex flex-col gap-0.5">
        <h3 className="font-body font-semibold text-[16px] text-s-ink truncate leading-6" style={{ color: "#2C2420" }}>
          {salon.name}
        </h3>
        <p className="font-body text-[13px] truncate" style={{ color: "#8C8279", lineHeight: 1.5 }}>
          {locationText}
        </p>
        <div className="flex items-center text-[15px] leading-6 mt-[2px]">
          {salon.min_price != null ? (() => {
            const currencyLocale = locale === "de" ? "de-CH" : locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : "en-GB";
            return (
              <span className="font-semibold text-s-ink">
                {tCommon("fromPrice", { price: formatCurrency(salon.min_price, currencyLocale) })}
              </span>
            );
          })() : (
            <span className="font-semibold text-s-ink">$$</span>
          )}
          {showRating ? (
            <span className="text-s-ink font-medium ml-1">
              <span className="text-s-ink/60 font-normal mr-1">·</span>
              {(Math.round(salon.average_rating * 10) / 10).toFixed(1)}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );

  if (isDemo) {
    return (
      <div
        className="flex-shrink-0 snap-start select-none w-[240px] md:w-[280px] lg:w-[300px]"
        aria-hidden="true"
      >
        {cardContent}
      </div>
    );
  }

  return (
    <Link
      href={`/${locale}/salon/${salon.slug}`}
      className="flex-shrink-0 snap-start group cursor-pointer w-[240px] md:w-[280px] lg:w-[300px] hover:-translate-y-1 transition-[transform,box-shadow] duration-200"
      style={{ ["--hover-shadow" as string]: "0 4px 20px rgba(44,36,32,0.12)" }}
      aria-label={salon.name}
      prefetch={false}
    >
      {cardContent}
    </Link>
  );
}
