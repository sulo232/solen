"use client";

import Link from "next/link";
import { Heart, Star } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { SalonCard as SalonCardType } from "@/lib/types";

interface CityCarouselSectionProps {
  title: string;
  salons: SalonCardType[];
  locale: string;
  viewAllLabel?: string;
  favoriteIds: Set<string>;
  onFavoriteToggle: (id: string) => void;
}

function AirbnbSalonCard({
  salon,
  locale,
  isFavorited,
  onFavoriteToggle,
}: {
  salon: SalonCardType;
  locale: string;
  isFavorited: boolean;
  onFavoriteToggle: (id: string) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const [heartActive, setHeartActive] = useState(false);

  const handleHeart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setHeartActive(true);
    setTimeout(() => setHeartActive(false), 400);
    onFavoriteToggle(salon.id);
  };

  const hasPhoto = !!salon.cover_photo_url && !imgError;
  const category = salon.categories?.[0] ?? "";
  const catLabel = category.charAt(0).toUpperCase() + category.slice(1);

  return (
    <Link
      href={`/${locale}/salon/${salon.slug}`}
      className="flex-shrink-0 snap-start group block"
      style={{ width: 240 }}
      aria-label={salon.name}
    >
      <div
        className="rounded-card overflow-hidden border border-s-ink/[0.06] bg-[--raised] transition-[transform,box-shadow] duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:-translate-y-1 group-hover:shadow-[0_4px_12px_rgba(26,18,9,.06),0_16px_40px_rgba(26,18,9,.08)]"
      >
        {/* Square photo */}
        <div className="relative w-full aspect-square overflow-hidden bg-[#EDE8E2]">
          {hasPhoto ? (
            <img
              src={salon.cover_photo_url!}
              alt={salon.name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[11px] font-heading font-bold uppercase tracking-widest text-s-ink/25">{catLabel}</span>
            </div>
          )}

          {/* Gradient overlay at bottom */}
          {hasPhoto && (
            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          )}

          {/* Heart button */}
          <button
            onClick={handleHeart}
            aria-label={isFavorited ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
            className={cn(
              "absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-150",
              heartActive && "scale-125"
            )}
            style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)" }}
          >
            <Heart
              size={14}
              className={isFavorited ? "text-s-coral fill-s-coral" : "text-s-ink/60"}
              strokeWidth={isFavorited ? 0 : 1.8}
            />
          </button>

          {/* Badge */}
          {salon.badges?.[0] && (
            <div
              className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-pill text-[10px] font-heading font-bold uppercase tracking-wide"
              style={{
                background: salon.badges[0].bg_color ?? "rgba(255,255,255,0.90)",
                color: salon.badges[0].color ?? "#1A1209",
                backdropFilter: "blur(4px)",
              }}
            >
              {salon.badges[0].label}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="px-3 py-2.5">
          <p className="font-heading font-semibold text-[14px] text-s-ink leading-tight truncate">
            {salon.name}
          </p>
          <p className="font-body text-[12px] text-s-ink/45 mt-0.5 truncate">
            {salon.quartier ?? salon.address ?? catLabel}
          </p>
          <div className="flex items-center justify-between mt-1.5">
            <div className="flex items-center gap-1">
              {salon.review_count > 0 ? (
                <>
                  <Star size={11} className="text-s-coral fill-s-coral shrink-0" />
                  <span className="font-body text-[12px] text-s-ink font-medium">
                    {salon.average_rating.toFixed(1)}
                  </span>
                  <span className="font-body text-[12px] text-s-ink/40">
                    ({salon.review_count})
                  </span>
                </>
              ) : (
                <span className="font-body text-[11px] text-s-ink/35 uppercase tracking-wide">Neu</span>
              )}
            </div>
            {(salon.min_price ?? (salon as any).minimum_price) && (
              <span className="font-body text-[12px] text-s-ink/60">
                Ab CHF {((salon.min_price ?? (salon as any).minimum_price) as number).toFixed(0)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function CityCarouselSection({
  title,
  salons,
  locale,
  viewAllLabel,
  favoriteIds,
  onFavoriteToggle,
}: CityCarouselSectionProps) {
  if (salons.length === 0) return null;

  return (
    <section className="pb-8">
      {/* Section header */}
      <div className="max-w-5xl mx-auto px-6 mb-3 flex items-center justify-between">
        <span
          className="font-body font-semibold text-[12px] uppercase text-s-coral"
          style={{ letterSpacing: "2.5px" }}
        >
          {title}
        </span>
        {viewAllLabel && salons.length > 4 && (
          <span className="font-heading font-semibold text-[12px] text-s-ink/50 hover:text-s-ink transition-colors cursor-pointer">
            {viewAllLabel} →
          </span>
        )}
      </div>

      {/* Horizontal scroll */}
      <div
        className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory"
        style={{
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
          padding: "0 24px",
          scrollPaddingLeft: "24px",
          overscrollBehaviorX: "contain",
        } as React.CSSProperties}
      >
        {salons.map((salon) => (
          <AirbnbSalonCard
            key={salon.id}
            salon={salon}
            locale={locale}
            isFavorited={favoriteIds.has(salon.id)}
            onFavoriteToggle={onFavoriteToggle}
          />
        ))}
      </div>
    </section>
  );
}
