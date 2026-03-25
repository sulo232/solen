'use client';

import React, { useState, useEffect, lazy, Suspense } from "react";
import { FilterBar, type FilterState } from "../components/FilterBar";
import { LastMinuteCard } from "../components/LastMinuteCard";
import { Spinner } from "../components/ui/Spinner";
import type { LastMinuteSalon } from "../lib/types";

const MapView = lazy(() => import("../components/MapView").then((m) => ({ default: m.MapView })));

export function LastMinutePage({ locale = "de" }: { locale?: string }) {
  const [items, setItems] = useState<LastMinuteSalon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({});
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchItems = async (reset = false) => {
    setIsLoading(true);
    const p = new URLSearchParams();
    if (filters.quartier) p.set("quartier", filters.quartier);
    if (filters.minPrice) p.set("min_price", String(filters.minPrice));
    if (filters.maxPrice) p.set("max_price", String(filters.maxPrice));
    p.set("limit", "20");
    p.set("page", String(reset ? 1 : page));

    try {
      const res = await fetch(`/api/salons/last-minute?${p}`);
      const data: LastMinuteSalon[] = await res.json();
      setItems((prev) => reset ? data : [...prev, ...data]);
      setHasMore(data.length === 20);
      if (reset) setPage(1);
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Pre-fill filters from user preferences
    fetch("/api/profile/preferences")
      .then((r) => r.json())
      .then((data: { top_quartier?: string }) => {
        if (data.top_quartier) setFilters({ quartier: data.top_quartier });
      })
      .catch(() => {});
  }, []);

  useEffect(() => { fetchItems(true); }, [filters]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="pt-24 pb-4 px-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <h1 className="font-heading font-bold text-2xl text-dark">Last-Minute Angebote Heute</h1>
          <span className="w-2.5 h-2.5 bg-coral rounded-full pulse-coral" />
        </div>
        <p className="text-sm text-gray-500 mt-1">Spontan einen Termin buchen</p>

        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => setViewMode("list")}
            className={`px-3 py-1.5 rounded-btn text-xs font-medium border transition-colors ${viewMode === "list" ? "bg-dark text-white border-dark" : "border-gray-200 text-dark"}`}
          >
            Liste
          </button>
          <button
            onClick={() => setViewMode("map")}
            className={`px-3 py-1.5 rounded-btn text-xs font-medium border transition-colors ${viewMode === "map" ? "bg-dark text-white border-dark" : "border-gray-200 text-dark"}`}
          >
            Karte
          </button>
        </div>
      </div>

      <FilterBar filters={filters} onChange={setFilters} />

      <div className="max-w-6xl mx-auto px-4 pt-4 pb-16">
        {isLoading && items.length === 0 ? (
          <div className="flex justify-center py-16"><Spinner size={32} /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🌿</p>
            <p className="font-heading font-semibold text-dark text-lg mb-2">Gerade keine Last-Minute Slots.</p>
            <p className="text-sm text-gray-500 mb-4">Probier es später nochmal.</p>
            <a href={`/${locale}/coiffeur`} className="text-teal font-medium hover:underline text-sm">
              Alle Salons entdecken →
            </a>
          </div>
        ) : viewMode === "list" ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {items.map((item) => <LastMinuteCard key={item.id} item={item} />)}
            </div>
            {hasMore && (
              <div className="text-center mt-6">
                <button
                  onClick={() => { setPage((p) => p + 1); fetchItems(false); }}
                  disabled={isLoading}
                  className="px-6 py-2.5 rounded-btn border border-teal text-teal text-sm font-medium hover:bg-teal/5 transition-colors disabled:opacity-60"
                >
                  Mehr laden
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="h-[500px]">
            <Suspense fallback={<div className="w-full h-full bg-gray-100 rounded-card flex items-center justify-center"><Spinner size={24} /></div>}>
              <MapView
                salons={items}
                className="w-full h-full"
              />
            </Suspense>
          </div>
        )}
      </div>
    </div>
  );
}
