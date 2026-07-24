// exists-check: net-new. `npm run exists reviews` (2026-07-24) turns up /salon/[slug]/reviews
// (the real full-reviews sub-page, renders components-legacy/salon/SalonReviews.tsx with NO
// sort/keyword filter row) and MarketplaceReviewsList.tsx (cross-salon list, also no sort/
// filter). Neither has the Google-Maps-style sort-chips + search row R8 asks for , this is the
// net-new piece: a client-side sort + keyword filter over the real review rows. "use client":
// sort key + query are local interactive state, and both must actually re-order/re-filter the
// rendered list (not a dead control).
"use client";

import * as React from "react";
import { Search } from "lucide-react";
import type { Review } from "@/app/[locale]/_components/salon/_shared";
import { Avatar, RatingStars } from "@/app/[locale]/_components/primitives";
import { TabPill } from "@/app/[locale]/_components/primitives/TabPill";
import { formatReviewDateEn, reviewText } from "./shared";

type SortKey = "relevant" | "newest" | "highest" | "lowest";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "relevant", label: "Most relevant" },
  { key: "newest", label: "Newest" },
  { key: "highest", label: "Highest" },
  { key: "lowest", label: "Lowest" },
];

/**
 * "Most relevant" = reviews WITH a comment first (richer signal), ranked by comment length,
 * then the rest by recency , genuinely different ordering from "Newest" (pure chronological,
 * comment or not). "Highest"/"Lowest" sort by the rating value, tie-broken by recency.
 */
function sortReviews(reviews: Review[], sort: SortKey): Review[] {
  const list = [...reviews];
  const byNewest = (a: Review, b: Review) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  switch (sort) {
    case "newest":
      return list.sort(byNewest);
    case "highest":
      return list.sort((a, b) => b.rating - a.rating || byNewest(a, b));
    case "lowest":
      return list.sort((a, b) => a.rating - b.rating || byNewest(a, b));
    case "relevant":
    default:
      return list.sort((a, b) => {
        const diff = reviewText(b).length - reviewText(a).length;
        return diff !== 0 ? diff : byNewest(a, b);
      });
  }
}

export function ReviewsFullFilterList({ reviews }: { reviews: Review[] }) {
  const [sort, setSort] = React.useState<SortKey>("relevant");
  const [query, setQuery] = React.useState("");

  const q = query.trim().toLowerCase();
  const filtered = q
    ? reviews.filter((r) => {
        const name = r.profiles?.display_name?.toLowerCase() ?? "";
        return reviewText(r).toLowerCase().includes(q) || name.includes(q);
      })
    : reviews;
  const sorted = React.useMemo(() => sortReviews(filtered, sort), [filtered, sort]);

  return (
    <div>
      <div className="relative">
        <Search
          size={17}
          strokeWidth={2}
          aria-hidden
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-s-ink-3"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search reviews"
          aria-label="Search reviews by keyword or name"
          className="h-11 w-full rounded-full border border-transparent bg-s-bg-sunken pl-11 pr-4 font-body text-[14px] text-s-ink placeholder:text-s-ink-3"
        />
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SORT_OPTIONS.map((opt) => (
          <TabPill key={opt.key} active={sort === opt.key} onClick={() => setSort(opt.key)} size="sm">
            {opt.label}
          </TabPill>
        ))}
      </div>

      <p className="mt-3 font-body text-[13px] text-s-ink-3">
        {sorted.length} {sorted.length === 1 ? "review" : "reviews"}
        {q ? ` matching "${query.trim()}"` : ""}
      </p>

      <div className="mt-4 flex flex-col">
        {sorted.length === 0 ? (
          <p className="py-8 text-center font-body text-[14px] italic text-s-ink-3">
            No reviews match this search.
          </p>
        ) : (
          sorted.map((r) => {
            const text = reviewText(r);
            const name = r.profiles?.display_name ?? "Anonymous";
            return (
              <div key={r.id} className="border-t border-s-border py-5 first:border-t-0 first:pt-0">
                <div className="flex items-center gap-3">
                  <Avatar src={r.profiles?.avatar_url} name={name} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="font-body truncate text-[14px] font-semibold text-s-ink">{name}</div>
                    <div className="font-body mt-0.5 text-[13px] text-s-ink-3">
                      {formatReviewDateEn(r.created_at)}
                    </div>
                  </div>
                  <RatingStars value={r.rating} mode="five" size="sm" /* psych-ok: per-review star ICONS (mode=five), not a bare average summary, same shape as the real production ReviewCard (SalonReviews.tsx:229) which also carries no count on this mode */ />
                </div>
                {text && (
                  <p className="font-body mt-2.5 text-[14px] leading-relaxed text-s-ink-2">{text}</p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
