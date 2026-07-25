// exists-check: net-new vs app/[locale]/_components/salon/SalonReviews.tsx's ReviewCard
// (the real PDP review-row grammar this is grounded in: avatar + bold name + grey date +
// five-star row + comment). Not imported directly (that file also owns unrelated tab-filter
// state); this reproduces the same real classes so the reported content reads as the actual
// review, not an invented card. Used 2 ways: read-only context inside the report flow, and
// (with `onReport`) as the realistic Flag-button entry point all 3 directions share.

import { Flag } from "lucide-react";
import { Avatar, RatingStars } from "@/app/[locale]/_components/primitives";
import type { ReportedReview } from "./types";

export function ReviewPreviewCard({
  review,
  onReport,
}: {
  review: ReportedReview;
  /** When present, renders the real ReportButton "row" chrome (h-11 w-11 Flag icon,
   * byte-identical class string to components-legacy/discovery/ReportButton.tsx's
   * VARIANT_CLASS.row) as the entry point into the flow below. */
  onReport?: () => void;
}) {
  return (
    <div className="rounded-card border border-s-border bg-white p-4">
      <div className="flex items-start gap-3">
        <Avatar src={review.authorAvatarUrl} name={review.authorName} size={44} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-semibold text-s-ink">{review.authorName}</p>
          <p className="mt-0.5 text-[14px] text-s-ink-3">{review.createdAtLabel}</p>
        </div>
        {onReport && (
          <button
            type="button"
            onClick={onReport}
            aria-label="Report this review"
            title="Report this review"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-s-ink-3 transition-colors duration-150 hover:bg-s-bg-sunken hover:text-s-ink-2"
          >
            <Flag size={15} strokeWidth={2.1} aria-hidden />
          </button>
        )}
      </div>

      <RatingStars value={review.rating} mode="five" size="md" className="mt-3" />

      <p className="prose-measure mt-2.5 line-clamp-3 text-[14px] leading-relaxed text-s-ink-2">
        {review.comment}
      </p>

      {review.isRepresentative && (
        <p className="mt-2.5 text-[14px] font-semibold text-s-ink-3">
          Representative example, not live data.
        </p>
      )}
    </div>
  );
}
