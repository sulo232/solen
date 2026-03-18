"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Star, MessageCircle } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import { containerVariants, itemVariants } from "@/lib/animations";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  salon_response: string | null;
  salon_response_at: string | null;
  created_at: string;
  profiles: { display_name: string | null; avatar_url: string | null } | null;
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={12} className={i <= rating ? "fill-s-coral text-s-coral" : "text-gray-200"} />
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

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl text-dark">Bewertungen</h1>
        <p className="text-sm text-dark/40 mt-0.5">Kundenbewertungen lesen und antworten</p>
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
              className="bg-white rounded-card border border-gray-100 shadow-card p-4"
            >
              {/* Review header */}
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-s-coral/10 flex items-center justify-center text-xs font-bold text-s-coral shrink-0">
                  {(r.profiles?.display_name ?? "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-dark truncate">
                      {r.profiles?.display_name ?? "Anonym"}
                    </p>
                    <Stars rating={r.rating} />
                  </div>
                  <p className="text-[10px] text-dark/30">
                    {new Date(r.created_at).toLocaleDateString("de-CH", {
                      day: "2-digit", month: "2-digit", year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Comment */}
              {r.comment && (
                <p className="text-sm text-dark/70 mb-3">&ldquo;{r.comment}&rdquo;</p>
              )}

              {/* Existing salon response */}
              {r.salon_response && (
                <div className="bg-s-coral/5 rounded-lg p-3 mb-3">
                  <p className="text-[10px] font-bold text-s-coral mb-1">Deine Antwort</p>
                  <p className="text-xs text-dark/70">{r.salon_response}</p>
                </div>
              )}

              {/* Respond button / form */}
              {!r.salon_response && (
                <>
                  {respondingTo === r.id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Antwort schreiben..."
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-button border border-gray-200 text-xs focus:outline-none focus:border-s-coral"
                      />
                      <button
                        onClick={() => handleRespond(r.id)}
                        disabled={saving || !responseText.trim()}
                        className="px-3 py-2 rounded-button bg-s-coral text-white text-xs font-medium disabled:opacity-50 flex items-center gap-1"
                      >
                        {saving && <Spinner size="sm" invert />}
                        Senden
                      </button>
                      <button
                        onClick={() => { setRespondingTo(null); setResponseText(""); }}
                        className="px-2 py-2 rounded-button border border-gray-200 text-dark/40 text-xs"
                      >
                        Abbrechen
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setRespondingTo(r.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-button border border-s-coral/30 text-s-coral text-xs font-medium hover:bg-s-coral/5 transition-colors"
                    >
                      <MessageCircle size={12} />
                      Antwort schreiben
                    </button>
                  )}
                </>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </DashboardLayout>
  );
}
