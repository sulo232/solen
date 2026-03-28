"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { Clock, UserCheck, UserX, XCircle, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import type { BarberWalkinQueue } from "@/lib/types";

interface WalkinQueueProps {
  salonId: string;
}

export default function WalkinQueue({ salonId }: WalkinQueueProps) {
  const t = useTranslations("barber.queue") as any;
  const [queue, setQueue] = useState<BarberWalkinQueue[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserSupabaseClient();

  const fetchQueue = useCallback(async () => {
    const res = await fetch(`/api/walkin/queue?salon_id=${salonId}`);
    if (res.ok) {
      const data = await res.json();
      setQueue(data.queue ?? []);
    }
    setLoading(false);
  }, [salonId]);

  useEffect(() => {
    fetchQueue();

    // Supabase Realtime subscription
    const channel = supabase
      .channel(`walkin-queue-${salonId}`)
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
    const res = await fetch(`/api/walkin/queue/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) fetchQueue();
  };

  const activeQueue = queue.filter(
    (q) => q.status === "waiting" || q.status === "in_chair"
  );

  if (loading) {
    return (
      <div className="p-4 text-center text-s-ink/50 dark:text-s-dm-text/50">
        <Clock size={20} className="mx-auto animate-spin mb-2" />
        {t("loadingQueue")}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="font-heading text-sm font-bold text-s-ink dark:text-s-dm-text">
          {t("queueTitle")}
        </h3>
        <span className="text-xs text-s-ink/50 dark:text-s-dm-text/50 flex items-center gap-1">
          <Users size={14} />
          {t("waiting", { count: activeQueue.length })}
        </span>
      </div>

      {activeQueue.length === 0 ? (
        <div className="text-center py-6 text-s-ink/40 dark:text-s-dm-text/40 text-sm">
          {t("noCustomers")}
        </div>
      ) : (
        <div className="space-y-2">
          {activeQueue.map((entry, i) => (
            <div
              key={entry.id}
              className={`rounded-[16px] p-3 border ${
                entry.status === "in_chair"
                  ? "border-s-coral/30 bg-s-coral/5 dark:bg-s-coral/10"
                  : "border-s-ink/10 bg-white dark:bg-s-dm-surface dark:border-s-dm-text/10"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-pill bg-s-ink/10 dark:bg-s-dm-text/10 flex items-center justify-center text-xs font-bold text-s-ink dark:text-s-dm-text">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-s-ink dark:text-s-dm-text">
                      {entry.customer_name}
                    </p>
                    <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50">
                      {entry.status === "in_chair" ? t("inChair") : <span className="data-text">~{entry.estimated_wait_minutes ?? "?"} {t("minutes")}</span>}
                      {entry.join_method === "remote" && ` · ${t("remote")}`}
                    </p>
                  </div>
                </div>

                <div className="flex gap-1">
                  {entry.status === "waiting" && (
                    <button
                      onClick={() => updateStatus(entry.id, "in_chair")}
                      className="p-1.5 rounded-pill bg-s-coral/10 text-s-coral hover:bg-s-coral/20 transition-colors duration-150"
                      title={t("next")}
                      aria-label={t("next")}
                    >
                      <UserCheck size={16} />
                    </button>
                  )}
                  {entry.status === "in_chair" && (
                    <button
                      onClick={() => updateStatus(entry.id, "completed")}
                      className="p-1.5 rounded-pill bg-s-sage/20 text-s-sage hover:bg-s-sage/30 transition-colors duration-150"
                      title={t("done")}
                      aria-label={t("done")}
                    >
                      <UserCheck size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => updateStatus(entry.id, "no_show")}
                    className="p-1.5 rounded-pill bg-s-ink/5 text-s-ink/40 hover:bg-s-ink/10 dark:bg-s-dm-text/5 dark:text-s-dm-text/40 transition-colors duration-150"
                    title={t("noShow")}
                    aria-label={t("noShow")}
                  >
                    <UserX size={16} />
                  </button>
                  <button
                    onClick={() => updateStatus(entry.id, "cancelled")}
                    className="p-1.5 rounded-pill bg-s-ink/5 text-s-ink/40 hover:bg-s-ink/10 dark:bg-s-dm-text/5 dark:text-s-dm-text/40 transition-colors duration-150"
                    title={t("cancel")}
                    aria-label={t("cancel")}
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
