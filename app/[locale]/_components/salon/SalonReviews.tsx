"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Star, MessageSquare } from "lucide-react";
import type { Review } from "./_shared";
import { formatReviewDate, publicReply } from "./_shared";
import { formatNumber } from "@/lib/format";
import { Avatar, RatingStars, SeeAllButton } from "@/app/[locale]/_components/primitives";
import { TabPill } from "../primitives/TabPill";
import { cn } from "@/lib/utils";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import ReportButton from "@/components-legacy/discovery/ReportButton";

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
  salonName,
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
  /** Round 10 Y3: label an owner reply "Antwort von {salonName}". */
  salonName?: string;
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
  const t = useTranslations("salonDetail");
  const [fetched, setFetched] = React.useState<Review[] | null>(null);

  React.useEffect(() => {
    if (reviews.length > 0 || !salonId) return;
    let cancelled = false;
    (async () => {
      try {
        const supabase = createBrowserSupabaseClient();
        const { data, error } = await supabase
          .from("reviews")
          .select("id, rating, comment, created_at, profiles(display_name, avatar_url), review_replies(reply_text, is_public, created_at)")
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
    <div id="section-reviews">
      <section
        // mockup-ok: drift fix to the LOCKED §427 grouped list-card grammar, byte-identical to
        // SalonServices.tsx's already-shipped `<ul>` wrapper class string (rounded-[24px] border
        // border-s-border bg-white shadow-whisper), no new appearance introduced.
        className="rounded-[24px] border border-s-border bg-white shadow-whisper p-5 md:p-7"
      >
        {/* V3-D202 (A9): font-body → font-display + Scale B. */}
        <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
          {t("reviewsHeading")}
        </h2>

        {/* mockup-ok: D3 Segmented summary (owner-approved 2026-07-24, _overhaul/reviews/
            DirectionSegmented.tsx). Compact star + average + grey count line, replacing the
            old 5-star row + big number. */}
        <div className="mt-4 flex items-center gap-2">
          <Star size={16} strokeWidth={1.9} stroke="none" aria-hidden className="fill-s-star" />
          <span className="font-display text-[20px] font-bold leading-none text-s-ink tabular-nums">
            {average?.toFixed(1) ?? "-"}
          </span>
          <span className="font-body text-[13px] text-s-ink-2">
            {t("reviewsCountPlural", { count })}
          </span>
        </div>

        {/* GUARDED ON `rows`, NOT `all` (fixed 2026-07-28). `all` is every loaded review;
            `rows` is the ones that actually RENDER after the anti-wall filter drops rating-only
            anonymous entries (owner 2026-06-12). Guarding on `all` meant a salon whose reviews
            are ALL rating-only fell into the else branch and drew the tier chips anyway, so the
            page showed "Alle (0)" directly beneath a count of 11, then "no reviews in this
            group". Two true numbers contradicting each other on screen. Measured on
            muse-beauty-studio: 11 reviews, zero with a comment or a display name.
            The branch below already had the right answer for exactly this case; it was simply
            unreachable. */}
        {rows.length === 0 ? (
          // Aggregate without bodies (count > 0) softens to "texts coming"; truly-empty (0) stays.
          count > 0 ? (
            <p className="font-body mt-5 text-[14px] text-s-ink-2">
              {t("reviewTextsComing")}
            </p>
          ) : (
            <p className="font-body mt-5 text-[14px] text-s-ink-2">
              {t("noReviewsYet")}
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
                <p className="font-body text-[14px] text-s-ink-2">{t("noReviewsInGroup")}</p>
              ) : (
                visible.map((r) => (
                  <div key={r.id} className="border-t border-s-border pt-5 first:border-t-0 first:pt-0 [&+&]:mt-5">
                    <ReviewCard review={r} salonName={salonName} locale={locale} />
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </section>

      {rows.length > 0 && salonSlug && locale && (
        <div className="mt-5 flex justify-center">
          {/* mockup-ok: SeeAllButton port, byte-identical pill class string, same instance as
              SalonServices/SalonTeam on this page. Always navigates to the real full reviews
              page (owner: no inline expand). Sibling of the card, not nested inside it (owner
              2026-07-25: "outside of the reviews group card"); gap matches SalonServices.tsx's
              established card→SeeAllButton mt-5 (both direct children of a non-card wrapper). */}
          <SeeAllButton
            label={t("allNReviews", { count: formatNumber(count, locale) })}
            href={`/${locale}/salon/${salonSlug}/reviews`}
          />
        </div>
      )}
    </div>
  );
}

function ReviewCard({ review, salonName, locale }: { review: Review; salonName?: string; locale?: string }) {
  const t = useTranslations("reviews");
  const tCommon = useTranslations("common");
  const original = review.comment ?? review.comment_de ?? review.comment_en ?? "";
  const [showFull, setShowFull] = React.useState(false);
  const reply = publicReply(review.review_replies);

  // ON-READ TRANSLATION (2026-07-27). Reviews are written in German by default and carry no
  // language column. A visitor reading in another locale gets a translation fetched lazily
  // from /api/reviews/translate, which caches it (measured: 7.7s cold, 209ms warm).
  //
  // THE ORIGINAL IS NEVER REPLACED, only covered. `showOriginal` puts it back in one tap, and
  // the label always says the text was translated. A machine translation must not silently
  // become what a customer said about a business , that is somebody's reputation.
  const [translated, setTranslated] = React.useState<string | null>(null);
  const [showOriginal, setShowOriginal] = React.useState(false);
  const needsTranslation = !!original && !!locale && locale !== "de";

  React.useEffect(() => {
    if (!needsTranslation) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/reviews/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: [review.id], locale }),
        });
        if (!res.ok) return;
        const json = await res.json();
        const value = json?.translations?.[review.id];
        // No translation is not an error state worth surfacing: the original is already
        // rendered and is true. Fail quiet.
        if (!cancelled && typeof value === "string" && value.trim()) setTranslated(value);
      } catch {
        /* fail quiet, the original stays */
      }
    })();
    return () => { cancelled = true; };
  }, [needsTranslation, review.id, locale]);

  const showingTranslation = !!translated && !showOriginal;
  const text = showingTranslation ? translated! : original;
  const isLong = text.length > 200;

  // Reviewer name only when a public profile exists. Anonymous/seed reviews show a
  // "Verifizierte Buchung · date" line instead of a repeated placeholder name.
  const displayName = review.profiles?.display_name ?? null;

  return (
    <article>
      {/* Fresha row anatomy (pdp-bottom capture): avatar disc + NAME 16/600 with
          the grey date stacked under, star row below, text below. Anonymous reviews
          show "Anonym" (the established label on /reviews). */}
      <div className="flex items-start gap-3.5">
        <Avatar src={review.profiles?.avatar_url} name={displayName ?? tCommon("anonymous")} size={56} />
        <div className="min-w-0 flex-1">
          <div className="font-body truncate text-[16px] font-semibold text-s-ink">
            {displayName ?? tCommon("anonymous")}
          </div>
          <div className="font-body mt-0.5 text-[14px] text-s-ink-2">
            {formatReviewDate(review.created_at, locale)}
          </div>
        </div>
        {/* mockup-ok: net-new report affordance (owner ask 2026-07-25, "surfaces that lack
            it"), reusing ReportButton's "row" variant, a verbatim copy of the full reviews
            page's own existing per-row Flag icon-button chrome. */}
        <ReportButton type="review" targetId={review.id} variant="row" />
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
              className="font-body mt-1 text-[13px] font-medium text-s-accent transition-[opacity,transform] hover:opacity-80 active:scale-[0.98] active:duration-[80ms] active:ease-glide"
            >
              {t("readMore")}
            </button>
          )}
          {/* The provenance line renders ONLY when a translation is actually being shown, so a
              German reader never sees it and a failed fetch never claims something happened.
              Text link + hover underline per the LOCKFILE link row , it is a small clickable
              bit of metadata, which is exactly what s-accent is reserved for. */}
          {translated && (
            <p className="font-body mt-1.5 text-[12px] text-s-ink-2">
              {showingTranslation ? t("translatedFrom") : null}{" "}
              <button
                type="button"
                onClick={() => setShowOriginal((v) => !v)}
                className="font-medium text-s-accent underline-offset-2 transition-opacity hover:underline hover:opacity-80"
              >
                {showingTranslation ? t("showOriginal") : t("showTranslation")}
              </button>
            </p>
          )}
        </>
      )}

      {/* mockup-ok: owner reply (round 10 Y3, explicit spec , indented, neutral tokens,
          never a coloured callout). Same rounded-[12px]/bg-s-bg-sunken/border-s-border
          tray grammar as the full reviews page's reply block (components-legacy/salon/
          SalonReviews.tsx), so the two surfaces read as one consistent feature. */}
      {reply && (
        <div className="mt-3 ml-4 rounded-[12px] border border-s-border bg-s-bg-sunken p-3">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-s-ink">
            <MessageSquare size={13} aria-hidden />
            {salonName ? t("replyFrom", { salon: salonName }) : t("replyFromSalon")}
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-s-ink-2">{reply.reply_text}</p>
          <p className="mt-1.5 text-[12px] text-s-ink-2">{formatReviewDate(reply.created_at, locale)}</p>
        </div>
      )}
    </article>
  );
}
