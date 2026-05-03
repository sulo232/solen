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
import { formatPrice } from "@/lib/format";
import { getNeighborhood } from "@/lib/basel-neighborhoods";
import type { SalonCard as SalonCardType } from "@/lib/types";
import { useCompare } from "@/components/compare/CompareContext";
import SalonBadge from "@/components/ui/SalonBadge";
import ImageFallback from "@/components/ui/ImageFallback";

const BLUR_PLACEHOLDER = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOCIgaGVpZ2h0PSI1IiB2aWV3Qm94PSIwIDAgOCA1IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjUiIGZpbGw9IiNFOEU0REYiLz48L3N2Zz4=";

const BADGE_ICONS: Record<string, LucideIcon> = {
  Star, TrendingUp, Sparkles, ShieldCheck, Award, Heart, Crown,
  Flame, Zap, ThumbsUp, BadgeCheck, Trophy, Gem, Medal,
};

/* ── DESIGN_SPEC §5.3: No card entrance animations — content just appears ── */

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
  coiffeur:   { bg: "rgba(243,168,100,.12)",  text: "#7A4A00" },
  barbershop: { bg: "rgba(74,30,60,.12)",    text: "#4A1E3C" },
  nails:      { bg: "rgba(27, 77, 27,.12)",   text: "#7A2415" },
  spa:        { bg: "rgba(123,166,136,.15)", text: "#2A5438" },
  makeup:     { bg: "rgba(201,169,110,.14)", text: "#6B4005" },
  waxing:     { bg: "rgba(107,163,200,.15)", text: "#1A4D72" },
};

const CATEGORY_FALLBACK_GRADIENTS: Record<string, [string, string]> = {
  coiffeur:   ["rgba(243,168,100,0.10)",  "rgba(255,255,255,0.98)"],
  barbershop: ["rgba(74,30,60,0.08)",    "rgba(255,255,255,0.98)"],
  nails:      ["rgba(27, 77, 27,0.10)",   "rgba(255,255,255,0.98)"],
  spa:        ["rgba(123,166,136,0.14)", "rgba(255,255,255,0.98)"],
  makeup:     ["rgba(201,169,110,0.12)", "rgba(255,255,255,0.98)"],
  waxing:     ["rgba(107,163,200,0.12)", "rgba(255,255,255,0.98)"],
};

function getCategoryFallbackGradient(categories?: string[]): string {
  const cat = (categories?.[0] ?? "coiffeur").toLowerCase();
  const [from, to] = CATEGORY_FALLBACK_GRADIENTS[cat] ?? CATEGORY_FALLBACK_GRADIENTS.coiffeur;
  return `linear-gradient(135deg, ${from} 0%, ${to} 100%)`;
}


export default function SalonCard({ salon, variant = "default", locale = "de", showCompare = false, showAvailability, showDistance, isFavorited, onFavoriteToggle, stampProgress, solenTier, availableToday, availability, offPeakToday, aiReason, photos }: SalonCardProps) {
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
        className="flex items-center gap-3 p-3 rounded-card bg-white border border-s-ink/[0.08] group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-coral focus-visible:ring-offset-2"
      >
        {/* A3 LOCKED 2026-05-03: photos killed pre-launch — solid category color + Anton name only */}
        <div className="relative w-16 h-16 rounded-input overflow-hidden shrink-0">
          <ImageFallback category={salon.categories?.[0]} salonName={salon.name} className="absolute inset-0" />
        </div>
        <div className="min-w-0">
          {/* Q26: Anton uppercase for card name */}
          <p className="font-heading text-sm uppercase text-s-ink truncate leading-[1.05]" style={{ letterSpacing: "0.01em" }}>{salon.name}</p>
          <p className="text-xs text-s-ink/60 font-body truncate">{salon.address}</p>
          {(salon.average_rating > 0 || salon.review_count > 0) ? (
            <div className="flex items-center gap-1 mt-0.5">
              {/* Q43 + SOLEN_UI #5b: stars are amber, NOT coral */}
              <Star className="w-3 h-3 fill-s-amber text-s-amber" aria-hidden />
              <span className="text-xs text-s-ink/60 tabular-nums">{salon.average_rating.toFixed(1)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-xs font-body font-medium text-s-ink bg-s-bg-sunken px-1.5 py-0.5 rounded-pill">{t("new")}</span>
            </div>
          )}
        </div>
      </Link>
    );
  }

  /* ── Default variant — V4 Clean Card ─────────────────────────────── */
  return (
    <div
      className={`relative card-listing cursor-pointer group ${solenTier === "gold" ? "ring-2 ring-s-yellow/50" : ""}`}
      onMouseEnter={() => { if (!prefetched.current) { prefetched.current = true; router.prefetch(href); } }}
    >
      {/* Date-based availability overlay */}
      {availability?.status === "unavailable" && (
        <div className="absolute inset-0 bg-white/60 rounded-[inherit] z-10 pointer-events-none flex items-end p-3">
          <span className="text-xs font-body text-[s-ink/60] pointer-events-auto">
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

      <Link href={href} className="block w-full h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-coral focus-visible:ring-offset-2 rounded-[16px]">
        {/* Cover — A3 LOCKED 2026-05-03: photos killed pre-launch. Always render
            solid category color + Anton uppercase salon name (locked card pattern,
            ref public/solen-coral.html:225-245, 847-865). Photo carousel state
            (allPhotos/photoIndex/scrollContainerRef) intentionally left orphan
            in case we restore opt-in photo support later. */}
        <div className="relative w-full aspect-square overflow-hidden rounded-[16px] gpu">
          <ImageFallback
            category={salon.categories?.[0]}
            salonName={salon.name}
            className="absolute inset-0"
          />

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
              className="absolute top-1 right-1 z-10 p-2 hover:bg-s-ink/[0.06] active:scale-[0.92] transition-[transform,background-color] duration-150 rounded-full flex items-center justify-center"
              aria-pressed={isFavorited}
              aria-label={isFavorited ? t("removeFromFavorites") : t("addToFavorites")}
              style={{ minWidth: "44px", minHeight: "44px" }}
            >
              <motion.div
                animate={heartBouncing ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                transition={heartBouncing ? { type: "spring", stiffness: 400, damping: 15, duration: 0.4 } : { duration: 0 }}
              >
                {/* Q26 + SOLEN_UI #5b: heart save state uses literal #FF4A6B love-red, NOT brand coral */}
                <Heart
                  className={`w-[26px] h-[26px] transition-colors duration-200 ${
                    isFavorited ? "" : "fill-transparent stroke-white hover:fill-white/20"
                  }`}
                  strokeWidth={2}
                  style={{
                    filter: "drop-shadow(0 1px 2px rgba(26,18,9,0.45))",
                    ...(isFavorited ? { fill: "#FF4A6B", color: "#FF4A6B" } : {}),
                  }}
                />
              </motion.div>
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

          {/* Photo carousel dot indicators — always visible, larger touch target */}
          {hasMultiple && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10 opacity-100 group-hover/carousel:opacity-100 transition-opacity duration-200">
              {allPhotos.slice(0, 5).map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation();
                    scrollContainerRef.current?.scrollTo({ left: i * (scrollContainerRef.current.clientWidth || 0), behavior: 'smooth' });
                  }}
                  className={`rounded-full transition-[background-color,width,height] duration-200 ${i === photoIndex ? "w-2.5 h-2.5 bg-white" : "w-2 h-2 bg-white/60 hover:bg-white/90"}`}
                  aria-label={`Photo ${i + 1} of ${allPhotos.length}`}
                />
              ))}
            </div>
          )}

          {/* Left/right arrows — desktop hover only, larger touch target */}
          {hasMultiple && photoIndex > 0 && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation();
                scrollContainerRef.current?.scrollTo({ left: (photoIndex - 1) * (scrollContainerRef.current.clientWidth || 0), behavior: 'smooth' });
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-sm flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 focus-visible:opacity-100 transition-[opacity,transform,background-color] duration-150 z-[2] hover:bg-white active:scale-[0.92] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-coral focus-visible:ring-offset-2"
              aria-label="Previous photo"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          {hasMultiple && photoIndex < Math.min(allPhotos.length - 1, 4) && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation();
                scrollContainerRef.current?.scrollTo({ left: (photoIndex + 1) * (scrollContainerRef.current.clientWidth || 0), behavior: 'smooth' });
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-sm flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 focus-visible:opacity-100 transition-[opacity,transform,background-color] duration-150 z-[2] hover:bg-white active:scale-[0.92] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-coral focus-visible:ring-offset-2"
              aria-label="Next photo"
            >
              <ChevronRight size={18} />
            </button>
          )}
        </div>

        {/* ── Info Section — Roadmap 02 Typography Matrix ─────────────────────── */}
        {/* DESIGN_SPEC §3.1: content padding 14px 16px 16px, gap 4px */}
        <div className="flex flex-col gap-1" style={{ padding: "14px 16px 16px" }}>
          {/* Line 1: Name + Rating (right-aligned, Airbnb pattern) — Q26 Anton uppercase */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-heading text-s-ink text-[15px] uppercase leading-[1.1] truncate" style={{ letterSpacing: "0.01em" }}>
              {salon.name}
            </h3>
            {salon.average_rating > 0 ? (
              /* Q43 + SOLEN_UI #5b: stars are amber `#F3A864`, NOT coral. Tabular numerics on rating + count. */
              <span className="shrink-0 flex items-center gap-0.5 text-sm font-semibold text-s-ink leading-6">
                <Star className="w-3.5 h-3.5 fill-s-amber text-s-amber mb-0.5" aria-hidden />
                <span className="tabular-nums">{salon.average_rating.toFixed(1)}</span>
                <span className="text-s-ink/60 font-normal text-xs tabular-nums">({salon.review_count})</span>
              </span>
            ) : salon.review_count === 0 ? (
              <span className="shrink-0 text-xs font-heading text-white bg-s-ink px-2 py-0.5 rounded-pill uppercase tracking-[.06em]">
                {t("new")}
              </span>
            ) : null}
          </div>

          {/* Line 2: Business type · Quartier */}
          <p className="text-sm text-s-ink-secondary leading-5 truncate">
            {showDistance && salon.distance_km != null
              ? `${salon.quartier ?? getNeighborhood(salon.postal_code)} · ${salon.distance_km.toFixed(1)} km`
              : `${((c: string) => c.charAt(0).toUpperCase() + c.slice(1))(salon.categories?.[0] || "Salon")} · ${salon.quartier ?? getNeighborhood(salon.postal_code)}`}
          </p>

          {/* Line 3: Price — Q43 tabular numerics + Q43 CHF prefix via formatPrice */}
          {priceToShow != null && (() => {
            const currencyLocale = locale === "de" ? "de-CH" : locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : "en-GB";
            return (
              <p className="text-sm text-s-ink/65 leading-5 tabular-nums">
                {tCommon("fromPrice", { price: formatPrice(priceToShow, currencyLocale) })}
              </p>
            );
          })()}

          {/* Line 4: Nächster Termin (Phase 3.4) */}
          {salon.next_available_slot && (() => {
            const slot = new Date(salon.next_available_slot);
            const today = new Date(); today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
            const slotDay = new Date(slot); slotDay.setHours(0, 0, 0, 0);
            const timeStr = slot.toLocaleTimeString(locale === "de" ? "de-CH" : locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : "en-GB", { hour: "2-digit", minute: "2-digit" });
            let label: string;
            if (slotDay.getTime() === today.getTime()) {
              label = t("nextAppointmentToday", { time: timeStr });
            } else if (slotDay.getTime() === tomorrow.getTime()) {
              label = t("nextAppointmentTomorrow", { time: timeStr });
            } else {
              const dateStr = slot.toLocaleDateString(locale === "de" ? "de-CH" : locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : "en-GB", { weekday: "short", day: "numeric", month: "short" });
              label = t("nextAppointmentDate", { date: dateStr, time: timeStr });
            }
            return (
              <p className="text-xs font-medium leading-5 text-s-sage">
                {label}
              </p>
            );
          })()}

          {/* Line 5: Social proof (Phase 3.5) */}
          {(salon.booking_count_week ?? 0) >= 3 && (
            <p className="text-xs text-s-ink/60 leading-5">
              {t("bookedTimesThisWeek", { count: salon.booking_count_week })}
            </p>
          )}
        </div>
      </Link>
    </div>
  );
}
