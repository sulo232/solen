"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  ArrowLeft,
  Star,
  MessageCircle,
  Trophy,
  Clock,
  MapPin,
  ExternalLink,
  GitCompare,
} from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/format-currency";
import { cn } from "@/lib/utils";
import type { Salon } from "@/lib/types";

interface CompareSalon extends Salon {
  min_price?: number;
  distance_km?: number;
}

interface ComparePageClientProps {
  locale: string;
  initialIds: string[];
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function getTodayHours(salon: CompareSalon, closedLabel: string): string {
  const key = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][new Date().getDay()];
  const hours = salon.opening_hours?.[key] as { open: string; close: string } | null | undefined;
  return hours ? `${hours.open}–${hours.close}` : closedLabel;
}

function getBestValueIndex(salons: CompareSalon[]): number {
  if (salons.length < 2) return -1;
  let bestIdx = 0;
  let bestScore = -1;
  salons.forEach((s, i) => {
    const rating = s.average_rating ?? 0;
    const reviews = s.review_count ?? 0;
    const price = s.min_price ?? 999;
    const score = (rating * Math.log2(reviews + 1)) / (price || 1);
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  });
  return bestIdx;
}

// ─── row definitions (mirrors CompareDrawer.tsx) ──────────────────────────────

type Row = {
  label: string;
  Icon: React.ElementType;
  render: (s: CompareSalon, isHighlighted: boolean) => React.ReactNode;
};

interface RowLabels {
  rating: string;
  reviewCount: string;
  cheapestService: string;
  todayHours: string;
  distance: string;
  closed: string;
}

function buildRows(locale: string, labels: RowLabels): Row[] {
  return [
    {
      label: labels.rating,
      Icon: Star,
      render: (s) => (
        <div className="flex items-center justify-center gap-1.5">
          <Star size={13} className="fill-s-coral text-s-coral shrink-0" />
          <span className="font-semibold tabular-nums text-s-ink dark:text-s-dm-text">
            {s.average_rating?.toFixed(1) ?? "–"}
          </span>
        </div>
      ),
    },
    {
      label: labels.reviewCount,
      Icon: MessageCircle,
      render: (s) => (
        <span className="tabular-nums text-s-ink dark:text-s-dm-text">
          {s.review_count ?? 0}
        </span>
      ),
    },
    {
      label: labels.cheapestService,
      Icon: Trophy,
      render: (s) => (
        <span className="font-semibold tabular-nums text-s-ink dark:text-s-dm-text">
          {s.min_price ? formatCurrency(s.min_price, locale) : "–"}
        </span>
      ),
    },
    {
      label: labels.todayHours,
      Icon: Clock,
      render: (s) => (
        <span className="text-s-ink/70 dark:text-s-dm-text/70 text-xs">
          {getTodayHours(s, labels.closed)}
        </span>
      ),
    },
    {
      label: labels.distance,
      Icon: MapPin,
      render: (s) => (
        <span className="tabular-nums text-s-ink dark:text-s-dm-text">
          {s.distance_km ? `${s.distance_km.toFixed(1)} km` : "–"}
        </span>
      ),
    },
  ];
}

// ─── photo placeholder ────────────────────────────────────────────────────────

function SalonPhoto({ salon }: { salon: CompareSalon }) {
  const src =
    (salon as any).cover_image_url ??
    (salon as any).logo_url ??
    null;

  if (src) {
    return (
      <Image
        src={src}
        alt={salon.name}
        fill
        className="object-cover"
        unoptimized
      />
    );
  }

  // Placeholder with initial letter
  return (
    <div className="w-full h-full flex items-center justify-center bg-s-coral/10">
      <span className="font-display text-3xl text-s-coral">
        {salon.name.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function ComparePageClient({ locale, initialIds }: ComparePageClientProps) {
  const t = useTranslations("compare");
  const [salons, setSalons] = useState<CompareSalon[]>([]);
  const [loading, setLoading] = useState(initialIds.length > 0);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (initialIds.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);

    fetch(`/api/salons?ids=${initialIds.join(",")}`)
      .then((res) => {
        if (!res.ok) throw new Error("Fetch failed");
        return res.json();
      })
      .then((data) => {
        // API returns { salons: [...] } or array directly — handle both
        const list: CompareSalon[] = Array.isArray(data)
          ? data
          : (data.salons ?? data.data ?? []);
        setSalons(list);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [initialIds.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  const rows = buildRows(locale, {
    rating: t("rating"),
    reviewCount: t("reviewCount"),
    cheapestService: t("cheapestService"),
    todayHours: t("todayHours"),
    distance: t("distance"),
    closed: t("closed"),
  });
  const bestIdx = getBestValueIndex(salons);

  return (
    <main
      id="main-content"
      className="min-h-screen bg-[--base] dark:bg-s-dm-bg font-body"
    >
      {/* ── Header ── */}
      <div className="sticky top-0 z-20 bg-[--base]/90 dark:bg-s-dm-bg/90 backdrop-blur-md border-b border-s-ink/5 dark:border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <Link
            href={`/${locale}`}
            aria-label={t("back")}
            className="flex items-center gap-1.5 text-s-ink/60 dark:text-s-dm-text/60 hover:text-s-coral dark:hover:text-s-coral transition-colors duration-150 text-sm"
          >
            <ArrowLeft size={16} />
            <span>{t("back")}</span>
          </Link>
          <span className="text-s-ink/20 dark:text-white/20">/</span>
          <h1 className="font-heading font-bold text-s-ink dark:text-s-dm-text text-base">
            {t("title")}
          </h1>
          {salons.length > 0 && (
            <span className="ml-auto text-xs text-s-ink/40 dark:text-s-dm-text/40">
              {t("salonCount", { count: salons.length })}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* ── Loading ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div
              className="w-8 h-8 rounded-full border-2 border-s-coral/30 border-t-s-coral animate-spin"
              role="status"
              aria-label={t("loading")}
            />
            <p className="text-s-ink/50 dark:text-s-dm-text/50 text-sm">{t("loading")}</p>
          </div>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <EmptyState
            icon={GitCompare}
            title={t("errorTitle")}
            message={t("errorMessage")}
            action={
              <Link
                href={`/${locale}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-btn bg-s-coral text-white text-sm font-semibold hover:brightness-[1.06] active:scale-[0.98] transition-[transform,filter] duration-150"
              >
                {t("discover")}
              </Link>
            }
          />
        )}

        {/* ── Empty state: no IDs in URL ── */}
        {!loading && !error && salons.length === 0 && initialIds.length === 0 && (
          <EmptyState
            icon={GitCompare}
            title={t("noSelectionTitle")}
            message={t("noSelectionMessage")}
            action={
              <Link
                href={`/${locale}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-btn bg-s-coral text-white text-sm font-semibold hover:brightness-[1.06] active:scale-[0.98] transition-[transform,filter] duration-150"
              >
                {t("discover")}
              </Link>
            }
          />
        )}

        {/* ── Empty state: IDs given but nothing returned ── */}
        {!loading && !error && salons.length === 0 && initialIds.length > 0 && (
          <EmptyState
            icon={GitCompare}
            title={t("notFoundTitle")}
            message={t("notFoundMessage")}
            action={
              <Link
                href={`/${locale}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-btn bg-s-coral text-white text-sm font-semibold hover:brightness-[1.06] active:scale-[0.98] transition-[transform,filter] duration-150"
              >
                {t("discover")}
              </Link>
            }
          />
        )}

        {/* ── Comparison table ── */}
        {!loading && !error && salons.length > 0 && (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="min-w-[560px] px-4 sm:px-0">

              {/* Salon header cards row */}
              <div
                className={cn(
                  "grid gap-3 mb-1",
                  salons.length === 1 && "grid-cols-[200px_1fr]",
                  salons.length === 2 && "grid-cols-[200px_repeat(2,1fr)]",
                  salons.length === 3 && "grid-cols-[200px_repeat(3,1fr)]",
                  salons.length === 4 && "grid-cols-[200px_repeat(4,1fr)]",
                )}
              >
                {/* Empty label cell */}
                <div />

                {salons.map((salon, i) => (
                  <div
                    key={salon.id}
                    className={cn(
                      "relative rounded-card bg-[--raised] dark:bg-s-dm-surface shadow-elevation-1 overflow-hidden",
                      i === bestIdx && "ring-2 ring-s-coral/30"
                    )}
                  >
                    {/* Best value ribbon */}
                    {i === bestIdx && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 px-3 py-0.5 rounded-b-lg bg-s-coral text-white text-[10px] font-bold whitespace-nowrap shadow-sm">
                        {t("recommendation")}
                      </div>
                    )}

                    {/* Photo */}
                    <div className="h-32 w-full overflow-hidden bg-s-ink/5">
                      <SalonPhoto salon={salon} />
                    </div>

                    {/* Name + category */}
                    <div className="px-3 py-3">
                      <p className="font-heading font-bold text-sm text-s-ink dark:text-s-dm-text truncate leading-tight">
                        {salon.name}
                      </p>
                      <p className="text-[11px] text-s-ink/40 dark:text-s-dm-text/40 mt-0.5 truncate capitalize">
                        {(salon as any).quartier ?? (salon as any).city ?? ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Data rows */}
              <div className="rounded-card bg-[--raised] dark:bg-s-dm-surface shadow-elevation-1 overflow-hidden">
                {rows.map((row, rowIdx) => (
                  <div
                    key={row.label}
                    className={cn(
                      "grid items-center gap-3",
                      salons.length === 1 && "grid-cols-[200px_1fr]",
                      salons.length === 2 && "grid-cols-[200px_repeat(2,1fr)]",
                      salons.length === 3 && "grid-cols-[200px_repeat(3,1fr)]",
                      salons.length === 4 && "grid-cols-[200px_repeat(4,1fr)]",
                      rowIdx > 0 && "border-t border-s-ink/5 dark:border-white/5"
                    )}
                  >
                    {/* Row label */}
                    <div className="flex items-center gap-2 px-4 py-3.5">
                      <row.Icon size={13} className="text-s-coral shrink-0" />
                      <span className="text-xs text-s-ink/50 dark:text-s-dm-text/50 whitespace-nowrap">
                        {row.label}
                      </span>
                    </div>

                    {/* Cell per salon */}
                    {salons.map((salon, colIdx) => (
                      <div
                        key={salon.id}
                        className={cn(
                          "px-4 py-3.5 text-center text-sm",
                          colIdx === bestIdx && "bg-s-coral/[0.04]"
                        )}
                      >
                        {row.render(salon, colIdx === bestIdx)}
                      </div>
                    ))}
                  </div>
                ))}

                {/* CTA row */}
                <div
                  className={cn(
                    "grid items-center gap-3 border-t border-s-ink/5 dark:border-white/5 bg-s-ink/[0.015] dark:bg-white/[0.015]",
                    salons.length === 1 && "grid-cols-[200px_1fr]",
                    salons.length === 2 && "grid-cols-[200px_repeat(2,1fr)]",
                    salons.length === 3 && "grid-cols-[200px_repeat(3,1fr)]",
                    salons.length === 4 && "grid-cols-[200px_repeat(4,1fr)]",
                  )}
                >
                  <div className="px-4 py-4 text-xs text-s-ink/30 dark:text-s-dm-text/30 font-medium">
                    {t("bookLabel")}
                  </div>
                  {salons.map((salon) => (
                    <div key={salon.id} className="px-4 py-4 text-center">
                      <Link
                        href={`/${locale}/salon/${salon.slug}`}
                        aria-label={`${t("bookNow")} ${salon.name}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-btn bg-s-coral text-white text-xs font-semibold hover:brightness-[1.06] active:scale-[0.98] transition-[transform,filter] duration-150 whitespace-nowrap"
                      >
                        {t("bookNow")}
                        <ExternalLink size={11} />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hint below table */}
              <p className="text-center text-xs text-s-ink/30 dark:text-s-dm-text/30 mt-4">
                {t("hint")}
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
