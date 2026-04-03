"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/format-currency";
import type { SalonCard } from "@/lib/types";
import { DEMO_SALONS } from "@/lib/demo-data";
import {
  EASE,
  DUR,
  blurFadeUp,
  slideInLeft,
  slideUp,
  staggerContainer,
  VIEWPORT,
  SPRING,
  imageParallax,
  categoryIconHover,
} from "@/lib/motion";

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
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = () => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    updateScrollState();
    return () => el.removeEventListener("scroll", updateScrollState);
  }, [salonsToShow]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const cardWidth = scrollRef.current.querySelector("[data-card]")?.clientWidth ?? 260;
    const gap = 16;
    const scrollAmount = (cardWidth + gap) * 2; // scroll 2 cards at a time
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <motion.div
      className="mt-8 -mx-4 group/section relative"
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={staggerContainer}
    >
      {/* Section header */}
      <motion.div
        variants={slideInLeft}
        className="flex items-center justify-between px-6 mb-5"
      >
        <motion.div
          initial="rest"
          whileHover="hover"
          variants={categoryIconHover}
          className="flex items-center gap-1 cursor-pointer"
        >
          <h2 className="font-heading font-semibold text-[22px] tracking-tight text-[#222222]">
            {title || t("heroCarousel.label")}
          </h2>
          {viewAllHref && (
            <Link href={viewAllHref} className="ml-1 hover:bg-black/5 rounded-full p-1.5 transition-colors" aria-label={`View all ${title}`}>
              <ChevronRight size={18} className="text-[#222222]" />
            </Link>
          )}
        </motion.div>

        {/* Navigation Arrows */}
        <div className="hidden md:flex items-center gap-2">
          <motion.button
            onClick={() => scroll("left")}
            aria-label={t("carousel.previousSalons")}
            className={`w-[32px] h-[32px] rounded-full border border-[#EBEBEB] bg-white flex items-center justify-center text-[#222222] transition-[box-shadow,opacity] duration-200 ${
              canScrollLeft ? "opacity-100 hover:shadow-[0_1px_3px_rgba(0,0,0,0.12)]" : "opacity-0 pointer-events-none"
            }`}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={SPRING.snappy}
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </motion.button>
          <motion.button
            onClick={() => scroll("right")}
            aria-label={t("carousel.nextSalons")}
            className={`w-[32px] h-[32px] rounded-full border border-[#EBEBEB] bg-white flex items-center justify-center text-[#222222] transition-[box-shadow,opacity] duration-200 ${
              canScrollRight ? "opacity-100 hover:shadow-[0_1px_3px_rgba(0,0,0,0.12)]" : "opacity-0 pointer-events-none"
            }`}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={SPRING.snappy}
          >
            <ChevronRight size={16} aria-hidden="true" />
          </motion.button>
        </div>
      </motion.div>

      {/* Horizontal scroll container with edge fade */}
      <div className="relative">
        {/* Left edge fade */}
        <div
          className={`absolute left-0 top-0 bottom-4 w-12 z-10 pointer-events-none transition-opacity duration-300 ${
            canScrollLeft ? "opacity-100" : "opacity-0"
          }`}
          style={{
            background: "linear-gradient(to right, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)",
          }}
        />
        {/* Right edge fade */}
        <div
          className={`absolute right-0 top-0 bottom-4 w-12 z-10 pointer-events-none transition-opacity duration-300 ${
            canScrollRight ? "opacity-100" : "opacity-0"
          }`}
          style={{
            background: "linear-gradient(to left, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)",
          }}
        />

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide px-6 pb-4 snap-x snap-mandatory"
          style={{ WebkitOverflowScrolling: "touch", overscrollBehaviorX: "contain" } as React.CSSProperties}
        >
          {salonsToShow.map((salon, index) => (
            <motion.div
              key={salon.id}
              variants={slideUp}
              data-card
              className="flex-shrink-0 snap-start"
            >
              <SalonHeroCard
                salon={salon}
                locale={locale}
                index={index}
                isFavorited={favoriteIds.has(salon.id)}
                onFavoriteToggle={useReal ? handleFavoriteToggle : undefined}
                isDemo={!useReal}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
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
  const tCommon = useTranslations("common");
  const photo = salon.cover_photo_url ?? salon.gallery_urls?.[0] ?? null;
  const showRating = (salon.review_count ?? 0) >= 3;
  const locationParts = [salon.quartier, salon.city_name ?? "Basel"].filter(Boolean);
  const locationText = locationParts.join(", ");

  const isGuestFavorite = salon.average_rating >= 4.9 && salon.review_count > 50;
  const isNew = salon.review_count === 0;

  const [heartBouncing, setHeartBouncing] = useState(false);
  const prevFavorited = useRef(isFavorited);

  useEffect(() => {
    if (isFavorited && !prevFavorited.current) {
      setHeartBouncing(true);
      const timer = setTimeout(() => setHeartBouncing(false), 500);
      return () => clearTimeout(timer);
    }
    prevFavorited.current = isFavorited;
  }, [isFavorited]);

  const cardContent = (
    <>
      {/* ── Image (4:5 portrait) ── */}
      <div className="relative w-full aspect-[4/5] rounded-[12px] overflow-hidden bg-s-bg-sunken">
        {photo && (
          <motion.div
            initial="initial"
            whileHover="animate"
            variants={imageParallax}
            className="relative w-full h-full"
          >
            <Image
              src={photo}
              alt={salon.name}
              fill
              sizes="(max-width: 768px) 100vw, 320px"
              className="object-cover transition-transform duration-500"
              style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
              priority={index < 2}
            />
          </motion.div>
        )}

        {/* Badge: top-left */}
        <div className="absolute top-3 left-3 z-[2]">
          {isGuestFavorite ? (
            <span className="flex items-center gap-1 font-heading font-semibold text-[13px] text-[#222222] bg-white px-2 py-1 rounded-pill shadow-md">
              {t("heroCarousel.guestFavorite")}
            </span>
          ) : isNew ? (
            <span className="font-heading font-semibold text-[13px] text-white bg-[#222222] px-2.5 py-1 rounded-pill shadow-md">
              {t("new")}
            </span>
          ) : null}
        </div>

        {/* Favorite heart: top-right */}
        {!isDemo && onFavoriteToggle && (
          <motion.button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFavoriteToggle(salon.id); }}
            className="absolute top-2 right-2 z-[2] p-2 rounded-full bg-black/10 backdrop-blur-md flex items-center justify-center shadow-sm"
            aria-label="Toggle Favorite"
            style={{ minWidth: "44px", minHeight: "44px" }}
            whileHover={{ scale: 1.1, backgroundColor: "rgba(0,0,0,0.2)" }}
            whileTap={{ scale: 0.9 }}
            transition={SPRING.snappy}
          >
            <Heart
              className={`w-6 h-6 transition-colors duration-200 ${
                isFavorited ? "fill-[#FF385C] stroke-[#FF385C]" : "fill-transparent stroke-white"
              }`}
              strokeWidth={2}
              style={{
                filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.45))",
                transform: heartBouncing ? "scale(1.3)" : "scale(1)",
                transition: "transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            />
          </motion.button>
        )}
      </div>

      {/* ── Text below image ── */}
      <div className="mt-3 flex flex-col gap-[2px]">
        <h3 className="font-heading font-semibold text-[15px] text-[#222222] truncate leading-[19px]">
          {salon.name}
        </h3>
        <p className="font-body text-[15px] text-[#717171] leading-[19px] truncate">
          {locationText}
        </p>
        <div className="flex items-center text-[15px] leading-[19px] mt-[2px]">
          {salon.min_price != null ? (() => {
            const currencyLocale = locale === "de" ? "de-CH" : locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : "en-GB";
            return (
              <span className="font-semibold text-[#222222]">
                {tCommon("fromPrice", { price: formatCurrency(salon.min_price, currencyLocale) })}
              </span>
            );
          })() : (
            <span className="font-semibold text-[#222222]">$$</span>
          )}
          {showRating ? (
            <span className="text-[#222222] font-medium ml-1">
              <span className="text-[#717171] font-normal mr-1">·</span>
              <Star className="inline w-[11px] h-[11px] fill-[#222222] text-[#222222] mb-[2px] mr-[3px]" />
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
        className="select-none w-[180px] sm:w-[220px] lg:w-[260px]"
        aria-hidden="true"
      >
        {cardContent}
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={SPRING.smooth}
      className="w-[180px] sm:w-[220px] lg:w-[260px]"
    >
      <Link
        href={`/${locale}/salon/${salon.slug}`}
        className="block cursor-pointer group"
        aria-label={salon.name}
        prefetch={false}
      >
        {cardContent}
      </Link>
    </motion.div>
  );
}
