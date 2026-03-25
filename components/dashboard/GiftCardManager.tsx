"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Gift } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import { formatCurrency } from "@/lib/format-currency";

const labels = {
  de: { title: "Geschenkkarten", sold: "Verkauft", revenue: "Umsatz", active: "Aktiv", open: "Offen", empty: "Keine Geschenkkarten verkauft", redeemed: "Eingelöst", pending: "Ausstehend", activeStatus: "Aktiv" },
  en: { title: "Gift Cards", sold: "Sold", revenue: "Revenue", active: "Active", open: "Open", empty: "No gift cards sold yet", redeemed: "Redeemed", pending: "Pending", activeStatus: "Active" },
  fr: { title: "Cartes cadeaux", sold: "Vendues", revenue: "Chiffre d'affaires", active: "Actives", open: "Ouvert", empty: "Aucune carte cadeau vendue", redeemed: "Échangée", pending: "En attente", activeStatus: "Active" },
  it: { title: "Carte regalo", sold: "Vendute", revenue: "Fatturato", active: "Attive", open: "Aperto", empty: "Nessuna carta regalo venduta", redeemed: "Riscattata", pending: "In attesa", activeStatus: "Attiva" },
};

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
  const l = labels[locale as keyof typeof labels] ?? labels.de;
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total_sold: 0, total_revenue: 0, active_cards: 0, unredeemed_balance: 0 });

  useEffect(() => {
    Promise.all([
      fetch(`/api/gift-cards/balance?salon_id=${salonId}`).then((r) => r.json()),
      fetch(`/api/analytics/gift-card-revenue?salon_id=${salonId}`).then((r) => r.json()),
    ]).then(([cardsData, statsData]) => {
      setCards(cardsData.items ?? cardsData.cards ?? []);
      setStats({
        total_sold: statsData.total_sold ?? 0,
        total_revenue: statsData.total_revenue ?? 0,
        active_cards: statsData.active_cards ?? 0,
        unredeemed_balance: statsData.unredeemed_balance ?? 0,
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, [salonId]);

  if (loading) return <div className="flex justify-center py-6"><Spinner size="md" /></div>;

  return (
    <div>
      <h3 className="font-heading font-bold text-sm text-s-ink dark:text-s-dm-text flex items-center gap-2 mb-4">
        <Gift size={14} className="text-s-coral" /> {l.title}
      </h3>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {[
          { label: l.sold, value: stats.total_sold },
          { label: l.revenue, value: formatCurrency(stats.total_revenue / 100, locale) },
          { label: l.active, value: stats.active_cards },
          { label: l.open, value: formatCurrency(stats.unredeemed_balance / 100, locale) },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-s-dm-surface rounded-[16px] border border-s-ink/5 dark:border-white/5 p-3 text-center">
            <p className="data-text font-bold text-lg text-s-ink dark:text-s-dm-text">{s.value}</p>
            <p className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Card list */}
      {cards.length === 0 ? (
        <p className="text-xs text-s-ink/30 dark:text-s-dm-text/30 text-center py-6">{l.empty}</p>
      ) : (
        <div className="space-y-2">
          {cards.map((c) => (
            <div key={c.id} className="bg-white dark:bg-s-dm-surface rounded-[16px] border border-s-ink/5 dark:border-white/5 p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-mono font-medium text-s-ink dark:text-s-dm-text">{c.code}</p>
                <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40">
                  {c.recipient_name ?? c.recipient_email ?? "—"} · {new Date(c.created_at).toLocaleDateString(locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : locale === "en" ? "en-GB" : "de-CH")}
                </p>
              </div>
              <div className="text-right">
                <p className="data-text font-bold text-sm text-s-ink dark:text-s-dm-text">
                  {formatCurrency(c.remaining_amount / 100, locale)}
                  <span className="text-s-ink/30 dark:text-s-dm-text/30 font-normal"> / {(c.original_amount / 100).toFixed(0)}</span>
                </p>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${c.is_active ? (c.remaining_amount > 0 ? "bg-s-sage/10 text-s-sage dark:bg-s-sage/20 dark:text-s-sage" : "bg-s-ink/5 text-s-ink/40 dark:bg-white/5 dark:text-s-dm-text/40") : "bg-s-ink/5 text-s-ink/30 dark:bg-white/5 dark:text-s-dm-text/30"}`}>
                  {c.is_active ? (c.remaining_amount > 0 ? l.activeStatus : l.redeemed) : l.pending}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
