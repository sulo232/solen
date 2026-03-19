"use client";

import { Star } from "lucide-react";

interface ReviewBreakdownProps {
  reviews: { rating: number }[];
  averageRating: number;
  reviewCount: number;
  onReviewCountClick?: () => void;
}

export default function ReviewBreakdown({
  reviews,
  averageRating,
  reviewCount,
  onReviewCountClick,
}: ReviewBreakdownProps) {
  const breakdown = [5, 4, 3, 2, 1].map((r) => ({
    r,
    count: reviews.filter((rev) => Math.round(rev.rating) === r).length,
  }));

  return (
    <div className="flex gap-6 items-center">
      <div className="text-center shrink-0">
        <p className="data-text font-bold text-4xl text-dark dark:text-s-dm-text">
          {averageRating.toFixed(1)}
        </p>
        <span className="flex gap-0.5 justify-center">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${i <= Math.round(averageRating) ? "fill-s-coral text-s-coral" : "text-s-ink/20 dark:text-s-dm-text/20"}`}
            />
          ))}
        </span>
        <button
          onClick={onReviewCountClick}
          className="text-xs text-dark/40 dark:text-s-dm-text/40 mt-1 hover:text-s-coral transition-colors"
        >
          {reviewCount} Bewertungen
        </button>
      </div>
      <div className="flex-1 flex flex-col gap-1.5">
        {breakdown.map(({ r, count }) => {
          const pct = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
          return (
            <div key={r} className="flex items-center gap-2 text-xs">
              <span className="text-dark/40 dark:text-s-dm-text/40 w-2">{r}</span>
              <div className="flex-1 h-1.5 bg-s-bg-sunken dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-s-coral rounded-full transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-dark/30 dark:text-s-dm-text/30 w-6 text-right">
                {Math.round(pct)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
