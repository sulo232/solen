// exists-check: net-new. `npm run exists reviews` (2026-07-24) turns up /salon/[slug]/reviews
// (the real full-reviews sub-page, renders components-legacy/salon/SalonReviews.tsx with NO
// sort/keyword filter row) and MarketplaceReviewsList.tsx (cross-salon list, also no sort/
// filter). Neither has the Google-Maps-style sort-chips + search row R8 asks for , this is the
// net-new piece: a client-side sort + keyword filter over the real review rows. "use client":
// sort key + query are local interactive state, and both must actually re-order/re-filter the
// rendered list (not a dead control).
// ROUND 3 (S2, owner: apply the D3 segmented look to this page too so the section + full page
// read as one system): added a rating-tier TabPill row (same grammar as DirectionSegmented,
// built from `ratingCounts`/`hasIdentity`... only tiers WITH results render) ABOVE the existing
// sort-chip row, each row carrying its own English label ("Sort by" / "Filter by rating") so the
// two rows never read as duplicates. Both stay independently functional and compose (AND). The
// per-row card also now reuses the shared `ReviewCard` (same avatar/name/date/stars/comment
// grammar as the PDP section) instead of a second hand-rolled row, for one consistent card
// treatment across the section and this page.
"use client";

import * as React from "react";
import { Search, Star } from "lucide-react";
import type { Review } from "@/app/[locale]/_components/salon/_shared";
import { TabPill } from "@/app/[locale]/_components/primitives/TabPill";
import { ReviewCard } from "./ReviewCard";
import { ratingCounts, reviewText } from "./shared";

type SortKey = "relevant" | "newest" | "highest" | "lowest";
type Tier = "all" | 5 | 4 | 3 | 2 | 1;

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
  const [tier, setTier] = React.useState<Tier>("all");
  const [query, setQuery] = React.useState("");

  const counts = React.useMemo(() => ratingCounts(reviews), [reviews]);
  const tiers = React.useMemo(() => {
    const list: { key: Tier; count: number }[] = [{ key: "all", count: reviews.length }];
    ([5, 4, 3, 2, 1] as const).forEach((star) => {
      const c = counts[star - 1];
      if (c > 0) list.push({ key: star, count: c });
    });
    return list;
  }, [reviews.length, counts]);

  const q = query.trim().toLowerCase();
  const filtered = reviews
    .filter((r) => (tier === "all" ? true : Math.round(r.rating) === tier))
    .filter((r) => {
      if (!q) return true;
      const name = r.profiles?.display_name?.toLowerCase() ?? "";
      return reviewText(r).toLowerCase().includes(q) || name.includes(q);
    });
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

      <p className="mt-5 font-body text-[12px] font-semibold text-s-ink-3">Filter by rating</p>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tiers.map((t) => (
          <TabPill key={String(t.key)} active={tier === t.key} onClick={() => setTier(t.key)} size="sm">
            {t.key === "all" ? (
              `All (${t.count})`
            ) : (
              <span className="inline-flex items-center gap-1">
                {t.key}
                <Star size={11} strokeWidth={0} aria-hidden className="fill-s-star" />
                {`(${t.count})`}
              </span>
            )}
          </TabPill>
        ))}
      </div>

      <p className="mt-4 font-body text-[12px] font-semibold text-s-ink-3">Sort by</p>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SORT_OPTIONS.map((opt) => (
          <TabPill key={opt.key} active={sort === opt.key} onClick={() => setSort(opt.key)} size="sm">
            {opt.label}
          </TabPill>
        ))}
      </div>

      <p className="mt-4 font-body text-[13px] text-s-ink-3">
        {sorted.length} {sorted.length === 1 ? "review" : "reviews"}
        {q ? ` matching "${query.trim()}"` : ""}
      </p>

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
    </div>
  );
}
