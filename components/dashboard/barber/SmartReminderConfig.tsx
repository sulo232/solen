"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Bell, Send, Users, CheckCircle2, X } from "lucide-react";

interface ReminderClient {
  id: string;
  display_name: string;
  phone?: string;
  days_overdue: number;
  cycle_days?: number;
  preferred_barber: string | null;
  last_visit_date: string;
  cooldown?: boolean;
}

interface SmartReminderConfigProps {
  salonId: string;
}


export default function SmartReminderConfig({ salonId }: SmartReminderConfigProps) {
  const t = useTranslations("dashboardBarber");
  const [dueClients, setDueClients] = useState<ReminderClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [confirmClient, setConfirmClient] = useState<ReminderClient | null>(null);

  useEffect(() => {
    if (!confirmClient) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setConfirmClient(null); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [confirmClient]);

  useEffect(() => {
    const fetchDue = async () => {
      try {
        const res = await fetch(`/api/dashboard/barber-reminders?salon_id=${salonId}`);
        if (res.ok) {
          const data = await res.json();
          setDueClients(data.clients ?? []);
        }
      } catch {
        // Error loading
      }
      setLoading(false);
    };
    fetchDue();
  }, [salonId]);

  const handleSendReminder = async (client: ReminderClient) => {
    setSending(client.id);
    setConfirmClient(null);
    try {
      const res = await fetch("/api/dashboard/barber-reminders/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: client.id, salon_id: salonId }),
      });
      if (res.ok) {
        setSentIds((prev) => new Set(prev).add(client.id));
      }
    } catch {
      // Error sending
    }
    setSending(null);
  };

  const byBarber = dueClients.reduce<Record<string, ReminderClient[]>>((acc, c) => {
    const barber = c.preferred_barber ?? t("noFavorite");
    if (!acc[barber]) acc[barber] = [];
    acc[barber].push(c);
    return acc;
  }, {});

  return (
    <div className="rounded-[16px] bg-white dark:bg-s-dm-surface border border-s-ink/5 dark:border-s-dm-text/10 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-s-amber" />
          <h3 className="font-heading text-sm font-bold text-s-ink dark:text-s-dm-text">{t("smartReminders")}</h3>
        </div>
        <span className="flex items-center gap-1 text-xs text-s-ink/50 dark:text-s-dm-text/50">
          <Users size={14} />
          {dueClients.length} {t("dueThisWeek")}
        </span>
      </div>

      {loading ? (
        <div className="py-4 text-center text-sm text-s-ink/40 dark:text-s-dm-text/40">{t("loading")}</div>
      ) : dueClients.length === 0 ? (
        <div className="py-6 text-center text-sm text-s-ink/40 dark:text-s-dm-text/40">
          {t("noReminders")}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(byBarber).map(([barber, clients]) => (
            <div key={barber}>
              <p className="text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-2">{barber}</p>
              <div className="space-y-2">
                {clients.map((client) => {
                  const cooldown = client.cooldown || false;
                  const justSent = sentIds.has(client.id);

                  return (
                    <div
                      key={client.id}
                      className="flex items-center justify-between rounded-btn bg-s-bg-surface dark:bg-s-dm-bg p-3"
                    >
                      <div>
                        <p className="text-sm text-s-ink dark:text-s-dm-text font-medium">
                          {client.display_name}
                        </p>
                        <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50">
                          {client.days_overdue > 0
                            ? t("daysOverdue", { days: client.days_overdue })
                            : t("dueToday")}
                          {client.cycle_days ? ` · ${t("cycle")}: ${client.cycle_days}` : ""}
                          {client.last_visit_date ? ` · ${t("lastVisit")}: ${new Date(client.last_visit_date).toLocaleDateString()}` : ""}
                        </p>
                      </div>

                      {justSent ? (
                        <span className="flex items-center gap-1 text-xs text-s-success font-medium">
                          <CheckCircle2 size={14} />
                          {t("sent")}
                        </span>
                      ) : cooldown ? (
                        <span className="text-xs text-s-ink/30 dark:text-s-dm-text/30">
                          {t("recentlySent")}
                        </span>
                      ) : (
                        <button
                          onClick={() => setConfirmClient(client)}
                          disabled={sending === client.id}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-pill bg-s-coral/10 text-s-coral text-[11px] font-heading font-bold uppercase tracking-[.06em] hover:bg-s-coral/20 disabled:opacity-50 transition-colors duration-150"
                        >
                          <Send size={12} />
                          {sending === client.id ? t("sending") : t("send")}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation dialog */}
      {confirmClient && (
        <div className="fixed inset-0 z-[55] bg-s-ink/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirmDialogTitle">
          <div className="bg-white dark:bg-s-dm-surface rounded-[16px] shadow-warm-lg p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h4 id="confirmDialogTitle" className="font-heading font-bold text-sm text-s-ink dark:text-s-dm-text">
                {t("confirmTitle")}
              </h4>
              <button
                onClick={() => setConfirmClient(null)}
                aria-label={t("cancel")}
                className="p-1 rounded-btn text-s-ink/40 dark:text-s-dm-text/40 hover:bg-s-bg-surface dark:hover:bg-s-dm-bg transition-colors duration-150"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-sm text-s-ink/70 dark:text-s-dm-text/70 mb-4">
              {t("confirmDesc", { name: confirmClient.display_name })}
              {confirmClient.phone ? ` (${confirmClient.phone})` : ""}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmClient(null)}
                className="flex-1 py-2 rounded-pill border border-s-ink/10 dark:border-s-dm-text/10 text-sm text-s-ink/70 dark:text-s-dm-text/70 hover:border-s-coral/40 hover:text-s-coral active:scale-[0.97] transition-[transform,border-color,color] duration-150"
              >
                {t("cancel")}
              </button>
              <button
                onClick={() => handleSendReminder(confirmClient)}
                disabled={sending === confirmClient.id}
                className="flex-1 py-2 rounded-pill active:scale-[0.97] bg-s-coral text-white text-[11px] font-heading font-bold uppercase tracking-[.06em] hover:brightness-[1.06] disabled:opacity-50 shadow-coral-glow transition-[transform,filter] duration-150"
              >
                {sending === confirmClient.id ? t("sending") : t("confirmSend")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
