// exists-check: `npm run exists reviews-directions` (2026-07-24) ran twice this turn , hits only
// this session's own new DirectionSegmented.tsx component and the existing, DIFFERENT
// app/[locale]/dev/pdp/reviews/page.tsx (compares the SHIPPED SalonReviews.tsx's `layout` prop:
// stack/swipe/collapsed, spacing/density tweaks on the SAME summary-first design). R6 asks for
// 3 genuinely DISTINCT content-model redesigns (distribution histogram / featured voice /
// segmented filter) that don't exist as a `layout` prop on the real component and shouldn't ,
// they live as copies in _overhaul/reviews/, per mockup law (never edit a shipped component).
// Renders the REAL reviews of salon "cuts-and-culture" via loadSalonDetailWithStatus, same
// fixture/loader as /dev/pdp/overhaul. Dev-only (notFound in production, matching every other
// /dev/pdp/* route).

import { notFound } from "next/navigation";
import Link from "next/link";
import { loadSalonDetailWithStatus } from "@/lib/salon-detail";
import { DirectionDistribution } from "../_overhaul/reviews/DirectionDistribution";
import { DirectionFeatured } from "../_overhaul/reviews/DirectionFeatured";
import { DirectionSegmented } from "../_overhaul/reviews/DirectionSegmented";
import { cn } from "@/lib/utils";

const FIXTURE_SLUG = "cuts-and-culture";

const DIRECTIONS = [
  {
    key: "1",
    label: "D1 , Distribution",
    title: "Direction 1: Compact summary + rating distribution",
    desc: "Big average + star row, then a 5-bar histogram (5-star down to 1-star) showing WHY it's 4.8, then the 2 best reviews.",
  },
  {
    key: "2",
    label: "D2 , Featured",
    title: "Direction 2: Featured review + snapshot stats",
    desc: "A 3-up stat row (average / total / % 5-star), one highlighted hero review in a quote card, then the rest as a horizontal peek strip.",
  },
  {
    key: "3",
    label: "D3 , Segmented",
    title: "Direction 3: Grouped + segmented filter chips",
    desc: "Rating-tier chips (All / 5 star / 4 star ...) that filter a hairline-divided grouped list below , interaction instead of a static stack.",
  },
] as const;

export default async function ReviewsDirectionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ dir?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const { locale } = await params;
  const sp = await searchParams;
  const dir: "1" | "2" | "3" = sp.dir === "2" ? "2" : sp.dir === "3" ? "3" : "1";

  const result = await loadSalonDetailWithStatus(FIXTURE_SLUG, locale);
  if (!result) notFound();
  const { salon } = result;

  const seeAllHref = `/${locale}/dev/pdp/reviews-full`;
  const directionProps = {
    average: salon.average_rating,
    count: salon.review_count,
    reviews: salon.reviews,
    seeAllHref,
  };
  const active = DIRECTIONS.find((d) => d.key === dir) ?? DIRECTIONS[0];

  return (
    <main className="min-h-screen bg-s-bg-sunken px-4 py-10">
      <div className="mx-auto max-w-[460px]">
        <p className="font-body text-[12px] font-semibold text-s-ink-2">Solen , /dev/pdp/reviews-directions</p>
        <h1 className="mt-1 font-display text-[20px] font-semibold tracking-[-0.01em] text-s-ink">
          Reviews section , 3 redesign directions
        </h1>
        <p className="mt-2 font-body text-[13px] text-s-ink-2">
          Real reviews for &quot;{salon.name}&quot; ({salon.average_rating?.toFixed(1) ?? "-"} average,{" "}
          {salon.review_count} total), loaded live via loadSalonDetailWithStatus. Owner complaint
          grounding this pass: &quot;4.8 and everything reads flat, hard to distinguish between
          things, not grouped.&quot; The &quot;+N without comments&quot; line is gone from all three
          (owner rejected it, R7).
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {DIRECTIONS.map((d) => (
            <Link
              key={d.key}
              href={`?dir=${d.key}`}
              className={cn(
                "rounded-full border px-4 py-2 font-body text-[13px] font-semibold transition-colors",
                dir === d.key
                  ? "border-s-border bg-s-bg-sunken text-s-ink"
                  : "border-s-border bg-white text-s-ink-2 hover:text-s-ink",
              )}
            >
              {d.label}
            </Link>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-s-border bg-white p-4">
          <h2 className="font-body text-[14px] font-semibold text-s-ink">{active.title}</h2>
          <p className="mt-1 font-body text-[13px] text-s-ink-2">{active.desc}</p>
        </div>

        <p className="mt-3 rounded-2xl bg-white px-4 py-3 font-body text-[13px] text-s-ink-2">
          <span className="font-semibold text-s-ink">Recommendation: Direction 1 (Distribution).</span>{" "}
          It answers the &quot;reads flat&quot; complaint most directly , the histogram gives the
          4.8 its own proof (13 five-star, 3 four-star, nothing lower) instead of a bare number.
          It also keeps the compact section glanceable and pushes real interaction (filtering,
          searching) to the dedicated /reviews-full page (R8) instead of overloading the summary.
          D3&apos;s tier chips are the strongest runner-up if the owner wants interaction inline
          on the PDP itself rather than one tap away.
        </p>
      </div>

      <div className="mx-auto mt-8 w-full max-w-[430px] overflow-hidden rounded-2xl border border-s-border bg-white shadow-elevation-2">
        <div className="max-h-[760px] overflow-y-auto bg-white p-4">
          {dir === "1" && <DirectionDistribution {...directionProps} />}
          {dir === "2" && <DirectionFeatured {...directionProps} />}
          {dir === "3" && <DirectionSegmented {...directionProps} />}
        </div>
      </div>
    </main>
  );
}
