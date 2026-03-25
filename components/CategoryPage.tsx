"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Phone, Globe, Building2, Star, Scissors, Map as MapIcon, List } from "lucide-react";
import dynamic from "next/dynamic";
import SearchFilterBar from "@/components/SearchFilterBar";
import SalonCard from "@/components/SalonCard";
import Spinner from "@/components/ui/Spinner";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import SolenExclusiveBadge from "@/components/ui/SolenExclusiveBadge";
import BlobBackground from "@/components/ui/BlobBackground";
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
  coiffeur:   "from-[rgba(232,98,74,0.12)] via-[rgba(250,246,239,0.80)] to-transparent",
  barbershop: "from-[rgba(74,30,60,0.10)] via-[rgba(250,246,239,0.80)] to-transparent",
  nails:      "from-[rgba(232,98,74,0.10)] via-[rgba(242,193,68,0.06)] to-transparent",
  spa:        "from-[rgba(123,166,136,0.14)] via-[rgba(250,246,239,0.80)] to-transparent",
  makeup:     "from-[rgba(212,135,10,0.12)] via-[rgba(250,246,239,0.80)] to-transparent",
  waxing:     "from-[rgba(107,163,200,0.12)] via-[rgba(250,246,239,0.80)] to-transparent",
};

interface CategoryPageProps {
  category: SalonCategory;
  aboveGrid?: React.ReactNode;
  belowGrid?: React.ReactNode;
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
      className="rounded-[20px] overflow-hidden hover:-translate-y-[3px] transition-all duration-[250ms]"
      style={{ border: "1.5px dashed rgba(26,18,9,.12)",
               background: "rgba(255,255,255,.55)",
               boxShadow: "0 1px 3px rgba(26,18,9,.06)" }}
    >
      {/* Photo */}
      <div className="h-36 relative overflow-hidden bg-s-bg-sunken">
        {entry.photo_url ? (
          <img src={entry.photo_url} alt={entry.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-s-ink/20">
            <Building2 className="w-10 h-10" />
          </div>
        )}
        {/* Directory badge */}
        <span className="absolute top-2 right-2 text-[10px] font-heading font-bold uppercase tracking-[.08em] px-2.5 py-1 rounded-btn"
          style={{ background: "rgba(26,18,9,.55)", color: "rgba(255,255,255,.85)" }}>
          Nicht buchbar
        </span>
      </div>

      <div className="p-4">
        <h3 className="font-heading font-semibold text-s-ink text-sm leading-tight mb-1">{entry.name}</h3>
        {entry.address && <p className="text-xs text-s-ink/50 truncate font-body mb-2">{entry.address}</p>}
        {entry.google_rating != null && (
          <div className="flex items-center gap-1 mb-3">
            <Star className="w-3 h-3 fill-s-amber text-s-amber" />
            <span className="text-xs data-text font-bold text-s-ink/70">{entry.google_rating}</span>
            {entry.google_review_count != null && entry.google_review_count > 0 && (
              <span className="text-xs text-s-ink/35">({entry.google_review_count})</span>
            )}
            <span className="text-[9px] font-heading uppercase tracking-[.10em] text-s-ink/30 ml-1">Google</span>
          </div>
        )}
        <div className="flex gap-2">
          {entry.phone && (
            <a href={`tel:${entry.phone}`}
              className="flex-1 text-center text-[10px] font-heading font-bold uppercase tracking-[.06em] px-3 py-2 rounded-btn border border-s-ink/10 text-s-ink/60 hover:border-s-coral/40 hover:text-s-coral transition-all">
              <Phone className="w-3 h-3 inline mr-1" />Anrufen
            </a>
          )}
          {entry.website && (
            <a href={entry.website} target="_blank" rel="noopener noreferrer"
              className="flex-1 text-center text-[10px] font-heading font-bold uppercase tracking-[.06em] px-3 py-2 rounded-btn border border-s-ink/10 text-s-ink/60 hover:border-s-coral/40 hover:text-s-coral transition-all">
              <Globe className="w-3 h-3 inline mr-1" />Website
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function CategoryPage({ category, aboveGrid, belowGrid }: CategoryPageProps) {
  const locale = useLocale();
  const tc = useTranslations("common");
  const searchParams = useSearchParams();
  const routerNav = useRouter();
  const currentPathname = usePathname();
  const isMapView = searchParams.get("view") === "map";
  const selectedDate = searchParams.get("date");

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
    <div className="min-h-screen bg-s-bg-base relative overflow-x-hidden">
      <BlobBackground zone={2} />
      {/* Hero — category gradient + Bebas Neue H1 */}
      <div className="pt-24 pb-12 relative z-10 overflow-hidden">
        {/* Category gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} pointer-events-none`} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          {/* Breadcrumb — eyebrow style */}
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex items-center gap-1.5 text-[11px] font-heading font-bold uppercase tracking-[.12em]">
              <li><span className="text-s-ink/30">{locale === "de" ? "Startseite" : "Home"}</span></li>
              <li aria-hidden><ChevronRight className="w-3 h-3 text-s-ink/20" /></li>
              <li className="text-s-ink/60" aria-current="page">{categoryLabel}</li>
            </ol>
          </nav>

          {/* Amber eyebrow */}
          <span className="block font-heading font-bold text-[11px] uppercase tracking-[.22em] text-s-amber mb-3">
            Basel · {categoryLabel}
          </span>

          {/* Hero H1 — Bebas Neue at display size */}
          <h1 className="font-display text-s-ink dark:text-s-dm-text"
            style={{ fontSize: "clamp(48px, 8vw, 96px)", lineHeight: "0.87", letterSpacing: "0.01em" }}>
            {categoryLabel.toUpperCase()} IN{" "}
            <span className="text-s-coral">BASEL</span>
          </h1>

          {/* Count line */}
          {(total > 0 || dirTotal > 0) && (
            <p className="font-body italic text-s-ink/50 mt-3 text-[15px] leading-[1.82]">
              {total} {total === 1 ? "Salon" : "Salons"} auf Solen
              {dirTotal > 0 && ` · ${dirTotal} weitere in Basel`}
            </p>
          )}
        </div>
      </div>

      {/* Quartier banner */}
      {topQuartierBanner && !bannerDismissed && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-2">
          <div className="flex items-center justify-between px-4 py-3 rounded-[16px]"
            style={{ background: "rgba(232,98,74,.08)", border: "1px solid rgba(232,98,74,.18)",
                     boxShadow: "0 1px 2px rgba(26,18,9,.06), inset 0 1px 0 rgba(255,255,255,.50)" }}>
            <span className="text-xs font-heading font-bold text-s-coral">
              📍 {topQuartierBanner} — dein meistbesuchtes Quartier
            </span>
            <button onClick={() => setBannerDismissed(true)}
              className="text-s-coral/60 hover:text-s-coral ml-4 text-[10px] font-heading uppercase tracking-[.08em]">
              ✕
            </button>
          </div>
        </div>
      )}

      <SearchFilterBar category={category} />

      {/* Map/List toggle */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 flex items-center justify-between gap-3">
        {/* Results count — left */}
        {!loading && salons.length > 0 && (
          <p className="text-[11px] font-heading font-bold uppercase tracking-[.12em] text-s-ink/40">
            {salons.length} von {total} Salons
          </p>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <SolenExclusiveBadge featureDescription="Sieh Preise direkt auf der Karte!" />
          {/* Toggle pill */}
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
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-btn text-[11px] font-heading font-bold uppercase tracking-[.06em] transition-all"
            style={{ border: "1px solid rgba(26,18,9,.10)",
                     background: isMapView ? "#E8624A" : "rgba(255,255,255,.80)",
                     color: isMapView ? "#fff" : "rgba(26,18,9,.65)",
                     boxShadow: isMapView
                       ? "0 2px 4px rgba(232,98,74,.25)"
                       : "0 1px 2px rgba(26,18,9,.06)" }}>
            {isMapView ? <List size={14} /> : <MapIcon size={14} />}
            {isMapView ? "Liste" : "Karte"}
          </button>
        </div>
      </div>

      {/* Above grid slot (e.g. barbershop filter pills) */}
      {aboveGrid && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">{aboveGrid}</div>
      )}

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
            title={tc("noSalonsFound")}
            message="Versuche andere Filteroptionen oder wähle ein anderes Quartier."
          />
        ) : (
          <div>
            {/* Unified grid: registered salons first, then directory entries */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {(selectedDate
                ? [...salons].sort((a, b) => {
                    const aAvail = a.available_on_date ? 0 : 1;
                    const bAvail = b.available_on_date ? 0 : 1;
                    return aAvail - bAvail;
                  })
                : salons
              ).map((salon) => (
                <SalonCard
                  key={salon.id}
                  salon={salon}
                  locale={locale}
                  {...(selectedDate
                    ? {
                        availability: {
                          status: salon.available_on_date === undefined
                            ? "unknown" as const
                            : salon.available_on_date
                              ? "available" as const
                              : "unavailable" as const,
                          nextDate: salon.next_available_date ?? undefined,
                        },
                      }
                    : {})}
                />
              ))}
              {!dirLoading && dirEntries.map((entry) => (
                <DirectoryCard key={entry.id} entry={entry} />
              ))}
            </motion.div>

            {/* Load more for registered salons */}
            <AnimatePresence>
              {hasMore && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center mt-8">
                  <button onClick={handleLoadMore} disabled={loadingMore}
                    className="flex items-center gap-2 px-8 py-3 rounded-btn text-xs font-heading font-bold uppercase tracking-[.06em] transition-all disabled:opacity-50"
                    style={{ border: "1px solid rgba(26,18,9,.10)",
                             background: "rgba(255,255,255,.70)", backdropFilter: "blur(8px)",
                             WebkitBackdropFilter: "blur(8px)",
                             color: "rgba(26,18,9,.70)",
                             boxShadow: "0 1px 2px rgba(26,18,9,.06)" }}>
                    {loadingMore ? <Spinner size="sm" /> : null}
                    {loadingMore ? "Lade mehr…" : `${total - salons.length} weitere Salons`}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Load more for directory entries */}
            <AnimatePresence>
              {!dirLoading && hasDirMore && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center mt-4">
                  <button onClick={handleDirLoadMore} disabled={dirLoadingMore}
                    className="flex items-center gap-2 px-8 py-3 rounded-btn text-xs font-heading font-bold uppercase tracking-[.06em] transition-all disabled:opacity-50"
                    style={{ border: "1px solid rgba(26,18,9,.10)",
                             background: "rgba(255,255,255,.70)", backdropFilter: "blur(8px)",
                             WebkitBackdropFilter: "blur(8px)",
                             color: "rgba(26,18,9,.70)",
                             boxShadow: "0 1px 2px rgba(26,18,9,.06)" }}>
                    {dirLoadingMore ? <Spinner size="sm" /> : null}
                    {dirLoadingMore ? "Lade mehr…" : `${dirTotal - dirEntries.length} weitere Einträge`}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Below grid slot (e.g. barbershop roster) */}
        {belowGrid}
      </div>
    </div>
  );
}
