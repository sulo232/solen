"use client";
import { useTranslations } from "next-intl";

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
  const tc = useTranslations("common");
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
          title={tc("noResults")}
          message="Versuche andere Suchbegriffe oder ändere deine Filter."
          illustration="no-results"
        />
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
            className={`cursor-pointer rounded-card transition-all ${
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
            className="px-6 py-2.5 rounded-btn active:scale-[0.98] bg-s-coral text-white text-sm font-medium shadow-warm-sm hover:shadow-coral-glow transition-all disabled:opacity-50"
          >
            {loadingMore ? <Spinner /> : "Mehr laden"}
          </button>
        </div>
      )}
    </div>
  );
}
