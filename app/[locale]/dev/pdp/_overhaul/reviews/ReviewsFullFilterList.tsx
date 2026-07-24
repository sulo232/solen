// exists-check: `npm run exists "reviews-full"` + `npm run exists "FilterChips"` (2026-07-24) ,
// the owner picked direction F2 (FilterChips) out of the 3-way comparison at
// /dev/pdp/reviews-filter (FilterBlockDirections.tsx). This ROUND swaps this page's checkbox+bar
// "Filter by" rows for that same F2 chip grammar (TabPill, no bars) , the bars are RETIRED
// (REMOVED.md). Sort pill + sheet + multi-select tier logic are UNCHANGED, only the filter row's
// markup changed from Checkbox+bar rows to TabPill chips.
"use client";

import * as React from "react";
import { ChevronDown, Star } from "lucide-react";
import type { Review } from "@/app/[locale]/_components/salon/_shared";
import { TabPill } from "@/app/[locale]/_components/primitives/TabPill";
import { ReviewCard } from "./ReviewCard";
import { ReviewsSortSheet, REVIEW_SORT_LABEL, type ReviewSortKey } from "./ReviewsSortSheet";
import { ratingCounts } from "./shared";

/** "Latest" = pure chronological. "Best"/"Worst" sort by rating, tie-broken by recency. */
function sortReviews(reviews: Review[], sort: ReviewSortKey): Review[] {
  const list = [...reviews];
  const byNewest = (a: Review, b: Review) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  switch (sort) {
    case "best":
      return list.sort((a, b) => b.rating - a.rating || byNewest(a, b));
    case "worst":
      return list.sort((a, b) => a.rating - b.rating || byNewest(a, b));
    case "latest":
    default:
      return list.sort(byNewest);
  }
}

export function ReviewsFullFilterList({ reviews }: { reviews: Review[] }) {
  const [sort, setSort] = React.useState<ReviewSortKey>("latest");
  const [sheetOpen, setSheetOpen] = React.useState(false);
  // Empty set = no tier filter applied (all reviews shown). Multi-select: checking 5 and 4
  // shows both tiers (OR, not AND, a review can only be one tier anyway).
  const [selectedTiers, setSelectedTiers] = React.useState<Set<number>>(new Set());

  const counts = React.useMemo(() => ratingCounts(reviews), [reviews]);

  const toggleTier = (star: number) => {
    setSelectedTiers((prev) => {
      const next = new Set(prev);
      if (next.has(star)) next.delete(star);
      else next.add(star);
      return next;
    });
  };

  const filtered =
    selectedTiers.size === 0 ? reviews : reviews.filter((r) => selectedTiers.has(Math.round(r.rating)));
  const sorted = React.useMemo(() => sortReviews(filtered, sort), [filtered, sort]);

  return (
    <div>
      <p className="font-body text-[14px] font-semibold text-s-ink">Filter by</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = counts[star - 1];
          return (
            <TabPill key={star} active={selectedTiers.has(star)} onClick={() => toggleTier(star)} size="sm">
              <span className="inline-flex items-center gap-1">
                {star}
                <Star size={11} strokeWidth={0} aria-hidden className="fill-s-star" />
                {`(${count})`}
              </span>
            </TabPill>
          );
        })}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <span className="font-body text-[13px] text-s-ink-3">
          {sorted.length} {sorted.length === 1 ? "review" : "reviews"}
        </span>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="inline-flex h-11 items-center gap-1 rounded-full border border-s-border bg-white px-4 font-body text-[13px] font-semibold text-s-ink shadow-whisper transition-colors hover:bg-s-bg-sunken"
        >
          {REVIEW_SORT_LABEL[sort]}
          <ChevronDown size={15} strokeWidth={2.2} aria-hidden className="text-s-ink-3" />
        </button>
      </div>

      <div className="mt-4 flex flex-col">
        {sorted.length === 0 ? (
          <p className="py-8 text-center font-body text-[14px] text-s-ink-3">
            No reviews match this filter.
          </p>
        ) : (
          sorted.map((r) => (
            <div key={r.id} className="border-t border-s-border pt-5 first:border-t-0 first:pt-0 [&+&]:mt-5">
              <ReviewCard review={r} />
            </div>
          ))
        )}
      </div>

      <ReviewsSortSheet open={sheetOpen} onOpenChange={setSheetOpen} sort={sort} onSelect={setSort} />
    </div>
  );
}
