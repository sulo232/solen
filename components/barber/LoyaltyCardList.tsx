"use client";

import { useEffect, useState } from "react";
import { Award, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import LoyaltyCard from "./LoyaltyCard";

interface CardData {
  id: string;
  stamps_collected: number;
  status: string;
  salon_id: string;
  barber_loyalty_programs: {
    name: string;
    stamps_required: number;
    reward_type: string;
    reward_value: number | null;
  } | null;
}

export default function LoyaltyCardList() {
  const t = useTranslations("barber.loyalty") as any;
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const res = await fetch("/api/loyalty/cards");
        if (res.ok) {
          const data = await res.json();
          setCards(data.cards ?? []);
        }
      } catch {
        // Error loading
      }
      setLoading(false);
    };
    fetchCards();
  }, []);

  const activeCards = cards.filter((c) => c.status === "active" || c.status === "completed");
  const redeemedCards = cards.filter((c) => c.status === "redeemed");

  if (loading) {
    return <div className="py-4 text-center text-sm text-s-ink/40">{t("loading")}</div>;
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-s-ink/40">
        <Award size={24} className="mx-auto mb-2 opacity-40" />
        {t("noCards")}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activeCards.map((card) => (
        <LoyaltyCard key={card.id} card={card} />
      ))}

      {redeemedCards.length > 0 && (
        <div>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            aria-pressed={showCompleted}
            className="flex items-center gap-1 text-xs text-s-ink/50 hover:text-s-ink transition-colors duration-150 mt-4"
            aria-label={t("completedCards")}
          >
            <ChevronDown size={14} className={`transition-transform ${showCompleted ? "rotate-180" : ""}`} />
            {t("completedCards")} ({redeemedCards.length})
          </button>
          {showCompleted && (
            <div className="space-y-3 mt-2">
              {redeemedCards.map((card) => (
                <LoyaltyCard key={card.id} card={card} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
