"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Phone, Globe, Building2, Star, Scissors, Map as MapIcon, List } from "lucide-react";
import dynamic from "next/dynamic";
import FilterBar from "@/components/FilterBar";
import SalonCard from "@/components/SalonCard";
import Spinner from "@/components/ui/Spinner";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import SolenExclusiveBadge from "@/components/ui/SolenExclusiveBadge";
import { containerVariants, itemVariants } from "@/lib/animations";
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

const categoryGradients: Record<SalonCategory, string> = {
  coiffeur: "from-s-coral/10 via-white to-transparent",
  barbershop: "from-dark/5 via-white to-transparent",
  nails: "from-s-coral/8 via-white to-transparent",
  spa: "from-s-coral/8 via-white to-transparent",
  makeup: "from-s-coral/10 via-white to-transparent",
  waxing: "from-s-coral/6 via-white to-transparent",
};

interface CategoryPageProps {
  category: SalonCategory;
}

interface DirectoryEntry {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  google_rating: number | null;
  google_review_count: number | null;
  photo_url: string | null;
  quartier: string | null;
}

function DirectoryCard({ entry }: { entry: DirectoryEntry }) {
  return (
    <motion.div
      variants={itemVariants}
      className="rounded-card bg-s-bg-surface border border-s-ink/5 overflow-hidden hover:border-s-coral/20 hover:shadow-card transition-all duration-200 opacity-80"
    >
      <div className="h-36 bg-s-bg-sunken relative overflow-hidden">
        {entry.photo_url ? (
          <img src={entry.photo_url} alt={entry.name} className="w-full h-full object-cover opacity-80" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-s-ink/30">
            <Building2 className="w-10 h-10" />
          </div>
        )}
        <div className="absolute top-2 right-2 text-xs text-white px-2.5 py-0.5 rounded-full font-medium font-body bg-s-coral">
          Nicht buchbar
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-heading font-medium text-s-ink text-sm leading-tight">{entry.name}</h3>
        {entry.address && <p className="text-xs text-s-ink/50 mt-0.5 truncate font-body">{entry.address}</p>}
        {entry.google_rating != null && (
          <div className="flex items-center gap-1 mt-1.5">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-xs data-text font-medium text-s-ink/70">{entry.google_rating}</span>
            {entry.google_review_count != null && entry.google_review_count > 0 && (
              <span className="text-xs text-s-ink/40 font-body">({entry.google_review_count})</span>
            )}
          </div>
        )}
        <div className="flex items-center gap-1.5 mt-3 flex-wrap">
          {entry.phone && (
            <a href={`tel:${entry.phone}`} className="flex items-center gap-1 px-2.5 py-1.5 rounded-button bg-white border border-s-ink/5 text-xs text-s-ink/70 hover:bg-s-bg-sunken font-body transition-colors">
              <Phone className="w-3 h-3" />Anrufen
            </a>
          )}
          {entry.website && (
            <a href={entry.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2.5 py-1.5 rounded-button bg-white border border-s-ink/5 text-xs text-s-ink/70 hover:bg-s-bg-sunken font-body transition-colors">
              <Globe className="w-3 h-3" />Website
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function CategoryPage({ category }: CategoryPageProps) {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const routerNav = useRouter();
  const currentPathname = usePathname();
  const isMapView = searchParams.get("view") === "map";

  const [salons, setSalons] = useState<SalonCardType[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [dirEntries, setDirEntries] = useState<DirectoryEntry[]>([]);
  const [dirTotal, setDirTotal] = useState(0);
  const [dirPage, setDirPage] = useState(1);
  const [dirLoading, setDirLoading] = useState(false);
  const [dirLoadingMore, setDirLoadingMore] = useState(false);

  const [topQuartierBanner, setTopQuartierBanner] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

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

  const buildDirUrl = useCallback(
    (p: number) => {
      const params = new URLSearchParams();
      params.set("category", category);
      params.set("page", String(p));
      params.set("limit", String(PAGE_SIZE));
      const quartier = searchParams.get("quartier");
      if (quartier) params.set("quartier", quartier);
      const search = searchParams.get("search");
      if (search) params.set("search", search);
      return `/api/directory?${params.toString()}`;
    },
    [searchParams, category]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPage(1);
    fetch(buildUrl(1))
      .then((r) => r.json())
      .then((data) => { if (cancelled) return; setSalons(data.items ?? []); setTotal(data.total ?? 0); setLoading(false); })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [buildUrl]);

  useEffect(() => {
    let cancelled = false;
    setDirLoading(true);
    setDirPage(1);
    fetch(buildDirUrl(1))
      .then((r) => r.json())
      .then((data) => { if (cancelled) return; setDirEntries(data.items ?? []); setDirTotal(data.total ?? 0); setDirLoading(false); })
      .catch(() => { if (!cancelled) setDirLoading(false); });
    return () => { cancelled = true; };
  }, [buildDirUrl]);

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const data = await fetch(buildUrl(nextPage)).then((r) => r.json());
      setSalons((prev) => [...prev, ...(data.items ?? [])]);
      setPage(nextPage);
    } finally { setLoadingMore(false); }
  };

  const handleDirLoadMore = async () => {
    const nextPage = dirPage + 1;
    setDirLoadingMore(true);
    try {
      const data = await fetch(buildDirUrl(nextPage)).then((r) => r.json());
      setDirEntries((prev) => [...prev, ...(data.items ?? [])]);
      setDirPage(nextPage);
    } finally { setDirLoadingMore(false); }
  };

  const hasMore = salons.length < total;
  const hasDirMore = dirEntries.length < dirTotal;
  const categoryLabel = categoryLabels[category];
  const gradient = categoryGradients[category];

  return (
    <div className="min-h-screen bg-white">
      {/* Mesh gradient hero */}
      <div className={`bg-gradient-to-b ${gradient} pt-24 pb-6`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="text-xs text-s-ink/40 mb-2 font-body flex items-center gap-1">
            <span>{locale === "de" ? "Startseite" : "Home"}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-s-ink/70">{categoryLabel}</span>
          </nav>
          <h1 className="font-heading font-bold text-2xl sm:text-4xl text-s-ink">{categoryLabel} in Basel</h1>
          {(total > 0 || dirTotal > 0) && (
            <p className="text-sm text-s-ink/50 mt-2 font-body">
              {total} {total === 1 ? "Salon" : "Salons"} auf Solen
              {dirTotal > 0 && ` · ${dirTotal} weitere in Basel`}
            </p>
          )}
        </div>
      </div>

      {/* Quartier banner */}
      {topQuartierBanner && !bannerDismissed && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-2">
          <div className="flex items-center justify-between bg-s-coral/10 border border-s-coral/20 rounded-card px-4 py-2.5 text-sm">
            <span className="text-s-coral font-body font-medium">
              Zeige Salons in {topQuartierBanner} — dein meistbesuchtes Quartier
            </span>
            <button onClick={() => setBannerDismissed(true)} className="text-s-coral/60 hover:text-s-coral ml-4 text-xs font-body">
              Ausblenden
            </button>
          </div>
        </div>
      )}

      <FilterBar />

      {/* Map/List toggle */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 flex items-center justify-end gap-2">
        <SolenExclusiveBadge featureDescription="Sieh Preise direkt auf der Karte!" />
        <button
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString());
            if (isMapView) {
              params.delete("view");
            } else {
              params.set("view", "map");
            }
            routerNav.replace(`${currentPathname}?${params.toString()}`, { scroll: false });
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-button border border-s-ink/10 text-sm font-body font-medium text-s-ink/70 hover:border-s-coral hover:text-s-coral transition-colors"
        >
          {isMapView ? <List size={16} /> : <MapIcon size={16} />}
          {isMapView ? "Liste" : "Karte"}
        </button>
      </div>

      {/* Grid / Map */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {isMapView && !loading && salons.length > 0 ? (
          <div className="h-[500px] rounded-card overflow-hidden">
            <MapView
              salons={salons}
              onSelect={(id) => {
                const salon = salons.find((s) => s.id === id);
                if (salon) routerNav.push(`/${locale}/salon/${salon.slug ?? id}`);
              }}
            />
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} variant="card" />)}
          </div>
        ) : salons.length === 0 && dirEntries.length === 0 ? (
          <EmptyState
            icon={Scissors}
            title="Keine Salons gefunden"
            message="Versuche andere Filteroptionen oder wähle ein anderes Quartier."
          />
        ) : (
          <div>
            {/* Unified grid: registered salons first, then directory entries */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {salons.map((salon) => (
                <SalonCard key={salon.id} salon={salon} locale={locale} />
              ))}
              {!dirLoading && dirEntries.map((entry) => (
                <DirectoryCard key={entry.id} entry={entry} />
              ))}
            </motion.div>

            {/* Load more for registered salons */}
            <AnimatePresence>
              {hasMore && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center mt-8">
                  <button onClick={handleLoadMore} disabled={loadingMore} className="flex items-center gap-2 px-7 py-3 rounded-button bg-white border border-s-ink/10 text-sm font-body font-medium text-s-ink hover:border-s-coral hover:shadow-warm-sm transition-all disabled:opacity-50">
                    {loadingMore ? <Spinner size="sm" /> : null}
                    {loadingMore ? "Lade mehr…" : `Mehr laden (${total - salons.length} weitere)`}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Load more for directory entries */}
            <AnimatePresence>
              {!dirLoading && hasDirMore && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center mt-4">
                  <button onClick={handleDirLoadMore} disabled={dirLoadingMore} className="flex items-center gap-2 px-7 py-3 rounded-button bg-white border border-s-ink/10 text-sm font-body font-medium text-s-ink hover:border-s-ink/20 transition-colors disabled:opacity-50">
                    {dirLoadingMore ? <Spinner size="sm" /> : null}
                    {dirLoadingMore ? "Lade mehr…" : `Mehr laden (${dirTotal - dirEntries.length} weitere)`}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
