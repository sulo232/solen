"use client";

import * as React from "react";
import { Star } from "lucide-react";
import type { Review } from "./_shared";
import { formatReviewDate } from "./_shared";
import { Avatar, RatingStars, SeeAllButton } from "@/app/[locale]/_components/primitives";
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
  salonSlug,
  locale,
}: {
  average: number | null;
  count: number;
  reviews: Review[];
  /** When the parent passes no review bodies (the salon fetch returns only the
   *  aggregate count), the card self-fetches them client-side. reviews are public-read. */
  salonId?: string;
  /** With slug+locale, "Alle ansehen" navigates to the full reviews view (Fresha
   *  reviews-portfolio-tap capture) instead of expanding inline. */
  salonSlug?: string;
  locale?: string;
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
          .select("id, rating, comment, created_at, profiles(display_name, avatar_url)")
          .eq("salon_id", salonId)
          .eq("is_hidden", false)
          .order("created_at", { ascending: false })
          .limit(50);
        if (error) throw error;
        if (!cancelled) setFetched((data ?? []) as unknown as Review[]);
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
  // Anti-wall (owner 2026-06-12): a list of identical "Anonym + 5 stars, no text"
  // rows reads fake. Rows = reviews with TEXT or a real name; rating-only
  // anonymous reviews collapse into one honest count line below the list.
  const hasIdentity = (r: Review) =>
    Boolean(r.comment ?? r.comment_de ?? r.comment_en) || Boolean(r.profiles?.display_name);
  const rows = all.filter(hasIdentity);
  const silentCount = all.length - rows.length;
  const visible = expanded ? rows : rows.slice(0, 6);

  return (
    <section id="section-reviews" className="rounded-2xl bg-white shadow-float p-5 md:p-7">
      {/* V3-D202 (A9): font-body → font-display + Scale B. */}
      <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
        Bewertungen
      </h2>

      {/* Summary — Fresha PDP capture (pdp-bottom, 2026-06-12): big star row, then
          "4,9 (3'249)" with the COUNT in accent (review counts are THE blue case,
          LOCKFILE §1.5 v3). No histogram on Fresha mobile — dropped per owner. */}
      <div className="mt-4 flex items-center gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star
            key={i}
            size={28}
            stroke="none"
            className={average !== null && i < Math.round(average) ? "fill-s-star" : "fill-s-border"}
          />
        ))}
      </div>
      <div className="mt-2.5 flex items-baseline gap-1.5">
        <span className="font-body text-[18px] font-bold tracking-tight text-s-ink">
          {average?.toFixed(1) ?? "—"}
        </span>
        <span className="font-body text-[16px] font-medium text-s-accent">
          ({count.toLocaleString("de-CH")})
        </span>
      </div>

      <div className="mt-5 border-t border-s-border" />


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
          <div className="mt-6 flex flex-col gap-7">
            {visible.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
          {silentCount > 0 && (
            <p className="mt-5 font-body text-[13.5px] text-s-ink-3">
              {rows.length > 0 ? "+ " : ""}{silentCount} {silentCount === 1 ? "Bewertung" : "Bewertungen"} ohne Kommentar
            </p>
          )}
          {rows.length > 6 && !expanded && (
            <div className="mt-6 flex justify-center">
              {/* mockup-ok: SeeAllButton port, byte-identical pill class string, same instance as
                  SalonServices/SalonTeam on this page (P2 fix, owner-approved 2026-07-15) */}
              {salonSlug && locale ? (
                <SeeAllButton label="Alle ansehen" href={`/${locale}/salon/${salonSlug}/reviews`} />
              ) : (
                <SeeAllButton label="Alle ansehen" onClick={() => setExpanded(true)} />
              )}
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
      {/* Fresha row anatomy (pdp-bottom capture): avatar disc + NAME 16/600 with
          the grey date stacked under, star row below, text below. Anonymous reviews
          show "Anonym" (the established label on /reviews). */}
      <div className="flex items-center gap-3.5">
        <Avatar src={review.profiles?.avatar_url} name={displayName ?? "Anonym"} size={56} />
        <div className="min-w-0 flex-1">
          <div className="font-body truncate text-[16px] font-semibold text-s-ink">
            {displayName ?? "Anonym"}
          </div>
          <div className="font-body mt-0.5 text-[14px] text-s-ink-3">
            {formatReviewDate(review.created_at)}
          </div>
        </div>
      </div>

      {/* Stars */}
      <RatingStars value={review.rating} mode="five" size="md" className="mt-3" />

      {text && (
        <>
          {/* ig7 (2026-07-17): shared .prose-measure (68ch) caps the line length,
              matching SalonAbout.tsx (same utility, same rationale) - the review
              body was rendering with no width cap at all before this. */}
          <p
            className={cn(
              "prose-measure font-body mt-2.5 text-[15px] leading-relaxed text-s-ink-2",
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
