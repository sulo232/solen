"use client";

import * as React from "react";
import { Star } from "lucide-react";
import type { Review } from "./_shared";
import { avatarColor, formatReviewDate } from "./_shared";
import { cn } from "@/lib/utils";

/**
 * SalonReviews — V2-D53.3 (2026-05-11).
 *
 * Big star summary + grid of review cards. No outer borders on cards —
 * Fresha trusts whitespace + dividers. "See all" pill button below
 * expands the visible review list inline.
 *
 * Layout:
 *   • Mobile: single column stack
 *   • Desktop: 2-col grid with generous gap
 *
 * Each card:
 *   • Initial-based colored avatar circle (deterministic per name)
 *   • Name (bold) + date (muted)
 *   • 5-star row
 *   • Comment with line-clamp-3 + "Mehr lesen" toggle when truncated
 *
 * Brand: emerald-text "See all" link per Solen brand. Yellow star fills.
 */
export function SalonReviews({
  average,
  count,
  reviews,
}: {
  average: number | null;
  count: number;
  reviews: Review[];
}) {
  const [expanded, setExpanded] = React.useState(false);
  const visible = expanded ? reviews : reviews.slice(0, 6);

  return (
    <section id="section-reviews" className="rounded-2xl bg-s-bg-sunken p-5 md:p-7">
      {/* V3-D202 (A9): font-body → font-display + Scale B. */}
      <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
        Bewertungen
      </h2>

      {/* Summary row */}
      <div className="mt-4 flex items-baseline gap-2.5">
        <div className="flex items-center gap-0.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star
              key={i}
              size={20}
              fill={average !== null && i < Math.floor(average) ? "#FFC32B" : "#E7E5E4"}
              stroke="none"
            />
          ))}
        </div>
        <span className="font-body text-[18px] font-semibold tracking-tight text-s-ink md:text-[20px]">
          {average?.toFixed(1) ?? "—"}
        </span>
        <span className="font-body text-[13px] text-s-ink-3">
          ({count.toLocaleString("de-CH")})
        </span>
      </div>

      {reviews.length === 0 ? (
        // V3-D214 (verifier #7): contradiction guard. Don't say "Noch keine
        // Bewertungen" when aggregate `count > 0` — that combo is incoherent
        // ("4.8 from 4 reviews · no reviews"). When the seed/server returns an
        // aggregate without review bodies, soften copy to "Bewertungstexte
        // folgen." (rare data-only case). Empty-empty (count = 0) keeps the
        // original copy.
        count > 0 ? (
          <p className="font-body mt-5 text-[14px] italic text-s-ink-3">
            Bewertungstexte folgen.
          </p>
        ) : (
          <p className="font-body mt-5 text-[14px] italic text-s-ink-3">
            Noch keine Bewertungen.
          </p>
        )
      ) : (
        <>
          <div className="mt-6 grid gap-x-10 gap-y-7 md:grid-cols-2 md:gap-y-8">
            {visible.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
          {reviews.length > 6 && !expanded && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="font-body inline-flex items-center rounded-full border border-s-ink bg-white px-8 py-3 text-[14px] font-semibold text-s-ink transition-colors hover:bg-s-ink hover:text-white md:px-10 md:py-3.5 md:text-[15px]"
              >
                Alle ansehen
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const text = review.comment ?? review.comment_de ?? review.comment_en ?? "";
  const [showFull, setShowFull] = React.useState(false);
  const isLong = text.length > 200;

  const displayName = review.profiles?.display_name ?? "Solen-Kund:in";
  const initial = displayName.charAt(0).toUpperCase();
  const colors = avatarColor(displayName);

  return (
    <article>
      <div className="flex items-center gap-2.5">
        <div
          className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full"
          style={{ backgroundColor: colors.bg }}
        >
          {review.profiles?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={review.profiles.avatar_url}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="font-display text-[14px] font-black" style={{ color: colors.fg }}>
              {initial}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-body truncate text-[13px] font-medium text-s-ink md:text-[14px]">
            {displayName}
          </div>
          <div className="font-body text-[11px] text-s-ink-3 md:text-[12px]">
            {formatReviewDate(review.created_at)}
          </div>
        </div>
      </div>

      {/* Stars */}
      <div className="mt-2.5 flex items-center gap-0.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star
            key={i}
            size={13}
            fill={i < Math.floor(review.rating) ? "#FFC32B" : "#E7E5E4"}
            stroke="none"
          />
        ))}
      </div>

      {text && (
        <>
          <p
            className={cn(
              "font-body mt-2.5 text-[14px] leading-relaxed text-s-ink-2",
              !showFull && "line-clamp-3"
            )}
          >
            {text}
          </p>
          {isLong && !showFull && (
            <button
              type="button"
              onClick={() => setShowFull(true)}
              className="font-body mt-1 text-[13px] font-medium text-s-accent transition-opacity hover:opacity-80"
            >
              Mehr lesen
            </button>
          )}
        </>
      )}
    </article>
  );
}
