"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Scissors, Sparkles, Droplets, Palette, Zap, X, Clock } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import FilterBar from "@/components/ui/FilterBar";
import SearchAutocomplete from "@/components/ui/SearchAutocomplete";
import { getSearchFilterPills } from "@/lib/search-filter-pills";
import LastMinuteCard from "@/components/LastMinuteCard";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import type { LastMinuteSlot, ActiveFilter } from "@/lib/types";

const PAGE_SIZE = 20;

export default function LastMinutePage() {
  const locale = useLocale();
  const t = useTranslations('filters') as any;
  const tEmpty = useTranslations('emptyStates');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [slots, setSlots] = useState<LastMinuteSlot[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [sortBy, setSortBy] = useState<"discount" | "price" | "time">("discount");
  const channelRef = useRef<ReturnType<ReturnType<typeof createBrowserSupabaseClient>["channel"]> | null>(null);

  const pills = getSearchFilterPills(t);

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

  const filteredSlots = slots
    .filter((slot) => {
      if (selectedCategories.length > 0) {
        const slotCategory = (slot as LastMinuteSlot & { category?: string }).category;
        if (slotCategory && !selectedCategories.includes(slotCategory)) return false;
      }
      if (maxPrice !== null) {
        const price = (slot as LastMinuteSlot & { discounted_price?: number }).discounted_price ?? slot.original_price;
        if (price > maxPrice) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const aSlot = a as LastMinuteSlot & { discounted_price?: number; discount_percent?: number };
      const bSlot = b as LastMinuteSlot & { discounted_price?: number; discount_percent?: number };

      if (sortBy === "discount") {
        // Sort by discount percentage (highest first)
        const aDiscount = aSlot.discount_percent ?? 0;
        const bDiscount = bSlot.discount_percent ?? 0;
        return bDiscount - aDiscount;
      } else if (sortBy === "price") {
        // Sort by price (lowest first)
        const aPrice = aSlot.discounted_price ?? aSlot.original_price;
        const bPrice = bSlot.discounted_price ?? bSlot.original_price;
        return aPrice - bPrice;
      } else if (sortBy === "time") {
        // Sort by available soonest (earliest starts_at first)
        return new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();
      }
      return 0;
    });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch(`/api/slots/last-minute?limit=${PAGE_SIZE}&offset=0`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (cancelled) return;
        if (!data) { setLoading(false); return; }
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
      const res = await fetch(
        `/api/slots/last-minute?limit=${PAGE_SIZE}&offset=${(nextPage - 1) * PAGE_SIZE}`
      );
      if (!res.ok) return;
      const data = await res.json();
      setSlots((prev) => [...prev, ...(data.items ?? [])]);
      setPage(nextPage);
    } finally {
      setLoadingMore(false);
    }
  };

  const hasMore = slots.length < total;

  const handleFilterChange = useCallback((filters: ActiveFilter[]) => {
    setActiveFilters(filters);
    const params = new URLSearchParams(searchParams.toString());

    // Clear previous filter params
    params.delete('quartier');
    params.delete('date');
    params.delete('rating');
    params.delete('sort');
    params.delete('online_payment');
    params.delete('off_peak');

    // Apply new filters to URL params
    filters.forEach((filter) => {
      if (filter.pillId === 'location') {
        params.set('quartier', filter.subId);
      } else if (filter.pillId === 'availability') {
        if (filter.subId !== 'custom_date') {
          params.set('date', filter.subId);
        }
      } else if (filter.pillId === 'rating') {
        params.set('rating', filter.subId);
      } else if (filter.pillId === 'sort') {
        params.set('sort', filter.subId);
      } else if (filter.pillId === 'online_payment') {
        params.set('online_payment', 'true');
      } else if (filter.pillId === 'off_peak') {
        params.set('off_peak', 'true');
      }
    });

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="pt-8 pb-6" style={{ background: "linear-gradient(180deg, rgba(232,98,74,.07) 0%, rgba(255,255,255,0) 100%)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-[9px] font-heading uppercase tracking-[.24em] text-s-coral mb-2">
            letzte freie Termine
          </p>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-[clamp(24px,4vw,40px)] leading-tight text-s-ink">
              Last-Minute Angebote
            </h1>
            {/* Live indicator dot — keep animate-pulse */}
            <span className="w-2.5 h-2.5 rounded-full bg-s-coral animate-pulse shrink-0" aria-label="Live" />
          </div>
          {total > 0 && (
            <p className="text-[10px] font-heading uppercase tracking-[.12em] text-s-ink/40 mt-2">
              {total} verfügbare Termine heute
            </p>
          )}
        </div>
      </div>

      {/* Search + Filters */}
      <div className="sticky top-[57px] z-40 isolate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 bg-white border-b border-s-ink/[0.06]">
          <div className="mb-3">
            <SearchAutocomplete />
          </div>
          <FilterBar
            pills={pills}
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
            zone={3}
          />
        </div>
      </div>

      {/* Category chips + price filter + sorting */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        {/* Sorting toggle */}
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <span className="text-[9px] font-heading uppercase tracking-[.12em] text-s-ink/40">
            Sortieren nach:
          </span>
          {[
            { key: "discount", label: "Rabatt %" },
            { key: "price", label: "Preis" },
            { key: "time", label: "Verfügbarkeit" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSortBy(key as "discount" | "price" | "time")}
              className={[
                "px-3.5 py-2 rounded-pill text-[10px] font-heading transition-colors duration-150",
                sortBy === key
                  ? "bg-s-coral text-white"
                  : "bg-s-bg-sunken text-s-ink/55 hover:bg-s-ink/[0.07]:bg-white/[0.10]",
              ].join(" ")}
              style={sortBy === key ? { boxShadow: "0 2px 4px rgba(232,98,74,.28), 0 4px 12px rgba(232,98,74,.16)" } : undefined}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Category + price filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {FILTER_CATEGORIES.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => toggleCategory(key)}
              className={[
                "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-pill text-[10px] font-heading uppercase tracking-[.06em] transition-colors duration-150",
                selectedCategories.includes(key)
                  ? "bg-s-coral text-white"
                  : "bg-s-bg-sunken text-s-ink/55 hover:bg-s-ink/[0.07]:bg-white/[0.10]",
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
                "px-3.5 py-2 rounded-pill text-[10px] font-heading transition-colors duration-150",
                maxPrice === price
                  ? "bg-s-coral text-white"
                  : "bg-s-bg-sunken text-s-ink/55 hover:bg-s-ink/[0.07]:bg-white/[0.10]",
              ].join(" ")}
              style={maxPrice === price ? { boxShadow: "0 2px 4px rgba(232,98,74,.28), 0 4px 12px rgba(232,98,74,.16)" } : undefined}
            >
              {"< CHF " + price}
            </button>
          ))}
          {(selectedCategories.length > 0 || maxPrice !== null) && (
            <button
              onClick={() => { setSelectedCategories([]); setMaxPrice(null); }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-pill border border-s-ink/[0.08] text-[10px] font-heading uppercase tracking-[.06em] text-s-ink/45 hover:border-s-ink/20 hover:text-s-ink/65 transition-colors duration-150"
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
              <div key={i} className="rounded-[16px] overflow-hidden bg-s-bg-surface">
                {/* Image area */}
                <div className="aspect-[3/4] bg-s-bg-sunken" />
                {/* Content area */}
                <div className="p-3 space-y-2">
                  <div className="h-2.5 w-3/4 bg-s-bg-sunken rounded" />
                  <div className="h-2 w-1/2 bg-s-bg-sunken rounded" />
                  <div className="h-6 w-full bg-s-bg-sunken rounded-full mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredSlots.length === 0 ? (
          <div>
            <EmptyState
              icon={Clock}
              title={tEmpty("lastMinuteNoSlots")}
              message="Heute sind keine Last-Minute Angebote verfügbar. Schau später noch einmal rein."
            />

            {/* Suggested categories */}
            <div className="mt-6">
              <h3 className="font-heading text-base text-s-ink mb-3">
                {tEmpty("lastMinuteSuggestedTitle")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {["coiffeur", "nails", "barbershop"].map((cat) => (
                  <Link
                    key={cat}
                    href={`/${locale}/${cat}`}
                    className="px-4 py-2.5 rounded-pill bg-white border border-s-ink/10 text-sm text-s-ink/70 hover:border-s-coral/30 hover:text-s-coral transition-[transform,filter,border-color,background-color] duration-150"
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Link>
                ))}
              </div>

              {/* Notify me */}
              <button
                onClick={async () => {
                  const email = prompt(tEmpty("lastMinuteNotifyMe"));
                  if (email && email.includes("@")) {
                    await fetch("/api/waitlist", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email, feature: "last-minute" }),
                    }).catch((err) => console.error("[LastMinute] Waitlist error:", err));
                  }
                }}
                className="mt-4 text-sm text-s-coral hover:underline"
                aria-label={tEmpty("lastMinuteNotifyMe")}
              >
                {tEmpty("lastMinuteNotifyMe")}
              </button>
            </div>
          </div>
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
                  className="flex items-center gap-2 px-6 py-3 rounded-btn bg-white border border-s-ink/[0.08] text-xs font-heading uppercase tracking-[.06em] text-s-ink/55 hover:border-s-coral hover:text-s-coral transition-colors duration-150 disabled:opacity-50"
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
