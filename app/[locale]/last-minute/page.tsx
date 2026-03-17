"use client";

import { useEffect, useState, useRef } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Scissors } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import FilterBar from "@/components/FilterBar";
import LastMinuteCard from "@/components/LastMinuteCard";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
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
      .catch(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  // Realtime: remove booked slots with exit animation
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel("last-minute-slots")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "availability_slots" },
        (payload: any) => {
          if (payload.eventType === "UPDATE") {
            const updated = payload.new as { id: string; status: string };
            if (updated.status === "booked") {
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
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-gradient-to-b from-coral/8 via-white to-transparent pt-24 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <h1 className="font-heading font-bold text-2xl sm:text-4xl text-dark">
              Last-Minute Angebote
            </h1>
            <span className="w-2.5 h-2.5 rounded-full bg-coral animate-pulse shrink-0" />
          </div>
          {total > 0 && (
            <p className="text-sm text-dark/50 mt-2 font-body">{total} verfügbare Termine heute</p>
          )}
        </div>
      </div>

      <FilterBar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : slots.length === 0 ? (
          <EmptyState
            icon={Scissors}
            title="Gerade keine Last-Minute Slots"
            message="Heute sind keine Last-Minute Angebote verfügbar. Schau später noch einmal rein."
            action={
              <Link
                href={`/${locale}/coiffeur`}
                className="inline-flex items-center px-6 py-3 rounded-button bg-teal text-white text-sm font-body font-medium hover:bg-teal-dark transition-colors shadow-teal-glow"
              >
                Coiffeure entdecken
              </Link>
            }
          />
        ) : (
          <>
            <motion.div
              layout
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              <AnimatePresence mode="popLayout">
                {slots.map((slot) => (
                  <LastMinuteCard key={slot.id} slot={slot} locale={locale} />
                ))}
              </AnimatePresence>
            </motion.div>

            {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-button bg-white border border-gray-200 text-sm font-body font-medium text-dark hover:border-teal transition-colors disabled:opacity-50"
                >
                  {loadingMore ? <Spinner size="sm" /> : null}
                  {loadingMore ? "Lade mehr…" : "Mehr laden"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
