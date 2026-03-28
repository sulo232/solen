"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter, usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import SalonCard from "@/components/SalonCard";
import CategoryTree from "@/components/ui/CategoryTree";
import QuickPreviewSheet from "@/components/ui/QuickPreviewSheet";
import FilterBar from "@/components/ui/FilterBar";
import SearchAutocomplete from "@/components/ui/SearchAutocomplete";
import { getSearchFilterPills } from "@/lib/search-filter-pills";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { Search } from "lucide-react";
// BlobBackground removed — V5 uses ambient-v5 CSS class
import type { ActiveFilter } from "@/lib/types";

interface TreatmentSalon {
  id: string;
  name: string;
  slug: string;
  cover_photo_url: string | null;
  categories: string[];
  quartier: string;
  average_rating: number;
  review_count: number;
  latitude: number;
  longitude: number;
  opening_hours: Record<string, { open: string; close: string } | null>;
  last_minute_discount_percent: number;
  min_price: number | null;
  matching_services: { name_de: string; name_en: string; price: number; duration_minutes: number }[];
  badges?: { icon: string; name_de: string; color: string; bg_color: string }[];
}

export default function TreatmentsClient() {
  const params = useParams<{ slug: string[] }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('filters') as any;

  const slugParts = params.slug ?? [];
  const categorySlug = slugParts[slugParts.length - 1] ?? "";

  const [salons, setSalons] = useState<TreatmentSalon[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [previewSalon, setPreviewSalon] = useState<TreatmentSalon | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);

  const pills = getSearchFilterPills(t);

  const sort = searchParams.get("sort") ?? "rating_desc";
  const minRating = searchParams.get("rating");

  const fetchResults = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("category_slug", categorySlug);
    if (sort) params.set("sort", sort);
    if (minRating) params.set("min_rating", minRating);

    try {
      const res = await fetch(`/api/search/treatments?${params.toString()}`);
      const data = await res.json();
      setSalons(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setSalons([]);
    } finally {
      setLoading(false);
    }
  }, [categorySlug, sort, minRating]);

  useEffect(() => {
    if (categorySlug) fetchResults();
  }, [categorySlug, fetchResults]);

  // Build page title from slug
  const pageTitle = slugParts
    .map((s) => s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(" › ");

  const handleQuickPreview = (salon: TreatmentSalon) => {
    setPreviewSalon(salon);
    setPreviewOpen(true);
  };

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
    <div className="min-h-screen bg-white dark:bg-s-dm-bg ambient-v5 relative overflow-x-hidden">
      {/* Search + Filters */}
      <div className="sticky top-[57px] z-40 isolate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 bg-s-bg-base dark:bg-s-dm-bg border-b border-s-ink/[0.06] dark:border-white/[0.06]">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-16">
        {/* Breadcrumb */}
        <nav className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mb-4">
          <a href={`/${locale}`} className="hover:text-s-coral">Home</a>
          <span className="mx-1">›</span>
          <span className="text-s-ink/70 dark:text-s-dm-text/70">Behandlungen</span>
          {slugParts.map((part, i) => (
            <span key={i}>
              <span className="mx-1">›</span>
              <a
                href={`/${locale}/behandlungen/${slugParts.slice(0, i + 1).join("/")}`}
                className="capitalize hover:text-s-coral"
              >
                {part.replace(/-/g, " ")}
              </a>
            </span>
          ))}
        </nav>

        <div className="flex gap-8">
          {/* Category sidebar (desktop only) */}
          <CategoryTree activeSlug={categorySlug} />

          {/* Results */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="font-heading uppercase text-4xl sm:text-5xl text-s-ink dark:text-s-dm-text leading-none">
                  {pageTitle || "Behandlungen"}<span className="text-s-coral">.</span>
                </h1>
                {!loading && (
                  <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 mt-1">
                    {total} {total === 1 ? "Salon" : "Salons"} gefunden
                  </p>
                )}
              </div>
            </div>

            {/* Mobile category chips */}
            <CategoryTree activeSlug={categorySlug} />

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} variant="card" />
                ))}
              </div>
            ) : salons.length === 0 ? (
              <div className="mt-12">
                <EmptyState
                  icon={Search}
                  title="Keine Salons gefunden"
                  message="Versuche eine andere Kategorie oder ändere die Filter."
                  illustration="no-results"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                {salons.map((salon) => (
                  <SalonCard
                    key={salon.id}
                    salon={salon as any}
                    locale={locale}
                    onQuickPreview={() => handleQuickPreview(salon)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick preview sheet */}
      <QuickPreviewSheet
        salon={previewSalon ? {
          ...previewSalon,
          services: previewSalon.matching_services,
        } : null}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
}
