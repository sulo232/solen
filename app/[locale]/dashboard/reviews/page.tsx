"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Star, MessageCircle, Flag } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import { containerVariants, itemVariants } from "@/lib/animations";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles: { display_name: string | null; avatar_url: string | null } | null;
  review_replies?: { reply_text: string; is_public: boolean }[];
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={12} className={i <= rating ? "fill-s-coral text-s-coral" : "text-s-ink/20 dark:text-s-dm-text/20"} />
      ))}
    </div>
  );
}

export default function SalonReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [salonId, setSalonId] = useState<string | null>(null);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
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
      .catch(() => {});
  }, []);

  const fetchReviews = useCallback(() => {
    if (!salonId) return;
    setLoading(true);
    fetch(`/api/reviews/salon/${salonId}`)
      .then((r) => r.json())
      .then((d) => setReviews(d.items ?? []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [salonId]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleRespond = async (reviewId: string) => {
    if (!responseText.trim()) return;
    setSaving(true);
    await fetch(`/api/reviews/${reviewId}/respond`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ salon_response: responseText }),
    });
    setSaving(false);
    setRespondingTo(null);
    setResponseText("");
    fetchReviews();
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
        <h1 className="font-heading font-bold text-2xl text-s-ink dark:text-s-dm-text">Bewertungen</h1>
        <p className="text-sm text-s-ink/40 dark:text-s-dm-text/40 mt-0.5">Kundenbewertungen lesen und antworten</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : reviews.length === 0 ? (
        <EmptyState icon={Star} title="Keine Bewertungen" message="Noch keine Bewertungen von Kunden erhalten." />
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-3">
          {reviews.map((r) => (
            <motion.div
              key={r.id}
              variants={itemVariants}
              className="bg-white dark:bg-s-dm-surface rounded-[12px] border border-s-ink/5 dark:border-white/5 shadow-warm-md p-4"
            >
              {/* Review header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-s-coral/10 flex items-center justify-center text-xs font-bold text-s-coral shrink-0">
                    {(r.profiles?.display_name?.charAt(0) ?? "?").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-s-ink dark:text-s-dm-text truncate">
                        {r.profiles?.display_name ?? "Anonym"}
                      </p>
                      <Stars rating={r.rating} />
                    </div>
                    <p className="text-[10px] text-s-ink/30 dark:text-s-dm-text/30">
                      {new Date(r.created_at).toLocaleDateString("de-CH", {
                        day: "2-digit", month: "2-digit", year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                {/* Flag button */}
                <button
                  onClick={() => { setFlagging(r.id); setRespondingTo(null); }}
                  className="text-s-ink/30 hover:text-s-coral dark:text-s-dm-text/30 dark:hover:text-s-coral p-1 transition-colors"
                  title="Bewertung melden"
                >
                  <Flag size={14} />
                </button>
              </div>

              {/* Comment */}
              {r.comment && (
                <p className="text-sm text-s-ink/70 dark:text-s-dm-text/70 mb-3">&ldquo;{r.comment}&rdquo;</p>
              )}

              {/* Existing salon response */}
              {r.review_replies && r.review_replies.length > 0 && (
                <div className="bg-s-coral/5 rounded-btn p-3 mb-3">
                  <p className="text-[10px] font-bold text-s-coral mb-1">Deine Antwort</p>
                  <p className="text-xs text-s-ink/70 dark:text-s-dm-text/70">{r.review_replies[0].reply_text}</p>
                </div>
              )}

              {/* Respond button / form */}
              {(!r.review_replies || r.review_replies.length === 0) && !flagging && (
                <>
                  {respondingTo === r.id ? (
                    <div className="space-y-2">
                      <textarea
                        rows={3}
                        maxLength={500}
                        placeholder="Antwort schreiben..."
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        className="w-full px-3 py-2 rounded-btn border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-surface text-s-ink dark:text-s-dm-text text-xs focus:outline-none focus:border-s-coral resize-none"
                      />
                      <div className="flex gap-2 items-center">
                        <span className="text-[10px] text-s-ink/30 dark:text-s-dm-text/30">{responseText.length}/500</span>
                        <div className="flex-1" />
                        <button
                          onClick={() => { setRespondingTo(null); setResponseText(""); }}
                          className="px-3 py-1.5 rounded-btn border border-s-ink/10 dark:border-white/10 text-s-ink/40 dark:text-s-dm-text/40 text-xs"
                        >
                          Abbrechen
                        </button>
                        <button
                          onClick={() => handleRespond(r.id)}
                          disabled={saving || !responseText.trim()}
                          className="px-3 py-1.5 rounded-btn bg-s-coral text-white text-xs font-medium disabled:opacity-50 flex items-center gap-1"
                        >
                          {saving && <Spinner size="sm" invert />}
                          Senden
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setRespondingTo(r.id); setFlagging(null); }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-btn border border-s-coral/30 text-s-coral text-xs font-medium hover:bg-s-coral/5 transition-colors"
                    >
                      <MessageCircle size={12} />
                      Antwort schreiben
                    </button>
                  )}
                </>
              )}

              {/* Flagging form */}
              {flagging === r.id && (
                <div className="space-y-2 mt-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-btn border border-red-100 dark:border-red-900/30">
                  <p className="text-xs font-medium text-red-800 dark:text-red-400">Warum meldest du diese Bewertung?</p>
                  <textarea
                    rows={2}
                    maxLength={250}
                    placeholder="Begründung (z.B. Fake-Bewertung, Beleidigung)..."
                    value={flagReason}
                    onChange={(e) => setFlagReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-btn border border-red-200 dark:border-red-900/50 bg-white dark:bg-s-dm-surface text-s-ink dark:text-s-dm-text text-xs focus:outline-none focus:border-red-400 resize-none"
                  />
                  <div className="flex gap-2 items-center justify-end mt-2">
                    <button
                      onClick={() => { setFlagging(null); setFlagReason(""); }}
                      className="px-3 py-1.5 rounded-btn border border-s-ink/10 dark:border-white/10 text-s-ink/60 dark:text-s-dm-text/60 text-xs"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={() => handleFlag(r.id)}
                      disabled={saving || !flagReason.trim()}
                      className="px-3 py-1.5 rounded-btn bg-red-500 hover:bg-red-600 text-white text-xs font-medium disabled:opacity-50 flex items-center gap-1 transition-colors"
                    >
                      {saving && <Spinner size="sm" invert />}
                      Melden
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </DashboardLayout>
  );
}
