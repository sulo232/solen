"use client";

import { useState } from "react";
import { DollarSign } from "lucide-react";
import GlassModal from "@/components/ui/GlassModal";

interface PriceOfferModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { description: string; amount: number }) => void;
}

export default function PriceOfferModal({ open, onClose, onSubmit }: PriceOfferModalProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const trimmed = description.trim();
    const parsed = Number(amount);

    if (!trimmed) {
      setError("Bitte Beschreibung eingeben.");
      return;
    }
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setError("Bitte gültigen Preis eingeben.");
      return;
    }

    setError("");
    onSubmit({ description: trimmed, amount: parsed });
    setDescription("");
    setAmount("");
  };

  const handleClose = () => {
    setDescription("");
    setAmount("");
    setError("");
    onClose();
  };

  return (
    <GlassModal open={open} onClose={handleClose} title="Preisangebot erstellen">
      <div className="space-y-4">
        {/* Description */}
        <div>
          <label htmlFor="offer-description" className="block text-sm font-medium text-dark dark:text-s-dm-text mb-1">
            Beschreibung
          </label>
          <input
            id="offer-description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="z.B. Balayage mit Pflege"
            className="w-full px-3 py-2 text-sm border border-s-ink/10 dark:border-gray-700 rounded-button bg-white dark:bg-s-dm-surface dark:text-s-dm-text focus:outline-none focus:border-s-coral"
            autoFocus
          />
        </div>

        {/* Price */}
        <div>
          <label htmlFor="offer-amount" className="block text-sm font-medium text-dark dark:text-s-dm-text mb-1">
            Preis (CHF)
          </label>
          <div className="relative">
            <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark/30 dark:text-s-dm-text/30" />
            <input
              id="offer-amount"
              type="number"
              min="1"
              step="0.50"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-8 pr-3 py-2 text-sm border border-s-ink/10 dark:border-gray-700 rounded-button bg-white dark:bg-s-dm-surface dark:text-s-dm-text focus:outline-none focus:border-s-coral"
            />
          </div>
        </div>

        {/* Error */}
        {error && <p className="text-xs text-s-coral">{error}</p>}

        {/* Buttons */}
        <div className="flex gap-3 justify-end pt-2">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm rounded-button border border-s-ink/10 dark:border-gray-700 text-dark/60 dark:text-s-dm-text/60 hover:text-dark dark:hover:text-s-dm-text transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm rounded-button bg-s-coral text-white hover:bg-s-coral/90 transition-colors shadow-warm-sm"
          >
            Angebot senden
          </button>
        </div>
      </div>
    </GlassModal>
  );
}
