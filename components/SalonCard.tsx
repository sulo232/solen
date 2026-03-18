"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Star, MapPin, TrendingUp, Sparkles, ShieldCheck, Award, Heart, Crown,
  Flame, Zap, ThumbsUp, BadgeCheck, Trophy, Gem, Medal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
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

export default function SalonCard({ salon, variant = "default", locale = "de", showCompare, compareSelected, onCompareToggle, showAvailability, showDistance, isFavorited, onFavoriteToggle }: SalonCardProps) {
  const router = useRouter();
  const href = `/${locale}/salon/${salon.slug}`;

  if (variant === "compact") {
    return (
      <Link
        href={href}
        className="flex items-center gap-3 p-3 rounded-card bg-white dark:bg-dm-surface shadow-card hover:shadow-card-hover transition-shadow"
      >
        <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-100">
          {salon.cover_photo_url && (
            <Image src={salon.cover_photo_url} alt={salon.name} fill className="object-cover" loading="lazy" />
          )}
        </div>
        <div className="min-w-0">
          <p className="font-heading font-medium text-sm text-dark truncate">{salon.name}</p>
          <p className="text-xs text-dark/50 font-body">{quartierLabels[salon.quartier] ?? salon.quartier}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="w-3 h-3 fill-coral text-coral" />
            <span className="text-xs font-data text-dark/70">{salon.average_rating.toFixed(1)}</span>
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
      whileHover={{ y: -4, boxShadow: "0 12px 32px rgba(0,0,0,0.12)" }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className="will-change-transform"
      onMouseEnter={() => router.prefetch(href)}
    >
      <Link href={href} className="block rounded-card bg-white dark:bg-dm-surface shadow-card overflow-hidden group">
        {/* Cover photo */}
        <div className="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden">
          {salon.cover_photo_url ? (
            <Image
              src={salon.cover_photo_url}
              alt={salon.name}
              fill
              loading="lazy"
              className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-dark/20 text-4xl font-heading">
              {salon.name[0]}
            </div>
          )}
          {/* Glass category pills on photo */}
          <div className="absolute bottom-2 left-2 flex gap-1.5 flex-wrap">
            {salon.categories.slice(0, 2).map((cat) => (
              <span
                key={cat}
                className="px-2 py-0.5 rounded-pill bg-dark/50 backdrop-blur-sm text-white text-[10px] font-body font-medium capitalize border border-white/10"
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
                  ? "bg-teal border-teal text-white"
                  : "bg-white/80 backdrop-blur-sm border-white/60 text-transparent hover:border-teal/50",
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
                className={`w-4 h-4 transition-colors ${isFavorited ? "fill-coral text-coral" : "text-dark/50"}`}
              />
            </button>
          )}
          {/* Last-minute badge */}
          {salon.last_minute_discount_percent > 0 && (
            <div className={`absolute ${onFavoriteToggle ? "top-12" : "top-2"} right-2`}>
              <span className="px-2 py-0.5 rounded-pill bg-coral text-white text-[10px] font-body font-semibold shadow-coral-glow">
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
          <h3 className="font-heading font-semibold text-dark dark:text-dm-text text-base leading-tight">{salon.name}</h3>
          {(salon as any).group_name && (
            <span className="inline-flex items-center gap-1 text-[10px] text-teal font-medium mt-0.5">
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
                <span className="px-1.5 py-0.5 rounded-pill bg-gray-100 text-dark/40 text-[10px] font-medium">
                  +{salon.badges.length - 3}
                </span>
              )}
            </div>
          )}
          <div className="flex items-center gap-1 mt-1 text-dark/50">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs font-body">{quartierLabels[salon.quartier] ?? salon.quartier}</span>
            {showDistance && salon.distance_km != null && (
              <span className="text-xs text-dark/50 font-body">{salon.distance_km.toFixed(1)} km</span>
            )}
          </div>
          {showAvailability && salon.next_available_slot && (
            <div className="mt-1">
              <span className="text-xs text-teal font-medium font-body">{salon.next_available_slot}</span>
            </div>
          )}
          <div className="flex items-center gap-1 mt-2 flex-wrap">
            <Star className="w-4 h-4 fill-coral text-coral" />
            <span className="text-sm font-data font-medium text-dark">{salon.average_rating.toFixed(1)}</span>
            <span className="text-xs text-dark/40 font-body">({salon.review_count})</span>
            {salon.avg_price != null && salon.avg_price > 0 && (
              <>
                <span className="text-xs text-dark/30 font-body">·</span>
                <span className="text-xs font-data text-dark/60">Ø CHF {salon.avg_price}</span>
              </>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
