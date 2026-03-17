"use client";

import Image from "next/image";
import Link from "next/link";
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

export default function SalonCard({ salon, variant = "default", locale = "de" }: SalonCardProps) {
  const href = `/${locale}/salon/${salon.slug}`;

  if (variant === "compact") {
    return (
      <Link
        href={href}
        className="flex items-center gap-3 p-3 rounded-card bg-white shadow-card hover:shadow-card-hover transition-shadow"
      >
        <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-100">
          {salon.cover_photo_url && (
            <Image src={salon.cover_photo_url} alt={salon.name} fill className="object-cover" />
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
    >
      <Link href={href} className="block rounded-card bg-white shadow-card overflow-hidden group">
        {/* Cover photo */}
        <div className="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden">
          {salon.cover_photo_url ? (
            <Image
              src={salon.cover_photo_url}
              alt={salon.name}
              fill
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
          {/* Last-minute badge */}
          {salon.last_minute_discount_percent > 0 && (
            <div className="absolute top-2 right-2">
              <span className="px-2 py-0.5 rounded-pill bg-coral text-white text-[10px] font-body font-semibold shadow-coral-glow">
                -{salon.last_minute_discount_percent}%
              </span>
            </div>
          )}
        </div>

        {/* Info row */}
        <div className="p-4">
          <h3 className="font-heading font-semibold text-dark text-base leading-tight">{salon.name}</h3>
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
          </div>
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
