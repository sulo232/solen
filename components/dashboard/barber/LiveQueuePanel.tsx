"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { UserCheck, UserX, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { BarberWalkinQueue } from "@/lib/types";

interface LiveQueuePanelProps {
  salonId: string;
}

export default function LiveQueuePanel({ salonId }: LiveQueuePanelProps) {
  const t = useTranslations("dashboardBarber");
  const [queue, setQueue] = useState<BarberWalkinQueue[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserSupabaseClient();

  const fetchQueue = useCallback(async () => {
    const res = await fetch(`/api/walkin/queue?salon_id=${salonId}`);
    if (res.ok) {
      const data = await res.json();
      const all = [...(data.inChair ?? []), ...(data.queue ?? [])];
      setQueue(all);
    }
    setLoading(false);
  }, [salonId]);

  useEffect(() => {
    fetchQueue();

    // DIFFERENT channel name than customer WalkinQueue
    const channel = supabase
      .channel(`dashboard-walkin-${salonId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "barber_walkin_queue",
          filter: `salon_id=eq.${salonId}`,
        },
        () => {
          fetchQueue();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [salonId, supabase, fetchQueue]);

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/walkin/queue/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchQueue();
  };

  const waitingCount = queue.filter((q) => q.status === "waiting").length;

  if (loading) {
    return (
      <div className="rounded-[12px] border border-s-ink/[0.06] dark:border-s-dm-text/[0.06] bg-white dark:bg-s-dm-surface p-4">
        <p className="text-sm text-s-ink/40 dark:text-s-dm-text/40 text-center py-4">
          {t("loading")}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full lg:max-w-xl rounded-[12px] border border-s-ink/[0.06] dark:border-s-dm-text/[0.06] bg-white dark:bg-s-dm-surface p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-amber">
          {t("live_queue")}
        </p>
        <span className="text-xs data-text font-bold text-s-coral">
          {waitingCount} {t("waiting")}
        </span>
      </div>

      {queue.length === 0 ? (
        <p className="text-sm text-s-ink/40 dark:text-s-dm-text/40 text-center py-6">
          {t("queue_empty")}
        </p>
      ) : (
        <div>
          {queue.map((entry, i) => (
            <div
              key={entry.id}
              className="flex items-center gap-3 py-3 border-b border-s-ink/[0.04] dark:border-s-dm-text/[0.04] last:border-0"
            >
              <span className="text-sm data-text font-bold text-s-ink/40 dark:text-s-dm-text/40 w-6 text-center">
                #{i + 1}
              </span>
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${
                  entry.status === "in_chair" ? "bg-s-sage" : "bg-s-amber"
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-heading font-semibold text-s-ink dark:text-s-dm-text truncate">
                  {entry.customer_name}
                </p>
                <p className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40">
                  {entry.preferred_barber_id
                    ? t("preferred_barber")
                    : t("any_barber")}
                </p>
              </div>
              <span className="text-xs data-text text-s-ink/50 dark:text-s-dm-text/50 shrink-0">
                {entry.estimated_wait_minutes ?? "?"} min
              </span>

              <div className="flex gap-1 shrink-0">
                {entry.status === "waiting" && (
                  <button
                    onClick={() => updateStatus(entry.id, "in_chair")}
                    className="p-1.5 rounded-[8px] bg-s-coral/10 text-s-coral hover:bg-s-coral/20 transition-colors duration-150"
                    aria-label={t("start")}
                    title={t("start")}
                  >
                    <UserCheck size={14} />
                  </button>
                )}
                {entry.status === "in_chair" && (
                  <button
                    onClick={() => updateStatus(entry.id, "completed")}
                    className="p-1.5 rounded-[8px] bg-s-sage/20 text-s-sage hover:bg-s-sage/30 transition-colors duration-150"
                    aria-label={t("complete")}
                    title={t("complete")}
                  >
                    <UserCheck size={14} />
                  </button>
                )}
                <button
                  onClick={() => updateStatus(entry.id, "no_show")}
                  className="p-1.5 rounded-[8px] bg-s-ink/5 text-s-ink/40 hover:bg-s-ink/10 dark:bg-s-dm-text/5 dark:text-s-dm-text/40 transition-colors duration-150"
                  aria-label={t("no_show")}
                  title={t("no_show")}
                >
                  <UserX size={14} />
                </button>
                <button
                  onClick={() => updateStatus(entry.id, "cancelled")}
                  className="p-1.5 rounded-[8px] bg-s-ink/5 text-s-ink/40 hover:bg-s-ink/10 dark:bg-s-dm-text/5 dark:text-s-dm-text/40 transition-colors duration-150"
                  aria-label={t("cancel")}
                  title={t("cancel")}
                >
                  <XCircle size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
