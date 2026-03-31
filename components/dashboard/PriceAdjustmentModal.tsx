"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("dashboard.pricing") as any;
  const [newPrice, setNewPrice] = useState<string>("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingDispute, setPendingDispute] = useState<{ requested_amount: number; status: string } | null>(null);

  // Check for existing pending dispute
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/bookings/${bookingId}/dispute`)
      .then(r => { if (!r.ok || cancelled) return null; return r.json(); })
      .then(d => {
        if (!cancelled && d?.dispute && d.dispute.status === "pending") {
          setPendingDispute(d.dispute);
        }
      })
      .catch((err) => console.error("[PriceAdjustmentModal] failed to load dispute data:", err));
    return () => { cancelled = true; };
  }, [bookingId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const maxUpcharge = Math.round(currentAmount * 1.5);

  const handleSubmit = async () => {
    const amount = Math.round(parseFloat(newPrice) * 100);
    if (isNaN(amount) || amount <= 0) {
      setError(t("invalidAmount"));
      return;
    }
    if (amount > maxUpcharge) {
      setError(`${t("max")} — ${formatCurrency(maxUpcharge, locale)}`);
      return;
    }
    if (!reason.trim()) {
      setError(t("enterReason"));
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
        throw new Error(data.error ?? data.message ?? t("genericError"));
      }
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("genericError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-s-ink/40 backdrop-blur-[6px]" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="price-modal-title">
      <div className="bg-white dark:bg-s-dm-surface rounded-[16px] p-6 mx-4 max-w-sm w-full shadow-surface" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign size={18} className="text-s-coral" />
            <h3 id="price-modal-title" className="font-heading font-bold text-s-ink dark:text-s-dm-text">{t("title")}</h3>
          </div>
          <button onClick={onClose} aria-label={t("close")} className="p-2 rounded-pill hover:bg-s-ink/5 dark:hover:bg-white/5 transition-colors duration-150">
            <X size={18} className="text-s-ink/40 dark:text-s-dm-text/40" />
          </button>
        </div>

        {pendingDispute ? (
          <div className="rounded-[16px] border border-s-amber/20 bg-s-amber-subtle p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={14} className="text-s-amber" />
              <p className="text-sm font-medium text-s-ink dark:text-s-dm-text">{t("pending")}</p>
            </div>
            <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50">{t("pendingDesc")}</p>
            <p className="text-sm font-medium text-s-coral mt-2">
              {formatCurrency(pendingDispute.requested_amount, locale)}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 mb-1">{t("currentPrice")}</p>
              <p className="data-text font-bold text-lg text-s-ink dark:text-s-dm-text">
                {formatCurrency(currentAmount, locale)}
              </p>
            </div>

            <div className="mb-3">
              <label className="text-xs text-s-ink/50 dark:text-s-dm-text/50 mb-1 block">{t("newPrice")}</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newPrice}
                onChange={e => setNewPrice(e.target.value)}
                className="w-full px-3 py-2 rounded-input border border-s-ink/10 dark:border-white/10 bg-s-bg-surface dark:bg-s-dm-bg text-sm text-s-ink dark:text-s-dm-text outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20"
              />
              <p className="text-[10px] text-s-ink/30 dark:text-s-dm-text/30 mt-0.5">{t("max")}</p>
            </div>

            <div className="mb-4">
              <label className="text-xs text-s-ink/50 dark:text-s-dm-text/50 mb-1 block">{t("reason")}</label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
                placeholder={t("reasonPlaceholder")}
                className="w-full px-3 py-2 rounded-input border border-s-ink/10 dark:border-white/10 bg-s-bg-surface dark:bg-s-dm-bg text-sm text-s-ink dark:text-s-dm-text outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20 resize-none"
              />
            </div>

            {error && <p role="alert" className="text-xs text-s-coral mb-3">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-2.5 rounded-pill active:scale-[0.98] bg-s-coral text-white text-[11px] font-heading font-bold uppercase tracking-[.06em] hover:brightness-[1.06] transition-[transform,filter] duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-coral-glow"
            >
              {submitting && <Spinner size="sm" invert />}
              {t("submit")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
