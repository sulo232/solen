"use client";

import { useState } from "react";
import Link from "next/link";
import { Store, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Avatar, RatingStars } from "@/app/[locale]/_components/primitives";

/**
 * MarketplaceReviewsList — cross-salon aggregate review list for /reviews.
 *
 * REUSES the review-card visual language from /salon/[slug]/reviews
 * (components-legacy/salon/SalonReviews.tsx): avatar circle (s-accent-pale
 * + initial), name, 5-star row (fill-s-star), comment with read-more
 * truncation, date. The ONLY addition over the salon-scoped card is a
 * salon-link row — on the marketplace page each review must point back to
 * its salon's reviews page, which the per-salon card never needed.
 *
 * Client component because the read-more toggle is per-card local state,
 * matching the salon card's `expandedReviews` behaviour.
 */

export interface MarketplaceReview {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer_name: string;
  reviewer_avatar: string | null;
  salon_slug: string;
  salon_name: string;
}

function ReviewCard({
  review,
  locale,
}: {
  review: MarketplaceReview;
  locale: string;
}) {
  const t = useTranslations("reviewsPage");
  const [expanded, setExpanded] = useState(false);
  const needsTruncation = review.comment.length > 150;
  const displayText =
    !expanded && needsTruncation
      ? review.comment.slice(0, 150) + "…"
      : review.comment;

  return (
    <article className="border border-s-ink/5 rounded-[16px] p-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar src={review.reviewer_avatar} name={review.reviewer_name} size="xs" />
          <span className="text-sm font-medium text-s-ink truncate">
            {review.reviewer_name}
          </span>
        </div>
        <RatingStars value={review.rating} mode="five" size="sm" />
      </div>

      <p className="text-sm text-s-ink/70 leading-relaxed">
        {displayText}
        {needsTruncation && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="ml-1 text-s-ink-2 font-medium hover:text-s-ink hover:underline"
          >
            {expanded ? t("readLess") : t("readMore")}
          </button>
        )}
      </p>

      {/* Salon link — the one affordance the marketplace card adds over the
          per-salon card. Mirrors the homepage Reviews card's Store + name. */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <Link
          href={`/${locale}/salon/${review.salon_slug}/reviews`}
          className="inline-flex items-center gap-1.5 min-w-0 text-[13px] font-medium text-s-ink-2 transition-colors duration-150 hover:text-s-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-accent focus-visible:ring-offset-2 rounded-md"
        >
          <Store size={13} strokeWidth={2.25} aria-hidden />
          <span className="truncate">{review.salon_name}</span>
          <ChevronRight size={13} strokeWidth={2.5} aria-hidden className="shrink-0" />
        </Link>
        <span className="shrink-0 text-xs text-s-ink/30 tabular-nums">
          {new Date(review.created_at).toLocaleDateString(
            locale === "de" ? "de-CH" : locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : "en-GB"
          )}
        </span>
      </div>
    </article>
  );
}

export default function MarketplaceReviewsList({
  reviews,
  locale,
}: {
  reviews: MarketplaceReview[];
  locale: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      {reviews.map((r) => (
        <ReviewCard key={r.id} review={r} locale={locale} />
      ))}
    </div>
  );
}
