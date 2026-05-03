"use client";

import { useState } from "react";
import Image from "next/image";
import { Star, ShieldCheck, MessageSquare } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import ReviewBreakdown from "@/components/ReviewBreakdown";
import ReviewForm from "@/components/ReviewForm";
import type { Review } from "@/lib/types";

// ─────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────

interface ReviewPhoto {
  id: string;
  photo_url: string;
  sort_order: number;
}

interface ReviewReply {
  id: string;
  reply_text: string;
  is_public: boolean;
}

type EnrichedReview = Review & {
  profiles?: { display_name: string; avatar_url: string | null };
  review_photos?: ReviewPhoto[];
  review_replies?: ReviewReply[];
  booking_id?: string;
  salon_response?: string;
};

interface SalonReviewsProps {
  reviews: EnrichedReview[];
  averageRating: number;
  reviewCount: number;
  salonId: string;
  salonSlug: string;
  unreviewedBookingId: string | null;
  locale: string;
  onLightbox?: (photoUrl: string) => void;
  onReviewSubmitted?: () => void;
}

// ─────────────────────────────────────────────────
// Stars helper
// ─────────────────────────────────────────────────

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const sz = size === "sm" ? "w-3 h-3" : "w-4 h-4";
  const rounded = Math.round(rating);
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={[sz, i <= rounded ? "fill-s-coral text-s-coral" : "text-s-ink/20"].join(" ")}
        />
      ))}
    </span>
  );
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
  unreviewedBookingId,
  locale,
  onLightbox,
  onReviewSubmitted,
}: SalonReviewsProps) {
  const t = useTranslations("salonDetail");
  const [reviewSort, setReviewSort] = useState<"newest" | "highest" | "lowest">("newest");
  const [reviewPage, setReviewPage] = useState(1);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());

  // Flag state
  const [flaggingReviewId, setFlaggingReviewId] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState("");
  const [flagLoading, setFlagLoading] = useState(false);
  const [flagSuccess, setFlagSuccess] = useState(false);
  const [flagError, setFlagError] = useState(false);

  const sortedReviews = [...reviews].sort((a, b) => {
    if (reviewSort === "highest") return b.rating - a.rating;
    if (reviewSort === "lowest") return a.rating - b.rating;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  const reviewsVisible = sortedReviews.slice(0, reviewPage * 5);

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

  const scrollToReviews = () => {
    document.getElementById("section-bewertungen")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div id="section-bewertungen" className="scroll-mt-[80px]">
      <div className="mb-4">
        <span className="block font-heading text-[11px] uppercase tracking-[.22em] text-s-amber mb-2">
          {t("reviews")}
        </span>
        <h2
          className="font-heading text-s-ink"
          style={{ fontSize: "clamp(22px, 3vw, 32px)", letterSpacing: "-0.02em" }}
        >
          {t("whatCustomersSay")}
        </h2>
      </div>
      <div className="mt-3 md:mt-0">
        {reviews.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title={t("noReviews")}
            message={t("noReviewsMessage")}
          />
        ) : (
          <>
            <ReviewBreakdown
              reviews={reviews}
              averageRating={averageRating}
              reviewCount={reviewCount}
              onReviewCountClick={scrollToReviews}
            />

            {/* Write Review Button */}
            {unreviewedBookingId && (
              <div className="mt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowReviewForm(true)}
                  className="w-full sm:w-auto py-2.5 px-6 rounded-btn bg-s-coral text-white font-medium text-sm transition-colors duration-150"
                  style={{ boxShadow: "0 1px 3px rgba(232,98,74,.25), 0 2px 8px rgba(232,98,74,.15)" }}
                >
                  {t("writeReview")}
                </motion.button>
              </div>
            )}

            {/* Review sort */}
            <div className="flex items-center gap-2 mt-4 mb-4">
              <span className="text-xs text-s-ink/40">{t("sortBy")}:</span>
              {(["newest", "highest", "lowest"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setReviewSort(s);
                    setReviewPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-btn text-xs font-heading uppercase tracking-[.06em] active:scale-[0.97] transition-[background-color,color,border-color,transform] duration-150 ${
                    reviewSort === s
                      ? "bg-s-coral text-white"
                      : "bg-s-bg-surface border border-s-ink/[0.08] text-s-ink/60 hover:border-s-coral/40 hover:text-s-coral"
                  }`}
                >
                  {s === "newest" ? t("sortNewest") : s === "highest" ? t("sortHighest") : t("sortLowest")}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-4">
              {reviewsVisible.map((rev) => {
                const isExpanded = expandedReviews.has(rev.id);
                const needsTruncation = (rev.comment?.length ?? 0) > 150;
                const displayText =
                  !isExpanded && needsTruncation ? rev.comment?.slice(0, 150) + "..." : rev.comment;

                return (
                  <div key={rev.id} className="border border-s-ink/5 rounded-[16px] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-s-bg-surface overflow-hidden flex items-center justify-center text-xs text-s-ink/40">
                          {rev.profiles?.avatar_url ? (
                            <Image src={rev.profiles.avatar_url} alt="" width={28} height={28} className="object-cover" />
                          ) : (
                            rev.profiles?.display_name?.[0] ?? "?"
                          )}
                        </div>
                        <span className="text-sm font-medium text-s-ink">
                          {rev.profiles?.display_name ?? "Anonym"}
                        </span>
                        {(rev as any).booking_id && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-s-sage/10 text-s-sage text-xs font-medium">
                            <ShieldCheck size={12} />
                            {t("verifiedBooking")}
                          </span>
                        )}
                        {/* Reply badge — signals "salon has replied" at-a-glance before scrolling to read the reply */}
                        {rev.review_replies && rev.review_replies.length > 0 && rev.review_replies[0].is_public && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-s-coral/10 text-s-coral text-xs font-medium" aria-label={t("salonReplied")}>
                            <MessageSquare size={12} />
                            {t("salonReplied")}
                          </span>
                        )}
                      </div>
                      <Stars rating={rev.rating} size="sm" />
                    </div>
                    {displayText && (
                      <p className="text-sm text-s-ink/70 leading-relaxed">
                        {displayText}
                        {needsTruncation && (
                          <button
                            onClick={() => toggleExpanded(rev.id)}
                            className="ml-1 text-s-ink/60 font-medium hover:text-s-ink hover:underline"
                          >
                            {isExpanded ? t("readLess") : t("readMore")}
                          </button>
                        )}
                      </p>
                    )}

                    {/* Flag Review */}
                    <div className="mt-2 flex justify-end">
                      {flaggingReviewId === rev.id ? (
                        <div
                          className="w-full rounded-[12px] p-3 mt-1"
                          style={{
                            background: "rgba(255,255,255,.70)",
                            backdropFilter: "blur(12px)",
                            border: "1px solid rgba(232,98,74,.15)",
                          }}
                        >
                          {flagSuccess ? (
                            <p className="text-xs text-s-sage font-heading py-1">
                              ✓ {t("flagSuccess")}
                            </p>
                          ) : (
                            <>
                              <p className="text-[10px] font-heading uppercase tracking-[.12em] text-s-ink/40 mb-2">
                                {t("flagReasonLabel")}
                              </p>
                              <textarea
                                value={flagReason}
                                onChange={(e) => setFlagReason(e.target.value)}
                                placeholder={t("flagReasonPlaceholder")}
                                rows={2}
                                className="w-full text-xs font-body text-s-ink bg-transparent border border-s-ink/10 rounded-[8px] px-2.5 py-2 resize-none outline-none focus:border-s-coral/40 placeholder:text-s-ink/30 transition-colors duration-150"
                              />
                              <div className="flex gap-2 mt-2 justify-end">
                                <button
                                  onClick={() => setFlaggingReviewId(null)}
                                  className="text-xs text-s-ink/40 hover:text-s-ink/60 font-heading uppercase tracking-[.08em] px-3 py-1.5 transition-colors duration-150"
                                >
                                  {t("flagCancel")}
                                </button>
                                <button
                                  onClick={submitFlag}
                                  disabled={flagLoading || flagReason.trim().length < 5}
                                  className="text-xs text-white font-body font-semibold uppercase tracking-[.08em] px-4 py-1.5 rounded-btn bg-s-coral-button hover:brightness-[1.06] active:scale-[0.97] disabled:opacity-50 transition-[transform,filter] duration-150"
                                  style={{ boxShadow: "0 2px 8px rgba(232,98,74,.25)" }}
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
                      ) : (
                        <button
                          onClick={() => handleFlagReview(rev.id)}
                          className="text-xs text-s-ink/30 hover:text-s-ink/60 transition-colors duration-150 font-heading uppercase tracking-[.08em]"
                        >
                          {t("flagReview")}
                        </button>
                      )}
                    </div>

                    {/* Review photos */}
                    {rev.review_photos && rev.review_photos.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {rev.review_photos.map((photo) => (
                          <button
                            key={photo.id}
                            onClick={() => onLightbox?.(photo.photo_url)}
                            className="relative w-16 h-16 rounded-[12px] overflow-hidden bg-s-bg-surface hover:bg-s-ink/[0.06] active:scale-[0.97] transition-[transform,background-color] duration-150 shrink-0"
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
                          : (rev as any).salon_response ?? null;
                      if (!reply) return null;
                      return (
                        <div className="mt-3 pl-4 border-l-2 border-s-sage/30">
                          <p className="text-xs text-s-sage font-medium flex items-center gap-1 mb-1">
                            <ShieldCheck className="w-3 h-3" />
                            {t("salonReplied")}
                          </p>
                          <p className="text-xs text-s-ink/60">{reply}</p>
                        </div>
                      );
                    })()}

                    <p className="text-xs text-s-ink/30 mt-2">
                      {new Date(rev.created_at).toLocaleDateString(locale === "de" ? "de-CH" : "en-GB")}
                    </p>
                  </div>
                );
              })}
            </div>

            {reviews.length > reviewsVisible.length && (
              <button
                onClick={() => setReviewPage((p) => p + 1)}
                className="mt-4 w-full py-2.5 border border-s-ink/10 rounded-btn text-sm text-s-ink/60 hover:border-s-ink/[0.18] hover:text-s-ink/80 active:scale-[0.97] transition-[border-color,color,transform] duration-150"
              >
                {t("showMoreReviews")}
              </button>
            )}
          </>
        )}
      </div>

      {/* Review form modal */}
      {showReviewForm && unreviewedBookingId && (
        <ReviewForm
          salonId={salonId}
          bookingId={unreviewedBookingId}
          onSuccess={() => {
            setShowReviewForm(false);
            onReviewSubmitted?.();
          }}
          onClose={() => setShowReviewForm(false)}
        />
      )}
    </div>
  );
}
