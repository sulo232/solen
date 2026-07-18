"use client";

import { useState } from "react";
import Image from "next/image";
import { Star, ShieldCheck, MessageSquare, Check, ChevronDown, Flag } from "lucide-react";
import EmptyState from "@/components-legacy/ui/EmptyState";
import { motion, AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";
import { Sheet } from "@/app/[locale]/_components/primitives/Sheet";
import ReviewForm from "@/components-legacy/ReviewForm";
import { RatingStars } from "@/app/[locale]/_components/primitives/RatingStars";
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
  // laden" fetch below) select review_replies(reply_text, is_public) without an id
  // column; id is never read by this component, only .reply_text / .is_public.
  id?: string;
  reply_text: string;
  is_public: boolean;
}

type EnrichedReview = Review & {
  profiles?: { display_name: string; avatar_url: string | null };
  review_photos?: ReviewPhoto[];
  review_replies?: ReviewReply[];
  booking_id?: string;
};

interface SalonReviewsProps {
  reviews: EnrichedReview[];
  averageRating: number;
  reviewCount: number;
  salonId: string;
  salonSlug: string;
  salonName?: string;
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
  unreviewedBookingId,
  unreviewedBookingStaffName,
  unreviewedBookingStaffMemberId,
  unreviewedBookingStaffPhotoUrl,
  locale,
  onLightbox,
  onReviewSubmitted,
}: SalonReviewsProps) {
  const t = useTranslations("salonDetail");
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
  const maxStarCount = Math.max(1, ...starCounts);
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
  // paginated endpoint and appends. That endpoint's review_replies select omits
  // review_photos, so photos only render for the first (server-side) page , a
  // known, accepted trade-off of reusing the existing endpoint as-is.
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
        review_replies?: { reply_text: string; is_public: boolean }[];
      }>).map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at,
        profiles: r.profiles ?? undefined,
        review_photos: [],
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
      <h2 className="font-heading text-[24px] font-bold tracking-[-0.01em] text-s-ink">
        {t("reviews")}
      </h2>
      <div className="mt-3 md:mt-0">
        {loadedReviews.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title={t("noReviews")}
            message={t("noReviewsMessage")}
          />
        ) : (
          <>
            {/* Summary - big rating + count. Blue (s-accent) on the count where Fresha uses
                purple; Inter Tight bold number (not the lighter data-text weight). */}
            <div className="mt-3 flex items-center gap-2">
              <Star className="h-6 w-6 fill-s-star text-s-star" />
              {/* number + count share a BASELINE (measured: items-center floated the count 3-5px high vs the Fresha ref) */}
              <span className="flex items-baseline gap-1.5">
                <span className="font-heading text-[32px] font-bold leading-none tracking-[-0.01em] tabular-nums text-s-ink">{averageRating.toFixed(1)}</span>
                <span className="text-[17px] font-medium leading-none tabular-nums text-s-accent">({reviewCount.toLocaleString("de-CH")})</span>
              </span>
            </div>

            {/* Filter by rating - interactive checkboxes that filter the list (Fresha). */}
            <div className="mt-6">
              <p className="mb-2.5 text-[15px] font-semibold text-s-ink">{t("filterBy")}</p>
              <div className="space-y-0.5">
                {[5, 4, 3, 2, 1].map((s, i) => {
                  const c = starCounts[i];
                  const on = ratingFilter.has(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleRating(s)}
                      aria-pressed={on}
                      className="flex w-full items-center gap-3 py-1.5 text-left"
                    >
                      <span className={`grid h-[22px] w-[22px] shrink-0 place-items-center rounded-[6px] border transition-colors ${on ? "border-s-accent bg-s-accent text-white" : "border-s-border bg-white"}`}>
                        {on && <Check size={14} strokeWidth={3} />}
                      </span>
                      <span className="w-2.5 text-[15px] tabular-nums text-s-ink">{s}</span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-s-bg-sunken">
                        <span className="block h-full rounded-full bg-s-ink" style={{ width: `${(c / maxStarCount) * 100}%` }} />
                      </span>
                      <span className="w-12 text-right text-[14px] tabular-nums text-s-ink-3">{c.toLocaleString("de-CH")}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Write Review Button */}
            {unreviewedBookingId && (
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

            {/* Count + sort trigger (Fresha: "N reviews" + "Best ▾" → sheet) */}
            <div className="mb-4 mt-6 flex items-center justify-between border-t border-s-border pt-5">
              <span className="text-[15px] tabular-nums text-s-ink-2">
                {t("reviewsCount", { count: filteredReviews.length.toLocaleString("de-CH") })}
              </span>
              <button
                type="button"
                onClick={() => setSortSheetOpen(true)}
                className="flex items-center gap-1.5 rounded-full border border-s-border bg-white px-4 py-2 text-[14px] font-medium text-s-ink transition active:scale-[0.98]"
              >
                {sortLabel}
                <ChevronDown size={16} className="text-s-ink-2" />
              </button>
            </div>

            {/* Whitespace-separated cards (Fresha: no hairlines between reviews) */}
            <div className="flex flex-col gap-8">
              {reviewsVisible.map((rev) => {
                const isExpanded = expandedReviews.has(rev.id);
                const needsTruncation = (rev.comment?.length ?? 0) > 150;
                const displayText =
                  !isExpanded && needsTruncation ? rev.comment?.slice(0, 150) + "..." : rev.comment;

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
                            rev.profiles?.display_name?.[0] ?? "?"
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[15px] font-semibold text-s-ink">
                            {rev.profiles?.display_name ?? "Anonym"}
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-s-ink-3">
                            <span>
                              {new Date(rev.created_at).toLocaleDateString(locale === "de" ? "de-CH" : "en-GB", { day: "numeric", month: "long", year: "numeric" })}
                            </span>
                            {rev.review_replies && rev.review_replies.length > 0 && rev.review_replies[0].is_public && (
                              <span className="flex items-center gap-1 text-s-accent">
                                <MessageSquare size={13} />
                                {t("salonReplied")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {flaggingReviewId !== rev.id && (
                        <button
                          onClick={() => handleFlagReview(rev.id)}
                          aria-label={t("flagReview")}
                          title={t("flagReview")}
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-s-ink-3 transition-colors duration-150 hover:bg-s-bg-sunken hover:text-s-ink-2"
                        >
                          <Flag size={15} aria-hidden />
                        </button>
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
                            className="ml-1 font-medium text-s-accent"
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
                              <p className="text-[12px] font-heading text-s-ink-3 mb-2">
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
                                  className="text-xs text-s-ink-3 hover:text-s-ink-2 font-heading px-3 py-1.5 transition-colors duration-150"
                                >
                                  {t("flagCancel")}
                                </button>
                                {/* primary submit action - ink fill is the commit CTA treatment, selected-ok */}
                                <button
                                  onClick={submitFlag}
                                  disabled={flagLoading || flagReason.trim().length < 5}
                                  className="text-xs text-white font-body font-semibold px-4 py-1.5 rounded-btn bg-s-ink hover:brightness-[1.06] disabled:opacity-50 transition-[transform,filter] duration-150"
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
                            className="relative w-16 h-16 rounded-[12px] overflow-hidden bg-s-bg-surface hover:bg-s-bg-sunken active:scale-[0.97] transition-[transform,background-color] duration-150 shrink-0"
                            aria-label={t("enlargePhoto")}
                          >
                            <Image src={photo.photo_url} alt="" fill className="object-cover" sizes="64px" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Review reply */}
                    {(() => {
                      const reply =
                        rev.review_replies && rev.review_replies.length > 0 && rev.review_replies[0].is_public
                          ? rev.review_replies[0].reply_text
                          : null;
                      if (!reply) return null;
                      return (
                        <div className="mt-3 pl-4 border-l-2 border-s-success/30">
                          <p className="text-xs text-s-success font-medium flex items-center gap-1 mb-1">
                            <ShieldCheck className="w-3 h-3" />
                            {t("salonReplied")}
                          </p>
                          <p className="text-xs text-s-ink-2">{reply}</p>
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
                className="mt-4 w-full py-2.5 border border-s-border rounded-btn text-sm text-s-ink-2 hover:border-s-ink/[0.18] hover:text-s-ink/80 active:scale-[0.97] transition-[border-color,color,transform] duration-150 disabled:opacity-50"
              >
                {t("showMoreReviews")}
              </button>
            )}
          </>
        )}
      </div>

      {/* Review form bottom sheet */}
      <AnimatePresence>
        {showReviewForm && unreviewedBookingId && (
          <ReviewForm
            salonId={salonId}
            salonName={salonName}
            bookingId={unreviewedBookingId}
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
