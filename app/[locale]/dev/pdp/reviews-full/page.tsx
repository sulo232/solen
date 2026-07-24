// exists-check: `npm run exists reviews-full` (2026-07-24) ran this turn , hits only this
// session's own new ReviewsFullFilterList.tsx. The real full-reviews sub-page
// (app/[locale]/salon/[slug]/reviews/page.tsx) renders components-legacy/salon/SalonReviews.tsx,
// which has NO sort/keyword filter row , R8 explicitly asks for a NEW dedicated page grounded
// in Fresha's reviews page + a Google-Maps-style filter row, which is what this route is. Not a
// duplicate of the shipped /salon/[slug]/reviews route (different URL, dev-only, mockup). Real
// reviews of "cuts-and-culture" via loadSalonDetailWithStatus. Dev-only (notFound in production).

import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import { loadSalonDetailWithStatus } from "@/lib/salon-detail";
import { RatingDistribution } from "../_overhaul/reviews/RatingDistribution";
import { ReviewsFullFilterList } from "../_overhaul/reviews/ReviewsFullFilterList";

const FIXTURE_SLUG = "cuts-and-culture";

export default async function ReviewsFullPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  await params;

  const result = await loadSalonDetailWithStatus(FIXTURE_SLUG);
  if (!result) notFound();
  const { salon } = result;

  return (
    <main className="min-h-screen bg-white">
      <div className="border-b border-s-border bg-s-bg-sunken px-4 py-4 md:px-6">
        <div className="mx-auto max-w-[720px]">
          <p className="font-body text-[12px] font-semibold text-s-ink-3">Solen , /dev/pdp/reviews-full</p>
          <h1 className="mt-1 font-display text-[18px] font-semibold tracking-[-0.01em] text-s-ink">
            Full reviews page (R8) , grounded in Fresha&apos;s reviews page + a Google Maps style
            filter row
          </h1>
          <p className="mt-2 font-body text-[13px] text-s-ink-2">
            This is where the section&apos;s &quot;All {salon.review_count} reviews&quot; pill should
            navigate, instead of expanding inline (see /dev/pdp/reviews-directions). Real reviews
            for &quot;{salon.name}&quot;, loaded live via loadSalonDetailWithStatus. The sort chips
            and the keyword search below actually re-order and re-filter the list , try
            &quot;Fade&quot; or switch to Lowest.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[720px] px-4 py-8 md:px-6">
        <div className="flex items-end gap-4">
          <span className="font-display text-[44px] font-semibold leading-none text-s-ink tabular-nums">
            {salon.average_rating?.toFixed(1) ?? "-"}
          </span>
          <div className="flex flex-col gap-1 pb-1">
            <div className="flex items-center gap-0.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star
                  key={i}
                  size={18}
                  stroke="none"
                  aria-hidden
                  className={
                    salon.average_rating != null && i < Math.round(salon.average_rating)
                      ? "fill-s-star"
                      : "fill-s-border"
                  }
                />
              ))}
            </div>
            <span className="font-body text-[14px] text-s-ink-3">{salon.review_count} reviews</span>
          </div>
        </div>

        <RatingDistribution reviews={salon.reviews} className="mt-6 max-w-[360px]" />

        <div className="mt-8 border-t border-s-border pt-8">
          <ReviewsFullFilterList reviews={salon.reviews} />
        </div>
      </div>
    </main>
  );
}
