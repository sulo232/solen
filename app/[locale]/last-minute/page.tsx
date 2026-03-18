"use client";

import { useEffect, useState, useRef } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Scissors, Sparkles, Droplets, Palette, Zap, X } from "lucide-react";
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
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createBrowserSupabaseClient>["channel"]> | null>(null);

  const FILTER_CATEGORIES = [
    { key: "coiffeur", label: "Coiffeur", Icon: Scissors },
    { key: "nails", label: "Nails", Icon: Sparkles },
    { key: "spa", label: "Spa", Icon: Droplets },
    { key: "makeup", label: "Makeup", Icon: Palette },
    { key: "waxing", label: "Waxing", Icon: Zap },
  ];

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const filteredSlots = slots.filter((slot) => {
    if (selectedCategories.length > 0) {
      const slotCategory = (slot as LastMinuteSlot & { category?: string }).category;
      if (slotCategory && !selectedCategories.includes(slotCategory)) return false;
    }
    if (maxPrice !== null) {
      const price = (slot as LastMinuteSlot & { discounted_price?: number }).discounted_price ?? slot.original_price;
      if (price > maxPrice) return false;
    }
    return true;
  });

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

      {/* Category chips + price filter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        <div className="flex items-center gap-2 flex-wrap">
          {FILTER_CATEGORIES.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => toggleCategory(key)}
              className={[
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-medium transition-colors",
                selectedCategories.includes(key)
                  ? "bg-teal text-white"
                  : "bg-gray-100 text-dark/60 hover:bg-gray-200",
              ].join(" ")}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
          <span className="w-px h-5 bg-gray-200 mx-1" />
          {[30, 50, 80, 100].map((price) => (
            <button
              key={price}
              onClick={() => setMaxPrice(maxPrice === price ? null : price)}
              className={[
                "px-3 py-1.5 rounded-pill text-xs font-data font-medium transition-colors",
                maxPrice === price
                  ? "bg-coral text-white"
                  : "bg-gray-100 text-dark/60 hover:bg-gray-200",
              ].join(" ")}
            >
              {"< CHF " + price}
            </button>
          ))}
          {(selectedCategories.length > 0 || maxPrice !== null) && (
            <button
              onClick={() => { setSelectedCategories([]); setMaxPrice(null); }}
              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-pill text-xs text-dark/40 hover:text-dark/60"
            >
              <X size={12} />
              Zurücksetzen
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : filteredSlots.length === 0 ? (
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
                {filteredSlots.map((slot) => (
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
