"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Star, MessageSquareWarning, Check, EyeOff, Trash2, X } from "lucide-react";
import DashboardLayout from "@/components-legacy/dashboard/DashboardLayout";
import { DashStatusPill } from "@/app/[locale]/_components/dashboard/DashboardUI";
import Spinner from "@/components-legacy/ui/Spinner";
import EmptyState from "@/components-legacy/ui/EmptyState";
import { containerVariants, itemVariants } from "@/lib/animations";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  is_flagged: boolean;
  is_hidden: boolean;
  flag_reason: string | null;
  admin_response: string | null;
  admin_response_at: string | null;
  salon_response: string | null;
  created_at: string;
  profiles: { display_name: string | null } | null;
  salons: { name: string } | null;
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={12}
          className={i <= rating ? "fill-s-star text-s-star" : "text-s-ink/20"}
        />
      ))}
    </div>
  );
}

/* ─── Delete Modal ─── */
function DeleteModal({
  onConfirm,
  onClose,
  loading,
}: {
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-s-ink/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-v5-float w-full max-w-sm p-6">
        <h3 className="font-heading text-base text-s-ink mb-2">Bewertung löschen</h3>
        <p className="text-sm text-s-ink/50 mb-5">Bewertung endgültig löschen? Diese Aktion kann nicht rückgängig gemacht werden.</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-btn border border-s-border text-sm text-s-ink-2 hover:bg-s-bg-sunken transition-colors">Abbrechen</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-btn bg-s-ink text-white text-sm font-medium hover:bg-black disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
          >
            {loading && <Spinner size="sm" invert />}
            Löschen
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function ReviewModerationPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"flagged" | "all">("flagged");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminResponses, setAdminResponses] = useState<Record<string, string>>({});

  const fetchReviews = useCallback(() => {
    setLoading(true);
    const url = tab === "flagged" ? "/api/admin/reviews?flagged=true" : "/api/admin/reviews";
    fetch(url)
      .then((r) => r.json())
      .then((d) => setReviews(d.reviews ?? []))
      .catch((err) => { console.error("[DashboardReviewModeration] failed to fetch reviews:", err); setReviews([]); })
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleAction = async (id: string, action: "approve" | "hide") => {
    const body = action === "approve"
      ? { moderation_status: "active" }
      : { moderation_status: "removed", removal_reason: "Versteckt durch Admin" };
    await fetch(`/api/admin/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    fetchReviews();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    await fetch(`/api/admin/reviews/${deleteTarget}`, { method: "DELETE" });
    setDeleteTarget(null);
    setActionLoading(false);
    fetchReviews();
  };

  const handleAdminResponse = async (id: string) => {
    const text = adminResponses[id];
    if (!text?.trim()) return;
    await fetch(`/api/admin/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admin_response: text }),
    });
    setAdminResponses((prev) => ({ ...prev, [id]: "" }));
    fetchReviews();
  };

  const flaggedCount = reviews.filter((r) => r.is_flagged).length;

  return (
    <DashboardLayout>
      {deleteTarget && (
        <DeleteModal
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          loading={actionLoading}
        />
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[26px] font-semibold tracking-[-0.015em] text-s-ink">Bewertungs-Moderation</h1>
        <p className="text-sm text-s-ink/40 mt-0.5">Gemeldete und neue Bewertungen prüfen</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {([
          { id: "flagged" as const, label: `Gemeldet (${flaggedCount})` },
          { id: "all" as const, label: "Alle Bewertungen" },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              tab === t.id ? "bg-s-ink text-white hover:bg-black" : "bg-white border border-s-border text-s-ink-2 hover:bg-s-bg-sunken hover:text-s-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : reviews.length === 0 ? (
        <EmptyState icon={MessageSquareWarning} title="Keine Bewertungen" message={tab === "flagged" ? "Keine gemeldeten Bewertungen." : "Noch keine Bewertungen vorhanden."} />
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-3">
          {reviews.map((r) => (
            <motion.div
              key={r.id}
              variants={itemVariants}
              className={`bg-white rounded-2xl border shadow-warm-md p-4 ${
                r.is_hidden ? "border-s-error/30 bg-s-error-bg/40" : r.is_flagged ? "border-s-warning/40" : "border-s-border"
              }`}
            >
              {/* Header */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Stars rating={r.rating} />
                <span className="text-xs text-s-ink/50">
                  Kunde: <strong className="text-s-ink/70">{r.profiles?.display_name ?? "Anonym"}</strong>
                </span>
                <span className="text-xs text-s-ink/30">·</span>
                <span className="text-xs text-s-ink/50">
                  Salon: <strong className="text-s-ink/70">{r.salons?.name ?? "—"}</strong>
                </span>
                <span className="text-xs text-s-ink/30">·</span>
                <span className="text-xs text-s-ink/30">
                  {new Date(r.created_at).toLocaleDateString("de-CH")}
                </span>
              </div>

              {/* Comment */}
              {r.comment && (
                <p className="text-sm text-s-ink/70 mb-2">&ldquo;{r.comment}&rdquo;</p>
              )}

              {/* Flag + hidden badges */}
              <div className="flex gap-1.5 mb-3 flex-wrap">
                {r.flag_reason && (
                  <DashStatusPill tone="warning">{r.flag_reason}</DashStatusPill>
                )}
                {r.is_hidden && (
                  <DashStatusPill tone="error">Versteckt</DashStatusPill>
                )}
              </div>

              {/* Existing admin response */}
              {r.admin_response && (
                <div className="bg-s-bg-sunken rounded-btn p-3 mb-3">
                  <p className="text-[10px] font-bold text-s-ink mb-1">Admin-Antwort</p>
                  <p className="text-xs text-s-ink/70">{r.admin_response}</p>
                </div>
              )}

              {/* Admin response input */}
              {!r.admin_response && (
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Öffentliche Antwort schreiben..."
                    value={adminResponses[r.id] ?? ""}
                    onChange={(e) => setAdminResponses((prev) => ({ ...prev, [r.id]: e.target.value }))}
                    className="flex-1 px-3 py-2 rounded-btn border border-s-border bg-white text-s-ink text-xs focus:outline-none focus:border-s-ink"
                  />
                  <button
                    onClick={() => handleAdminResponse(r.id)}
                    disabled={!adminResponses[r.id]?.trim()}
                    className="px-3 py-2 rounded-btn bg-s-ink text-white text-xs font-medium hover:bg-black disabled:opacity-50 transition-colors"
                  >
                    Senden
                  </button>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-s-border">
                <button
                  onClick={() => handleAction(r.id, "approve")}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-btn bg-s-ink text-white text-xs font-medium hover:bg-black transition-colors"
                >
                  <Check size={12} />
                  Genehmigen
                </button>
                <button
                  onClick={() => handleAction(r.id, "hide")}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-btn border border-s-border text-s-ink-2 text-xs font-medium hover:bg-s-bg-sunken hover:text-s-ink transition-colors"
                >
                  <EyeOff size={12} />
                  Verstecken
                </button>
                <button
                  onClick={() => setDeleteTarget(r.id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-btn border border-s-error/40 text-s-error text-xs font-medium hover:bg-s-error-bg transition-colors"
                >
                  <Trash2 size={12} />
                  Löschen
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </DashboardLayout>
  );
}
