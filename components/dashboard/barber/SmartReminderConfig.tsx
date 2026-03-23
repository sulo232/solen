"use client";

import { useEffect, useState } from "react";
import { Bell, Send, Users } from "lucide-react";

interface ReminderClient {
  id: string;
  display_name: string;
  days_overdue: number;
  preferred_barber: string | null;
  last_visit_date: string;
}

interface SmartReminderConfigProps {
  salonId: string;
}

export default function SmartReminderConfig({ salonId }: SmartReminderConfigProps) {
  const [dueClients, setDueClients] = useState<ReminderClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);

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

  const handleSendReminder = async (clientId: string) => {
    setSending(clientId);
    try {
      await fetch("/api/dashboard/barber-reminders/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId, salon_id: salonId }),
      });
      setDueClients((prev) => prev.filter((c) => c.id !== clientId));
    } catch {
      // Error sending
    }
    setSending(null);
  };

  const byBarber = dueClients.reduce<Record<string, ReminderClient[]>>((acc, c) => {
    const barber = c.preferred_barber ?? "Kein Favorit";
    if (!acc[barber]) acc[barber] = [];
    acc[barber].push(c);
    return acc;
  }, {});

  return (
    <div className="rounded-card bg-white dark:bg-s-dm-surface border border-s-ink/5 dark:border-s-dm-text/10 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-s-amber" />
          <h3 className="font-heading text-sm font-bold text-s-ink dark:text-s-dm-text">Smart Reminders</h3>
        </div>
        <span className="flex items-center gap-1 text-xs text-s-ink/50 dark:text-s-dm-text/50">
          <Users size={14} />
          {dueClients.length} fällig diese Woche
        </span>
      </div>

      {loading ? (
        <div className="py-4 text-center text-sm text-s-ink/40 dark:text-s-dm-text/40">Laden...</div>
      ) : dueClients.length === 0 ? (
        <div className="py-6 text-center text-sm text-s-ink/40 dark:text-s-dm-text/40">
          Keine Erinnerungen fällig
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(byBarber).map(([barber, clients]) => (
            <div key={barber}>
              <p className="text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-2">{barber}</p>
              <div className="space-y-2">
                {clients.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between rounded-button bg-s-bg-surface dark:bg-s-dm-bg p-3"
                  >
                    <div>
                      <p className="text-sm text-s-ink dark:text-s-dm-text font-medium">
                        {client.display_name}
                      </p>
                      <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50">
                        {client.days_overdue > 0
                          ? `${client.days_overdue} Tage überfällig`
                          : "Heute fällig"}
                      </p>
                    </div>
                    <button
                      onClick={() => handleSendReminder(client.id)}
                      disabled={sending === client.id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-button bg-s-coral/10 text-s-coral text-xs font-medium hover:bg-s-coral/20 disabled:opacity-50 transition-colors"
                    >
                      <Send size={12} />
                      {sending === client.id ? "..." : "Senden"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
