"use client";

import Link from "next/link";
import type { SalonCard as SalonCardType } from "@/lib/types";
import SalonCard from "@/components/SalonCard";

interface CityCarouselSectionProps {
  title: string;
  salons: SalonCardType[];
  locale: string;
  viewAllLabel?: string;
  viewAllHref?: string;
  onViewAll?: () => void;
  favoriteIds: Set<string>;
  onFavoriteToggle: (id: string) => void;
}

export default function CityCarouselSection({
  title,
  salons,
  locale,
  viewAllLabel,
  viewAllHref,
  onViewAll,
  favoriteIds,
  onFavoriteToggle,
}: CityCarouselSectionProps) {
  if (salons.length === 0) return null;

  return (
    <section className="pb-8">
      {/* Section header — extrabold clamp heading, title is a clickable link */}
      <div className="max-w-5xl mx-auto px-6 mb-4 flex items-end justify-between gap-4">
        {viewAllHref ? (
          <Link
            href={viewAllHref}
            onClick={onViewAll}
            className="font-heading font-extrabold text-s-ink dark:text-s-dm-text hover:text-s-coral dark:hover:text-s-coral transition-colors duration-150 leading-none"
            style={{ fontSize: "clamp(24px, 3.5vw, 42px)", letterSpacing: "-0.02em" }}
          >
            {title}
          </Link>
        ) : (
          <h2
            className="font-heading font-extrabold text-s-ink dark:text-s-dm-text leading-none"
            style={{ fontSize: "clamp(24px, 3.5vw, 42px)", letterSpacing: "-0.02em" }}
          >
            {title}
          </h2>
        )}
        {viewAllLabel && salons.length > 2 && (
          viewAllHref ? (
            <Link
              href={viewAllHref}
              onClick={onViewAll}
              className="group font-heading font-semibold text-[13px] text-s-ink/50 hover:text-s-coral dark:text-s-dm-text/50 dark:hover:text-s-coral transition-colors shrink-0 pb-1"
            >
              {viewAllLabel} <span className="inline-block transition-transform duration-150 group-hover:translate-x-1">→</span>
            </Link>
          ) : (
            <span
              className="group font-heading font-semibold text-[13px] text-s-ink/50 hover:text-s-coral dark:text-s-dm-text/50 dark:hover:text-s-coral transition-colors cursor-pointer shrink-0 pb-1"
              onClick={onViewAll}
            >
              {viewAllLabel} <span className="inline-block transition-transform duration-150 group-hover:translate-x-1">→</span>
            </span>
          )
        )}
      </div>

      {/* Horizontal scroll — snap-x, each card is w-[280px] md:w-[320px] */}
      <div
        className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide"
        style={{
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
          padding: "0 24px 8px",
          scrollPaddingLeft: "24px",
          overscrollBehaviorX: "contain",
        } as React.CSSProperties}
      >
        {salons.map((salon) => (
          <div
            key={salon.id}
            className="flex-shrink-0 snap-start w-[280px] md:w-[320px]"
          >
            <SalonCard
              salon={salon}
              locale={locale}
              isFavorited={favoriteIds.has(salon.id)}
              onFavoriteToggle={onFavoriteToggle}
              animated={false}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
