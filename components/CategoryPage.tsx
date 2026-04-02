"use client";
import Link from "next/link";
import Image from "next/image";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Phone, Globe, Building2, Star, Scissors, Map as MapIcon, List, MapPin } from "lucide-react";
import dynamic from "next/dynamic";
import FilterBar from "@/components/ui/FilterBar";
import SearchAutocomplete from "@/components/ui/SearchAutocomplete";
import { getSearchFilterPills } from "@/lib/search-filter-pills";
import SalonCard from "@/components/SalonCard";
import Spinner from "@/components/ui/Spinner";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import SolenExclusiveBadge from "@/components/ui/SolenExclusiveBadge";
// BlobBackground removed — V5 uses ambient-v5 CSS class
import { containerVariants, itemVariants } from "@/lib/animations";
import type { SalonCard as SalonCardType, SalonCategory, ActiveFilter } from "@/lib/types";
import { type CitySlug, getCityName, CITY_SLUGS, CITIES } from "@/lib/cities";
import SearchCriteriaChips from "@/components/search/SearchCriteriaChips";
import SubCategoryChips from "@/components/ui/SubCategoryChips";
import SortDropdown from "@/components/ui/SortDropdown";
import { isOpenNow } from "@/lib/salon-hours";

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
  coiffeur:   "from-[rgba(232,98,74,0.06)] via-[rgba(255,255,255,0.80)] to-transparent",
  barbershop: "from-[rgba(74,30,60,0.05)] via-[rgba(255,255,255,0.80)] to-transparent",
  nails:      "from-[rgba(232,98,74,0.05)] via-[rgba(242,193,68,0.03)] to-transparent",
  spa:        "from-[rgba(123,166,136,0.07)] via-[rgba(255,255,255,0.80)] to-transparent",
  makeup:     "from-[rgba(212,135,10,0.06)] via-[rgba(255,255,255,0.80)] to-transparent",
  waxing:     "from-[rgba(107,163,200,0.06)] via-[rgba(255,255,255,0.80)] to-transparent",
};

interface CategoryPageProps {
  category: SalonCategory;
  city?: CitySlug;
  aboveGrid?: React.ReactNode;
  belowGrid?: React.ReactNode;
}

interface SalonDirectoryEntry {
  id: string;
  name: string;
  phone: string | null;
  website: string | null;
  google_rating: number | null;
  google_review_count: number | null;
  photo_url: string | null;
}

function DirectoryCard({ entry, t }: { entry: SalonDirectoryEntry; t: (key: string) => string }) {
  return (
    <motion.div
      variants={itemVariants}
      className="rounded-[20px] overflow-hidden hover:-translate-y-0.5 transition-[transform,box-shadow] duration-[180ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]"
      style={{ border: "1.5px dashed rgba(26,18,9,.12)",
               background: "var(--glass-bg-subtle)",
               boxShadow: "0 1px 3px rgba(26,18,9,.06)" }}
    >
      {/* Photo */}
      <div className="h-36 relative overflow-hidden bg-s-bg-sunken">
        {entry.photo_url ? (
          <Image src={entry.photo_url} alt={entry.name} fill sizes="(max-width: 768px) 100vw, 400px" className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-s-ink/20">
            <Building2 className="w-10 h-10" />
          </div>
        )}
        {/* Directory badge */}
        <span className="absolute top-2 right-2 text-[10px] font-heading font-bold uppercase tracking-[.08em] px-2.5 py-1 rounded-btn"
          style={{ background: "rgba(26,18,9,.55)", color: "rgba(255,255,255,.85)" }}>
          {t("notBookable")}
        </span>
      </div>

      <div className="p-4">
        <h3 className="font-heading font-semibold text-s-ink text-sm leading-tight mb-1">{entry.name}</h3>
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
              className="flex-1 text-center text-[10px] font-heading font-bold uppercase tracking-[.06em] px-3 py-2 rounded-btn border border-s-ink/10 text-s-ink/60 hover:border-s-coral/40 hover:text-s-coral transition-[border-color,color] duration-150">
              <Phone className="w-3 h-3 inline mr-1" />{t("call")}
            </a>
          )}
          {entry.website && (
            <a href={entry.website} target="_blank" rel="noopener noreferrer"
              className="flex-1 text-center text-[10px] font-heading font-bold uppercase tracking-[.06em] px-3 py-2 rounded-btn border border-s-ink/10 text-s-ink/60 hover:border-s-coral/40 hover:text-s-coral transition-[border-color,color] duration-150">
              <Globe className="w-3 h-3 inline mr-1" />{t("website")}
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function parseFiltersFromParams(searchParams: URLSearchParams): ActiveFilter[] {
  const filters: ActiveFilter[] = [];

  const date = searchParams.get('date');
  if (date) filters.push({ pillId: 'availability', subId: date === 'custom' ? 'custom_date' : date, label: date });

  const rating = searchParams.get('min_rating');
  if (rating) filters.push({ pillId: 'rating', subId: rating, label: `${rating}+ ★` });

  const sort = searchParams.get('sort');
  if (sort) filters.push({ pillId: 'sort', subId: sort, label: sort });

  if (searchParams.get('online_payment') === 'true')
    filters.push({ pillId: 'online_payment', subId: 'online_payment', label: 'Online Payment' });

  if (searchParams.get('off_peak') === 'true')
    filters.push({ pillId: 'off_peak', subId: 'off_peak', label: 'Off Peak' });

  if (searchParams.get('open_now') === 'true')
    filters.push({ pillId: 'open_now', subId: 'open_now', label: 'Jetzt geöffnet' });

  if (searchParams.get('instant_bookable') === 'true')
    filters.push({ pillId: 'instant_bookable', subId: 'instant_bookable', label: 'Sofort buchbar' });

  if (searchParams.get('deals') === 'true')
    filters.push({ pillId: 'deals', subId: 'deals', label: 'Angebot' });

  if (searchParams.get('walk_in') === 'true')
    filters.push({ pillId: 'walk_in', subId: 'walk_in', label: 'Walk-in' });

  return filters;
}

export default function CategoryPage({ category, city, aboveGrid, belowGrid }: CategoryPageProps) {
  const locale = useLocale();
  const tc = useTranslations("common");
  const t = useTranslations('filters') as any;
  const tCategory = useTranslations('categoryPage') as any;
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
  // Initialize active filters from URL params on mount
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>(() =>
    parseFiltersFromParams(new URLSearchParams(searchParams.toString()))
  );

  // Sync active filters when searchParams change externally (e.g. browser back/forward)
  useEffect(() => {
    setActiveFilters(parseFiltersFromParams(new URLSearchParams(searchParams.toString())));
  }, [searchParams]);

  const pills = getSearchFilterPills(t as any);

  const [dirEntries, setDirEntries] = useState<SalonDirectoryEntry[]>([]);
  const [dirTotal, setDirTotal] = useState(0);
  const [dirPage, setDirPage] = useState(1);
  const [dirLoading, setDirLoading] = useState(false);
  const [dirLoadingMore, setDirLoadingMore] = useState(false);

  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Fetch favorites
  useEffect(() => {
    fetch("/api/profile/favorites")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        const favs = data?.favorites ?? [];
        setFavoriteIds(new Set(favs.map((f: { salon_id: string }) => f.salon_id)));
      })
      .catch((err) => console.error("[CategoryPage] failed to fetch favorites:", err));
  }, []);

  const handleFavoriteToggle = useCallback((salonId: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(salonId)) {
        next.delete(salonId);
        fetch(`/api/profile/favorites?salon_id=${salonId}`, { method: "DELETE" }).catch((err) => console.error("[CategoryPage] failed to remove favorite:", err));
      } else {
        next.add(salonId);
        fetch("/api/profile/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ salon_id: salonId }),
        }).catch((err) => console.error("[CategoryPage] failed to add favorite:", err));
      }
      return next;
    });
  }, []);

  const buildUrl = useCallback(
    (p: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("category", category);
      if (city) params.set("city", city);
      params.set("limit", String(PAGE_SIZE));
      params.set("page", String(p));
      return `/api/salons?${params.toString()}`;
    },
    [searchParams, category, city]
  );

  const buildDirUrl = useCallback(
    (p: number) => {
      const params = new URLSearchParams();
      params.set("category", category);
      if (city) params.set("city", city);
      params.set("page", String(p));
      params.set("limit", String(PAGE_SIZE));
      const search = searchParams.get("search");
      if (search) params.set("search", search);
      return `/api/directory?${params.toString()}`;
    },
    [searchParams, category, city]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPage(1);
    fetch(buildUrl(1))
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (cancelled) return;
        if (!data) { setLoading(false); return; }
        const items = data.items ?? [];
        const openNow = searchParams.get('open_now') === 'true';
        const filteredItems = openNow ? items.filter((s: any) => isOpenNow((s as any).opening_hours).isOpen) : items;
        setSalons(filteredItems);
        // When open_now is active, use the filtered count so Load More behaves correctly
        setTotal(openNow ? filteredItems.length : (data.total ?? 0));
        setLoading(false);
      })
      .catch((err) => { console.error("[CategoryPage] failed to fetch salons:", err); if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [buildUrl, searchParams]);

  useEffect(() => {
    let cancelled = false;
    setDirLoading(true);
    setDirPage(1);
    fetch(buildDirUrl(1))
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (cancelled) return; if (!data) { setDirLoading(false); return; } setDirEntries(data.items ?? []); setDirTotal(data.total ?? 0); setDirLoading(false); })
      .catch((err) => { console.error("[CategoryPage] failed to fetch directory:", err); if (!cancelled) setDirLoading(false); });
    return () => { cancelled = true; };
  }, [buildDirUrl]);

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const res = await fetch(buildUrl(nextPage));
      if (!res.ok) return;
      const data = await res.json();
      setSalons((prev) => [...prev, ...(data.items ?? [])]);
      setPage(nextPage);
    } finally { setLoadingMore(false); }
  };

  const handleDirLoadMore = async () => {
    const nextPage = dirPage + 1;
    setDirLoadingMore(true);
    try {
      const res = await fetch(buildDirUrl(nextPage));
      if (!res.ok) return;
      const data = await res.json();
      setDirEntries((prev) => [...prev, ...(data.items ?? [])]);
      setDirPage(nextPage);
    } finally { setDirLoadingMore(false); }
  };

  const hasMore = salons.length < total;
  const hasDirMore = dirEntries.length < dirTotal;
  const categoryLabel = categoryLabels[category];
  const gradient = categoryGradients[category];
  const cityName = city
    ? getCityName(city, locale)
    : locale === "de" ? "Schweizweit" : locale === "fr" ? "Suisse" : locale === "it" ? "Svizzera" : "Switzerland";
  const allCitiesLabel = tCategory("allCities");

  const handleFilterChange = useCallback((filters: ActiveFilter[]) => {
    setActiveFilters(filters);
    const params = new URLSearchParams(searchParams.toString());

    // Clear previous filter params
    params.delete('page');
    params.delete('date');
    params.delete('min_rating');
    params.delete('sort');
    params.delete('online_payment');
    params.delete('off_peak');
    params.delete('open_now');
    params.delete('instant_bookable');
    params.delete('deals');
    params.delete('walk_in');

    // Apply new filters to URL params
    filters.forEach((filter) => {
      if (filter.pillId === 'availability') {
        if (filter.subId !== 'custom_date') {
          params.set('date', filter.subId);
        }
      } else if (filter.pillId === 'rating') {
        params.set('min_rating', filter.subId);
      } else if (filter.pillId === 'sort') {
        params.set('sort', filter.subId);
      } else if (filter.pillId === 'online_payment') {
        params.set('online_payment', 'true');
      } else if (filter.pillId === 'off_peak') {
        params.set('off_peak', 'true');
      } else if (filter.pillId === 'open_now') {
        params.set('open_now', 'true');
      } else if (filter.pillId === 'instant_bookable') {
        params.set('instant_bookable', 'true');
      } else if (filter.pillId === 'deals') {
        params.set('deals', 'true');
      } else if (filter.pillId === 'walk_in') {
        params.set('walk_in', 'true');
      }
    });

    routerNav.replace(`${currentPathname}?${params.toString()}`, { scroll: false });
  }, [currentPathname, routerNav, searchParams]);

  return (
    <div className="min-h-screen bg-white dark:bg-s-dm-bg relative overflow-x-hidden">
      {/* Hero — category gradient + Bebas Neue H1 */}
      <div className="pt-16 pb-6 md:pt-20 md:pb-8 relative z-10 overflow-hidden">
        {/* Category gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} pointer-events-none`} />

        <div className="max-w-5xl mx-auto px-4 pt-8 pb-6 relative z-10">
          {/* Breadcrumb — eyebrow style */}
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-heading font-bold uppercase tracking-[.12em] flex-wrap">
              <li><Link href={`/${locale}`} className="text-s-ink/30 hover:text-s-ink/55 transition-colors duration-150">{tCategory("homepage")}</Link></li>
              <li aria-hidden><ChevronRight className="w-3 h-3 text-s-ink/20" /></li>
              {city && (
                <>
                  <li><span className="text-s-ink/30">{cityName}</span></li>
                  <li aria-hidden><ChevronRight className="w-3 h-3 text-s-ink/20" /></li>
                </>
              )}
              <li className="text-s-ink/60" aria-current="page">{categoryLabel}</li>
            </ol>
          </nav>

          {/* Coral eyebrow */}
          <span className="block font-heading font-bold text-[11px] uppercase tracking-[.22em] text-s-coral mb-3">
            {city ? cityName : allCitiesLabel} · {categoryLabel}
          </span>

          {/* Hero H1 — compact, responsive */}
          <h1 className="font-display text-4xl md:text-6xl text-s-ink dark:text-s-dm-text"
            style={{ lineHeight: "0.92", letterSpacing: "0.01em" }}>
            {city ? (
              <>{categoryLabel.toUpperCase()} IN{" "}<span className="text-s-coral">{cityName.toUpperCase()}</span></>
            ) : (
              <>{categoryLabel.toUpperCase()} <span className="text-s-coral">{locale === "de" ? "ÜBERALL" : locale === "fr" ? "PARTOUT" : locale === "it" ? "OVUNQUE" : "EVERYWHERE"}</span></>
            )}
          </h1>

          {/* Count line */}
          {(total > 0 || dirTotal > 0) && (
            <p className="font-body italic text-s-ink/50 mt-3 text-[15px] leading-[1.82]">
              {total} {total === 1 ? "Salon" : "Salons"} {city ? `in ${cityName}` : tCategory("inSwitzerland")} auf Solen
              {dirTotal > 0 && ` · ${dirTotal} ${tCategory("more")}`}
            </p>
          )}
        </div>
      </div>

      {/* Search + Filters */}
      <div className="sticky top-20 z-40 glass-toolbar">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 py-2 sm:py-3">

          {/* City selector pills */}
          <div
            className="flex gap-2 overflow-x-auto pb-2"
            style={{ scrollbarWidth: "none" } as React.CSSProperties}
          >
            {/* All cities */}
            <button
              onClick={() => routerNav.push(`/${locale}/${category}`)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-[11px] font-heading font-bold uppercase tracking-[.06em] transition-[background-color,color,border-color] duration-150"
              style={{
                border: !city ? "1.5px solid #1A1209" : "1.5px solid rgba(26,18,9,0.12)",
                background: !city ? "#1A1209" : "var(--raised)",
                color: !city ? "#FFFFFF" : "rgba(26,18,9,0.55)",
              }}
            >
              <MapPin size={10} />
              {tCategory("allCities")}
            </button>

            {/* Per-city pills */}
            {CITY_SLUGS.map((slug) => {
              const isActive = city === slug;
              const cityLabel = getCityName(slug, locale);
              return (
                <button
                  key={slug}
                  onClick={() => routerNav.push(`/${locale}/${slug}/${category}`)}
                  className="shrink-0 px-3 py-1.5 rounded-pill text-[11px] font-heading font-bold uppercase tracking-[.06em] transition-[background-color,color,border-color] duration-150"
                  style={{
                    border: isActive ? "1.5px solid #E8624A" : "1.5px solid rgba(26,18,9,0.12)",
                    background: isActive ? "#E8624A" : "var(--raised)",
                    color: isActive ? "#FFFFFF" : "rgba(26,18,9,0.55)",
                    boxShadow: isActive ? "0 2px 6px rgba(232,98,74,.25)" : undefined,
                  }}
                >
                  {cityLabel}
                </button>
              );
            })}
          </div>

          <div className="mb-3">
            <SearchAutocomplete category={category} />
          </div>
          <SearchCriteriaChips locale={locale} />
          <FilterBar
            pills={pills}
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
            zone={3}
          />
          <SubCategoryChips category={category} />
        </div>
      </div>

      {/* Map/List toggle */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-3 sm:pt-4 flex items-center justify-between gap-2 sm:gap-3">
        {/* Results count + Sort — left aligned */}
        <div className="flex items-center gap-4">
          {!loading && salons.length > 0 && (
            <p className="text-[11px] font-heading font-bold uppercase tracking-[.12em] text-s-ink/40">
              {salons.length} von {total} Salons
            </p>
          )}
          <SortDropdown locale={locale} />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="hidden sm:inline-flex">
            <SolenExclusiveBadge featureDescription={tCategory("mapViewOpen")} />
          </span>
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
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-btn text-[11px] font-heading font-bold uppercase tracking-[.06em] transition-[background-color,color,border-color] duration-150"
            style={{ border: "1px solid rgba(26,18,9,.10)",
                     background: isMapView ? "#E8624A" : "var(--glass-bg-card)",
                     color: isMapView ? "#fff" : "rgba(26,18,9,.65)",
                     boxShadow: isMapView
                       ? "0 2px 4px rgba(232,98,74,.25)"
                       : "0 1px 2px rgba(26,18,9,.06)" }}>
            {isMapView ? <List size={14} /> : <MapIcon size={14} />}
            {isMapView ? "Liste" : "Karte"}
          </button>
        </div>
      </div>

      {/* Above grid slot (e.g. category-specific filters) — collapsible */}
      {aboveGrid && (
        <div className="max-w-5xl mx-auto px-5 md:px-6 lg:px-10 pt-4">
          <button
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className="text-xs font-heading font-semibold text-s-coral hover:text-s-coral-hover transition-colors mb-2"
          >
            {filtersExpanded ? t("lessFilters") : t("moreFiltersToggle")}
          </button>
          <AnimatePresence>
            {filtersExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="overflow-hidden"
              >
                {aboveGrid}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Mobile inline mini-map (always visible on mobile, hidden on desktop) */}
      {!isMapView && !loading && salons.length > 0 && (
        <div className="md:hidden max-w-7xl mx-auto px-3 pt-4">
          <button
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.set("view", "map");
              routerNav.replace(`${currentPathname}?${params.toString()}`, { scroll: false });
            }}
            className="relative w-full h-[200px] rounded-[12px] overflow-hidden border border-s-ink/10 dark:border-white/10"
          >
            <MapView
              salons={salons.slice(0, 20)}
              onSelect={(id) => {
                const salon = salons.find((s) => s.id === id);
                if (salon) routerNav.push(`/${locale}/salon/${salon.slug ?? id}`);
              }}
            />
            {/* Overlay tap prompt */}
            <div className="absolute inset-0 bg-gradient-to-t from-s-ink/40 to-transparent pointer-events-none" />
            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-pill bg-white/95 text-s-ink text-xs font-heading font-bold uppercase tracking-[.06em] shadow-warm-md pointer-events-none flex items-center gap-1.5">
              <MapIcon size={13} className="text-s-coral" />
              {tCategory("mapExpand")}
            </span>
          </button>
        </div>
      )}

      {/* Grid / Map */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
        {isMapView && !loading && salons.length > 0 ? (
          <div className="h-[350px] sm:h-[500px] rounded-[12px] overflow-hidden">
            <MapView
              salons={salons}
              enhanced
              onSelect={(id) => {
                const salon = salons.find((s) => s.id === id);
                if (salon) routerNav.push(`/${locale}/salon/${salon.slug ?? id}`);
              }}
            />
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => <Skeleton key={i} variant="card" />)}
          </div>
        ) : salons.length === 0 && dirEntries.length === 0 ? (
          <EmptyState
            icon={Scissors}
            title={tc("noSalonsFound")}
            message="Versuche andere Filteroptionen oder eine andere Stadt."
          />
        ) : (
          <div>
            {/* Unified grid: registered salons first, then directory entries */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {(selectedDate
                ? [...salons].sort((a, b) => {
                    const aAvail = a.available_on_date ? 0 : 1;
                    const bAvail = b.available_on_date ? 0 : 1;
                    return aAvail - bAvail;
                  })
                : salons
              ).map((salon, i) => (
                <motion.div
                  key={salon.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.20,
                    delay: Math.min(i * 0.04, 0.24),
                    ease: [0.2, 0.8, 0.2, 1]
                  }}
                >
                  <SalonCard
                    salon={salon}
                    locale={locale}
                    showCompare
                    isFavorited={favoriteIds.has(salon.id)}
                    onFavoriteToggle={handleFavoriteToggle}
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
                </motion.div>
              ))}
              {!dirLoading && dirEntries.map((entry) => (
                <DirectoryCard key={entry.id} entry={entry} t={tCategory} />
              ))}
            </motion.div>

            {/* Load more for registered salons */}
            <AnimatePresence>
              {hasMore && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center mt-8">
                  <button onClick={handleLoadMore} disabled={loadingMore}
                    className="flex items-center gap-2 px-8 py-3 rounded-btn text-xs font-heading font-bold uppercase tracking-[.06em] transition-[background-color,color,border-color,opacity] duration-150 disabled:opacity-50"
                    style={{ border: "1px solid rgba(26,18,9,.10)",
                             background: "var(--glass-bg-card)", backdropFilter: "blur(8px)",
                             WebkitBackdropFilter: "blur(8px)",
                             color: "rgba(26,18,9,.70)",
                             boxShadow: "0 1px 2px rgba(26,18,9,.06)" }}>
                    {loadingMore ? <Spinner size="sm" /> : null}
                    {loadingMore ? tCategory("loadMore") : `${total - salons.length} weitere Salons`}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Load more for directory entries */}
            <AnimatePresence>
              {!dirLoading && hasDirMore && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center mt-4">
                  <button onClick={handleDirLoadMore} disabled={dirLoadingMore}
                    className="flex items-center gap-2 px-8 py-3 rounded-btn text-xs font-heading font-bold uppercase tracking-[.06em] transition-[background-color,color,border-color,opacity] duration-150 disabled:opacity-50"
                    style={{ border: "1px solid rgba(26,18,9,.10)",
                             background: "var(--glass-bg-card)", backdropFilter: "blur(8px)",
                             WebkitBackdropFilter: "blur(8px)",
                             color: "rgba(26,18,9,.70)",
                             boxShadow: "0 1px 2px rgba(26,18,9,.06)" }}>
                    {dirLoadingMore ? <Spinner size="sm" /> : null}
                    {dirLoadingMore ? tCategory("loadMore") : `${dirTotal - dirEntries.length} weitere Einträge`}
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
