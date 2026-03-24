"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Check, X, AlertTriangle, ArrowLeft, Receipt, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";
import Spinner from "@/components/ui/Spinner";

interface DisputeData {
  id: string;
  booking_id: string;
  original_amount: number;
  requested_amount: number;
  salon_reason: string;
  status: string;
  expires_at: string | null;
  auto_approve_at: string | null;
  created_at: string;
  salon_name?: string;
  service_name?: string;
}

export default function RespondAdjustmentPage() {
  const { id: bookingId } = useParams<{ id: string }>();
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("common");
  const [dispute, setDispute] = useState<DisputeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<"approved" | "disputed" | null>(null);
  const [responseText, setResponseText] = useState("");

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
        body: JSON.stringify({ action, customer_response: responseText || undefined }),
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

  const expiresAt = dispute?.expires_at ? new Date(dispute.expires_at) : null;
  const hoursLeft = expiresAt
    ? Math.max(0, Math.round((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60)))
    : null;
  const isExpired = expiresAt ? expiresAt.getTime() < Date.now() : false;

  const labels = {
    de: {
      title: "Preisanpassung",
      original: "Ursprünglicher Preis",
      adjusted: "Angeforderter Preis",
      difference: "Differenz",
      reason: "Begründung des Salons",
      approve: "Genehmigen",
      dispute: "Einspruch",
      approved: "Preisanpassung genehmigt",
      disputed: "Einspruch eingereicht",
      approvedDesc: "Der Salon wird den Differenzbetrag in Rechnung stellen.",
      disputedDesc: "Dein Einspruch wird von unserem Support-Team geprüft.",
      noDispute: "Keine offene Preisanpassung gefunden.",
      back: "Zurück",
      backDashboard: "Zurück zum Dashboard",
      autoApprove: (h: number) => `Automatische Genehmigung in ${h} Stunde${h !== 1 ? "n" : ""} ohne Reaktion.`,
      expired: "Diese Preisanpassung wurde automatisch genehmigt.",
      yourResponse: "Deine Antwort (optional)",
      responsePlaceholder: "Erkläre warum du nicht einverstanden bist...",
    },
    en: {
      title: "Price Adjustment",
      original: "Original Price",
      adjusted: "Requested Price",
      difference: "Difference",
      reason: "Salon's Reason",
      approve: "Approve",
      dispute: "Dispute",
      approved: "Price adjustment approved",
      disputed: "Dispute submitted",
      approvedDesc: "The salon will charge the difference.",
      disputedDesc: "Your dispute will be reviewed by our support team.",
      noDispute: "No pending price adjustment found.",
      back: "Back",
      backDashboard: "Back to Dashboard",
      autoApprove: (h: number) => `Auto-approved in ${h} hour${h !== 1 ? "s" : ""} without response.`,
      expired: "This price adjustment was automatically approved.",
      yourResponse: "Your response (optional)",
      responsePlaceholder: "Explain why you disagree...",
    },
  };
  const l = labels[locale as "de" | "en"] ?? labels.de;

  return (
    <div className="min-h-screen bg-s-bg-surface dark:bg-s-dm-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-s-dm-surface rounded-card shadow-card max-w-md w-full p-6"
      >
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : result ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center bg-s-coral/10">
              {result === "approved"
                ? <Check size={24} className="text-s-coral" />
                : <X size={24} className="text-s-coral" />}
            </div>
            <h2 className="font-heading font-bold text-lg text-s-ink dark:text-s-dm-text mb-2">
              {result === "approved" ? l.approved : l.disputed}
            </h2>
            <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 mb-6">
              {result === "approved" ? l.approvedDesc : l.disputedDesc}
            </p>
            <button onClick={() => router.push(`/${locale}/dashboard`)}
              className="px-5 py-2.5 rounded-btn bg-s-coral text-white text-sm font-medium">
              {l.backDashboard}
            </button>
          </div>
        ) : !dispute || (dispute.status !== "pending" && !isExpired) ? (
          <div className="text-center py-8">
            <Receipt size={28} className="mx-auto mb-3 text-s-ink/20 dark:text-s-dm-text/20" />
            <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50">{l.noDispute}</p>
            <button onClick={() => router.back()}
              className="mt-4 text-sm text-s-coral flex items-center gap-1 mx-auto">
              <ArrowLeft size={14} /> {l.back}
            </button>
          </div>
        ) : isExpired ? (
          <div className="text-center py-8">
            <Clock size={28} className="mx-auto mb-3 text-s-ink/20 dark:text-s-dm-text/20" />
            <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50">{l.expired}</p>
            <button onClick={() => router.push(`/${locale}/dashboard`)}
              className="mt-4 px-5 py-2.5 rounded-btn bg-s-coral text-white text-sm font-medium">
              {l.backDashboard}
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-s-amber-subtle flex items-center justify-center">
                <AlertTriangle size={18} className="text-s-amber" />
              </div>
              <div>
                <h1 className="font-heading font-bold text-lg text-s-ink dark:text-s-dm-text">{l.title}</h1>
                <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40">
                  {dispute.salon_name && `${dispute.salon_name} · `}
                  {dispute.service_name ?? "Service"}
                </p>
              </div>
            </div>

            <div className="bg-s-bg-surface dark:bg-s-dm-bg rounded-card p-4 mb-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-s-ink/50 dark:text-s-dm-text/50">{l.original}</span>
                <span className="data-text font-bold text-s-ink dark:text-s-dm-text">{formatCurrency(dispute.original_amount, locale)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-s-ink/50 dark:text-s-dm-text/50">{l.adjusted}</span>
                <span className="data-text font-bold text-s-coral">{formatCurrency(dispute.requested_amount, locale)}</span>
              </div>
              <div className="border-t border-s-ink/10 dark:border-s-dm-text/10 pt-2 flex justify-between text-sm">
                <span className="text-s-ink/50 dark:text-s-dm-text/50">{l.difference}</span>
                <span className="data-text font-bold text-s-coral">+{formatCurrency(diff, locale)} (+{diffPercent}%)</span>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs font-medium text-s-ink/40 dark:text-s-dm-text/40 uppercase tracking-wide mb-1">{l.reason}</p>
              <p className="text-sm text-s-ink/70 dark:text-s-dm-text/70 bg-s-bg-surface dark:bg-s-dm-bg rounded-btn px-3 py-2">{dispute.salon_reason}</p>
            </div>

            <div className="mb-4">
              <p className="text-xs font-medium text-s-ink/40 dark:text-s-dm-text/40 uppercase tracking-wide mb-1">{l.yourResponse}</p>
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder={l.responsePlaceholder}
                maxLength={500}
                rows={2}
                className="w-full text-sm rounded-btn border border-s-ink/10 dark:border-s-dm-text/10 bg-s-bg-sunken dark:bg-s-dm-bg px-3 py-2 text-s-ink dark:text-s-dm-text placeholder:text-s-ink/30 dark:placeholder:text-s-dm-text/30 focus:outline-none focus:ring-2 focus:ring-s-coral/30"
              />
            </div>

            {hoursLeft !== null && hoursLeft > 0 && (
              <p className="text-xs text-s-amber mb-4 flex items-center gap-1">
                <Clock size={12} /> {l.autoApprove(hoursLeft)}
              </p>
            )}

            <div className="flex gap-3">
              <button onClick={() => handleAction("approve")} disabled={submitting}
                className="flex-1 px-4 py-3 rounded-btn bg-s-coral text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting ? <Spinner size="sm" invert /> : <Check size={16} />}
                {l.approve}
              </button>
              <button onClick={() => handleAction("dispute")} disabled={submitting}
                className="flex-1 px-4 py-3 rounded-btn border border-s-coral text-s-coral text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-s-coral/5 transition-colors">
                {submitting ? <Spinner size="sm" /> : <X size={16} />}
                {l.dispute}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
