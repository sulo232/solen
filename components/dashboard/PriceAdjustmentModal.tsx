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
      setError(l.invalidAmount);
      return;
    }
    if (amount > maxUpcharge) {
      setError(`${l.max} — ${formatCurrency(maxUpcharge, locale)}`);
      return;
    }
    if (!reason.trim()) {
      setError(l.enterReason);
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
        throw new Error(data.error ?? data.message ?? l.genericError);
      }
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : l.genericError);
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
      invalidAmount: "Gültigen Betrag eingeben",
      enterReason: "Bitte Grund angeben",
      genericError: "Fehler",
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
      invalidAmount: "Enter a valid amount",
      enterReason: "Please enter a reason",
      genericError: "Error",
    },
    fr: {
      title: "Demander un ajustement de prix",
      currentPrice: "Prix actuel",
      newPrice: "Nouveau prix (CHF)",
      reason: "Raison du changement",
      reasonPlaceholder: "p.ex. Traitement supplémentaire effectué...",
      submit: "Demander l'ajustement",
      pending: "Ajustement en attente",
      pendingDesc: "En attente de confirmation du client",
      max: "Max. 150% du prix original",
      invalidAmount: "Entrez un montant valide",
      enterReason: "Veuillez indiquer une raison",
      genericError: "Erreur",
    },
    it: {
      title: "Richiedi adeguamento prezzo",
      currentPrice: "Prezzo attuale",
      newPrice: "Nuovo prezzo (CHF)",
      reason: "Motivo della modifica",
      reasonPlaceholder: "es. Trattamento aggiuntivo eseguito...",
      submit: "Richiedi adeguamento",
      pending: "Adeguamento in sospeso",
      pendingDesc: "In attesa di conferma del cliente",
      max: "Max. 150% del prezzo originale",
      invalidAmount: "Inserisci un importo valido",
      enterReason: "Inserisci un motivo",
      genericError: "Errore",
    },
  };
  const l = labels[locale as keyof typeof labels] ?? labels.de;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-s-ink/40 backdrop-blur-lg" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="price-modal-title">
      <div className="bg-white/90 dark:bg-s-dm-surface/95 backdrop-blur-xl rounded-card p-6 mx-4 max-w-sm w-full shadow-glass" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign size={18} className="text-s-coral" />
            <h3 id="price-modal-title" className="font-heading font-bold text-s-ink dark:text-s-dm-text">{l.title}</h3>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1 rounded-btn hover:bg-s-ink/5 dark:hover:bg-white/5 transition-colors">
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
                className="w-full px-3 py-2 rounded-input border border-s-ink/10 dark:border-white/10 bg-s-bg-surface dark:bg-s-dm-bg text-sm text-s-ink dark:text-s-dm-text outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20"
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
                className="w-full px-3 py-2 rounded-input border border-s-ink/10 dark:border-white/10 bg-s-bg-surface dark:bg-s-dm-bg text-sm text-s-ink dark:text-s-dm-text outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20 resize-none"
              />
            </div>

            {error && <p role="alert" className="text-xs text-s-coral mb-3">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-2.5 rounded-btn active:scale-[0.98] bg-s-coral text-white text-sm font-medium hover:bg-s-coral/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
