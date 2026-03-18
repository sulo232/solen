"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Check, X, AlertTriangle, ArrowLeft, Receipt } from "lucide-react";
import Spinner from "@/components/ui/Spinner";

interface DisputeData {
  id: string;
  booking_id: string;
  original_amount: number;
  requested_amount: number;
  salon_reason: string;
  status: string;
  auto_approve_at: string | null;
  created_at: string;
  salon_name?: string;
  service_name?: string;
}

export default function ApproveIncreasePage() {
  const { id: bookingId } = useParams<{ id: string }>();
  const locale = useLocale();
  const router = useRouter();
  const [dispute, setDispute] = useState<DisputeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<"approved" | "disputed" | null>(null);

  useEffect(() => {
    fetch(`/api/bookings/${bookingId}/dispute`)
      .then((r) => r.json())
      .then((d) => setDispute(d.dispute ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [bookingId]);

  const handleAction = async (action: "approve" | "dispute") => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/dispute`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) setResult(action === "approve" ? "approved" : "disputed");
    } finally {
      setSubmitting(false);
    }
  };

  const diff = dispute ? dispute.requested_amount - dispute.original_amount : 0;
  const diffPercent = dispute && dispute.original_amount > 0
    ? Math.round((diff / dispute.original_amount) * 100)
    : 0;

  const autoApproveDate = dispute?.auto_approve_at
    ? new Date(dispute.auto_approve_at)
    : null;
  const hoursLeft = autoApproveDate
    ? Math.max(0, Math.round((autoApproveDate.getTime() - Date.now()) / (1000 * 60 * 60)))
    : null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-card shadow-card max-w-md w-full p-6"
      >
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : result ? (
          <div className="text-center py-8">
            <div className={`w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center ${result === "approved" ? "bg-teal/10" : "bg-coral/10"}`}>
              {result === "approved"
                ? <Check size={24} className="text-teal" />
                : <X size={24} className="text-coral" />}
            </div>
            <h2 className="font-heading font-bold text-lg text-dark mb-2">
              {result === "approved" ? "Preisanpassung genehmigt" : "Einspruch eingereicht"}
            </h2>
            <p className="text-sm text-dark/50 mb-6">
              {result === "approved"
                ? "Der Salon wird den Differenzbetrag in Rechnung stellen."
                : "Dein Einspruch wird von unserem Support-Team geprüft."}
            </p>
            <button onClick={() => router.push(`/${locale}/dashboard`)}
              className="px-5 py-2.5 rounded-button bg-teal text-white text-sm font-medium">
              Zurück zum Dashboard
            </button>
          </div>
        ) : !dispute || dispute.status !== "pending" ? (
          <div className="text-center py-8">
            <Receipt size={28} className="mx-auto mb-3 text-dark/20" />
            <p className="text-sm text-dark/50">Keine offene Preisanpassung gefunden.</p>
            <button onClick={() => router.back()}
              className="mt-4 text-sm text-teal flex items-center gap-1 mx-auto">
              <ArrowLeft size={14} /> Zurück
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <AlertTriangle size={18} className="text-amber-500" />
              </div>
              <div>
                <h1 className="font-heading font-bold text-lg text-dark">Preisanpassung</h1>
                <p className="text-xs text-dark/40">
                  {dispute.salon_name && `${dispute.salon_name} · `}
                  {dispute.service_name ?? "Service"}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-card p-4 mb-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-dark/50">Ursprünglicher Preis</span>
                <span className="font-data font-bold text-dark">CHF {dispute.original_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-dark/50">Neuer Preis</span>
                <span className="font-data font-bold text-coral">CHF {dispute.requested_amount.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between text-sm">
                <span className="text-dark/50">Differenz</span>
                <span className="font-data font-bold text-coral">+CHF {diff.toFixed(2)} (+{diffPercent}%)</span>
              </div>
            </div>

            <div className="mb-5">
              <p className="text-xs font-medium text-dark/40 uppercase tracking-wide mb-1">Begründung des Salons</p>
              <p className="text-sm text-dark/70 bg-gray-50 rounded-button px-3 py-2">{dispute.salon_reason}</p>
            </div>

            {hoursLeft !== null && hoursLeft > 0 && (
              <p className="text-xs text-amber-600 mb-4">
                Automatische Genehmigung in {hoursLeft} Stunde{hoursLeft !== 1 ? "n" : ""} ohne Reaktion.
              </p>
            )}

            <div className="flex gap-3">
              <button onClick={() => handleAction("approve")} disabled={submitting}
                className="flex-1 px-4 py-3 rounded-button bg-teal text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting ? <Spinner size="sm" invert /> : <Check size={16} />}
                Genehmigen
              </button>
              <button onClick={() => handleAction("dispute")} disabled={submitting}
                className="flex-1 px-4 py-3 rounded-button border border-coral text-coral text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-coral/5 transition-colors">
                {submitting ? <Spinner size="sm" /> : <X size={16} />}
                Einspruch
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
