"use client";

import { useEffect, useState, useRef } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Scissors, Sparkles, Droplets, Palette, Zap, X, Clock } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import SearchFilterBar from "@/components/SearchFilterBar";
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
    <div className="min-h-screen bg-s-bg-base dark:bg-s-dm-bg">
      {/* Hero */}
      <div className="pt-8 pb-6" style={{ background: "linear-gradient(180deg, rgba(232,98,74,.07) 0%, rgba(255,255,255,0) 100%)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-[9px] font-heading font-bold uppercase tracking-[.24em] text-s-coral mb-2">
            letzte freie Termine
          </p>
          <div className="flex items-center gap-3">
            <h1 className="font-heading font-bold text-[clamp(24px,4vw,40px)] leading-tight text-s-ink dark:text-s-dm-text">
              Last-Minute Angebote
            </h1>
            {/* Live indicator dot — keep animate-pulse */}
            <span className="w-2.5 h-2.5 rounded-full bg-s-coral animate-pulse shrink-0" aria-label="Live" />
          </div>
          {total > 0 && (
            <p className="text-[10px] font-heading font-bold uppercase tracking-[.12em] text-s-ink/40 dark:text-s-dm-text/40 mt-2">
              {total} verfügbare Termine heute
            </p>
          )}
        </div>
      </div>

      <SearchFilterBar />

      {/* Category chips + price filter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        <div className="flex items-center gap-2 flex-wrap">
          {FILTER_CATEGORIES.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => toggleCategory(key)}
              className={[
                "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-pill text-[10px] font-heading font-bold uppercase tracking-[.06em] transition-all",
                selectedCategories.includes(key)
                  ? "bg-s-coral text-white"
                  : "bg-s-bg-sunken dark:bg-s-dm-surface text-s-ink/55 dark:text-s-dm-text/55 hover:bg-s-ink/[0.07] dark:hover:bg-white/[0.10]",
              ].join(" ")}
              style={selectedCategories.includes(key) ? { boxShadow: "0 2px 4px rgba(232,98,74,.28), 0 4px 12px rgba(232,98,74,.16)" } : undefined}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
          <span className="w-px h-5 bg-s-sand mx-1" />
          {[30, 50, 80, 100].map((price) => (
            <button
              key={price}
              onClick={() => setMaxPrice(maxPrice === price ? null : price)}
              className={[
                "px-3.5 py-2 rounded-pill text-[10px] font-heading font-bold transition-all",
                maxPrice === price
                  ? "bg-s-coral text-white"
                  : "bg-s-bg-sunken dark:bg-s-dm-surface text-s-ink/55 dark:text-s-dm-text/55 hover:bg-s-ink/[0.07] dark:hover:bg-white/[0.10]",
              ].join(" ")}
              style={maxPrice === price ? { boxShadow: "0 2px 4px rgba(232,98,74,.28), 0 4px 12px rgba(232,98,74,.16)" } : undefined}
            >
              {"< CHF " + price}
            </button>
          ))}
          {(selectedCategories.length > 0 || maxPrice !== null) && (
            <button
              onClick={() => { setSelectedCategories([]); setMaxPrice(null); }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-pill border border-s-ink/[0.08] text-[10px] font-heading font-bold uppercase tracking-[.06em] text-s-ink/45 hover:border-s-ink/20 hover:text-s-ink/65 transition-colors"
            >
              <X size={11} />
              Zurücksetzen
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-[16px] overflow-hidden bg-s-bg-surface dark:bg-s-dm-surface">
                {/* Image area */}
                <div className="aspect-[3/4] bg-s-bg-sunken dark:bg-s-dm-raised" />
                {/* Content area */}
                <div className="p-3 space-y-2">
                  <div className="h-2.5 w-3/4 bg-s-bg-sunken dark:bg-s-dm-raised rounded" />
                  <div className="h-2 w-1/2 bg-s-bg-sunken dark:bg-s-dm-raised rounded" />
                  <div className="h-6 w-full bg-s-bg-sunken dark:bg-s-dm-raised rounded-full mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredSlots.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="Gerade keine Last-Minute Slots"
            message="Heute sind keine Last-Minute Angebote verfügbar. Schau später noch einmal rein."
            action={
              <Link
                href={`/${locale}/coiffeur`}
                className="inline-flex items-center gap-1.5 px-6 py-3.5 rounded-btn text-white text-xs font-heading font-bold uppercase tracking-[.04em] active:scale-[0.98] transition-all"
                style={{ background: "#E8624A", boxShadow: "0 2px 4px rgba(232,98,74,.25), 0 4px 12px rgba(232,98,74,.15)" }}
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
                  className="flex items-center gap-2 px-6 py-3 rounded-btn bg-white dark:bg-s-dm-surface border border-s-ink/[0.08] dark:border-white/[0.08] text-xs font-heading font-bold uppercase tracking-[.06em] text-s-ink/55 dark:text-s-dm-text/55 hover:border-s-coral hover:text-s-coral transition-colors disabled:opacity-50"
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
