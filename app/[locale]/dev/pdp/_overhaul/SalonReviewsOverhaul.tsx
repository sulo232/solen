"use client";

// exists-check: net-new vs app/[locale]/_components/salon/SalonReviews.tsx (real, unmodified,
// already carries an A/B/C "layout" comparison prop reviewed at /dev/pdp/reviews). `npm run
// exists` for "reviews" (2026-07-24) found SalonReviews + the swipe/collapsed A/B/C directions
// already shipped. ROUND 3 (S1, owner "I love this D3 segmented look"): the section body now
// renders the approved DirectionSegmented design (rating-tier TabPill filter + hairline-grouped
// list) instead of the earlier "grouped" preview treatment. The "+N without comments" line stays
// gone (R7, owner-deleted) , DirectionSegmented never renders it. "See all" now navigates to the
// dedicated /dev/pdp/reviews-full page (R8) instead of expanding inline.

import { useParams } from "next/navigation";
import type { Review } from "../../../_components/salon/_shared";
import { DirectionSegmented } from "./reviews/DirectionSegmented";

/**
 * SalonReviewsOverhaul , mockup copy of app/[locale]/_components/salon/SalonReviews.tsx.
 * Thin wrapper around the owner-approved DirectionSegmented design: resolves the locale-aware
 * /reviews-full href, then hands off the real props.
 */
export function SalonReviewsOverhaul({
  average,
  count,
  reviews,
}: {
  average: number | null;
  count: number;
  reviews: Review[];
}) {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "de";
  const seeAllHref = `/${locale}/dev/pdp/reviews-full`;

  return (
    <div id="section-reviews">
      <DirectionSegmented average={average} count={count} reviews={reviews} seeAllHref={seeAllHref} />
    </div>
  );
}
