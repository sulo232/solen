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
import { useTranslations } from "next-intl";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import {
  ChevronDown,
  ChevronLeft,
  Map as MapIcon,
  List as ListIcon,
  Search,
  AlertCircle,
  Loader2,
  SearchX,
  Check,
  SlidersHorizontal,
  // V3-D354: Fuer-dich surface-shortcut icons (PLACEHOLDER lucide glyphs - the
  // user is drawing custom 3D icons to replace these, same family as the
  // category PNGs in /public/icons/categories).
  Compass,
  Award,
  Users,
  History,
  DoorOpen,
  Brush,
} from "lucide-react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { SalonResultCard } from "./SalonResultCard";
import { CategoryBrowseRails } from "./CategoryBrowseRails";
import { FilterSheet } from "./FilterSheet";
import type { SalonCategory } from "@/lib/types";
import { getCityName, isValidCitySlug, type CitySlug } from "@/lib/cities";

type LucideIcon = React.ComponentType<{ size?: number; strokeWidth?: number }>;

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
  review_count?: number | null;
  cover_photo_url: string | null;
  address?: string;
  city?: string;
  categories?: string[];
  last_minute_discount_percent?: number | null;
  avg_price?: number | null;
  distance_meters?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  // V3-D357: re-enabled to fill the cards (location + next-slot). quartier =
  // neighbourhood; services carry name/price/duration + available slots (ISO).
  quartier?: string | null;
  services?: {
    id: string;
    name_de?: string | null;
    name_en?: string | null;
    price?: number | null;
    duration_minutes?: number | null;
    slots?: string[] | null;
  }[];
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

// V3-D357: earliest upcoming slot across a salon's services -> a short label
// ("heute 15:30" / "morgen 09:00" / "Mi. 14:00"). Umlaut-free German; en/fr/it
// relative words inline. The next-slot is the booking hook + the content that
// stops the card reading empty.
const SLOT_TODAY: Record<string, string> = { de: "heute", en: "today", fr: "auj.", it: "oggi" };
const SLOT_TOMORROW: Record<string, string> = { de: "morgen", en: "tomorrow", fr: "demain", it: "domani" };
const SLOT_WEEKDAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
function nextSlotLabel(services: Salon["services"], locale: string): string | null {
  if (!services?.length) return null;
  const now = Date.now();
  let earliest: Date | null = null;
  for (const svc of services) {
    for (const iso of svc.slots ?? []) {
      const t = new Date(iso);
      if (t.getTime() > now && (!earliest || t < earliest)) earliest = t;
    }
  }
  if (!earliest) return null;
  const hhmm = earliest.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(earliest, today)) return `${SLOT_TODAY[locale] ?? SLOT_TODAY.de} ${hhmm}`;
  if (sameDay(earliest, tomorrow)) return `${SLOT_TOMORROW[locale] ?? SLOT_TOMORROW.de} ${hhmm}`;
  return `${SLOT_WEEKDAYS[earliest.getDay()]}. ${hhmm}`;
}

const SORT_OPTIONS = [
  { value: "rating", label: "Beliebteste" },
  { value: "price", label: "Preis (tief)" },
  { value: "newest", label: "Neueste" },
  { value: "distance", label: "Entfernung" },
] as const;
type SortValue = (typeof SORT_OPTIONS)[number]["value"];

// V3-D384: price-group heading, locale-mapped so no new i18n key is needed.
const PRICE_HEADING: Record<string, string> = { de: "Preis", en: "Price", fr: "Prix", it: "Prezzo" };

// ─────────────────────────────────────────────────────────────────────────────
// SalonCardSkeleton — matches V3 SalonCard footprint per LoadingStates.md
// Pattern 1. Shimmer via existing `.skeleton-shimmer` keyframe in globals.css.
// ─────────────────────────────────────────────────────────────────────────────

function SalonCardSkeleton() {
  return (
    <div className="flex w-full flex-col">
      <div
        className={cn(
          // V3-D350: rounded-card to match the Airbnb result card photo radius.
          "aspect-square w-full rounded-card",
          "bg-gradient-to-r from-s-bg-sunken via-white to-s-bg-sunken",
          "skeleton-shimmer",
        )}
        aria-hidden
      />
      <div className="mt-2 flex flex-col gap-1.5">
        <div className="h-3.5 w-3/4 rounded bg-s-bg-sunken skeleton-shimmer" aria-hidden />
        <div className="h-3 w-1/2 rounded bg-s-bg-sunken skeleton-shimmer" aria-hidden />
        <div className="h-3 w-2/5 rounded bg-s-bg-sunken skeleton-shimmer" aria-hidden />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

// V3-D354 (2026-05-28): category-pill row config. The "Alle" pill was removed
// per user "delete Alle entirely - no one clicks it, and the text pill distracts
// among the icon pills". Pills = the 4 SEO categories only, each with the user's
// custom 3D PNG icon (shared with the homepage MobileCategoriesRow,
// /public/icons/categories). Active category floats first (Coiffeur is the
// default on /coiffeur). Set = coiffeur / barbershop / nails / spa (makeup +
// waxing dropped - not offered). Universal-components rule (V3-D205): config map.
// V3-D366: "browse rails" (option D) flag. true = homepage-style curated rails
// ABOVE the results grid on category routes (browse mode only); false = revert to
// the grid-only category page. Single-switch revert.
// V3-D369 (2026-05-29): reverted to FALSE per user ("i acc want to revert n make it
// rather look like ths" — pointing at the clean results grid). Rails component +
// seed script kept dormant for a later re-enable. Flip back to true to restore.
const BROWSE_RAILS = false;

const CATEGORY_PILLS: {
  slug: SalonCategory;
  route: string;
  label: string;
  icon?: LucideIcon; // optional lucide fallback - currently unused, kept for flexibility
  iconSrc?: string; // user's custom PNG under /public
}[] = [
  { slug: "coiffeur", route: "coiffeur", label: "Coiffeur", iconSrc: "/icons/categories/scissors.png" },
  { slug: "barbershop", route: "barbershop", label: "Barber", iconSrc: "/icons/categories/clippers.png" },
  { slug: "nails", route: "nails", label: "Nails", iconSrc: "/icons/categories/nails.png" },
  { slug: "spa", route: "spa", label: "Spa", iconSrc: "/icons/categories/spa.png" },
];

// V3-D354 (2026-05-28): "Fuer dich" = personalized shortcuts to OTHER surfaces,
// NOT a re-run of the filter chips above. Content is now category-aware and
// USER-LOCKED:
//   universal (every category): Treueprogramm, Entdecken, Gruppe
//   coiffeur:   + Haar-Verlauf
//   barbershop: + Walk-in, Express buchen
//   nails:      + Nageldesigner, Deine Designs
//   spa:        universal only
// Universal-components rule (V3-D205): the per-category set is DATA (a lookup map
// keyed by category), NOT an `if category === 'X'` branch - the render stays ONE
// path that composes [universal, ...byCategory[activeCategory]].
// Icons are PLACEHOLDER lucide glyphs until the user's custom 3D icons land.
// `route` present => real Link; `route` omitted => "Bald" (coming soon): per the
// KEY_FEATURES audit, Gruppe / Haar-Verlauf / Walk-in / Express / Nageldesigner /
// Deine Designs are backend-only or planned (no customer route yet), so the tile
// renders as a dimmed preview with a "Bald" badge until its surface ships.
type FuerDichLabelKey =
  | "fuerDich_loyalty"
  | "fuerDich_discover"
  | "fuerDich_group"
  | "fuerDich_hairHistory"
  | "fuerDich_walkin"
  | "fuerDich_nailDesigner";

interface FuerDichTile {
  key: string;
  labelKey: FuerDichLabelKey;
  icon?: LucideIcon; // lucide fallback (used only when no iconSrc)
  iconSrc?: string; // V3-D358: custom 3D PNG under /public (preferred)
  route?: string; // under /{locale}; omitted => coming-soon ("Bald")
}

const FUER_DICH_UNIVERSAL: FuerDichTile[] = [
  { key: "loyalty", labelKey: "fuerDich_loyalty", iconSrc: "/icons/fuer-dich/treueprogramm.png", icon: Award, route: "loyalty/stamp" },
  { key: "discover", labelKey: "fuerDich_discover", iconSrc: "/icons/fuer-dich/entdecken.png", icon: Compass, route: "entdecken" },
  { key: "group", labelKey: "fuerDich_group", iconSrc: "/icons/fuer-dich/gruppe.png", icon: Users }, // coming soon (backend only)
];

const FUER_DICH_BY_CATEGORY: Partial<Record<SalonCategory, FuerDichTile[]>> = {
  coiffeur: [
    { key: "hairHistory", labelKey: "fuerDich_hairHistory", iconSrc: "/icons/fuer-dich/haar-verlauf.png", icon: History }, // coming soon
  ],
  barbershop: [
    { key: "walkin", labelKey: "fuerDich_walkin", iconSrc: "/icons/fuer-dich/walkin.png", icon: DoorOpen }, // V3-D359: fuer-dich-normalized copy (82% live area), separate from the homepage category asset
  ],
  nails: [
    { key: "nailDesigner", labelKey: "fuerDich_nailDesigner", iconSrc: "/icons/fuer-dich/nageldesigner.png", icon: Brush },
  ],
  // spa: universal only (no category-specific tiles)
};

// V3-D349 (2026-05-28): per-locale "Karte" / "Liste" labels for the floating
// map pill. Mirrors SalonResultCard's inline locale-map pattern; also mirrored
// in messages/{de,en,fr,it}.json under `ui.searchMapFab` so the strings live in
// the i18n catalogue too. No em-dash / no ß per i18n rules.
const MAP_FAB_LABEL: Record<string, string> = {
  de: "Karte",
  en: "Map",
  fr: "Carte",
  it: "Mappa",
};
const LIST_FAB_LABEL: Record<string, string> = {
  de: "Liste",
  en: "List",
  fr: "Liste",
  it: "Elenco",
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
  // V3-D351 (2026-05-28): all search-chrome + filter-sheet strings via next-intl.
  // Keys live under ui.searchChrome / ui.filterSheet in messages/{de,en,fr,it}.json.
  const tChrome = useTranslations("ui.searchChrome");
  const tFilter = useTranslations("ui.filterSheet");

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
  const minPrice = searchParams.get("min_price") ? Number(searchParams.get("min_price")) : null;
  const maxPrice = searchParams.get("max_price") ? Number(searchParams.get("max_price")) : null;
  // V3-D386: Fresha-style dropdown filter pills, shared by the list chrome + the map
  // sheet. Each opens the full FilterSheet; ink-filled when that filter is active.
  const sortLbl = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? SORT_OPTIONS[0].label;
  const filterPills = [
    { key: "sort", label: sortLbl, active: !!sort && sort !== "rating" },
    { key: "price", label: PRICE_HEADING[locale] ?? PRICE_HEADING.de, active: minPrice != null || maxPrice != null },
    { key: "rating", label: minRating ? `${minRating}+` : tFilter("ratingHeading"), active: minRating != null },
  ];
  // V3-D385: user location for the "Entfernung" (distance) sort, captured via the
  // browser's native permission prompt. Held in STATE — precise geo shouldn't live
  // in a shareable/loggable page URL; it's injected into the API fetch only.
  const [coords, setCoords] = React.useState<{ lat: number; lng: number } | null>(null);
  const mapOpen = searchParams.get("map") === "1";
  // V3-D372 (2026-05-29): the full-width 1-col CARD list ("C") is now the DEFAULT
  // category/search layout - the results-page shape (photo-top, name + ★ + meta +
  // price + next-slot pill). Per user: the 2-col square grid read too "browsey" for
  // a category page. Escape hatches: ?layout=grid = the old 2-col square grid (B);
  // ?layout=list = the photo-left rows used by the desktop map split.
  const listLayout = searchParams.get("layout") === "list";
  const gridLayout = searchParams.get("layout") === "grid";

  // ── Data state ────────────────────────────────────────────────────────────
  const [salons, setSalons] = React.useState<Salon[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = React.useState<Set<string>>(new Set());
  const [mobileView, setMobileView] = React.useState<"list" | "map">("list");
  // V3-D380: mobile map sheet — DRAG the handle to resize (snaps to peek/expanded
  // on release); a plain tap toggles. sheetTopPx = the sheet's viewport top in px
  // (null = the 55% peek default). Pointer events cover touch + mouse.
  const [sheetTopPx, setSheetTopPx] = React.useState<number | null>(null);
  const [sheetDragging, setSheetDragging] = React.useState(false);
  const sheetDragRef = React.useRef<{ startY: number; startTop: number; moved: boolean } | null>(null);
  // V3-D381: THREE snaps — expanded (full list) / peek (half) / collapsed
  // (mostly map + a horizontal swipeable card stub, the Google/Apple-Maps pattern).
  const sheetSnaps = () => {
    const h = typeof window !== "undefined" ? window.innerHeight : 800;
    return { expanded: Math.round(h * 0.16), peek: Math.round(h * 0.55), collapsed: Math.round(h * 0.8) };
  };
  // V3-D381: selectedId correlates the sheet cards with the map pins. A pin tap
  // selects its card; swiping the collapsed card stub selects + recenters the
  // matching pin (MapView already ink-fills selectedId + easeTo-recenters).
  const [mapSelectedId, setMapSelectedId] = React.useState<string | null>(null);
  const onSheetPointerDown = (e: React.PointerEvent) => {
    const { peek } = sheetSnaps();
    sheetDragRef.current = { startY: e.clientY, startTop: sheetTopPx ?? peek, moved: false };
    setSheetDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onSheetPointerMove = (e: React.PointerEvent) => {
    const d = sheetDragRef.current;
    if (!d) return;
    const delta = e.clientY - d.startY;
    if (Math.abs(delta) > 6) d.moved = true;
    const { expanded, collapsed } = sheetSnaps();
    setSheetTopPx(Math.max(expanded - 30, Math.min(collapsed + 40, d.startTop + delta)));
  };
  const onSheetPointerUp = () => {
    const d = sheetDragRef.current;
    if (!d) return;
    const { expanded, peek, collapsed } = sheetSnaps();
    setSheetTopPx((cur) => {
      const c = cur ?? peek;
      if (!d.moved) return c <= (expanded + peek) / 2 ? peek : expanded; // tap = toggle peek/expanded
      // drag = snap to nearest of the three
      return [expanded, peek, collapsed].sort((a, b) => Math.abs(c - a) - Math.abs(c - b))[0];
    });
    sheetDragRef.current = null;
    setSheetDragging(false);
  };
  const [sortOpen, setSortOpen] = React.useState(false);
  const sortBtnRef = React.useRef<HTMLDivElement>(null);
  // V3-D351 (2026-05-28): FilterSheet open state lives here (single source of
  // truth) and is passed to <FilterSheet> as isOpen / onClose. The sheet itself
  // holds NO filter state — every control writes the same URL params the chip
  // row uses.
  const [filterSheetOpen, setFilterSheetOpen] = React.useState(false);
  // V3-D349 (2026-05-28): the floating "Karte" pill is hidden at the top and
  // fades in once the big in-flow search pill scrolls out of view. Observed via
  // IntersectionObserver on the big search pill so the threshold tracks the
  // pill's real height (no magic-number scroll listener). Page scrolls on
  // `window` (not a nested container) — same scroll axis the Header watches.
  const [mapFabVisible, setMapFabVisible] = React.useState(false);
  const bigSearchRef = React.useRef<HTMLAnchorElement | null>(null);

  // V3-D378 (2026-05-30): lock body scroll while the mobile full-screen map is
  // open, so the page (footer etc.) can't scroll behind the fixed map overlay.
  React.useEffect(() => {
    if (mobileView !== "map") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileView]);

  // V3-D376 (2026-05-29): Airbnb-style shrink-search. The search bar is a sticky
  // band that PINS to the top + COLLAPSES (2-line -> 1-line, padding down, city
  // slides inline) on scroll. `scrolled` drives the shrink; hysteresis (on past
  // 60, release under 25) so jitter at the threshold can't thrash the transition.
  // Replaces the old body-search -> header-pill handoff (the "flip" the user flagged).
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    // V3-D377: collapse past 60 / release under 30 - the SAME hysteresis the Header's
    // fold uses (categoryCollapsed), so the search shrink + the header fold fire on the
    // same scroll frame and read as one motion (mock: solen-search-shrink.html).
    const onScroll = () =>
      setScrolled((prev) => (prev ? window.scrollY > 30 : window.scrollY > 60));
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Build the API URL from current params ─────────────────────────────────
  const buildUrl = React.useCallback(
    (pageNum: number, qOverride?: string) => {
      const sp = new URLSearchParams();
      if (activeCategory) sp.set("category", activeCategory);
      if (activeCity) sp.set("city", activeCity);
      if (date) sp.set("date", date);
      if (sort) sp.set("sort", sort);
      if (minRating) sp.set("min_rating", String(minRating));
      // V3-D384 fix: forward the price filter to the API (it was written to the URL
      // but never added here, so the filter silently no-op'd from the UI).
      if (minPrice != null) sp.set("min_price", String(minPrice));
      if (maxPrice != null) sp.set("max_price", String(maxPrice));
      // V3-D385: distance sort needs the user's coords — injected from state (never
      // the page URL). The API maps lat/lng → nearby RPC + true distance ordering.
      if (sort === "distance" && coords) {
        sp.set("lat", String(coords.lat));
        sp.set("lng", String(coords.lng));
      }
      // V3-D357 (2026-05-28): re-enabled `with_slots` - after the V3-D350 minimal
      // pivot the cards read EMPTY (just name/rating/category/price). Services +
      // next-available slots fill them back to a Fresha-grade density (user: "those
      // look so empty"). The API extension was kept dormant exactly for this.
      sp.set("with_slots", "1");
      sp.set("limit", String(PAGE_SIZE));
      sp.set("page", String(pageNum));
      const queryString = qOverride ?? q;
      // /api/salons/search uses ?q=, /api/salons uses params above.
      if (queryString && queryString.length >= 2) {
        return `/api/salons/search?q=${encodeURIComponent(queryString)}`;
      }
      return `/api/salons?${sp.toString()}`;
    },
    [activeCategory, activeCity, date, sort, minRating, minPrice, maxPrice, coords, q],
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

  // ── Reveal the floating Karte pill once the big search scrolls away ─────────
  // IntersectionObserver fires when the big search pill leaves the viewport
  // (with a small negative top margin so the pill is hidden the instant the
  // search clears the sticky toolbar, not only when fully off-screen). The big
  // search is always rendered now (V3-D350 default), so the observer always runs.
  React.useEffect(() => {
    const el = bigSearchRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setMapFabVisible(!entry.isIntersecting),
      { rootMargin: "-72px 0px 0px 0px", threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

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

  // Active-filter count (drives the EmptyState "clear filters" affordance).
  const activeFilterCount =
    (openNow ? 1 : 0) +
    (instantBookable ? 1 : 0) +
    (deals ? 1 : 0) +
    (walkIn ? 1 : 0) +
    (minRating ? 1 : 0) +
    (date ? 1 : 0);

  // ── Map toggle — shared by the big-search map icon + the floating Karte FAB.
  // Desktop = open/close the split panel via the `map` URL param. Mobile =
  // enter/exit full-viewport map view via `mobileView` state. Single source of
  // truth so the FAB reuses the exact existing behavior (no reinvention).
  const handleMapToggle = React.useCallback(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setMobileView((vw) => (vw === "map" ? "list" : "map"));
    } else {
      updateParam("map", mapOpen ? null : "1");
    }
  }, [mapOpen, updateParam]);

  // V3-D382 (#1 load speed): warm the MapView chunk (mapbox-gl is a heavy dynamic
  // import) shortly after the list renders, so the FIRST tap on "Karte" doesn't
  // pay the full chunk-download delay. Fired off-idle so it never blocks the list.
  React.useEffect(() => {
    const t = setTimeout(() => {
      void import("@/components-legacy/MapView");
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  // V3-D385: sort handler. "Entfernung" (distance) needs the user's location — fire
  // the browser's native geo prompt; on grant we stash coords in state + apply the
  // sort, on deny we flag it (and don't switch sort). Other sorts just write the param.
  const handleSortChange = React.useCallback(
    (value: string) => {
      if (value === "distance") {
        if (coords) {
          updateParam("sort", "distance");
          return;
        }
        if (typeof navigator !== "undefined" && "geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
              updateParam("sort", "distance");
            },
            (err) => {
              console.warn("[SearchTemplate] geolocation unavailable:", err?.message);
            },
            { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
          );
        }
        return;
      }
      updateParam("sort", value === "rating" ? null : value);
    },
    [coords, updateParam],
  );

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
      {/* V3-D364: category bar now lives in the global Header's mobile middle slot
          (between logo + hamburger), so it's gone from this in-page chrome. */}
      {/* V3-D351: Uber-style search chrome - search bar, filter
          chips + round filter button, then a "Fuer dich" round-icon row. All
          B&W Layer-1 chrome. STRUCTURE = solen-search-uber-style.html mockup;
          AESTHETIC = LOCKFILE §1 tokens + §2.5 type roles. */}
      {/* B. Search bar - the big-search Link + its trailing MapIcon. Category now
          lives in the header pills, so the stacked summary is simplified: line 1 =
          query or a generic "Suchen" label; line 2 = city. */}
      {/* V3-D376: Airbnb shrink-search. This STICKY BAND is a DIRECT CHILD of the page
          root, so its containing block spans the WHOLE results list - the search stays
          pinned at top:0 for the entire scroll (mock: public/solen-search-shrink.html).
          On scroll it COLLAPSES (line 2 folds, city slides inline next to "Suchen",
          padding + map icon shrink) while the global Header folds away beneath it
          (Header.tsx), so the search takes over the top - ONE element shrinking, no flip.
          Mobile-only pin (max-md:sticky); desktop keeps the search in normal flow (the
          floating Karte FAB is the desktop map affordance). Full-width frosted bg when
          scrolled; the pill is centered + constrained by the inner max-w-[680px] wrapper. */}
      <div
        className={cn(
          "max-md:sticky max-md:top-0 max-md:z-[55] transition-all duration-300 ease-glide",
          scrolled
            ? "pt-2 pb-2 max-md:bg-s-bg-base/95 max-md:shadow-[0_1px_14px_rgba(0,0,0,0.05)] max-md:backdrop-blur-md"
            : "bg-transparent pt-1 pb-0",
        )}
      >
        <div className="mx-auto w-full max-w-[680px] px-4">
          <Link
            ref={bigSearchRef}
            href={`/${locale}`}
            aria-label={tChrome("editSearch")}
            className={cn(
              "flex items-center gap-3 rounded-pill border border-s-border bg-white px-3.5",
              "shadow-[0_1px_3px_rgba(50,47,44,0.06),0_1px_2px_rgba(50,47,44,0.04)]",
              "transition-all duration-300 ease-glide hover:shadow-[0_6px_18px_rgba(0,0,0,0.05)]",
              "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
              scrolled ? "py-1.5" : "py-2.5",
            )}
          >
            <Search size={18} strokeWidth={2} className="shrink-0 text-s-ink-2" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-body text-[14px] font-medium text-s-ink">
                {q ? `„${q}"` : tChrome("searchPlaceholder")}
                {/* city slides INLINE when collapsed so the info isn't lost */}
                <span
                  className={cn(
                    "font-normal text-s-ink-2 transition-all duration-300 ease-glide",
                    scrolled ? "ml-1.5 opacity-100" : "inline-block w-0 overflow-hidden opacity-0",
                  )}
                >
                  · {cityName}
                </span>
              </span>
              {/* line 2 collapses on scroll */}
              <span
                className={cn(
                  "block truncate font-body text-[12.5px] text-s-ink-2 overflow-hidden transition-all duration-300 ease-glide",
                  scrolled ? "max-h-0 opacity-0" : "max-h-5 opacity-100",
                )}
              >
                {date ? formatDateLabel(date) : null}
                {date ? <span className="text-s-ink-3"> · </span> : null}
                {cityName}
                {period && (
                  <>
                    <span className="text-s-ink-3"> · </span>
                    {periodLabel(period)}
                  </>
                )}
              </span>
            </span>
            <span
              role="button"
              tabIndex={0}
              aria-label={tChrome("openMap")}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleMapToggle();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  handleMapToggle();
                }
              }}
              className={cn(
                "grid shrink-0 place-items-center rounded-full border border-s-border",
                "text-s-ink transition-all duration-300 ease-glide hover:border-s-ink",
                "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
                scrolled ? "h-8 w-8" : "h-9 w-9",
              )}
            >
              <MapIcon size={16} strokeWidth={2} aria-hidden />
            </span>
          </Link>
        </div>
      </div>

      {/* CHROME row: filter chips + Fuer-dich. The search band moved OUT (above) so it
          can stay pinned over the full results list; this container holds the rest of
          the in-page chrome, centered + constrained (max-w-[680px]). */}
      <div className="mx-auto w-full max-w-[680px] px-4">
        {/* D. Filter chips row + pinned round filter button. Selected chips turn
            ink + show a check AND sort to the LEFT (active group, thin divider,
            then inactive). The round SlidersHorizontal button is pinned right,
            OUTSIDE the scrolling chips, and opens the FilterSheet. */}
        <div className="mt-4 flex items-center gap-2">
          <div
            className="scrollbar-none flex min-w-0 flex-1 items-center gap-2 overflow-x-auto"
            style={{ scrollbarWidth: "none" }}
          >
            {/* V3-D386: dropdown filter pills (match the map sheet). Sort lives in
                the dedicated sort dropdown below, so the row shows Preis + Bewertung. */}
            {filterPills
              .filter((p) => p.key !== "sort")
              .map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setFilterSheetOpen(true)}
                  aria-haspopup="dialog"
                  className={cn(
                    "inline-flex h-9 shrink-0 items-center gap-1 rounded-pill pl-3.5 pr-2.5 font-body text-[13.5px] font-medium leading-none",
                    "transition-[background-color,border-color,color] duration-150 ease-glide",
                    "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
                    p.active
                      ? "border border-s-ink bg-s-ink text-white"
                      : "border border-s-border bg-white text-s-ink hover:border-s-ink",
                  )}
                >
                  {p.label}
                  <ChevronDown size={14} strokeWidth={2} className={p.active ? "opacity-80" : "opacity-50"} aria-hidden />
                </button>
              ))}
            {/* V3-D352 (2026-05-28): filter button is the LAST item INSIDE the
                scroll, so it sits at the very end of the chip row (reached by
                scrolling to the end) rather than pinned to the right edge. */}
            <button
              type="button"
              onClick={() => setFilterSheetOpen(true)}
              aria-haspopup="dialog"
              aria-label={
                activeFilterCount > 0
                  ? tFilter("openWithCount", { count: activeFilterCount })
                  : tFilter("open")
              }
              className={cn(
                "relative grid h-9 w-9 shrink-0 place-items-center rounded-full border border-s-border bg-white",
                "text-s-ink transition-[border-color,transform] duration-150 ease-glide",
                "active:scale-[0.95] active:duration-[80ms] hover:border-s-ink",
                "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
              )}
            >
              <SlidersHorizontal size={16} strokeWidth={2} aria-hidden />
              {activeFilterCount > 0 && (
                <span
                  className={cn(
                    "absolute -right-1 -top-1 grid h-[17px] min-w-[17px] place-items-center rounded-full px-1",
                    "bg-s-ink font-body text-[10px] font-semibold leading-none text-white",
                    "ring-2 ring-white",
                  )}
                  aria-hidden
                >
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* E. "Fuer dich" - shortcuts to OTHER surfaces (gift cards / discover /
            loyalty), NOT a re-run of the filter chips. Round tiles link out; lucide
            placeholder icons until the user's custom icons land. No heading arrow. */}
        <div className="mt-3">
          {/* V3-D362: "Fuer dich" heading removed per user - the icon row stands alone
              (each tile's label carries the meaning). Left-aligned (V3-D361): first tile
              on the x=16 grid line, flush with the filters + results + cards. overflow-x-auto
              = scroll safety on <360px (at 375+ the 3-4 tiles fit with no scroll). */}
          <div
            className="scrollbar-none -mx-4 flex gap-3.5 overflow-x-auto px-4"
            style={{ scrollbarWidth: "none" }}
          >
            {[
              ...FUER_DICH_UNIVERSAL,
              ...(activeCategory ? FUER_DICH_BY_CATEGORY[activeCategory] ?? [] : []),
            ].map((f) => {
              const Icon = f.icon;
              const label = tChrome(f.labelKey);
              // V3-D358: prefer the custom 3D PNG (iconSrc); lucide is the fallback.
              const glyph = f.iconSrc ? (
                <Image
                  src={f.iconSrc}
                  alt=""
                  width={44}
                  height={44}
                  className="h-11 w-11 object-contain"
                  aria-hidden
                />
              ) : Icon ? (
                <Icon size={24} strokeWidth={1.8} aria-hidden />
              ) : null;
              // V3-D359: every tile renders full-color + available (no "Bald"
              // dimming / badge). Tiles with a route are tappable Links; routeless
              // tiles (destinations not wired yet) are plain divs with identical
              // styling so the row reads as one consistent, available set.
              const inner = (
                <>
                  <span className="grid h-[60px] w-[60px] place-items-center rounded-full bg-s-bg-sunken text-s-ink transition-colors duration-150 ease-glide group-hover:bg-s-border">
                    {glyph}
                  </span>
                  <span className="text-center font-body text-[12px] leading-tight text-s-ink-2">
                    {label}
                  </span>
                </>
              );
              if (!f.route) {
                return (
                  <div
                    key={f.key}
                    className="flex w-16 shrink-0 flex-col items-center gap-1.5"
                  >
                    {inner}
                  </div>
                );
              }
              return (
                <Link
                  key={f.key}
                  href={`/${locale}/${f.route}`}
                  className="group flex w-16 shrink-0 flex-col items-center gap-1.5 focus-visible:rounded-card focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2"
                >
                  {inner}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Optional aboveSlot (e.g. CoiffeurAboveGrid) — collapsed details */}
      {aboveSlot && (
        <div className="mx-auto w-full max-w-[1280px] px-3 pt-4 md:px-6">
          {aboveSlot}
        </div>
      )}

      {/* V3-D366: browse rails (option D) — homepage-style curated rails ABOVE the
          full grid, ONLY on a category route in browse mode (no query + no active
          filter). Reuses the homepage SalonCard. Revert: set BROWSE_RAILS = false. */}
      {BROWSE_RAILS && activeCategory && activeFilterCount === 0 && q.length === 0 && (
        <CategoryBrowseRails salons={salons} locale={locale} category={activeCategory} />
      )}

      {/* Result count row — count LEFT, sort dropdown RIGHT (Airbnb/Fresha
          pattern). V3-D350: sort moved here from the (removed) chip strip so the
          Uber icon row stays clean; sorting still fully works via the dropdown. */}
      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-3 px-4 pt-5 md:px-6">
        {loading ? (
          <div
            className="h-4 w-44 rounded bg-s-bg-sunken skeleton-shimmer"
            aria-hidden
          />
        ) : error ? (
          <span />
        ) : total > 0 ? (
          <p className="font-display text-[16px] font-semibold tracking-[-0.01em] text-s-ink">
            {total} {pluralSalons(total)}
            {activeCity ? <> in {cityName}</> : null}
          </p>
        ) : (
          <span />
        )}
        {!loading && !error && total > 0 && (
          <div ref={sortBtnRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setSortOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={sortOpen}
              aria-label={`Sortierung: ${sortLabel}`}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5",
                "font-body text-[13px] font-medium leading-none",
                "transition-[border-color,transform] duration-150 ease-glide",
                "active:scale-[0.97] active:duration-[80ms]",
                "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
                "min-h-[36px]",
                sort !== "rating"
                  ? "border-s-ink bg-s-ink text-white hover:bg-black"
                  : "border-s-border bg-white text-s-ink hover:border-s-ink",
              )}
            >
              <span>{sortLabel}</span>
              <ChevronDown size={13} strokeWidth={2.25} aria-hidden />
            </button>
            {sortOpen && (
              <div
                className={cn(
                  "absolute right-0 top-full z-50 mt-1.5 w-[200px] rounded-card",
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
                "grid grid-cols-2 gap-x-3 gap-y-4 md:gap-x-5 md:gap-y-6",
                mapOpen ? "lg:grid-cols-2" : "md:grid-cols-3 lg:grid-cols-4",
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
              {/* V3-D350: 2-column grid of clean Airbnb cards (SalonResultCard).
                  Mobile = 2 cols per the approved mockup; scales to 3/4 on
                  larger screens (and stays 2 when the desktop map split is open). */}
              <div
                className={cn(
                  "salon-card-stagger",
                  listLayout
                    ? cn(
                        // V3-D355: list rows stack vertically. Map closed on desktop:
                        // cap the width so rows do not sprawl across a wide screen.
                        "flex flex-col gap-3.5",
                        !mapOpen && "md:mx-auto md:max-w-[780px]",
                      )
                    : gridLayout
                      ? cn(
                          // ?layout=grid escape hatch: the old 2-col square grid (B).
                          "grid grid-cols-2 gap-x-3 gap-y-4 md:gap-x-5 md:gap-y-6",
                          mapOpen ? "lg:grid-cols-2" : "md:grid-cols-3 lg:grid-cols-4",
                        )
                      : cn(
                          // DEFAULT (V3-D372): full-width landscape cards - 1-col on
                          // mobile (photo-led), 2-3 col on desktop (2 when map open).
                          "grid grid-cols-1 gap-x-4 gap-y-7 md:grid-cols-2",
                          mapOpen ? "lg:grid-cols-2" : "lg:grid-cols-3",
                        ),
                )}
              >
                {salons.map((s) => (
                  <SalonResultCard
                    key={s.id}
                    variant={listLayout ? "list" : gridLayout ? "grid" : "card"}
                    slug={s.slug}
                    name={s.name}
                    locale={locale}
                    rating={s.average_rating}
                    photoUrl={s.cover_photo_url ?? undefined}
                    // V3-D370: on a category route the category is implied by the
                    // whole page, so drop it from the card meta (it read "Coiffeur ·
                    // Grossbasel" on every card). Keep it on /search (activeCategory
                    // null) where results mix categories and the label is useful.
                    category={activeCategory ? undefined : safeCategory(s.categories)}
                    city={
                      // V3-D374 (user: "just put in address"): location line = the
                      // street address ("Spalenvorstadt 22, Basel"). Falls back to the
                      // quartier / active city only when a salon has no address.
                      s.address ||
                      (s.quartier
                        ? s.quartier.charAt(0).toUpperCase() + s.quartier.slice(1)
                        : undefined) ||
                      (activeCity ? getCityName(activeCity, locale) : undefined)
                    }
                    distanceMeters={s.distance_meters ?? null}
                    priceFromCHF={s.avg_price ?? null}
                    // V3-D373 (Fresha-match): review count -> its own "category · N
                    // reviews" line; location is "area, town" (built in city= above).
                    reviewCount={s.review_count ?? null}
                    nextSlot={nextSlotLabel(s.services, locale)}
                    services={s.services}
                    isSaved={favoriteIds.has(s.id)}
                    salonId={s.id}
                  />
                ))}
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

      {/* Mobile full-viewport map mode — pannable map + a bottom sheet holding the
          result cards (V3-D378). Replaces the old bare full-screen swap: the map
          fills below the header, the sheet overlays the lower ~half with the count
          + vertical cards (scroll inside the sheet). Body scroll is locked above. */}
      {mobileView === "map" && !loading && !error && salons.length > 0 && (() => {
        // V3-D381: three-snap map sheet. peek/expanded → vertical list + filter
        // pills; collapsed → mostly map + a horizontal swipeable card stub whose
        // centered card selects + recenters the matching pin (Google/Apple-Maps pattern).
        const snaps = sheetSnaps();
        const curTop = sheetTopPx ?? snaps.peek;
        const cardProps = (s: (typeof salons)[number]) => ({
          slug: s.slug,
          name: s.name,
          locale,
          rating: s.average_rating,
          photoUrl: s.cover_photo_url ?? undefined,
          category: activeCategory ? undefined : safeCategory(s.categories),
          city:
            s.address ||
            (s.quartier ? s.quartier.charAt(0).toUpperCase() + s.quartier.slice(1) : undefined) ||
            (activeCity ? getCityName(activeCity, locale) : undefined),
          distanceMeters: s.distance_meters ?? null,
          priceFromCHF: s.avg_price ?? null,
          reviewCount: s.review_count ?? null,
          nextSlot: nextSlotLabel(s.services, locale),
          services: s.services,
          isSaved: favoriteIds.has(s.id),
          salonId: s.id,
        });
        const mapOverlay = (
          <div className="fixed inset-0 z-[60] bg-s-bg-base md:hidden">
            {/* V3-D382: FULL-BLEED map — the overlay covers the global header, so
                the map runs edge-to-edge and the search floats on top of it. */}
            <div className="absolute inset-0">
              <MapView
                salons={salons as never}
                selectedId={mapSelectedId ?? undefined}
                onSelect={(id) => setMapSelectedId(id)}
                enhanced
              />
            </div>
            {/* V3-D382: floating top bar over the map — back button + search pill
                ONLY (no logo / category chips / hamburger). The full-screen overlay
                covers the global header, so this IS the entire map-view chrome. */}
            <div className="absolute inset-x-0 top-0 z-20 flex items-center gap-2.5 px-4 pt-3">
              <button
                type="button"
                onClick={() => setMobileView("list")}
                aria-label="Zurück zur Liste"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-s-border bg-white text-s-ink shadow-[0_1px_2px_rgba(10,10,10,0.10),0_4px_12px_rgba(10,10,10,0.08)] transition-transform active:scale-95"
              >
                <ChevronLeft size={20} strokeWidth={2} aria-hidden />
              </button>
              <Link
                href={`/${locale}`}
                aria-label={tChrome("editSearch")}
                className="flex min-w-0 flex-1 items-center gap-2.5 rounded-pill border border-s-border bg-white px-4 py-3 shadow-[0_1px_2px_rgba(10,10,10,0.10),0_4px_12px_rgba(10,10,10,0.08)]"
              >
                <Search size={17} strokeWidth={2} className="shrink-0 text-s-ink-2" />
                <span className="min-w-0 flex-1 truncate font-body text-[14px] font-medium text-s-ink">
                  {q ? `„${q}"` : tChrome("searchPlaceholder")}
                  <span className="ml-1.5 font-normal text-s-ink-2">· {cityName}</span>
                </span>
              </Link>
            </div>
            {/* bottom sheet — DRAG the handle: snaps expanded / peek / collapsed.
                `fixed` so the px drag-top works; z-[31] keeps it above the map. */}
            <div
              className={cn(
                "fixed inset-x-0 bottom-0 z-[31] flex flex-col rounded-t-[20px] border-t border-s-border bg-white shadow-[0_-10px_30px_rgba(10,10,10,0.16)]",
                !sheetDragging && "transition-[top] duration-300 ease-glide",
              )}
              style={{ top: `${curTop}px` }}
            >
              {/* V3-D386: bigger grab area so the handle is easy to drag. */}
              <div
                onPointerDown={onSheetPointerDown}
                onPointerMove={onSheetPointerMove}
                onPointerUp={onSheetPointerUp}
                className="flex shrink-0 cursor-grab touch-none items-center justify-center pb-2 pt-5 active:cursor-grabbing"
                role="button"
                aria-label="Liste ziehen"
              >
                <span className="h-1.5 w-11 rounded-full bg-s-ink/25" aria-hidden />
              </div>

              {/* V3-D386: no collapsed swiper — the sheet just lowers over the map
                  (Fresha). Always the dropdown filter pills + count + vertical list. */}
              <div
                className="scrollbar-none flex shrink-0 items-center gap-2 overflow-x-auto px-4 pb-2.5 pt-1"
                style={{ scrollbarWidth: "none" }}
              >
                {filterPills.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setFilterSheetOpen(true)}
                    aria-haspopup="dialog"
                    className={cn(
                      "inline-flex h-9 shrink-0 items-center gap-1 rounded-pill pl-3.5 pr-2.5 font-body text-[13.5px] font-medium leading-none transition-colors",
                      p.active
                        ? "border border-s-ink bg-s-ink text-white"
                        : "border border-s-border bg-white text-s-ink hover:border-s-ink",
                    )}
                  >
                    {p.label}
                    <ChevronDown size={14} strokeWidth={2} className={p.active ? "opacity-80" : "opacity-50"} aria-hidden />
                  </button>
                ))}
              </div>
              <div className="shrink-0 px-4 pb-1 pt-1 font-body text-[12.5px] text-s-ink-2">
                <span className="font-semibold text-s-ink">{salons.length}</span> Salons in diesem Bereich
              </div>
              <div className="flex-1 space-y-6 overflow-y-auto px-4 pb-8 pt-1">
                {salons.map((s) => (
                  <SalonResultCard key={s.id} variant="card" {...cardProps(s)} />
                ))}
              </div>
            </div>
          </div>
        );
        // V3-D382: portal to <body> so the overlay escapes the trapped stacking
        // context and covers the global header (z-50). createPortal keeps the React
        // tree intact — refs / state / handlers all keep working.
        return typeof document !== "undefined" ? createPortal(mapOverlay, document.body) : mapOverlay;
      })()}

      {/* belowSlot — per-category SEO content (FAQ / About / etc.) */}
      {belowSlot && (
        <div className="mx-auto w-full max-w-[1280px] px-3 pb-16 md:px-6">
          {belowSlot}
        </div>
      )}

      {/* Floating "Karte" pill — bottom-center, ink fill, scroll-revealed once
          the big search clears the viewport (mapFabVisible). It is the SOLE map
          affordance (the sticky map button was removed), so it never co-exists
          with the big search's map icon. Fires the shared handleMapToggle;
          label flips to "Liste" while the map is open. V3-D350: now always
          rendered (default UI — no flag). */}
      <button
        type="button"
        onClick={handleMapToggle}
        aria-pressed={mapOpen || mobileView === "map"}
        aria-label={
          mapOpen || mobileView === "map"
            ? LIST_FAB_LABEL[locale] ?? LIST_FAB_LABEL.de
            : MAP_FAB_LABEL[locale] ?? MAP_FAB_LABEL.de
        }
        className={cn(
          "fixed bottom-5 left-1/2 z-30 -translate-x-1/2",
          "inline-flex items-center gap-2 rounded-pill bg-s-ink px-[18px] py-[11px]",
          "font-body text-[13.5px] font-medium text-white",
          "shadow-[0_6px_20px_rgba(50,47,44,0.18),0_2px_6px_rgba(50,47,44,0.10)]",
          "transition-[opacity,transform] duration-200 ease-glide",
          "hover:bg-black active:scale-[0.97] active:duration-[80ms]",
          "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
          mapFabVisible
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "pointer-events-none translate-y-3.5 opacity-0",
        )}
      >
        {mapOpen || mobileView === "map" ? (
          <ListIcon size={16} strokeWidth={2} aria-hidden />
        ) : (
          <MapIcon size={16} strokeWidth={2} aria-hidden />
        )}
        {mapOpen || mobileView === "map"
          ? LIST_FAB_LABEL[locale] ?? LIST_FAB_LABEL.de
          : MAP_FAB_LABEL[locale] ?? MAP_FAB_LABEL.de}
      </button>

      {/* V3-D351: FilterSheet - opened by the round filter button. Every control
          writes the SAME URL params as the chip row (single source of truth);
          open state owned here, passed as isOpen / onClose. */}
      <FilterSheet
        isOpen={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        resultCount={total}
        sortOptions={SORT_OPTIONS}
        sort={sort}
        onSortChange={handleSortChange}
        minPrice={minPrice}
        maxPrice={maxPrice}
        onPriceChange={(min, max) => {
          const sp = new URLSearchParams(searchParams.toString());
          if (min != null) sp.set("min_price", String(min)); else sp.delete("min_price");
          if (max != null) sp.set("max_price", String(max)); else sp.delete("max_price");
          sp.delete("page");
          router.replace(`${pathname}${sp.toString() ? `?${sp}` : ""}`, { scroll: false });
        }}
        minRating={minRating}
        onMinRatingChange={(value) => updateParam("min_rating", value)}
        onReset={() => {
          // Clear every filter param the sheet/chips write. sort resets to the
          // default (rating) by deleting it.
          const sp = new URLSearchParams(searchParams.toString());
          for (const key of [
            "open_now",
            "instant_bookable",
            "walk_in",
            "deals",
            "min_price",
            "max_price",
            "min_rating",
            "sort",
          ]) {
            sp.delete(key);
          }
          sp.delete("page");
          router.replace(`${pathname}${sp.toString() ? `?${sp}` : ""}`, {
            scroll: false,
          });
        }}
        labels={{
          title: tFilter("title"),
          reset: tFilter("reset"),
          close: tFilter("close"),
          sortHeading: tFilter("sortHeading"),
          priceHeading: PRICE_HEADING[locale] ?? PRICE_HEADING.de,
          ratingHeading: tFilter("ratingHeading"),
          rating45: tFilter("rating45"),
          rating40: tFilter("rating40"),
          ratingAny: tFilter("ratingAny"),
          apply: (count: number) => tFilter("apply", { count }),
        }}
      />
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
