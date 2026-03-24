"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { DollarSign } from "lucide-react";
import GlassModal from "@/components/ui/GlassModal";

const labels = {
  de: { title: "Preisangebot erstellen", description: "Beschreibung", descPlaceholder: "z.B. Balayage mit Pflege", price: "Preis (CHF)", cancel: "Abbrechen", send: "Angebot senden", errDesc: "Bitte Beschreibung eingeben.", errPrice: "Bitte gültigen Preis eingeben." },
  en: { title: "Create Price Offer", description: "Description", descPlaceholder: "e.g. Balayage with treatment", price: "Price (CHF)", cancel: "Cancel", send: "Send Offer", errDesc: "Please enter a description.", errPrice: "Please enter a valid price." },
  fr: { title: "Créer une offre de prix", description: "Description", descPlaceholder: "p.ex. Balayage avec soin", price: "Prix (CHF)", cancel: "Annuler", send: "Envoyer l'offre", errDesc: "Veuillez entrer une description.", errPrice: "Veuillez entrer un prix valide." },
  it: { title: "Crea offerta di prezzo", description: "Descrizione", descPlaceholder: "es. Balayage con trattamento", price: "Prezzo (CHF)", cancel: "Annulla", send: "Invia offerta", errDesc: "Inserisci una descrizione.", errPrice: "Inserisci un prezzo valido." },
};

interface PriceOfferModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { description: string; amount: number }) => void;
}

export default function PriceOfferModal({ open, onClose, onSubmit }: PriceOfferModalProps) {
  const locale = useLocale();
  const l = labels[locale as keyof typeof labels] ?? labels.de;
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const trimmed = description.trim();
    const parsed = Number(amount);

    if (!trimmed) {
      setError(l.errDesc);
      return;
    }
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setError(l.errPrice);
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
    <GlassModal open={open} onClose={handleClose} title={l.title}>
      <div className="space-y-4">
        {/* Description */}
        <div>
          <label htmlFor="offer-description" className="block text-sm font-medium text-s-ink dark:text-s-dm-text mb-1">
            {l.description}
          </label>
          <input
            id="offer-description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={l.descPlaceholder}
            className="w-full px-3 py-2 text-sm border border-s-ink/10 dark:border-white/10 rounded-btn bg-white dark:bg-s-dm-surface dark:text-s-dm-text focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20"
            autoFocus
          />
        </div>

        {/* Price */}
        <div>
          <label htmlFor="offer-amount" className="block text-sm font-medium text-s-ink dark:text-s-dm-text mb-1">
            {l.price}
          </label>
          <div className="relative">
            <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-s-ink/30 dark:text-s-dm-text/30" />
            <input
              id="offer-amount"
              type="number"
              min="1"
              step="0.50"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-8 pr-3 py-2 text-sm border border-s-ink/10 dark:border-white/10 rounded-btn bg-white dark:bg-s-dm-surface dark:text-s-dm-text focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20"
            />
          </div>
        </div>

        {/* Error */}
        {error && <p className="text-xs text-s-coral">{error}</p>}

        {/* Buttons */}
        <div className="flex gap-3 justify-end pt-2">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm rounded-btn border border-s-ink/10 dark:border-white/10 text-s-ink/60 dark:text-s-dm-text/60 hover:text-s-ink dark:hover:text-s-dm-text transition-colors"
          >
            {l.cancel}
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm rounded-btn active:scale-[0.98] bg-s-coral text-white hover:bg-s-coral/90 transition-all shadow-warm-sm"
          >
            {l.send}
          </button>
        </div>
      </div>
    </GlassModal>
  );
}
