// exists-check: net-new vs app/[locale]/_components/salon/SalonReviews.tsx (real, shipped, no
// histogram , TASTE_LOG.md "reviews section content: OPEN, direction A recommended", the
// histogram direction needs an explicit un-drop, which this /reviews-directions D1 task IS) and
// components-legacy/salon/SalonReviews.tsx (legacy dupe, same no-histogram summary). No existing
// distribution/histogram component anywhere in the repo; this is the net-new piece.

import { Star } from "lucide-react";
import type { Review } from "@/app/[locale]/_components/salon/_shared";
import { cn } from "@/lib/utils";
import { ratingCounts } from "./shared";

/**
 * 5-star histogram (Fresha / Google Maps rating-distribution grammar) , five rows, 5-star at
 * the top. Track = the same sunken neutral used everywhere else (`s-bg-sunken`); fill = ink,
 * not the yellow star token, so the bars stay in the 80/17 surfaces+ink budget and the yellow
 * stays reserved for the literal star glyphs (taste rule 4, semantic colour independent of the
 * accent). No hooks , safe inside a server component (D1, the /reviews-full page) or a client
 * one (D3) alike.
 */
export function RatingDistribution({
  reviews,
  className,
}: {
  reviews: Review[];
  className?: string;
}) {
  const counts = ratingCounts(reviews);
  const total = reviews.length;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {[5, 4, 3, 2, 1].map((star) => {
        const count = counts[star - 1];
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={star} className="flex items-center gap-2.5">
            <span className="flex w-8 shrink-0 items-center gap-1 font-body text-[13px] font-semibold text-s-ink-2 tabular-nums">
              {star}
              <Star size={11} strokeWidth={0} className="fill-s-star" aria-hidden />
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-s-bg-sunken">
              <div className="h-full rounded-full bg-s-ink" style={{ width: `${pct}%` }} />
            </div>
            <span className="w-6 shrink-0 text-right font-body text-[13px] text-s-ink-3 tabular-nums">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}
