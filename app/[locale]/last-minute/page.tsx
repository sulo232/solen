"use client";

import { useEffect, useState, useRef } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import FilterBar from "@/components/FilterBar";
import LastMinuteCard from "@/components/LastMinuteCard";
import Spinner from "@/components/ui/Spinner";
import type { LastMinuteSlot } from "@/lib/types";

const PAGE_SIZE = 20;

export default function LastMinutePage() {
  const locale = useLocale();
  const [slots, setSlots] = useState<LastMinuteSlot[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const channelRef = useRef<ReturnType<ReturnType<typeof createBrowserSupabaseClient>["channel"]> | null>(null);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch(`/api/slots/last-minute?limit=${PAGE_SIZE}&offset=0`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setSlots(data.items ?? []);
        setTotal(data.total ?? 0);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  // Supabase Realtime — slot changes
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    const channel = supabase
      .channel("last-minute-slots")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "availability_slots" },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          if (payload.eventType === "UPDATE") {
            const updated = payload.new as { id: string; status: string };
            if (updated.status === "booked") {
              // Fade out / remove booked slot
              setSlots((prev) => prev.filter((s) => s.id !== updated.id));
            }
          }
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const data = await fetch(
        `/api/slots/last-minute?limit=${PAGE_SIZE}&offset=${(nextPage - 1) * PAGE_SIZE}`
      ).then((r) => r.json());
      setSlots((prev) => [...prev, ...(data.items ?? [])]);
      setPage(nextPage);
    } finally {
      setLoadingMore(false);
    }
  };

  const hasMore = slots.length < total;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-4">
        <div className="flex items-center gap-2">
          <h1 className="font-heading font-bold text-2xl sm:text-3xl text-dark">
            Last-Minute Angebote Heute
          </h1>
          <span className="w-2.5 h-2.5 rounded-full bg-coral animate-pulse shrink-0" />
        </div>
        {total > 0 && (
          <p className="text-sm text-dark/50 mt-1">{total} verfügbare Termine</p>
        )}
      </div>

      <FilterBar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : slots.length === 0 ? (
          <div className="text-center py-20 text-dark/40">
            <p className="text-6xl mb-4">✂️</p>
            <p className="font-heading text-lg font-semibold">Gerade keine Slots</p>
            <p className="text-sm mt-2">Heute sind keine Last-Minute Angebote verfügbar.</p>
            <Link
              href={`/${locale}/coiffeur`}
              className="inline-flex mt-4 px-5 py-2.5 rounded-button bg-teal text-white text-sm font-medium hover:bg-teal/90 transition-colors"
            >
              Coiffeure entdecken
            </Link>
          </div>
        ) : (
          <>
            {/* Responsive grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {slots.map((slot) => (
                <LastMinuteCard key={slot.id} slot={slot} locale={locale} />
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-button bg-white border border-gray-200 text-sm font-medium text-dark hover:border-teal transition-colors disabled:opacity-50"
                >
                  {loadingMore ? <Spinner size="sm" /> : null}
                  {loadingMore ? "Lade mehr..." : `Mehr laden`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
