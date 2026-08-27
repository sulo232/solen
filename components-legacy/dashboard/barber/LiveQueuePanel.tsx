"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { Scissors, Check, Play, UserX, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { BarberWalkinQueue } from "@/lib/types";

interface LiveQueuePanelProps {
  salonId: string;
}

export default function LiveQueuePanel({ salonId }: LiveQueuePanelProps) {
  const t = useTranslations("dashboardBarber") as any;
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

    // DIFFERENT channel name than customer WalkinQueue. Per-mount-UNIQUE suffix so realtime-js
    // channel() can't hand back a still-subscribed stale channel on a React Strict Mode remount
    // (fixed topic + async removeChannel => "cannot add postgres_changes callbacks after subscribe()").
    const channel = supabase
      .channel(`dashboard-walkin-${salonId}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "barber_walkin_queue",
          filter: `salon_id=eq.${salonId}`,
        },
        (payload) => {
          // Optimistic: prepend new row immediately, skip round-trip
          if (payload.new && typeof payload.new === "object") {
            setQueue((prev) => {
              const newRow = payload.new as BarberWalkinQueue;
              if (prev.some((r) => r.id === newRow.id)) return prev;
              return [newRow, ...prev];
            });
          } else {
            fetchQueue();
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "barber_walkin_queue",
          filter: `salon_id=eq.${salonId}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new === "object") {
            const updated = payload.new as BarberWalkinQueue;
            setQueue((prev) => prev.map((r) => r.id === updated.id ? updated : r));
          } else {
            fetchQueue();
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "barber_walkin_queue",
          filter: `salon_id=eq.${salonId}`,
        },
        (payload) => {
          if (payload.old && typeof payload.old === "object" && "id" in payload.old) {
            setQueue((prev) => prev.filter((r) => r.id !== (payload.old as { id: string }).id));
          } else {
            fetchQueue();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [salonId, supabase, fetchQueue]);

  const updateStatus = async (id: string, status: string) => {
    // Optimistic update — apply immediately, revert on failure
    const prev = queue;
    setQueue((q) => q.map((r) => r.id === id ? { ...r, status: status as BarberWalkinQueue["status"] } : r));
    try {
      await fetch(`/api/walkin/queue/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch {
      setQueue(prev);
    }
  };

  const waitingCount = queue.filter((q) => q.status === "waiting").length;

  if (loading) {
    return (
      <div className="rounded-[16px] border border-s-border bg-white p-4">
        <p className="text-sm text-s-ink-2 text-center py-4">
          {t("loading")}
        </p>
      </div>
    );
  }

  // Waiting rows get a 1-based position number; in-chair rows show a scissors glyph.
  let waitingPos = 0;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-[9px] px-0.5">
        <p className="font-heading font-bold text-base tracking-[-0.01em] text-s-ink">
          {t("live_queue")}
        </p>
        <span className="text-xs font-heading font-semibold text-s-ink-2">
          {waitingCount} {t("waiting")}
        </span>
      </div>

      {queue.length === 0 ? (
        <div className="rounded-[16px] border border-s-border bg-white p-4">
          <p className="text-sm text-s-ink-2 text-center py-6">
            {t("queue_empty")}
          </p>
        </div>
      ) : (
        <div>
          {queue.map((entry) => {
            const inChair = entry.status === "in_chair";
            if (!inChair) waitingPos += 1;
            return (
              <div
                key={entry.id}
                className={`flex items-center gap-3 rounded-[16px] border px-[13px] py-3 mb-[9px] ${
                  inChair
                    ? "border-[#BBE3C6] bg-s-success-bg"
                    : "border-s-border bg-white"
                }`}
              >
                <span
                  className={`w-6 shrink-0 grid place-items-center font-heading font-bold text-lg tabular-nums ${
                    inChair ? "text-s-success" : "text-s-ink-2"
                  }`}
                >
                  {inChair ? <Scissors size={18} strokeWidth={1.9} /> : waitingPos}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="font-heading font-semibold text-[15px] text-s-ink truncate flex items-center gap-[7px]">
                    {entry.customer_name}
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        inChair ? "bg-s-success" : "bg-s-warning"
                      }`}
                    />
                  </p>
                  <p className="text-xs text-s-ink-2 mt-0.5 truncate">
                    {inChair
                      ? `${t("in_chair_label")} ${entry.estimated_wait_minutes ?? "?"} min`
                      : `→ ${
                          entry.preferred_barber_id
                            ? t("preferred_barber")
                            : t("any_barber")
                        } ⌀ ${entry.estimated_wait_minutes ?? "?"} min`}
                  </p>
                </div>

                <div className="flex gap-[7px] shrink-0">
                  {inChair ? (
                    <>
                      <button
                        onClick={() => updateStatus(entry.id, "completed")}
                        className="w-9 h-9 rounded-[10px] grid place-items-center bg-s-success text-white transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.94] active:duration-[80ms] active:ease-glide"
                        aria-label={t("complete")}
                        title={t("complete")}
                      >
                        <Check size={17} strokeWidth={1.9} />
                      </button>
                      <button
                        onClick={() => updateStatus(entry.id, "no_show")}
                        className="w-9 h-9 rounded-[10px] grid place-items-center bg-s-bg-sunken text-s-ink transition-[colors,transform] duration-150 hover:bg-s-border active:scale-[0.94] active:duration-[80ms] active:ease-glide"
                        aria-label={t("no_show")}
                        title={t("no_show")}
                      >
                        <UserX size={17} strokeWidth={1.9} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => updateStatus(entry.id, "in_chair")}
                        className="w-9 h-9 rounded-[10px] grid place-items-center bg-s-ink text-white transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.94] active:duration-[80ms] active:ease-glide"
                        aria-label={t("start")}
                        title={t("start")}
                      >
                        <Play size={17} strokeWidth={1.9} />
                      </button>
                      <button
                        onClick={() => updateStatus(entry.id, "cancelled")}
                        className="w-9 h-9 rounded-[10px] grid place-items-center bg-s-bg-sunken text-s-ink transition-[colors,transform] duration-150 hover:bg-s-border active:scale-[0.94] active:duration-[80ms] active:ease-glide"
                        aria-label={t("cancel")}
                        title={t("cancel")}
                      >
                        <X size={17} strokeWidth={1.9} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
