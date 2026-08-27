"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Star, MessageSquare, ChevronDown, Flag } from "lucide-react";
import EmptyState from "@/components-legacy/ui/EmptyState";
import { motion, AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";
import { Sheet } from "@/app/[locale]/_components/primitives/Sheet";
import { TabPill } from "@/app/[locale]/_components/primitives/TabPill";
import ReviewForm from "@/components-legacy/ReviewForm";
import { RatingStars } from "@/app/[locale]/_components/primitives/RatingStars";
import { formatReviewDate, publicReply } from "@/app/[locale]/_components/salon/_shared";
import ReportButton from "@/components-legacy/discovery/ReportButton";
import type { Review } from "@/lib/types";

// ─────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────

interface ReviewPhoto {
  id: string;
  photo_url: string;
}

interface ReviewReply {
  // Ring 2b: optional , pages loaded via /api/reviews/salon/[salon_id] (the "Mehr
  // laden" fetch below) select review_replies(reply_text, is_public, created_at) without
  // an id column; id is never read by this component.
  id?: string;
  reply_text: string;
  is_public: boolean;
  // Round 10 Y3: the reply's own timestamp, rendered under the reply text (owner spec:
  // label + text + date).
  created_at: string;
}

type EnrichedReview = Review & {
  profiles?: { display_name: string; avatar_url: string | null };
  review_photos?: ReviewPhoto[];
  // review_id is UNIQUE on review_replies, so PostgREST returns this embed as a
  // single OBJECT when a reply exists, not an array , read it via publicReply(),
  // never `.length` / `[0]` directly (2026-07-25 fix, see _shared.ts).
  review_replies?: ReviewReply | ReviewReply[] | null;
  booking_id?: string;
  // The booking's guest_name, forwarded ONLY when the reviewer has no account (no
  // review_id -> profiles join). Optional: rows loaded via the "Mehr laden" pagination
  // fetch (handleShowMore below, GET /api/reviews/salon/[salon_id]) do not carry this
  // field at all, since that route is a shared loader used by other screens
  // (dashboard/reviews, the marketplace-wide reviews page) and was not touched here;
  // for those rows this stays undefined and the fallback chain below reaches the
  // translated anonymous label instead, same as it always has.
  guestName?: string | null;
};

interface SalonReviewsProps {
  reviews: EnrichedReview[];
  averageRating: number;
  reviewCount: number;
  salonId: string;
  salonSlug: string;
  salonName?: string;
  /**
   * Owner decision 4, 2026-08-09 ("4B like google maps"): shows the "Write review" button.
   * Server-computed, and true for anyone SIGNED IN who has not already rated this salon , it does
   * NOT ask whether they have been here. Defaults to false so a caller that omits it gets the
   * signed-out (no button) path rather than a form that 401s on submit.
   */
  canWriteReview?: boolean;
  /** He has already left the one rating this salon allows without an appointment. */
  alreadyReviewed?: boolean;
  /**
   * The rater's unreviewed completed booking here, when they have one. Since decision 4 this no
   * longer gates the button (canWriteReview does); it only links the rating to that booking and its
   * stylist. null means the rating is filed against the salon alone.
   */
  unreviewedBookingId: string | null;
  /** First name (or full name) of the staff member on the unreviewed booking. */
  unreviewedBookingStaffName?: string;
  /** UUID of the staff member on the unreviewed booking. */
  unreviewedBookingStaffMemberId?: string;
  /** Avatar URL of the staff member on the unreviewed booking. */
  unreviewedBookingStaffPhotoUrl?: string;
  locale: string;
  onLightbox?: (photoUrl: string) => void;
  onReviewSubmitted?: () => void;
  /** True only for the reviewed salon's own owner (server-computed). Gates which
   *  report affordance a viewer sees on each review row (see the header Flag icon
   *  below): the owner keeps the existing internal moderation-flag tool
   *  (POST /api/reviews/[id]/flag, owner-only per app/api/reviews/[id]/flag/route.ts),
   *  everyone else gets the generic customer ReportButton (POST /api/reports). Before
   *  this, the Flag icon rendered for every viewer but 403'd for non-owners (BACKEND.md
   *  section 14 gotcha, "an ordinary customer... has no report affordance"). Defaults to
   *  false so any caller that doesn't pass it explicitly gets the safe (non-owner) path.
   */
  isOwner?: boolean;
}

// ─────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────

export default function SalonReviews({
  reviews,
  averageRating,
  reviewCount,
  salonId,
  salonSlug,
  salonName,
  canWriteReview = false,
  alreadyReviewed = false,
  unreviewedBookingId,
  unreviewedBookingStaffName,
  unreviewedBookingStaffMemberId,
  unreviewedBookingStaffPhotoUrl,
  locale,
  onLightbox,
  onReviewSubmitted,
  isOwner = false,
}: SalonReviewsProps) {
  const t = useTranslations("salonDetail");
  const tCommon = useTranslations("common");
  const [reviewSort, setReviewSort] = useState<"newest" | "highest" | "lowest">("newest");
  const [reviewPage, setReviewPage] = useState(1);
  // Ring 2b: the parent page now loads only the first page of reviews (was
  // unbounded). loadedReviews starts as that first page and grows via
  // /api/reviews/salon/[salon_id] (psych-ok: implementation comment, page size
  // matches that endpoint's own fixed limit, not a user-facing stat) , the same
  // paginated endpoint the dashboard reviews list already uses , when "Mehr
  // laden" is clicked past what's already loaded. serverPage tracks which
  // server page (1 = the parent's initial fetch) has been loaded.
  const [loadedReviews, setLoadedReviews] = useState<EnrichedReview[]>(reviews);
  const [serverPage, setServerPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());
  // Fresha-style rating filter + sort sheet (structure source: Fresha reviews page).
  const [ratingFilter, setRatingFilter] = useState<Set<number>>(new Set());
  const [sortSheetOpen, setSortSheetOpen] = useState(false);

  // Flag state
  const [flaggingReviewId, setFlaggingReviewId] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState("");
  const [flagLoading, setFlagLoading] = useState(false);
  const [flagSuccess, setFlagSuccess] = useState(false);
  const [flagError, setFlagError] = useState(false);

  const sortedReviews = [...loadedReviews].sort((a, b) => {
    if (reviewSort === "highest") return b.rating - a.rating;
    if (reviewSort === "lowest") return a.rating - b.rating;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  // When ≥1 star bucket is checked, show only those ratings (Fresha "Filter by").
  const filteredReviews =
    ratingFilter.size > 0
      ? sortedReviews.filter((r) => ratingFilter.has(Math.round(r.rating)))
      : sortedReviews;
  const reviewsVisible = filteredReviews.slice(0, reviewPage * 5);
  const starCounts = [5, 4, 3, 2, 1].map((s) => loadedReviews.filter((r) => Math.round(r.rating) === s).length);
  const toggleRating = (s: number) => {
    setReviewPage(1);
    setRatingFilter((prev) => {
      const n = new Set(prev);
      if (n.has(s)) n.delete(s);
      else n.add(s);
      return n;
    });
  };
  const sortLabel = reviewSort === "highest" ? t("sortHighest") : reviewSort === "lowest" ? t("sortLowest") : t("sortNewest");

  const handleFlagReview = (reviewId: string) => {
    setFlaggingReviewId(reviewId);
    setFlagReason("");
    setFlagSuccess(false);
  };

  const submitFlag = async () => {
    if (!flaggingReviewId || flagReason.trim().length < 5) return;
    setFlagLoading(true);
    try {
      const res = await fetch(`/api/reviews/${flaggingReviewId}/flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: flagReason.trim() }),
      });
      if (!res.ok) throw new Error("Error");
      setFlagSuccess(true);
      setTimeout(() => {
        setFlaggingReviewId(null);
        setFlagSuccess(false);
      }, 2000);
    } catch (err) {
      console.error("[SalonReviews] flag error:", err);
      setFlagError(true);
    } finally {
      setFlagLoading(false);
    }
  };

  const toggleExpanded = (reviewId: string) => {
    const next = new Set(expandedReviews);
    if (next.has(reviewId)) {
      next.delete(reviewId);
    } else {
      next.add(reviewId);
    }
    setExpandedReviews(next);
  };

  // Ring 2b: "Mehr laden" first reveals more of what's already loaded (5 at a
  // time, unchanged); once that's exhausted and the salon has more reviews than
  // loadedReviews holds, it fetches the next server page from the existing
  // paginated endpoint and appends. That endpoint's select now also joins
  // review_photos(id, photo_url), ordered by sort_order, so photos render on
  // paged (server-side) reviews too, not just the first page.
  const handleShowMore = async () => {
    if (reviewsVisible.length < filteredReviews.length) {
      setReviewPage((p) => p + 1);
      return;
    }
    if (loadedReviews.length >= reviewCount) return;
    setLoadingMore(true);
    try {
      const nextPage = serverPage + 1;
      const res = await fetch(`/api/reviews/salon/${salonId}?page=${nextPage}&sort=${reviewSort}`);
      if (!res.ok) throw new Error(`reviews ${res.status}`);
      const data = await res.json();
      const mapped = ((data.items ?? []) as Array<{
        id: string;
        rating: number;
        comment: string | null;
        created_at: string;
        profiles?: { display_name: string; avatar_url: string | null } | null;
        // Same to-one embed as everywhere else: PostgREST returns an object, not
        // an array, when the review has a reply.
        review_replies?: ReviewReply | ReviewReply[] | null;
        review_photos?: { id: string; photo_url: string }[];
      }>).map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at,
        profiles: r.profiles ?? undefined,
        review_photos: r.review_photos ?? [],
        review_replies: r.review_replies ?? [],
      })) as unknown as EnrichedReview[];
      setLoadedReviews((prev) => [...prev, ...mapped]);
      setServerPage(nextPage);
      setReviewPage((p) => p + 1);
    } catch (err) {
      console.error("[SalonReviews] load more reviews failed:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div id="section-bewertungen" className="scroll-mt-[80px]">
      {/* mockup-ok: 2026-07-24 PORT (P10a, ref app/[locale]/dev/pdp/reviews-full/page.tsx),
          large title + back arrow , this route is a task-step sub-view of the salon PDP
          (FooterGate.tsx already classifies /salon/[slug]/reviews as one), which per the
          single-global-back doctrine keeps its own local back, same as /dev/pdp/team-all
          and /dev/pdp/reviews-full. */}
      {/* 2026-08-09. The local back is GONE. The comment above claimed this route counts as a
          focused flow, and a focused flow keeps its own back precisely BECAUSE the global header
          is hidden on it. The global header is not hidden here: measured on a phone, the page
          renders the global bar (back arrow, bell, hamburger) and then this second back arrow
          directly under it. Two backs and a hamburger on a detail page is what he was looking at.
          The doctrine is one back per screen and the global header IS that back, so the page adds
          none. mockup-ok: removing a duplicate control, no new design. */}
      <div className="flex items-center gap-3">
        <h2 className="font-display text-[30px] font-semibold tracking-[-0.02em] text-s-ink">
          {t("reviews")}
        </h2>
      </div>
      <div className="mt-3 md:mt-0">
        {loadedReviews.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title={t("noReviews")}
            message={t("noReviewsMessage")}
          />
        ) : (
          <>
            {/* mockup-ok: compact star + average + GREY count (was s-accent blue), matching
                the approved reviews-full page. */}
            <div className="mt-5 flex items-center gap-2">
              <Star size={20} strokeWidth={2.2} stroke="none" aria-hidden className="fill-s-star" />
              <span className="font-heading text-[20px] font-bold leading-none tracking-[-0.01em] tabular-nums text-s-ink">{averageRating.toFixed(1)}</span>
              {/* mockup-ok: PDP-grammar transfer (owner round 10 Y1) , one grey count,
                  "N Bewertungen" (was a bare "(N)"), reusing the same reviewsCount key the
                  count+sort row below used to duplicate. */}
              <span className="text-[13px] text-s-ink-2">{t("reviewsCount", { count: reviewCount.toLocaleString("de-CH") })}</span>
            </div>

            {/* mockup-ok: F2 chip filter row (owner-picked direction, REMOVED.md "reviews
                filter distribution bars"). PDP-grammar transfer (owner round 10 Y1): a
                leading "Alle (N)" chip (clears the filter) then only tiers that actually
                have a review render a chip, matching app/[locale]/_components/salon/
                SalonReviews.tsx's D3 tier-chip logic , this used to always render all 5
                tiers including empty ones and had no "Alle" chip. Same ratingFilter
                state/logic, multi-select, real counts off the loaded rows. */}
            <div className="mt-6">
              <p className="mb-2.5 font-body text-[14px] font-semibold text-s-ink">{t("filterBy")}</p>
              <div className="flex flex-wrap gap-2">
                <TabPill active={ratingFilter.size === 0} onClick={() => setRatingFilter(new Set())} size="sm">
                  {t("filterAllCount", { count: loadedReviews.length.toLocaleString("de-CH") })}
                </TabPill>
                {[5, 4, 3, 2, 1].map((s, i) => {
                  const c = starCounts[i];
                  if (c === 0) return null;
                  return (
                    <TabPill key={s} active={ratingFilter.has(s)} onClick={() => toggleRating(s)} size="sm">
                      <span className="inline-flex items-center gap-1">
                        {s}
                        <Star size={11} strokeWidth={0} aria-hidden className="fill-s-star" />
                        {`(${c.toLocaleString("de-CH")})`}
                      </span>
                    </TabPill>
                  );
                })}
              </div>
            </div>

            {/* Write Review Button , signed in is the whole gate (owner decision 4, 2026-08-09) */}
            {canWriteReview && (
              <div className="mt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowReviewForm(true)}
                  className="w-full rounded-btn bg-s-ink px-6 py-2.5 text-sm font-medium text-white transition-colors duration-150 sm:w-auto"
                >
                  {t("writeReview")}
                </motion.button>
              </div>
            )}

            {/* 2026-08-09, he asked how the one-per-salon limit behaves: "is there pop up or jst
                silent delete or what". It was silent. The button simply vanished and he would have
                had no idea why, which is a dead affordance one step earlier. One quiet line takes
                its place, at the size and colour the meta text on this row already uses, so it adds
                no new size or weight to the screen.
                mockup-ok: not a design choice. It replaces a control that disappeared with no
                explanation, and reuses existing type rather than inventing any. */}
            {!canWriteReview && alreadyReviewed && (
              <p className="mt-4 text-[14px] text-s-ink-2">{t("alreadyReviewed")}</p>
            )}

            {/* Sort trigger (Fresha: "Best ▾" → sheet). PDP-grammar transfer (owner round
                10 Y1): dropped the "N Bewertungen" label this row used to carry , the
                summary line above already renders that exact count once, so this row was
                showing the same number twice in one header. */}
            <div className="mb-4 mt-6 flex items-center justify-end border-t border-s-border pt-5">
              {/* 2026-08-09, he asked "why does one use shadow" and whether there is a rule for
                  it. There is, in the design contract's surface table: a control carrying
                  elevation DROPS its border, never both. This pill had both, which is why it read
                  as a different grammar from the filter pills sitting directly above it on the
                  same screen. The shadow goes and the hairline stays, so the row matches them.
                  Supersedes the note that used to sit here justifying h-11 + shadow-whisper by
                  copying another page: that page has the same fault, so it was not authority.
                  mockup-ok: applying a written rule, not choosing a look. */}
              <button
                type="button"
                onClick={() => setSortSheetOpen(true)}
                className="flex h-11 items-center gap-1.5 rounded-full border border-s-border bg-white px-4 font-body text-[13px] font-semibold text-s-ink transition active:scale-[0.98] active:duration-[80ms] active:ease-glide"
              >
                {sortLabel}
                <ChevronDown size={16} strokeWidth={1.9} className="text-s-ink-2" />
              </button>
            </div>

            {/* Whitespace-separated cards (Fresha: no hairlines between reviews) */}
            <div className="flex flex-col gap-8">
              {reviewsVisible.map((rev) => {
                const isExpanded = expandedReviews.has(rev.id);
                const needsTruncation = (rev.comment?.length ?? 0) > 150;
                const displayText =
                  !isExpanded && needsTruncation ? rev.comment?.slice(0, 150) + "..." : rev.comment;
                // Account name first, then the booking's guest name, then the translated
                // anonymous label. ONE resolved value so the avatar initial (below) and the
                // printed name can never disagree, per the fix this fallback chain exists for:
                // a guest who books and reviews used to be permanently "Anonym" because this
                // component only ever read rev.profiles, never the booking's own guest_name.
                const reviewerName = rev.profiles?.display_name ?? rev.guestName ?? tCommon("anonymous");

                return (
                  <div key={rev.id}>
                    {/* Header - avatar + name/date stacked, flag icon top-right (measured Fresha
                        anatomy: avatar 56px; no trailing action row - that lone flag row left
                        ~60px of dead space per card). */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-s-accent-pale text-[17px] font-semibold text-s-accent">
                          {rev.profiles?.avatar_url ? (
                            <Image src={rev.profiles.avatar_url} alt="" width={56} height={56} className="h-full w-full object-cover" />
                          ) : (
                            reviewerName[0]
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[15px] font-semibold text-s-ink">
                            {reviewerName}
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-s-ink-2">
                            <span>
                              {formatReviewDate(rev.created_at, locale)}
                            </span>
                            {publicReply(rev.review_replies) && (
                              <span className="flex items-center gap-1 text-s-accent">
                                <MessageSquare size={13} />
                                {t("salonReplied")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {isOwner ? (
                        // Owner-only internal moderation flag (POST /api/reviews/[id]/flag),
                        // unchanged. Non-owners get the generic ReportButton below instead:
                        // this route 403s for anyone but the reviewed salon's own owner
                        // (app/api/reviews/[id]/flag/route.ts), so showing it to every
                        // viewer regardless of ownership was a dead end for a normal
                        // customer (BACKEND.md section 14).
                        flaggingReviewId !== rev.id && (
                          <button
                            onClick={() => handleFlagReview(rev.id)}
                            aria-label={t("flagReview")}
                            title={t("flagReview")}
                            className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-s-ink-2 transition-[colors,transform] duration-150 hover:bg-s-bg-sunken hover:text-s-ink-2 active:scale-[0.94] active:duration-[80ms] active:ease-glide"
                          >
                            <Flag size={15} strokeWidth={1.9} aria-hidden />
                          </button>
                        )
                      ) : (
                        <ReportButton type="review" targetId={rev.id} variant="row" />
                      )}
                    </div>

                    {/* Measured Fresha rhythm: header→stars 14px, stars→text 16px */}
                    <div className="mt-3.5">
                      <RatingStars mode="five" value={rev.rating} size="md" />
                    </div>

                    {displayText && (
                      <p className="mt-4 text-[14px] leading-relaxed text-s-ink-2">
                        {displayText}
                        {needsTruncation && (
                          <button
                            onClick={() => toggleExpanded(rev.id)}
                            className="ml-1 font-medium text-s-accent transition-transform duration-150 active:scale-[0.98] active:duration-[80ms] active:ease-glide"
                          >
                            {isExpanded ? t("readLess") : t("readMore")}
                          </button>
                        )}
                      </p>
                    )}

                    {/* Flag form - only while flagging (the icon lives in the header) */}
                    {flaggingReviewId === rev.id && (
                      <div className="mt-3">
                        <div className="w-full rounded-[12px] border border-s-border bg-s-bg-sunken p-3">
                          {flagSuccess ? (
                            <p className="text-xs text-s-success font-heading py-1">
                              ✓ {t("flagSuccess")}
                            </p>
                          ) : (
                            <>
                              <p className="text-[12px] font-heading text-s-ink-2 mb-2">
                                {t("flagReasonLabel")}
                              </p>
                              <textarea
                                value={flagReason}
                                onChange={(e) => setFlagReason(e.target.value)}
                                placeholder={t("flagReasonPlaceholder")}
                                rows={2}
                                className="w-full text-xs font-body text-s-ink px-2.5 py-2 resize-none outline-none placeholder:text-s-ink/30 transition-colors duration-150" // mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17)
                              />
                              <div className="flex gap-2 mt-2 justify-end">
                                <button
                                  onClick={() => setFlaggingReviewId(null)}
                                  className="text-xs text-s-ink-2 hover:text-s-ink-2 font-heading px-3 py-1.5 transition-[colors,transform] duration-150 active:scale-[0.98] active:duration-[80ms] active:ease-glide"
                                >
                                  {t("flagCancel")}
                                </button>
                                {/* primary submit action - ink fill is the commit CTA treatment, selected-ok */}
                                <button
                                  onClick={submitFlag}
                                  disabled={flagLoading || flagReason.trim().length < 5}
                                  className="text-xs text-white font-body font-semibold px-4 py-1.5 rounded-btn bg-s-ink hover:brightness-[1.06] disabled:opacity-50 transition-[transform,filter] duration-150 active:scale-[0.97] active:duration-[80ms] active:ease-glide"
                                >
                                  {flagLoading ? "…" : t("flagSubmit")}
                                </button>
                              </div>
                              {flagError && (
                                <p className="text-xs text-[color:var(--color-error)] mt-1">{t("flagError")}</p>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Review photos */}
                    {rev.review_photos && rev.review_photos.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {rev.review_photos.map((photo) => (
                          <button
                            key={photo.id}
                            onClick={() => onLightbox?.(photo.photo_url)}
                            className="relative w-16 h-16 rounded-[12px] overflow-hidden bg-s-bg-surface hover:bg-s-bg-sunken active:scale-[0.97] active:duration-[80ms] active:ease-glide transition-[transform,background-color] duration-150 shrink-0"
                            aria-label={t("enlargePhoto")}
                          >
                            <Image src={photo.photo_url} alt="" fill className="object-cover" sizes="64px" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* mockup-ok: owner reply (round 10 Y3, explicit spec , indented, neutral
                        tokens, never a coloured callout). Reuses this file's OWN existing
                        rounded-[12px]/border-s-border/bg-s-bg-sunken recipe byte-for-byte
                        (the flag-reason box a few lines up), just swapping content, so no new
                        appearance is introduced. */}
                    {(() => {
                      const reply = publicReply(rev.review_replies);
                      if (!reply) return null;
                      return (
                        <div className="mt-3 ml-4 rounded-[12px] border border-s-border bg-s-bg-sunken p-3">
                          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-s-ink">
                            <MessageSquare size={13} aria-hidden />
                            {salonName ? t("replyFrom", { name: salonName }) : t("salonReplied")}
                          </p>
                          <p className="mt-1.5 text-[13px] leading-relaxed text-s-ink-2">{reply.reply_text}</p>
                          <p className="mt-1.5 text-[12px] text-s-ink-2">
                            {formatReviewDate(reply.created_at, locale)}
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>

            {(loadedReviews.length > reviewsVisible.length || loadedReviews.length < reviewCount) && (
              <button
                onClick={handleShowMore}
                disabled={loadingMore}
                className="mt-4 w-full py-2.5 border border-s-border rounded-btn text-sm text-s-ink-2 hover:border-s-ink/[0.18] hover:text-s-ink/80 active:scale-[0.97] active:duration-[80ms] active:ease-glide transition-[border-color,color,transform] duration-150 disabled:opacity-50"
              >
                {t("showMoreReviews")}
              </button>
            )}
          </>
        )}
      </div>

      {/* Review form bottom sheet */}
      <AnimatePresence>
        {showReviewForm && canWriteReview && (
          <ReviewForm
            salonId={salonId}
            salonName={salonName}
            bookingId={unreviewedBookingId ?? undefined}
            staffName={unreviewedBookingStaffName}
            staffMemberId={unreviewedBookingStaffMemberId}
            staffPhotoUrl={unreviewedBookingStaffPhotoUrl}
            onSuccess={() => {
              setShowReviewForm(false);
              onReviewSubmitted?.();
            }}
            onClose={() => setShowReviewForm(false)}
          />
        )}
      </AnimatePresence>

      {/* Sort sheet (Fresha: "Best ▾" → bottom sheet with radio options) */}
      <Sheet isOpen={sortSheetOpen} onOpenChange={setSortSheetOpen} height="auto" aria-label={t("sortBy")}>
        <div className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-1">
          {([
            { key: "highest", label: t("sortHighest") },
            { key: "newest", label: t("sortNewest") },
            { key: "lowest", label: t("sortLowest") },
          ] as const).map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => {
                setReviewSort(opt.key);
                setReviewPage(1);
                setSortSheetOpen(false);
              }}
              className="flex w-full items-center justify-between border-b border-s-border py-4 text-left text-[16px] text-s-ink last:border-b-0"
            >
              {opt.label}
              <span className={`grid h-5 w-5 place-items-center rounded-full border-2 ${reviewSort === opt.key ? "border-s-accent" : "border-s-border"}`}>
                {reviewSort === opt.key && <span className="h-2.5 w-2.5 rounded-full bg-s-accent" />}
              </span>
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}
