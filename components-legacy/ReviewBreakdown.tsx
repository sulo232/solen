"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Star } from "lucide-react";
import { useTranslations } from "next-intl";

interface ReviewWithSubs {
  rating: number;
  score_ergebnis?: number | null;
  score_atmosphaere?: number | null;
  score_preis_leistung?: number | null;
}

interface ReviewBreakdownProps {
  reviews: ReviewWithSubs[];
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
  const t = useTranslations("reviews");

  const breakdown = [5, 4, 3, 2, 1].map((r) => ({
    r,
    count: reviews.filter((rev) => Math.round(rev.rating) === r).length,
  }));

  // Calculate sub-category averages (skip nulls)
  const calcAvg = (key: keyof ReviewWithSubs) => {
    const vals = reviews.map(r => r[key]).filter((v): v is number => typeof v === "number" && v > 0);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };

  const subCategories = [
    { label: t("result"), avg: calcAvg("score_ergebnis") },
    { label: t("atmosphere"), avg: calcAvg("score_atmosphaere") },
    { label: t("pricePerformance"), avg: calcAvg("score_preis_leistung") },
  ].filter(({ avg }) => avg > 0);

  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-50px" });

  return (
    <div ref={containerRef}>
      <div className="flex gap-6 items-center">
        <div className="text-center shrink-0">
          <p className="data-text font-bold text-4xl text-s-ink">
            {reviewCount >= 5 ? averageRating.toFixed(1) : t("new")}
          </p>
          <span className="flex gap-0.5 justify-center">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${reviewCount >= 5 && i <= Math.round(averageRating) ? "fill-s-amber text-s-amber" : "text-s-ink/20"}`}
              />
            ))}
          </span>
          <button
            onClick={onReviewCountClick}
            className="text-xs text-s-ink/40 mt-1 hover:text-s-coral transition-colors"
          >
            {reviewCount > 0 ? t("reviewCount", { count: reviewCount }) : t("noReviews")}
          </button>
        </div>
        <div className="flex-1 flex flex-col gap-1.5">
          {breakdown.map(({ r, count }, index) => {
            const pct = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
            return (
              <div key={r} className="flex items-center gap-2 text-xs">
                <span className="text-s-ink/40 w-2">{r}</span>
                <div className="flex-1 h-1.5 bg-s-bg-sunken rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-s-coral rounded-full"
                    initial={{ width: 0 }}
                    animate={isInView ? { width: `${pct}%` } : { width: 0 }}
                    transition={{
                      duration: 0.6,
                      delay: index * 0.08,
                      ease: [0.23, 1, 0.32, 1],
                    }}
                  />
                </div>
                <span className="text-s-ink/30 w-6 text-right">
                  {Math.round(pct)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sub-category averages */}
      {subCategories.length > 0 && (
        <div className="mt-4 pt-4 border-t border-s-ink/5 space-y-2">
          {subCategories.map(({ label, avg }, index) => (
            <div key={label} className="flex items-center gap-3 text-xs">
              <span className="text-s-ink/50 w-24 shrink-0">{label}</span>
              <div className="flex-1 h-1.5 bg-s-bg-sunken rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-s-coral rounded-full"
                  initial={{ width: 0 }}
                  animate={isInView ? { width: `${(avg / 5) * 100}%` } : { width: 0 }}
                  transition={{
                    duration: 0.6,
                    delay: (breakdown.length + index) * 0.08,
                    ease: [0.23, 1, 0.32, 1],
                  }}
                />
              </div>
              <span className="text-s-ink/60 w-6 text-right font-medium">{avg.toFixed(1)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
