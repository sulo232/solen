"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { List, Map, ChevronRight } from "lucide-react";
import FilterBar from "@/components/FilterBar";
import SalonCard from "@/components/SalonCard";
import Spinner from "@/components/ui/Spinner";
import type { SalonCard as SalonCardType, SalonCategory } from "@/lib/types";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

const PAGE_SIZE = 12;

const categoryLabels: Record<SalonCategory, string> = {
  coiffeur: "Coiffeur",
  barbershop: "Barbershop",
  nails: "Nägel",
  spa: "Spa",
  makeup: "Makeup",
  waxing: "Waxing",
};

interface CategoryPageProps {
  category: SalonCategory;
}

type ViewMode = "list" | "map";

function getViewPreference(): ViewMode {
  if (typeof document === "undefined") return "list";
  const c = document.cookie.match(/solen_view=([^;]+)/);
  return (c?.[1] as ViewMode) ?? "list";
}

function setViewPreference(v: ViewMode) {
  document.cookie = `solen_view=${v};max-age=${60 * 60 * 24 * 30};path=/`;
}

export default function CategoryPage({ category }: CategoryPageProps) {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [salons, setSalons] = useState<SalonCardType[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [view, setView] = useState<ViewMode>("list");
  const [selectedId, setSelectedId] = useState<string>();
  const [topQuartierBanner, setTopQuartierBanner] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Init view from cookie
  useEffect(() => {
    setView(getViewPreference());
  }, []);

  // Build API URL from search params
  const buildUrl = useCallback(
    (p: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("category", category);
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String((p - 1) * PAGE_SIZE));
      return `/api/salons?${params.toString()}`;
    },
    [searchParams, category]
  );

  // Initial load / filter change
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPage(1);

    fetch(buildUrl(1))
      .then((r) => r.json())
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
  }, [buildUrl]);

  // "Load more"
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

  const toggleView = (v: ViewMode) => {
    setView(v);
    setViewPreference(v);
  };

  // Sync selected map pin → scroll list card
  const handleMapSelect = (id: string) => {
    setSelectedId(id);
    document.getElementById(`salon-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const hasMore = salons.length < total;
  const categoryLabel = categoryLabels[category];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SEO H1 + breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-4">
        <nav className="text-xs text-dark/40 mb-2">
          <span>{locale === "de" ? "Startseite" : "Home"}</span>
          <ChevronRight className="inline w-3 h-3 mx-1" />
          <span className="text-dark/70">{categoryLabel}</span>
        </nav>
        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-dark">
          {categoryLabel} in Basel
        </h1>
        {total > 0 && (
          <p className="text-sm text-dark/50 mt-1">
            {total} {total === 1 ? "Salon" : "Salons"} gefunden
          </p>
        )}
      </div>

      {/* Top quartier banner */}
      {topQuartierBanner && !bannerDismissed && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-2">
          <div className="flex items-center justify-between bg-teal/10 border border-teal/20 rounded-card px-4 py-2.5 text-sm">
            <span className="text-teal font-medium">
              Zeige Salons in {topQuartierBanner} für dich — dein meistbesuchtes Quartier
            </span>
            <button
              onClick={() => setBannerDismissed(true)}
              className="text-teal/60 hover:text-teal ml-4 text-xs"
            >
              Ausblenden
            </button>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <FilterBar />

      {/* View toggle + content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        {/* Toggle */}
        <div className="flex items-center justify-end mb-4">
          <div className="flex rounded-button border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleView("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                view === "list" ? "bg-teal text-white" : "bg-white text-dark/60 hover:bg-gray-50"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Liste
            </button>
            <button
              onClick={() => toggleView("map")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                view === "map" ? "bg-teal text-white" : "bg-white text-dark/60 hover:bg-gray-50"
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              Karte
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : salons.length === 0 ? (
          <div className="text-center py-20 text-dark/40">
            <p className="font-heading text-lg font-semibold">Keine Salons gefunden</p>
            <p className="text-sm mt-2">Versuche andere Filteroptionen.</p>
          </div>
        ) : view === "map" ? (
          /* Map + side list layout */
          <div className="flex gap-4 h-[600px]">
            <div className="flex-1 overflow-hidden rounded-card">
              <MapView salons={salons} selectedId={selectedId} onSelect={handleMapSelect} />
            </div>
            <div className="w-80 overflow-y-auto flex flex-col gap-3 pr-1">
              {salons.map((salon) => (
                <div
                  key={salon.id}
                  id={`salon-${salon.id}`}
                  onClick={() => setSelectedId(salon.id)}
                  className={`cursor-pointer transition-all duration-150 rounded-card ${
                    selectedId === salon.id ? "ring-2 ring-coral" : ""
                  }`}
                >
                  <SalonCard salon={salon} variant="compact" locale={locale} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* List layout */
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {salons.map((salon) => (
                <SalonCard key={salon.id} salon={salon} locale={locale} />
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-button bg-white border border-gray-200 text-sm font-medium text-dark hover:border-teal transition-colors disabled:opacity-50"
                >
                  {loadingMore ? <Spinner size="sm" /> : null}
                  {loadingMore ? "Lade mehr..." : `Mehr laden (${total - salons.length} weitere)`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
