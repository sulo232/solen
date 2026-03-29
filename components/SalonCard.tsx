"use client";

import { useRef, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Star, MapPin, TrendingUp, Sparkles, ShieldCheck, Award, Heart, Crown,
  Flame, Zap, ThumbsUp, BadgeCheck, Trophy, Gem, Medal, Scissors,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";
import type { SalonCard as SalonCardType } from "@/lib/types";
import { useCompare } from "@/components/compare/CompareContext";

const BLUR_PLACEHOLDER = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOCIgaGVpZ2h0PSI1IiB2aWV3Qm94PSIwIDAgOCA1IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjUiIGZpbGw9IiNFOEU0REYiLz48L3N2Zz4=";

const BADGE_ICONS: Record<string, LucideIcon> = {
  Star, TrendingUp, Sparkles, ShieldCheck, Award, Heart, Crown,
  Flame, Zap, ThumbsUp, BadgeCheck, Trophy, Gem, Medal,
};

/* ── V4 Animation Variants ─────────────────────────────────────────── */
const cardReveal = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.45, ease: [0.23, 1, 0.32, 1] },
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
  coiffeur:   ["rgba(212,135,10,0.10)",  "rgba(250,246,239,0.98)"],
  barbershop: ["rgba(74,30,60,0.08)",    "rgba(250,246,239,0.98)"],
  nails:      ["rgba(232,98,74,0.10)",   "rgba(250,246,239,0.98)"],
  spa:        ["rgba(123,166,136,0.14)", "rgba(250,246,239,0.98)"],
  makeup:     ["rgba(201,169,110,0.12)", "rgba(250,246,239,0.98)"],
  waxing:     ["rgba(107,163,200,0.12)", "rgba(250,246,239,0.98)"],
};

function getCategoryFallbackGradient(categories?: string[]): string {
  const cat = (categories?.[0] ?? "coiffeur").toLowerCase();
  const [from, to] = CATEGORY_FALLBACK_GRADIENTS[cat] ?? CATEGORY_FALLBACK_GRADIENTS.coiffeur;
  return `linear-gradient(135deg, ${from} 0%, ${to} 100%)`;
}


export default function SalonCard({ salon, variant = "default", locale = "de", showCompare = false, showAvailability, showDistance, isFavorited, onFavoriteToggle, stampProgress, solenTier, availableToday, availability, offPeakToday, aiReason, animated = true, photos }: SalonCardProps) {
  const t = useTranslations("salon") as any;
  const router = useRouter();
  const prefetched = useRef(false);
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
  const allPhotos = [salon.cover_photo_url, ...(photos || [])].filter(Boolean) as string[];
  const hasMultiple = allPhotos.length > 1;

  /* ── Compact variant ─────────────────────────────────────────────── */
  if (variant === "compact") {
    return (
      <Link
        href={href}
        className="flex items-center gap-3 p-3 rounded-card bg-white dark:bg-s-dm-surface border border-s-ink/[0.05] dark:border-white/[0.05] group"
      >
        <div className="relative w-16 h-16 rounded-input overflow-hidden shrink-0 bg-s-bg-sunken img-hover-zoom">
          {salon.cover_photo_url && (
            <Image src={salon.cover_photo_url} alt={salon.name} fill sizes="64px" className="object-cover" />
          )}
        </div>
        <div className="min-w-0">
          <p className="font-heading font-medium text-sm text-s-ink dark:text-s-dm-text truncate group-hover:text-s-coral transition-colors duration-200">{salon.name}</p>
          <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 font-body truncate">{salon.address}</p>
          {(salon.average_rating > 0 || salon.review_count > 0) ? (
            <div className="flex items-center gap-1 mt-0.5">
              <Star className="w-3 h-3 fill-s-coral text-s-coral" />
              <span className="text-xs data-text text-s-ink/70 dark:text-s-dm-text/70">{salon.average_rating.toFixed(1)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[10px] font-body font-medium text-s-coral bg-s-coral-subtle dark:bg-s-coral/10 px-1.5 py-0.5 rounded-pill">{t("new")}</span>
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
        <div className="absolute inset-0 bg-white/60 dark:bg-s-dm-bg/60 rounded-[inherit] z-10 pointer-events-none flex items-end p-3">
          <span className="text-xs font-body text-s-ink/50 dark:text-s-dm-text/50 pointer-events-auto">
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
        {/* Cover photo — V4: image fills card radius, smooth zoom on hover */}
        <div className="relative w-full aspect-[4/5] bg-s-bg-sunken overflow-hidden rounded-xl img-hover-zoom">
          {allPhotos.length > 0 ? (
            <Image
              src={allPhotos[photoIndex]}
              alt={salon.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              placeholder="blur"
              blurDataURL={BLUR_PLACEHOLDER}
              className="object-cover"
            />
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

          {/* Available today pill */}
          {availableToday != null && availableToday > 0 && (
            <div className="absolute top-2 left-2 bg-s-success text-white text-xs font-semibold px-2 py-0.5 rounded-pill shadow-elevation-1 z-[1]">
              {t("appointmentsToday", { count: availableToday })}
            </div>
          )}

          {/* New salon badge — white overlay on image, only when review_count < 5 and no availableToday pill */}
          {salon.review_count < 5 && (availableToday == null || availableToday === 0) && (
            <div className="absolute top-2 left-2 z-[1]">
              <span className="font-heading font-bold text-[10px] text-s-ink bg-white/95 px-2 py-0.5 rounded-pill">
                {t("newOnSolen")}
              </span>
            </div>
          )}

          {/* Solen tier badge */}
          {solenTier === "gold" && (
            <div className="absolute top-2 right-2 bg-s-yellow-subtle text-s-yellow-text text-xs font-semibold px-2 py-0.5 rounded-pill z-[1]">
              {t("topSalon")}
            </div>
          )}

          {/* Top Pick badge */}
          {salon.is_top_pick && !solenTier && (
            <div className="absolute top-2 right-2 bg-s-yellow-subtle text-s-yellow-text px-2.5 py-1 rounded-btn text-[10px] font-heading font-bold uppercase tracking-[.08em] z-[1]">
              {t("solenTopPick")}
            </div>
          )}

          {/* Category pills on photo — glass style kept here only */}
          <div className="absolute bottom-2 left-2 flex gap-1.5 flex-wrap">
            {salon.categories.slice(0, 2).map((cat) => (
              <span
                key={cat}
                className="px-2 py-0.5 rounded-pill bg-s-ink/45 backdrop-blur-[8px] text-white text-[10px] font-body font-medium capitalize border border-white/10"
              >
                {cat}
              </span>
            ))}
          </div>

          {/* Compare checkbox */}
          {showCompare && (
            <button
              type="button"
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

          {/* Favorite heart — smooth spring animation */}
          {onFavoriteToggle && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFavoriteToggle(salon.id); }}
              className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/80 backdrop-blur-[8px] flex items-center justify-center transition-[transform,background-color] duration-200 hover:bg-white active:scale-[0.98]"
              aria-label={isFavorited ? t("removeFromFavorites") : t("addToFavorites")}
            >
              <Heart
                className={`w-4 h-4 transition-[transform,color] duration-300 ${heartBouncing ? "heart-bounce" : ""} ${isFavorited ? "fill-s-coral text-s-coral scale-110" : "text-s-ink/40 group-hover:text-s-ink/60"}`}
              />
            </button>
          )}

          {/* Last-minute discount badge */}
          {salon.last_minute_discount_percent > 0 && (
            <div className={`absolute ${onFavoriteToggle ? "top-12" : "top-2"} right-2`}>
              <span className="px-2 py-0.5 rounded-pill bg-s-coral text-white text-[10px] font-body font-semibold shadow-elevation-1">
                -{salon.last_minute_discount_percent}%
              </span>
            </div>
          )}

          {/* Availability badge */}
          {showAvailability && salon.next_available_slot && (
            <div className="absolute right-2" style={{ top: onFavoriteToggle ? (salon.last_minute_discount_percent > 0 ? "5rem" : "3rem") : (salon.last_minute_discount_percent > 0 ? "2rem" : "0.5rem") }}>
              <span className="px-2 py-0.5 rounded-pill bg-s-success text-white text-[10px] font-body font-medium">
                {t("availableToday")}
              </span>
            </div>
          )}

          {/* Photo carousel dot indicators */}
          {hasMultiple && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
              {allPhotos.slice(0, 5).map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPhotoIndex(i); }}
                  className={`rounded-full transition-all duration-200 ${i === photoIndex ? "w-2 h-2 bg-white" : "w-1.5 h-1.5 bg-white/60"}`}
                  aria-label={`Photo ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Info Section — Compact Airbnb-style ─────────────────────── */}
        <div className="pt-3 pb-1 px-0">
          {/* Name + AI sparkle (same row) */}
          <div className="flex items-start justify-between gap-1">
            <h3 className="font-heading font-semibold text-s-ink dark:text-s-dm-text text-[13px] leading-snug">
              {salon.name}
              {(salon as any).group_name && (
                <span className="text-s-ink/40 font-normal"> · {(salon as any).group_name}</span>
              )}
            </h3>
            {aiReason && (
              <div className="relative group/ai shrink-0 mt-0.5">
                <Sparkles className="w-3 h-3 text-s-coral cursor-help" />
                <div className="absolute bottom-full right-0 mb-2 px-3 py-2 glass-frost rounded-card shadow-elevation-3 border border-s-ink/5 dark:border-white/5 text-xs text-s-ink dark:text-s-dm-text w-48 opacity-0 pointer-events-none group-hover/ai:opacity-100 group-hover/ai:pointer-events-auto transition-[opacity,transform] duration-200 group-hover/ai:-translate-y-1 z-10">
                  {aiReason}
                  <div className="absolute top-full right-4 -mt-1 border-4 border-transparent border-t-white dark:border-t-s-dm-surface" />
                </div>
              </div>
            )}
          </div>

          {/* Address + Distance */}
          <div className="flex items-center gap-1 mt-1 text-s-ink/40 dark:text-s-dm-text/40">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="text-[11px] font-body truncate">{salon.address}</span>
            {showDistance && salon.distance_km != null && (
              <span className="text-[11px] text-s-ink/30 font-body shrink-0 ml-auto">{salon.distance_km.toFixed(1)} km</span>
            )}
          </div>

          {/* Rating + Price */}
          {(() => {
            const priceToShow = salon.min_price ?? salon.avg_price;
            return (
              <div className="flex items-center gap-1.5 mt-1.5">
                {(salon.average_rating > 0 || salon.review_count > 0) ? (
                  <>
                    <Star className="w-3 h-3 fill-s-coral text-s-coral" />
                    <span className="text-[12px] data-text font-medium text-s-ink dark:text-s-dm-text">{salon.average_rating.toFixed(1)}</span>
                    <span className="text-[11px] text-s-ink/30 dark:text-s-dm-text/30 font-body">({salon.review_count})</span>
                  </>
                ) : null}
                {priceToShow != null && priceToShow > 0 && (
                  <>
                    <span className="text-s-ink/20 font-body">·</span>
                    <span className="text-[11px] data-text text-s-ink/50 dark:text-s-dm-text/50">Ab {formatCurrency(priceToShow, locale)}</span>
                  </>
                )}
              </div>
            );
          })()}

          {/* Neighborhood */}
          {salon.quartier && (
            <span className="text-[11px] font-body text-s-ink/35 dark:text-s-dm-text/35 truncate block mt-0.5">
              {salon.quartier}
            </span>
          )}

          {/* 1 badge MAX */}
          {salon.badges && salon.badges.length > 0 && (() => {
            const b = salon.badges[0];
            const Ic = BADGE_ICONS[b.icon] ?? Star;
            return (
              <div className="mt-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[10px] font-medium" style={{ color: b.color, backgroundColor: b.bg_color }}>
                  <Ic size={9} />
                  {b.name_de}
                </span>
              </div>
            );
          })()}

          {/* Single signal pill — priority: availability > off-peak > stamps */}
          {(() => {
            if (showAvailability && salon.next_available_slot) {
              return (
                <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold text-s-sage-text bg-s-sage-subtle dark:bg-s-sage/10 px-2 py-0.5 rounded-pill">
                  {salon.next_available_slot}
                </span>
              );
            }
            if (offPeakToday) {
              return (
                <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] bg-s-sage-subtle text-s-sage-text dark:bg-s-sage/10 px-2 py-0.5 rounded-pill font-medium">
                  Off-Peak -{offPeakToday.discount_percent}%
                </span>
              );
            }
            if (stampProgress && stampProgress.current > 0) {
              return (
                <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] bg-s-amber-subtle text-s-amber-text px-2 py-0.5 rounded-pill">
                  <Star size={9} className="fill-s-amber text-s-amber" /> {stampProgress.current}/{stampProgress.total}
                </span>
              );
            }
            return null;
          })()}
        </div>
      </Link>
    </motion.div>
  );
}
