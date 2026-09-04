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
import { motion, AnimatePresence, useReducedMotion, useMotionValue, useTransform } from "motion/react"; // mockup-ok: owner-approved /dev/map-motion (2026-07-02); B6 continuous scroll-morph fix (2026-07-03)
import { useTranslations } from "next-intl";
import { toast } from "@/app/[locale]/_components/primitives/Toast";
import { useCookieConsent } from "@/app/[locale]/_components/primitives/CookieConsent";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  ChevronDown,
  X,
  Map as MapIcon,
  List as ListIcon,
  Search,
  Menu,
  // V3-D388: amenity facet icons — same lucide set SalonAdditionalInfo uses on
  // the PDP, so the filter sheet and the salon page read as one icon language.
  Accessibility,
  Bus,
  Baby,
  Dog,
  Wifi,
  Heart,
  Star,
  Home,
  GraduationCap,
  AlertCircle,
  Loader2,
  SearchX,
  Globe,
  ChevronRight,
  MapPinOff,
  CalendarOff,
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
import { createPortal, flushSync } from "react-dom";
import { cn } from "@/lib/utils";
import { SalonResultCard } from "./SalonResultCard";
import { MapSalonDetail } from "./MapSalonDetail";
import { CategoryBrowseRails } from "./CategoryBrowseRails";
import { CategoryMobileRails } from "./CategoryMobileRails";
import type { SalonCategory } from "@/lib/types";
import { AMENITIES_SELF_REPORTED } from "../salon/_shared";
import { getCityName, getCityCoords, slugFromCity, DEFAULT_CITY_SLUG, ALL_CITIES_PARAM, type CitySlug } from "@/lib/cities";
import { formatDateLabel, nextAvailableSlotLabel } from "@/lib/format";
import { useActiveCities } from "@/hooks/useActiveCities";
import { useScrollRestoration } from "@/lib/hooks/useScrollRestoration";
import CategoryPillRow from "@/app/[locale]/_components/layout/CategoryPillRow";
import { nameForLocale } from "@/lib/min-price-service";

type LucideIcon = React.ComponentType<{ size?: number; strokeWidth?: number }>;

// Shared search-bar ease (owner-approved /dev/map-motion, 2026-07-02) , drives the mobile
// map sheet's top-position tween + the list<->salon body morph below. mockup-ok.
const EASE = [0.32, 0.72, 0, 1] as const;

// Lazy Mapbox, never blocks SSR, bundle only ships on toggle.
const MapView = dynamic(() => import("@/components-legacy/MapView"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full animate-pulse rounded-[14px] bg-s-bg-sunken" />
  ),
});

// B4 load audit (2026-07-04, finding #3): both are interaction-gated overlays
// (open on tap, state-gated already), same dynamic() pattern as MapView above.
const FilterSheet = dynamic(() => import("./FilterSheet").then((m) => m.FilterSheet), { ssr: false });
const SearchOverlay = dynamic(() => import("./SearchOverlay").then((m) => m.SearchOverlay), { ssr: false });

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
  /** V3-D454 (2026-07-06): whether the Angebote (deals) and Fuer-wen (gender)
   *  filter surfaces have live data to discriminate on right now. Resolved
   *  server-side via `getFilterAvailability()` (lib/search/filter-availability.ts)
   *  and passed down from every SearchTemplate mount. Defaults to `{ deals: true,
   *  gender: true }` (both shown) so a mount that omits this prop keeps the prior
   *  behavior instead of silently hiding a filter. */
  filterAvailability?: { deals: boolean; gender: boolean };
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
  // V3-D452: real gallery photo count for the mobile "feed" card's carousel dots
  // (2026-07-02, /dev/results-full + /dev/results-browse). Never fabricated: dots
  // render only when this is > 1.
  gallery_urls?: string[] | null;
  address?: string;
  city?: string;
  // Real column (lib/salons/public-columns.ts SALON_PUBLIC_COLS), already returned by
  // /api/salons; only the local type was missing it. Feeds CategoryMobileRails' "<postcode>
  // <city>" Row 3 (owner 2026-08-01 mobile-rails ask).
  postal_code?: string | null;
  categories?: string[];
  last_minute_discount_percent?: number | null;
  avg_price?: number | null;
  // /api/salons has always returned min_price beside avg_price; only the type was
  // missing it, which is why the cards reached for the average. Its service name came
  // with it on 2026-07-27 so a from-price can name the offer it buys (PBV Art. 13).
  min_price?: number | null;
  min_price_service_de?: string | null;
  min_price_service_en?: string | null;
  // fr/it added 2026-08-16. They were absent because a comment in the API route asserted the
  // services table had no French or Italian names. Measured against the live database that day:
  // all 264 service rows carry all four.
  min_price_service_fr?: string | null;
  min_price_service_it?: string | null;
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
  // R4-3 (2026-07-03): deduped ACTIVE-staff specialties (from /api/salons ?with_slots=1
  // staff_members embed, proven live 2026-07-03). Used to build the on-photo
  // specialization match-chip for a free-text query. Empty/absent when not requested.
  staff_specialties?: string[] | null;
  // Ring 2b: already in SALON_PUBLIC_COLS (lib/salons/public-columns.ts). Gates the
  // walk-in availability fetch below so it only fires when the just-returned page
  // payload actually contains a walk-in salon, not just on the walk_in URL toggle.
  walkin_enabled?: boolean | null;
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
// ("heute 15:30" / "morgen 09:00" / "Mi. 14:00"). Uses the shared Zurich-aware
// nextAvailableSlotLabel (lib/format.ts) instead of a local implementation that
// called toLocaleTimeString without a timeZone (browser-TZ bug, mislabels near
// midnight for a non-Zurich runtime). Same output wording, also used by
// CategoryBrowseRails.
const nextSlotLabel = nextAvailableSlotLabel;

// R4-3 (2026-07-03, owner-approved /dev/spec-chip): resolve the on-photo
// specialization chip for a salon when the user typed a free-text query. Matches the
// lowercased query against this salon's REAL service names (name_de/name_en) and its
// active-staff specialties (staff_specialties, from the proven /api/salons embed). On
// a match, returns the localized "{term} specialist" label built from the MATCHED REAL
// term (service name or specialty, truncated ~24 chars). NEVER fabricated: no query or
// no match -> null (the card shows no chip). The translator is the `searchUi` `t`.
function matchChipLabel(salon: Salon, query: string, t: Translator): string | null {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return null;
  // Candidate REAL terms in match priority: staff specialties first (they read as
  // "specialist for X"), then service names. Only terms that CONTAIN the query match.
  const serviceTerms = (salon.services ?? []).flatMap((s) =>
    [s.name_de, s.name_en].filter((v): v is string => !!v),
  );
  const specialtyTerms = salon.staff_specialties ?? [];
  const candidates = [...specialtyTerms, ...serviceTerms];
  const hit = candidates.find((term) => term.toLowerCase().includes(q));
  if (!hit) return null;
  // Truncate the matched term to ~24 chars so the chip never overruns the photo.
  const term = hit.length > 24 ? `${hit.slice(0, 23).trimEnd()}…` : hit;
  return t("matchChipTerm", { term });
}

// V3-D451: sort option VALUES (stable URL params). Labels are resolved per-locale
// inside the component via the `searchUi` namespace (sortRating / sortPrice / …).
const SORT_VALUES = ["rating", "price", "newest", "distance"] as const;
type SortValue = (typeof SORT_VALUES)[number];

// V3-D387: amenity facets (Fresha "Ausstattung") — each maps to a salons boolean
// column. Labels resolved per-locale via the `searchUi` namespace (keyed by `col`).
const AMENITY_OPTIONS: { col: string; icon: LucideIcon }[] = [
  { col: "wheelchair_accessible", icon: Accessibility },
  { col: "near_public_transport", icon: Bus },
  { col: "kid_friendly", icon: Baby },
  { col: "pet_friendly", icon: Dog },
  { col: "wifi_friendly", icon: Wifi },
  { col: "lgbtq_friendly", icon: Heart },
  { col: "woman_owned", icon: Star },
  { col: "family_owned", icon: Home },
  { col: "student_discount", icon: GraduationCap },
];
const AMENITY_COLS = AMENITY_OPTIONS.map((a) => a.col);

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

// Filter pills that toggle a boolean param inline (no dropdown sheet). Every other
// pill opens a FilterSheet section. open_now joins deals here now that /api/salons
// filters it server-side.
const TOGGLE_PILLS = new Set(["deals", "open_now", "walk_in"]);

// Exported (A2/Model B, 2026-07-04): SearchOverlay's new in-composer category pill row
// reuses this SAME list, not a second one (owner contract: reuse canonical data).
export const CATEGORY_PILLS: {
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
  { key: "discover", labelKey: "fuerDich_discover", iconSrc: "/icons/fuer-dich/entdecken.png", icon: Compass, route: "inspo" },
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

// V3-D451: a minimal translator shape so these module-level helpers can take the
// next-intl `t` from the `searchUi` namespace without depending on its generated key union.
type Translator = (key: string, values?: Record<string, string | number>) => string;

// V3-D451: period-of-day label resolved via the passed-in `searchUi` translator.
// Keys: periodMorning / periodNoon / periodAfternoon / periodEvening.
function periodLabel(p: string, t: Translator): string {
  const keyByPeriod: Record<string, string> = {
    morning: "periodMorning",
    noon: "periodNoon",
    afternoon: "periodAfternoon",
    evening: "periodEvening",
  };
  const key = keyByPeriod[p];
  return key ? t(key) : p;
}

// V3-D451: singular/plural "Salon(s)" via the passed-in `searchUi` translator.
function pluralSalons(n: number, t: Translator): string {
  return n === 1 ? t("salonOne") : t("salonOther");
}

// ─────────────────────────────────────────────────────────────────────────────
// Main template
// ─────────────────────────────────────────────────────────────────────────────

export default function SearchTemplate({
  locale,
  serviceFilter = null,
  cityFilter = null,
  filterAvailability = { deals: true, gender: true },
  breadcrumb,
  hero = null,
  aboveSlot = null,
  belowSlot = null,
}: SearchTemplateProps) {
  const searchParams = useSearchParams() ?? new URLSearchParams();
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  // 2026-07-04 city-rollout refactor: DB `cities WHERE is_active` is now the source of
  // truth for city name/coords resolution (was the static CITIES fallback, which only
  // covered basel/zuerich/bern , a newly-enabled city like Luzern resolved to nothing).
  const { cities: activeCities } = useActiveCities();
  // Owner-approved /dev/map-motion (2026-07-02): sheet-top tween + list<->salon morph both
  // collapse to duration 0 when the user prefers reduced motion. mockup-ok.
  const reduce = useReducedMotion();
  // V3-D351 (2026-05-28): all search-chrome + filter-sheet strings via next-intl.
  // Keys live under ui.searchChrome / ui.filterSheet in messages/{de,en,fr,it}.json.
  const tChrome = useTranslations("ui.searchChrome");
  const tFilter = useTranslations("ui.filterSheet");
  const tToast = useTranslations("toasts");
  // 2026-08-01: search pill's trailing button now opens the global MobileMenu instead of the
  // map (see the button below). Reuses Header.tsx's own openMenu/closeMenu copy (salonDetail
  // namespace) rather than inventing a new key for the identical action.
  const tSD = useTranslations("salonDetail");
  // V3-D451: previously-hardcoded German chrome strings (sort labels, filter pills,
  // amenity facets, section titles, counts, empty/error states, map-sheet copy) now
  // resolve via next-intl. Keys live under the `searchUi` namespace.
  const t = useTranslations("searchUi");
  // V3-D451: loosely-typed view of the same translator, for the module-level helpers
  // (periodLabel / pluralSalons) whose param can't depend on the generated key union.
  const tx = t as unknown as Translator;

  // ── Read URL params (V3 SearchBar + legacy compat) ──────────────────────
  const q = (searchParams.get("q") ?? "").trim();
  // Service: prop wins, then URL `service`/`category`.
  const urlService = searchParams.get("service") ?? searchParams.get("category");
  const activeCategory: SalonCategory | null =
    serviceFilter ??
    (urlService && (V3_CATS as readonly string[]).includes(urlService.toLowerCase())
      ? (urlService.toLowerCase() as SalonCategory)
      : null);
  // City: prop wins, then URL, then a DEFAULT on the generic /search surface so the bar/map show a
  // real city instead of "Schweizweit" (owner 2026-07-01). Scoped to the generic search (no
  // serviceFilter/cityFilter route) so category landings (/coiffeur) stay countrywide for SEO.
  // `?city=all` is the explicit-countrywide sentinel (Keine Präferenz / search everywhere).
  const urlCity = searchParams.get("city");
  const explicitCountrywide = urlCity === ALL_CITIES_PARAM;
  const activeCity: CitySlug | null =
    cityFilter ??
    (urlCity ? slugFromCity(urlCity, activeCities) : null) ??
    (!serviceFilter && !cityFilter && !explicitCountrywide ? DEFAULT_CITY_SLUG : null);
  const date = searchParams.get("date");
  const period = searchParams.get("period");
  const sortParam = searchParams.get("sort") ?? "rating";
  const sort: SortValue = ((SORT_VALUES as readonly string[]).includes(sortParam)
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
  // V3-D387: Service type (gender) + amenity facets from the URL. amenityKey is a
  // STABLE string (not a fresh array) so it can sit in buildUrl's deps without looping.
  const gender = searchParams.get("gender");
  const amenityKey = AMENITY_COLS.filter((c) => searchParams.get(c) === "true").join(",");
  const activeAmenities = amenityKey ? amenityKey.split(",") : [];
  // V3-D390: per-category filter pills — each opens a FOCUSED sheet for just that
  // one filter (Fresha model: Amenities / Service type / Price each = own sheet).
  // The label reflects the current selection when that filter is set.
  // V3-D451: sort options with per-locale labels (searchUi namespace). `value` stays
  // the stable URL param; only the label localizes. Drives the FilterSheet, the sort
  // dropdown, and the sort pill/button labels below.
  const SORT_OPTIONS = SORT_VALUES.map((value) => ({ value, label: t(`sort_${value}`) }));
  // V3-D451: amenity facets with per-locale labels (keyed by `col`). `col` is a plain
  // string, so the dynamic key goes through the loosely-typed translator (`tx`).
  const amenityOptions = AMENITY_OPTIONS.map((a) => ({ ...a, label: tx(`amenity_${a.col}`) }));
  const sortLbl = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? SORT_OPTIONS[0].label;
  const pricePillLabel = maxPrice != null ? t("priceUpTo", { amount: maxPrice }) : t("sectionPrice");
  const filterPills = [
    // Walk-in MODE entry (barbershop only — matches the für-dich walk-in tile's
    // category gate). A toggle (TOGGLE_PILLS): flips ?walk_in=true, which turns the
    // result cards into their live-queue form. First in the row so it reads as a mode.
    ...(activeCategory === "barbershop" ? [{ key: "walk_in", label: t("pillWalkIn"), active: walkIn }] : []), // drift-ok: walk-in is genuinely barbershop-only (queue feature), not a styling branch
    { key: "sort", label: sort && sort !== "rating" ? sortLbl : t("sectionSort"), active: !!sort && sort !== "rating" },
    { key: "open_now", label: t("pillOpenNow"), active: openNow },
    { key: "price", label: pricePillLabel, active: minPrice != null || maxPrice != null },
    // V3-D454: hidden while no active service can discriminate by gender, UNLESS a
    // stale link already has ?gender= set (the user must still see + be able to clear it).
    ...(filterAvailability.gender || !!gender
      ? [{ key: "gender", label: gender === "female" ? t("genderFemale") : gender === "male" ? t("genderMale") : gender === "non_binary" ? t("genderNonBinary") : t("sectionGender"), active: !!gender }]
      : []),
    { key: "rating", label: minRating ? `${minRating}` : t("sectionRating"), active: minRating != null },
    // AMENITIES_SELF_REPORTED (salon/_shared.ts): the pill is hidden while the underlying
    // salons columns are nulled fabricated data, not a real fact yet.
    ...(AMENITIES_SELF_REPORTED
      ? [{ key: "amenities", label: activeAmenities.length ? t("pillAmenitiesCount", { count: activeAmenities.length }) : t("sectionAmenities"), active: activeAmenities.length > 0 }]
      : []),
    // V3-D454: hidden while 0 listed salons have a real deal, UNLESS a stale link
    // already has ?deals=true set (same active-param exception as gender above).
    ...(filterAvailability.deals || deals
      ? [{ key: "deals", label: t("sectionDeals"), active: deals }]
      : []),
  ];
  // V3-D385: user location for the "Entfernung" (distance) sort, captured via the
  // browser's native permission prompt. Held in STATE — precise geo shouldn't live
  // in a shareable/loggable page URL; it's injected into the API fetch only.
  const [coords, setCoords] = React.useState<{ lat: number; lng: number } | null>(null);
  // `?map=1` is the canonical desktop split-panel param. `?view=map` is an alias
  // the homepage "Karte" tile uses to deep-link straight into the map (2026-06-05)
  // — accept both so the tile opens the desktop map split too.
  const mapOpen = searchParams.get("map") === "1" || searchParams.get("view") === "map";
  // V3-D372 (2026-05-29): the full-width 1-col CARD list ("C") is now the DEFAULT
  // category/search layout - the results-page shape (photo-top, name + ★ + meta +
  // price + next-slot pill). Per user: the 2-col square grid read too "browsey" for
  // a category page. Escape hatches: ?layout=grid = the old 2-col square grid (B);
  // ?layout=list = the photo-left rows used by the desktop map split.
  const listLayout = searchParams.get("layout") === "list";
  const gridLayout = searchParams.get("layout") === "grid";

  // ── Data state ────────────────────────────────────────────────────────────
  const [salons, setSalons] = React.useState<Salon[]>([]);
  // "Search this area": set when the user taps MapView's "In diesem Bereich suchen"
  // button after panning/zooming. Overrides the city filter in buildUrl below and
  // is reset to null whenever the underlying search changes (see the reset effect
  // near the main fetch), so a fresh search never inherits a stale viewport box.
  const [areaBounds, setAreaBounds] = React.useState<{ north: number; south: number; east: number; west: number } | null>(null);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = React.useState<Set<string>>(new Set());
  // Walk-in live availability per salon — only fetched when the walk_in filter is on.
  const [walkinAvail, setWalkinAvail] = React.useState<Record<string, { waitMinutes: number; waitMinutesMax: number; queueLength: number }>>({});
  const [mobileView, setMobileView] = React.useState<"list" | "map">("list");

  // ia-navigation-05: restore the results' scroll position on back-navigation from a
  // salon PDP, instead of resetting to the top of the list. Covers the default
  // window-scroll list/grid layout; the map bottom-sheet's own inner scroll container
  // is a separate scroll context and is out of scope here.
  useScrollRestoration(!loading && salons.length > 0);
  // V3-D380: mobile map sheet — DRAG the handle to resize (snaps to peek/expanded
  // on release); a plain tap toggles. sheetTopPx = the sheet's viewport top in px
  // (null = the 55% peek default). Pointer events cover touch + mouse.
  const [sheetTopPx, setSheetTopPx] = React.useState<number | null>(null);
  const [sheetDragging, setSheetDragging] = React.useState(false);
  const sheetDragRef = React.useRef<{ startY: number; startTop: number; moved: boolean } | null>(null);
  // V3-D381: THREE snaps: expanded (full list), peek (half), collapsed
  // (mostly map + a horizontal swipeable card stub, the Google/Apple-Maps pattern).
  // V3-D453: SALON mode reuses the same sheet with its OWN two detents (medium,
  // full), per the owner-approved /dev/map-behavior mockup (SALON_DETENTS/SALON_MEDIUM).
  const sheetSnaps = () => {
    const h = typeof window !== "undefined" ? window.innerHeight : 800;
    // SHEET_HEADER_MIN_PX: the sticky header (grab handle + filter pills + count
    // row + hairline, roughly 116px) PLUS the list body's own vertical padding
    // (pt-3 + pb-8, 44px, a floor `overflow-y-auto` cannot shrink below) that the
    // collapsed detent must still contain, ever since V3-D386 dropped the old
    // short "swiper stub" collapsed layout in favor of always showing that
    // header. A raw h*0.8 could land the sheet shorter than that combined floor,
    // an invisible overflow past the viewport bottom (the owner's "empty space
    // that doesn't exist" bug), so `collapsed` is clamped to never leave less
    // room than the header + body padding need.
    const SHEET_HEADER_MIN_PX = 170;
    return {
      expanded: Math.round(h * 0.16),
      peek: Math.round(h * 0.55),
      collapsed: Math.min(Math.round(h * 0.8), h - SHEET_HEADER_MIN_PX),
      salonFull: Math.round(h * 0.12),
      salonMedium: Math.round(h * 0.42),
    };
  };
  // V3-D381: selectedId correlates the sheet cards with the map pins. A pin tap
  // selects its card; swiping the collapsed card stub selects + recenters the
  // matching pin (MapView already ink-fills selectedId + easeTo-recenters).
  // V3-D453: also drives LIST/SALON sheet mode (tap a pin OR a feed card moves to
  // SALON mode at the medium detent; null goes back to LIST at peek).
  const [mapSelectedId, setMapSelectedIdRaw] = React.useState<string | null>(null);
  const setMapSelectedId = React.useCallback((id: string | null) => {
    setMapSelectedIdRaw(id);
    const { peek, salonMedium } = sheetSnaps();
    setSheetTopPx(id ? salonMedium : peek);
  }, []);
  // V3-D453: whether the salon detail is at its FULL (dragged-up) detent, derived
  // from the current sheet top vs the midpoint between salonFull/salonMedium, so a
  // drag mid-flight (sheetDragging) already previews the fuller service list.
  const isSalonFull = (() => {
    if (!mapSelectedId) return false;
    const { salonFull, salonMedium } = sheetSnaps();
    const cur = sheetTopPx ?? salonMedium;
    return cur < (salonFull + salonMedium) / 2;
  })();
  // Shared drag helpers (owner-spec'd gesture refinement, 2026-07-02, mockup-ok:
  // pure interaction logic, no appearance/token change). Used by BOTH the header
  // grab-zone and the content-region handoff below so the clamp/snap math has
  // exactly one implementation.
  const beginSheetDrag = (startY: number) => {
    const { peek, salonMedium } = sheetSnaps();
    sheetDragRef.current = { startY, startTop: sheetTopPx ?? (mapSelectedId ? salonMedium : peek), moved: false };
    setSheetDragging(true);
  };
  const driveSheetDrag = (clientY: number) => {
    const d = sheetDragRef.current;
    if (!d) return;
    const delta = clientY - d.startY;
    if (Math.abs(delta) > 6) d.moved = true;
    const { expanded, collapsed, salonFull } = sheetSnaps();
    const minTop = mapSelectedId ? salonFull - 30 : expanded - 30;
    // Clamp exactly to `collapsed` (no rubber-band past the real detent): dragging
    // further used to require a 40px snap back on release, which read as a sudden
    // jump (owner "suddenly collapses"). The finger now stops where it settles.
    const maxTop = collapsed;
    setSheetTopPx(Math.max(minTop, Math.min(maxTop, d.startTop + delta)));
  };
  const endSheetDrag = () => {
    const d = sheetDragRef.current;
    if (!d) return;
    const { expanded, peek, collapsed, salonFull, salonMedium } = sheetSnaps();
    if (mapSelectedId) {
      // SALON mode: drag up goes to the full detent; drag down past medium goes
      // back to LIST (clears the selection, same result as the "All salons" chip).
      setSheetTopPx((cur) => {
        const c = cur ?? salonMedium;
        if (c > salonMedium + 70) {
          setMapSelectedId(null);
          return peek;
        }
        return [salonFull, salonMedium].sort((a, b) => Math.abs(c - a) - Math.abs(c - b))[0];
      });
    } else {
      setSheetTopPx((cur) => {
        const c = cur ?? peek;
        if (!d.moved) return c <= (expanded + peek) / 2 ? peek : expanded; // tap toggles peek/expanded
        // drag snaps to the nearest of the three
        return [expanded, peek, collapsed].sort((a, b) => Math.abs(c - a) - Math.abs(c - b))[0];
      });
    }
    sheetDragRef.current = null;
    setSheetDragging(false);
  };
  const onSheetPointerDown = (e: React.PointerEvent) => {
    beginSheetDrag(e.clientY);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onSheetPointerMove = (e: React.PointerEvent) => driveSheetDrag(e.clientY);
  const onSheetPointerUp = () => endSheetDrag();

  // Content-region gesture handoff (owner spec, 2026-07-02, mockup-ok: pure
  // interaction logic). The list + salon-detail scroll containers get their own
  // pointer handlers that resolve grab-vs-scroll on the first ~6px of movement:
  //   - at the top of the list, pulling DOWN collapses the sheet
  //   - pulling UP while the sheet can still grow expands the sheet
  //   - otherwise, native overflow-y scroll, untouched
  // This is what makes "scroll up expands the sheet" work without stealing every
  // scroll gesture (a scroll-down-while-not-at-top must stay a plain scroll).
  const contentDragRef = React.useRef<{
    startY: number;
    startScrollTop: number;
    mode: "drag" | "scroll" | null;
  } | null>(null);
  const onContentPointerDown = (e: React.PointerEvent) => {
    const el = e.currentTarget as HTMLElement;
    contentDragRef.current = { startY: e.clientY, startScrollTop: el.scrollTop, mode: null };
  };
  const onContentPointerMove = (e: React.PointerEvent) => {
    const c = contentDragRef.current;
    if (!c) return;
    const el = e.currentTarget as HTMLElement;
    const dy = e.clientY - c.startY;
    if (c.mode === null) {
      if (Math.abs(dy) <= 6) return;
      const { expanded, peek, salonFull, salonMedium } = sheetSnaps();
      const mostExpanded = mapSelectedId ? salonFull : expanded;
      // Same "current top" fallback the header drag uses (peek/salonMedium, NOT
      // the most-expanded detent). sheetTopPx is null until the FIRST drag, so
      // falling back to `mostExpanded` here made the sheet read as already-fully-
      // expanded on a fresh page load, silently disabling scroll-up-expands.
      const cur = sheetTopPx ?? (mapSelectedId ? salonMedium : peek);
      if (c.startScrollTop <= 0 && dy > 0) {
        c.mode = "drag"; // at the top, pulling down collapses the sheet
      } else if (dy < 0 && cur > mostExpanded) {
        c.mode = "drag"; // pulling up while the sheet can still grow expands it
      } else {
        c.mode = "scroll";
      }
      if (c.mode === "drag") {
        beginSheetDrag(c.startY);
        // `touch-action`/`setPointerCapture` are only applied once we've COMMITTED
        // to "drag" (not at pointerdown), so a plain tap on a card's button still
        // dispatches a normal click. Capturing the pointer earlier (before the 6px
        // commit) redirects the browser's synthesized click to the capturing
        // element instead of the tapped button, silently breaking "select a salon"
        // and the heart button, tested + reverted (owner spec: no static capture).
        el.style.touchAction = "none";
        el.setPointerCapture?.(e.pointerId);
      }
    }
    if (c.mode === "drag") {
      e.preventDefault();
      driveSheetDrag(e.clientY);
    }
    // mode "scroll" leaves native overflow-y scrolling alone.
  };
  const onContentPointerUp = (e: React.PointerEvent) => {
    const c = contentDragRef.current;
    if (c?.mode === "drag") {
      endSheetDrag();
      (e.currentTarget as HTMLElement).style.touchAction = "";
    }
    contentDragRef.current = null;
  };
  const [sortOpen, setSortOpen] = React.useState(false);
  const sortBtnRef = React.useRef<HTMLDivElement>(null);
  // V3-D351 (2026-05-28): FilterSheet open state lives here (single source of
  // truth) and is passed to <FilterSheet> as isOpen / onClose. The sheet itself
  // holds NO filter state — every control writes the same URL params the chip
  // row uses.
  const [filterSheetOpen, setFilterSheetOpen] = React.useState(false);
  // V3-D390: which category's FOCUSED sheet is open (null = full "all filters" sheet
  // via the ≡ button). Each pill calls openSection(its key).
  const [filterSection, setFilterSection] = React.useState<string | null>(null);
  const openSection = React.useCallback((section: string | null) => {
    setFilterSection(section);
    setFilterSheetOpen(true);
  }, []);
  // V3-D349 (2026-05-28): the floating "Karte" pill is hidden at the top and
  // fades in once the big in-flow search pill scrolls out of view. Observed via
  // IntersectionObserver on the big search pill so the threshold tracks the
  // pill's real height (no magic-number scroll listener). Page scrolls on
  // `window` (not a nested container) — same scroll axis the Header watches.
  const [mapFabVisible, setMapFabVisible] = React.useState(false);
  const bigSearchRef = React.useRef<HTMLDivElement | null>(null);
  // Map pill visibility gate (2026-09-04 punch-list round 2): the pill portals to
  // document.body at z-float (200), which sits above the cookie banner (z-banner, 180) and
  // above SearchOverlay's raw z 100-102, so it painted over the banner's text and over the
  // overlay's own action row. Reusing bannerVisible from CookieConsentProvider (the single
  // owner of the banner's actual on-screen state) instead of re-deriving it here.
  const { bannerVisible: cookieBannerVisible } = useCookieConsent();
  // V2-D51 Path C: the sticky search bar opens the full-page SearchOverlay
  // (search is full-page everywhere, like Fresha) instead of routing to the
  // homepage. Seeds the active city so the composer continues the context.
  const [searchOverlayOpen, setSearchOverlayOpen] = React.useState(false);
  // Shared input ref + auto-focus flag so the map-view "edit search" bar opens the SAME
  // overlay in place WITH the keyboard (flushSync sync-focus inside the tap = iOS keyboard).
  // The main results bar opens without auto-focus so the applied search stays visible (B).
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [autoFocusSearch, setAutoFocusSearch] = React.useState(false);
  // A7/A8/A9 (2026-08-02 REOPENED): the tapped pill's own rect (bigSearchRef), captured
  // synchronously before the overlay mounts, so it can grow OUT OF the bar instead of
  // sliding up from the bottom of the screen. Absent (compose deep link, no tap) -> the
  // overlay falls back to a plausible near-top rect (SearchOverlay.tsx `origin`).
  const [searchOriginRect, setSearchOriginRect] = React.useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const openSearchOverlay = React.useCallback((withKeyboard: boolean) => {
    const r = bigSearchRef.current?.getBoundingClientRect();
    if (r) setSearchOriginRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    if (withKeyboard) {
      flushSync(() => { setAutoFocusSearch(true); setSearchOverlayOpen(true); });
      searchInputRef.current?.focus({ preventScroll: true });
    } else {
      setAutoFocusSearch(false);
      setSearchOverlayOpen(true);
    }
  }, []);

  // 2026-06-05: the homepage "Karte" tile deep-links here with `?view=map`. On
  // mobile that means "open the full-screen map view" (mobileView state); on
  // desktop the `mapOpen` derivation above already opens the split panel from the
  // same param. Fire once on mount so a later filter change can't re-trigger it.
  // FIX C (2026-08-01, owner repeating "the search bar doesn't work"): arriving here from the
  // home pill used to land on a page whose query input is still inside a CLOSED overlay, so the
  // tap read as dead , you navigate, and nothing pops up. The home pill now appends `?compose=1`
  // to say "this user came here to TYPE", and that opens the overlay WITH the keyboard.
  // This does not change the in-page bar at line ~1251, which still opens without focus on
  // purpose so an already-applied search stays readable behind the overlay.
  // R1 (2026-08-02 round 3, owner: "it must open in place, the URL must not change on tap"):
  // the home pill NO LONGER produces `?compose=1`. It mounts this same overlay and opens it
  // over the home page, so nothing about a search tap is a navigation any more. This receiver
  // stays as a DEEP-LINK entry only (`/de/search?compose=1` opens the composer on arrival);
  // it is no longer on any tap path, which is what made it a page load in the first place.
  const composeApplied = React.useRef(false);
  React.useEffect(() => {
    if (composeApplied.current) return;
    if (searchParams.get("compose") !== "1") return;
    composeApplied.current = true;
    // FIX 2026-08-01 (owner, third repeat, "when you click, it still doesn't fucking open"):
    // calling `openSearchOverlay(true)` (which runs `flushSync`) directly inside THIS effect
    // threw "flushSync was called from inside a lifecycle method. React cannot flush when
    // React is already rendering" in the console on every load, because this effect can fire
    // while React is still mid-flush for the initial mount's OWN passive effects (this page
    // is reached via a client navigation from the home pill, landing inside a Suspense
    // boundary). React's own fix, named in that warning: move the flushSync call to a real
    // scheduler task. `setTimeout(0)` (not a microtask, which can still land inside the same
    // flush) guarantees this runs in a fresh task, after React has fully finished committing,
    // so flushSync is safe and `searchOverlayOpen` actually flips. Confirmed live: without
    // this, `searchOverlayOpen` never became true at all (no scrim, activeElement stayed
    // BODY); the console error was not cosmetic; it meant the whole state update was dropped.
    // CORRECTED 2026-08-02. The setTimeout+flushSync version above worked on a HARD load of
    // /search?compose=1 and silently did nothing on the SOFT navigation from the home pill,
    // which is the only path a real user takes. Measured: direct load opened the overlay
    // (scrim z-100 + panel z-101 present); three consecutive taps from /de left activeElement
    // on BODY with no scrim. The home pill navigates through `next-view-transitions`, whose
    // Link wraps the route change in `document.startViewTransition`, so a flushSync scheduled
    // into that window is dropped along with the state update.
    // Plain state, no flushSync, no scheduler games. Focus is handed to the overlay's own
    // `autoFocusSearch` path, which owns the input and can focus it once it has actually
    // mounted, instead of this component reaching for a ref that does not exist yet.
    // A1 fix (2026-08-02 REOPENED, owner: "when I click the search bar, nothing happens,
    // there's just the line thingy that flashes"): auto-focusing here made the overlay ARRIVE
    // in its end state (input already focused, expand already 1), so the user's own tap on the
    // bar had nothing left to animate. compose=1 now opens the overlay RESTING (pills + heading
    // visible, no keyboard) so the tap itself drives the focus morph. autoFocusService/
    // autoFocusSearch stay wired for any other caller that still wants the old behavior.
    setAutoFocusSearch(false);
    setSearchOverlayOpen(true);
  }, [searchParams]);

  const viewMapApplied = React.useRef(false);
  React.useEffect(() => {
    if (viewMapApplied.current) return;
    // Open the full-screen mobile map for EITHER param the desktop split honors:
    // `?view=map` (homepage Karte tile) and `?map=1` (a search made ON the map).
    // Reading only `view=map` here dumped mobile users back to the LIST after they
    // searched from the map (the owner's "weird transition"). Fire once so a later
    // filter change can't re-trigger it.
    if (!mapOpen) return;
    viewMapApplied.current = true;
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setMobileView("map");
    }
  }, [mapOpen]);

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
  // band that PINS to the top + COLLAPSES (padding down, pill shadow lifts) on
  // scroll. B6 fix (2026-07-03, owner: "make the morphing smooth BOTH directions"):
  // the old boolean `scrolled` state (hysteresis on/off at two fixed thresholds)
  // made the collapse SNAP between two discrete states instead of easing. Replaced
  // with a continuous motionValue (`scrollProgress`, 0..1 over the same 0->60px
  // range the old hysteresis used) updated on every scroll frame, then
  // `useTransform`'d into the padding/shadow values below (same visual end-states,
  // just interpolated in between), so both scroll-down (collapse) and scroll-up
  // (expand) ease continuously with no jump. mockup-ok: mechanics-only fix per
  // owner brief, no new visual, same locked end-state values as before.
  const scrollProgress = useMotionValue(0);
  // The float shadow is a mobile-only affordance (desktop keeps the bar in normal
  // flow, no pin/float), same scope as the old `max-md:!shadow-[...]` class.
  const [isDesktopChrome, setIsDesktopChrome] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktopChrome(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  React.useEffect(() => {
    const onScroll = () => {
      // Reduced motion: land straight on the two end-states (same 30/60 hysteresis
      // math the old boolean used) instead of a continuous ramp, so a
      // prefers-reduced-motion user still gets the correct collapsed/expanded
      // result, just without the eased interpolation between them.
      const p = reduce
        ? window.scrollY > 30 ? 1 : 0
        : Math.min(1, Math.max(0, window.scrollY / 60));
      scrollProgress.set(p);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [scrollProgress, reduce]);
  // mockup-ok: same B6 mechanics fix, values below match the prior locked end-states.
  // Search-bar-one-position fix (owner, 2026-08-27): the bar "moves to other places"
  // between screens because this band's own top padding ranged 4 to 12. 12 is the
  // home bar's resting position (HomeSearchPill.tsx:230-236, "One height, 64, whatever
  // the scroll position") set by commit 7bc5c23ee (2026-08-11). Range collapsed to
  // [12, 12], same precedent as bandPaddingBottom's [8, 8] below: the scrollProgress /
  // useTransform mechanism stays wired, only the end-states change.
  const bandPaddingTop = useTransform(scrollProgress, [0, 1], [12, 12]);
  // I2 mockup-ok (public/_mockups/home-v3/search-a.html .sa-band, "padding 4px 0 8px"):
  // bottom was 0 at rest, approved chrome wants a constant 8. Range collapsed to
  // [8, 8] so the value matches without touching the scrollProgress mechanism itself.
  const bandPaddingBottom = useTransform(scrollProgress, [0, 1], [8, 8]); // mockup-ok
  const pillShadowOpacity = useTransform(scrollProgress, [0, 1], [0, 0.13]);
  const pillBoxShadow = useTransform(
    pillShadowOpacity,
    (o) => `0 10px 30px rgba(0,0,0,${isDesktopChrome ? 0 : o})`,
  );

  // ── Build the API URL from current params ─────────────────────────────────
  const buildUrl = React.useCallback(
    (pageNum: number, qOverride?: string) => {
      const sp = new URLSearchParams();
      if (activeCategory) sp.set("category", activeCategory);
      // "Search this area" bounds override the city filter (a pan may leave the
      // originally-searched city). /api/salons skips its city resolution when
      // north/south/east/west are all present and valid.
      if (areaBounds) {
        sp.set("north", String(areaBounds.north));
        sp.set("south", String(areaBounds.south));
        sp.set("east", String(areaBounds.east));
        sp.set("west", String(areaBounds.west));
      } else if (activeCity) {
        sp.set("city", activeCity);
      }
      if (date) sp.set("date", date);
      if (sort) sp.set("sort", sort);
      if (minRating) sp.set("min_rating", String(minRating));
      // V3-D384 fix: forward the price filter to the API (it was written to the URL
      // but never added here, so the filter silently no-op'd from the UI).
      if (minPrice != null) sp.set("min_price", String(minPrice));
      if (maxPrice != null) sp.set("max_price", String(maxPrice));
      // Walk-in: /api/salons filters by salons.walkin_enabled. Was read + counted
      // as an active filter but never forwarded here — same no-op class as the price
      // bug fixed above.
      if (walkIn) sp.set("walk_in", "true");
      // deals → last_minute_discount_percent > 0; instant_bookable → 48h availability
      // join. Both are supported server-side (app/api/salons/route.ts) but were read +
      // counted as active filters without being forwarded — same silent no-op class.
      if (deals) sp.set("deals", "true");
      if (instantBookable) sp.set("instant_bookable", "true");
      // open_now → /api/salons now resolves currently-open salons server-side (Zurich-tz
      // isOpenNow over opening_hours, IDs constrained before pagination), so forward it
      // like the other booleans.
      if (openNow) sp.set("open_now", "true");
      // V3-D385: distance sort needs the user's coords — injected from state (never
      // the page URL). The API maps lat/lng → nearby RPC + true distance ordering.
      if (sort === "distance" && coords) {
        sp.set("lat", String(coords.lat));
        sp.set("lng", String(coords.lng));
      }
      // V3-D387: service type (gender) + amenity facets.
      if (gender) sp.set("gender", gender);
      if (amenityKey) for (const c of amenityKey.split(",")) sp.set(c, "true");
      // V3-D357 (2026-05-28): re-enabled `with_slots` - after the V3-D350 minimal
      // pivot the cards read EMPTY (just name/rating/category/price). Services +
      // next-available slots fill them back to a Fresha-grade density (user: "those
      // look so empty"). The API extension was kept dormant exactly for this.
      if (period) sp.set("period", period); // V3: time-of-day open-slot filter (now wired to /api/salons)
      sp.set("with_slots", "1");
      sp.set("limit", String(PAGE_SIZE));
      sp.set("page", String(pageNum));
      const queryString = qOverride ?? q;
      // Single endpoint: /api/salons now combines free-text (q → semantic rank) WITH the
      // structured filters (city / date / period / walk-in). The old q-only
      // /api/salons/search ignored every filter, so typed-query + city + date never combined.
      if (queryString && queryString.length >= 2) sp.set("q", queryString);
      return `/api/salons?${sp.toString()}`;
    },
    [activeCategory, activeCity, areaBounds, date, period, sort, minRating, minPrice, maxPrice, walkIn, deals, instantBookable, openNow, gender, amenityKey, coords, q],
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
          setError(t("loadError"));
          setLoading(false);
        }
      });

    return () => ac.abort();
  }, [buildUrl]);

  // "Search this area" bounds are scoped to the CURRENT search. When the underlying
  // search changes (city/category/query/filters via the URL), clear areaBounds so
  // the next fetch falls back to the city again instead of filtering the new search
  // by a stale viewport box. Keyed on the URL search-params string (not areaBounds
  // itself), so setting bounds does NOT immediately wipe itself out.
  const searchParamsKey = searchParams.toString();
  const prevSearchParamsKeyRef = React.useRef(searchParamsKey);
  React.useEffect(() => {
    if (prevSearchParamsKeyRef.current === searchParamsKey) return;
    prevSearchParamsKeyRef.current = searchParamsKey;
    setAreaBounds(null);
  }, [searchParamsKey]);

  // Walk-in live availability: only when the walk_in filter is on AND the
  // just-returned page payload actually contains at least one walk-in salon.
  // One batched /api/walkin/availability call for the loaded salons.
  // Dep is the stable comma-joined ID string (not the salons array reference)
  // so the effect only re-fires when the actual set of IDs changes, not on
  // every render that produces a new array object with the same contents.
  // Ring 2b: the walkin_enabled check is a defensive, direct read of the payload
  // (the walk_in=true server filter already guarantees every returned salon has
  // walkin_enabled=true, so in practice this is a no-op today) rather than
  // trusting the URL toggle as a proxy for what the data actually contains.
  const salonIdsKey =
    walkIn && salons.some((s) => s.walkin_enabled) ? salons.map((s) => s.id).join(",") : "";
  React.useEffect(() => {
    if (!walkIn || !salonIdsKey) {
      setWalkinAvail({});
      return;
    }
    const ac = new AbortController();
    fetch(`/api/walkin/availability?salon_ids=${encodeURIComponent(salonIdsKey)}`, { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setWalkinAvail(data?.availability ?? {}))
      .catch((err) => {
        if (err?.name !== "AbortError") console.error("[SearchTemplate] walk-in availability fetch failed:", err);
      });
    return () => ac.abort();
  }, [walkIn, salonIdsKey]);

  // Favorites prefetch: guard with a ref so the fetch runs at most once per
  // component lifetime. Prevents the React Strict Mode double-invoke from
  // issuing two requests, and avoids re-firing if the component is temporarily
  // unmounted and remounted while higher-level state changes.
  // Individual toggles update favoriteIds optimistically, so the initial
  // fetch only needs to happen once.
  const favoritesFetchedRef = React.useRef(false);
  React.useEffect(() => {
    if (favoritesFetchedRef.current) return;
    favoritesFetchedRef.current = true;
    // ids_only=1: just the saved salon_ids for the heart fill state, no salon
    // join (this mount only needs to know which hearts are saved).
    fetch("/api/profile/favorites?ids_only=1")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const ids = data?.salon_ids ?? [];
        setFavoriteIds(new Set(ids as string[]));
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
      { rootMargin: "-82px 0px 0px 0px", threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // ── Computed ──────────────────────────────────────────────────────────────
  const hasMore = salons.length < total;
  // Resolved against the LIVE active-cities set (activeCities, from /api/cities) so a
  // city outside the static CITIES fallback (e.g. Luzern) still shows its real name.
  const activeCityRow = activeCity ? activeCities.find((c) => c.slug === activeCity) : undefined;
  const cityName = activeCity ? getCityName(activeCity, locale, activeCityRow) : t("countrywide");
  // CategoryMobileRails' "Top <Category>" rail title , reuses the same CATEGORY_PILLS label
  // the filter pills / header pills already render (e.g. "Coiffeur"), not new copy.
  const categoryLabel = CATEGORY_PILLS.find((p) => p.slug === activeCategory)?.label ?? "";
  const sortLabel =
    SORT_OPTIONS.find((s) => s.value === sort)?.label ?? t("sort_rating");
  // V3-D451: title of the FOCUSED filter sheet (the category whose pill opened it).
  // Maps a section key (sort/price/gender/rating/amenities/deals) to its searchUi label.
  const SECTION_TITLE_KEY: Record<string, string> = {
    sort: "sectionSort",
    price: "sectionPrice",
    gender: "sectionGender",
    rating: "sectionRating",
    amenities: "sectionAmenities",
    deals: "sectionDeals",
  };
  const sectionTitle = (key: string) =>
    SECTION_TITLE_KEY[key] ? tx(SECTION_TITLE_KEY[key]) : tFilter("title");

  // Active-filter count (drives the EmptyState "clear filters" affordance).
  const activeFilterCount =
    (openNow ? 1 : 0) +
    (instantBookable ? 1 : 0) +
    (deals ? 1 : 0) +
    (walkIn ? 1 : 0) +
    (minRating ? 1 : 0) +
    (date ? 1 : 0) +
    // V3-D421k (owner + council bug): price / gender / amenities were missing, so the
    // count undercounted (and the left filter/X circle wouldn't flip to X for a sheet-set
    // price or "Für wen"). Count what the chips + sheet actually expose.
    (minPrice != null || maxPrice != null ? 1 : 0) +
    (gender ? 1 : 0) +
    (activeAmenities.length > 0 ? 1 : 0);

  // Cause signals for the no-results EmptyState (which recovery action to surface).
  const hasDateFilter = !!date || !!period;
  const hasOtherFilters =
    openNow || instantBookable || deals || walkIn || !!minRating ||
    minPrice != null || maxPrice != null || !!gender || activeAmenities.length > 0;
  // Navigate keeping the current path, dropping specific query params (for "any date").
  const emptyDropParams = React.useCallback(
    (drop: string[]) => {
      const sp = new URLSearchParams(searchParams.toString());
      drop.forEach((k) => sp.delete(k));
      const qs = sp.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [searchParams, pathname, router],
  );

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
    const wasSaved = favoriteIds.has(salonId);
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (wasSaved) next.delete(salonId); else next.add(salonId);
      return next;
    });
    if (wasSaved) {
      fetch(`/api/profile/favorites?salon_id=${salonId}`, { method: "DELETE" })
        .then((r) => { if (!r.ok) throw new Error(`${r.status}`); })
        .catch((err) => {
          console.error("[SearchTemplate] favorite remove failed:", err);
          setFavoriteIds((p) => new Set(p).add(salonId)); // revert
          toast.error(tToast("saveFailed"), { action: { label: tToast("retry"), onClick: () => toggleFavorite(salonId) } });
        });
    } else {
      fetch("/api/profile/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salon_id: salonId }),
      })
        .then((r) => { if (!r.ok) throw new Error(`${r.status}`); })
        .then(() => {
          toast.success(tToast("savedToFavorites"), {
            icon: Heart,
            iconClassName: "bg-s-love-soft text-[#FF3366]",
            action: { label: tToast("view"), onClick: () => { window.location.href = `/${locale}/profile/favorites`; } },
          });
        })
        .catch((err) => {
          console.error("[SearchTemplate] favorite add failed:", err);
          setFavoriteIds((p) => { const n = new Set(p); n.delete(salonId); return n; }); // revert
          toast.error(tToast("saveFailed"), { action: { label: tToast("retry"), onClick: () => toggleFavorite(salonId) } });
        });
    }
  }, [favoriteIds, locale, tToast]);

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
      <motion.div
        className="max-md:sticky max-md:top-0 max-md:z-[55] bg-transparent"
        // B6: continuous padding morph (replaces the old pt-3/pb-2 <-> pt-1/pb-0 class
        // swap) so the band eases both collapsing AND expanding, not just jumping at
        // the old 30/60px hysteresis thresholds. `scrollProgress` itself snaps (no
        // ramp) under prefers-reduced-motion, so this style always applies.
        style={{ paddingTop: bandPaddingTop, paddingBottom: bandPaddingBottom }}
      >
        <div className="mx-auto w-full max-w-[680px] px-4">
          <motion.div
            ref={bigSearchRef}
            role="button"
            tabIndex={0}
            onClick={() => openSearchOverlay(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openSearchOverlay(false);
              }
            }}
            aria-label={tChrome("editSearch")}
            aria-haspopup="dialog"
            className={cn(
              // mockup-ok: VARIANT C, owner picked it 2026-08-10 off /dev/search-bar with one
              // letter, "c". The home pill (HomeSearchPill.tsx) carries the full note; this is its
              // sibling and moves with it, because the two are the SAME control on two surfaces and
              // changing only the one in front of me is the half-a-sweep failure this project keeps
              // naming. Airbnb measured live at 390: 54 tall, radius 40, centred, 19px padding,
              // 12px icon. C keeps our hairline and lift instead of their black ring.
              // Later decision, commit 7bc5c23ee (2026-08-11): "Search bar 59 to 64 tall on his
              // call. Their proportion gave 59; he asked for more, so it steps to 64 on the same
              // 4pt scale." That supersedes the 54 measured above; the height below is 64.
              "flex h-[64px] w-full cursor-pointer items-center justify-center gap-2 rounded-[40px] border border-s-border bg-white px-[19px] text-center",
              // I2 mockup-ok (public/_mockups/home-v3/search-a.html .sa-pill --lift): the
              // V3-D421L "flat at rest, lift only when pinned" scroll-driven shadow is
              // replaced by the approved chrome's constant elevation, so the pill always
              // carries the same outline + shadow pair (the search bar is "the way in").
              "shadow-elevation-3", // mockup-ok: variant C lift, owner pick 2026-08-10
              "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
              // V3-D421d still holds, "keep the pinned bar the SAME size as normal (no shrink,
              // owner)": the height is now the fixed h-[64px] above (stepped from 54 to 64 per
              // commit 7bc5c23ee, 2026-08-11), which is the same at rest and pinned, so the
              // no-shrink rule is preserved rather than dropped.
            )}
            // I2 mockup-ok: dynamic boxShadow style removed, the shadow-[...] class above
            // now carries the constant approved value. `pillBoxShadow`/`pillShadowOpacity`
            // stay declared (untouched state per the I2 brief) but are no longer consumed here.
          >
            <Search size={12} strokeWidth={2.4} className="shrink-0 text-s-ink" /> {/* mockup-ok: variant C icon, owner pick 2026-08-10 */}
            <span className="min-w-0 flex-1">
              {/* I2 mockup-ok (search-a.html .sa-l1): 14px -> 16px, the approved chrome's
                  first-line size. */}
              <span className="block truncate font-body text-[14px] font-medium text-s-ink"> {/* mockup-ok: variant C label, owner pick 2026-08-10 */}
                {/* A2/Model B (2026-07-04): category + query are independent, so line 1 shows
                    BOTH when both are set, not one clobbering the other. */}
                {[activeCategory ? CATEGORY_PILLS.find((c) => c.slug === activeCategory)?.label : null, q]
                  .filter(Boolean)
                  .join(" ") || tChrome("searchPlaceholder")}
                {/* city slides INLINE when collapsed so the info isn't lost */}
                <span
                  className={cn(
                    "font-normal text-s-ink-2 transition-all duration-300 ease-glide",
                    "inline-block w-0 overflow-hidden opacity-0", // V3-D421d: city stays on line 2 (no inline collapse)
                  )}
                >
                  {" "}{cityName}
                </span>
              </span>
              {/* I2 mockup-ok (search-a.html .sa-l2, "THE SECOND LINE MUST GO"): the
                  date/city subtitle is removed. One line only, per the approved chrome. */}
            </span>
            {/* mockup-ok , THE TRAILING HAMBURGER IS GONE FROM HERE TOO. Owner 2026-08-10:
                "I don't think this hamburger menu should be here because it's really
                inconsistent." He then picked option C off /dev/menu-placement.

                This was the SIBLING of the one in HomeSearchPill.tsx, put here on 2026-08-01
                ("we put the hamburger where the map view is"). Removing only the home one and
                leaving this would have left the same control in the search bar on all four
                category routes, which is the half-a-sweep failure this project keeps naming: the
                instance in front of you gets fixed and its siblings do not.

                Its job moved to BottomNav.tsx, whose fourth item fires the identical
                `solen:open-menu` event, so MobileMenu keeps its one trigger contract. The desktop
                map-toggle sibling below is untouched.

                The `md:hidden` split this block introduced still earns its keep: without it the
                desktop map icon would have been swapped too. */}
            {/* Desktop sibling, untouched behavior: original map icon + handleMapToggle, just
                now gated `hidden md:grid` so it only takes over at md+ where the mobile
                hamburger sibling above is hidden. */}
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
                "hidden md:grid shrink-0 place-items-center rounded-full border border-s-border",
                "text-s-ink transition-all duration-300 ease-glide hover:bg-s-bg-sunken",
                "h-11 w-11",
              )}
            >
              <MapIcon size={16} strokeWidth={1.9} aria-hidden />
            </span>
          </motion.div>
        </div>
      </motion.div> {/* mockup-ok: 2026-08-10 owner-directed placement fix, no motion/design change here */}

      {/* CategoryPillRow (2026-08-10, owner ask): renders directly after the sticky search band
          above, in normal document flow (a sticky element keeps its own flow-space, so this
          sibling sits right beneath it regardless of scroll position, never sticky itself).
          Self-gates on the route (see the component's own showCategoryChrome derivation), so
          mounting it unconditionally here is safe on 2-segment city-category routes (e.g.
          /basel/coiffeur, which also renders this template) where the row never showed. */}
      <CategoryPillRow />

      {/* Top-bewertet hero carousel REMOVED (owner 2026-07-02: "remove the top bewertet").
          See _design-system/REMOVED.md. The results grid leads directly now. */}

      {/* CHROME row: filter chips + Fuer-dich. The search band moved OUT (above) so it
          can stay pinned over the full results list; this container holds the rest of
          the in-page chrome, centered + constrained (max-w-[680px]).
          Owner 2026-08-01 ("remove cz we made it carousel right did u forget"): hidden on
          MOBILE only, desktop untouched. A filter row belongs to a flat result list, not to
          the carousels the mobile category page now renders (CategoryMobileRails below); the
          filter STATE/logic stays fully intact (URL params, FilterSheet, activeFilterCount),
          only this row stops rendering under 768px. */}
      <div className="mx-auto hidden w-full max-w-[680px] px-4 md:block">
        {/* D. Filter chips row + pinned round filter button. Selected chips turn
            ink + show a check AND sort to the LEFT (active group, thin divider,
            then inactive). The round SlidersHorizontal button is pinned right,
            OUTSIDE the scrolling chips, and opens the FilterSheet. */}
        <div className="mt-4 flex items-center gap-2">
          {/* V3-D421k (owner): ONE circle on the FAR LEFT replaces the right-side Filter
              button (ditched). No filter active → SlidersHorizontal, tap opens the FilterSheet.
              Any filter active → X, tap CLEARS ALL filters (push to the bare pathname). The
              X-state goes blue-tint to match the active chips. */}
          <button
            type="button"
            onClick={() => (activeFilterCount > 0 ? router.push(pathname) : openSection(null))}
            aria-haspopup={activeFilterCount > 0 ? undefined : "dialog"}
            aria-label={activeFilterCount > 0 ? t("clearAll") : tFilter("open")}
            // mockup-ok: 44px a11y floor (CLAUDE.md design contract, icon-button h-11 w-11);
            // height/width-only change (h-9 w-9 to h-11 w-11), same colors, radius, icon.
            className={cn(
              "grid h-11 w-11 shrink-0 place-items-center rounded-full border",
              "transition-[background-color,border-color,color,transform] duration-150 ease-glide",
              "active:scale-[0.94] active:duration-[80ms]",
              "focus-visible:outline-none",
              activeFilterCount > 0
                // Owner (2026-07-01): filter button active = ink, not blue.
                ? "border-s-ink bg-white text-s-ink"
                : "border-s-border bg-white text-s-ink hover:bg-s-bg-sunken",
            )}
          >
            {/* V3-D421L (owner): animate the switch — both icons are stacked and
                cross-fade + rotate/scale when activeFilterCount crosses 0. */}
            <span className="relative grid h-4 w-4 place-items-center" aria-hidden>
              <SlidersHorizontal
                size={16}
                strokeWidth={1.9}
                className={cn(
                  "absolute transition-all duration-300 ease-glide",
                  activeFilterCount > 0
                    ? "scale-50 rotate-90 opacity-0"
                    : "scale-100 rotate-0 opacity-100",
                )}
              />
              <X
                size={16}
                strokeWidth={1.9}
                className={cn(
                  "absolute transition-all duration-300 ease-glide",
                  activeFilterCount > 0
                    ? "scale-100 rotate-0 opacity-100"
                    : "scale-50 -rotate-90 opacity-0",
                )}
              />
            </span>
          </button>
          <div
            className="scrollbar-none flex min-w-0 flex-1 items-center gap-2 overflow-x-auto"
            style={{ scrollbarWidth: "none" }}
          >
            {/* V3-D386: dropdown filter pills (match the map sheet). Sort lives in
                the dedicated sort dropdown below, so the row shows Preis + Bewertung. */}
            {filterPills
              .filter((p) => p.key !== "sort")
              // V3-D421f (owner): selected chips sort ALL the way left (stable sort keeps
              // each group's relative order). Number(active) desc → active first.
              .sort((a, b) => Number(b.active) - Number(a.active))
              .map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => (TOGGLE_PILLS.has(p.key) ? toggleBooleanParam(p.key, p.active) : openSection(p.key))}
                  aria-haspopup={TOGGLE_PILLS.has(p.key) ? undefined : "dialog"}
                  aria-pressed={TOGGLE_PILLS.has(p.key) ? p.active : undefined}
                  // mockup-ok: 44px a11y floor (CLAUDE.md design contract, interactive controls >= 44px / h-11);
                  // height-only change (h-9 to h-11), same colors, radius, text.
                  className={cn(
                    "inline-flex h-11 shrink-0 items-center gap-1 rounded-pill pl-3.5 pr-2.5 font-body text-[13.5px] font-medium leading-none",
                    "transition-[background-color,border-color,color,transform] duration-150 ease-glide",
                    "active:scale-[0.97] active:duration-[80ms]",
                    "focus-visible:outline-none",
                    p.active
                      // Owner 2026-07-01: selected = NEUTRAL (ink hairline + sunken fill + ink text),
                      // NOT blue. Supersedes the V3-D450 blue-pill , owner "don't like the blue, grey/sink it".
                      ? "border border-transparent bg-s-bg-sunken text-s-ink font-semibold"
                      : "border border-s-border bg-white text-s-ink hover:bg-s-bg-sunken",
                  )}
                >
                  {/* V3-D421L (owner: "stop adding dotts everywhere"): no leading dot.
                      Active state is the blue tint alone; the chevron (dropdowns only) is the
                      one affordance marker. No decorative pips — see LOCKFILE no-dots rule. */}
                  {p.label}
                  {!TOGGLE_PILLS.has(p.key) && <ChevronDown size={14} strokeWidth={1.6} className={p.active ? "text-s-ink" : "opacity-50"} aria-hidden />}
                </button>
              ))}
            {/* (Old right-side Filter button removed — V3-D421k: it's now the far-left
                circle that flips to an X / clear-all when any filter is active.) */}
          </div>
        </div>

        {/* E. "Fuer dich" row MOVED to the page bottom (V3-D421b, 2026-06-05, council 4/4:
            cross-surface off-ramps belong AFTER the results, not mid-scan between the hero
            and the grid). Rendered below the results flex container further down. */}
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
        <CategoryBrowseRails
          salons={salons}
          locale={locale}
          category={activeCategory}
          citySelected={!!activeCity}
        />
      )}

      {/* Result count row, count LEFT, sort dropdown RIGHT (Airbnb/Fresha
          pattern). V3-D350: sort moved here from the (removed) chip strip so the
          Uber icon row stays clean; sorting still fully works via the dropdown.
          Owner (2026-08-01, category-rails ask): "we don't need this how many
          stores there is and also the sort button", hidden on MOBILE only,
          same hidden/md: pattern as the filter row above; desktop unchanged.
          Sort state/logic is untouched, the dropdown just isn't rendered on
          mobile (no bespoke mobile sort entry point was asked for). */}
      <div className="mx-auto hidden w-full max-w-[1280px] items-center justify-between gap-3 px-4 pt-5 md:flex md:px-6">
        {loading ? (
          <div
            className="h-4 w-44 rounded bg-s-bg-sunken skeleton-shimmer"
            aria-hidden
          />
        ) : error ? (
          <span />
        ) : total > 0 ? (
          <p className="font-display text-[16px] font-semibold tracking-[-0.01em] text-s-ink">
            {/* tabular-nums so the count doesn't reflow/jitter as filters change the digit count. */}
            <span className="tabular-nums">{total}</span> {pluralSalons(total, tx)}
            {activeCity ? <>{t("inCity", { city: cityName })}</> : null}
          </p>
        ) : (
          <span />
        )}
        {/* accessibility-08 (2026-07-27): a sighted user sees this count update in place on
            every filter/keystroke; a screen-reader user tabbing the filter controls got total
            silence and had to manually re-traverse the whole results grid to find out whether
            anything changed. One persistent sr-only region (same pattern as HeartButton's save
            announcement) instead of putting aria-live on the visible <p>, which unmounts/
            remounts across the loading/error/total ternary above and so wouldn't reliably fire. */}
        <span className="sr-only" aria-live="polite" aria-atomic="true">
          {!loading && !error && total > 0 ? `${total} ${pluralSalons(total, tx)}` : ""}
        </span>
        {!loading && !error && total > 0 && (
          <div ref={sortBtnRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setSortOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={sortOpen}
              aria-label={t("sortAria", { label: sortLabel })}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5",
                "font-body text-[13px] font-medium leading-none",
                "transition-[border-color,transform] duration-150 ease-glide",
                "active:scale-[0.97] active:duration-[80ms]",
                "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
                // mockup-ok: 44px a11y floor (CLAUDE.md design contract, interactive controls >= 44px / h-11);
                // height-only change (min-h-[36px] to min-h-[44px]), same colors, radius, text.
                "min-h-[44px]",
                sort !== "rating"
                  ? "border-s-border bg-s-bg-sunken text-s-ink font-semibold hover:bg-s-border"
                  : "border-s-border bg-white text-s-ink hover:bg-s-bg-sunken",
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
              query={q}
              city={activeCity}
              cityName={activeCity ? cityName : null}
              hasDate={hasDateFilter}
              hasOtherFilters={hasOtherFilters}
              hasFilters={
                activeFilterCount > 0 || q.length > 0 || !!activeCategory
              }
              onClearFilters={() =>
                router.replace(activeCategory ? pathname : `/${locale}/search`)
              }
              onSearchEverywhere={() =>
                // Explicit countrywide (city=all) so it isn't re-defaulted to the city.
                router.push(
                  q.trim().length >= 2
                    ? `/${locale}/search?q=${encodeURIComponent(q.trim())}&city=${ALL_CITIES_PARAM}`
                    : `/${locale}/search?city=${ALL_CITIES_PARAM}`,
                )
              }
              onAnyDate={() => emptyDropParams(["date", "period"])}
            />
          ) : (
            <>
              {/* V3-D452 (2026-07-02, owner-approved /dev/results-full + /dev/results-browse):
                  mobile 1-col borderless feed. Mobile-only (md:hidden); the desktop
                  grid below is untouched. Escape hatches (?layout=list / ?layout=grid)
                  keep their existing behavior on every breakpoint (skip the feed).
                  walk_in stays on the "card" variant (desktop-grid block below, shown
                  on mobile too in this mode) so the queue busyness bar/tier is not lost.
                  Owner 2026-08-01 ("remove cz we made it carousel right did u forget"): on a
                  CATEGORY route (activeCategory set), this flat feed is replaced by
                  CategoryMobileRails (Top <Category> / Nearby / Available this week). /search
                  (no activeCategory) keeps this exact flat feed unchanged. */}
              {!listLayout && !gridLayout && !walkIn && (
                <div className="md:hidden">
                  {activeCategory ? (
                    <CategoryMobileRails
                      salons={salons}
                      locale={locale}
                      category={activeCategory}
                      categoryLabel={categoryLabel}
                      cityName={cityName}
                      favoriteIds={favoriteIds}
                    />
                  ) : (
                    <div className="flex flex-col gap-6">
                      {salons.map((s, i) => (
                        <SalonResultCard
                          key={s.id}
                          variant="feed"
                          slug={s.slug}
                          name={s.name}
                          locale={locale}
                          rating={s.average_rating}
                          photoUrl={s.cover_photo_url ?? undefined}
                          galleryCount={s.gallery_urls?.length ?? 0}
                          hasServiceQuery={q.length > 0}
                          matchChip={q.length > 0 ? matchChipLabel(s, q, tx) : null}
                          category={safeCategory(s.categories)}
                          city={
                            s.address ||
                            (s.quartier
                              ? s.quartier.charAt(0).toUpperCase() + s.quartier.slice(1)
                              : undefined) ||
                            (activeCity ? cityName : undefined)
                          }
                          address={s.address}
                          distanceMeters={s.distance_meters ?? null}
                          // min_price, not avg_price (2026-07-27): this renders under a "from"
                          // label, and an AVERAGE is not a floor , half the salon's services cost
                          // less than it, so the advertised starting price was unreachable. PBV
                          // Art. 13 requires a from-price to be the genuine lower limit.
                          priceFromCHF={s.min_price ?? null}
                          priceFromService={nameForLocale({ de: s.min_price_service_de ?? null, en: s.min_price_service_en ?? null, fr: s.min_price_service_fr ?? null, it: s.min_price_service_it ?? null }, locale)}
                          reviewCount={s.review_count ?? null}
                          services={s.services}
                          isSaved={favoriteIds.has(s.id)}
                          salonId={s.id}
                          date={date}
                          // performance-05: first card of the mobile above-the-fold feed
                          // is the LCP candidate on a fresh search-results load.
                          priority={i === 0}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* V3-D350: 2-column grid of clean Airbnb cards (SalonResultCard).
                  Desktop only (md:block) - mobile now renders the feed above instead,
                  EXCEPT walk_in mode (keeps its "card" variant + queue bar on every
                  breakpoint - the feed above skips walk_in) and the ?layout= escape
                  hatches (also shown on mobile, unchanged). */}
              <div
                className={cn(
                  "salon-card-stagger",
                  !listLayout && !gridLayout && !walkIn && "hidden md:grid",
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
                          // mobile ONLY for walk_in (the feed above covers every other
                          // case), 2-3 col on desktop (2 when map open).
                          "grid grid-cols-1 md:grid-cols-2",
                          mapOpen ? "lg:grid-cols-2" : "lg:grid-cols-3",
                          "gap-x-4 gap-y-7",
                        ),
                )}
              >
                {salons.map((s, i) => (
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
                      (activeCity ? cityName : undefined)
                    }
                    distanceMeters={s.distance_meters ?? null}
                    // min_price, not avg_price , see the note on the sibling card above.
                    priceFromCHF={s.min_price ?? null}
                    priceFromService={nameForLocale({ de: s.min_price_service_de ?? null, en: s.min_price_service_en ?? null, fr: s.min_price_service_fr ?? null, it: s.min_price_service_it ?? null }, locale)}
                    // V3-D373 (Fresha-match): review count -> its own "category · N
                    // reviews" line; location is "area, town" (built in city= above).
                    reviewCount={s.review_count ?? null}
                    nextSlot={nextSlotLabel(s.services, locale)}
                    services={s.services}
                    isSaved={favoriteIds.has(s.id)}
                    salonId={s.id}
                    walkInWaitMin={walkinAvail[s.id]?.waitMinutes ?? null}
                    walkInWaitMax={walkinAvail[s.id]?.waitMinutesMax ?? null}
                    walkInQueue={walkinAvail[s.id]?.queueLength ?? null}
                    date={date}
                    // performance-05: first card of the desktop above-the-fold grid
                    // is the LCP candidate on a fresh search-results load.
                    priority={i === 0}
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
                        strokeWidth={1.9}
                        aria-hidden
                      />
                    ) : null}
                    {loadingMore
                      ? t("loading")
                      : t("loadMore", {
                          count: Math.max(0, total - salons.length),
                          salons: pluralSalons(Math.max(0, total - salons.length), tx),
                        })}
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

      {/* "Für dich" shortcut row REMOVED from the category page (V3-D421L, 2026-06-06,
          owner "ditch the icons at the bottom"). The off-ramps live on the homepage /
          the hamburger menu; they read as clutter tacked onto the end of a results page.
          (FUER_DICH_* consts kept above in case the row returns elsewhere.) */}

      {/* Mobile full-viewport map mode — pannable map + a bottom sheet holding the
          result cards (V3-D378). Replaces the old bare full-screen swap: the map
          fills below the header, the sheet overlays the lower ~half with the count
          + vertical cards (scroll inside the sheet). Body scroll is locked above. */}
      {/* Stay mounted during a re-fetch (no `!loading`): searching from the map keeps
          the previous pins on screen until the new results swap in, instead of flashing
          the list underneath (the owner's "jumps to normal search then map"). */}
      {mobileView === "map" && !error && (() => {
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
          // V3-D453: raw address, plus galleryCount + hasServiceQuery, feed only.
          address: s.address,
          galleryCount: s.gallery_urls?.length ?? 0,
          hasServiceQuery: q.length > 0,
          matchChip: q.length > 0 ? matchChipLabel(s, q, tx) : null,
          category: activeCategory ? undefined : safeCategory(s.categories),
          city:
            s.address ||
            (s.quartier ? s.quartier.charAt(0).toUpperCase() + s.quartier.slice(1) : undefined) ||
            (activeCity ? cityName : undefined),
          distanceMeters: s.distance_meters ?? null,
          // min_price, not avg_price , an average under a "from" label is not a floor.
          priceFromCHF: s.min_price ?? null,
          priceFromService: nameForLocale({ de: s.min_price_service_de ?? null, en: s.min_price_service_en ?? null, fr: s.min_price_service_fr ?? null, it: s.min_price_service_it ?? null }, locale),
          reviewCount: s.review_count ?? null,
          nextSlot: nextSlotLabel(s.services, locale),
          services: s.services,
          isSaved: favoriteIds.has(s.id),
          salonId: s.id,
          walkInWaitMin: walkinAvail[s.id]?.waitMinutes ?? null,
          walkInWaitMax: walkinAvail[s.id]?.waitMinutesMax ?? null,
          walkInQueue: walkinAvail[s.id]?.queueLength ?? null,
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
                // When the picked city has no listings, recenter to the city so the map goes
                // there (instead of a blank sheet + the previous city). owner 2026-07-01.
                // getCityCoords resolves against the LIVE active-cities row first (a city
                // outside the static CITIES fallback, e.g. Luzern, still centers correctly).
                emptyCenter={
                  activeCity
                    ? (() => {
                        const coords = getCityCoords(activeCity, activeCityRow);
                        return coords ? [coords.lng, coords.lat] : null;
                      })()
                    : null
                }
                // "Search this area": MapView already renders the debounced
                // "In diesem Bereich suchen" button on pan/zoom; wire its bounds
                // into areaBounds so the list + pins refetch for the visible viewport.
                onAreaSearch={(bounds) => setAreaBounds(bounds)}
              />
            </div>
            {/* Unified bar (owner-approved /dev/map-motion, 2026-07-02, mockup-ok): ONE frosted
                pill , back-arrow + divider + search icon + query/city + list-toggle , replacing
                the two separate boxes (back button next to a search pill). Full-screen overlay
                covers the global header, so this IS the entire map-view chrome. */}
            <div className="absolute inset-x-0 top-0 z-20 px-3 pt-3">
              {/* Map search bar = IDENTICAL shape/size to the normal (non-map) bar above (owner
                  2026-07-02): flat white rounded-pill, border-s-border, px-3.5 py-2.5, Search 18 +
                  14px text. NOT frosted glass. A back arrow is prepended; the redundant list-toggle
                  icon (did the same thing as back) is removed. */}
              <div className="flex min-h-[67px] w-full items-center gap-2.5 rounded-pill border border-s-border bg-white px-3.5 py-2.5">
                <button
                  type="button"
                  onClick={() => setMobileView("list")}
                  aria-label={t("backToList")}
                  className="-my-2.5 grid h-11 w-8 shrink-0 place-items-center text-s-ink transition-transform active:scale-95"
                >
                  <ArrowLeft size={20} strokeWidth={2.2} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => openSearchOverlay(false)}
                  aria-label={tChrome("editSearch")}
                  aria-haspopup="dialog"
                  className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                >
                  <Search size={18} strokeWidth={1.9} className="shrink-0 text-s-ink-2" />
                  {/* Two lines (query/category + city), matching the normal bar's content; the pill's
                      min-h-[67px] pins the height IDENTICAL to the normal bar (owner: identical size).
                      No "Suchen" placeholder (owner). */}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-body text-[14px] font-medium text-s-ink">
                      {q || (activeCategory ? CATEGORY_PILLS.find((c) => c.slug === activeCategory)?.label : null) || cityName}
                    </span>
                    {(q || activeCategory) && (
                      <span className="block truncate font-body text-[12.5px] font-normal text-s-ink-2">{cityName}</span>
                    )}
                  </span>
                </button>
              </div>
            </div>
            {/* bottom sheet , DRAG the whole header (handle + sticky pills/count): snaps
                expanded / peek / collapsed. `fixed` (via motion.div's inline style) so the
                px drag-top works; z-[31] keeps it above the map. framer-motion top tween
                (owner-approved /dev/map-motion, 2026-07-02) , finger-tracking stays 1:1
                while dragging (duration 0), eases on release. */}
            <motion.div
              className="fixed inset-x-0 bottom-0 z-[31] flex flex-col rounded-t-[28px] border-t border-s-border bg-white shadow-[0_-10px_30px_rgba(10,10,10,0.16)]"
              style={{ top: 0 }}
              animate={{ top: curTop }}
              transition={sheetDragging || reduce ? { duration: 0 } : { type: "tween", ease: EASE, duration: 0.32 }}
            >
              {/* DRAG-ZONE (owner ask, 2026-07-02): the handle + the sticky pills/count
                  wrapper are BOTH draggable, not just the ~24px handle. The scroll region
                  below stays separately scrollable (no drag handlers). */}
              <div
                onPointerDown={onSheetPointerDown}
                onPointerMove={onSheetPointerMove}
                onPointerUp={onSheetPointerUp}
                className="shrink-0 touch-none select-none cursor-grab active:cursor-grabbing"
              >
                {/* V3-D386: bigger grab area so the handle is easy to drag. */}
                <div
                  className="flex items-center justify-center pb-2 pt-5"
                  role="button"
                  aria-label={t("dragList")}
                >
                  <span className="h-1.5 w-11 rounded-full bg-s-ink/25" aria-hidden />
                </div>

                {/* OVERLAP FIX (owner-approved /dev/map-motion): sticky pills + count on a
                    solid white bg + a 1px hairline, no shadow (calm/flat per
                    CONTROL_ELEVATION) , so the first list card never overlaps the chrome. */}
                {!mapSelectedId && (
                  <div className="sticky top-0 z-10 bg-white">
                    {/* V3-D386: no collapsed swiper, the sheet just lowers over the map
                        (Fresha). Always the dropdown filter pills + count + vertical list. */}
                    <div
                      className="scrollbar-none flex items-center gap-2 overflow-x-auto px-4 pb-2.5 pt-1"
                      style={{ scrollbarWidth: "none" }}
                    >
                      {filterPills.map((p) => (
                        <button
                          key={p.key}
                          type="button"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={() => (TOGGLE_PILLS.has(p.key) ? toggleBooleanParam(p.key, p.active) : openSection(p.key))}
                          aria-haspopup={TOGGLE_PILLS.has(p.key) ? undefined : "dialog"}
                          aria-pressed={TOGGLE_PILLS.has(p.key) ? p.active : undefined}
                          className={cn(
                            "inline-flex h-9 shrink-0 items-center gap-1 rounded-pill pl-3.5 pr-2.5 font-body text-[13.5px] font-medium leading-none",
                            "transition-[background-color,border-color,color,transform] duration-150 ease-glide active:scale-[0.97] active:duration-[80ms]",
                            "focus-visible:outline-none",
                            p.active
                              ? "border border-transparent bg-s-bg-sunken text-s-ink font-semibold"
                              : "border border-s-border bg-white text-s-ink hover:bg-s-bg-sunken",
                          )}
                        >
                          {p.label}
                          {!TOGGLE_PILLS.has(p.key) && <ChevronDown size={14} strokeWidth={1.6} className={p.active ? "text-s-ink" : "opacity-50"} aria-hidden />}
                        </button>
                      ))}
                    </div>
                    {/* centered + not bold + generic "places" (owner 2026-07-02: approved map-full
                        mockup centered it; "places" not "salons" since it may be a tattoo/other store). */}
                    <div className="px-4 pb-2 pt-1 text-center font-body text-[12.5px] text-s-ink-2">
                      {t("salonsInArea", { count: salons.length })}
                    </div>
                    {/* hairline removed (owner 2026-07-02: "it's enough that the count is there"). */}
                  </div>
                )}
              </div>

              {/* V3-D453: the ONE sheet morphs LIST/SALON, now an AnimatePresence
                  crossfade+rise instead of a hard swap (owner-approved /dev/map-motion).
                  LIST mode keeps the vertical feed cards (unchanged); SALON mode
                  (mapSelectedId set) swaps the whole body for MapSalonDetail, matching
                  the owner-approved /dev/map-behavior mockup. */}
              <AnimatePresence mode="wait">
                {mapSelectedId ? (
                  (() => {
                    const selectedSalon = salons.find((s) => s.id === mapSelectedId);
                    if (!selectedSalon) return null;
                    return (
                      <motion.div
                        key="salon"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={reduce ? { duration: 0 } : { duration: 0.24, ease: EASE }}
                        // min-h-0 is load-bearing: without it this flex-1 child refuses to
                        // shrink below its content's intrinsic height, which forces the
                        // sheet (a flex column with no fixed height) taller than its `top`
                        // position intends, an invisible overflow past the viewport bottom,
                        // the owner's "empty space that doesn't exist" at the collapsed detent.
                        className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-1"
                        onPointerDown={onContentPointerDown}
                        onPointerMove={onContentPointerMove}
                        onPointerUp={onContentPointerUp}
                        onPointerCancel={onContentPointerUp}
                      >
                        <MapSalonDetail
                          salon={selectedSalon}
                          locale={locale}
                          onBack={() => setMapSelectedId(null)}
                          full={isSalonFull}
                          isSaved={favoriteIds.has(selectedSalon.id)}
                          backLabel={t("allSalons")}
                          viewStoreLabel={t("viewStore")}
                          date={date}
                        />
                      </motion.div>
                    );
                  })()
                ) : (
                  <motion.div
                    key="list"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={reduce ? { duration: 0 } : { duration: 0.24, ease: EASE }}
                    // min-h-0: same overflow bugfix as the salon-detail body above.
                    className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 pb-8 pt-3"
                    onPointerDown={onContentPointerDown}
                    onPointerMove={onContentPointerMove}
                    onPointerUp={onContentPointerUp}
                    onPointerCancel={onContentPointerUp}
                  >
                    {salons.map((s) => (
                      <SalonResultCard key={s.id} variant="feed" onSelect={setMapSelectedId} {...cardProps(s)} />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
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

      {/* Floating "Karte" pill (bottom-center, ink fill), scroll-revealed once
          the big search clears the viewport (mapFabVisible). This is the MOBILE map
          affordance only (`md:hidden` on the button below); at md+ the desktop header's
          "Open map" icon button (~line 1408, `hidden md:grid`, same handleMapToggle) is the
          map affordance instead, so the two never co-exist at any one breakpoint.
          Fires the shared handleMapToggle; label flips to "Liste" while the map is open.
          V3-D350: now always rendered (default UI, no flag).
          NOT MOUNTED (2026-09-04 round 2), not just hidden, while cookieBannerVisible
          (both portal to document.body at a higher z than the banner and painted over its
          text) or searchOverlayOpen (SearchOverlay portals at raw z 100-102, below z-float,
          but the pill still sat on top of the overlay's own action row). */}
      {!cookieBannerVisible && !searchOverlayOpen && (() => {
        const mapPill = (
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
              // Z-INDEX + POSITION FIX (2026-09-04): was `bottom-5 z-30`, which put this pill under
              // the BottomNav's hit area (z-nav, 150) on mobile, measured to intercept a tap and
              // route it to the nav's Saved link instead of opening the map. `z-float` (200,
              // tailwind config zIndex block) sits above the nav and below every locked overlay
              // (sheet-bg 400+), so a filter sheet still covers this pill.
              // OFFSET CORRECTED (2026-09-04 round 2): the `bottom-[73px]` above assumed a flat
              // 57px nav + 16px gap; measured live at 390x844 the nav (`nav[aria-label]`, z-nav
              // 150) is 50px tall condensed / 58px tall expanded, plus a 12px bottom margin, so
              // against the expanded state the pill's bottom edge landed only 3px clear, not 16.
              // bottom-[86px] = 58 (expanded nav height) + 12 (nav's own bottom margin) + 16
              // (design system gap), clears the expanded nav's top edge by the full 16px in
              // both nav states, since the condensed nav (50px) only needs less clearance.
              // md:hidden (this round): mobile-only affordance now that the desktop header's
              // "Open map" icon button (~line 1408) covers md+; without this the two co-existed.
              "md:hidden",
              "fixed bottom-[86px] left-1/2 z-float -translate-x-1/2",
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
              <ListIcon size={16} strokeWidth={1.9} aria-hidden />
            ) : (
              <MapIcon size={16} strokeWidth={1.9} aria-hidden />
            )}
            {mapOpen || mobileView === "map"
              ? LIST_FAB_LABEL[locale] ?? LIST_FAB_LABEL.de
              : MAP_FAB_LABEL[locale] ?? MAP_FAB_LABEL.de}
          </button>
        );
        // PORTAL FIX (2026-09-04), same pattern as the map overlay portal above (V3-D382) and
        // Toast.tsx's own createPortal(..., document.body): app/[locale]/layout.tsx wraps the
        // page in main className="isolate ...", which creates a NEW stacking context. A
        // position:fixed element's z-index is only ever compared against siblings WITHIN its
        // own stacking context, so as long as this button stayed inside main, no z-index value
        // could make it beat a fixed element mounted as a later sibling of main at the true
        // document root, e.g. the cookie consent banner, regardless of the two elements' actual
        // z-index numbers. Measured live with elementsFromPoint: with z-float (200) vs the
        // banner's z-banner (180), the banner's own paragraph text still won the hit test at the
        // pill's centre. Portalling to document.body moves the pill to the SAME root stacking
        // level the banner and Toast already use, so the z-index comparison is finally real.
        return typeof document !== "undefined" ? createPortal(mapPill, document.body) : mapPill;
      })()}

      {/* V3-D351: FilterSheet - opened by the round filter button. Every control
          writes the SAME URL params as the chip row (single source of truth);
          open state owned here, passed as isOpen / onClose. */}
      <FilterSheet
        isOpen={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        resultCount={total}
        section={filterSection}
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
        gender={gender}
        onGenderChange={(value) => updateParam("gender", value)}
        // V3-D454: hide-while-empty flags, same active-param exception as the pill row.
        showGender={filterAvailability.gender || !!gender}
        amenityOptions={amenityOptions}
        amenities={activeAmenities}
        onAmenityToggle={(col) => toggleBooleanParam(col, activeAmenities.includes(col))}
        showAmenities={AMENITIES_SELF_REPORTED}
        deals={deals}
        onDealsToggle={() => toggleBooleanParam("deals", deals)}
        showDeals={filterAvailability.deals || deals}
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
            "gender",
            "sort",
            ...AMENITY_COLS,
          ]) {
            sp.delete(key);
          }
          sp.delete("page");
          router.replace(`${pathname}${sp.toString() ? `?${sp}` : ""}`, {
            scroll: false,
          });
        }}
        labels={{
          // V3-D451: focused-sheet title resolves to the matching searchUi section
          // label; the full "all filters" sheet keeps the existing ui.filterSheet title.
          title: filterSection ? sectionTitle(filterSection) : tFilter("title"),
          reset: tFilter("reset"),
          close: tFilter("close"),
          sortHeading: tFilter("sortHeading"),
          priceHeading: t("sectionPrice"),
          ratingHeading: tFilter("ratingHeading"),
          rating45: tFilter("rating45"),
          rating40: tFilter("rating40"),
          ratingAny: tFilter("ratingAny"),
          // R4-1b: the rating BAR's "{value} and up" label + its aria-label.
          ratingAndUp: (value: string) => tFilter("ratingAndUp", { value }),
          ratingAria: tFilter("ratingAria"),
          forWhoHeading: t("sectionGender"),
          genderAny: t("genderAny"),
          genderFemale: t("genderFemale"),
          genderMale: t("genderMale"),
          genderNonBinary: t("genderNonBinary"),
          dealsHeading: t("sectionDeals"),
          priceAny: t("priceAny"),
          priceUpTo: (amount: number) => t("priceUpTo", { amount }),
          maxPriceAria: t("maxPriceAria"),
          amenitiesHeading: t("sectionAmenities"),
          apply: (count: number) => tFilter("apply", { count }),
        }}
      />

      {/* V2-D51 Path C: the full-page search surface, opened by the sticky search
          bar above. Seeds the active service + city so the composer continues the
          current results context. */}
      <SearchOverlay
        open={searchOverlayOpen}
        onClose={() => setSearchOverlayOpen(false)}
        locale={locale}
        // A2/Model B (2026-07-04): seed BOTH slices independently so reopening the composer
        // shows the category pill AND the typed query at once, not one clobbering the other.
        initialService={activeCategory ?? ""}
        initialQuery={q}
        initialCity={activeCity ? cityName : ""}
        autoFocusService={autoFocusSearch}
        serviceInputRef={searchInputRef}
        originRect={searchOriginRect}
        extraParams={mapOpen ? { map: "1" } : undefined}
        // A2/Model B: results/category pages get the persistent category pill row; the
        // homepage hero (SearchBar.tsx) omits this prop (defaults to false).
        showCategoryPills
        // MAP CONTEXT (owner + council 2026-07-01): tapping a store on the map recenters to its
        // pin (see the location) instead of opening the salon page. If the salon is already in the
        // current map results, select it (MapView eases to it + the sheet card highlights);
        // otherwise search it onto the map so it loads + the map fits to it.
        onSalonLocate={
          mapOpen || mobileView === "map"
            ? (s) => {
                setSearchOverlayOpen(false);
                setMobileView("map");
                if (salons.some((x) => x.id === s.id)) {
                  setMapSelectedId(s.id);
                } else {
                  router.push(`/${locale}/search?q=${encodeURIComponent(s.name)}&map=1`);
                }
              }
            : undefined
        }
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EmptyState — per LoadingStates.md Pattern 2.
// ─────────────────────────────────────────────────────────────────────────────

type NoResultsData = {
  anywhere: { count: number } | null;
  category: { value: string; count: number } | null;
};

// C1State: the owner-picked no-results shape , icon + short headline + ONE ink CTA +
// optional secondary text link. EmptyState below picks WHICH state fits the cause.
function C1State({
  Icon,
  headline,
  primary,
  secondary,
}: {
  Icon: LucideIcon;
  headline: string;
  primary: { label: string; Icon?: LucideIcon; onClick: () => void };
  secondary?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center px-6 pt-10 pb-9 text-center">
      <div className="grid h-[68px] w-[68px] place-items-center rounded-full bg-s-bg-sunken text-s-ink shadow-[0_2px_8px_rgba(10,10,10,0.06)]">
        <Icon size={30} strokeWidth={1.5} />
      </div>
      <h2 className="font-display mt-5 max-w-xs text-[20px] font-semibold leading-snug tracking-[-0.02em] text-s-ink">
        {headline}
      </h2>
      <button
        type="button"
        onClick={primary.onClick}
        className="mt-6 flex w-full max-w-xs items-center justify-center gap-2 rounded-btn bg-s-ink px-6 py-3.5 font-body text-[15px] font-semibold text-white transition-colors duration-150 hover:bg-black"
      >
        {primary.Icon ? <primary.Icon size={18} strokeWidth={1.9} /> : null}
        {primary.label}
      </button>
      {secondary ? (
        <button
          type="button"
          onClick={secondary.onClick}
          className="mt-4 font-body text-[14px] font-medium text-s-accent hover:underline"
        >
          {secondary.label}
        </button>
      ) : null}
    </div>
  );
}

// EmptyState: cause-aware no-results. Detects WHY there are 0 results and shows the
// matching recovery (no city supply -> search nationwide; a date filter -> any date;
// other filters -> clear; a query miss -> browse closest category / broaden). Counts
// come from /api/search/no-results (never fabricated).
function EmptyState({
  locale,
  query,
  city,
  cityName,
  hasDate,
  hasOtherFilters,
  hasFilters,
  onClearFilters,
  onSearchEverywhere,
  onAnyDate,
}: {
  locale: string;
  query: string;
  city: string | null;
  cityName: string | null;
  hasDate: boolean;
  hasOtherFilters: boolean;
  hasFilters: boolean;
  onClearFilters: () => void;
  onSearchEverywhere: () => void;
  onAnyDate: () => void;
}) {
  const t = useTranslations("searchUi");
  const tNav = useTranslations("navigation");
  const router = useRouter();
  const [data, setData] = React.useState<NoResultsData | null>(null);

  const q = query.trim();
  React.useEffect(() => {
    if (q.length < 2) {
      setData(null);
      return;
    }
    let alive = true;
    const params = new URLSearchParams({ q });
    if (city) params.set("city", city);
    fetch(`/api/search/no-results?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: NoResultsData | null) => {
        if (alive) setData(d);
      })
      .catch((e) => console.error("[EmptyState] no-results fetch failed:", e));
    return () => {
      alive = false;
    };
  }, [q, city]);

  const anywhere = data?.anywhere?.count ?? null;
  const catValue = data?.category?.value ?? null;
  const catName = catValue
    ? tNav.has(catValue as Parameters<typeof tNav>[0])
      ? tNav(catValue as Parameters<typeof tNav>[0])
      : catValue.charAt(0).toUpperCase() + catValue.slice(1)
    : null;
  const goCategory = () => {
    if (catValue) router.push(`/${locale}/search?category=${catValue}`);
  };
  const goHome = () => router.push(`/${locale}`);

  // 1. City has no supply, but the query matches nationwide (known-good recovery first).
  if (cityName && anywhere && anywhere > 0) {
    return (
      <C1State
        Icon={MapPinOff}
        headline={t("nrCityHeadline", { city: cityName })}
        primary={{ label: t("suggestEverywhere"), Icon: Globe, onClick: onSearchEverywhere }}
        secondary={catName ? { label: t("suggestCategory", { category: catName }), onClick: goCategory } : undefined}
      />
    );
  }
  // 2. A date / time filter is the constraint , loosen it.
  if (hasDate) {
    return <C1State Icon={CalendarOff} headline={t("nrDateHeadline")} primary={{ label: t("nrAnyDate"), onClick: onAnyDate }} />;
  }
  // 3. Other filters are the constraint , one tap to reset.
  if (hasOtherFilters) {
    return <C1State Icon={SlidersHorizontal} headline={t("nrFiltersHeadline")} primary={{ label: t("clearFilters"), onClick: onClearFilters }} />;
  }
  // 4. A query that just did not match , browse the closest category or broaden.
  if (q.length >= 2) {
    const primary = catName
      ? { label: t("suggestCategory", { category: catName }), Icon: Compass, onClick: goCategory }
      : anywhere && anywhere > 0
        ? { label: t("suggestEverywhere"), Icon: Globe, onClick: onSearchEverywhere }
        : { label: t("toHome"), onClick: goHome };
    return (
      <C1State
        Icon={SearchX}
        headline={t("nrQueryHeadline", { query: q })}
        primary={primary}
        secondary={hasFilters ? { label: t("clearFilters"), onClick: onClearFilters } : undefined}
      />
    );
  }
  // 5. Generic fallback (no query, no clear cause).
  return (
    <C1State
      Icon={SearchX}
      headline={t("emptyTitle")}
      primary={hasFilters ? { label: t("clearFilters"), onClick: onClearFilters } : { label: t("toHome"), onClick: goHome }}
    />
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
  const t = useTranslations("searchUi");
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center px-6 py-16 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-s-error/10">
        <AlertCircle size={28} strokeWidth={1.75} className="text-s-error" />
      </div>
      {/* V3-D240 (W2): match LOCKFILE Section H2 — 20px semibold. */}
      <h2 className="font-display mt-5 text-[20px] font-semibold leading-tight tracking-[-0.02em] text-s-ink">
        {t("errorTitle")}
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
        {t("retry")}
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
