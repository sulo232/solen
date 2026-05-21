"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Gift } from "lucide-react";
import Spinner from "@/components-legacy/ui/Spinner";
import { formatCurrency } from "@/lib/format-currency";

interface GiftCard {
  id: string;
  code: string;
  original_amount: number;
  remaining_amount: number;
  purchaser_email: string | null;
  recipient_name: string | null;
  recipient_email: string | null;
  is_active: boolean;
  created_at: string;
  expires_at: string;
}

interface GiftCardManagerProps {
  salonId: string;
}

export default function GiftCardManager({ salonId }: GiftCardManagerProps) {
  const locale = useLocale();
  const t = useTranslations("dashboard.giftCards") as any;
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total_sold: 0, total_revenue: 0, active_cards: 0, unredeemed_balance: 0 });

  useEffect(() => {
    Promise.allSettled([
      fetch(`/api/gift-cards/balance?salon_id=${salonId}`).then((r) => r.ok ? r.json() : Promise.reject()),
      fetch(`/api/analytics/gift-card-revenue?salon_id=${salonId}`).then((r) => r.ok ? r.json() : Promise.reject()),
    ]).then(([cardsResult, statsResult]) => {
      if (cardsResult.status === "fulfilled") {
        setCards(cardsResult.value.items ?? cardsResult.value.cards ?? []);
      }
      if (statsResult.status === "fulfilled") {
        const statsData = statsResult.value;
        setStats({
          total_sold: Number(statsData.total_sold) || 0,
          total_revenue: Number(statsData.total_revenue) || 0,
          active_cards: Number(statsData.active_cards) || 0,
          unredeemed_balance: Number(statsData.unredeemed_balance) || 0,
        });
      }
    }).finally(() => setLoading(false));
  }, [salonId]);

  if (loading) return <div className="flex justify-center py-6"><Spinner size="md" /></div>;

  return (
    <div>
      <h3 className="font-heading text-sm text-s-ink flex items-center gap-2 mb-4">
        <Gift size={14} className="text-s-coral" /> {t("title")}
      </h3>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {[
          { label: t("sold"), value: stats.total_sold },
          { label: t("revenue"), value: formatCurrency(stats.total_revenue / 100, locale) },
          { label: t("active"), value: stats.active_cards },
          { label: t("open"), value: formatCurrency(stats.unredeemed_balance / 100, locale) },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-[16px] border border-s-ink/5 p-3 text-center">
            <p className="data-text font-bold text-lg text-s-ink">{s.value}</p>
            <p className="text-[10px] text-s-ink/40">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Card list */}
      {cards.length === 0 ? (
        <p className="text-xs text-s-ink/30 text-center py-6">{t("empty")}</p>
      ) : (
        <div className="space-y-2">
          {cards.map((c) => (
            <div key={c.id} className="bg-white rounded-[16px] border border-s-ink/5 p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-mono font-medium text-s-ink">{c.code}</p>
                <p className="text-xs text-s-ink/40">
                  {c.recipient_name ?? c.recipient_email ?? "—"} · {new Date(c.created_at).toLocaleDateString(locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : locale === "en" ? "en-GB" : "de-CH")}
                </p>
              </div>
              <div className="text-right">
                <p className="data-text font-bold text-sm text-s-ink">
                  {formatCurrency(c.remaining_amount / 100, locale)}
                  <span className="text-s-ink/30 font-normal"> / {(c.original_amount / 100).toFixed(0)}</span>
                </p>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${c.is_active ? (c.remaining_amount > 0 ? "bg-s-sage/10 text-s-sage" : "bg-s-ink/5 text-s-ink/40") : "bg-s-ink/5 text-s-ink/30"}`}>
                  {c.is_active ? (c.remaining_amount > 0 ? t("activeStatus") : t("redeemed")) : t("pending")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
