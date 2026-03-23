"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import SalonCard from "@/components/SalonCard";
import CategoryTree from "@/components/ui/CategoryTree";
import QuickPreviewSheet from "@/components/ui/QuickPreviewSheet";
import FilterBar from "@/components/FilterBar";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { Search } from "lucide-react";
import BlobBackground from "@/components/ui/BlobBackground";

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

  const slugParts = params.slug ?? [];
  const categorySlug = slugParts[slugParts.length - 1] ?? "";

  const [salons, setSalons] = useState<TreatmentSalon[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [previewSalon, setPreviewSalon] = useState<TreatmentSalon | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

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

  return (
    <div className="min-h-screen bg-s-bg-base dark:bg-s-dm-bg relative overflow-x-hidden">
      <BlobBackground zone={2} />
      {/* FilterBar */}
      <FilterBar />

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
                <h1 className="font-display uppercase text-4xl sm:text-5xl text-s-ink dark:text-s-dm-text leading-none">
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
                    minPrice={salon.min_price ?? undefined}
                    featuredServices={salon.matching_services?.slice(0, 2)}
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
