"use client";

import { useEffect, useState } from "react";
import { Bell, Calendar, Send } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

interface RebookClient {
  client_id: string;
  display_name: string;
  zone: string;
  days_overdue: number;
  last_wax_date: string;
}

interface RebookAlertsProps {
  salonId: string;
}

export default function RebookAlerts({ salonId }: RebookAlertsProps) {
  const t = useTranslations("dashboardWaxing") as any;
  const locale = useLocale();
  const [clients, setClients] = useState<RebookClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [sent, setSent] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch(`/api/dashboard/waxing/rebook-alerts?salon_id=${salonId}`);
        if (!r.ok || cancelled) return;
        const d = await r.json();
        if (!cancelled && d?.clients) setClients(d.clients);
      } catch {
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [salonId]);

  const sendReminder = async (clientId: string) => {
    setSent((prev) => new Set(prev).add(clientId));
    await fetch("/api/dashboard/waxing/rebook-alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ salon_id: salonId, client_id: clientId }),
    }).catch(() => {
      setSent((prev) => { const s = new Set(prev); s.delete(clientId); return s; });
    });
  };

  return (
    <div className="bg-[--raised] rounded-[12px] border border-s-ink/[0.06] p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-[8px] bg-s-amber/10 flex items-center justify-center">
          <Bell size={13} className="text-s-amber" />
        </div>
        <div>
          <p className="text-sm font-heading text-s-ink">{t("rebookTitle")}</p>
          <p className="text-[10px] text-s-ink/35">{t("rebookSubtitle")}</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-s-ink/[0.04] rounded-[8px]" />)}
        </div>
      ) : clients.length === 0 ? (
        <p className="text-xs text-s-ink/40 text-center py-4">{t("rebookEmpty")}</p>
      ) : (
        <div className="space-y-2">
          {clients.map((c) => (
            <div key={c.client_id} className="flex items-center gap-3 p-3 rounded-[8px] border border-s-ink/[0.05]">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-heading text-s-ink truncate">{c.display_name}</p>
                <p className="text-[10px] text-s-ink/40">
                  {c.zone} · <span className={c.days_overdue > 0 ? "text-red-500" : "text-s-amber"}>
                    {c.days_overdue > 0 ? `${c.days_overdue}d ${t("overdue")}` : t("dueNow")}
                  </span>
                </p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={() => sendReminder(c.client_id)}
                  disabled={sent.has(c.client_id)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-[8px] text-[10px] font-heading transition-[transform,filter] duration-150 ${
                    sent.has(c.client_id)
                      ? "bg-s-sage/20 text-s-sage"
                      : "bg-s-amber/10 text-s-amber hover:bg-s-amber/20"
                  }`}
                  aria-label={t("rebookSendReminder")}
                >
                  <Send size={10} />
                  {sent.has(c.client_id) ? t("rebookSent") : t("rebookSendReminder")}
                </button>
                <a
                  href={`/${locale}/dashboard/calendar?client=${c.client_id}`}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-[8px] text-[10px] font-heading bg-s-coral/10 text-s-coral hover:bg-s-coral/20 transition-colors"
                  aria-label={t("rebookBook")}
                >
                  <Calendar size={10} />
                  {t("rebookBook")}
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
