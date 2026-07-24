"use client";

import * as React from "react";
import { Star } from "lucide-react";
import type { Review } from "./_shared";
import { formatReviewDate } from "./_shared";
import { Avatar, RatingStars, SeeAllButton } from "@/app/[locale]/_components/primitives";
import { TabPill } from "../primitives/TabPill";
import { cn } from "@/lib/utils";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

/**
 * SalonReviews, D3 "Segmented" (2026-07-24 PORT, owner "I love this D3 segmented
 * look", ref _overhaul/reviews/DirectionSegmented.tsx). A compact summary line
 * (star + average + grey count), then rating-tier TabPill chips (built only for
 * tiers that actually have reviews) filtering a hairline-divided list capped at 3
 * rows below. "Alle N Bewertungen" always navigates to the real full reviews page,
 * never an inline expand, and the old "+N ohne Kommentar" line is gone (owner
 * deleted it, logged in REMOVED.md).
 *
 * Each card:
 *   • Initial-based colored avatar circle (deterministic per name)
 *   • Name (bold) + date (muted)
 *   • 5-star row
 *   • Comment with line-clamp-3 + "Mehr lesen" toggle when truncated
 */
type Tier = "all" | 5 | 4 | 3 | 2 | 1;

export function SalonReviews({
  average,
  count,
  reviews,
  salonId,
  salonSlug,
  locale,
  layout = "stack",
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
  /**
   * Retired (2026-07-24 D3 port): the stack/swipe/collapsed A/B/C comparison is
   * superseded by the one approved Segmented design below, which now renders
   * unconditionally. Kept, unused-by-render, only so app/[locale]/dev/pdp/reviews/page.tsx
   * (left as reference, not deleted) still compiles , same pattern as SalonCard's
   * `nextSlotLabel`.
   */
  layout?: "stack" | "swipe" | "collapsed";
}) {
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

  const all = React.useMemo(() => (reviews.length > 0 ? reviews : fetched ?? []), [reviews, fetched]);
  // Anti-wall (owner 2026-06-12): a list of identical "Anonym + 5 stars, no text"
  // rows reads fake. Rows = reviews with TEXT or a real name; rating-only
  // anonymous reviews are simply not shown in the compact preview (no separate
  // count line for them, owner-deleted, logged in REMOVED.md).
  const hasIdentity = (r: Review) =>
    Boolean(r.comment ?? r.comment_de ?? r.comment_en) || Boolean(r.profiles?.display_name);
  const rows = React.useMemo(() => all.filter(hasIdentity), [all]);

  // D3 Segmented tier chips: index 0 = 1-star .. index 4 = 5-star, real counts off
  // the actual loaded rows, never fabricated.
  const ratingCounts = React.useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    all.forEach((r) => {
      const idx = Math.min(5, Math.max(1, Math.round(r.rating))) - 1;
      counts[idx] += 1;
    });
    return counts;
  }, [all]);
  const tiers = React.useMemo(() => {
    const list: { key: Tier; count: number }[] = [{ key: "all", count: rows.length }];
    ([5, 4, 3, 2, 1] as const).forEach((star) => {
      const c = ratingCounts[star - 1];
      if (c > 0) list.push({ key: star, count: c });
    });
    return list;
  }, [rows.length, ratingCounts]);

  const [active, setActive] = React.useState<Tier>("all");
  const filtered = active === "all" ? rows : rows.filter((r) => Math.round(r.rating) === active);
  const visible = filtered.slice(0, 3);

  return (
    <section
      id="section-reviews"
      // mockup-ok: drift fix to the LOCKED §427 grouped list-card grammar, byte-identical to
      // SalonServices.tsx's already-shipped `<ul>` wrapper class string (rounded-[24px] border
      // border-s-border bg-white shadow-whisper), no new appearance introduced.
      className="rounded-[24px] border border-s-border bg-white shadow-whisper p-5 md:p-7"
    >
      {/* V3-D202 (A9): font-body → font-display + Scale B. */}
      <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
        Bewertungen
      </h2>

      {/* mockup-ok: D3 Segmented summary (owner-approved 2026-07-24, _overhaul/reviews/
          DirectionSegmented.tsx). Compact star + average + grey count line, replacing the
          old 5-star row + big number. */}
      <div className="mt-4 flex items-center gap-2">
        <Star size={16} stroke="none" aria-hidden className="fill-s-star" />
        <span className="font-display text-[20px] font-bold leading-none text-s-ink tabular-nums">
          {average?.toFixed(1) ?? "-"}
        </span>
        <span className="font-body text-[13px] text-s-ink-3">
          {count.toLocaleString("de-CH")} {count === 1 ? "Bewertung" : "Bewertungen"}
        </span>
      </div>

      {all.length === 0 ? (
        // Aggregate without bodies (count > 0) softens to "texts coming"; truly-empty (0) stays.
        count > 0 ? (
          <p className="font-body mt-5 text-[14px] text-s-ink-3">
            Bewertungstexte folgen.
          </p>
        ) : (
          <p className="font-body mt-5 text-[14px] text-s-ink-3">
            Noch keine Bewertungen.
          </p>
        )
      ) : (
        <>
          {/* mockup-ok: rating-tier TabPill filter row (D3 Segmented), built only for
              tiers that actually have reviews, over a hairline-grouped list , the
              owner-approved fix for "hard to distinguish between things, not grouped". */}
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tiers.map((t) => (
              <TabPill key={String(t.key)} active={active === t.key} onClick={() => setActive(t.key)} size="sm">
                {t.key === "all" ? (
                  `Alle (${t.count})`
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
              <p className="font-body text-[14px] text-s-ink-3">Noch keine Bewertungen in dieser Gruppe.</p>
            ) : (
              visible.map((r) => (
                <div key={r.id} className="border-t border-s-border pt-5 first:border-t-0 first:pt-0 [&+&]:mt-5">
                  <ReviewCard review={r} />
                </div>
              ))
            )}
          </div>

          {salonSlug && locale && (
            <div className="mt-6 flex justify-center">
              {/* mockup-ok: SeeAllButton port, byte-identical pill class string, same instance as
                  SalonServices/SalonTeam on this page. Always navigates to the real full reviews
                  page (owner: no inline expand). */}
              <SeeAllButton
                label={`Alle ${count.toLocaleString("de-CH")} Bewertungen`}
                href={`/${locale}/salon/${salonSlug}/reviews`}
              />
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
