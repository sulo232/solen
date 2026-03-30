"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import type { SalonCard } from "@/lib/types";

interface FeaturedSalonCarouselProps {
  salons: SalonCard[];
  locale: string;
}

export default function FeaturedSalonCarousel({ salons, locale }: FeaturedSalonCarouselProps) {
  const t = useTranslations("home") as any;

  // Empty state: fewer than 3 salons with photos
  const salonsWithPhotos = salons.filter(
    (s) => !!s.cover_photo_url || (s.gallery_urls && s.gallery_urls.length > 0)
  );

  if (salonsWithPhotos.length < 3) {
    return (
      <div
        className="relative mt-6 mx-0 rounded-card overflow-hidden"
        style={{ aspectRatio: "16/9" }}
      >
        <img
          src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=1200&auto=format&fit=crop"
          alt=""
          className="w-full h-full object-cover"
          loading="eager"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, transparent 30%, rgba(245,240,235,0.6) 100%)",
          }}
          aria-hidden="true"
        />
        <p className="absolute bottom-4 left-4 font-body font-medium text-[15px] text-s-ink/70">
          {t("heroCarousel.empty")}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 -mx-4">
      {/* Section label */}
      <p
        className="px-4 mb-4 font-body font-semibold text-[12px] uppercase text-s-coral"
        style={{ letterSpacing: "2.5px" }}
      >
        {t("heroCarousel.label")}
      </p>

      {/* Horizontal scroll container */}
      <div
        className="flex gap-4 overflow-x-auto scrollbar-hide px-4 pb-2 snap-x snap-mandatory"
        style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
      >
        {salonsWithPhotos.slice(0, 8).map((salon, index) => (
          <SalonHeroCard key={salon.id} salon={salon} locale={locale} index={index} />
        ))}
      </div>
    </div>
  );
}

// ── Individual card ────────────────────────────────────────────────────────────

interface SalonHeroCardProps {
  salon: SalonCard;
  locale: string;
  index: number;
}

function SalonHeroCard({ salon, locale, index }: SalonHeroCardProps) {
  const t = useTranslations("home") as any;
  const photo = salon.cover_photo_url ?? salon.gallery_urls?.[0] ?? null;
  const showRating = (salon.review_count ?? 0) >= 3;
  const locationParts = [salon.quartier, salon.city_name ?? "Basel"].filter(Boolean);
  const locationText = locationParts.join(", ");

  return (
    <Link
      href={`/${locale}/salon/${salon.slug}`}
      className="flex-shrink-0 rounded-card overflow-hidden bg-white active:opacity-85 transition-opacity duration-100 snap-start"
      style={{
        width: 260,
        border: "1px solid rgba(0,0,0,0.06)",
      }}
      aria-label={salon.name}
    >
      {/* Photo — 3:2 ratio (260×173px) */}
      <div className="relative overflow-hidden" style={{ height: 173 }}>
        {photo ? (
          <img
            src={photo}
            alt={salon.name}
            className="w-full h-full object-cover"
            loading={index < 2 ? "eager" : "lazy"}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: "#EDE8E2" }}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Card content */}
      <div className="px-4 pt-3 pb-4">
        {/* Line 1: Name + Rating badge */}
        <div className="flex items-start justify-between gap-2">
          <span
            className="font-body font-semibold leading-tight truncate"
            style={{ fontSize: 15, color: "#1A1A1A" }}
          >
            {salon.name}
          </span>

          {showRating ? (
            <span
              className="shrink-0 flex items-center gap-0.5 font-body font-medium"
              style={{ fontSize: 13, color: "#1A1A1A" }}
            >
              <Star
                size={11}
                className="fill-s-coral text-s-coral flex-shrink-0"
                aria-hidden="true"
              />
              {salon.average_rating?.toFixed(1)}
            </span>
          ) : (
            <span
              className="shrink-0 font-body font-medium rounded-pill px-2 py-0.5"
              style={{ fontSize: 11, color: "#E8735A", background: "rgba(232,115,90,0.10)" }}
            >
              {t("heroCarousel.newBadge")}
            </span>
          )}
        </div>

        {/* Line 2: Location */}
        <p
          className="mt-0.5 font-body truncate"
          style={{ fontSize: 13, color: "#8A8178" }}
        >
          {locationText}
        </p>

        {/* Line 3: Starting price (only if available) */}
        {salon.min_price != null && (
          <p className="mt-0.5 font-body" style={{ fontSize: 13, color: "#5C5550" }}>
            {t("heroCarousel.fromPrice", { amount: salon.min_price })}
          </p>
        )}
      </div>
    </Link>
  );
}
