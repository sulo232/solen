// exists-check: net-new. `npm run exists reviews` (2026-07-24) surfaces only the shipped
// SalonReviews.tsx (no featured-review treatment) and this session's own new files. Direction 2
// of the R6 three-direction reviews-section redesign , grounded in QUESTIONS.md Q24 option C
// (featured-voice) plus a snapshot stat row for the "everything reads flat" complaint. No
// hooks in this file itself , stays a plain server component (ReviewCard, its child, is the
// client boundary).

import { Quote } from "lucide-react";
import { Avatar, RatingStars, SeeAllButton } from "@/app/[locale]/_components/primitives";
import { ReviewCard } from "./ReviewCard";
import { hasIdentity, reviewText, type ReviewsDirectionProps } from "./shared";
import type { Review } from "@/app/[locale]/_components/salon/_shared";

/** Picks the most substantial 5-star review (longest comment); falls back to the longest
 *  comment overall when there's no 5-star row. Deterministic from real data, not invented. */
function pickFeatured(rows: Review[]): Review | null {
  if (rows.length === 0) return null;
  const fiveStar = rows.filter((r) => r.rating === 5);
  const pool = fiveStar.length > 0 ? fiveStar : rows;
  return pool.reduce((longest, r) => (reviewText(r).length > reviewText(longest).length ? r : longest), pool[0]);
}

/**
 * Direction 2 , Featured. A 3-up snapshot stat row (average / total / % 5-star, all computed
 * from the real rows), then one highlighted "hero" review in a quote card on the sunken tray
 * (floors-law edge-visibility , no photo anchor on white needs the tray), then the remaining
 * reviews as a horizontal peek strip. Leads with a human voice instead of a chart.
 */
export function DirectionFeatured({ average, count, reviews, seeAllHref }: ReviewsDirectionProps) {
  const rows = reviews.filter(hasIdentity);
  const featured = pickFeatured(rows);
  const rest = rows.filter((r) => r.id !== featured?.id);
  const fiveStarShare =
    reviews.length > 0 ? Math.round((reviews.filter((r) => r.rating === 5).length / reviews.length) * 100) : 0;

  return (
    <section className="rounded-[24px] border border-s-border bg-white shadow-whisper p-5 md:p-7">
      <h2 className="font-display text-[20px] font-semibold tracking-[-0.02em] text-s-ink">
        Reviews
      </h2>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div>
          <span className="block font-display text-[32px] font-semibold leading-none text-s-ink tabular-nums">
            {average?.toFixed(1) ?? "-"}
          </span>
          <span className="mt-1 block font-body text-[13px] text-s-ink-3">Average</span>
        </div>
        <div>
          <span className="block font-display text-[20px] font-semibold leading-none text-s-ink tabular-nums">
            {count}
          </span>
          <span className="mt-1 block font-body text-[13px] text-s-ink-3">Reviews</span>
        </div>
        <div>
          <span className="block font-display text-[20px] font-semibold leading-none text-s-ink tabular-nums">
            {fiveStarShare}%
          </span>
          <span className="mt-1 block font-body text-[13px] text-s-ink-3">5-star</span>
        </div>
      </div>

      {featured ? (
        <div className="mt-5 rounded-2xl bg-s-bg-sunken p-4">
          <Quote size={18} strokeWidth={2} className="text-s-ink-3" aria-hidden />
          <p className="mt-2 font-body text-[14px] leading-relaxed text-s-ink">{reviewText(featured)}</p>
          <div className="mt-3 flex items-center gap-3">
            <Avatar
              src={featured.profiles?.avatar_url}
              name={featured.profiles?.display_name ?? "Anonymous"}
              size={36}
            />
            <div className="min-w-0 flex-1">
              <div className="font-body truncate text-[14px] font-semibold text-s-ink">
                {featured.profiles?.display_name ?? "Anonymous"}
              </div>
            </div>
            <RatingStars value={featured.rating} mode="five" size="sm" /* psych-ok: per-review star ICONS (mode=five), not a bare average, same shape as the real production ReviewCard (SalonReviews.tsx:229) which also carries no count on this mode */ />
          </div>
        </div>
      ) : (
        <p className="font-body mt-5 text-[14px] text-s-ink-3">Review text coming soon.</p>
      )}

      {rest.length > 0 && (
        <div
          className="mt-5 -mx-5 flex gap-3 overflow-x-auto px-5 pb-1 md:-mx-7 md:px-7 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ scrollSnapType: "x proximity" }}
        >
          {rest.map((r) => (
            <div
              key={r.id}
              className="w-[72%] shrink-0 rounded-2xl border border-s-border bg-white p-3.5 sm:w-[48%]"
              style={{ scrollSnapAlign: "start" }}
            >
              <ReviewCard review={r} size="sm" />
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex justify-center">
        <SeeAllButton label={`All ${count} reviews`} href={seeAllHref} />
      </div>
    </section>
  );
}
