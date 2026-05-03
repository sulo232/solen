"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { DollarSign } from "lucide-react";
import GlassModal from "@/components/ui/GlassModal";

interface PriceOfferModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { description: string; amount: number }) => void;
}

export default function PriceOfferModal({ open, onClose, onSubmit }: PriceOfferModalProps) {
  const t = useTranslations("ui.priceOffer") as any;
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const trimmed = description.trim();
    const parsed = Number(amount);

    if (!trimmed) {
      setError(t("errDesc"));
      return;
    }
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setError(t("errPrice"));
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
    <GlassModal open={open} onClose={handleClose} title={t("title")}>
      <div className="space-y-4">
        {/* Description */}
        <div>
          <label htmlFor="offer-description" className="block text-sm font-medium text-s-ink mb-1">
            {t("description")}
          </label>
          <input
            id="offer-description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("descPlaceholder")}
            className="w-full px-3 py-2 text-sm border border-s-ink/10 rounded-input bg-white focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20"
            autoFocus
          />
        </div>

        {/* Price */}
        <div>
          <label htmlFor="offer-amount" className="block text-sm font-medium text-s-ink mb-1">
            {t("price")}
          </label>
          <div className="relative">
            <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-s-ink/30" />
            <input
              id="offer-amount"
              type="number"
              min="1"
              step="0.50"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-8 pr-3 py-2 text-sm border border-s-ink/10 rounded-input bg-white focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20"
            />
          </div>
        </div>

        {/* Error */}
        {error && <p className="text-xs text-s-coral">{error}</p>}

        {/* Buttons */}
        <div className="flex gap-3 justify-end pt-2">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm rounded-pill border border-s-ink/10 text-s-ink/60 hover:text-s-ink transition-colors duration-150"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm rounded-pill active:scale-[0.97] bg-s-coral text-white hover:brightness-[1.06] transition-[transform,filter] duration-150 shadow-elevation-2"
          >
            {t("send")}
          </button>
        </div>
      </div>
    </GlassModal>
  );
}
