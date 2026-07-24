// exists-check: net-new. `npm run exists reviews` (2026-07-24) surfaces the shipped
// SalonReviews.tsx (no segmentation/filter chips at the section level) and this session's own
// new files. Direction 3 of the R6 three-direction reviews-section redesign , answers the
// owner's OTHER named complaint ("hard to distinguish between things, not grouped") with a
// rating-tier TabPill row (the LOCKED selected-pill grammar, gray sunken fill, never blue/ink)
// that actually filters the preview list below it. Client component: local `active` tier state.
"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { SeeAllButton } from "@/app/[locale]/_components/primitives";
import { TabPill } from "@/app/[locale]/_components/primitives/TabPill";
import { ReviewCard } from "./ReviewCard";
import { hasIdentity, ratingCounts, type ReviewsDirectionProps } from "./shared";

type Tier = "all" | 5 | 4 | 3 | 2 | 1;

/**
 * Direction 3 , Segmented. A compact summary line, then rating-tier chips ("All", "5 star",
 * "4 star" ...) built ONLY for tiers that actually have reviews, filtering a hairline-divided
 * grouped list below (the §427 grammar, not a loose gap-stack). Interaction over decoration:
 * this is the direction that makes "distinguish between things" literal , tap a tier, see only
 * that tier.
 */
export function DirectionSegmented({ average, count, reviews, seeAllHref }: ReviewsDirectionProps) {
  const rows = React.useMemo(() => reviews.filter(hasIdentity), [reviews]);
  const counts = React.useMemo(() => ratingCounts(reviews), [reviews]);

  const tiers = React.useMemo(() => {
    const list: { key: Tier; count: number }[] = [{ key: "all", count: rows.length }];
    ([5, 4, 3, 2, 1] as const).forEach((star) => {
      const c = counts[star - 1];
      if (c > 0) list.push({ key: star, count: c });
    });
    return list;
  }, [rows.length, counts]);

  const [active, setActive] = React.useState<Tier>("all");
  const filtered = active === "all" ? rows : rows.filter((r) => Math.round(r.rating) === active);
  const visible = filtered.slice(0, 3);

  return (
    <section className="rounded-[24px] border border-s-border bg-white shadow-whisper p-5 md:p-7">
      <h2 className="font-display text-[20px] font-semibold tracking-[-0.02em] text-s-ink">
        Reviews
      </h2>

      <div className="mt-4 flex items-center gap-2">
        <span className="font-display text-[32px] font-semibold leading-none text-s-ink tabular-nums">
          {average?.toFixed(1) ?? "-"}
        </span>
        <Star size={16} stroke="none" aria-hidden className="fill-s-star" />
        <span className="font-body text-[13px] text-s-ink-3">{count} reviews</span>
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tiers.map((t) => (
          <TabPill key={String(t.key)} active={active === t.key} onClick={() => setActive(t.key)} size="sm">
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

      <div className="mt-5 flex flex-col">
        {visible.length === 0 ? (
          <p className="font-body text-[14px] italic text-s-ink-3">No reviews in this group yet.</p>
        ) : (
          visible.map((r) => (
            <div key={r.id} className="border-t border-s-border pt-5 first:border-t-0 first:pt-0 [&+&]:mt-5">
              <ReviewCard review={r} />
            </div>
          ))
        )}
      </div>

      <div className="mt-6 flex justify-center">
        <SeeAllButton label={`All ${count} reviews`} href={seeAllHref} />
      </div>
    </section>
  );
}
