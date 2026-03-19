"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Star, MessageSquareWarning, Check, EyeOff, Trash2, X } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
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
          className={i <= rating ? "fill-s-coral text-s-coral" : "text-s-ink/20"}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-card shadow-xl w-full max-w-sm p-6">
        <h3 className="font-heading font-bold text-base text-dark mb-2">Bewertung löschen</h3>
        <p className="text-sm text-dark/50 mb-5">Bewertung endgültig löschen? Diese Aktion kann nicht rückgängig gemacht werden.</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-button border border-s-ink/10 text-sm text-dark/60">Abbrechen</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-button bg-s-coral text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
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
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleAction = async (id: string, action: "approve" | "hide") => {
    const body = action === "approve"
      ? { is_flagged: false, is_hidden: false }
      : { is_hidden: true };
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
        <h1 className="font-heading font-bold text-2xl text-dark">Bewertungs-Moderation</h1>
        <p className="text-sm text-dark/40 mt-0.5">Gemeldete und neue Bewertungen prüfen</p>
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
            className={`px-3 py-1.5 rounded-pill text-xs font-medium transition-colors ${
              tab === t.id ? "bg-s-coral text-white" : "bg-white border border-s-ink/10 text-dark/60 hover:border-s-coral"
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
              className={`bg-white rounded-card border shadow-card p-4 ${
                r.is_hidden ? "border-s-coral/30 bg-s-coral/[0.02]" : r.is_flagged ? "border-amber-200" : "border-s-ink/5"
              }`}
            >
              {/* Header */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Stars rating={r.rating} />
                <span className="text-xs text-dark/50">
                  Kunde: <strong className="text-dark/70">{r.profiles?.display_name ?? "Anonym"}</strong>
                </span>
                <span className="text-xs text-dark/30">·</span>
                <span className="text-xs text-dark/50">
                  Salon: <strong className="text-dark/70">{r.salons?.name ?? "—"}</strong>
                </span>
                <span className="text-xs text-dark/30">·</span>
                <span className="text-xs text-dark/30">
                  {new Date(r.created_at).toLocaleDateString("de-CH")}
                </span>
              </div>

              {/* Comment */}
              {r.comment && (
                <p className="text-sm text-dark/70 mb-2">&ldquo;{r.comment}&rdquo;</p>
              )}

              {/* Flag + hidden badges */}
              <div className="flex gap-1.5 mb-3 flex-wrap">
                {r.flag_reason && (
                  <span className="px-2 py-0.5 rounded-pill bg-amber-50 text-amber-700 text-[10px] font-bold">
                    {r.flag_reason}
                  </span>
                )}
                {r.is_hidden && (
                  <span className="px-2 py-0.5 rounded-pill bg-s-coral/10 text-s-coral text-[10px] font-bold">
                    Versteckt
                  </span>
                )}
              </div>

              {/* Existing admin response */}
              {r.admin_response && (
                <div className="bg-s-coral/5 rounded-lg p-3 mb-3">
                  <p className="text-[10px] font-bold text-s-coral mb-1">Admin-Antwort</p>
                  <p className="text-xs text-dark/70">{r.admin_response}</p>
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
                    className="flex-1 px-3 py-2 rounded-button border border-s-ink/10 text-xs focus:outline-none focus:border-s-coral"
                  />
                  <button
                    onClick={() => handleAdminResponse(r.id)}
                    disabled={!adminResponses[r.id]?.trim()}
                    className="px-3 py-2 rounded-button bg-s-coral text-white text-xs font-medium disabled:opacity-50"
                  >
                    Senden
                  </button>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                <button
                  onClick={() => handleAction(r.id, "approve")}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-button border border-s-coral/30 text-s-coral text-xs font-medium hover:bg-s-coral/5 transition-colors"
                >
                  <Check size={12} />
                  Genehmigen
                </button>
                <button
                  onClick={() => handleAction(r.id, "hide")}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-button border border-s-ink/10 text-dark/50 text-xs font-medium hover:bg-s-bg-surface transition-colors"
                >
                  <EyeOff size={12} />
                  Verstecken
                </button>
                <button
                  onClick={() => setDeleteTarget(r.id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-button border border-s-coral/30 text-s-coral text-xs font-medium hover:bg-s-coral/5 transition-colors"
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
