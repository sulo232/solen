"use client";

// exists-check: net-new vs app/[locale]/_components/salon/SalonReviews.tsx (real, unmodified,
// already carries an A/B/C "layout" comparison prop reviewed at /dev/pdp/reviews). `npm run
// exists` for "reviews" (2026-07-24) found SalonReviews + the swipe/collapsed A/B/C directions
// already shipped. This copy adds a FOURTH treatment ("grouped") that: (a) raises the preview
// count 2 -> 3 to satisfy the density floor (CLAUDE.md FLOORS LAW 3: "reviews >= 3 visible"),
// which the current shipped default (2) misses, and (b) separates preview rows with hairline
// dividers so the list reads as ONE grouped set instead of a loose gap-7 stack. The graveyard
// rating-histogram alternative (TASTE_LOG "reviews section content: OPEN") is intentionally NOT
// re-proposed here (dropped per owner, needs an explicit yes) , flagged in the page footnote.

import * as React from "react";
import { Star } from "lucide-react";
import type { Review } from "../../../_components/salon/_shared";
import { formatReviewDateEn } from "./reviews/shared";
import { Avatar, RatingStars, SeeAllButton } from "../../../_components/primitives";
import { cn } from "@/lib/utils";

/**
 * SalonReviewsOverhaul , mockup copy of app/[locale]/_components/salon/SalonReviews.tsx.
 * Summary header (star row + average) is UNCHANGED , that is already the Direction A
 * "summary-first" shape the design diagnosis recommends. The renewed part is the review
 * LIST below it: 3 rows visible (density floor) instead of 2, each separated by a hairline
 * divider (the grouped-list-card grammar already used by SalonServices) instead of a loose
 * gap-7 stack with no visual grouping signal.
 */
export function SalonReviewsOverhaul({
  average,
  count,
  reviews,
}: {
  average: number | null;
  count: number;
  reviews: Review[];
}) {
  const [expanded, setExpanded] = React.useState(false);

  const hasIdentity = (r: Review) =>
    Boolean(r.comment ?? r.comment_de ?? r.comment_en) || Boolean(r.profiles?.display_name);
  const rows = reviews.filter(hasIdentity);
  const previewCount = 3; // was 2 , density floor fix (FLOORS LAW 3)
  const visible = expanded ? rows : rows.slice(0, previewCount);
  const showSeeAll = rows.length > previewCount && !expanded;

  return (
    <section
      id="section-reviews"
      className="rounded-[24px] border border-s-border bg-white shadow-whisper p-5 md:p-7"
    >
      <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
        Reviews
      </h2>

      <div className="mt-4 flex items-center gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star
            key={i}
            size={28}
            stroke="none"
            className={average !== null && i < Math.round(average) ? "fill-s-star" : "fill-s-border"}
          />
        ))}
      </div>
      <span className="font-body mt-2.5 block text-[18px] font-bold tracking-tight text-s-ink">
        {average?.toFixed(1) ?? "-"}
      </span>

      <div className="mt-5 border-t border-s-border" />

      {reviews.length === 0 ? (
        count > 0 ? (
          <p className="font-body mt-5 text-[14px] italic text-s-ink-3">
            Review text coming soon.
          </p>
        ) : (
          <p className="font-body mt-5 text-[14px] italic text-s-ink-3">
            No reviews yet.
          </p>
        )
      ) : (
        <>
          {/* Grouped list , hairline divider BETWEEN rows (not after the last one), so the
              set of reviews reads as one organized group instead of loosely gapped cards. */}
          <div className="mt-6 flex flex-col">
            {visible.map((r) => (
              <div key={r.id} className="border-t border-s-border pt-6 first:border-t-0 first:pt-0 [&+&]:mt-6">
                <ReviewCard review={r} />
              </div>
            ))}
          </div>
          {showSeeAll && (
            <div className="mt-6 flex justify-center">
              <SeeAllButton
                label={`All ${count.toLocaleString("en-CH")} reviews`}
                onClick={() => setExpanded(true)}
              />
            </div>
          )}
        </>
      )}
    </section>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const text = review.comment ?? review.comment_de ?? review.comment_en ?? "";
  const [showFull, setShowFull] = React.useState(false);
  const isLong = text.length > 200;

  const displayName = review.profiles?.display_name ?? null;

  return (
    <article>
      <div className="flex items-center gap-3.5">
        <Avatar src={review.profiles?.avatar_url} name={displayName ?? "Anonymous"} size={56} />
        <div className="min-w-0 flex-1">
          <div className="font-body truncate text-[16px] font-semibold text-s-ink">
            {displayName ?? "Anonymous"}
          </div>
          <div className="font-body mt-0.5 text-[14px] text-s-ink-3">
            {formatReviewDateEn(review.created_at)}
          </div>
        </div>
      </div>

      <RatingStars value={review.rating} mode="five" size="md" className="mt-3" />

      {text && (
        <>
          <p
            className={cn(
              "prose-measure font-body mt-2.5 text-[15px] leading-relaxed text-s-ink-2",
              !showFull && "line-clamp-3"
            )}
          >
            {text}
          </p>
          {isLong && !showFull && (
            <button
              type="button"
              onClick={() => setShowFull(true)}
              className="font-body mt-1 text-[13px] font-medium text-s-accent transition-opacity hover:opacity-80"
            >
              Read more
            </button>
          )}
        </>
      )}
    </article>
  );
}
