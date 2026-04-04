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
    <div className="mt-8 -mx-4 group/section relative">
      <div className="flex items-center justify-between px-6 mb-5">
        <div className="flex items-center gap-1">
          <h2 className="font-heading font-semibold text-[22px] tracking-tight text-s-ink">
            {title || t("heroCarousel.label")}
          </h2>
          {viewAllHref && (
            <Link href={viewAllHref} className="ml-1 hover:bg-black/5 rounded-full p-1.5 transition-colors" aria-label={`View all ${title}`}>
              <ChevronRight size={18} className="text-s-ink" />
            </Link>
          )}
        </div>
        {/* Navigation Arrows — Airbnb spec: 32px white circle, light border, subtle shadow */}
        <div className="hidden md:flex items-center gap-2">
          <button onClick={() => scroll("left")} aria-label={t("carousel.previousSalons")} className="w-[32px] h-[32px] min-w-[44px] min-h-[44px] rounded-full border border-s-ink/[0.08] bg-white flex items-center justify-center text-s-ink hover:shadow-elevation-1 transition-shadow active:scale-95">
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <button onClick={() => scroll("right")} aria-label={t("carousel.nextSalons")} className="w-[32px] h-[32px] min-w-[44px] min-h-[44px] rounded-full border border-s-ink/[0.08] bg-white flex items-center justify-center text-s-ink hover:shadow-elevation-1 transition-shadow active:scale-95">
            <ChevronRight size={16} aria-hidden="true" />
          </button>
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

  const isGuestFavorite = salon.average_rating >= 4.9 && salon.review_count > 50;
  const isNew = salon.review_count === 0;

  const cardContent = (
    <>
      {/* ── Image (4:5 portrait) ── */}
      <div
        className="relative w-full aspect-[4/5] rounded-[12px] overflow-hidden bg-s-bg-sunken"
      >
        {photo ? (
          <Image
            src={photo}
            alt={salon.name}
            fill
            sizes="(max-width: 768px) 100vw, 320px"
            className="object-cover"
            priority={index < 2}
          />
        ) : (
          <ImageFallback category={salon.categories?.[0]} salonName={salon.name} className="absolute inset-0" />
        )}

        {/* Badge: top-left */}
        <div className="absolute top-3 left-3 z-[2]">
          {isGuestFavorite ? (
            <span className="flex items-center gap-1 font-heading font-semibold text-[13px] text-s-ink bg-white px-2 py-1 rounded-pill shadow-md">
              {t("heroCarousel.guestFavorite")}
            </span>
          ) : isNew ? (
            <span className="font-heading font-semibold text-[13px] text-white bg-s-ink px-2.5 py-1 rounded-pill shadow-md">
              {t("new")}
            </span>
          ) : null}
        </div>

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
            className="absolute top-2 right-2 z-[2] p-2 rounded-full bg-black/10 backdrop-blur-md flex items-center justify-center transition-[background-color] duration-200 hover:bg-black/20 shadow-sm"
            aria-pressed={isFavorited}
            aria-label={isFavorited ? t("removeFavorite") : t("addFavorite")}
            style={{ minWidth: "44px", minHeight: "44px" }}
          >
            <motion.div
              animate={heartBouncing ? { scale: [1, 1.3, 1] } : { scale: 1 }}
              transition={heartBouncing ? { type: "spring", stiffness: 400, damping: 15, duration: 0.4 } : { duration: 0 }}
            >
              <Heart
                className={`w-6 h-6 transition-colors duration-200 ${
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
      <div className="mt-3 flex flex-col gap-0.5">
        <h3 className="font-heading font-semibold text-[15px] text-s-ink truncate leading-6">
          {salon.name}
        </h3>
        <p className="font-body text-[15px] text-s-ink/60 leading-6 truncate">
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
              <Star className="inline w-[11px] h-[11px] fill-s-ink text-s-ink mb-[2px] mr-[3px]" />
              {salon.average_rating.toFixed(2)}
            </span>
          ) : null}
        </div>
      </div>
    </>
  );

  if (isDemo) {
    return (
      <div
        className="flex-shrink-0 snap-start select-none w-[180px] sm:w-[220px] lg:w-[260px]"
        aria-hidden="true"
      >
        {cardContent}
      </div>
    );
  }

  return (
    <Link
      href={`/${locale}/salon/${salon.slug}`}
      className="flex-shrink-0 snap-start group cursor-pointer w-[180px] sm:w-[220px] lg:w-[260px] hover:-translate-y-[5px] hover:shadow-elevation-3 transition-[transform,box-shadow] duration-200"
      aria-label={salon.name}
      prefetch={false}
    >
      {cardContent}
    </Link>
  );
}
