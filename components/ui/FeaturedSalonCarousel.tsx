import { useState, useEffect } from "react";
import Link from "next/link";
import { Star, Heart, Award } from "lucide-react";
import { useTranslations } from "next-intl";
import type { SalonCard } from "@/lib/types";
import { DEMO_SALONS } from "@/lib/demo-data";

interface FeaturedSalonCarouselProps {
  salons: SalonCard[];
  locale: string;
  title?: string;
}

export default function FeaturedSalonCarousel({ salons, locale, title }: FeaturedSalonCarouselProps) {
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

  return (
    <div className="mt-8 -mx-4">
      {/* Section label — always visible */}
      <h2
        className="px-6 mb-5 font-heading font-semibold text-[22px] tracking-tight text-[#222222] dark:text-white"
      >
        {title || t("heroCarousel.label")}
      </h2>

      {/* Horizontal scroll container */}
      <div
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
  const photo = salon.cover_photo_url ?? salon.gallery_urls?.[0] ?? null;
  const showRating = (salon.review_count ?? 0) >= 3;
  const locationParts = [salon.quartier, salon.city_name ?? "Basel"].filter(Boolean);
  const locationText = locationParts.join(", ");

  const isGuestFavorite = salon.average_rating >= 4.9 && salon.review_count > 50;
  const isNew = salon.review_count === 0;

  const cardContent = (
    <>
      {/* ── Image (1:1 square) ── */}
      <div
        className="relative w-full rounded-[12px] overflow-hidden bg-[#EDE8E2]"
        style={{ height: 180 }}
      >
        {photo && (
          <img
            src={photo}
            alt={salon.name}
            className="w-full h-full object-cover"
            loading={index < 2 ? "eager" : "lazy"}
          />
        )}

        {/* Badge: top-left */}
        <div className="absolute top-2 left-2 z-[2]">
          {isGuestFavorite ? (
            <span className="flex items-center gap-1 font-heading font-semibold text-[10px] text-s-ink bg-white/95 backdrop-blur-md px-2 py-1 rounded-pill shadow-sm uppercase tracking-wider">
              <Award size={10} className="text-s-coral" />{" "}
              {(t("heroCarousel.guestFavorite") as string).includes("heroCarousel") ? "Top bewertet" : t("heroCarousel.guestFavorite")}
            </span>
          ) : isNew ? (
            <span className="font-heading font-semibold text-[10px] text-white bg-s-coral px-2 py-1 rounded-pill shadow-sm">
              Neu
            </span>
          ) : null}
        </div>

        {/* Favorite heart: top-right — hidden on demo cards */}
        {!isDemo && onFavoriteToggle && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFavoriteToggle(salon.id); }}
            className="absolute top-2 right-2 z-[2] w-[28px] h-[28px] rounded-full bg-black/10 backdrop-blur-md flex items-center justify-center transition-all duration-200 hover:bg-black/20 hover:scale-110 active:scale-95 shadow-sm"
            aria-label="Toggle Favorite"
          >
            <Heart
              className={`w-[14px] h-[14px] transition-colors duration-200 ${
                isFavorited ? "fill-white text-white" : "text-white stroke-white"
              }`}
              strokeWidth={isFavorited ? 1 : 2}
            />
          </button>
        )}
      </div>

      {/* ── Text below image ── */}
      <div className="pt-2 pb-1">
        <p className="font-heading font-semibold text-[14px] text-[#222222] dark:text-white truncate leading-snug">
          {salon.name}
        </p>
        <p className="font-body text-[12px] text-[#717171] dark:text-s-dm-text/60 truncate mt-0.5">
          {locationText}
        </p>
        {showRating ? (
          <div className="flex items-center gap-1 mt-1">
            <Star size={11} className="fill-s-coral text-s-coral flex-shrink-0" />
            <span className="font-body text-[12px] text-[#717171] dark:text-s-dm-text/60">
              {salon.average_rating.toFixed(1)}
            </span>
            {salon.min_price != null && (
              <span className="font-body text-[12px] text-[#717171] dark:text-s-dm-text/60">
                {" · CHF "}{salon.min_price}
              </span>
            )}
          </div>
        ) : salon.min_price != null ? (
          <p className="font-body text-[12px] text-[#717171] dark:text-s-dm-text/60 mt-1">
            ab CHF {salon.min_price}
          </p>
        ) : null}
      </div>
    </>
  );

  if (isDemo) {
    return (
      <div
        className="flex-shrink-0 snap-start select-none"
        style={{ width: 180 }}
        aria-hidden="true"
      >
        {cardContent}
      </div>
    );
  }

  return (
    <Link
      href={`/${locale}/salon/${salon.slug}`}
      className="flex-shrink-0 snap-start group cursor-pointer hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(26,18,9,0.12)] transition-[transform,box-shadow] duration-[250ms]"
      style={{ width: 180 }}
      aria-label={salon.name}
      prefetch={false}
    >
      {cardContent}
    </Link>
  );
}
