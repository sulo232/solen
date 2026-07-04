"use client";

// mockup-ok: port of LOCKED search-morph mockup (app/[locale]/dev/search-morph/page.tsx,
// council-approved 2026-06-30). Entire file is a design port, not a live exploration.

import * as React from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useMotionValue,
  useTransform,
  animate,
} from "motion/react";
import {
  ArrowLeft,
  ArrowUpLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  Search,
  MapPin,
  Clock,
  User,
  Store,
  Globe,
  type LucideIcon,
} from "lucide-react";
import { SEARCH_CITIES, CITY_ICONS, ALL_CITIES_PARAM } from "@/lib/cities";
import { CATEGORIES } from "@/app/[locale]/_components/homepage/searchCategories";
import { SALON_CATEGORY_SLUGS } from "@/lib/validations";
// A2/Model B (2026-07-04): the SAME category triples SearchTemplate's own category-tab row
// uses (reuse, not a second list). SearchTemplate only ever reaches this file via a lazy
// `next/dynamic(() => import("./SearchOverlay"))` call inside a callback, so this static
// import back does not create an eager circular module-init cycle.
import { CATEGORY_PILLS } from "./SearchTemplate";
import { FEATURED_SALONS } from "@/app/[locale]/_components/homepage/searchFeatured";
import { useSearchSuggest } from "../homepage/useSearchSuggest";
import { useGeocodeSuggest } from "../homepage/useGeocodeSuggest";
import { useStyleLooks } from "../homepage/useStyleLooks";
import { useInspoLooks } from "../homepage/useInspoLooks";
import { useForYouLooks } from "../homepage/useForYouLooks";
import { SalonResultCard } from "./SalonResultCard";
import {
  useRecentSearches,
  recentLabel,
  type RecentSearch,
} from "../homepage/useRecentSearches";
import { useRecentlyViewed } from "../homepage/useRecentlyViewed";
import { Skeleton } from "@/app/[locale]/_components/primitives";

// ── Constants ────────────────────────────────────────────────────────────────

const EASE = [0.32, 0.72, 0, 1] as const;
const OPEN_T = { duration: 0.4, ease: EASE } as const;
const EXPAND_DIST = 120; // px of scroll = full 0->1 expand (service step only)
const HEADING_H = 56;    // collapsing heading height (px)
const ROW_H = 66;        // collapsed step row (h-14=56 + pt-2.5=10)
const FOOTER_H = 68;     // footer slide-off distance

const WEEKDAYS = ["M", "D", "M", "D", "F", "S", "S"]; // Monday-first de-CH

type Step = "service" | "location" | "date";
const STEPS: Step[] = ["service", "location", "date"];

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

function buildMonthGrid(d: Date): (number | null)[] {
  const y = d.getFullYear(), m = d.getMonth();
  const first = (new Date(y, m, 1).getDay() + 6) % 7;
  const total = new Date(y, m + 1, 0).getDate();
  const cells: (number | null)[] = Array.from({ length: first }, () => null);
  for (let i = 1; i <= total; i++) cells.push(i);
  return cells;
}

// `${y}-${m0based}-${d}` -> zero-padded ISO yyyy-mm-dd
function keyToISO(key: string): string {
  const [ys, ms, ds] = key.split("-");
  return `${ys}-${String(Number(ms) + 1).padStart(2, "0")}-${String(Number(ds)).padStart(2, "0")}`;
}

// Maps the de i18n chip labels to URL param values.
const PERIOD_CHIP_TO_URL: Record<string, string> = {
  Vormittag: "morning",
  Nachmittag: "afternoon",
  Abend: "evening",
};

// ── Props (PRESERVED EXACTLY) ────────────────────────────────────────────────

export interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
  locale: string;
  /** A picked category slug (coiffeur/barbershop/nails/spa), a salon/stylist name, or an
   *  autocomplete term , whatever isn't the free-text query. Kept as one field (A2/Model B
   *  split only pulls the CATEGORY slice out into its own state internally; this prop still
   *  seeds that combined "resolved thing" the collapsed bar/step-row show). */
  initialService?: string;
  /** A2/Model B (2026-07-04): free-text query, independent of initialService/category. Seeds
   *  `serviceQ` , the ONLY thing the composer's text input ever binds to. */
  initialQuery?: string;
  initialCity?: string;
  initialFocus?: "service" | "stadt" | "zeit";
  /** Homepage 3-section search passes true so tapping it auto-opens the keyboard on the
   *  service step (no second tap). Category pages omit it (service is pre-filled, no keyboard). */
  autoFocusService?: boolean;
  /** Shared ref to the query input so the OPENER can focus it synchronously inside its tap
   *  (via flushSync) , the only reliable way to open the iOS keyboard without a scroll jump. */
  serviceInputRef?: React.RefObject<HTMLInputElement | null>;
  /** Extra URL params to carry through on submit (e.g. { map: "1" } so searching from the map
   *  view stays on the map instead of bouncing to the list then back). */
  extraParams?: Record<string, string>;
  /** MAP CONTEXT (owner + council 2026-07-01): when the overlay is opened FROM the map, a store
   *  tap should recenter the map to that salon's pin so the user SEES its location, NOT navigate
   *  away to the salon page. The map parent supplies this; when absent (normal results), store
   *  taps open the salon page as before. Keeps ONE overlay, context-aware navigation (not two). */
  onSalonLocate?: (s: { id: string; slug: string; name: string }) => void;
  /** A2/Model B (2026-07-04): renders the persistent category pill row above the query input.
   *  RESULTS-ONLY , SearchTemplate passes true, the homepage SearchBar omits it (false). */
  showCategoryPills?: boolean;
}

// ── Main component ────────────────────────────────────────────────────────────

export function SearchOverlay({
  open,
  onClose,
  locale,
  initialService = "",
  initialQuery = "",
  initialCity = "",
  initialFocus = "service",
  autoFocusService = false,
  serviceInputRef,
  extraParams,
  onSalonLocate,
  showCategoryPills = false,
}: SearchOverlayProps) {
  const router = useRouter();
  const t = useTranslations("ui.searchOverlay");
  const reduce = useReducedMotion();

  const [activeStep, setActiveStep] = React.useState<Step>("service");
  const [service, setService] = React.useState(initialService);
  // A2/Model B (2026-07-04): CATEGORY is its own state slice, written ONLY by the pill row
  // (CategoryPillsRow below). It never reads or clears `serviceQ`, and `serviceQ` never reads
  // or clears it , the whole point of the decoupling fix. Seeded from `service` when it happens
  // to already be a category slug (e.g. reopening the composer on a category route).
  const [category, setCategory] = React.useState<string>(
    SALON_CATEGORY_SLUGS.includes(initialService.toLowerCase()) ? initialService.toLowerCase() : "",
  );
  const [serviceQ, setServiceQ] = React.useState(initialQuery);
  const [stadt, setStadt] = React.useState(initialCity);
  const [cityQ, setCityQ] = React.useState("");
  const [isoDate, setIsoDate] = React.useState(""); // URL `date` param
  const [selKey, setSelKey] = React.useState<string | null>(null);
  const [dateLabel, setDateLabel] = React.useState("");
  const [zeitPeriod, setZeitPeriod] = React.useState(""); // morning/afternoon/evening/""
  const [dateTab, setDateTab] = React.useState<"daten" | "flexibel">("daten");
  const [monthOffset, setMonthOffset] = React.useState(0);
  const [inputFocused, setInputFocused] = React.useState(false);

  const { recent, push } = useRecentSearches();
  const [hiddenRecents, setHiddenRecents] = React.useState<Set<number>>(new Set());
  const { items: _recentlyViewed } = useRecentlyViewed(4); // preserved hook call

  const { results, loading } = useSearchSuggest(open ? serviceQ : "", { city: stadt || undefined });
  // B3.3 (_plans/SEARCH_MAP_OVERHAUL.md): street/place -> city pick-list. Restricted server-side
  // to enabled cities; empty candidates just fall through to the other suggestion groups below.
  const { candidates: geoCandidates, loading: geoLoading } = useGeocodeSuggest(open ? serviceQ : "");
  // Autocomplete completions come from style-suggest (short style terms); the Looks strip is
  // fed by the RICH Inspo feed (search_discovery) so it shows real, plentiful looks.
  const { terms: styleTerms } = useStyleLooks(open ? serviceQ : "");
  const { looks: inspoLooks } = useInspoLooks(open ? serviceQ : "");
  // "Für dich": DNA/style-affinity looks (discovery_feed_for_you; popular for logged-out).
  // Replaces the old Trending chips in the idle state + fills short typing results.
  const { looks: forYouLooks } = useForYouLooks(open);
  const typing = serviceQ.trim().length >= 2;
  const hasResults = results.services.length + results.salons.length + results.stylists.length > 0;

  const serviceRef = React.useRef<HTMLInputElement>(null);
  const cityRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const dateScrollRef = React.useRef<HTMLDivElement>(null);

  const [safeTop, setSafeTop] = React.useState(0);
  React.useEffect(() => {
    const probe = document.createElement("div");
    probe.style.cssText = "position:fixed;top:0;height:env(safe-area-inset-top,0px);visibility:hidden;pointer-events:none";
    document.body.appendChild(probe);
    setSafeTop(Math.round(probe.getBoundingClientRect().height) || 0);
    probe.remove();
  }, []);

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // iOS-safe body-scroll lock: overflow:hidden alone doesn't lock iOS or preserve position, so
  // the page scrolled under the overlay (opened mid-page) and lost its spot on close, and the
  // input autofocus scrolled the page. Pin the body at -scrollY while open, restore on close.
  React.useEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    const body = document.body;
    const prev = { position: body.style.position, top: body.style.top, left: body.style.left, right: body.style.right, width: body.style.width, overflow: body.style.overflow };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.left = prev.left;
      body.style.right = prev.right;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  React.useEffect(() => {
    if (open) {
      setService(initialService);
      setCategory(SALON_CATEGORY_SLUGS.includes(initialService.toLowerCase()) ? initialService.toLowerCase() : "");
      setServiceQ(initialQuery);
      setStadt(initialCity);
      if (initialFocus === "stadt") setActiveStep("location");
      else if (initialFocus === "zeit") setActiveStep("date");
      else setActiveStep("service");
      expand.set(0);
      // Homepage 3-section search: land directly in the focused/typing state so the field
      // shows what you type (inputFocused=true, NOT reset to false), the sheet expands, and
      // we focus the input (autoFocus on the element is the iOS keyboard's best shot; the rAF
      // focus is the fallback for DOM focus). Category pages pass autoFocusService=false.
      if (autoFocusService && initialFocus === "service") {
        setInputFocused(true);
        grow(1);
        // preventScroll: stop iOS from scrolling the focused input into view (that was the
        // "opens then scrolls down" jank). The input already sits at the top of the sheet.
        requestAnimationFrame(() => serviceRef.current?.focus({ preventScroll: true }));
      } else {
        setInputFocused(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const now = React.useMemo(() => new Date(), []);
  const windowEnd = React.useMemo(() => new Date(now.getFullYear(), now.getMonth(), now.getDate() + 42), [now]);
  const maxMonthOffset = React.useMemo(
    () => (windowEnd.getFullYear() - now.getFullYear()) * 12 + (windowEnd.getMonth() - now.getMonth()),
    [now, windowEnd],
  );
  const shownMonth = React.useMemo(
    () => new Date(now.getFullYear(), now.getMonth() + Math.min(monthOffset, maxMonthOffset), 1),
    [now, monthOffset, maxMonthOffset],
  );

  // PURE SCROLL-LINKED EXPAND (service step only)
  const expand = useMotionValue(0);
  const cropTop = useTransform(expand, [0, 1], [96, Math.max(safeTop + 6, 50)]);
  const headingH = useTransform(expand, [0, 0.55], [HEADING_H, 0]);
  const headingOp = useTransform(expand, [0, 0.42], [1, 0]);
  const xOpacity = useTransform(expand, [0.82, 1], [1, 0]);
  const stepsOp = useTransform(expand, [0.4, 0.8], [1, 0]);
  const stepsH = useTransform(expand, [0.4, 0.8], [ROW_H * 2 + 20, 0]);
  const footerH = useTransform(expand, [0.4, 0.8], [FOOTER_H, 0]);
  const cardMx = useTransform(expand, [0, 0.7], [12, 0]);
  const cardRadius = useTransform(expand, [0, 0.7], [22, 18]);
  // mockup-ok: fully expanded, the card sits flush to the viewport bottom, so the bottom corners
  // go SQUARE (rounded bottom corners against the screen edge look wrong , owner). Top stays rounded.
  const cardRadiusBottom = useTransform(expand, [0, 0.7], [22, 0]);

  const grow = React.useCallback(
    (to: number) => animate(expand, to, reduce ? { duration: 0 } : { duration: 0.34, ease: EASE }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reduce],
  );
  const collapse = React.useCallback(() => { if (listRef.current) listRef.current.scrollTop = 0; grow(0); }, [grow]);
  const openStep = React.useCallback((s: Step) => { setActiveStep(s); setInputFocused(false); collapse(); }, [collapse]);
  const advance = React.useCallback((s: Step) => {
    setInputFocused(false); collapse();
    const next = STEPS[STEPS.indexOf(s) + 1];
    if (next) setActiveStep(next);
  }, [collapse]);

  // URL contract (PRESERVED EXACTLY , A2/Model B, 2026-07-04): `q` and `category`/`service`
  // are built from two fully INDEPENDENT state slices now (`serviceQ` and `category`), so
  // both can be present at once and neither setter has ever cleared the other.
  const buildParams = React.useCallback(
    (over?: Partial<{ q: string; service: string; city: string; date: string; period: string }>) => {
      const sp = new URLSearchParams();
      const qv = over?.q ?? serviceQ.trim();
      // `over.service`/legacy `service` (a picked salon name or autocomplete term) still wins
      // when explicitly supplied; otherwise the pill row's `category` slice drives ?category=.
      const sv = over?.service ?? (category || service);
      const cv = over?.city ?? stadt, dv = over?.date ?? isoDate, pv = over?.period ?? zeitPeriod;
      if (qv && qv.length >= 2) sp.set("q", qv);
      // A category slug (e.g. opening search from /coiffeur, or the pill row) filters by
      // CATEGORY, not a text-match on service names , fixes the ?service=/?category= ambiguity.
      if (sv) {
        if (SALON_CATEGORY_SLUGS.includes(sv.toLowerCase())) sp.set("category", sv.toLowerCase());
        else sp.set("service", sv);
      }
      if (cv) sp.set("city", cv);
      if (dv) sp.set("date", dv);
      if (pv) sp.set("period", pv);
      // Carry through the view context (e.g. map=1) so a search from the map stays on the map.
      if (extraParams) for (const [k, v] of Object.entries(extraParams)) sp.set(k, v);
      return sp;
    },
    [serviceQ, category, service, stadt, isoDate, zeitPeriod, extraParams],
  );

  const navigate = React.useCallback(
    (sp: URLSearchParams) => { const qs = sp.toString(); router.push(`/${locale}/search${qs ? `?${qs}` : ""}`); onClose(); },
    [router, locale, onClose],
  );

  // Recents store ONLY search + location, never date (owner: a stale date re-applied from a
  // past search gets fucked up). The live search still uses the date via navigate/buildParams.
  const handleSubmit = React.useCallback(() => {
    push({ query: serviceQ.trim() || undefined, service: (category || service) || undefined, city: stadt || undefined });
    navigate(buildParams());
  }, [push, serviceQ, category, service, stadt, buildParams, navigate]);

  const autoSearch = React.useCallback(
    (over: Partial<{ city: string; date: string; period: string }>) => {
      push({ query: serviceQ.trim() || undefined, service: (category || service) || undefined, city: over.city ?? stadt ?? undefined });
      navigate(buildParams(over));
    },
    [push, serviceQ, category, service, stadt, isoDate, zeitPeriod, buildParams, navigate],
  );
  void autoSearch; // export contract: preserved for external callers

  const handleRecentClick = React.useCallback((r: RecentSearch) => {
    // Tapping a recent re-applies ONLY search + location, never the date (owner: date must
    // not tap back). A recent is a "search here again" shortcut, not a full state restore.
    const sp = new URLSearchParams();
    if (r.query) sp.set("q", r.query);
    if (r.service) sp.set("service", r.service);
    if (r.city) sp.set("city", r.city);
    push({ query: r.query, service: r.service, city: r.city });
    navigate(sp);
  }, [push, navigate]);

  const close = React.useCallback(() => { setInputFocused(false); setActiveStep("service"); setServiceQ(""); setCityQ(""); expand.set(0); onClose(); }, [expand, onClose]);
  const reset = React.useCallback(() => { setService(""); setCategory(""); setStadt(initialCity); setIsoDate(""); setSelKey(null); setDateLabel(""); setZeitPeriod(""); setServiceQ(""); setCityQ(""); setActiveStep("service"); setInputFocused(false); collapse(); }, [initialCity, collapse]);

  // Rich-search taps. searchTerm: run a specific autocomplete term as the query (keeps
  // city/date). openSalon: jump to that salon's PDP. openLookItem: open the tapped Inspo
  // look's own detail page (owner: tapping a look should open the look).
  const searchTerm = React.useCallback((term: string) => {
    // Pick a suggested service but DON'T search yet: return to the composed view so the user can
    // still set location + date (the Wo?/Wann? rows are hidden while the autocomplete is up). The
    // "Suchen {query}" primary row + the bottom Suchen still search immediately. (owner 2026-07-01:
    // "I can't select dates, you didn't implement the whole system" , the typed path skipped them.)
    // A2/Model B (2026-07-04): a picked autocomplete term is free-text, so it writes `serviceQ`
    // (the ONLY thing the query input ever binds to now) , it never touches `category`.
    setServiceQ(term.trim());
    setInputFocused(false);
    setActiveStep("service");
    collapse();
  }, [collapse]);
  const openSalon = React.useCallback((slug: string) => {
    if (!/^[a-z0-9-]+$/.test(slug)) return; // defensive: only ever push a safe slug shape
    router.push(`/${locale}/salon/${slug}`); close();
  }, [router, locale, close]);
  // Store tap dispatcher: on the MAP (onSalonLocate present) recenter to the pin; otherwise open
  // the salon page. ONE overlay, context-aware navigation (council 2026-07-01).
  const goSalon = React.useCallback((id: string, slug: string, name: string) => {
    if (onSalonLocate) { onSalonLocate({ id, slug, name }); close(); }
    else openSalon(slug);
  }, [onSalonLocate, openSalon, close]);
  const openLookItem = React.useCallback((id: string) => { router.push(`/${locale}/inspo/${id}`); close(); }, [router, locale, close]);
  // B3.3: picking a geocode candidate (street/place) selects that candidate's city , the SAME
  // mechanism cityList()'s SuggestRow uses (setStadt to the display name), no hand-rolled city
  // state. Returns to the composed service view (no auto-advance/auto-submit), matching the
  // existing city-pick behavior; the map (when open) re-centers on its own via the city param.
  const pickGeoCandidate = React.useCallback((c: { city_name: string }) => {
    setStadt(c.city_name);
    setServiceQ("");
    setInputFocused(false);
    setActiveStep("service");
    collapse();
  }, [collapse]);

  // i18n (all at top level)
  const searchHeadingTxt        = t("searchHeading");
  const locationHeadingTxt      = t("locationHeading");
  const dateHeadingTxt          = t("dateHeading");
  const fieldServiceLabelTxt    = t("fieldServiceLabel");
  const queryPlaceholderTxt     = t("queryPlaceholder");
  const fieldAddPlaceholderTxt  = t("fieldAddPlaceholder");
  const anytimeTxt              = t("anytime");
  const noPreferenceTxt         = t("noPreference");
  const noPreferenceSubTxt      = t("noPreferenceSub");
  const citySearchPlaceholderTxt = t("citySearchPlaceholder");
  const tabDatesTxt             = t("tabDates");
  const tabFlexibleTxt          = t("tabFlexible");
  const uhrzeitTxt              = t("uhrzeitLabel");
  const todayTxt                = t("today");
  const tomorrowTxt             = t("tomorrow");
  const flexThisWeekTxt         = t("flexThisWeek");
  const flexWeekendTxt          = t("flexWeekend");
  const flexThisMonthTxt        = t("flexThisMonth");
  const flexFlexibleTxt         = t("flexFlexible");
  const periodForenoonTxt       = t("periodForenoon");
  const periodAfternoonShortTxt = t("periodAfternoonShort");
  const periodEveningShortTxt   = t("periodEveningShort");
  const resetTxt                = t("reset");
  const submitTxt               = t("submit");
  const closeTxt                = t("close");
  const backTxt                 = t("back");
  const recentLabelTxt          = t("recentLabel");
  const storesLabelTxt          = t("storesLabel");
  const categoriesLabelTxt      = t("categoriesLabel");
  const groupSalonsTxt          = t("groupSalons");
  const groupStylistsTxt        = t("groupStylists");
  const placesLabelTxt          = t("placesLabel");
  const looksLabelTxt           = t("looksLabel");
  const forYouTxt               = t("forYou");
  const seeAllResultsTxt        = t("seeAllResults");

  const flexDates = React.useMemo(
    () => [todayTxt, tomorrowTxt, flexThisWeekTxt, flexWeekendTxt, flexThisMonthTxt, flexFlexibleTxt],
    [todayTxt, tomorrowTxt, flexThisWeekTxt, flexWeekendTxt, flexThisMonthTxt, flexFlexibleTxt],
  );
  const timeChips = React.useMemo(() => [
    { label: periodForenoonTxt,       urlVal: PERIOD_CHIP_TO_URL[periodForenoonTxt]       ?? "morning"   },
    { label: periodAfternoonShortTxt, urlVal: PERIOD_CHIP_TO_URL[periodAfternoonShortTxt] ?? "afternoon" },
    { label: periodEveningShortTxt,   urlVal: PERIOD_CHIP_TO_URL[periodEveningShortTxt]   ?? "evening"   },
  ], [periodForenoonTxt, periodAfternoonShortTxt, periodEveningShortTxt]);

  // A2/Model B (2026-07-04): the collapsed "service" row (shown while on the location/date
  // step) must reflect BOTH independent slices , the picked category's label AND the typed
  // query , not just one of them. Falls back to the legacy `service` value (a picked salon
  // name/autocomplete term) when neither is set.
  const categoryLabel = React.useMemo(
    () => CATEGORY_PILLS.find((c) => c.slug === category)?.label ?? "",
    [category],
  );
  const serviceRowValue = React.useMemo(
    () => [categoryLabel, serviceQ.trim()].filter(Boolean).join(" ") || service,
    [categoryLabel, serviceQ, service],
  );

  const stepMeta = React.useMemo((): Record<Step, { label: string; value: string; placeholder: string }> => ({
    service:  { label: fieldServiceLabelTxt,  value: serviceRowValue, placeholder: queryPlaceholderTxt     },
    location: { label: locationHeadingTxt,    value: stadt && stadt !== ALL_CITIES_PARAM ? stadt : noPreferenceTxt, placeholder: fieldAddPlaceholderTxt },
    date:     { label: dateHeadingTxt,        value: dateLabel,  placeholder: anytimeTxt              },
  }), [fieldServiceLabelTxt, serviceRowValue, queryPlaceholderTxt, locationHeadingTxt, stadt, noPreferenceTxt, fieldAddPlaceholderTxt, dateHeadingTxt, dateLabel, anytimeTxt]);

  const visibleRecents = React.useMemo(() => recent.filter((_, i) => !hiddenRecents.has(i)), [recent, hiddenRecents]);
  const filteredCities = React.useMemo(() => SEARCH_CITIES.filter((c) => c.toLowerCase().includes(cityQ.toLowerCase())), [cityQ]);

  const collapsedRow = (s: Step) => (
    <button key={s} onClick={() => openStep(s)}
      className="flex h-14 w-full items-center justify-between rounded-[20px] bg-white px-4 text-left shadow-[0_16px_48px_rgba(10,10,10,0.10)]">
      <span className="text-[14px] font-medium text-s-ink-2">{stepMeta[s].label}</span>
      <span className={`truncate pl-3 text-[14px] ${stepMeta[s].value ? "font-semibold text-s-ink" : "text-s-ink-3"}`}>
        {stepMeta[s].value || stepMeta[s].placeholder}
      </span>
    </button>
  );

  const serviceBar = (
    <div className="flex h-12 items-center gap-2.5 rounded-[16px] border border-s-border bg-white px-4">
      {inputFocused ? (
        <button onClick={() => { setInputFocused(false); collapse(); }} aria-label={backTxt}
          className="grid h-6 w-6 shrink-0 place-items-center text-s-ink">
          <ArrowLeft size={20} strokeWidth={2} />
        </button>
      ) : (
        <span className="grid h-6 w-6 shrink-0 place-items-center">
          <Search size={19} strokeWidth={2} className="text-s-ink-3" />
        </span>
      )}
      {/* A2/Model B (2026-07-04): the input ALWAYS binds to `serviceQ` only (never `service`),
          focused or not , the free-text query and the category (pill row above) are two fully
          independent state slices now, so there's nothing left to swap on focus. */}
      <input ref={(el) => { serviceRef.current = el; if (serviceInputRef) serviceInputRef.current = el; }} value={serviceQ}
        onFocus={() => { setInputFocused(true); grow(1); }}
        onChange={(e) => setServiceQ(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSubmit(); } }}
        enterKeyHint="search"
        placeholder={queryPlaceholderTxt} aria-label={queryPlaceholderTxt}
        className="min-w-0 flex-1 border-0 bg-transparent px-0 text-[15px] text-s-ink placeholder:text-s-ink-3 focus:outline-none focus-visible:border-s-border focus-visible:shadow-none focus-visible:outline-none" />
      {serviceQ.length > 0 && (
        <button onClick={() => { setServiceQ(""); serviceRef.current?.focus(); }}
          aria-label="Eingabe loeschen" className="shrink-0 text-s-ink-3">
          <X size={18} strokeWidth={2.2} />
        </button>
      )}
    </div>
  );

  const serviceSuggestions = () => {
    if (typing) {
      if (loading && !hasResults && styleTerms.length === 0)
        return <div className="space-y-2 pt-1">{[0,1,2].map((i) => <Skeleton key={i} height={48} rounded={14} />)}</div>;

      // Autocomplete completions: style-name terms FIRST, then service names, merged so the
      // "similar" list stays rich even when style-suggest returns only the query term itself.
      // Minus the raw query (it always leads the list). Deduped case-insensitively, capped.
      const qNorm = serviceQ.trim().toLowerCase();
      const rawCompletions = [
        ...styleTerms.map((s) => s.term),
        ...results.services.map((s) => (locale === "en" ? s.name_en || s.name_de : s.name_de)),
      ];
      const acTerms = Array.from(new Set(rawCompletions.map((x) => x.trim()).filter(Boolean)))
        .filter((x) => x.toLowerCase() !== qNorm)
        .slice(0, 5);
      const looks = inspoLooks; // real Inspo-feed looks (rich images), not style-suggest thumbs

      return (
        <>
          {/* Autocomplete , the query + similar terms as clean ink rows (traditional search) */}
          <div className="divide-y divide-s-border">
            <AutocompleteRow label={serviceQ.trim()} primary onClick={() => handleSubmit()} />
            {acTerms.map((term) => (
              <AutocompleteRow key={term} label={term} onClick={() => searchTerm(term)} />
            ))}
          </div>

          {/* mockup-ok: B3.3 , street/place geocode candidates, restricted to enabled cities.
              Reuses the EXISTING suggestion-row grammar 1:1 (SuggestRow + SectionLabel, same as
              every other group on this screen) and the codebase's existing Loader2/animate-spin
              spinner convention (SearchTemplate.tsx "load more"), so no new visual pattern is
              introduced , purely functional wiring, not a design decision needing a mockup. ALL
              matching candidates render as separate rows (never a blind auto-select) so a street
              name that exists in multiple enabled cities shows as a real pick-list; a single
              candidate still renders as one tappable row. Empty candidates render nothing here ,
              falls through to the other suggestion groups, never an error state. */}
          {(geoCandidates.length > 0 || geoLoading) && (
            <>
              <div className="mt-4 flex items-center gap-2">
                <SectionLabel className="!mb-0">{placesLabelTxt}</SectionLabel>
                {geoLoading && <Loader2 size={13} strokeWidth={2.2} className="animate-spin text-s-ink-3" aria-hidden />}
              </div>
              {geoCandidates.map((c) => (
                <SuggestRow key={`${c.label}|${c.city_slug}`} name={c.label} Icon={MapPin}
                  onClick={() => pickGeoCandidate(c)} />
              ))}
            </>
          )}

          {/* Salons , the focal, bookable result. Rich card + rating + area + from-price. */}
          {results.salons.length > 0 && (
            <>
              <SectionLabel className="mt-4">{groupSalonsTxt}</SectionLabel>
              <div className="flex flex-col gap-2.5">
                {results.salons.map((s) => (
                  // Store tap: mark it selected (fill the search + remember it). On the MAP,
                  // recenter to the pin instead of following the card's Link to the salon page
                  // (capture-phase preventDefault cancels the Link); otherwise the Link opens it.
                  <div key={s.id} onClickCapture={(e) => {
                    setService(s.name); push({ service: s.name, city: stadt || undefined });
                    if (onSalonLocate) { e.preventDefault(); e.stopPropagation(); onSalonLocate({ id: s.id, slug: s.slug, name: s.name }); close(); }
                  }}>
                    <SalonResultCard
                      variant="suggest"
                      slug={s.slug}
                      name={s.name}
                      locale={locale}
                      rating={s.average_rating}
                      photoUrl={s.cover_photo_url}
                      address={s.address}
                      priceFromCHF={s.from_price}
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={() => handleSubmit()}
                className="mt-2 flex w-full items-center justify-center gap-1 py-2 text-[13px] font-semibold text-s-ink active:scale-[0.98]"
              >
                {seeAllResultsTxt} <ChevronRight size={15} strokeWidth={2.2} />
              </button>
            </>
          )}

          {/* Stylists , preserved capability (search by name); compact rows. */}
          {results.stylists.length > 0 && (
            <>
              <SectionLabel className="mt-4">{groupStylistsTxt}</SectionLabel>
              {results.stylists.map((s) => (
                <SuggestRow key={s.id} name={s.name} sub={s.salon_name} Icon={User}
                  onClick={() => openSalon(s.salon_slug)} />
              ))}
            </>
          )}

          {/* Looks , query-related Inspo looks as a compact strip (B1); each opens its look. */}
          {looks.length > 0 && (
            <>
              <SectionLabel className="mt-4">{looksLabelTxt}</SectionLabel>
              <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1">
                {looks.map((l) => (
                  <div key={l.id} className="w-[116px] shrink-0">
                    <LookCard image={l.image} title={l.title} onClick={() => openLookItem(l.id)} />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Für dich , DNA-personalized looks fill the bottom so short results never read empty (C). */}
          {forYouLooks.length > 0 && (
            <>
              <SectionLabel className="mt-5">{forYouTxt}</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                {forYouLooks.map((l) => (
                  <LookCard key={l.id} image={l.image} title={l.title} onClick={() => openLookItem(l.id)} />
                ))}
              </div>
            </>
          )}
        </>
      );
    }
    return (
      <>
        {visibleRecents.length > 0 && (<>
          <SectionLabel>{recentLabelTxt}</SectionLabel>
          {visibleRecents.map((r, i) => (
            <SuggestRow key={`${recentLabel(r)}-${i}`} name={recentLabel(r)} sub={r.city || r.date || ""} Icon={Clock}
              onClick={() => handleRecentClick(r)} onRemove={() => setHiddenRecents((prev) => new Set([...prev, i]))} />
          ))}
        </>)}
        <SectionLabel className="mt-3">{storesLabelTxt}</SectionLabel>
        {/* A Beliebte Store is a specific salon , tapping JUMPS straight to it (marks it selected
            + opens the store page), it does NOT advance to the location step (owner). */}
        {FEATURED_SALONS.map((sl) => <SuggestRow key={sl.id} name={sl.name} sub={sl.address} Icon={Store}
          onClick={() => { setService(sl.name); push({ service: sl.name, city: stadt || undefined }); goSalon(sl.id, sl.slug, sl.name); }} />)}
        <SectionLabel className="mt-3">{categoriesLabelTxt}</SectionLabel>
        {/* A2/Model B (2026-07-04): this idle-state category shortcut no longer clears the typed
            query , it only sets `service` (feeds ?category=/?service= via buildParams,
            unchanged), same as picking the pill row never clears `serviceQ`. */}
        {CATEGORIES.map((c) => <SuggestRow key={c.label} name={c.label} sub={c.count} Icon={c.icon} onClick={() => { setService(c.label); advance("service"); }} />)}
        {/* Für dich , replaces the old Trending chips with DNA-personalized looks (popular for
            logged-out). Tapping a look opens it in Inspo. */}
        {forYouLooks.length > 0 && (
          <>
            <SectionLabel className="mt-3">{forYouTxt}</SectionLabel>
            <div className="grid grid-cols-2 gap-3 pb-2 pt-1">
              {forYouLooks.map((l) => (
                <LookCard key={l.id} image={l.image} title={l.title} onClick={() => openLookItem(l.id)} />
              ))}
            </div>
          </>
        )}
      </>
    );
  };

  const cityList = () => (
    <>
      {/* Explicit "everywhere": emit city=all so it isn't re-defaulted to the launch city. */}
      {/* Owner 2026-07-01 #7 fix: picking a city returns to the composed view (city shows as a
          collapsed row) instead of AUTO-ADVANCING to the date step , which replaced the city list
          with the calendar and read as "the city selector disappears in the middle". No auto-jump;
          the user taps Wann? or Suchen when ready. */}
      <SuggestRow name={noPreferenceTxt} sub={noPreferenceSubTxt} Icon={Globe} onClick={() => { setStadt(ALL_CITIES_PARAM); setCityQ(""); openStep("service"); }} />
      {filteredCities.map((c) => <SuggestRow key={c} name={c} img={CITY_ICONS[c]} Icon={MapPin} onClick={() => { setStadt(c); setCityQ(""); openStep("service"); }} />)}
    </>
  );

  // selected-ok: bg-s-ink is the ONE primary commit CTA, not a selected state
  const footerInner = (
    <div className="flex items-center justify-between px-5 pb-[max(14px,env(safe-area-inset-bottom))] pt-3">
      <button onClick={reset} className="text-[14px] font-semibold text-s-ink underline-offset-4 hover:underline">{resetTxt}</button>
      <button onClick={handleSubmit} className="flex items-center gap-2 rounded-full bg-s-ink px-6 py-3 font-heading text-[15px] font-bold text-white active:scale-[0.98]" /* selected-ok: primary commit CTA */>
        <Search size={16} strokeWidth={2.2} />{submitTxt}
      </button>
    </div>
  );

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && [
        <motion.div key="scrim" onClick={close} className="fixed inset-0 z-[100] bg-s-ink/10 backdrop-blur-xl"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.3, ease: EASE }} />,

        <motion.button key="closeX" onClick={close} aria-label={closeTxt}
          className="fixed right-4 top-[max(14px,env(safe-area-inset-top))] z-[102] grid h-9 w-9 place-items-center rounded-full border border-s-border bg-white text-s-ink"
          style={{ opacity: xOpacity }} initial={{ opacity: 0 }} exit={{ opacity: 0 }}>
          <X size={17} strokeWidth={2.2} />
        </motion.button>,

        <motion.div key="sheet" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
          transition={reduce ? { duration: 0 } : OPEN_T}
          // mockup-ok: date step = a content-height bottom sheet (top:auto) so the card hugs the
          // calendar and grows on date-pick, instead of a tall sheet with dead space. maxHeight caps it.
          style={{ top: activeStep === "date" ? "auto" : cropTop, maxHeight: activeStep === "date" ? "calc(100dvh - 12px)" : undefined }}
          className="fixed inset-x-0 bottom-0 z-[101] flex flex-col overflow-hidden bg-transparent">

          <AnimatePresence mode="wait" initial={false}>
          {activeStep === "service" ? (
            <motion.div key="service" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: reduce ? 0 : 0.24, ease: EASE }} className="flex min-h-0 flex-1 flex-col">
              <motion.div style={{ marginLeft: cardMx, marginRight: cardMx, borderTopLeftRadius: cardRadius, borderTopRightRadius: cardRadius, borderBottomLeftRadius: cardRadiusBottom, borderBottomRightRadius: cardRadiusBottom, boxShadow: "0 18px 50px rgba(10,10,10,0.13)" }}
                className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
                <motion.div style={{ height: headingH, opacity: headingOp }} className="shrink-0 overflow-hidden">
                  <h2 className="px-4 pb-1 pt-4 font-heading text-[24px] font-bold leading-tight tracking-[-0.02em] text-s-ink">{searchHeadingTxt}</h2>
                </motion.div>
                {/* A2/Model B (2026-07-04): the category pill row sits ABOVE the query input,
                    results-only (showCategoryPills). Picking a pill writes ONLY `category` , it
                    never reads or clears `serviceQ` (the free-text query below it). */}
                {showCategoryPills && (
                  <div className="shrink-0 px-3 pb-2 pt-3">
                    <CategoryPillsRow active={category} onSelect={setCategory} ariaLabel={categoriesLabelTxt} />
                  </div>
                )}
                <div className="shrink-0 px-3 pb-1 pt-4">{serviceBar}</div>
                <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-1"
                  onScroll={(e) => { expand.set(clamp01(e.currentTarget.scrollTop / EXPAND_DIST)); }}>
                  {serviceSuggestions()}
                </div>
              </motion.div>
              <motion.div style={{ height: stepsH, opacity: stepsOp }} className="overflow-hidden px-3">
                <div className="pt-2.5">{collapsedRow("location")}</div>
                <div className="pt-2.5">{collapsedRow("date")}</div>
              </motion.div>
              <motion.div style={{ height: footerH, opacity: stepsOp }} className="shrink-0 overflow-hidden">
                {footerInner}
              </motion.div>
            </motion.div>
          ) : (
            <motion.div key={activeStep} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: reduce ? 0 : 0.26, ease: EASE }}
              className="flex min-h-0 flex-1 flex-col px-3 pt-3">
              {STEPS.map((s) =>
                s !== activeStep ? (
                  <div key={s} className="mb-2.5 shrink-0">{collapsedRow(s)}</div>
                ) : s === "location" ? (
                  <div key={s} className="mb-2.5 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[20px] bg-white p-4 shadow-[0_16px_48px_rgba(10,10,10,0.10)]">
                    <h2 className="mb-3 shrink-0 font-heading text-[24px] font-bold leading-tight tracking-[-0.02em] text-s-ink">{locationHeadingTxt}</h2>
                    <div className="mb-2 flex h-12 shrink-0 items-center gap-2 rounded-[14px] border border-s-border bg-white px-3.5">
                      <Search size={18} strokeWidth={2} className="shrink-0 text-s-ink-3" />
                      <input ref={cityRef} value={cityQ} onChange={(e) => setCityQ(e.target.value)}
                        placeholder={citySearchPlaceholderTxt} aria-label={citySearchPlaceholderTxt}
                        className="min-w-0 flex-1 border-0 bg-transparent px-0 text-[15px] text-s-ink placeholder:text-s-ink-3 focus:outline-none focus-visible:border-s-border focus-visible:shadow-none focus-visible:outline-none" />
                      {cityQ.length > 0 && (
                        <button onClick={() => { setCityQ(""); cityRef.current?.focus(); }} aria-label="Eingabe loeschen" className="shrink-0 text-s-ink-3">
                          <X size={18} strokeWidth={2.2} />
                        </button>
                      )}
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{cityList()}</div>
                  </div>
                ) : (
                  <div key={s} className="mb-2.5 flex flex-col overflow-hidden rounded-[20px] bg-white px-4 pb-3 pt-4 shadow-[0_16px_48px_rgba(10,10,10,0.10)]">
                    <h2 className="mb-2 shrink-0 font-heading text-[24px] font-bold leading-tight tracking-[-0.02em] text-s-ink">{dateHeadingTxt}</h2>
                    <div className="relative mb-3 flex shrink-0 rounded-full bg-s-bg-sunken p-1">
                      <motion.div layout transition={reduce ? { duration: 0 } : { duration: 0.28, ease: EASE }}
                        className="absolute inset-y-1 w-[calc(50%-4px)] rounded-full bg-white shadow-sm"
                        style={{ left: dateTab === "daten" ? 4 : "calc(50% + 0px)" }} />
                      <button onClick={() => setDateTab("daten")}
                        className={`relative z-10 flex-1 rounded-full py-2 text-center text-[13px] transition-colors ${dateTab === "daten" ? "font-semibold text-s-ink" : "font-medium text-s-ink-3"}`}>
                        {tabDatesTxt}
                      </button>
                      <button onClick={() => setDateTab("flexibel")}
                        className={`relative z-10 flex-1 rounded-full py-2 text-center text-[13px] transition-colors ${dateTab === "flexibel" ? "font-semibold text-s-ink" : "font-medium text-s-ink-3"}`}>
                        {tabFlexibleTxt}
                      </button>
                    </div>
                    <div ref={dateScrollRef} className="overscroll-contain">
                      <AnimatePresence mode="wait" initial={false}>
                        {dateTab === "daten" ? (
                          <motion.div key="daten" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.18 }}>
                            <div className="mb-2 flex items-center justify-between">
                              <p className="font-heading text-[17px] font-bold capitalize text-s-ink">
                                {shownMonth.toLocaleDateString("de-CH", { month: "long" })} {shownMonth.getFullYear()}
                              </p>
                              <div className="flex items-center gap-1">
                                <button onClick={() => setMonthOffset((o) => Math.max(0, o - 1))} disabled={monthOffset <= 0} aria-label="Vorheriger Monat"
                                  className="grid h-9 w-9 place-items-center rounded-full text-s-ink hover:bg-s-bg-sunken disabled:opacity-25">
                                  <ChevronLeft size={20} strokeWidth={2} />
                                </button>
                                <button onClick={() => setMonthOffset((o) => Math.min(maxMonthOffset, o + 1))} disabled={monthOffset >= maxMonthOffset} aria-label="Naechster Monat"
                                  className="grid h-9 w-9 place-items-center rounded-full text-s-ink hover:bg-s-bg-sunken disabled:opacity-25">
                                  <ChevronRight size={20} strokeWidth={2} />
                                </button>
                              </div>
                            </div>
                            <div className="mb-1 grid grid-cols-7 text-center text-[12px] font-medium text-s-ink-3">
                              {WEEKDAYS.map((w, i) => <span key={i}>{w}</span>)}
                            </div>
                            <MonthGrid monthDate={shownMonth} now={now} windowEnd={windowEnd} selKey={selKey}
                              onPick={(key, label) => {
                                if (selKey === key) { setSelKey(null); setIsoDate(""); setDateLabel(""); setZeitPeriod(""); } // tap again = deselect
                                else { setSelKey(key); setIsoDate(keyToISO(key)); setDateLabel(label); }
                              }} />
                            {/* mockup-ok: time picker pops up + grows the card on date-pick (owner-approved,
                                "make it smoother"). framer-motion height:auto is smoother than the max-h clamp. */}
                            <AnimatePresence initial={false}>
                              {selKey && (
                                <motion.div key="uhrzeit" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                  transition={reduce ? { duration: 0 } : { height: { duration: 0.34, ease: EASE }, opacity: { duration: 0.24, ease: EASE } }}
                                  className="overflow-hidden">
                                  <p className="mb-2 mt-3 text-[13px] font-semibold text-s-ink">{uhrzeitTxt}</p>
                                  <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                                    {timeChips.map(({ label, urlVal }) => {
                                      const picked = zeitPeriod === urlVal;
                                      return (
                                        <button key={label} onClick={() => setZeitPeriod((cur) => cur === urlVal ? "" : urlVal)}
                                          className={`shrink-0 rounded-full border px-4 py-2 text-[13px] font-medium transition-colors ${picked ? "border-s-accent bg-s-accent text-white" /* selected-ok: period chip */ : "border-s-border text-s-ink-2 hover:bg-s-bg-sunken"}`}>
                                          {label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        ) : (
                          <motion.div key="flexibel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.18 }}
                            className="grid grid-cols-2 gap-2.5 pt-1">
                            {/* selected-ok: blue fill for date/slot chips (design contract) */}
                            {flexDates.map((dd) => (
                              <button key={dd} onClick={() => { setDateLabel(dd); setIsoDate(""); setSelKey(null); }}
                                className={`rounded-2xl border py-4 text-center text-[14px] font-medium transition-colors ${dateLabel === dd ? "border-s-accent bg-s-accent font-semibold text-white" /* selected-ok: flex date chip */ : "border-s-border text-s-ink-2 hover:bg-s-bg-sunken"}`}>
                                {dd}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                ),
              )}
              <div className="shrink-0">{footerInner}</div>
            </motion.div>
          )}
          </AnimatePresence>
        </motion.div>,
      ]}
    </AnimatePresence>,
    document.body,
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`mb-1 text-[13px] font-semibold text-s-ink ${className}`}>{children}</p>;
}

// A2/Model B (2026-07-04): persistent category pill row, results-only (showCategoryPills).
// mockup-ok: verbatim classes ported from Header.tsx's ALREADY-SHIPPED mobile category-tab
// row (L807-858) and the owner-approved /dev/search-model-b mockup (design source of truth
// for this feature) , same role="tablist"/role="tab" + aria-selected pattern, same selected
// state (locked gray-sunken, never blue/ink). Tapping the active pill again deselects to
// "any category" (matching the Model B mockup's toggle behavior) , it never touches serviceQ.
function CategoryPillsRow({ active, onSelect, ariaLabel }: { active: string; onSelect: (slug: string) => void; ariaLabel: string }) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="flex items-center gap-2 overflow-x-auto scrollbar-none" // mockup-ok
      style={{ scrollbarWidth: "none" }}
    >
      {CATEGORY_PILLS.map((c) => {
        const isActive = c.slug === active;
        return (
          <button
            key={c.slug}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(isActive ? "" : c.slug)}
            className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 font-body text-[15px] leading-none transition-colors duration-150 ease-glide ${isActive ? "border-s-bg-sunken bg-s-bg-sunken font-semibold text-s-ink" /* mockup-ok: locked selected state */ : "border-s-border bg-white font-medium text-s-ink" /* mockup-ok */}`}
          >
            {c.iconSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.iconSrc} alt="" className="h-[22px] w-[22px] shrink-0 object-contain" aria-hidden />
            ) : null}
            {c.label}
          </button>
        );
      })}
    </div>
  );
}

// Compact Inspo look card: fixed 3:4 photo + style name below, whole card taps to the look.
// The uniform fixed aspect suits the overlay's strip + 2-col grids (the /inspo feed keeps
// ItemCard's natural-aspect masonry). No heart here , owner picked the name-below card.
function LookCard({ image, title, onClick }: { image: string; title: string; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label={title} className="group flex w-full flex-col gap-1.5 text-left active:scale-[0.99]">
      <span className="block w-full overflow-hidden rounded-[14px] bg-s-bg-sunken" style={{ aspectRatio: "3 / 4" }}>
        {image ? <img src={image} alt="" loading="lazy" className="h-full w-full object-cover" /> : null}
      </span>
      <span className="truncate px-0.5 text-[13px] font-semibold text-s-ink">{title}</span>
    </button>
  );
}

// Traditional-search autocomplete row: magnifier + ink term + up-left "insert" arrow.
// `primary` weights the raw-query row above the similar terms. Not a grey pill.
function AutocompleteRow({ label, primary, onClick }: { label: string; primary?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 py-2.5 text-left">
      <Search size={16} strokeWidth={2} className="shrink-0 text-s-ink-3" />
      <span className={`min-w-0 flex-1 truncate text-[14px] text-s-ink ${primary ? "font-semibold" : "font-medium"}`}>{label}</span>
      <ArrowUpLeft size={15} strokeWidth={2} className="shrink-0 text-s-ink-3" />
    </button>
  );
}


function MonthGrid({ monthDate, now, windowEnd, selKey, onPick }: {
  monthDate: Date; now: Date; windowEnd: Date; selKey: string | null;
  onPick: (key: string, label: string) => void;
}) {
  const y = monthDate.getFullYear(), m = monthDate.getMonth();
  const monthLong = monthDate.toLocaleDateString("de-CH", { month: "long" });
  const cells = buildMonthGrid(monthDate);
  const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const windowMid = windowEnd.getTime();
  return (
    <div className="mb-2 grid grid-cols-7 gap-y-0.5">
      {cells.map((d, i) => {
        if (d === null) return <div key={i} />;
        const key = `${y}-${m}-${d}`;
        const ts = new Date(y, m, d).getTime();
        const disabled = ts < todayMid || ts > windowMid;
        const isToday = ts === todayMid;
        // selected-ok: locked date-fill is blue s-accent (design contract)
        const selected = selKey === key;
        return (
          <div key={i} className="flex justify-center">
            {disabled ? (
              <span className="grid h-9 w-9 place-items-center text-[14px] text-s-ink-3/35">{d}</span>
            ) : (
              <button onClick={() => onPick(key, `${d}. ${monthLong}`)}
                className={`grid h-9 w-9 place-items-center rounded-full text-[14px] transition-colors ${selected ? "bg-s-accent font-bold text-white" /* selected-ok: date cell */ : isToday ? "font-bold text-s-accent" : "font-medium text-s-ink hover:bg-s-bg-sunken"}`}>
                {d}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SuggestRow({ name, sub, Icon, img, onClick, onRemove }: {
  name: string; sub?: string; Icon?: LucideIcon; img?: string;
  onClick: () => void; onRemove?: () => void;
}) {
  return (
    <div className="flex w-full items-center gap-3.5 rounded-2xl pr-1 hover:bg-s-bg-sunken">
      <button onClick={onClick} className="flex min-w-0 flex-1 items-center gap-3.5 py-2.5 text-left">
        {img ? (
          <img src={img} alt="" className="h-12 w-12 shrink-0 object-contain" />
        ) : (
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-s-bg-sunken text-s-ink-2">
            {Icon ? <Icon size={20} strokeWidth={1.9} /> : null}
          </span>
        )}
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-semibold text-s-ink">{name}</span>
          {sub ? <span className="block truncate text-[13px] text-s-ink-3">{sub}</span> : null}
        </span>
      </button>
      {onRemove && (
        <button onClick={onRemove} aria-label="Entfernen" className="grid h-8 w-8 shrink-0 place-items-center text-s-ink-3">
          <X size={17} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
