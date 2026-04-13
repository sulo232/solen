"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Heart, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
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
  const tCommon = useTranslations("common");

  const salonsWithPhotos = salons.filter(
    (s) => !!s.cover_photo_url || (s.gallery_urls && s.gallery_urls.length > 0)
  );
  const useReal = salonsWithPhotos.length >= 3;
  const salonsToShow = useReal ? salonsWithPhotos.slice(0, 8) : DEMO_SALONS;

  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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

  const updateScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", updateScrollButtons, { passive: true });
      updateScrollButtons();
      return () => el.removeEventListener("scroll", updateScrollButtons);
    }
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -340 : 340;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div className="relative group/carousel">
      {/* Scroll buttons */}
      <button
        onClick={() => scroll("left")}
        className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 bg-white rounded-full border border-[#E8E8E8] shadow-md flex items-center justify-center transition-all duration-200 ${
          canScrollLeft ? "opacity-100 hover:scale-105 hover:shadow-lg" : "opacity-0 pointer-events-none"
        }`}
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-5 h-5 text-[#101010]" />
      </button>
      
      <button
        onClick={() => scroll("right")}
        className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 bg-white rounded-full border border-[#E8E8E8] shadow-md flex items-center justify-center transition-all duration-200 ${
          canScrollRight ? "opacity-100 hover:scale-105 hover:shadow-lg" : "opacity-0 pointer-events-none"
        }`}
        aria-label="Scroll right"
      >
        <ChevronRight className="w-5 h-5 text-[#101010]" />
      </button>

      {/* Cards container */}
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory -mx-4 px-4"
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
      >
        {salonsToShow.map((salon, index) => (
          <SalonCard
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

// ── Salon Card ────────────────────────────────────────────────────────────────

interface SalonCardProps {
  salon: SalonCard;
  locale: string;
  index: number;
  isFavorited: boolean;
  onFavoriteToggle?: (salonId: string) => void;
  isDemo?: boolean;
}

function SalonCard({ salon, locale, index, isFavorited, onFavoriteToggle, isDemo }: SalonCardProps) {
  const t = useTranslations("home") as any;
  const tCommon = useTranslations("common");
  const [heartAnimating, setHeartAnimating] = useState(false);
  
  const photo = salon.cover_photo_url ?? salon.gallery_urls?.[0] ?? null;
  const showRating = (salon.review_count ?? 0) >= 3;
  const locationParts = [salon.quartier, salon.city_name ?? "Basel"].filter(Boolean);
  const locationText = locationParts.join(", ");

  // Badge logic
  const badge = (() => {
    if (salon.average_rating >= 4.9 && salon.review_count >= 5) return { text: "Excellent", type: "excellent" };
    if (salon.review_count > 50) return { text: "Popular", type: "popular" };
    if (salon.created_at) {
      const age = Date.now() - new Date(salon.created_at).getTime();
      if (age < 30 * 24 * 60 * 60 * 1000) return { text: "New", type: "new" };
    }
    if (salon.review_count === 0) return { text: "New", type: "new" };
    return null;
  })();

  const cardContent = (
    <div className="flex flex-col">
      {/* Image */}
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#F7F7F7]">
        {photo ? (
          <Image
            src={photo}
            alt={`${salon.name} — Salon in ${salon.quartier || "Basel"}`}
            fill
            sizes="(max-width: 768px) 280px, 320px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            priority={index < 2}
          />
        ) : (
          <ImageFallback category={salon.categories?.[0]} salonName={salon.name} className="absolute inset-0" />
        )}

        {/* Badge */}
        {badge && (
          <div className="absolute top-3 left-3">
            <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
              badge.type === "excellent" 
                ? "bg-[#101010] text-white" 
                : "bg-white/90 backdrop-blur-sm text-[#101010]"
            }`}>
              {badge.type === "excellent" && (
                <Star className="w-3 h-3 mr-1 fill-current" />
              )}
              {badge.text}
            </span>
          </div>
        )}

        {/* Favorite button */}
        {!isDemo && onFavoriteToggle && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onFavoriteToggle(salon.id);
              setHeartAnimating(true);
              setTimeout(() => setHeartAnimating(false), 400);
            }}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center transition-all duration-200 hover:bg-white hover:scale-110"
            aria-pressed={isFavorited}
            aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
          >
            <motion.div
              animate={heartAnimating ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <Heart
                className={`w-5 h-5 transition-colors duration-200 ${
                  isFavorited ? "fill-red-500 text-red-500" : "text-[#101010]"
                }`}
              />
            </motion.div>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="mt-3 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-[#101010] line-clamp-1">
            {salon.name}
          </h3>
          {showRating && (
            <div className="flex items-center gap-1 shrink-0">
              <Star className="w-4 h-4 fill-[#101010] text-[#101010]" />
              <span className="text-sm font-medium text-[#101010]">
                {(Math.round(salon.average_rating * 10) / 10).toFixed(1)}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 text-sm text-[#717171]">
          <MapPin className="w-3.5 h-3.5" />
          <span className="line-clamp-1">{locationText}</span>
        </div>

        {salon.min_price != null && (
          <p className="text-sm text-[#717171]">
            {tCommon("fromPrice", { price: formatCurrency(salon.min_price, locale === "de" ? "de-CH" : "en-GB") })}
          </p>
        )}
      </div>
    </div>
  );

  const baseClasses = "flex-shrink-0 w-[280px] md:w-[300px] snap-start group cursor-pointer";

  if (isDemo) {
    return (
      <div className={baseClasses} aria-hidden="true">
        {cardContent}
      </div>
    );
  }

  return (
    <Link
      href={`/${locale}/salon/${salon.slug}`}
      className={baseClasses}
      aria-label={salon.name}
      prefetch={false}
    >
      {cardContent}
    </Link>
  );
}
