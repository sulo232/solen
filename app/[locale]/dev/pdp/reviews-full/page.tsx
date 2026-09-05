// exists-check: `npm run exists reviews-full` (2026-07-24) ran this turn , hits only this
// session's own new ReviewsFullFilterList.tsx. The real full-reviews sub-page
// (app/[locale]/salon/[slug]/reviews/page.tsx) renders components-legacy/salon/SalonReviews.tsx,
// which has NO sort/keyword filter row , R8 explicitly asks for a NEW dedicated page grounded
// in Fresha's reviews page + a Google-Maps-style filter row, which is what this route is. Not a
// duplicate of the shipped /salon/[slug]/reviews route (different URL, dev-only, mockup). Real
// reviews of "cuts-and-culture" via loadSalonDetailWithStatus. Dev-only (notFound in production).
//
// ROUND (owner: Fresha reference screenshots for this exact page). Rebuilt to that structure:
// back arrow + a large "Reviews" title (biggest thing on screen), a summary row (one big star +
// bold average + the count in grey parens right after it, not a separate line), then the
// interactive multi-select star-tier checkbox rows (which now double as the rating distribution,
// so the old standalone `RatingDistribution` bars are no longer rendered separately on this
// page), then the sort pill + list. See ReviewsFullFilterList.tsx for the filter/sort logic.

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
import { loadSalonDetailWithStatus } from "@/lib/salon-detail";
import { ReviewsFullFilterList } from "../_overhaul/reviews/ReviewsFullFilterList";

const FIXTURE_SLUG = "cuts-and-culture";

export default async function ReviewsFullPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const { locale } = await params;

  const result = await loadSalonDetailWithStatus(FIXTURE_SLUG, locale);
  if (!result) notFound();
  const { salon } = result;

  return (
    <main className="min-h-screen bg-white">
      <div className="border-b border-s-border bg-s-bg-sunken px-4 py-4 md:px-6">
        <div className="mx-auto max-w-[720px]">
          <p className="font-body text-[12px] font-semibold text-s-ink-2">Solen , /dev/pdp/reviews-full</p>
          <h1 className="mt-1 font-display text-[18px] font-semibold tracking-[-0.01em] text-s-ink">
            Full reviews page (R8) , rebuilt to the owner&apos;s Fresha reference screenshots
          </h1>
          <p className="mt-2 font-body text-[13px] text-s-ink-2">
            This is where the section&apos;s &quot;All {salon.review_count} reviews&quot; pill navigates
            to, instead of expanding inline. Real reviews for &quot;{salon.name}&quot;, loaded live via
            loadSalonDetailWithStatus. The star-tier checkboxes below are multi-select (check 5 and
            4 to see both tiers) and the floating sort pill opens a bottom sheet, both actually
            re-order and re-filter the list. The keyword search from the prior version of this page
            is dropped, the reference has no search box on this screen.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[720px] px-4 py-8 md:px-6">
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/dev/pdp/overhaul#section-reviews`}
            aria-label="Back"
            className="grid h-11 w-11 place-items-center rounded-full border border-s-border bg-white transition-colors hover:bg-s-bg-sunken"
          >
            <ArrowLeft size={20} strokeWidth={2.1} aria-hidden className="text-s-ink" />
          </Link>
          <h2 className="font-display text-[30px] font-semibold tracking-[-0.02em] text-s-ink">Reviews</h2>
        </div>

        <div className="mt-6 flex items-center gap-1.5">
          <Star size={20} stroke="none" aria-hidden className="fill-s-star" />
          <span className="font-display text-[20px] font-bold leading-none text-s-ink tabular-nums">
            {salon.average_rating?.toFixed(1) ?? "-"}
          </span>
          <span className="font-body text-[13px] text-s-ink-2">({salon.review_count})</span>
        </div>

        <div className="mt-7">
          <ReviewsFullFilterList reviews={salon.reviews} />
        </div>
      </div>
    </main>
  );
}
