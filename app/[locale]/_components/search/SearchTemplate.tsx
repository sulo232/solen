"use client";

/**
 * SearchTemplate — V3-D230 (2026-05-26).
 *
 * Unified Fresha-clone template for ALL category-route + /search surfaces.
 * Replaces two legacy implementations:
 *   - components-legacy/search/SplitView.tsx           (/search · V2-D70 era)
 *   - components-legacy/CategoryPage.tsx               (/coiffeur /barbershop /nails · V2-D49)
 *
 * Also resolves the broken /spa route (no list before, just an SEO stub).
 *
 * IA (matches Fresha mobile + desktop pattern per category-routes spec):
 *   Header (sticky z-50)                        ← layout/Header.tsx
 *   ────────────────────────────────────────────
 *   SearchSummaryBar (sticky z-40)              ← internal subcomponent
 *   FilterChipStrip (sticky z-30, scrolls X)    ← internal subcomponent
 *   ResultCountRow                              ← inline
 *   Result grid (V3 SalonCard) + optional Map   ← V3 SalonCard
 *   LoadMore button                             ← inline
 *   belowSlot (per-category SEO content)        ← passed by caller
 *
 * Layer (per COMPONENT_REGISTRY rules):
 *   Layer 1 chrome — surface is white + ink. No category-specific colors.
 *   Hosts Layer 3 children (HeartButton inside SalonCard, star rating).
 *
 * Universal-components rule (V3-D205): NO `if category === 'X'` branches
 * anywhere — same template renders for Coiffeur, Barbershop, Nails, Spa,
 * and /search. Category is data, not branching.
 *
 * Map: lazily mounted via next/dynamic (ssr: false) so SSR is not blocked
 * and the Mapbox bundle only ships when the user toggles it. Defaults to
 * closed on desktop (Solen targets Swiss cities — geo density lower than
 * Fresha's US/UK markets; map opens on demand). Mobile uses FAB toggle.
 */

import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  SlidersHorizontal,
  ChevronDown,
  Map as MapIcon,
  List as ListIcon,
  Search,
  X,
  AlertCircle,
  Loader2,
  SearchX,
  ChevronRight,
} from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { SalonCard, type SalonCardProps } from "../homepage/SalonCard";
import type { SalonCategory } from "@/lib/types";
import { CITY_SLUGS, CITIES, getCityName, isValidCitySlug, type CitySlug } from "@/lib/cities";

// Lazy Mapbox — never blocks SSR, bundle only ships on toggle.
const MapView = dynamic(() => import("@/components-legacy/MapView"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full animate-pulse rounded-[14px] bg-s-bg-sunken" />
  ),
});

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export interface SearchTemplateProps {
  /** Locale from page params (de / en / fr / it). */
  locale: string;
  /** Pre-applied service filter — pins the service chip on category routes.
   *  `null` for /search (user picks via FilterSheet). */
  serviceFilter?: SalonCategory | null;
  /** Optional pre-applied city slug (for /[city]/coiffeur style routes). */
  cityFilter?: CitySlug | null;
  /** Breadcrumb chain — last item = current page. */
  breadcrumb?: { label: string; href?: string }[];
  /** Compact hero block (category routes); /search omits. */
  hero?: { title: string; subtitle?: string } | null;
  /** Slot ABOVE the grid — e.g. CoiffeurAboveGrid (collapsible). */
  aboveSlot?: React.ReactNode;
  /** Slot BELOW the grid — e.g. CoiffeurBelowGrid (SEO content). */
  belowSlot?: React.ReactNode;
}

const PAGE_SIZE = 12;

type Salon = {
  id: string;
  name: string;
  slug: string;
  average_rating: number | null;
  cover_photo_url: string | null;
  address?: string;
  city?: string;
  categories?: string[];
  last_minute_discount_percent?: number | null;
  avg_price?: number | null;
  latitude?: number | null;
  longitude?: number | null;
};

const V3_CATS = ["coiffeur", "barbershop", "nails", "spa"] as const;
type V3Cat = (typeof V3_CATS)[number];
function safeCategory(cats: string[] | undefined): V3Cat {
  const first = cats?.[0]?.toLowerCase();
  if (first && (V3_CATS as readonly string[]).includes(first)) {
    return first as V3Cat;
  }
  return "coiffeur";
}

const SORT_OPTIONS = [
  { value: "rating", label: "Beliebteste" },
  { value: "price", label: "Preis (tief)" },
  { value: "newest", label: "Neueste" },
  { value: "distance", label: "Entfernung" },
] as const;
type SortValue = (typeof SORT_OPTIONS)[number]["value"];

// ─────────────────────────────────────────────────────────────────────────────
// FilterChip — local-only primitive (no external dep).
//
// Universal chip used by the strip + the service-pin badge. Active = ink fill,
// rest = white + hairline. 44px parent hit area via wrapper padding.
// Matches Mobbin Fresha filter chip register but in Solen B&W chrome.
// ─────────────────────────────────────────────────────────────────────────────

const filterChipVariants = cva(
  cn(
    "inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap",
    "rounded-pill border px-3.5 py-1.5",
    "font-body text-[13px] font-medium leading-none",
    "transition-[background-color,color,border-color,transform] duration-150 ease-glide",
    "active:scale-[0.97] active:duration-[80ms]",
    "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
    "min-h-[34px]",
  ),
  {
    variants: {
      tone: {
        rest: "bg-white border-s-border text-s-ink-2 hover:border-s-ink hover:text-s-ink",
        active: "bg-s-ink border-s-ink text-white hover:bg-black",
      },
    },
    defaultVariants: { tone: "rest" },
  },
);

interface FilterChipProps extends VariantProps<typeof filterChipVariants> {
  label: string;
  icon?: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  count?: number;
  hasDropdown?: boolean;
  onClick?: () => void;
  removable?: boolean;
  onRemove?: () => void;
  ariaLabel?: string;
  className?: string;
}

function FilterChip({
  label,
  icon: Icon,
  count,
  hasDropdown,
  onClick,
  removable,
  onRemove,
  tone = "rest",
  ariaLabel,
  className,
}: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel ?? label}
      aria-pressed={tone === "active"}
      className={cn(filterChipVariants({ tone }), className)}
    >
      {Icon && <Icon size={14} strokeWidth={2} />}
      <span>{label}</span>
      {typeof count === "number" && count > 0 && (
        <span
          className={cn(
            "ml-0.5 grid h-4 min-w-[16px] place-items-center rounded-full px-1",
            "font-body text-[10px] font-bold leading-none tabular-nums",
            tone === "active"
              ? "bg-white text-s-ink"
              : "bg-s-ink text-white",
          )}
        >
          {count}
        </span>
      )}
      {hasDropdown && <ChevronDown size={12} strokeWidth={2.25} aria-hidden />}
      {removable && (
        <span
          role="button"
          tabIndex={0}
          aria-label="Filter entfernen"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              onRemove?.();
            }
          }}
          className={cn(
            "-mr-1 ml-0.5 grid h-4 w-4 place-items-center rounded-full",
            "transition-colors duration-150",
            tone === "active"
              ? "text-white/80 hover:text-white"
              : "text-s-ink-3 hover:text-s-ink",
          )}
        >
          <X size={10} strokeWidth={2.5} />
        </span>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SalonCardSkeleton — matches V3 SalonCard footprint per LoadingStates.md
// Pattern 1. Shimmer via existing `.skeleton-shimmer` keyframe in globals.css.
// ─────────────────────────────────────────────────────────────────────────────

function SalonCardSkeleton() {
  return (
    <div className="flex w-full flex-col">
      <div
        className={cn(
          "aspect-square w-full rounded-[22px]",
          "bg-gradient-to-r from-s-bg-sunken via-white to-s-bg-sunken",
          "skeleton-shimmer",
        )}
        aria-hidden
      />
      <div className="mt-[10px] flex flex-col gap-1.5 px-[2px]">
        <div className="h-4 w-3/4 rounded bg-s-bg-sunken skeleton-shimmer" aria-hidden />
        <div className="h-3 w-1/2 rounded bg-s-bg-sunken skeleton-shimmer" aria-hidden />
        <div className="h-3 w-2/5 rounded bg-s-bg-sunken skeleton-shimmer" aria-hidden />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_LABEL: Record<SalonCategory, string> = {
  coiffeur: "Coiffeur",
  barbershop: "Barbershop",
  nails: "Nails",
  spa: "Spa & Wellness",
  makeup: "Makeup",
  waxing: "Waxing",
};

function periodLabel(p: string): string {
  const map: Record<string, string> = {
    morning: "Morgens",
    noon: "Mittags",
    afternoon: "Nachmittags",
    evening: "Abends",
  };
  return map[p] ?? p;
}

function formatDateLabel(iso: string): string {
  try {
    return new Intl.DateTimeFormat("de-CH", {
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function pluralSalons(n: number): string {
  return n === 1 ? "Salon" : "Salons";
}

// ─────────────────────────────────────────────────────────────────────────────
// Main template
// ─────────────────────────────────────────────────────────────────────────────

export default function SearchTemplate({
  locale,
  serviceFilter = null,
  cityFilter = null,
  breadcrumb,
  hero = null,
  aboveSlot = null,
  belowSlot = null,
}: SearchTemplateProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // ── Read URL params (V3 SearchBar + legacy compat) ──────────────────────
  const q = (searchParams.get("q") ?? "").trim();
  // Service: prop wins, then URL `service`/`category`.
  const urlService = searchParams.get("service") ?? searchParams.get("category");
  const activeCategory: SalonCategory | null =
    serviceFilter ??
    (urlService && (V3_CATS as readonly string[]).includes(urlService.toLowerCase())
      ? (urlService.toLowerCase() as SalonCategory)
      : null);
  // City: prop wins, then URL.
  const urlCity = searchParams.get("city");
  const activeCity: CitySlug | null =
    cityFilter ?? (urlCity && isValidCitySlug(urlCity) ? urlCity : null);
  const date = searchParams.get("date");
  const period = searchParams.get("period");
  const sortParam = searchParams.get("sort") ?? "rating";
  const sort: SortValue = (SORT_OPTIONS.some((s) => s.value === sortParam)
    ? sortParam
    : "rating") as SortValue;
  const openNow = searchParams.get("open_now") === "true";
  const instantBookable = searchParams.get("instant_bookable") === "true";
  const deals = searchParams.get("deals") === "true";
  const walkIn = searchParams.get("walk_in") === "true";
  const minRatingParam = searchParams.get("min_rating");
  const minRating = minRatingParam ? Number(minRatingParam) : null;
  const mapOpen = searchParams.get("map") === "1";

  // ── Data state ────────────────────────────────────────────────────────────
  const [salons, setSalons] = React.useState<Salon[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = React.useState<Set<string>>(new Set());
  const [mobileView, setMobileView] = React.useState<"list" | "map">("list");
  const [sortOpen, setSortOpen] = React.useState(false);
  const sortBtnRef = React.useRef<HTMLDivElement>(null);

  // ── Build the API URL from current params ─────────────────────────────────
  const buildUrl = React.useCallback(
    (pageNum: number, qOverride?: string) => {
      const sp = new URLSearchParams();
      if (activeCategory) sp.set("category", activeCategory);
      if (activeCity) sp.set("city", activeCity);
      if (date) sp.set("date", date);
      if (sort) sp.set("sort", sort);
      if (minRating) sp.set("min_rating", String(minRating));
      sp.set("limit", String(PAGE_SIZE));
      sp.set("page", String(pageNum));
      const queryString = qOverride ?? q;
      // /api/salons/search uses ?q=, /api/salons uses params above.
      if (queryString && queryString.length >= 2) {
        return `/api/salons/search?q=${encodeURIComponent(queryString)}`;
      }
      return `/api/salons?${sp.toString()}`;
    },
    [activeCategory, activeCity, date, sort, minRating, q],
  );

  // ── Initial fetch + refetch on params change ──────────────────────────────
  React.useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    setPage(1);

    fetch(buildUrl(1), { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) {
          setSalons([]);
          setTotal(0);
          setLoading(false);
          return;
        }
        setSalons(data.items ?? []);
        setTotal(data.total ?? (data.items ?? []).length);
        setLoading(false);
      })
      .catch((err) => {
        if (err?.name !== "AbortError") {
          console.error("[SearchTemplate] fetch failed:", err);
          setError("Salons konnten nicht geladen werden.");
          setLoading(false);
        }
      });

    return () => ac.abort();
  }, [buildUrl]);

  // ── Favorites prefetch ────────────────────────────────────────────────────
  React.useEffect(() => {
    fetch("/api/profile/favorites")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const favs = data?.favorites ?? [];
        setFavoriteIds(
          new Set((favs as { salon_id: string }[]).map((f) => f.salon_id)),
        );
      })
      .catch((err) =>
        console.error("[SearchTemplate] favorites fetch failed:", err),
      );
  }, []);

  // ── Load more ─────────────────────────────────────────────────────────────
  const handleLoadMore = React.useCallback(async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const res = await fetch(buildUrl(nextPage));
      if (!res.ok) return;
      const data = await res.json();
      setSalons((prev) => [...prev, ...(data.items ?? [])]);
      setPage(nextPage);
    } catch (err) {
      console.error("[SearchTemplate] load more failed:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [page, buildUrl]);

  // ── Param helpers ─────────────────────────────────────────────────────────
  const updateParam = React.useCallback(
    (key: string, value: string | null) => {
      const sp = new URLSearchParams(searchParams.toString());
      if (value === null || value === "") sp.delete(key);
      else sp.set(key, value);
      sp.delete("page");
      router.replace(`${pathname}${sp.toString() ? `?${sp}` : ""}`, {
        scroll: false,
      });
    },
    [searchParams, router, pathname],
  );

  const toggleBooleanParam = React.useCallback(
    (key: string, currentlyActive: boolean) => {
      updateParam(key, currentlyActive ? null : "true");
    },
    [updateParam],
  );

  // ── Sort menu close-on-outside-click ──────────────────────────────────────
  React.useEffect(() => {
    if (!sortOpen) return;
    const onDown = (e: PointerEvent) => {
      if (sortBtnRef.current && !sortBtnRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [sortOpen]);

  // ── Computed ──────────────────────────────────────────────────────────────
  const hasMore = salons.length < total;
  const cityName = activeCity
    ? getCityName(activeCity, locale)
    : locale === "de"
      ? "Schweizweit"
      : locale === "fr"
        ? "Suisse"
        : locale === "it"
          ? "Svizzera"
          : "Switzerland";
  const sortLabel =
    SORT_OPTIONS.find((s) => s.value === sort)?.label ?? "Beliebteste";

  // Active-filter count for the leading Filter chip badge.
  const activeFilterCount =
    (openNow ? 1 : 0) +
    (instantBookable ? 1 : 0) +
    (deals ? 1 : 0) +
    (walkIn ? 1 : 0) +
    (minRating ? 1 : 0) +
    (date ? 1 : 0);

  // ── Favorite toggle ───────────────────────────────────────────────────────
  const toggleFavorite = React.useCallback((salonId: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(salonId)) {
        next.delete(salonId);
        fetch(`/api/profile/favorites?salon_id=${salonId}`, {
          method: "DELETE",
        }).catch((err) =>
          console.error("[SearchTemplate] favorite remove failed:", err),
        );
      } else {
        next.add(salonId);
        fetch("/api/profile/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ salon_id: salonId }),
        }).catch((err) =>
          console.error("[SearchTemplate] favorite add failed:", err),
        );
      }
      return next;
    });
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-s-bg-base">
      {/* Breadcrumb + hero (compact).
          V3-D316 (gap fix, 2026-05-27): was pt-20 md:pt-24 (80/96px) which
          stranded 80px of empty whitespace between the sticky header and the
          breadcrumb on routes that omit `hero` (e.g. /search). Padding is
          now conditional: hero-present → pt-6 md:pt-10 (breathing room for
          big H1); breadcrumb-only → pt-3 md:pt-4 (tight to header). Header
          itself provides the visual top margin via its own h-[79px]. */}
      {(breadcrumb || hero) && (
        <div className={cn(
          "mx-auto w-full max-w-[1280px] px-4 md:px-6",
          hero ? "pt-6 md:pt-10" : "pt-3 md:pt-4",
        )}>
          {breadcrumb && breadcrumb.length > 0 && (
            <nav aria-label="Breadcrumb" className="mb-3">
              <ol className="flex flex-wrap items-center gap-1.5">
                {breadcrumb.map((item, i) => {
                  const isLast = i === breadcrumb.length - 1;
                  return (
                    <React.Fragment key={`${item.label}-${i}`}>
                      <li
                        className={cn(
                          "font-body text-[11px] font-bold uppercase tracking-[0.16em]",
                          isLast ? "text-s-ink" : "text-s-ink-3",
                        )}
                      >
                        {item.href && !isLast ? (
                          <Link
                            href={item.href}
                            className="transition-colors duration-150 hover:text-s-ink"
                          >
                            {item.label}
                          </Link>
                        ) : (
                          <span aria-current={isLast ? "page" : undefined}>
                            {item.label}
                          </span>
                        )}
                      </li>
                      {!isLast && (
                        <li aria-hidden>
                          <ChevronRight size={12} className="text-s-ink-3/60" />
                        </li>
                      )}
                    </React.Fragment>
                  );
                })}
              </ol>
            </nav>
          )}
          {hero && (
            <div className="mb-4">
              {/* V3-D240 (W2, 2026-05-27): match LOCKFILE §2 Page H2 spec —
                  clamp(25,4vw,40)/800 instead of (28,3.5vw,40)/extrabold.
                  Same visual range, just LOCKFILE-aligned tracking. */}
              <h1 className="font-display text-[clamp(22px,2.8vw,26px)] font-semibold leading-[1.0] tracking-[-0.03em] text-s-ink">
                {hero.title}
              </h1>
              {hero.subtitle && (
                <p className="font-body mt-2 text-[14px] font-normal text-s-ink-2">
                  {hero.subtitle}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* SearchSummaryBar — sticky toolbar above the chip strip.
          Echoes the SearchBar's collapsed state; tapping anywhere returns to /.
          Map toggle on the right edge (desktop visible / mobile shown). */}
      <div
        className={cn(
          "sticky top-0 z-40 border-b border-s-border bg-s-bg-base/95",
          "backdrop-blur-md md:backdrop-blur-[18px] md:backdrop-saturate-150",
        )}
      >
        <div className="mx-auto flex w-full max-w-[1280px] items-center gap-2 px-3 py-2.5 md:px-6 md:py-3">
          <Link
            href={`/${locale}`}
            className={cn(
              "group flex min-w-0 flex-1 items-center gap-2 rounded-pill",
              "border border-s-border bg-white px-3 py-2 md:px-4",
              "shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_18px_rgba(0,0,0,0.05)]",
              "transition-shadow duration-150 ease-glide",
              "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
            )}
            aria-label="Suche bearbeiten"
          >
            <Search size={16} strokeWidth={2} className="shrink-0 text-s-ink-2" />
            <span className="min-w-0 flex-1 truncate font-body text-[13px] font-medium text-s-ink md:text-[14px]">
              {q ? (
                <>„{q}"</>
              ) : (
                <>
                  {activeCategory ? CATEGORY_LABEL[activeCategory] : "Alle Services"}
                  <span className="text-s-ink-3"> · </span>
                  {cityName}
                  {date && (
                    <>
                      <span className="text-s-ink-3"> · </span>
                      {formatDateLabel(date)}
                      {period && (
                        <>
                          <span className="text-s-ink-3"> · </span>
                          {periodLabel(period)}
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </span>
          </Link>
          {/* Map toggle. Desktop = open/close split panel. Mobile = enter map view. */}
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined" && window.innerWidth < 768) {
                setMobileView((v) => (v === "map" ? "list" : "map"));
              } else {
                updateParam("map", mapOpen ? null : "1");
              }
            }}
            aria-pressed={mapOpen || mobileView === "map"}
            aria-label={
              mapOpen || mobileView === "map" ? "Karte schliessen" : "Karte öffnen"
            }
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-pill px-3 py-2",
              "font-body text-[13px] font-medium leading-none",
              "border transition-[background-color,color,border-color,transform] duration-150 ease-glide",
              "active:scale-[0.97] active:duration-[80ms]",
              "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
              "min-h-[40px]",
              mapOpen || mobileView === "map"
                ? "border-s-ink bg-s-ink text-white hover:bg-black"
                : "border-s-border bg-white text-s-ink hover:border-s-ink",
            )}
          >
            {mapOpen || mobileView === "map" ? (
              <ListIcon size={14} strokeWidth={2} />
            ) : (
              <MapIcon size={14} strokeWidth={2} />
            )}
            <span className="hidden sm:inline">
              {mapOpen || mobileView === "map" ? "Liste" : "Karte"}
            </span>
          </button>
        </div>

        {/* FilterChipStrip — horizontal scroll on overflow, hidden scrollbar.
            Pinned service chip on category routes is removable → routes to /search. */}
        <div
          className={cn(
            "scrollbar-none mx-auto w-full max-w-[1280px] overflow-x-auto px-3 pb-2.5 md:px-6 md:pb-3",
          )}
          style={{ scrollbarWidth: "none" }}
        >
          <div className="flex items-center gap-2">
            {/* V3-D230: leading "Filter" chip — FilterSheet primitive is deferred
                (see OPEN QUESTIONS in return msg). For v1, the chip strip itself
                carries all active toggles (Heute frei / Sort / 4.5+ / Angebot /
                Walk-in / Sofort buchbar). When the count is positive, this chip
                visibly indicates how many filters are active. A future commit
                lands the sheet for the price-range + service-type pickers. */}
            <FilterChip
              label="Filter"
              icon={SlidersHorizontal}
              count={activeFilterCount}
              tone={activeFilterCount > 0 ? "active" : "rest"}
              ariaLabel="Filter (kommt bald)"
            />
            {/* Service pin — only on category routes. Tap × → /search */}
            {activeCategory && (
              <FilterChip
                label={CATEGORY_LABEL[activeCategory]}
                tone="active"
                removable
                onRemove={() => router.push(`/${locale}/search`)}
                onClick={() => router.push(`/${locale}/search`)}
                ariaLabel={`Service ${CATEGORY_LABEL[activeCategory]} – tap × für alle Services`}
              />
            )}
            {/* Sort chip with inline popover */}
            <div ref={sortBtnRef} className="relative">
              <FilterChip
                label={sortLabel}
                hasDropdown
                tone={sort !== "rating" ? "active" : "rest"}
                onClick={() => setSortOpen((v) => !v)}
                ariaLabel={`Sortierung: ${sortLabel}`}
              />
              {sortOpen && (
                <div
                  className={cn(
                    "absolute left-0 top-full z-50 mt-1.5 w-[200px] rounded-card",
                    "border border-s-border bg-white p-1.5",
                    "shadow-[0_8px_24px_rgba(50,47,44,0.08),0_16px_48px_rgba(50,47,44,0.04)]",
                  )}
                  role="menu"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        updateParam("sort", opt.value === "rating" ? null : opt.value);
                        setSortOpen(false);
                      }}
                      className={cn(
                        "block w-full rounded-[10px] px-3 py-2 text-left",
                        "font-body text-[14px] transition-colors duration-150",
                        opt.value === sort
                          ? "bg-s-bg-sunken font-semibold text-s-ink"
                          : "text-s-ink hover:bg-s-bg-sunken",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <FilterChip
              label="Heute frei"
              tone={openNow ? "active" : "rest"}
              onClick={() => toggleBooleanParam("open_now", openNow)}
              ariaLabel="Heute geöffnete Salons"
            />
            <FilterChip
              label="Sofort buchbar"
              tone={instantBookable ? "active" : "rest"}
              onClick={() =>
                toggleBooleanParam("instant_bookable", instantBookable)
              }
              ariaLabel="Sofort buchbare Salons"
            />
            <FilterChip
              label="4.5+"
              tone={minRating === 4.5 ? "active" : "rest"}
              onClick={() =>
                updateParam("min_rating", minRating === 4.5 ? null : "4.5")
              }
              ariaLabel="Salons mit Bewertung 4.5 oder höher"
            />
            <FilterChip
              label="Angebot"
              tone={deals ? "active" : "rest"}
              onClick={() => toggleBooleanParam("deals", deals)}
              ariaLabel="Salons mit Angebot"
            />
            <FilterChip
              label="Walk-in"
              tone={walkIn ? "active" : "rest"}
              onClick={() => toggleBooleanParam("walk_in", walkIn)}
              ariaLabel="Walk-in-fähige Salons"
            />
          </div>
        </div>
      </div>

      {/* Optional aboveSlot (e.g. CoiffeurAboveGrid) — collapsed details */}
      {aboveSlot && (
        <div className="mx-auto w-full max-w-[1280px] px-3 pt-4 md:px-6">
          {aboveSlot}
        </div>
      )}

      {/* Result count row */}
      <div className="mx-auto w-full max-w-[1280px] px-3 pt-4 md:px-6">
        {loading ? (
          <div
            className="h-3 w-40 rounded bg-s-bg-sunken skeleton-shimmer"
            aria-hidden
          />
        ) : error ? null : (
          <p className="font-body text-[13px] font-normal text-s-ink-2">
            {total > 0 ? (
              <>
                <span className="font-medium text-s-ink">{total}</span>{" "}
                {pluralSalons(total)}
                {activeCity ? <> in {cityName}</> : null}
                <span className="text-s-ink-3">{" · "}</span>
                Sortiert nach {sortLabel}
              </>
            ) : null}
          </p>
        )}
      </div>

      {/* Result grid + optional desktop map split */}
      <div
        className={cn(
          "mx-auto w-full max-w-[1280px] px-3 pb-12 pt-4 md:px-6",
          mapOpen && "md:grid md:grid-cols-[1fr_minmax(380px,46%)] md:gap-6",
        )}
      >
        <div
          className={cn(
            // Mobile map mode hides the list.
            mobileView === "map" && "hidden md:block",
          )}
        >
          {error ? (
            <ErrorState onRetry={() => router.refresh()} message={error} />
          ) : loading ? (
            <div
              className={cn(
                "grid gap-3 md:gap-5",
                mapOpen
                  ? "grid-cols-2 md:grid-cols-2 lg:grid-cols-2"
                  : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
              )}
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <SalonCardSkeleton key={i} />
              ))}
            </div>
          ) : salons.length === 0 ? (
            <EmptyState
              locale={locale}
              hasFilters={
                activeFilterCount > 0 || q.length > 0 || !!activeCategory
              }
              onClearFilters={() =>
                router.replace(activeCategory ? pathname : `/${locale}/search`)
              }
            />
          ) : (
            <>
              <div
                className={cn(
                  "salon-card-stagger grid gap-3 md:gap-5",
                  mapOpen
                    ? "grid-cols-2 md:grid-cols-2 lg:grid-cols-2"
                    : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
                )}
              >
                {salons.map((s) => {
                  const cardProps: SalonCardProps = {
                    slug: s.slug,
                    name: s.name,
                    rating: s.average_rating,
                    photoUrl: s.cover_photo_url ?? undefined,
                    category: safeCategory(s.categories),
                    variant: "service",
                    discountPercent:
                      s.last_minute_discount_percent &&
                      s.last_minute_discount_percent > 0
                        ? s.last_minute_discount_percent
                        : null,
                    priceFromCHF: s.avg_price ?? null,
                    address: s.address?.split(",")[0],
                    city:
                      s.city ??
                      (activeCity ? getCityName(activeCity, locale) : undefined),
                    isSaved: favoriteIds.has(s.id),
                    className: "!w-full",
                  };
                  return <SalonCard key={s.id} {...cardProps} />;
                })}
              </div>
              {hasMore && (
                <div className="flex justify-center pb-2 pt-8">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-btn bg-s-ink px-6 py-3",
                      "font-body text-[14px] font-semibold text-white",
                      "transition-[background-color,transform,opacity] duration-150 ease-glide",
                      "hover:bg-black active:scale-[0.97] active:duration-[80ms]",
                      "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
                      "disabled:opacity-60",
                    )}
                  >
                    {loadingMore ? (
                      <Loader2
                        size={16}
                        className="animate-spin"
                        strokeWidth={2}
                        aria-hidden
                      />
                    ) : null}
                    {loadingMore
                      ? "Lade…"
                      : `${Math.max(0, total - salons.length)} weitere ${pluralSalons(
                          Math.max(0, total - salons.length),
                        )}`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Desktop split map — sticky right column */}
        {mapOpen && !loading && !error && salons.length > 0 && (
          <div
            className={cn(
              "hidden md:block md:sticky md:top-[124px]",
              "md:h-[calc(100vh-140px)] md:overflow-hidden md:rounded-card md:border md:border-s-border",
            )}
          >
            <MapView
              salons={salons as never}
              onSelect={(id) => {
                const salon = salons.find((s) => s.id === id);
                if (salon) {
                  router.push(`/${locale}/salon/${salon.slug ?? id}`);
                }
              }}
              enhanced
            />
          </div>
        )}
      </div>

      {/* Mobile full-viewport map mode */}
      {mobileView === "map" && !loading && !error && salons.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 top-[110px] z-30 md:hidden">
          <MapView
            salons={salons as never}
            onSelect={(id) => {
              const salon = salons.find((s) => s.id === id);
              if (salon) {
                router.push(`/${locale}/salon/${salon.slug ?? id}`);
              }
            }}
            enhanced
          />
        </div>
      )}

      {/* belowSlot — per-category SEO content (FAQ / About / etc.) */}
      {belowSlot && (
        <div className="mx-auto w-full max-w-[1280px] px-3 pb-16 md:px-6">
          {belowSlot}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EmptyState — per LoadingStates.md Pattern 2.
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState({
  locale,
  hasFilters,
  onClearFilters,
}: {
  locale: string;
  hasFilters: boolean;
  onClearFilters: () => void;
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center px-6 py-16 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-s-bg-sunken">
        <SearchX size={28} strokeWidth={1.75} className="text-s-ink-3" />
      </div>
      {/* V3-D240 (W2): match LOCKFILE Section H2 — 20/24 semibold. Empty-state
          heading is mid-page emphasis, not page-level. */}
      <h2 className="font-display mt-5 text-[clamp(18px,2vw,20px)] font-semibold leading-tight tracking-[-0.02em] text-s-ink">
        Keine Salons gefunden.
      </h2>
      <p className="font-body mt-2 max-w-md text-[14px] leading-relaxed text-s-ink-2">
        Versuche eine andere Stadt, einen anderen Service oder lass die Filter
        weg.
      </p>
      <div className="mt-5 flex flex-col items-center gap-2 sm:flex-row">
        {hasFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className={cn(
              "inline-flex items-center gap-2 rounded-btn bg-s-ink px-5 py-2.5",
              "font-body text-[14px] font-semibold text-white",
              "transition-colors duration-150 hover:bg-black",
              "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
            )}
          >
            Filter zurücksetzen
          </button>
        )}
        <Link
          href={`/${locale}`}
          className={cn(
            "inline-flex items-center gap-2 rounded-btn px-5 py-2.5",
            "font-body text-[14px] font-semibold text-s-ink-2",
            "transition-colors duration-150 hover:text-s-ink hover:underline",
            "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
          )}
        >
          Zur Startseite
        </Link>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ErrorState — per LoadingStates.md Pattern 3.
// ─────────────────────────────────────────────────────────────────────────────

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center px-6 py-16 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-s-error/10">
        <AlertCircle size={28} strokeWidth={1.75} className="text-s-error" />
      </div>
      {/* V3-D240 (W2): match LOCKFILE Section H2 — 20px semibold. */}
      <h2 className="font-display mt-5 text-[20px] font-semibold leading-tight tracking-[-0.02em] text-s-ink">
        Etwas ist schiefgelaufen.
      </h2>
      <p className="font-body mt-2 max-w-md text-[14px] leading-relaxed text-s-ink-2">
        {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className={cn(
          "mt-5 inline-flex items-center gap-2 rounded-btn bg-s-ink px-5 py-2.5",
          "font-body text-[14px] font-semibold text-white",
          "transition-colors duration-150 hover:bg-black",
          "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
        )}
      >
        Nochmal versuchen
      </button>
    </div>
  );
}

// Re-export type for callers
export type { Salon };

// V3-D230 (2026-05-26) — Unified SearchTemplate provenance:
//  · Replaces /search SplitView (V2-D70) and /coiffeur·/barber·/nails CategoryPage (V2-D49).
//  · Resolves broken /spa route (previously had no list, only SpaBelowGrid stub).
//  · One file owns: SearchSummaryBar, FilterChipStrip, ResultCountRow, ResultList,
//    LoadMore, EmptyState, ErrorState. Map = lazily dynamic-imported.
//  · Universal-components rule V3-D205: NO category branches. category is data.
//  · Layer 1 chrome (B&W). Hosts Layer 3 children via SalonCard heart + star.
//  · Mapbox MapView is the existing legacy primitive (kept as-is until SearchMap
//    primitive is extracted; deferred per agent brief "minimize scope" rule).
