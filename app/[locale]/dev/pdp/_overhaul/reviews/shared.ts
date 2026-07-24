// exists-check: `npm run exists reviews` (2026-07-24) confirms the only existing distribution/
// segmented/featured reviews UI is this session's own new files; the real SalonReviews.tsx
// (app/[locale]/_components/salon) stays untouched (mockup law: copy, don't edit shipped
// components). These are pure helpers shared by the three /reviews-directions redesigns (D1
// distribution, D2 featured, D3 segmented) and the /reviews-full page , no JSX, no hooks, so
// this file carries NO "use client" directive and is safe to import from server components too.

import type { Review } from "@/app/[locale]/_components/salon/_shared";

/** Common props every reviews-section direction component takes. */
export interface ReviewsDirectionProps {
  average: number | null;
  count: number;
  reviews: Review[];
  /** Where the "All N reviews" affordance navigates , the /reviews-full mockup (R8). */
  seeAllHref: string;
}

/**
 * Anti-wall filter (ported from the real SalonReviews.tsx, owner rule 2026-06-12): a row with
 * neither a comment nor a reviewer name reads as fake filler in a SHORT curated preview, so the
 * three section directions only preview identity-bearing rows. The graveyard "+N Bewertungen
 * ohne Kommentar" summary line for the REST is not reintroduced anywhere in this session's
 * files (R7) , the silent rows are simply not shown in the compact preview, no count line.
 */
export function hasIdentity(r: Review): boolean {
  return Boolean(r.comment ?? r.comment_de ?? r.comment_en) || Boolean(r.profiles?.display_name);
}

export function reviewText(r: Review): string {
  return r.comment ?? r.comment_de ?? r.comment_en ?? "";
}

/** Star-count histogram, index 0 = 1-star ... index 4 = 5-star. Real, computed from the actual
 *  loaded rows , not a fabricated number. */
export function ratingCounts(reviews: Review[]): number[] {
  const counts = [0, 0, 0, 0, 0];
  reviews.forEach((r) => {
    const idx = Math.min(5, Math.max(1, Math.round(r.rating))) - 1;
    counts[idx] += 1;
  });
  return counts;
}

/**
 * English date label for review chrome (the real `formatReviewDate` in salon/_shared.ts is
 * hardcoded to `de-CH` regardless of locale, which would leave German date words inside these
 * English-chrome mockups , this small net-new formatter keeps the mockup's authored text fully
 * English per the mockup-law brief, without touching the shared production helper).
 */
export function formatReviewDateEn(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
