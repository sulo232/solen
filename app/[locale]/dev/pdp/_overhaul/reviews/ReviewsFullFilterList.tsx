// exists-check: net-new vs the prior version of this same file (single-select TabPill tier +
// sort-chip row, ported wholesale by this ROUND). Owner reviewed the PDP mockup and attached
// Fresha reference screenshots for the dedicated reviews page: a MULTI-select star-tier checkbox
// list (checkbox + digit + proportional bar + count, replacing the single-select TabPill tiers)
// and a floating sort PILL that opens a bottom sheet (replacing the inline sort-chip row), see
// ReviewsSortSheet.tsx. The keyword search box from the prior version is DROPPED here: the
// owner's reference has no search affordance on this page, only the rating checkboxes + sort
// pill, so keeping it would add UI the reference doesn't show. Both controls stay real filters:
// multi-select tiers AND the sort actually re-order/re-filter the rendered list, never dead.
"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import type { Review } from "@/app/[locale]/_components/salon/_shared";
import { Checkbox } from "@/app/[locale]/_components/primitives";
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
  const total = reviews.length;

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
      <div className="mt-3 flex flex-col">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = counts[star - 1];
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const checked = selectedTiers.has(star);
          return (
            <Checkbox
              key={star}
              checked={checked}
              onChange={() => toggleTier(star)}
              className="w-full py-[7px] [&>span:last-child]:min-w-0 [&>span:last-child]:flex-1"
            >
              <span className="flex w-full items-center gap-2.5">
                <span className="w-3 shrink-0 font-body text-[13px] font-semibold text-s-ink-2 tabular-nums">
                  {star}
                </span>
                <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-s-bg-sunken">
                  <span className="block h-full rounded-full bg-s-ink" style={{ width: `${pct}%` }} />
                </span>
                <span className="w-6 shrink-0 text-right font-body text-[13px] text-s-ink-3 tabular-nums">
                  {count}
                </span>
              </span>
            </Checkbox>
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
          <p className="py-8 text-center font-body text-[14px] italic text-s-ink-3">
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
