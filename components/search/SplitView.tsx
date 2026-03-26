"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import FilterBar from "@/components/ui/FilterBar";
import SearchAutocomplete from "@/components/ui/SearchAutocomplete";
import { getSearchFilterPills } from "@/lib/search-filter-pills";
import SearchResultGrid from "@/components/search/SearchResultGrid";
import MobileViewToggle from "@/components/search/MobileViewToggle";
import QuickPreviewSheet from "@/components/ui/QuickPreviewSheet";
import type { SalonCard as SalonCardType, SalonCategory, ActiveFilter } from "@/lib/types";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] rounded-card bg-s-bg-sunken dark:bg-s-dm-surface animate-pulse" />
  ),
});

const PAGE_SIZE = 12;

interface SplitViewProps {
  locale: string;
  initialFilters: Record<string, string | string[] | undefined>;
}

export default function SplitView({ locale, initialFilters }: SplitViewProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('filters');

  // Mobile view state: "grid" or "map"
  const [mobileView, setMobileView] = useState<"grid" | "map">("grid");

  // Data state
  const [salons, setSalons] = useState<SalonCardType[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);

  const pills = getSearchFilterPills(t as any);

  // Map interaction state
  const [selectedSalonId, setSelectedSalonId] = useState<string | undefined>();
  const [previewSalon, setPreviewSalon] = useState<SalonCardType | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Build API URL from search params
  const buildUrl = useCallback(
    (p: number) => {
      const params = new URLSearchParams();
      const category = searchParams.get("category");
      const q = searchParams.get("q");
      const date = searchParams.get("date");
      const priceMin = searchParams.get("priceMin");
      const priceMax = searchParams.get("priceMax");
      const sort = searchParams.get("sort");
      const minRating = searchParams.get("min_rating");
      const lat = searchParams.get("lat");
      const lng = searchParams.get("lng");

      if (category) params.set("category", category);
      if (date) params.set("date", date);
      if (priceMin) params.set("min_price", priceMin);
      if (priceMax) params.set("max_price", priceMax);
      if (sort) params.set("sort", sort);
      if (minRating) params.set("min_rating", minRating);
      if (lat) params.set("lat", lat);
      if (lng) params.set("lng", lng);

      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String((p - 1) * PAGE_SIZE));

      return `/api/salons?${params.toString()}`;
    },
    [searchParams]
  );

  // Fetch salons on filter change
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPage(1);

    const fetchUrl = buildUrl(1);

    // If there's a text query, also search via /api/salons/search
    const q = searchParams.get("q");
    const fetchPromise = q && q.length >= 2
      ? fetch(`/api/salons/search?q=${encodeURIComponent(q)}`).then((r) => r.json())
      : fetch(fetchUrl).then((r) => r.json());

    fetchPromise
      .then((data) => {
        if (cancelled) return;
        setSalons(data.items ?? []);
        setTotal(data.total ?? 0);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [buildUrl, searchParams]);

  // Load more
  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const data = await fetch(buildUrl(nextPage)).then((r) => r.json());
      setSalons((prev) => [...prev, ...(data.items ?? [])]);
      setPage(nextPage);
    } finally {
      setLoadingMore(false);
    }
  };

  // Map pin click → open preview sheet
  const handleMapSelect = (id: string) => {
    setSelectedSalonId(id);
    const salon = salons.find((s) => s.id === id);
    if (salon) {
      setPreviewSalon(salon);
      setPreviewOpen(true);
    }
  };

  // Area search from map bounds
  const handleAreaSearch = (bounds: { north: number; south: number; east: number; west: number }) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("lat", String((bounds.north + bounds.south) / 2));
    params.set("lng", String((bounds.east + bounds.west) / 2));
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const hasMore = salons.length < total;
  const category = searchParams.get("category") as SalonCategory | undefined;

  const handleFilterChange = useCallback((filters: ActiveFilter[]) => {
    setActiveFilters(filters);
    const params = new URLSearchParams(searchParams.toString());

    // Clear previous filter params
    params.delete('date');
    params.delete('rating');
    params.delete('sort');
    params.delete('online_payment');
    params.delete('off_peak');

    // Apply new filters to URL params
    filters.forEach((filter) => {
      if (filter.pillId === 'availability') {
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
    <div className="flex flex-col">
      {/* Search + Filters */}
      <div className="sticky top-[57px] z-40 isolate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 bg-white dark:bg-s-dm-bg border-b border-s-ink/[0.06] dark:border-white/[0.06]">
          <div className="mb-3">
            <SearchAutocomplete category={category} />
          </div>
          <FilterBar
            pills={pills}
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
            zone={3}
          />
        </div>
      </div>

      {/* Split view: grid on desktop, toggle on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 min-h-[calc(100vh-140px)]">
        {/* Results panel */}
        <div className={`overflow-y-auto ${mobileView === "map" ? "hidden md:block" : ""}`}>
          <SearchResultGrid
            salons={salons}
            loading={loading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
            locale={locale}
            selectedId={selectedSalonId}
            onSelect={handleMapSelect}
          />
        </div>

        {/* Map panel */}
        <div
          className={`sticky top-0 h-[calc(100vh-140px)] ${
            mobileView === "grid" ? "hidden md:block" : ""
          }`}
        >
          <MapView
            salons={salons}
            selectedId={selectedSalonId}
            onSelect={handleMapSelect}
            enhanced
            onAreaSearch={handleAreaSearch}
          />
        </div>
      </div>

      {/* Mobile view toggle FAB */}
      <MobileViewToggle view={mobileView} onToggle={setMobileView} />

      {/* Quick preview sheet on map pin click */}
      <QuickPreviewSheet
        salon={previewSalon ? {
          name: previewSalon.name,
          slug: previewSalon.slug,
          cover_photo_url: previewSalon.cover_photo_url,
          average_rating: previewSalon.average_rating,
          review_count: previewSalon.review_count,
          opening_hours: previewSalon.opening_hours,
          services: (previewSalon.services ?? []).map((s) => ({
            name_de: (s as any).name_de ?? "",
            name_en: (s as any).name_en ?? "",
            price: (s as any).price ?? 0,
            duration_minutes: (s as any).duration_minutes ?? 0,
          })),
        } : null}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
}
