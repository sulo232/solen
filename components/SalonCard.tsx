"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Star, MapPin, TrendingUp, Sparkles, ShieldCheck, Award, Heart, Crown,
  Flame, Zap, ThumbsUp, BadgeCheck, Trophy, Gem, Medal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";
import type { SalonCard as SalonCardType } from "@/lib/types";

const BADGE_ICONS: Record<string, LucideIcon> = {
  Star, TrendingUp, Sparkles, ShieldCheck, Award, Heart, Crown,
  Flame, Zap, ThumbsUp, BadgeCheck, Trophy, Gem, Medal,
};
import { cardPopIn } from "@/lib/animations";

interface SalonCardProps {
  salon: SalonCardType;
  variant?: "default" | "compact";
  locale?: string;
  showCompare?: boolean;
  compareSelected?: boolean;
  onCompareToggle?: (salonId: string) => void;
  showAvailability?: boolean;
  showDistance?: boolean;
  isFavorited?: boolean;
  onFavoriteToggle?: (salonId: string) => void;
  stampProgress?: { current: number; total: number } | null;
  solenTier?: "gold" | "coral" | "grey" | "dark" | null;
  availableToday?: number | null;
}

const quartierLabels: Record<string, string> = {
  grossbasel: "Grossbasel",
  kleinbasel: "Kleinbasel",
  gundeli: "Gundeli",
  st_johann: "St. Johann",
  iselin: "Iselin",
  bruderholz: "Bruderholz",
  breite: "Breite",
};

export default function SalonCard({ salon, variant = "default", locale = "de", showCompare, compareSelected, onCompareToggle, showAvailability, showDistance, isFavorited, onFavoriteToggle, stampProgress, solenTier, availableToday }: SalonCardProps) {
  const router = useRouter();
  const prefetched = useRef(false);
  const href = `/${locale}/salon/${salon.slug}`;

  if (variant === "compact") {
    return (
      <Link
        href={href}
        className="flex items-center gap-3 p-3 rounded-card bg-white dark:bg-s-dm-surface shadow-card hover:shadow-card-hover transition-shadow"
      >
        <div className="relative w-16 h-16 rounded-button overflow-hidden shrink-0 bg-s-bg-sunken">
          {salon.cover_photo_url && (
            <Image src={salon.cover_photo_url} alt={salon.name} fill className="object-cover" loading="lazy" />
          )}
        </div>
        <div className="min-w-0">
          <p className="font-heading font-medium text-sm text-s-ink truncate">{salon.name}</p>
          <p className="text-xs text-s-ink/50 font-body">{quartierLabels[salon.quartier] ?? salon.quartier}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="w-3 h-3 fill-s-coral text-s-coral" />
            <span className="text-xs data-text text-s-ink/70">{salon.average_rating.toFixed(1)}</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <motion.div
      variants={cardPopIn}
      initial="hidden"
      animate="visible"
      whileHover={
        typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? {}
          : { y: -4, borderRadius: "60% 40% 45% 55% / 50% 60% 40% 50%", boxShadow: "0 12px 32px rgba(26,18,9,0.10)" }
      }
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      style={{ borderRadius: "40% 60% 55% 45% / 30% 30% 70% 70%" }}
      className={`will-change-transform ${solenTier === "gold" ? "ring-2 ring-yellow-400/50" : ""}`}
      onMouseEnter={() => { if (!prefetched.current) { prefetched.current = true; router.prefetch(href); } }}
    >
      <Link href={href} className="block w-full h-full rounded-[inherit] bg-white dark:bg-s-dm-surface shadow-card overflow-hidden group hover:shadow-lg transition-all duration-200">
        {/* Cover photo */}
        <div className="relative w-full aspect-[4/3] bg-s-bg-sunken overflow-hidden">
          {salon.cover_photo_url ? (
            <Image
              src={salon.cover_photo_url}
              alt={salon.name}
              fill
              loading="lazy"
              className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-s-ink/20 text-4xl font-heading">
              {salon.name[0]}
            </div>
          )}
          {/* Available today pill */}
          {availableToday != null && availableToday > 0 && (
            <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow-sm z-[1]">
              {availableToday} {availableToday === 1 ? "Termin" : "Termine"} heute frei
            </div>
          )}
          {/* Solen tier badge */}
          {solenTier === "gold" && (
            <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-semibold px-2 py-0.5 rounded-full z-[1]">
              Top Salon
            </div>
          )}
          {/* Glass category pills on photo */}
          <div className="absolute bottom-2 left-2 flex gap-1.5 flex-wrap">
            {salon.categories.slice(0, 2).map((cat) => (
              <span
                key={cat}
                className="px-2 py-0.5 rounded-pill bg-s-ink/50 backdrop-blur-sm text-white text-[10px] font-body font-medium capitalize border border-white/10"
              >
                {cat}
              </span>
            ))}
          </div>
          {/* Compare checkbox */}
          {showCompare && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCompareToggle?.(salon.id); }}
              className={[
                "absolute top-2 left-2 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors z-10",
                compareSelected
                  ? "bg-s-coral border-s-coral text-white"
                  : "bg-white/80 backdrop-blur-sm border-white/60 text-transparent hover:border-s-coral/50",
              ].join(" ")}
            >
              {compareSelected && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              )}
            </button>
          )}
          {/* Favorite heart */}
          {onFavoriteToggle && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFavoriteToggle(salon.id); }}
              className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center transition-colors hover:bg-white/90"
              aria-label={isFavorited ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
            >
              <Heart
                className={`w-4 h-4 transition-colors ${isFavorited ? "fill-s-coral text-s-coral" : "text-s-ink/50"}`}
              />
            </button>
          )}
          {/* Last-minute badge */}
          {salon.last_minute_discount_percent > 0 && (
            <div className={`absolute ${onFavoriteToggle ? "top-12" : "top-2"} right-2`}>
              <span className="px-2 py-0.5 rounded-pill bg-s-coral text-white text-[10px] font-body font-semibold shadow-warm-md">
                -{salon.last_minute_discount_percent}%
              </span>
            </div>
          )}
          {/* Availability badge */}
          {showAvailability && salon.next_available_slot && (
            <div className="absolute right-2" style={{ top: onFavoriteToggle ? (salon.last_minute_discount_percent > 0 ? "5rem" : "3rem") : (salon.last_minute_discount_percent > 0 ? "2rem" : "0.5rem") }}>
              <span className="px-2 py-0.5 rounded-pill bg-emerald-500 text-white text-[10px] font-body font-medium">
                Verfügbar heute
              </span>
            </div>
          )}
        </div>

        {/* Info row */}
        <div className="p-4">
          <h3 className="font-heading font-semibold text-s-ink dark:text-s-dm-text text-base leading-tight">{salon.name}</h3>
          {(salon as any).group_name && (
            <span className="inline-flex items-center gap-1 text-[10px] text-s-coral font-medium mt-0.5">
              Teil von {(salon as any).group_name}
            </span>
          )}
          {salon.badges && salon.badges.length > 0 && (
            <div className="flex items-center gap-1 mt-1 flex-wrap">
              {salon.badges.slice(0, 3).map((b, i) => {
                const Ic = BADGE_ICONS[b.icon] ?? Star;
                return (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[10px] font-medium"
                    style={{ color: b.color, backgroundColor: b.bg_color }}
                  >
                    <Ic size={10} />
                    {b.name_de}
                  </span>
                );
              })}
              {salon.badges.length > 3 && (
                <span className="px-1.5 py-0.5 rounded-pill bg-s-bg-sunken text-s-ink/40 text-[10px] font-medium">
                  +{salon.badges.length - 3}
                </span>
              )}
            </div>
          )}
          <div className="flex items-center gap-1 mt-1 text-s-ink/50">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs font-body">{quartierLabels[salon.quartier] ?? salon.quartier}</span>
            {showDistance && salon.distance_km != null && (
              <span className="text-xs text-s-ink/50 font-body">{salon.distance_km.toFixed(1)} km</span>
            )}
          </div>
          {showAvailability && salon.next_available_slot && (
            <div className="mt-1">
              <span className="text-xs text-s-coral font-medium font-body">{salon.next_available_slot}</span>
            </div>
          )}
          <div className="flex items-center gap-1 mt-2 flex-wrap">
            <Star className="w-4 h-4 fill-s-coral text-s-coral" />
            <span className="text-sm data-text font-medium text-s-ink">{salon.average_rating.toFixed(1)}</span>
            <span className="text-xs text-s-ink/40 font-body">({salon.review_count})</span>
            {salon.avg_price != null && salon.avg_price > 0 && (
              <>
                <span className="text-xs text-s-ink/30 font-body">·</span>
                <span className="text-xs data-text text-s-ink/60">Ø {formatCurrency(salon.avg_price, locale)}</span>
              </>
            )}
          </div>
          {stampProgress && stampProgress.current > 0 && (
            <span className="inline-flex items-center gap-1 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 px-2 py-0.5 rounded-full mt-1.5">
              <Star size={12} className="fill-s-amber text-s-amber" /> {stampProgress.current}/{stampProgress.total}
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
