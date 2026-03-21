"use client";

import { useState, useEffect } from "react";
import { X, DollarSign, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";
import Spinner from "@/components/ui/Spinner";

interface PriceAdjustmentModalProps {
  bookingId: string;
  currentAmount: number;
  locale: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PriceAdjustmentModal({
  bookingId,
  currentAmount,
  locale,
  onClose,
  onSuccess,
}: PriceAdjustmentModalProps) {
  const [newPrice, setNewPrice] = useState<string>("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingDispute, setPendingDispute] = useState<{ requested_amount: number; status: string } | null>(null);

  // Check for existing pending dispute
  useEffect(() => {
    fetch(`/api/bookings/${bookingId}/dispute`)
      .then(r => r.json())
      .then(d => {
        if (d.dispute && d.dispute.status === "pending") {
          setPendingDispute(d.dispute);
        }
      })
      .catch(() => {});
  }, [bookingId]);

  const maxUpcharge = Math.round(currentAmount * 1.5);

  const handleSubmit = async () => {
    const amount = Math.round(parseFloat(newPrice) * 100);
    if (isNaN(amount) || amount <= 0) {
      setError("Gültigen Betrag eingeben");
      return;
    }
    if (amount > maxUpcharge) {
      setError(`Maximum ${formatCurrency(maxUpcharge, locale)} (150% des Originals)`);
      return;
    }
    if (!reason.trim()) {
      setError("Bitte Grund angeben");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/dispute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requested_amount: amount,
          salon_reason: reason.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? data.message ?? "Fehler");
      }
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    } finally {
      setSubmitting(false);
    }
  };

  const labels = {
    de: {
      title: "Preisänderung anfragen",
      currentPrice: "Aktueller Preis",
      newPrice: "Neuer Preis (CHF)",
      reason: "Grund für die Änderung",
      reasonPlaceholder: "z.B. Zusätzliche Behandlung durchgeführt...",
      submit: "Preisänderung anfragen",
      pending: "Ausstehende Preisänderung",
      pendingDesc: "Wartet auf Kundenbestätigung",
      max: "Max. 150% des Originalpreises",
    },
    en: {
      title: "Request Price Adjustment",
      currentPrice: "Current Price",
      newPrice: "New Price (CHF)",
      reason: "Reason for change",
      reasonPlaceholder: "e.g. Additional treatment performed...",
      submit: "Request Adjustment",
      pending: "Pending Adjustment",
      pendingDesc: "Waiting for customer confirmation",
      max: "Max 150% of original price",
    },
  };
  const l = labels[locale as "de" | "en"] ?? labels.de;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-s-ink/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-s-dm-surface rounded-card p-6 mx-4 max-w-sm w-full shadow-glass" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign size={18} className="text-s-coral" />
            <h3 className="font-heading font-bold text-s-ink dark:text-s-dm-text">{l.title}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-button hover:bg-s-ink/5 dark:hover:bg-white/5 transition-colors">
            <X size={18} className="text-s-ink/40 dark:text-s-dm-text/40" />
          </button>
        </div>

        {pendingDispute ? (
          <div className="rounded-card border border-s-amber/20 bg-s-amber-subtle p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={14} className="text-s-amber" />
              <p className="text-sm font-medium text-s-ink dark:text-s-dm-text">{l.pending}</p>
            </div>
            <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50">{l.pendingDesc}</p>
            <p className="text-sm font-medium text-s-coral mt-2">
              {formatCurrency(pendingDispute.requested_amount, locale)}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 mb-1">{l.currentPrice}</p>
              <p className="data-text font-bold text-lg text-s-ink dark:text-s-dm-text">
                {formatCurrency(currentAmount, locale)}
              </p>
            </div>

            <div className="mb-3">
              <label className="text-xs text-s-ink/50 dark:text-s-dm-text/50 mb-1 block">{l.newPrice}</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newPrice}
                onChange={e => setNewPrice(e.target.value)}
                className="w-full px-3 py-2 rounded-button border border-s-ink/10 dark:border-white/10 bg-s-bg-surface dark:bg-s-dm-bg text-sm text-s-ink dark:text-s-dm-text outline-none focus:border-s-coral"
              />
              <p className="text-[10px] text-s-ink/30 dark:text-s-dm-text/30 mt-0.5">{l.max}</p>
            </div>

            <div className="mb-4">
              <label className="text-xs text-s-ink/50 dark:text-s-dm-text/50 mb-1 block">{l.reason}</label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
                placeholder={l.reasonPlaceholder}
                className="w-full px-3 py-2 rounded-button border border-s-ink/10 dark:border-white/10 bg-s-bg-surface dark:bg-s-dm-bg text-sm text-s-ink dark:text-s-dm-text outline-none focus:border-s-coral resize-none"
              />
            </div>

            {error && <p className="text-xs text-s-coral mb-3">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-2.5 rounded-button bg-s-coral text-white text-sm font-medium hover:bg-s-coral/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting && <Spinner size="sm" invert />}
              {l.submit}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
