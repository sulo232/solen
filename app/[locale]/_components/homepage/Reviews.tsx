"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ChevronRight, Star, Store } from "lucide-react";
import { Section, SectionTitle, SectionFrame, ScrollRow } from "./SectionHeader";
import { formatReviewDate } from "@/app/[locale]/_components/salon/_shared";
import { cn, slugify } from "@/lib/utils";

/**
 * Bewertungen — Fresha-style horizontal carousel (2026-05-14).
 *
 * SUPERSEDES the V2-D47 / V2-D49l vertical-marquee 3-column layout. New
 * pattern matches every other homepage carousel (Coiffeur, LastMinute,
 * Nearby, RecentlyViewed): `Section > SectionFrame > SectionTitle +
 * ScrollRow` — gets the Airbnb-style scroll arrows (V2-D49m) for free
 * via SectionTitle's `scrollRef` prop.
 *
 * V2-D49l SPLIT-TAP preserved: each card has TWO independent click
 * targets — overlay button on card body opens the review (stub: routes
 * to /salon/[slug]/reviews until /api/reviews/featured ships), salon
 * link jumps to /salon/[slug].
 *
 * BACKEND CONTRACT (`/api/reviews/featured?limit=10`, already live):
 *   Returns reviews shaped as { stars, text, initials, name, salonName,
 *   salonSlug, meta }. No fallback data: renders nothing until real reviews load.
 */

interface Review {
  stars: number;
  text: string;
  initials: string;
  name: string;
  meta: string;
  salonName: string;
  salonSlug: string;
}

// Frontend audit 2026-07-08 (FRONTEND_AUDIT_2026-07-08.md, home bucket): the
// hardcoded fallback testimonials here were invented (fake names/quotes on real
// salon slugs) and stayed live indefinitely whenever /api/reviews/featured
// returned empty or errored. Removed; the section now waits for real data and
// renders nothing (see the null-guard below) until reviews actually exist.

export default function Reviews() {
  // 2026-08-27 i18n fix: title + link label were hardcoded German literals, so they
  // rendered German on /en, /fr and /it. Same class the 2026-08-15 sweep caught on
  // WalkInBand and the recently-viewed row.
  const t = useTranslations("home.sections");
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const router = useRouter();
  const locale = useLocale();
  const [reviews, setReviews] = React.useState<Review[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/reviews/featured?limit=10")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        const items: any[] = Array.isArray(data?.items) ? data.items : [];
        if (items.length === 0) return; // stay empty, no fabricated fallback
        const mapped: Review[] = items.map((item) => {
          const name: string = item.reviewer_name ?? "Anonym";
          // Derive initials from the reviewer name (up to 2 chars).
          const initials = name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((w: string) => w[0].toUpperCase())
            .join("");
          // Prefer the real slug from the API; fall back to deriving one from the name.
          const salonName: string = item.salon_name ?? "";
          const salonSlug = item.salon_slug || slugify(salonName);
          // Date-only label (no weekday, no time), in the active locale.
          const meta: string = item.created_at ? formatReviewDate(item.created_at, locale) : "";
          return {
            stars: Math.min(5, Math.max(1, Math.round(item.rating ?? 5))),
            text: item.comment ?? "",
            initials,
            name,
            meta,
            salonName,
            salonSlug,
          };
        });
        setReviews(mapped);
      })
      .catch((err) => {
        console.error("[Reviews] featured fetch failed:", err);
        // stay empty, no fabricated fallback
      });
    return () => { cancelled = true; };
  }, []);

  const openReview = (slug: string) => {
    router.push(`/${locale}/salon/${slug}/reviews`);
  };

  if (reviews.length === 0) return null;

  return (
    <Section>
      <SectionFrame>
        <SectionTitle
          title={t("reviewsTitle")}
          link={{ label: t("reviewsLinkLabel"), href: `/${locale}/reviews` }}
          scrollRef={scrollRef}
        />
        <ScrollRow ref={scrollRef}>
          {reviews.map((r, i) => (
            <ReviewCard
              key={`${r.salonSlug}-${i}`}
              review={r}
              onOpenReview={() => openReview(r.salonSlug)}
            />
          ))}
        </ScrollRow>
      </SectionFrame>
    </Section>
  );
}

function ReviewCard({
  review,
  onOpenReview,
}: {
  review: Review;
  onOpenReview: () => void;
}) {
  const t = useTranslations("home.sections");
  const locale = useLocale();
  // V3-D169 (2026-05-26): split `meta` ("Basel · vor 2 Wochen") so the
  // time-relative portion can sit top-right (Fresha/TexBazar pattern)
  // while the city stays implicit via the salon name below.
  const dateText = review.meta.includes("·") ? (review.meta.split("·").pop() ?? "").trim() : review.meta;

  return (
    <div
      className={cn(
        // V3-D169: card shrunk. 280-300 → 260-280, p-6 → p-4, min-h
        // 320 → 220. Density up = more cards visible per scroll =
        // feels "alive" without any added motion.
        "relative shrink-0 w-[260px] md:w-[280px]",
        "flex flex-col min-h-[220px]",
        "snap-start scroll-snap-align-start",
        "rounded-2xl border bg-s-bg-surface p-4",
        "border-s-border",
        "shadow-elevation-2",
        "transition-[transform,box-shadow] duration-200 ease-glide",
        "hover:-translate-y-[2px] hover:shadow-elevation-3",
        "focus-within:-translate-y-[2px] focus-within:shadow-elevation-3",
      )}
    >
      {/* V2-D49l overlay button — full-card click target for opening review */}
      <button
        type="button"
        onClick={onOpenReview}
        aria-label={t("reviewOpenAria", { name: review.name })}
        className={cn(
          "absolute inset-0 z-0 rounded-2xl",
          "active:scale-[0.98] active:duration-[80ms] transition-transform",
          "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
        )}
      />

      {/* B "person-led" (owner pick 2026-06-29): identity (avatar + name + salon)
          leads as the card header, then stars + date, then the quote. Warmer,
          more human/trustworthy. Avatar bumped 32->40px + name to 14 semibold
          so the person anchors. */}
      <div className="relative mb-3 flex items-center gap-2.5">
        <div
          className="pointer-events-none font-display grid h-10 w-10 shrink-0 place-items-center rounded-full text-[14px] font-semibold text-s-ink-2 bg-s-bg-sunken"
          aria-hidden
        >
          {review.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="pointer-events-none font-body text-[14px] font-semibold leading-[1.2] text-s-ink truncate">
            {review.name}
          </div>
          {/* V2-D49l salon link — secondary tap target, z-10 above overlay */}
          <Link
            href={`/${locale}/salon/${review.salonSlug}`}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Salon ${review.salonName} ansehen`}
            className={cn(
              "relative z-10 mt-0.5 inline-flex items-center gap-1",
              "font-body text-[12px] font-normal text-s-ink-2",
              "transition-colors duration-150 ease-glide hover:text-s-ink",
              "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2 focus-visible:rounded-sm",
            )}
          >
            <Store size={11} strokeWidth={2.25} aria-hidden />
            <span className="truncate max-w-[140px]">{review.salonName}</span>
            <ChevronRight size={11} strokeWidth={2.5} aria-hidden />
          </Link>
        </div>
      </div>

      {/* Stars + date, below the identity header. */}
      <div className="relative pointer-events-none mb-3 flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-[1px]">
          {Array.from({ length: review.stars }).map((_, i) => (
            <Star
              key={i}
              size={12}
              stroke="none"
              aria-hidden
              className="fill-s-star"
            />
          ))}
        </div>
        <span className="shrink-0 font-body text-[12px] font-normal text-s-ink-2 tabular-nums">
          {dateText}
        </span>
      </div>

      {/* Quote , flex-1 fills the rest, line-clamp-3 keeps card heights even. */}
      <p className="relative pointer-events-none flex-1 font-body text-[14px] leading-[1.5] text-s-ink line-clamp-3">
        &ldquo;{review.text}&rdquo;
      </p>
    </div>
  );
}
