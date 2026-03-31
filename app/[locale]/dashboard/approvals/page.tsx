"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { ShieldCheck, Check, X, MapPin, Mail, Calendar } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Spinner from "@/components/ui/Spinner";

interface PendingSalon {
  id: string;
  name: string;
  address: string | null;
  categories: string[];
  owner_email: string | null;
  phone: string | null;
  created_at: string;
  rejection_reason: string | null;
}

export default function ApprovalsPage() {
  const locale = useLocale();
  const [salons, setSalons] = useState<PendingSalon[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    fetch("/api/admin/salons?status=pending")
      .then((r) => r.json())
      .then((d) => setSalons(d.salons ?? []))
      .catch((err) => console.error("[DashboardApprovals] failed to fetch pending salons:", err))
      .finally(() => setLoading(false));
  }, []);

  async function approve(id: string) {
    setActionLoading(id);
    await fetch(`/api/admin/salons/${id}/approve`, { method: "PATCH" });
    setSalons((prev) => prev.filter((s) => s.id !== id));
    setActionLoading(null);
  }

  async function reject() {
    if (!rejectModal || !rejectReason.trim()) return;
    setActionLoading(rejectModal.id);
    await fetch(`/api/admin/salons/${rejectModal.id}/reject`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: rejectReason }),
    });
    setSalons((prev) => prev.filter((s) => s.id !== rejectModal.id));
    setRejectModal(null);
    setRejectReason("");
    setActionLoading(null);
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center gap-3">
        <ShieldCheck size={22} className="text-s-coral" />
        <div>
          <h1 className="font-heading font-bold text-2xl text-s-ink">Genehmigungen</h1>
          <p className="text-sm text-s-ink/40 mt-0.5">Neue Salons warten auf Freischaltung</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : salons.length === 0 ? (
        <div className="bg-white rounded-[12px] border border-s-ink/5 p-12 text-center">
          <ShieldCheck size={36} className="mx-auto mb-3 text-s-coral opacity-40" />
          <p className="text-s-ink/40 text-sm">Keine ausstehenden Genehmigungen</p>
        </div>
      ) : (
        <div className="space-y-4">
          {salons.map((salon) => (
            <div key={salon.id} className="bg-white rounded-[12px] border border-s-ink/5 shadow-warm-md p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <h2 className="font-heading font-bold text-lg text-s-ink">{salon.name}</h2>

                  {salon.owner_email && (
                    <div className="flex items-center gap-1.5 text-sm text-s-ink/50">
                      <Mail size={13} />
                      <span>{salon.owner_email}</span>
                    </div>
                  )}
                  {salon.address && (
                    <div className="flex items-center gap-1.5 text-sm text-s-ink/50">
                      <MapPin size={13} />
                      <span>{salon.address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-sm text-s-ink/40">
                    <Calendar size={13} />
                    <span>Registriert {new Date(salon.created_at).toLocaleDateString("de-CH")}</span>
                  </div>

                  {salon.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {salon.categories.map((cat) => (
                        <span key={cat} className="px-2 py-0.5 rounded-pill bg-s-coral/10 text-s-coral text-xs font-medium">
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => approve(salon.id)}
                    disabled={actionLoading === salon.id}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-btn bg-s-coral text-white text-sm font-medium hover:brightness-[1.06] transition-colors disabled:opacity-50"
                  >
                    <Check size={15} />
                    Genehmigen
                  </button>
                  <button
                    onClick={() => setRejectModal({ id: salon.id, name: salon.name })}
                    disabled={actionLoading === salon.id}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-btn border border-s-coral/30 text-s-coral text-sm font-medium hover:bg-s-coral/5 transition-colors disabled:opacity-50"
                  >
                    <X size={15} />
                    Ablehnen
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 bg-s-ink/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-s-dm-surface rounded-input shadow-v5-float w-full max-w-md p-6">
            <h3 className="font-heading font-bold text-lg text-s-ink mb-1">Salon ablehnen</h3>
            <p className="text-sm text-s-ink/50 mb-4">
              Begründung für <strong>{rejectModal.name}</strong> (wird per E-Mail gesendet):
            </p>
            <textarea
              className="w-full border border-s-ink/10 rounded-btn px-3 py-2 text-sm text-s-ink resize-none focus:outline-none focus:border-s-coral"
              rows={4}
              placeholder="z.B. Unvollständige Angaben, kein Basel-Bezug..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2 mt-4 justify-end">
              <button
                onClick={() => { setRejectModal(null); setRejectReason(""); }}
                className="px-4 py-2 rounded-btn text-sm text-s-ink/50 hover:text-s-ink transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={reject}
                disabled={!rejectReason.trim() || actionLoading === rejectModal.id}
                className="px-4 py-2 rounded-btn bg-s-coral text-white text-sm font-medium hover:brightness-[1.06] transition-colors disabled:opacity-50"
              >
                Ablehnen & E-Mail senden
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
