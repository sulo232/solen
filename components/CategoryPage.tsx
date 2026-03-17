"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Phone, Globe, Building2, Star, Scissors } from "lucide-react";
import FilterBar from "@/components/FilterBar";
import SalonCard from "@/components/SalonCard";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import { containerVariants, itemVariants } from "@/lib/animations";
import type { SalonCard as SalonCardType, SalonCategory } from "@/lib/types";

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
  coiffeur: "from-teal/10 via-white to-transparent",
  barbershop: "from-dark/5 via-white to-transparent",
  nails: "from-coral/8 via-white to-transparent",
  spa: "from-teal/8 via-white to-transparent",
  makeup: "from-coral/10 via-white to-transparent",
  waxing: "from-teal/6 via-white to-transparent",
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
      className="rounded-card bg-gray-50 border border-gray-100 overflow-hidden hover:border-gray-200 hover:shadow-card transition-all duration-200 opacity-80"
    >
      <div className="h-36 bg-gray-100 relative overflow-hidden">
        {entry.photo_url ? (
          <img src={entry.photo_url} alt={entry.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <Building2 className="w-10 h-10" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span className="bg-coral text-white text-xs px-2.5 py-0.5 rounded-full font-medium font-body">
            Nicht buchbar
          </span>
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-heading font-medium text-dark text-sm leading-tight">{entry.name}</h3>
        {entry.address && <p className="text-xs text-dark/50 mt-0.5 truncate font-body">{entry.address}</p>}
        {entry.google_rating != null && (
          <div className="flex items-center gap-1 mt-1.5">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-xs font-data font-medium text-dark/70">{entry.google_rating}</span>
            {entry.google_review_count != null && entry.google_review_count > 0 && (
              <span className="text-xs text-dark/40 font-body">({entry.google_review_count})</span>
            )}
          </div>
        )}
        <div className="flex items-center gap-1.5 mt-3 flex-wrap">
          {entry.phone && (
            <a href={`tel:${entry.phone}`} className="flex items-center gap-1 px-2.5 py-1.5 rounded-button bg-white border border-gray-100 text-xs text-dark/70 hover:bg-gray-100 font-body transition-colors">
              <Phone className="w-3 h-3" />Anrufen
            </a>
          )}
          {entry.website && (
            <a href={entry.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2.5 py-1.5 rounded-button bg-white border border-gray-100 text-xs text-dark/70 hover:bg-gray-100 font-body transition-colors">
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
          <nav className="text-xs text-dark/40 mb-2 font-body flex items-center gap-1">
            <span>{locale === "de" ? "Startseite" : "Home"}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-dark/70">{categoryLabel}</span>
          </nav>
          <h1 className="font-heading font-bold text-2xl sm:text-4xl text-dark">{categoryLabel} in Basel</h1>
          {(total > 0 || dirTotal > 0) && (
            <p className="text-sm text-dark/50 mt-2 font-body">
              {total} {total === 1 ? "Salon" : "Salons"} auf Solen
              {dirTotal > 0 && ` · ${dirTotal} weitere in Basel`}
            </p>
          )}
        </div>
      </div>

      {/* Quartier banner */}
      {topQuartierBanner && !bannerDismissed && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-2">
          <div className="flex items-center justify-between bg-teal/10 border border-teal/20 rounded-card px-4 py-2.5 text-sm">
            <span className="text-teal font-body font-medium">
              Zeige Salons in {topQuartierBanner} — dein meistbesuchtes Quartier
            </span>
            <button onClick={() => setBannerDismissed(true)} className="text-teal/60 hover:text-teal ml-4 text-xs font-body">
              Ausblenden
            </button>
          </div>
        </div>
      )}

      <FilterBar />

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : salons.length === 0 && dirEntries.length === 0 && !dirLoading ? (
          <EmptyState
            icon={Scissors}
            title="Keine Salons gefunden"
            message="Versuche andere Filteroptionen oder wähle ein anderes Quartier."
          />
        ) : (
          <div className="flex flex-col gap-8">
            {/* Unified grid: registered salons first, then directory entries */}
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {salons.map((salon) => (
                <SalonCard key={salon.id} salon={salon} locale={locale} />
              ))}
              {!dirLoading && dirEntries.map((entry) => (
                <DirectoryCard key={entry.id} entry={entry} />
              ))}
            </motion.div>

            {dirLoading && salons.length > 0 && (
              <div className="flex justify-center py-4"><Spinner size="sm" /></div>
            )}

            {/* Load more registered salons */}
            <AnimatePresence>
              {hasMore && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center">
                  <button onClick={handleLoadMore} disabled={loadingMore} className="flex items-center gap-2 px-7 py-3 rounded-button bg-white border border-gray-200 text-sm font-body font-medium text-dark hover:border-teal hover:shadow-teal-glow transition-all disabled:opacity-50">
                    {loadingMore ? <Spinner size="sm" /> : null}
                    {loadingMore ? "Lade mehr…" : `Mehr laden (${total - salons.length} weitere)`}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Load more directory entries */}
            <AnimatePresence>
              {hasDirMore && !hasMore && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center">
                  <button onClick={handleDirLoadMore} disabled={dirLoadingMore} className="flex items-center gap-2 px-7 py-3 rounded-button bg-white border border-gray-200 text-sm font-body font-medium text-dark hover:border-gray-300 transition-colors disabled:opacity-50">
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
