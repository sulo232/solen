// exists-check: net-new vs app/[locale]/_components/salon/SalonReviews.tsx's inline ReviewCard
// (real, shipped, German chrome, byte-identical to every current PDP caller) and this session's
// own app/[locale]/dev/pdp/_overhaul/SalonReviewsOverhaul.tsx ReviewCard (English chrome, but
// scoped to that file, not exported/reusable). This is a small net-new EXTRACTION so the three
// /reviews-directions redesigns (D1/D2/D3) and the /reviews-full page share one English-chrome
// review row instead of three more copy-pasted forks.
"use client";

import * as React from "react";
import type { Review } from "@/app/[locale]/_components/salon/_shared";
import { Avatar, RatingStars } from "@/app/[locale]/_components/primitives";
import { cn } from "@/lib/utils";
import { formatReviewDateEn, reviewText } from "./shared";

/**
 * Shared review row , avatar + name/date, star row, comment with a "Read more" toggle past
 * 200 chars. English chrome (mockup law). `size="sm"` compacts the avatar and clamps the
 * comment to 2 lines with no toggle, for the D2 horizontal peek strip.
 */
export function ReviewCard({
  review,
  size = "md",
}: {
  review: Review;
  size?: "md" | "sm";
}) {
  const text = reviewText(review);
  const [showFull, setShowFull] = React.useState(false);
  const isLong = text.length > 200;
  const displayName = review.profiles?.display_name ?? null;

  return (
    <article>
      <div className="flex items-center gap-3">
        <Avatar
          src={review.profiles?.avatar_url}
          name={displayName ?? "Anonymous"}
          size={size === "sm" ? 36 : 48}
        />
        <div className="min-w-0 flex-1">
          <div className="font-body truncate text-[14px] font-semibold text-s-ink">
            {displayName ?? "Anonymous"}
          </div>
          <div className="font-body mt-0.5 text-[13px] text-s-ink-3">
            {formatReviewDateEn(review.created_at)}
          </div>
        </div>
      </div>

      <RatingStars value={review.rating} mode="five" size="sm" className="mt-2.5" />

      {text && (
        <>
          <p
            className={cn(
              "font-body mt-2.5 text-[14px] leading-relaxed text-s-ink-2",
              size === "sm" ? "line-clamp-2" : !showFull && "line-clamp-3",
            )}
          >
            {text}
          </p>
          {size === "md" && isLong && !showFull && (
            <button
              type="button"
              onClick={() => setShowFull(true)}
              className="font-body mt-1 text-[13px] font-semibold text-s-accent transition-opacity hover:opacity-80"
            >
              Read more
            </button>
          )}
        </>
      )}
    </article>
  );
}
