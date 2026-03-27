"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { useTranslations } from "next-intl";
import type { BarberWalkinQueue } from "@/lib/types";
import { Monitor } from "lucide-react";

export default function QueueDisplayPage() {
  const t = useTranslations("dashboardBarber");
  const [salonId, setSalonId] = useState("");
  const [queue, setQueue] = useState<BarberWalkinQueue[]>([]);
  const [inChair, setInChair] = useState<BarberWalkinQueue[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserSupabaseClient();

  // Fetch salon ID
  useEffect(() => {
    const fetchSalon = async () => {
      try {
        const res = await fetch("/api/dashboard/clients?category=barbershop");
        if (res.ok) {
          const data = await res.json();
          setSalonId(data.salon_id ?? "");
        }
      } catch {
        // Error
      }
    };
    fetchSalon();
  }, []);

  const fetchQueue = useCallback(async () => {
    if (!salonId) return;
    const res = await fetch(`/api/walkin/queue?salon_id=${salonId}`);
    if (res.ok) {
      const data = await res.json();
      setQueue(data.queue ?? []);
      setInChair(data.inChair ?? []);
    }
    setLoading(false);
  }, [salonId]);

  useEffect(() => {
    if (!salonId) return;
    fetchQueue();

    const channel = supabase
      .channel(`tv-display-${salonId}`)
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

  if (loading && !salonId) {
    return (
      <div className="min-h-screen bg-s-dm-bg flex items-center justify-center">
        <Monitor size={32} className="text-s-dm-text/30" />
      </div>
    );
  }

  const currentClient = inChair[0] ?? null;

  return (
    <div className="min-h-screen bg-s-dm-bg p-6 sm:p-8">
      <p className="text-[9px] font-heading font-bold uppercase tracking-[.20em] text-s-dm-text/30 mb-2">
        {t("queue_display")}
      </p>

      {/* Now Serving */}
      <h1 className="font-heading font-bold text-[28px] sm:text-[48px] text-s-dm-text leading-none mb-6 sm:mb-8">
        {t("now_serving")}
      </h1>

      {currentClient ? (
        <div className="rounded-[12px] border border-s-dm-text/[0.06] p-6 bg-s-dm-surface mb-8">
          <p className="font-heading font-bold text-[24px] sm:text-[32px] text-s-coral">
            {currentClient.customer_name}
          </p>
          {inChair.length > 1 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {inChair.slice(1).map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-[12px] border border-s-dm-text/[0.06] px-4 py-3 bg-s-dm-bg"
                >
                  <p className="font-heading font-semibold text-lg text-s-coral">
                    {entry.customer_name}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-[12px] border border-s-dm-text/[0.06] p-6 bg-s-dm-surface mb-8">
          <p className="font-heading font-semibold text-lg text-s-dm-text/40">
            {t("no_one_serving")}
          </p>
        </div>
      )}

      {/* Waiting Queue */}
      <p className="text-[9px] font-heading font-bold uppercase tracking-[.20em] text-s-dm-text/30 mb-3">
        {t("up_next")} ({queue.length})
      </p>

      {queue.length === 0 ? (
        <p className="text-sm text-s-dm-text/30">{t("queue_empty")}</p>
      ) : (
        <div className="space-y-2">
          {queue.map((entry, i) => (
            <div
              key={entry.id}
              className="flex items-center gap-4 rounded-[12px] border border-s-dm-text/[0.06] px-5 py-4 bg-s-dm-surface"
            >
              <span className="text-[20px] sm:text-[28px] data-text font-bold text-s-dm-text/30 w-12 text-center">
                {i + 1}
              </span>
              <div className="w-3 h-3 rounded-full bg-s-amber shrink-0" />
              <p className="font-heading font-semibold text-lg sm:text-xl text-s-dm-text flex-1">
                {entry.customer_name}
              </p>
              <span className="text-sm sm:text-base data-text text-s-dm-text/40">
                ~{entry.estimated_wait_minutes ?? "?"} min
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
