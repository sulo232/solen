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

  const salonsWithPhotos = salons.filter(
    (s) => !!s.cover_photo_url || (s.gallery_urls && s.gallery_urls.length > 0)
  );

  // Threshold = 3: all-skeleton or all-real (never mixed)
  const useReal = salonsWithPhotos.length >= 3;

  return (
    <div className="mt-6 -mx-4">
      {/* Section label — always visible */}
      <p
        className="px-6 mb-4 font-body font-semibold text-[12px] uppercase text-s-coral"
        style={{ letterSpacing: "2.5px" }}
      >
        {t("heroCarousel.label")}
      </p>

      {/* Horizontal scroll container — always renders 4 slots */}
      <div
        className="flex gap-4 overflow-x-auto scrollbar-hide px-6 pb-2 snap-x snap-mandatory"
        style={{ WebkitOverflowScrolling: "touch", overscrollBehaviorX: "contain", scrollPaddingLeft: "24px" } as React.CSSProperties}
      >
        {useReal
          ? salonsWithPhotos.slice(0, 8).map((salon, index) => (
              <SalonHeroCard key={salon.id} salon={salon} locale={locale} index={index} />
            ))
          : Array.from({ length: 4 }).map((_, i) => (
              <SkeletonSalonCard key={i} index={i} />
            ))}
      </div>
    </div>
  );
}

// ── Skeleton card (A.3) ────────────────────────────────────────────────────────

function SkeletonSalonCard({ index }: { index: number }) {
  return (
    <div
      className="flex-shrink-0 snap-start"
      aria-hidden="true"
      style={{
        width: 260,
        borderRadius: "16px",
        overflow: "hidden",
        background: "#FFFFFF",
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "none",
        pointerEvents: "none",
      }}
    >
      {/* Photo area — 3:2 skeleton */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: 173,
          borderRadius: "16px 16px 0 0",
          overflow: "hidden",
        }}
      >
        {/* Base gradient */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, #EDE8E2 0%, #E3DDD6 100%)",
          }}
        />
        {/* Shimmer — 2 cycles */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(90deg, transparent 0%, rgba(245,240,235,0.7) 40%, transparent 80%)",
            backgroundSize: "200% 100%",
            animation: `skeletonShimmer 1.8s ease-in-out ${index === 0 ? "2" : "2"} ${index * 0.15}s`,
            animationFillMode: "both",
          }}
        />
        {/* "Demnächst" pill */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(8px)",
            borderRadius: "999px",
            padding: "4px 12px",
            fontSize: "11px",
            fontFamily: "var(--font-body)",
            fontWeight: 500,
            color: "#8A8178",
            whiteSpace: "nowrap",
          }}
        >
          Demnächst
        </div>
      </div>

      {/* Content area — placeholder lines */}
      <div style={{ padding: "12px 16px 16px" }}>
        <div style={{ width: "65%", height: 14, borderRadius: 6, background: "#EDE8E2" }} />
        <div style={{ width: "45%", height: 12, borderRadius: 6, background: "#EDE8E2", marginTop: 8 }} />
        <div style={{ width: "30%", height: 12, borderRadius: 6, background: "#EDE8E2", marginTop: 8 }} />
      </div>
    </div>
  );
}

// ── Real card ────────────────────────────────────────────────────────────────

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
