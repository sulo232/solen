"use client";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

import { motion } from "framer-motion";
import { SearchX } from "lucide-react";
import SalonCard from "@/components/SalonCard";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import Spinner from "@/components/ui/Spinner";
import { containerVariants, itemVariants } from "@/lib/animations";
import type { SalonCard as SalonCardType } from "@/lib/types";

interface SearchResultGridProps {
  salons: SalonCardType[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  locale: string;
  selectedId?: string;
  onSelect?: (id: string) => void;
}

const CATEGORY_PILLS = ["coiffeur", "nails", "barbershop", "spa", "makeup", "waxing"] as const;

export default function SearchResultGrid({
  salons,
  loading,
  loadingMore,
  hasMore,
  onLoadMore,
  locale,
  selectedId,
  onSelect,
}: SearchResultGridProps) {
  const t = useTranslations("emptyStates");
  const router = useRouter();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} variant="card" />
        ))}
      </div>
    );
  }

  if (salons.length === 0) {
    return (
      <div className="p-8">
        <EmptyState
          icon={SearchX}
          title={t("searchNoResults")}
          message={t("searchSuggestion")}
          illustration="no-results"
        />

        {/* Fallback: category suggestion pills */}
        <div className="mt-8">
          <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 mb-3 font-body">
            {t("searchTrySuggestions")}
          </p>
          <div className="flex flex-wrap gap-2 mb-6">
            {CATEGORY_PILLS.map((cat) => (
              <Link
                key={cat}
                href={`/${locale}/${cat}`}
                className="px-4 py-2 rounded-pill bg-s-ink/[0.05] text-s-ink/60 text-sm font-heading font-semibold hover:bg-s-ink/[0.09] hover:text-s-ink dark:bg-s-dm-text/[0.08] dark:text-s-dm-text/60 dark:hover:bg-s-dm-text/[0.14] dark:hover:text-s-dm-text transition-[transform,filter,border-color,background-color] duration-150"
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Link>
            ))}
          </div>

          {/* Reset filters */}
          <button
            onClick={() => router.push(pathname, { scroll: false })}
            className="text-sm text-s-coral hover:underline"
            aria-label={t("searchTryRemoveFilters")}
          >
            {t("searchTryRemoveFilters")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 mb-3 font-body">
        {salons.length} Ergebnis{salons.length !== 1 ? "se" : ""}
      </p>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {salons.map((salon) => (
          <motion.div
            key={salon.id}
            variants={itemVariants}
            onClick={() => onSelect?.(salon.id)}
            className={`cursor-pointer rounded-[12px] transition-[background-color,border-color] ${
              selectedId === salon.id
                ? "ring-2 ring-s-coral ring-offset-2"
                : ""
            }`}
          >
            <SalonCard salon={salon} locale={locale} />
          </motion.div>
        ))}
      </motion.div>

      {hasMore && (
        <div className="flex justify-center mt-6">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="px-6 py-2.5 rounded-btn active:scale-[0.97] bg-s-coral text-white text-sm font-medium shadow-warm-sm hover:shadow-coral-glow transition-[transform,filter] disabled:opacity-50"
          >
            {loadingMore ? <Spinner /> : "Mehr laden"}
          </button>
        </div>
      )}
    </div>
  );
}
