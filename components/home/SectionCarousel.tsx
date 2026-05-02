"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { ArrowRight } from "lucide-react";
import SignatureLockup from "@/components/ui/SignatureLockup";

/**
 * SectionCarousel — Q50 (locked 2026-05-02) canonical section header + scroll-snap
 * carousel wrapper for the home page.
 *
 * Replaces ad-hoc per-section headers (FeaturedSalonCarousel had its own,
 * BrowseByCitySection had its own, etc.). All Q51 home sections should
 * use this wrapper for visual consistency.
 *
 * Anatomy per Q50:
 *   - Section header: Q48 SignatureLockup (eyebrow + Anton headline) + optional
 *     `→` see-all chevron link
 *   - Children: horizontally scrolling, scroll-snap-x mandatory, gap-3
 *   - Mobile 2.5-up (each child ~40% viewport width), tablet 3.5-up,
 *     desktop 4.5-up. Snap stop = each child.
 *
 * Usage:
 *   <SectionCarousel eyebrow="Top in Basel" headline="Top bewertet" seeAllHref="/de/coiffeur">
 *     {salons.map(s => <SalonCard key={s.id} salon={s} />)}
 *   </SectionCarousel>
 *
 * Caller controls child sizing via `childWidthClass` (defaults to mobile 2.5-up
 * Airbnb pattern). Each child should set `snap-start shrink-0`.
 */
interface SectionCarouselProps {
  eyebrow?: string;
  headline: string;
  /** Optional href for the section header `→` see-all link */
  seeAllHref?: string;
  /** Children rendered as scroll-snap children. Caller adds `snap-start shrink-0` + width class. */
  children: React.ReactNode;
  /** Class applied to the inner scroll container — override gap or padding if needed. */
  innerClassName?: string;
  className?: string;
}

export default function SectionCarousel({
  eyebrow,
  headline,
  seeAllHref,
  children,
  innerClassName,
  className,
}: SectionCarouselProps) {
  const locale = useLocale();
  const fullSeeAllHref = seeAllHref?.startsWith("/")
    ? `/${locale}${seeAllHref}`
    : seeAllHref;

  return (
    <section className={["px-5 md:px-10 lg:px-20", className ?? ""].join(" ")} aria-label={headline}>
      <div className="flex items-end justify-between gap-3 mb-4">
        <SignatureLockup eyebrow={eyebrow} headline={headline} size="md" as="h2" />
        {fullSeeAllHref && (
          <Link
            href={fullSeeAllHref}
            className="shrink-0 inline-flex items-center gap-1 font-body text-[12px] font-semibold text-s-coral-text hover:text-s-coral transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-coral focus-visible:ring-offset-2 rounded-md"
          >
            Alle
            <ArrowRight size={14} aria-hidden />
          </Link>
        )}
      </div>
      <div
        className={[
          "flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2",
          // Hide horizontal scrollbar (visually) — keyboard scroll still works
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          // Negative margin pulls scroll into the page padding so peek shows
          "-mx-5 md:-mx-10 lg:-mx-20 px-5 md:px-10 lg:px-20",
          innerClassName ?? "",
        ].join(" ")}
      >
        {children}
      </div>
    </section>
  );
}
