"use client";

import { useEffect, useState, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "motion/react";
import { Star, MessageCircle, Flag } from "lucide-react";
import DashboardLayout from "@/components-legacy/dashboard/DashboardLayout";
import Spinner from "@/components-legacy/ui/Spinner";
import EmptyState from "@/components-legacy/ui/EmptyState";
import ErrorState from "@/components-legacy/ui/ErrorState";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/app/[locale]/_components/primitives/Modal";
import { containerVariants, itemVariants } from "@/lib/animations";
import { resolveSwissLocale } from "@/lib/format";
import type { ReviewReply } from "@/app/[locale]/_components/salon/_shared";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles: { display_name: string | null; avatar_url: string | null } | null;
  // review_replies.review_id is UNIQUE, so PostgREST returns this embed as a
  // single OBJECT (to-one), never an array , see ownReply() below. Widened
  // 2026-07-25 (was array-only, silently hid the owner's own reply).
  review_replies?: ReviewReply | ReviewReply[] | null;
}

/**
 * Normalises `review_replies` (object OR array OR null, matching the
 * PostgREST to-one-embed shape , see publicReply() in salon/_shared.ts) to
 * one value, but WITHOUT the is_public filter publicReply() applies. This
 * page is the salon OWNER managing their own reply, not a customer-facing
 * render, so the owner must see + edit it even if is_public is ever false.
 * Only the array/object normalisation is shared logic here; the visibility
 * decision is page-specific, so this stays local instead of reusing or
 * weakening publicReply().
 */
function ownReply(raw: ReviewReply | ReviewReply[] | null | undefined): ReviewReply | null {
  return (Array.isArray(raw) ? raw[0] : raw) ?? null;
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={12} className={i <= rating ? "fill-s-star text-s-star" : "text-s-ink/20"} />
      ))}
    </div>
  );
}

export default function SalonReviewsPage() {
  const t = useTranslations("dashboard.reviewsPage") as any;
  const locale = useLocale();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  // H2: distinguish a failed fetch (error state + retry) from genuinely-empty (empty state),
  // and never spin forever when the salon can't be resolved.
  const [error, setError] = useState(false);
  const [salonReady, setSalonReady] = useState(false);
  const [salonId, setSalonId] = useState<string | null>(null);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [respondError, setRespondError] = useState(false);
  const [deleteErrorId, setDeleteErrorId] = useState<string | null>(null);
  // states-forms-06: Modal primitive replaces window.confirm() for this destructive action
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [flagging, setFlagging] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState("");
  const [saving, setSaving] = useState(false);

  // Get the salon owner's salon
  useEffect(() => {
    fetch("/api/salons/mine")
      .then((r) => r.json())
      .then((d) => {
        if (d.salon?.id) setSalonId(d.salon.id);
      })
      .catch((err) => console.error("[DashboardReviews] Failed to fetch salon ID:", err))
      // Mark settled either way so a null salon resolves to an error state, not a spinner.
      .finally(() => setSalonReady(true));
  }, []);

  const fetchReviews = useCallback(() => {
    // H2 fix: clear loading when there's no salon (was `if (!salonId) return;` BEFORE
    // setLoading(false), which left the spinner running forever).
    if (!salonId) { setLoading(false); return; }
    setLoading(true);
    setError(false);
    fetch(`/api/reviews/salon/${salonId}`)
      .then((r) => { if (!r.ok) throw new Error(`reviews ${r.status}`); return r.json(); })
      .then((d) => setReviews(d.items ?? []))
      .catch((err) => { console.error("[DashboardReviews] Failed to fetch reviews:", err); setError(true); setReviews([]); })
      .finally(() => setLoading(false));
  }, [salonId]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const retry = () => {
    setSalonReady(false);
    fetch("/api/salons/mine")
      .then((r) => r.json())
      .then((d) => setSalonId(d.salon?.id ?? null))
      .catch((err) => console.error("[DashboardReviews] retry salon fetch failed:", err))
      .finally(() => { setSalonReady(true); fetchReviews(); });
  };

  // Round 10 Y3: single write path (create AND edit, upsert server-side) into
  // review_replies via PATCH /api/reviews/[id]/respond. Was silently broken , the
  // route's schema required `reply_text` but this sent `salon_response`, so every
  // submit 400'd and the UI never checked res.ok, so it looked like it worked.
  const handleRespond = async (reviewId: string) => {
    if (!responseText.trim()) return;
    setSaving(true);
    setRespondError(false);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/respond`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply_text: responseText.trim() }),
      });
      if (!res.ok) throw new Error(`respond ${res.status}`);
      setRespondingTo(null);
      setResponseText("");
      fetchReviews();
    } catch (err) {
      console.error("[DashboardReviews] Failed to save reply:", err);
      setRespondError(true);
    } finally {
      setSaving(false);
    }
  };

  const handleEditReply = (review: Review) => {
    setRespondingTo(review.id);
    setResponseText(ownReply(review.review_replies)?.reply_text ?? "");
    setRespondError(false);
    setFlagging(null);
  };

  const handleDeleteReply = async (reviewId: string) => {
    setDeleteConfirmId(null);
    setSaving(true);
    setDeleteErrorId(null);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/respond`, { method: "DELETE" });
      if (!res.ok) throw new Error(`delete ${res.status}`);
      fetchReviews();
    } catch (err) {
      console.error("[DashboardReviews] Failed to delete reply:", err);
      setDeleteErrorId(reviewId);
    } finally {
      setSaving(false);
    }
  };

  const handleFlag = async (reviewId: string) => {
    if (!flagReason.trim()) return;
    setSaving(true);
    await fetch(`/api/reviews/${reviewId}/flag`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: flagReason }),
    });
    setSaving(false);
    setFlagging(null);
    setFlagReason("");
    fetchReviews();
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-[26px] font-semibold tracking-[-0.015em] text-s-ink">{t("title")}</h1>
        <p className="text-sm text-s-ink/40 mt-0.5">{t("subtitle")}</p>
      </div>

      {(!salonReady || loading) ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (error || !salonId) ? (
        <ErrorState title={t("loadErrorTitle")} message={t("loadErrorMessage")} retryLabel={t("retry")} onRetry={retry} />
      ) : reviews.length === 0 ? (
        <EmptyState icon={Star} title={t("emptyTitle")} message={t("emptyMessage")} />
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-3">
          {reviews.map((r) => (
            <motion.div
              key={r.id}
              variants={itemVariants}
              className="bg-white rounded-2xl border border-s-border shadow-warm-md p-4"
            >
              {/* Review header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-s-bg-sunken flex items-center justify-center text-xs font-bold text-s-ink shrink-0">
                    {(r.profiles?.display_name?.charAt(0) ?? "?").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-s-ink truncate">
                        {r.profiles?.display_name ?? t("anonymous")}
                      </p>
                      <Stars rating={r.rating} />
                    </div>
                    <p className="text-[12px] text-s-ink/30">
                      {new Date(r.created_at).toLocaleDateString(resolveSwissLocale(locale), {
                        day: "2-digit", month: "2-digit", year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                {/* Flag button */}
                <button
                  onClick={() => { setFlagging(r.id); setRespondingTo(null); }}
                  className="text-s-ink/30 hover:text-s-error p-1 transition-colors"
                  title={t("flagTitle")}
                >
                  <Flag size={14} strokeWidth={1.6} />
                </button>
              </div>

              {/* Comment */}
              {r.comment && (
                <p className="text-sm text-s-ink/70 mb-3 prose-measure">&ldquo;{r.comment}&rdquo;</p>
              )}

              {/* Existing salon response, plus edit/delete (round 10 Y3: create-only before,
                  a reply had no way to be changed or removed once sent). Hidden while its
                  own edit form is open below (respondingTo === r.id) to avoid showing the
                  stale text twice. */}
              {ownReply(r.review_replies) && respondingTo !== r.id && (
                <div className="bg-s-bg-sunken rounded-btn p-3 mb-3">
                  <p className="text-[12px] font-bold text-s-ink mb-1">{t("yourReply")}</p>
                  <p className="text-xs text-s-ink/70">{ownReply(r.review_replies)?.reply_text}</p>
                  <div className="flex gap-4 mt-2">
                    <button
                      onClick={() => handleEditReply(r)}
                      className="text-[12px] font-medium text-s-ink-2 hover:text-s-ink transition-colors"
                    >
                      {t("editReply")}
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(r.id)}
                      className="text-[12px] font-medium text-s-error hover:brightness-110 transition-[filter]"
                    >
                      {t("deleteReply")}
                    </button>
                  </div>
                  {deleteErrorId === r.id && (
                    <p className="text-[12px] text-s-error mt-1.5">{t("deleteReplyError")}</p>
                  )}
                </div>
              )}

              {/* Respond button / form , create (no reply yet) or edit (respondingTo === r.id) */}
              {!flagging && (respondingTo === r.id || !ownReply(r.review_replies)) && (
                <>
                  {respondingTo === r.id ? (
                    <div className="space-y-2">
                      <textarea
                        rows={3}
                        maxLength={500}
                        placeholder={t("replyPlaceholder")}
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        className="w-full px-3 py-2 text-s-ink text-xs focus:outline-none resize-none" // mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17)
                      />
                      <div className="flex gap-2 items-center">
                        <span className="text-[12px] text-s-ink/30">{responseText.length}/500</span>
                        <div className="flex-1" />
                        <button
                          onClick={() => { setRespondingTo(null); setResponseText(""); setRespondError(false); }}
                          className="px-3 py-1.5 rounded-btn border border-s-border text-s-ink-2 text-xs hover:bg-s-bg-sunken transition-colors"
                        >
                          {t("cancel")}
                        </button>
                        <button
                          onClick={() => handleRespond(r.id)}
                          disabled={saving || !responseText.trim()}
                          className="px-3 py-1.5 rounded-btn bg-s-ink text-white text-xs font-medium hover:bg-black disabled:opacity-50 flex items-center gap-1 transition-colors"
                        >
                          {saving && <Spinner size="sm" invert />}
                          {t("send")}
                        </button>
                      </div>
                      {respondError && <p className="text-[12px] text-s-error">{t("respondError")}</p>}
                    </div>
                  ) : (
                    <button
                      onClick={() => { setRespondingTo(r.id); setResponseText(""); setRespondError(false); setFlagging(null); }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-btn border border-s-ink text-s-ink text-xs font-medium hover:bg-s-bg-sunken transition-colors"
                    >
                      <MessageCircle size={12} />
                      {t("writeReply")}
                    </button>
                  )}
                </>
              )}

              {/* Flagging form */}
              {flagging === r.id && (
                <div className="space-y-2 mt-3 p-3 bg-s-error-bg rounded-btn border border-s-error/15">
                  <p className="text-xs font-medium text-s-error">{t("flagQuestion")}</p>
                  <textarea
                    rows={2}
                    maxLength={250}
                    placeholder={t("flagPlaceholder")}
                    value={flagReason}
                    onChange={(e) => setFlagReason(e.target.value)}
                    className="w-full px-3 py-2 text-s-ink text-xs focus:outline-none resize-none" // mockup-ok: dead-class removal only, textarea already caught before this change (V3-D-input-fill-2026-07-17)
                  />
                  <div className="flex gap-2 items-center justify-end mt-2">
                    <button
                      onClick={() => { setFlagging(null); setFlagReason(""); }}
                      className="px-3 py-1.5 rounded-btn border border-s-border text-s-ink-2 text-xs hover:bg-s-bg-sunken transition-colors"
                    >
                      {t("cancel")}
                    </button>
                    <button
                      onClick={() => handleFlag(r.id)}
                      disabled={saving || !flagReason.trim()}
                      className="px-3 py-1.5 rounded-btn bg-s-error hover:brightness-110 text-white text-xs font-medium disabled:opacity-50 flex items-center gap-1 transition-colors"
                    >
                      {saving && <Spinner size="sm" invert />}
                      {t("flagSubmit")}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
      {/* states-forms-06: destructive-action confirm via the shared Modal, never window.confirm().
          mockup-ok: verbatim reuse of the already-shipped, owner-approved confirm-footer treatment
          from app/[locale]/queue/[token]/page.tsx:589-613 (same Modal + rounded-full button pair),
          not a new design choice. */}
      <Modal isOpen={!!deleteConfirmId} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }} size="sm" keyboardDismissDisabled={saving} isDismissable={!saving}>
        <ModalHeader title={t("deleteReply")} closeButton={!saving} />
        <ModalBody>
          <p>{t("deleteReplyConfirm")}</p>
        </ModalBody>
        <ModalFooter>
          <button
            type="button"
            onClick={() => setDeleteConfirmId(null)}
            disabled={saving}
            className="rounded-full border border-s-border bg-white px-5 py-2.5 text-[14px] font-semibold text-s-ink transition-colors hover:bg-s-bg-sunken disabled:opacity-50" // mockup-ok
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={() => { if (deleteConfirmId) void handleDeleteReply(deleteConfirmId); }}
            disabled={saving}
            className="rounded-full bg-s-error px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:brightness-[1.06] disabled:opacity-50" // mockup-ok
          >
            {saving ? <Spinner size="sm" invert /> : t("deleteReply")}
          </button>
        </ModalFooter>
      </Modal>
    </DashboardLayout>
  );
}
