// exists-check: `npm run exists "reviews-filter"` + `npm run exists "filter by"` (2026-07-24) =
// 0 hits each. The only existing star-tier filter block is this session's own
// ReviewsFullFilterList.tsx (the black-ink-bar version the owner is reacting to on
// /dev/pdp/reviews-full: "weird / too black / monochrome"). These three components are net-new
// DIRECTIONS for that same filter block, compared side by side on /dev/pdp/reviews-filter , they
// do not touch ReviewsFullFilterList.tsx itself (mockup law: the shipped/reviewed direction stays
// put until the owner picks a winner). Same multi-select tier logic, same real reviews + ReviewCard,
// only the visual grammar of the filter block changes per direction.
"use client";

import * as React from "react";
import { Star } from "lucide-react";
import type { Review } from "@/app/[locale]/_components/salon/_shared";
import { Checkbox } from "@/app/[locale]/_components/primitives";
import { TabPill } from "@/app/[locale]/_components/primitives/TabPill";
import { ReviewCard } from "./ReviewCard";
import { ratingCounts } from "./shared";

const TIERS = [5, 4, 3, 2, 1] as const;

function useTierFilter(reviews: Review[]) {
  const [selected, setSelected] = React.useState<Set<number>>(new Set());
  const counts = React.useMemo(() => ratingCounts(reviews), [reviews]);
  const total = reviews.length;

  const toggle = (star: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(star)) next.delete(star);
      else next.add(star);
      return next;
    });
  };

  const filtered = selected.size === 0 ? reviews : reviews.filter((r) => selected.has(Math.round(r.rating)));

  return { selected, toggle, counts, total, filtered };
}

function FilteredList({ reviews }: { reviews: Review[] }) {
  return (
    <div className="mt-5 flex flex-col">
      {reviews.length === 0 ? (
        <p className="py-8 text-center font-body text-[14px] text-s-ink-3">No reviews match this filter.</p>
      ) : (
        reviews.map((r) => (
          <div key={r.id} className="border-t border-s-border pt-5 first:border-t-0 first:pt-0 [&+&]:mt-5">
            <ReviewCard review={r} />
          </div>
        ))
      )}
    </div>
  );
}

/**
 * F1 , Star-weighted. Same checkbox-row anatomy as the current /reviews-full block, but the
 * heavy ink bar is replaced with a light track + a fill in the STAR yellow #FFC32B, the semantic
 * colour reviews already own (rating stars, RatingStars primitive). The digit is paired with a
 * small star glyph so the row reads as "a rating", not a generic chart bar. Counts stay grey.
 * This is the smallest, most literal answer to "too black": swap the one ink surface for the
 * colour the section is already about.
 */
export function FilterStarWeighted({ reviews }: { reviews: Review[] }) {
  const { selected, toggle, counts, total, filtered } = useTierFilter(reviews);

  return (
    <div>
      <p className="font-body text-[14px] font-semibold text-s-ink">Filter by</p>
      <div className="mt-3 flex flex-col">
        {TIERS.map((star) => {
          const count = counts[star - 1];
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <Checkbox
              key={star}
              checked={selected.has(star)}
              onChange={() => toggle(star)}
              className="w-full py-[7px] [&>span:last-child]:min-w-0 [&>span:last-child]:flex-1"
            >
              <span className="flex w-full items-center gap-2">
                <span className="flex w-9 shrink-0 items-center gap-0.5 font-body text-[13px] font-semibold text-s-ink-2 tabular-nums">
                  {star}
                  <Star size={10} strokeWidth={0} aria-hidden className="fill-s-star" />
                </span>
                <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-s-bg-sunken">
                  <span className="block h-full rounded-full bg-s-star" style={{ width: `${pct}%` }} />
                </span>
                <span className="w-6 shrink-0 text-right font-body text-[13px] text-s-ink-3 tabular-nums">
                  {count}
                </span>
              </span>
            </Checkbox>
          );
        })}
      </div>
      <p className="mt-3 font-body text-[13px] text-s-ink-3">
        {filtered.length} {filtered.length === 1 ? "review" : "reviews"}
      </p>
      <FilteredList reviews={filtered} />
    </div>
  );
}

/**
 * F2 , Chips + count. Drops the bar chart entirely. Five compact selectable chips, one per star
 * tier, each carrying its own count. Uses the LOCKED filter-pill grammar (`TabPill`): selected =
 * calm `bg-s-bg-sunken` fill + ink text + semibold, unselected = white + hairline. Reframes the
 * block from "a chart you read" to "a control row you use" , the strongest departure from the
 * current monochrome bar-chart feel.
 */
export function FilterChips({ reviews }: { reviews: Review[] }) {
  const { selected, toggle, counts, filtered } = useTierFilter(reviews);

  return (
    <div>
      <p className="font-body text-[14px] font-semibold text-s-ink">Filter by</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {TIERS.map((star) => {
          const count = counts[star - 1];
          return (
            <TabPill key={star} active={selected.has(star)} onClick={() => toggle(star)} size="sm">
              <span className="inline-flex items-center gap-1">
                {star}
                <Star size={11} strokeWidth={0} aria-hidden className="fill-s-star" />
                {`(${count})`}
              </span>
            </TabPill>
          );
        })}
      </div>
      <p className="mt-4 font-body text-[13px] text-s-ink-3">
        {filtered.length} {filtered.length === 1 ? "review" : "reviews"}
      </p>
      <FilteredList reviews={filtered} />
    </div>
  );
}

/**
 * F3 , Minimal ledger. No bars, no chart. A tight right-aligned numeric ledger, one row per
 * tier: star digit, a static thin hairline rule, the percentage, then the count , hairline-
 * divided rows like a receipt. Only the selected tier(s) gain weight (ink + semibold digit/
 * percentage/count); the rest stay grey. The most restrained option , no chart-reading at all,
 * just numbers a user can select. Selected emphasis is TEXT WEIGHT only (design-contract selected
 * colour stays the calm gray TabPill/checkbox language used by F1/F2; this direction deliberately
 * carries no fill of its own, so there is nothing to recolour).
 */
export function FilterLedger({ reviews }: { reviews: Review[] }) {
  const { selected, toggle, counts, total, filtered } = useTierFilter(reviews);

  return (
    <div>
      <p className="font-body text-[14px] font-semibold text-s-ink">Filter by</p>
      <div className="mt-2 flex flex-col">
        {TIERS.map((star, i) => {
          const count = counts[star - 1];
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const isSelected = selected.has(star);
          return (
            <button
              key={star}
              type="button"
              aria-pressed={isSelected}
              onClick={() => toggle(star)}
              className={`flex w-full items-center gap-3 py-2.5 text-left transition-colors ${
                i > 0 ? "border-t border-s-border" : ""
              }`}
            >
              <span
                className={`w-3 shrink-0 font-body text-[13px] tabular-nums ${
                  isSelected ? "font-semibold text-s-ink" : "text-s-ink-2"
                }`}
              >
                {star}
              </span>
              <span className="h-px min-w-0 flex-1 bg-s-border" />
              <span
                className={`w-8 shrink-0 text-right font-body text-[13px] tabular-nums ${
                  isSelected ? "font-semibold text-s-ink" : "text-s-ink-3"
                }`}
              >
                {pct}%
              </span>
              <span
                className={`w-6 shrink-0 text-right font-body text-[13px] tabular-nums ${
                  isSelected ? "font-semibold text-s-ink" : "text-s-ink-3"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 font-body text-[13px] text-s-ink-3">
        {filtered.length} {filtered.length === 1 ? "review" : "reviews"}
      </p>
      <FilteredList reviews={filtered} />
    </div>
  );
}
