// exists-check: net-new. `npm run exists reviews` (2026-07-24) surfaces only the shipped
// SalonReviews.tsx (summary-first, no histogram) and this session's own new files. This is
// direction 1 of the R6 three-direction reviews-section redesign (owner: "4.8 and everything
// reads flat") , grounded in QUESTIONS.md Q24 option B (distribution-led), which a code comment
// flags as needing an explicit un-drop; this task IS that un-drop, scoped to a dev review route,
// nothing shipped. No hooks , stays a plain server component.

import { Star } from "lucide-react";
import { SeeAllButton } from "@/app/[locale]/_components/primitives";
import { RatingDistribution } from "./RatingDistribution";
import { ReviewCard } from "./ReviewCard";
import { hasIdentity, type ReviewsDirectionProps } from "./shared";

/**
 * Direction 1 , Distribution. Big average + star row, then the 5-bar rating histogram (why
 * it's 4.8, not just that it is), then the 2 best identity-bearing reviews, then "All N
 * reviews" routed to the /reviews-full mockup (R8). Answers the owner's "reads flat" complaint
 * directly: the bars are the missing context behind the bare number.
 */
export function DirectionDistribution({ average, count, reviews, seeAllHref }: ReviewsDirectionProps) {
  const rows = reviews.filter(hasIdentity);
  const preview = rows.slice(0, 2);

  return (
    <section className="rounded-[24px] border border-s-border bg-white shadow-whisper p-5 md:p-7">
      <h2 className="font-display text-[20px] font-semibold tracking-[-0.02em] text-s-ink">
        Reviews
      </h2>

      <div className="mt-4 flex items-center gap-4">
        <span className="font-display text-[32px] font-semibold leading-none text-s-ink tabular-nums">
          {average?.toFixed(1) ?? "-"}
        </span>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-0.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star
                key={i}
                size={14}
                stroke="none"
                aria-hidden
                className={average !== null && i < Math.round(average) ? "fill-s-star" : "fill-s-border"}
              />
            ))}
          </div>
          <span className="font-body text-[13px] text-s-ink-3">
            {count.toLocaleString("en-GB")} reviews
          </span>
        </div>
      </div>

      <RatingDistribution reviews={reviews} className="mt-5" />

      {rows.length > 0 && (
        <>
          <div className="mt-5 border-t border-s-border" />
          <div className="mt-5 flex flex-col gap-6">
            {preview.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        </>
      )}

      <div className="mt-6 flex justify-center">
        <SeeAllButton label={`All ${count.toLocaleString("en-GB")} reviews`} href={seeAllHref} />
      </div>
    </section>
  );
}
