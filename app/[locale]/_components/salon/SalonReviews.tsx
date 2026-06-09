"use client";

import * as React from "react";
import { Star } from "lucide-react";
import type { Review } from "./_shared";
import { formatReviewDate } from "./_shared";
import { Avatar, RatingStars } from "@/app/[locale]/_components/primitives";
import { cn } from "@/lib/utils";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

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
  salonId,
}: {
  average: number | null;
  count: number;
  reviews: Review[];
  /** When the parent passes no review bodies (the salon fetch returns only the
   *  aggregate count), the card self-fetches them client-side. reviews are public-read. */
  salonId?: string;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const [fetched, setFetched] = React.useState<Review[] | null>(null);

  React.useEffect(() => {
    if (reviews.length > 0 || !salonId) return;
    let cancelled = false;
    (async () => {
      try {
        const supabase = createBrowserSupabaseClient();
        const { data, error } = await supabase
          .from("reviews")
          .select("id, rating, comment, created_at")
          .eq("salon_id", salonId)
          .eq("is_hidden", false)
          .order("created_at", { ascending: false })
          .limit(50);
        if (error) throw error;
        if (!cancelled) setFetched((data ?? []) as Review[]);
      } catch (err) {
        console.error("[SalonReviews] review fetch failed:", err);
        if (!cancelled) setFetched([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reviews.length, salonId]);

  const all = reviews.length > 0 ? reviews : fetched ?? [];
  const visible = expanded ? all : all.slice(0, 6);
  const dist = [5, 4, 3, 2, 1].map((s) => all.filter((r) => r.rating === s).length);
  const distMax = all.length || 1;

  return (
    <section id="section-reviews" className="rounded-2xl bg-white shadow-float p-5 md:p-7">
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

      {/* Rating distribution bars (per IMG_5392 ref) — computed from the real ratings. */}
      {all.length > 0 && (
        <div className="mt-5 space-y-1.5">
          {[5, 4, 3, 2, 1].map((star, i) => {
            const pct = (dist[i] / distMax) * 100;
            return (
              <div key={star} className="flex items-center gap-2.5">
                <span className="w-3 text-right font-body text-[12px] tabular-nums text-s-ink-3">
                  {star}
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-s-bg-sunken">
                  <div className="h-full rounded-full bg-s-ink" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-7 text-right font-body text-[12px] tabular-nums text-s-ink-3">
                  {dist[i]}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {all.length === 0 ? (
        // Aggregate without bodies (count > 0) softens to "texts coming"; truly-empty (0) stays.
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
          {all.length > 6 && !expanded && (
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

  // Reviewer name only when a public profile exists. Anonymous/seed reviews show a
  // "Verifizierte Buchung · date" line instead of a repeated placeholder name.
  const displayName = review.profiles?.display_name ?? null;

  return (
    <article>
      {displayName ? (
        <div className="flex items-center gap-2.5">
          <Avatar src={review.profiles?.avatar_url} name={displayName} size={40} />
          <div className="min-w-0 flex-1">
            <div className="font-body truncate text-[13px] font-medium text-s-ink md:text-[14px]">
              {displayName}
            </div>
            <div className="font-body text-[12px] text-s-ink-3">
              {formatReviewDate(review.created_at)}
            </div>
          </div>
        </div>
      ) : (
        <div className="font-body text-[12px] font-medium text-s-ink-3">
          Verifizierte Buchung · {formatReviewDate(review.created_at)}
        </div>
      )}

      {/* Stars */}
      <RatingStars value={review.rating} mode="five" size="md" className="mt-2.5" />

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
