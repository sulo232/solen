"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Filter, X, ArrowUpDown, MapPin, Star } from "lucide-react";
import { SalonCard, type SalonCardProps } from "../homepage/SalonCard";
import { cn } from "@/lib/utils";

/**
 * SearchResults — V3 search results page (V2-D52 Phase F.1.E #19).
 *
 * Replaces legacy `components-legacy/search/SplitView`. Reads URL params
 * produced by the V3 SearchBar (V2-D51): `q, service, city, date, period`.
 * Backwards-compatible with legacy params (`category, sort, min_rating`).
 *
 * Data flow:
 *   - If `q` present (free-text search) → calls `/api/salons/search?q=X`
 *   - Else → calls `/api/salons?category=...&city=...&date=...&sort=...`
 *
 * V3 layout:
 *   - Active-filter chip strip at top (each chip = removable)
 *   - Result count + sort dropdown
 *   - Grid of V3 SalonCards
 *   - Loading skeleton, empty state, error state
 *
 * Aligned with homepage: same `SalonCard` primitive, same V3 brand
 * (emerald action color, terracotta heartbeat, cream substrate inherited
 * from layout). No new design system — just a different surface using the
 * existing pattern library.
 */

type Salon = {
  id: string;
  name: string;
  slug: string;
  average_rating: number | null;
  cover_photo_url: string | null;
  address?: string;
  categories?: string[];
  last_minute_discount_percent?: number;
  avg_price?: number | null;
  distance_meters?: number;
  available_on_date?: boolean;
  next_available_date?: string | null;
};

const V3_CATS = ["coiffeur", "barbershop", "nails", "spa"] as const;
type V3Cat = typeof V3_CATS[number];
function safeCategory(cats: string[] | undefined): V3Cat {
  const first = cats?.[0]?.toLowerCase();
  if (first && (V3_CATS as readonly string[]).includes(first)) return first as V3Cat;
  return "coiffeur";
}

// Map V3 service display label (e.g. "Coiffeur") → backend category enum (e.g. "coiffeur")
function serviceToCategory(service: string | null): string | null {
  if (!service) return null;
  const lower = service.trim().toLowerCase();
  if ((V3_CATS as readonly string[]).includes(lower)) return lower;
  // Try fuzzy match against display labels
  if (lower.includes("coif")) return "coiffeur";
  if (lower.includes("barb")) return "barbershop";
  if (lower.includes("nail") || lower.includes("nagel") || lower.includes("manik")) return "nails";
  if (lower.includes("spa") || lower.includes("wellness") || lower.includes("massage")) return "spa";
  return null;
}

const SORTS = [
  { value: "rating",      label: "Bestbewertet" },
  { value: "newest",      label: "Neueste" },
  { value: "last_minute", label: "Last-Minute Deals" },
  { value: "distance",    label: "Entfernung" },
] as const;

type SortValue = typeof SORTS[number]["value"];

export function SearchResults({ locale }: { locale: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read all params (V3 + legacy)
  const q = searchParams.get("q")?.trim() ?? "";
  const service = searchParams.get("service");
  const category = searchParams.get("category") ?? serviceToCategory(service);
  const city = searchParams.get("city");
  const date = searchParams.get("date");
  const period = searchParams.get("period"); // currently UI-only, not sent to backend
  const sortParam = (searchParams.get("sort") ?? "rating") as SortValue;
  const sort: SortValue = SORTS.some((s) => s.value === sortParam) ? sortParam : "rating";

  const [salons, setSalons] = React.useState<Salon[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setError(null);

    const url = q.length >= 2
      ? `/api/salons/search?q=${encodeURIComponent(q)}`
      : (() => {
          const sp = new URLSearchParams();
          if (category) sp.set("category", category);
          if (city) sp.set("city", city);
          if (date) sp.set("date", date);
          if (sort) sp.set("sort", sort);
          sp.set("limit", "24");
          return `/api/salons?${sp.toString()}`;
        })();

    fetch(url, { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : { items: [], total: 0 }))
      .then((d) => {
        setSalons(d.items ?? []);
        setTotal(d.total ?? (d.items ?? []).length);
        setLoading(false);
      })
      .catch((err) => {
        if (err?.name !== "AbortError") {
          console.error("[SearchResults] fetch failed:", err);
          setError("Suche fehlgeschlagen. Bitte erneut versuchen.");
          setLoading(false);
        }
      });

    return () => ac.abort();
  }, [q, category, city, date, sort]);

  // Active filter chips — removing one updates URL
  const activeFilters: { key: string; label: string; onRemove: () => void }[] = [];
  if (q) {
    activeFilters.push({
      key: "q",
      label: `„${q}"`,
      onRemove: () => updateParam("q", null),
    });
  }
  if (service) {
    activeFilters.push({
      key: "service",
      label: service,
      onRemove: () => {
        updateParam("service", null);
        updateParam("category", null);
      },
    });
  } else if (category) {
    const labelMap: Record<string, string> = {
      coiffeur: "Coiffeur",
      barbershop: "Barbershop",
      nails: "Nails",
      spa: "Spa & Wellness",
    };
    activeFilters.push({
      key: "category",
      label: labelMap[category] ?? category,
      onRemove: () => updateParam("category", null),
    });
  }
  if (city) {
    activeFilters.push({
      key: "city",
      label: city.charAt(0).toUpperCase() + city.slice(1),
      onRemove: () => updateParam("city", null),
    });
  }
  if (date) {
    activeFilters.push({
      key: "date",
      label: formatDateLabel(date),
      onRemove: () => updateParam("date", null),
    });
  }
  if (period) {
    const periodLabel: Record<string, string> = {
      morning: "Morgens",
      noon: "Mittags",
      afternoon: "Nachmittags",
      evening: "Abends",
    };
    activeFilters.push({
      key: "period",
      label: periodLabel[period] ?? period,
      onRemove: () => updateParam("period", null),
    });
  }

  function updateParam(key: string, value: string | null) {
    const sp = new URLSearchParams(searchParams.toString());
    if (value === null || value === "") sp.delete(key);
    else sp.set(key, value);
    router.push(`/${locale}/search${sp.toString() ? `?${sp.toString()}` : ""}`);
  }

  function setSort(newSort: SortValue) {
    updateParam("sort", newSort);
  }

  return (
    <main className="min-h-screen pt-24 md:pt-28">
      <div className="mx-auto w-full max-w-[1280px] px-3 md:px-6">
        {/* Header — page title in Peace Sans, V3 brand */}
        <div className="mb-6 md:mb-8">
          <div className="font-body mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-s-ink-3">
            <span className="block h-1.5 w-1.5 rounded-full bg-s-accent" />
            Suchergebnisse
          </div>
          <h1 className="font-display text-[clamp(28px,3.5vw,44px)] font-black leading-none tracking-normal text-s-ink">
            {loading ? (
              <span className="inline-block h-8 w-48 animate-pulse rounded bg-s-bg-sunken" />
            ) : total === 0 ? (
              <>Keine <span className="text-s-accent">Treffer</span>.</>
            ) : (
              <>
                {total} {total === 1 ? "Salon" : "Salons"}{" "}
                {q && <span className="text-s-accent">„{q}"</span>}
              </>
            )}
          </h1>
        </div>

        {/* Active filter chips */}
        {activeFilters.length > 0 && (
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <Filter size={14} className="text-s-ink-3" />
            {activeFilters.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={f.onRemove}
                className={cn(
                  "font-body inline-flex items-center gap-1.5 rounded-full",
                  "border border-s-brand bg-s-brand-subtle px-3 py-1.5",
                  "text-[13px] font-medium text-s-brand-deep",
                  "transition-colors hover:bg-s-brand/10",
                )}
              >
                {f.label}
                <X size={12} strokeWidth={2.5} />
              </button>
            ))}
            {activeFilters.length > 1 && (
              <button
                type="button"
                onClick={() => router.push(`/${locale}/search`)}
                className="font-body ml-1 text-[12px] font-semibold text-s-ink-3 transition-colors hover:text-s-ink hover:underline"
              >
                Alle löschen
              </button>
            )}
          </div>
        )}

        {/* Sort row — only when results */}
        {!loading && total > 0 && (
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="font-body text-[13px] text-s-ink-3">
              Sortiert nach {SORTS.find((s) => s.value === sort)?.label}
            </div>
            <SortDropdown value={sort} onChange={setSort} />
          </div>
        )}

        {/* Results */}
        {error ? (
          <div className="font-body mt-12 rounded-2xl border border-s-error/30 bg-s-error/5 px-6 py-8 text-center text-s-error">
            {error}
          </div>
        ) : loading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SalonCardSkeleton key={i} />
            ))}
          </div>
        ) : total === 0 ? (
          <EmptyState locale={locale} />
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
            {salons.map((s) => (
              <SalonCard
                key={s.id}
                slug={s.slug}
                name={s.name}
                rating={s.average_rating}
                category={safeCategory(s.categories)}
                photoUrl={s.cover_photo_url ?? undefined}
                discountPercent={s.last_minute_discount_percent ?? null}
                availability={null}
                variant="availability"
                availabilityRow={
                  s.address ? (
                    <span className="flex items-center gap-1 text-s-ink-3">
                      <MapPin size={11} strokeWidth={2} className="shrink-0" />
                      <span className="truncate">{s.address.split(",")[0]}</span>
                    </span>
                  ) : null
                }
                className="!w-full"
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function SortDropdown({
  value, onChange,
}: {
  value: SortValue;
  onChange: (v: SortValue) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "font-body inline-flex items-center gap-2 rounded-full",
          "border border-s-border bg-white px-3.5 py-2",
          "text-[13px] font-medium text-s-ink",
          "transition-colors hover:border-s-brand hover:text-s-brand",
        )}
      >
        <ArrowUpDown size={14} strokeWidth={2} />
        Sortieren
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-[220px] rounded-2xl border border-s-border bg-white p-1.5 shadow-[0_8px_24px_rgba(50,47,44,0.08),0_16px_48px_rgba(50,47,44,0.04)]">
          {SORTS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => {
                onChange(s.value);
                setOpen(false);
              }}
              className={cn(
                "font-body block w-full rounded-xl px-3 py-2 text-left text-[14px] transition-colors",
                s.value === value
                  ? "bg-s-brand-subtle font-semibold text-s-brand-deep"
                  : "text-s-ink hover:bg-s-bg-sunken",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SalonCardSkeleton() {
  return (
    <div className="flex w-full flex-col">
      <div className="aspect-square w-full animate-pulse rounded-[14px] bg-s-bg-sunken" />
      <div className="mt-2 space-y-2 px-1">
        <div className="h-4 w-3/4 animate-pulse rounded bg-s-bg-sunken" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-s-bg-sunken" />
      </div>
    </div>
  );
}

function EmptyState({ locale }: { locale: string }) {
  return (
    <div className="mt-12 flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-full bg-s-brand-subtle text-s-brand">
        <Star size={32} strokeWidth={1.5} />
      </div>
      <h2 className="font-display mt-6 text-[clamp(22px,2.5vw,32px)] font-black tracking-normal text-s-ink">
        Noch keine <span className="text-s-accent">Treffer</span>.
      </h2>
      <p className="font-body mt-3 max-w-md text-[15px] leading-relaxed text-s-ink-2">
        Versuche eine andere Stadt, einen anderen Service oder lass die Filter weg, um mehr Salons zu sehen.
      </p>
      <Link
        href={`/${locale}`}
        className="font-body mt-6 inline-flex items-center gap-2 rounded-full bg-s-brand px-5 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-s-brand-mid"
      >
        Zur Startseite
      </Link>
    </div>
  );
}

function formatDateLabel(iso: string): string {
  // YYYY-MM-DD → "Mo. 13. Mai"
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("de-CH", {
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(d);
  } catch {
    return iso;
  }
}
