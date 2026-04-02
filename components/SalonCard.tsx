"use client";

import { useRef, useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Star, MapPin, TrendingUp, Sparkles, ShieldCheck, Award, Heart, Crown,
  Flame, Zap, ThumbsUp, BadgeCheck, Trophy, Gem, Medal, Scissors,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";
import { getNeighborhood } from "@/lib/basel-neighborhoods";
import type { SalonCard as SalonCardType } from "@/lib/types";
import { useCompare } from "@/components/compare/CompareContext";
import SalonBadge from "@/components/ui/SalonBadge";

const BLUR_PLACEHOLDER = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOCIgaGVpZ2h0PSI1IiB2aWV3Qm94PSIwIDAgOCA1IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjUiIGZpbGw9IiNFOEU0REYiLz48L3N2Zz4=";

const BADGE_ICONS: Record<string, LucideIcon> = {
  Star, TrendingUp, Sparkles, ShieldCheck, Award, Heart, Crown,
  Flame, Zap, ThumbsUp, BadgeCheck, Trophy, Gem, Medal,
};

/* ── V5 Animation Variants — snappy native-app feel ────────────────── */
const cardReveal = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.22, ease: [0.2, 0.8, 0.2, 1] },
  },
};

interface SalonCardProps {
  salon: SalonCardType;
  variant?: "default" | "compact";
  locale?: string;
  showCompare?: boolean;
  showAvailability?: boolean;
  showDistance?: boolean;
  isFavorited?: boolean;
  onFavoriteToggle?: (salonId: string) => void;
  stampProgress?: { current: number; total: number } | null;
  solenTier?: "gold" | "coral" | "grey" | "dark" | null;
  availableToday?: number | null;
  availability?: {
    status: "available" | "unavailable" | "unknown";
    slotsToday?: number;
    nextDate?: string;
  };
  offPeakToday?: { discount_percent: number } | null;
  aiReason?: string;
  onQuickPreview?: () => void;
  animated?: boolean;
  photos?: string[];
}

const CAT_COLOURS: Record<string, { bg: string; text: string }> = {
  coiffeur:   { bg: "rgba(212,135,10,.12)",  text: "#7A4A00" },
  barbershop: { bg: "rgba(74,30,60,.12)",    text: "#4A1E3C" },
  nails:      { bg: "rgba(232,98,74,.12)",   text: "#7A2415" },
  spa:        { bg: "rgba(123,166,136,.15)", text: "#2A5438" },
  makeup:     { bg: "rgba(201,169,110,.14)", text: "#6B4005" },
  waxing:     { bg: "rgba(107,163,200,.15)", text: "#1A4D72" },
};

const CATEGORY_FALLBACK_GRADIENTS: Record<string, [string, string]> = {
  coiffeur:   ["rgba(212,135,10,0.10)",  "rgba(255,255,255,0.98)"],
  barbershop: ["rgba(74,30,60,0.08)",    "rgba(255,255,255,0.98)"],
  nails:      ["rgba(232,98,74,0.10)",   "rgba(255,255,255,0.98)"],
  spa:        ["rgba(123,166,136,0.14)", "rgba(255,255,255,0.98)"],
  makeup:     ["rgba(201,169,110,0.12)", "rgba(255,255,255,0.98)"],
  waxing:     ["rgba(107,163,200,0.12)", "rgba(255,255,255,0.98)"],
};

function getCategoryFallbackGradient(categories?: string[]): string {
  const cat = (categories?.[0] ?? "coiffeur").toLowerCase();
  const [from, to] = CATEGORY_FALLBACK_GRADIENTS[cat] ?? CATEGORY_FALLBACK_GRADIENTS.coiffeur;
  return `linear-gradient(135deg, ${from} 0%, ${to} 100%)`;
}


export default function SalonCard({ salon, variant = "default", locale = "de", showCompare = false, showAvailability, showDistance, isFavorited, onFavoriteToggle, stampProgress, solenTier, availableToday, availability, offPeakToday, aiReason, animated = true, photos }: SalonCardProps) {
  const t = useTranslations("salon") as any;
  const tCommon = useTranslations("common");
  const tEmpty = useTranslations("emptyStates");
  const router = useRouter();
  const prefetched = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const href = `/${locale}/salon/${salon.slug}`;
  const { toggleCompare, isInCompare } = useCompare();
  const compareSelected = isInCompare(salon.id);
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

  const [photoIndex, setPhotoIndex] = useState(0);
  const allPhotos = [salon.cover_photo_url, ...(salon.gallery_urls || []), ...(photos || [])].filter(Boolean) as string[];
  const hasMultiple = allPhotos.length > 1;
  const priceToShow = salon.min_price ?? salon.avg_price;

  /* ── Compact variant ─────────────────────────────────────────────── */
  if (variant === "compact") {
    return (
      <Link
        href={href}
        className="flex items-center gap-3 p-3 rounded-card bg-white border border-[#EBEBEB] group"
      >
        <div className="relative w-16 h-16 rounded-input overflow-hidden shrink-0 bg-s-bg-sunken img-hover-zoom">
          {salon.cover_photo_url && (
            <Image src={salon.cover_photo_url} alt={salon.name} fill sizes="64px" className="object-cover" />
          )}
        </div>
        <div className="min-w-0">
          <p className="font-heading font-medium text-sm text-[#222222] truncate group-hover:text-[#717171] transition-colors duration-200">{salon.name}</p>
          <p className="text-xs text-[#717171] font-body truncate">{salon.address}</p>
          {(salon.average_rating > 0 || salon.review_count > 0) ? (
            <div className="flex items-center gap-1 mt-0.5">
              <Star className="w-3 h-3 fill-[#222222] text-[#222222]" />
              <span className="text-xs text-[#717171]">{salon.average_rating.toFixed(1)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[10px] font-body font-medium text-[#222222] bg-[#F7F7F7] px-1.5 py-0.5 rounded-pill">{t("new")}</span>
            </div>
          )}
        </div>
      </Link>
    );
  }

  /* ── Default variant — V4 Clean Card ─────────────────────────────── */
  return (
    <motion.div
      variants={cardReveal}
      initial={animated ? "hidden" : false}
      animate="visible"
      className={`relative card-listing cursor-pointer group ${solenTier === "gold" ? "ring-2 ring-s-yellow/50" : ""}`}
      onMouseEnter={() => { if (!prefetched.current) { prefetched.current = true; router.prefetch(href); } }}
    >
      {/* Date-based availability overlay */}
      {availability?.status === "unavailable" && (
        <div className="absolute inset-0 bg-white/60 rounded-[inherit] z-10 pointer-events-none flex items-end p-3">
          <span className="text-xs font-body text-[#717171] pointer-events-auto">
            {availability.nextDate
              ? t("nextAvailable", { date: new Date(availability.nextDate).toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" }) })
              : t("noAvailability")}
          </span>
        </div>
      )}
      {availability?.status === "available" && (
        <span className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-pill bg-s-sage/90 text-white text-[10px] font-medium font-body">
          {t("availableToday")}
        </span>
      )}

      <Link href={href} className="block w-full h-full">
        {/* Cover photo — Roadmap 02: 4:3 landscape shows salon interiors better */}
        <div className="relative w-full aspect-[4/3] bg-s-bg-sunken overflow-hidden rounded-[12px] group/carousel img-hover-zoom gpu">
          {allPhotos.length > 0 ? (
            <div
              ref={scrollContainerRef}
              className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide"
              onScroll={(e) => {
                const el = e.currentTarget;
                const idx = Math.round(el.scrollLeft / el.clientWidth);
                if (idx !== photoIndex) setPhotoIndex(idx);
              }}
            >
              {allPhotos.map((photo, i) => (
                <div key={i} className="relative w-full h-full flex-none snap-center">
                  <Image
                    src={photo}
                    alt={`${salon.name} - Photo ${i + 1}`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    placeholder="blur"
                    blurDataURL={BLUR_PLACEHOLDER}
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-2"
              style={{ background: getCategoryFallbackGradient(salon.categories) }}
            >
              <Scissors className="w-10 h-10 text-s-ink/20" />
              <span className="text-xs font-body font-medium text-s-ink/25 uppercase tracking-wider">
                {salon.categories?.[0] || "Salon"}
              </span>
            </div>
          )}

          {/* Phase 2.1 — Priority badge system via SalonBadge */}
          <div className="absolute top-2 left-2 z-[2]">
            <SalonBadge
              salon={salon}
              availabilityStatus={availability?.status}
            />
          </div>

          {/* Category pills on photo — glass style kept here only if no badge? Let's just remove them as they clutter the image in Airbnb style. */}


          {/* Compare checkbox */}
          {showCompare && (
            <button
              type="button"
              aria-label={compareSelected ? "Aus Vergleich entfernen" : "Zum Vergleich hinzufügen"}
              aria-pressed={compareSelected}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleCompare(salon as any); }}
              className={[
                "absolute top-2 left-2 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-[background-color,border-color] duration-200 z-10",
                compareSelected
                  ? "bg-s-coral border-s-coral text-white scale-100"
                  : "bg-white/80 backdrop-blur-[6px] border-white/60 text-transparent hover:border-s-coral/50",
              ].join(" ")}
            >
              {compareSelected && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              )}
            </button>
          )}

          {/* Favorite bookmark — Airbnb style */}
          {onFavoriteToggle && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFavoriteToggle(salon.id); }}
              className="absolute top-3 right-3 z-10 transition-transform duration-200 hover:scale-105 active:scale-95 solen-press-effect"
              aria-label={isFavorited ? t("removeFromFavorites") : t("addToFavorites")}
            >
              <Heart
                className={`w-[26px] h-[26px] transition-colors duration-200 ${
                  isFavorited
                    ? "fill-[#FF385C] stroke-[#FF385C]"
                    : "fill-transparent stroke-white hover:fill-white/20"
                }`}
                strokeWidth={2}
                style={{
                  filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.45))",
                  transform: heartBouncing ? "scale(1.3)" : "scale(1)",
                  transition: "transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                }}
              />
            </button>
          )}

          {/* last_minute_discount badge is now handled by SalonBadge (Phase 2.1) */}

          {/* Availability badge */}
          {showAvailability && salon.next_available_slot && (
            <div className="absolute right-2" style={{ top: onFavoriteToggle ? (salon.last_minute_discount_percent > 0 ? "5rem" : "3rem") : (salon.last_minute_discount_percent > 0 ? "2rem" : "0.5rem") }}>
              <span className="px-2 py-0.5 rounded-pill bg-s-success text-white text-[10px] font-body font-medium">
                {t("availableToday")}
              </span>
            </div>
          )}

          {/* Photo carousel dot indicators — visible on hover (or mobile) */}
          {hasMultiple && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-[5px] z-10 opacity-100 md:opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200">
              {allPhotos.slice(0, 5).map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation();
                    scrollContainerRef.current?.scrollTo({ left: i * (scrollContainerRef.current.clientWidth || 0), behavior: 'smooth' });
                  }}
                  className={`rounded-full transition-all duration-200 ${i === photoIndex ? "w-[6px] h-[6px] bg-white" : "w-[6px] h-[6px] bg-white/60 hover:bg-white/90"}`}
                  aria-label={`Photo ${i + 1}`}
                />
              ))}
            </div>
          )}

          {/* Left/right arrows — desktop hover only */}
          {hasMultiple && photoIndex > 0 && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation();
                scrollContainerRef.current?.scrollTo({ left: (photoIndex - 1) * (scrollContainerRef.current.clientWidth || 0), behavior: 'smooth' });
              }}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 shadow-sm flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity z-[2] hover:bg-white hover:scale-105"
              aria-label="Previous photo"
            >
              <ChevronLeft size={14} />
            </button>
          )}
          {hasMultiple && photoIndex < Math.min(allPhotos.length - 1, 4) && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation();
                scrollContainerRef.current?.scrollTo({ left: (photoIndex + 1) * (scrollContainerRef.current.clientWidth || 0), behavior: 'smooth' });
              }}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 shadow-sm flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity z-[2] hover:bg-white hover:scale-105"
              aria-label="Next photo"
            >
              <ChevronRight size={14} />
            </button>
          )}
        </div>

        {/* ── Info Section — Roadmap 02 Typography Matrix ─────────────────────── */}
        <div className="mt-3 flex flex-col gap-[2px]">
          {/* Line 1: Name + Rating (right-aligned, Airbnb pattern) */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-heading font-semibold text-[#222222] text-[15px] leading-[19px] truncate">
              {salon.name}
            </h3>
            {salon.average_rating > 0 ? (
              <span className="shrink-0 flex items-center gap-0.5 text-[14px] font-semibold text-[#222222] leading-[19px]">
                <Star className="w-[11px] h-[11px] fill-[#E8624A] text-[#E8624A] mb-[1px]" />
                {salon.average_rating.toFixed(1)}
                <span className="text-[#6A6A6A] font-normal text-[13px]">({salon.review_count})</span>
              </span>
            ) : salon.review_count === 0 ? (
              <span className="shrink-0 text-[11px] font-heading font-bold text-white bg-[#222222] px-2 py-0.5 rounded-pill">
                Neu
              </span>
            ) : null}
          </div>

          {/* Line 2: Business type · Quartier (Phase 3.2 — type first, then location) */}
          <p className="text-[13px] text-[#6A6A6A] leading-[19px] truncate">
            {showDistance && salon.distance_km != null
              ? `${salon.quartier ?? getNeighborhood(salon.postal_code)} · ${salon.distance_km.toFixed(1)} km`
              : `${((c: string) => c.charAt(0).toUpperCase() + c.slice(1))(salon.categories?.[0] || "Salon")} · ${salon.quartier ?? getNeighborhood(salon.postal_code)}`}
          </p>

          {/* Line 3: Price (Phase 3.1) */}
          {priceToShow != null && (() => {
            const currencyLocale = locale === "de" ? "de-CH" : locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : "en-GB";
            return (
              <p className="text-[13px] text-[#6A6A6A] leading-[19px]">
                {tCommon("fromPrice", { price: formatCurrency(priceToShow, currencyLocale) })}
              </p>
            );
          })()}

          {/* Line 4: Nächster Termin (Phase 3.4) */}
          {salon.next_available_slot && (() => {
            const slot = new Date(salon.next_available_slot);
            const today = new Date(); today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
            const slotDay = new Date(slot); slotDay.setHours(0, 0, 0, 0);
            const timeStr = slot.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
            let label: string;
            if (slotDay.getTime() === today.getTime()) {
              label = `Nächster Termin: Heute ${timeStr}`;
            } else if (slotDay.getTime() === tomorrow.getTime()) {
              label = `Nächster Termin: Morgen ${timeStr}`;
            } else {
              const dateStr = slot.toLocaleDateString("de-CH", { weekday: "short", day: "numeric", month: "short" });
              label = `Nächster Termin: ${dateStr} ${timeStr}`;
            }
            return (
              <p className="text-[12px] font-medium leading-[18px]" style={{ color: "#2E7D32" }}>
                {label}
              </p>
            );
          })()}

          {/* Line 5: Social proof (Phase 3.5) */}
          {(salon.booking_count_week ?? 0) >= 3 && (
            <p className="text-[12px] text-[#6A6A6A] leading-[18px]">
              {salon.booking_count_week}× diese Woche gebucht
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
