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
  ChevronUp,
  Loader2,
  X,
  Search,
  MapPin,
  Clock,
  User,
  Store,
  Scissors,
  Globe,
  type LucideIcon,
} from "lucide-react";
import { SEARCH_CITIES, CITY_ICONS, ALL_CITIES_PARAM } from "@/lib/cities";
import { formatPrice } from "@/lib/format";
import { splitHighlight } from "@/lib/utils";
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
import { localizedField } from "@/lib/i18n/localized-field";

// ── Constants ────────────────────────────────────────────────────────────────

const EASE = [0.32, 0.72, 0, 1] as const;
// C2 (round 2, owner "did you actually analyze the motion frame by frame"): a 60fps recording
// of our own open proved the container morph LOOKS finished in ~167ms of a nominal 367ms,
// because EASE above is an extreme decelerate that spends most of the travel in the first ~15%
// of the time. EASE stays untouched (other things depend on it); this curve is scoped to ONLY
// the open/close container morph (`animate(openT, ...)` below) so the height travel actually
// fills its own duration instead of visually settling a third of the way in.
const MORPH_EASE = [0.4, 0, 0.2, 1] as const;
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
  /** A7/A8/A9 (2026-08-02 REOPENED): the tapped search bar's on-screen rect
   *  (getBoundingClientRect, captured by the caller BEFORE this overlay mounts), used as the
   *  open/close morph's starting/ending box so the sheet grows OUT OF the bar and shrinks BACK
   *  INTO it instead of sliding up from the bottom of the screen. Absent (e.g. the ?compose=1
   *  deep link, no bar was tapped) falls back to a plausible near-top rect. */
  originRect?: { top: number; left: number; width: number; height: number } | null;
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
  originRect = null,
}: SearchOverlayProps) {
  const router = useRouter();
  const t = useTranslations("ui.searchOverlay");
  // P13 (owner-approved 2026-07-16): the Services section's price row reuses the SAME
  // common.fromPrice pattern SalonCard.tsx already uses ("ab {price}" + formatPrice), no
  // new price-copy invented.
  const tCommon = useTranslations("common");
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

  // Live address for the idle-state "Beliebte Store" rows (FEATURED_SALONS is
  // identity-only, see searchFeatured.ts). Reuses the existing /api/salons?ids=
  // listing endpoint (no new API route) rather than the hardcoded, stale
  // addresses this used to ship with. One fetch per overlay open; null-safe
  // (SuggestRow only renders `sub` when it is set), so a slow/failed fetch
  // just shows the name until it resolves rather than a wrong address.
  const [featuredAddress, setFeaturedAddress] = React.useState<Record<string, string>>({});
  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const ids = FEATURED_SALONS.map((s) => s.id).join(",");
    fetch(`/api/salons?ids=${encodeURIComponent(ids)}&limit=${FEATURED_SALONS.length}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`status ${res.status}`))))
      .then((data: { items?: { id: string; address?: string | null }[] }) => {
        if (cancelled) return;
        const next: Record<string, string> = {};
        for (const item of data.items ?? []) if (item.address) next[item.id] = item.address;
        setFeaturedAddress(next);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[SearchOverlay] featured salons address fetch failed:", err);
      });
    return () => { cancelled = true; };
  }, [open]);

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
    // FIX 2026-08-01 (owner, third repeat, "when you click, it still doesn't fucking open"):
    // this component returns `null` on its very first render (`if (!mounted) return null` below,
    // the standard SSR-safe-portal pattern), and only paints the real JSX, including the
    // `<input ref={serviceRef}>` a few hundred lines down, on the SECOND render once the
    // `mounted` effect flips true. This effect used to depend on `[open]` only, so when this
    // overlay is opened WITH the keyboard (SearchTemplate's `?compose=1` handling,
    // `openSearchOverlay(true)`), it already carries `open === true` on that very first,
    // pre-mounted render, meaning this block DOES run then, but `serviceRef.current` is still
    // null (the input hasn't been rendered yet) so the rAF focus silently no-ops. By the time
    // `mounted` flips true and the input actually exists in the DOM, `open` has not changed
    // value across the two renders, so a `[open]`-only dependency array never re-fires this
    // effect and the focus call never runs again. Confirmed live: `document.activeElement` was
    // BODY after the tap. Adding `mounted` to the dependency array makes this effect re-run the
    // moment the real DOM exists, which is exactly when `serviceRef.current` first becomes a
    // real node worth calling `.focus()` on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mounted]);

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
  // THE SPEED LAW hard rule 2 exception (motion audit _plans/motion-audit/HOME_SEARCH_INSPO.md,
  // rows 75-76): headingH/stepsH/footerH/cardMx below drive REAL flex-space reallocation , as
  // the heading/collapsed-rows/footer shrink, their flex siblings (the results list, then this
  // card) grow to fill the freed space, and cardMx insets the card at rest. That reallocation is
  // inherent to CSS layout/flex sizing and has no transform/opacity equivalent: a transform
  // never changes how much space a FLEX SIBLING receives, so substituting one here would leave
  // dead space instead of the list actually gaining room. A faithful transform version needs a
  // two-layer/absolutely-positioned overlay rearchitecture of this whole scroll-expand system, a
  // structural rewrite, not a treatment fix, and out of safe scope for this pass. Left as an
  // honest, documented exception; unchanged below.
  const expand = useMotionValue(0); // mockup-ok: pre-existing, unchanged (comment-only edit above)
  const RESTING_TOP = 96; // mockup-ok: named copy of the pre-existing cropTop resting literal below
  const focusedTop = Math.max(safeTop + 6, 50); // mockup-ok: named copy of the pre-existing cropTop focused literal below
  const headingH = useTransform(expand, [0, 0.55], [HEADING_H, 0]); // mockup-ok: pre-existing
  const headingOp = useTransform(expand, [0, 0.42], [1, 0]); // mockup-ok: pre-existing
  // A2 (2026-08-02 REOPENED, owner-dictated port of the approved SEARCH_MORPH.md spec): the
  // category pill row is now wired into the SAME `expand` transform as the heading, so it
  // collapses away on focus instead of pinning the bar down (measured h=60 op=1 at rest,
  // SEARCH_MORPH.md "REOPENED"). Fully gone before the heading finishes (0-0.35 vs 0-0.55) so
  // the bar has already started rising when the heading fades. mockup-ok: worktree build of an
  // owner-dictated, spec'd fix (SEARCH_MORPH.md), not a live design exploration.
  const pillsH = useTransform(expand, [0, 0.35], [60, 0]); // mockup-ok: SEARCH_MORPH.md A2
  const pillsOp = useTransform(expand, [0, 0.3], [1, 0]); // mockup-ok: SEARCH_MORPH.md A2
  const xOpacity = useTransform(expand, [0.82, 1], [1, 0]); // mockup-ok: pre-existing
  const stepsOp = useTransform(expand, [0.4, 0.8], [1, 0]); // mockup-ok: pre-existing
  const stepsH = useTransform(expand, [0.4, 0.8], [ROW_H * 2 + 20, 0]); // mockup-ok: pre-existing
  const footerH = useTransform(expand, [0.4, 0.8], [FOOTER_H, 0]); // mockup-ok: pre-existing
  const cardMx = useTransform(expand, [0, 0.7], [12, 0]); // mockup-ok: pre-existing
  const cardRadius = useTransform(expand, [0, 0.7], [22, 18]); // mockup-ok: pre-existing
  // mockup-ok: fully expanded, the card sits flush to the viewport bottom, so the bottom corners
  // go SQUARE (rounded bottom corners against the screen edge look wrong , owner). Top stays rounded.
  const cardRadiusBottom = useTransform(expand, [0, 0.7], [22, 0]); // mockup-ok: pre-existing

  // A7/A8/A9 (2026-08-02 REOPENED, owner-dictated): the sheet used to hard-slide up from
  // `y:"100%"` (a bottom-sheet slide, SEARCH_MORPH.md "Standing law" names this rejected
  // pattern by name). It now morphs its own box (top/left/width/height) from the tapped search
  // bar's on-screen rect (`originRect`, captured by the caller before this overlay mounts) into
  // the resting sheet box, and reverses on close. `top` stays ONE continuous transform (the
  // hard rule): `openT` (open/close progress) and `expand` (in-sheet focus progress) are
  // combined into a single interpolation function below so there is still exactly one driver
  // of `top`, never a threshold swap. Durations measured from the owner's Airbnb recording
  // (SEARCH_MORPH.md "REFERENCE MEASURED"): open 367ms, close 333ms, both fired the instant
  // `open` flips so there is no scheduled delay before the first frame of motion (the owner's
  // named anti-goal is Airbnb's measured ~300ms gap). mockup-ok: worktree build of an
  // owner-dictated, spec'd fix (SEARCH_MORPH.md "REOPENED" + "REFERENCE MEASURED"), not a live
  // design exploration.
  const [viewport, setViewport] = React.useState({ w: 375, h: 812 });
  React.useEffect(() => {
    const measure = () => {
      const vv = window.visualViewport;
      setViewport({ w: vv?.width ?? window.innerWidth, h: vv?.height ?? window.innerHeight });
    };
    measure();
    window.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("resize", measure);
    };
  }, []);
  // No visible bar to point at (e.g. the ?compose=1 deep link) -> a plausible near-top rect
  // instead of the old bottom-of-screen slide.
  const origin = originRect ?? { top: 60, left: 16, width: Math.max(viewport.w - 32, 200), height: 56 };
  const openT = useMotionValue(open ? 1 : 0); // mockup-ok: SEARCH_MORPH.md A7/A8/A9
  const cropTop = useTransform([openT, expand], (latest) => { // mockup-ok: SEARCH_MORPH.md A7/A8/A9
    const [oT, ex] = latest as [number, number];
    if (oT < 1) return origin.top + (RESTING_TOP - origin.top) * oT;
    return RESTING_TOP + (focusedTop - RESTING_TOP) * ex;
  });
  const sheetLeft = useTransform(openT, [0, 1], [origin.left, 0]); // mockup-ok: SEARCH_MORPH.md A7/A8/A9
  const sheetWidth = useTransform(openT, [0, 1], [origin.width, viewport.w]); // mockup-ok: SEARCH_MORPH.md A7/A8/A9
  // C6 (round 2, "bottom is cut off"): port of an owner-dictated SEARCH_MORPH.md punch-list
  // fix, not a live design exploration. Measured cause: this used to interpolate ONLY on
  // openT, so once fully open its height stayed pinned to `viewport.h - RESTING_TOP` even
  // while the FOCUSED/typing state (`expand`) raises the sheet's top to `focusedTop` , the
  // bottom edge then sat short of the viewport (top moved up, height didn't grow to
  // compensate), the same gap `cardRadiusBottom`'s flush-bottom assumption already expects not
  // to exist. Mirrors cropTop's own piecewise shape (open morph 0->1, then focus progress on
  // top of that) so the sheet's bottom edge reaches the true viewport bottom in EITHER state,
  // one continuous transform, no threshold swap.
  const sheetHeight = useTransform([openT, expand], (latest) => { // mockup-ok: SEARCH_MORPH.md C6
    const [oT, ex] = latest as [number, number];
    const restingHeight = Math.max(viewport.h - RESTING_TOP, 200);
    if (oT < 1) return origin.height + (restingHeight - origin.height) * oT;
    const focusedHeight = Math.max(viewport.h - focusedTop, 200);
    return restingHeight + (focusedHeight - restingHeight) * ex;
  });
  const sheetOpacity = useTransform(openT, [0, 0.3, 1], [0, 0.4, 1]); // mockup-ok: SEARCH_MORPH.md A7/A8/A9
  // C3 (round 2, "X floats alone, off both specs"): port of an owner-dictated SEARCH_MORPH.md
  // punch-list fix. The close-X used to sit at a fixed `top:14px` with no relation to the
  // sheet. Derives its top from the SAME cropTop transform that drives the sheet, offset just
  // above the sheet's own top edge, so it moves WITH the sheet through the open/close morph
  // instead of floating independently in the blurred zone.
  const CLOSE_BTN = 44; // h-11 w-11: 44px touch-target floor + the design-system "circled X" size
  const CLOSE_BTN_GAP = 10; // px between the X and the sheet's top edge
  const closeXTop = useTransform(cropTop, (top) => Math.max(safeTop + 6, top - CLOSE_BTN - CLOSE_BTN_GAP)); // mockup-ok: SEARCH_MORPH.md C3
  React.useEffect(() => {
    const controls = animate(openT, open ? 1 : 0, reduce ? { duration: 0 } : { duration: open ? 0.367 : 0.333, ease: MORPH_EASE });
    return () => controls.stop();
  }, [open, reduce, openT]);
  // The sheet stays mounted a beat past `open=false` so its own close-morph (333ms) actually
  // gets to play before React removes the node; scrim/X keep their existing AnimatePresence
  // exit (unrelated, unchanged). mockup-ok: SEARCH_MORPH.md A7/A8/A9
  const [sheetOpen, setSheetOpen] = React.useState(open);
  React.useEffect(() => {
    if (open) { setSheetOpen(true); return; }
    if (reduce) { setSheetOpen(false); return; }
    const timer = setTimeout(() => setSheetOpen(false), 340);
    return () => clearTimeout(timer);
  }, [open, reduce]);

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
  const groupServicesTxt        = t("groupServices");
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
      <span className={`truncate pl-3 text-[14px] ${stepMeta[s].value ? "font-semibold text-s-ink" : "text-s-ink-2"}`}>
        {stepMeta[s].value || stepMeta[s].placeholder}
      </span>
    </button>
  );

  // A4 (2026-08-02 REOPENED, corrected round 2): PIL-measured against the owner's Airbnb
  // reference (SEARCH_MORPH.md "REFERENCE MEASURED"), the field does NOT get taller on focus
  // (55.0pt -> 54.3pt, unchanged, so h-12 stays). The dark 2px ink border this used to add on
  // `inputFocused` was REJECTED BY NAME (owner: "I don't like the focus room that you need. Not
  // at all. No. Stop.") , the bar keeps its normal 1px hairline in BOTH states now. The
  // width/inset growth is still handled by the existing cardMx collapse (12px margin -> 0),
  // untouched here. mockup-ok: SEARCH_MORPH.md C4
  const serviceBar = (
    <div className="flex h-12 items-center gap-2.5 rounded-[16px] border border-s-border bg-white px-4">
      {inputFocused ? (
        <button onClick={() => { setInputFocused(false); collapse(); }} aria-label={backTxt}
          className="grid h-6 w-6 shrink-0 place-items-center text-s-ink">
          <ArrowLeft size={20} strokeWidth={2} />
        </button>
      ) : (
        <span className="grid h-6 w-6 shrink-0 place-items-center">
          <Search size={19} strokeWidth={2} className="text-s-ink-2" />
        </span>
      )}
      {/* A2/Model B (2026-07-04): the input ALWAYS binds to `serviceQ` only (never `service`),
          focused or not , the free-text query and the category (pill row above) are two fully
          independent state slices now, so there's nothing left to swap on focus. */}
      {/* mockup-ok: !important preserves the existing look, not a new one. This bare `<input>`
          is deliberately invisible (border-0/bg-transparent) AND compact inside the pill's own
          chrome; the widened base input law (globals.css, 2026-07-17) now reaches bare inputs
          and also sets min-height:48px/padding:16px/font-size:16px, not just fill/border/radius,
          so all of it needs the `!` prefix or the pill balloons (V3-D-input-fill-2026-07-17). */}
      <input ref={(el) => { serviceRef.current = el; if (serviceInputRef) serviceInputRef.current = el; }} value={serviceQ}
        onFocus={() => { setInputFocused(true); grow(1); }}
        onChange={(e) => setServiceQ(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSubmit(); } }}
        enterKeyHint="search"
        placeholder={queryPlaceholderTxt} aria-label={queryPlaceholderTxt}
        className="min-w-0 flex-1 !border-0 !bg-transparent !min-h-0 !px-0 !text-[15px] text-s-ink placeholder:text-s-ink-2 focus:outline-none focus-visible:outline-none" />
      {/* A6 (2026-08-02 REOPENED): a fixed h-6 w-6 slot (same idea as the loader-dots slot
          below it) always mounted, only the button's presence inside toggles , the clear-X no
          longer changes the bar's own width when it mounts/unmounts while typing. mockup-ok: SEARCH_MORPH.md A6 */}
      <span className="grid h-6 w-6 shrink-0 place-items-center">
        {serviceQ.length > 0 ? (
          <button onClick={() => { setServiceQ(""); serviceRef.current?.focus(); }}
            aria-label="Eingabe loeschen" className="text-s-ink-2">
            <X size={18} strokeWidth={2.2} />
          </button>
        ) : null}
      </span>
      {/* P13 (owner-approved 2026-07-16): a quiet three-dot pulse loader while the suggest
          request is in flight, replacing any spinner at the input's right end. Fixed-size slot
          always mounted (only the dots' visibility toggles) so it never causes a layout jump. */}
      <span className="grid h-6 w-6 shrink-0 place-items-center" aria-hidden>
        {loading && typing ? <SuggestLoaderDots /> : null}
      </span>
    </div>
  );

  const serviceSuggestions = () => {
    if (typing) {
      if (loading && !hasResults && styleTerms.length === 0)
        return <div className="space-y-2 pt-1">{[0,1,2].map((i) => <Skeleton key={i} height={48} rounded={14} />)}</div>;

      // Autocomplete completions: style-name terms only (P13, 2026-07-16: service names moved
      // OUT of this flat list into their own titled "Services" section below, with price , they
      // no longer double up as a plain completion AND a grouped result row).
      // Minus the raw query (it always leads the list). Deduped case-insensitively, capped.
      const qNorm = serviceQ.trim().toLowerCase();
      const rawCompletions = styleTerms.map((s) => s.term);
      const acTerms = Array.from(new Set(rawCompletions.map((x) => x.trim()).filter(Boolean)))
        .filter((x) => x.toLowerCase() !== qNorm)
        .slice(0, 5);
      const looks = inspoLooks; // real Inspo-feed looks (rich images), not style-suggest thumbs
      // P13: locale-native "ab CHF X" price, the same tCommon("fromPrice")+formatPrice pattern
      // SalonCard.tsx already uses , no new price-copy invented.
      const currencyLocale = locale === "de" ? "de-CH" : locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : "en-CH";

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
                {geoLoading && <Loader2 size={13} strokeWidth={2.2} className="animate-spin text-s-ink-2" aria-hidden />}
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
                      matchQuery={serviceQ}
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={() => handleSubmit()}
                className="mt-2 flex w-full items-center justify-center gap-1 py-2 text-[13px] font-semibold text-s-ink transition-transform duration-150 active:scale-[0.98] active:duration-[80ms] active:ease-glide"
              >
                {seeAllResultsTxt} <ChevronRight size={15} strokeWidth={2.2} />
              </button>
            </>
          )}

          {/* Services , P13 (owner-approved 2026-07-16): its own titled section (Salons then
              Services, dashboard.html/search.html #bellstack recipe), name + "ab CHF X", the
              matched substring highlighted same as the Salons title above. */}
          {results.services.length > 0 && (
            <>
              <SectionLabel className="mt-4">{groupServicesTxt}</SectionLabel>
              {results.services.map((sv) => {
                const label = localizedField(sv as unknown as Record<string, unknown>, "name", locale);
                return (
                  <SuggestRow
                    key={sv.id}
                    name={<HighlightedText text={label} query={serviceQ} />}
                    sub={sv.price != null ? tCommon("fromPrice", { price: formatPrice(sv.price, currencyLocale) }) : undefined}
                    Icon={Scissors}
                    onClick={() => searchTerm(label)}
                  />
                );
              })}
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
        {FEATURED_SALONS.map((sl) => <SuggestRow key={sl.id} name={sl.name} sub={featuredAddress[sl.id]} Icon={Store}
          onClick={() => { setService(sl.name); push({ service: sl.name, city: stadt || undefined }); goSalon(sl.id, sl.slug, sl.name); }} />)}
        <SectionLabel className="mt-3">{categoriesLabelTxt}</SectionLabel>
        {/* A2/Model B (2026-07-04): this idle-state category shortcut no longer clears the typed
            query , it only sets `service` (feeds ?category=/?service= via buildParams,
            unchanged), same as picking the pill row never clears `serviceQ`. */}
        {CATEGORIES.map((c) => <SuggestRow key={c.label} name={c.label} Icon={c.icon} onClick={() => { setService(c.label); advance("service"); }} />)}
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
      <button onClick={handleSubmit} className="flex items-center gap-2 rounded-full bg-s-ink px-6 py-3 font-heading text-[15px] font-bold text-white transition-transform duration-150 active:scale-[0.98] active:duration-[80ms] active:ease-glide" /* selected-ok: primary commit CTA */>
        <Search size={16} strokeWidth={2.2} />{submitTxt}
      </button>
    </div>
  );

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && [
        <motion.div key="scrim" onClick={close} className="fixed inset-0 z-[100] bg-s-ink/10 backdrop-blur-xl"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.3, ease: EASE }} /* motion-ok: pre-existing backdrop fade, unchanged */ />,

        // C3 (round 2, "X too small and mis-placed"): port of an owner-dictated SEARCH_MORPH.md
        // punch-list fix. Was 36x36 at a fixed `top:14px`, floating alone in the blurred zone
        // with no relation to the sheet. Now h-11 w-11 (44px, the touch-target floor AND the
        // design-system 38px "circled X" grammar rounded up to the floor), right inset matches
        // the sheet's own resting right inset (12px, not the viewport's `right-4`=16px), and
        // `top` is derived from the sheet's own cropTop (closeXTop above) so it sits just above
        // the sheet's top edge and tracks it through the open/close morph.
        <motion.button key="closeX" onClick={close} aria-label={closeTxt}
          className="fixed right-3 z-[102] grid h-11 w-11 place-items-center rounded-full border border-s-border bg-white text-s-ink"
          style={{ opacity: xOpacity, top: closeXTop }} initial={{ opacity: 0 }} exit={{ opacity: 0 }} /* motion-ok: pre-existing close-X fade, unchanged */>
          <X size={18} strokeWidth={2.2} />
        </motion.button>,
      ]}
      {/* A7/A8/A9 (2026-08-02 REOPENED): top/left/width/height are continuously driven by
          cropTop/sheetLeft/sheetWidth/sheetHeight (openT composed with expand, declared above)
          instead of a declarative y:"100%"->0 slide, so the sheet grows OUT OF the tapped
          search bar on open and shrinks BACK INTO it on close , never a bottom-sheet slide.
          `sheetOpen` (not `open`) gates its mount so the 333ms close-morph gets to play before
          React removes the node; scrim/X above keep their own unrelated AnimatePresence exit. */}
      {sheetOpen && (
        <motion.div key="sheet"
          // mockup-ok: date step = a content-height bottom sheet (top:auto) so the card hugs the
          // calendar and grows on date-pick, instead of a tall sheet with dead space. maxHeight caps it.
          style={{
            top: activeStep === "date" ? "auto" : cropTop,
            left: activeStep === "date" ? 0 : sheetLeft,
            width: activeStep === "date" ? "100%" : sheetWidth,
            height: activeStep === "date" ? undefined : sheetHeight,
            maxHeight: activeStep === "date" ? "calc(100dvh - 12px)" : undefined,
            opacity: sheetOpacity,
          }}
          className="fixed bottom-0 z-[101] flex flex-col overflow-hidden bg-transparent">

          {/* C5 (round 2, "blurs out, then swaps"): was `mode="wait"` , the outgoing step fully
              exits (fades out, nothing on screen) BEFORE the incoming one starts, which is
              exactly the blank moment the owner is describing. `popLayout` (the same mode this
              file already uses one screen down for the typing/idle crossfade, line ~974) lets
              both animate at once: the exiting tree is pulled out of layout flow immediately so
              it doesn't block or reflow the incoming one, giving a continuous overlap instead of
              a sequential swap. Still ONE AnimatePresence, ONE key at a time , no new threshold,
              no second layout added. */}
          <AnimatePresence mode="popLayout" initial={false}>
          {activeStep === "service" ? (
            <motion.div key="service" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: reduce ? 0 : 0.24, ease: EASE }} className="flex min-h-0 flex-1 flex-col">
              <motion.div style={{ marginLeft: cardMx, marginRight: cardMx, borderTopLeftRadius: cardRadius, borderTopRightRadius: cardRadius, borderBottomLeftRadius: cardRadiusBottom, borderBottomRightRadius: cardRadiusBottom, boxShadow: "0 18px 50px rgba(10,10,10,0.13)" }}
                className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
                <motion.div style={{ height: headingH, opacity: headingOp }} className="shrink-0 overflow-hidden">
                  <h2 className="px-4 pb-1 pt-4 font-heading text-[24px] font-bold leading-tight tracking-[-0.02em] text-s-ink">{searchHeadingTxt}</h2>
                </motion.div>
                {/* A2/Model B (2026-07-04): the category pill row sits ABOVE the query input,
                    results-only (showCategoryPills). Picking a pill writes ONLY `category` , it
                    never reads or clears `serviceQ` (the free-text query below it).
                    A2 (2026-08-02 REOPENED): now wired into the SAME `expand` transform as the
                    heading (pillsH/pillsOp) so it collapses away on focus instead of pinning the
                    bar down , the padding lives on the INNER div (like the heading's own h2)
                    so the outer motion.div's height/opacity stay the only animated properties. */}
                {showCategoryPills && (
                  <motion.div style={{ height: pillsH, opacity: pillsOp }} className="shrink-0 overflow-hidden"> {/* mockup-ok: SEARCH_MORPH.md A2 */}
                    <div className="px-3 pb-2 pt-3">
                      <CategoryPillsRow active={category} onSelect={setCategory} ariaLabel={categoriesLabelTxt} />
                    </div>
                  </motion.div>
                )}
                <div className="shrink-0 px-3 pb-1 pt-4">{serviceBar}</div>
                {/* C6 (round 2, "bottom is cut off"): the footer/steps rows collapse away to 0
                    height in the focused/expanded state (footerH/stepsH above), so once
                    focused this scroller IS the bottom of the sheet , its own `pb-4` (16px)
                    didn't clear the safe-area inset on a device with a home indicator. */}
                <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-1"
                  onScroll={(e) => { expand.set(clamp01(e.currentTarget.scrollTop / EXPAND_DIST)); }}>
                  {/* A5 (2026-08-02 REOPENED): typing (>=2 chars) crossfades the suggestion
                      content instead of a hard switch , keyed on the idle/typing BOOLEAN (not
                      serviceQ), so a keystroke while already typing re-renders in place without
                      re-triggering the fade. popLayout pops the exiting block out of flow so the
                      entering one doesn't wait for it, giving a true crossfade. */}
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div key={typing ? "typing" : "idle"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.2, ease: EASE }} /* motion-ok: content crossfade between two already-in-place suggestion lists, not a page/element entrance */>
                      {serviceSuggestions()}
                    </motion.div>
                  </AnimatePresence>
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
                    {/* C7 (round 2, "does not expand or close"): root cause was that once a
                        step is active, its OWN heading had no click handler , the only way
                        back to the composed view was tapping the DIFFERENT "Suche" collapsed
                        row, which reads as broken (tapping the open row again did nothing).
                        Wiring the accordion-collapse the SEARCH_MORPH.md spec already names
                        ("tap an active title collapses it") onto the heading itself. */}
                    <button type="button" onClick={() => openStep("service")}
                      className="mb-3 flex shrink-0 items-center justify-between text-left">
                      <span className="font-heading text-[24px] font-bold leading-tight tracking-[-0.02em] text-s-ink">{locationHeadingTxt}</span>
                      <ChevronUp size={20} strokeWidth={2.2} className="text-s-ink-2" aria-hidden />
                    </button>
                    <div className="mb-2 flex h-12 shrink-0 items-center gap-2 rounded-[14px] border border-s-border bg-white px-3.5">
                      <Search size={18} strokeWidth={2} className="shrink-0 text-s-ink-2" />
                      {/* mockup-ok: !important preserves the existing look, not a new one; same
                          carve-out as the service query input above (V3-D-input-fill-2026-07-17). */}
                      <input ref={cityRef} value={cityQ} onChange={(e) => setCityQ(e.target.value)}
                        placeholder={citySearchPlaceholderTxt} aria-label={citySearchPlaceholderTxt}
                        className="min-w-0 flex-1 !border-0 !bg-transparent !min-h-0 !px-0 !text-[15px] text-s-ink placeholder:text-s-ink-2 focus:outline-none focus-visible:outline-none" />
                      {cityQ.length > 0 && (
                        <button onClick={() => { setCityQ(""); cityRef.current?.focus(); }} aria-label="Eingabe loeschen" className="shrink-0 text-s-ink-2">
                          <X size={18} strokeWidth={2.2} />
                        </button>
                      )}
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{cityList()}</div>
                  </div>
                ) : (
                  <div key={s} className="mb-2.5 flex flex-col overflow-hidden rounded-[20px] bg-white px-4 pb-3 pt-4 shadow-[0_16px_48px_rgba(10,10,10,0.10)]">
                    {/* C7: same accordion-collapse as the location heading above. */}
                    <button type="button" onClick={() => openStep("service")}
                      className="mb-2 flex shrink-0 items-center justify-between text-left">
                      <span className="font-heading text-[24px] font-bold leading-tight tracking-[-0.02em] text-s-ink">{dateHeadingTxt}</span>
                      <ChevronUp size={20} strokeWidth={2.2} className="text-s-ink-2" aria-hidden />
                    </button>
                    <div className="relative mb-3 flex shrink-0 rounded-full bg-s-bg-sunken p-1">
                      <motion.div layout transition={reduce ? { duration: 0 } : { duration: 0.28, ease: EASE }}
                        className="absolute inset-y-1 w-[calc(50%-4px)] rounded-full bg-white shadow-sm"
                        style={{ left: dateTab === "daten" ? 4 : "calc(50% + 0px)" }} />
                      <button onClick={() => setDateTab("daten")}
                        className={`relative z-10 flex-1 rounded-full py-2 text-center text-[13px] transition-colors ${dateTab === "daten" ? "font-semibold text-s-ink" : "font-medium text-s-ink-2"}`}>
                        {tabDatesTxt}
                      </button>
                      <button onClick={() => setDateTab("flexibel")}
                        className={`relative z-10 flex-1 rounded-full py-2 text-center text-[13px] transition-colors ${dateTab === "flexibel" ? "font-semibold text-s-ink" : "font-medium text-s-ink-2"}`}>
                        {tabFlexibleTxt}
                      </button>
                    </div>
                    <div ref={dateScrollRef} className="overscroll-contain">
                      <AnimatePresence mode="wait" initial={false}>
                        {dateTab === "daten" ? (
                          <motion.div key="daten" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.18 }}>
                            <div className="mb-2 flex items-center justify-between">
                              <p className="font-heading text-[17px] font-bold capitalize text-s-ink">
                                {shownMonth.toLocaleDateString(locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : locale === "en" ? "en-CH" : "de-CH", { month: "long" })} {shownMonth.getFullYear()}
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
                            <div className="mb-1 grid grid-cols-7 text-center text-[12px] font-medium text-s-ink-2">
                              {WEEKDAYS.map((w, i) => <span key={i}>{w}</span>)}
                            </div>
                            <MonthGrid monthDate={shownMonth} now={now} windowEnd={windowEnd} selKey={selKey} locale={locale}
                              onPick={(key, label) => {
                                if (selKey === key) { setSelKey(null); setIsoDate(""); setDateLabel(""); setZeitPeriod(""); } // tap again = deselect
                                else { setSelKey(key); setIsoDate(keyToISO(key)); setDateLabel(label); }
                              }} />
                            {/* mockup-ok: time picker pops up + grows the card on date-pick (owner-approved,
                                "make it smoother"). Was height:0->auto (THE SPEED LAW hard rule 2: never
                                animate height , motion audit HOME_SEARCH_INSPO.md row 81). Now a
                                grid-template-rows 0fr->1fr reveal: the TRACK size interpolates, not the
                                element's own layout-height property, so nothing forces the same per-frame
                                height reflow. Stays mounted (no AnimatePresence unmount) so `inert` keeps
                                the collapsed chips out of the tab order / AT tree in its place. */}
                            <div
                              inert={!selKey}
                              className="grid transition-[grid-template-rows] duration-[280ms] ease-glide"
                              style={{ gridTemplateRows: selKey ? "minmax(0,1fr)" : "minmax(0,0fr)" }}
                            >
                              <div
                                className="overflow-hidden transition-opacity duration-[280ms] ease-glide"
                                style={{ opacity: selKey ? 1 : 0 }}
                              >
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
                              </div>
                            </div>
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
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`mb-1 text-[13px] font-semibold text-s-ink ${className}`}>{children}</p>;
}

// P13 (owner-approved 2026-07-16): the quiet three-dot pulse loader recipe from
// taste-round2/search.html (.dots i , 4px dots, s-ink-2, staggered 150ms, ease infinite),
// replacing any spinner at the input's right end while the suggest request is in flight.
function SuggestLoaderDots() {
  return (
    <span className="flex items-center gap-[3px]">
      {[0, 1, 2].map((i) => (
        <motion.span // mockup-ok: P13 owner-approved loader recipe (search.html .dots i)
          key={i}
          className="h-1 w-1 rounded-full bg-s-ink-2"
          animate={{ opacity: [0.25, 1, 0.25], y: [0, -3, 0] }} // mockup-ok: pulse loop, not an entrance
          // WCAG 2.2.2 (Level A): was `repeat: Infinity`, an auto-starting loop with no bound, the
          // clearest exposure in the motion audit (HOME_SEARCH_INSPO.md row 97). Bounded to 3 total
          // cycles so the loop always ends inside 5s (worst case, the last-staggered dot at
          // i*0.15=0.3s delay + 3*1.2s = 3.9s) even if the suggest request is still pending; it then
          // holds on the dim static frame rather than looping indefinitely.
          transition={{ duration: 1.2, repeat: 2, ease: "easeInOut", delay: i * 0.15 }}
        />
      ))}
    </span>
  );
}

// P13 (owner-approved 2026-07-16): matched-substring highlight inside a Services/Stylists row
// title. Splitting logic lives in lib/utils (splitHighlight, shared with SalonResultCard's own
// "suggest" variant so the matching rule is defined once); this renders it as a <mark>.
function HighlightedText({ text, query }: { text: string; query: string }) {
  return (
    <>
      {splitHighlight(text, query).map((seg, i) =>
        seg.match ? (
          <mark key={i} className="rounded-[3px] bg-[#FDF6D8] text-s-ink no-underline">{seg.text}</mark> /* drift-ok, owner-approved P13 2026-07-16: #FDF6D8 match highlight literal, not a design token */
        ) : (
          <React.Fragment key={i}>{seg.text}</React.Fragment>
        ),
      )}
    </>
  );
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
    <button onClick={onClick} aria-label={title} className="group flex w-full flex-col gap-1.5 text-left transition-transform duration-150 active:scale-[0.99] active:duration-[80ms] active:ease-glide">
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
      <Search size={16} strokeWidth={2} className="shrink-0 text-s-ink-2" />
      <span className={`min-w-0 flex-1 truncate text-[14px] text-s-ink ${primary ? "font-semibold" : "font-medium"}`}>{label}</span>
      <ArrowUpLeft size={15} strokeWidth={2} className="shrink-0 text-s-ink-2" />
    </button>
  );
}


function MonthGrid({ monthDate, now, windowEnd, selKey, onPick, locale }: {
  monthDate: Date; now: Date; windowEnd: Date; selKey: string | null;
  onPick: (key: string, label: string) => void; locale: string;
}) {
  const y = monthDate.getFullYear(), m = monthDate.getMonth();
  const monthLong = monthDate.toLocaleDateString(locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : locale === "en" ? "en-CH" : "de-CH", { month: "long" });
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
              <span className="grid h-9 w-9 place-items-center text-[14px] text-s-ink-2/35">{d}</span>
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

// P13 (owner-approved 2026-07-16): `name` widened to accept a ReactNode (a <HighlightedText>
// result) alongside a plain string , local-only component, no other file imports it, so this
// is a fully backward-compatible widening.
function SuggestRow({ name, sub, Icon, img, onClick, onRemove }: {
  name: React.ReactNode; sub?: string; Icon?: LucideIcon; img?: string;
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
          {sub ? <span className="block truncate text-[13px] text-s-ink-2">{sub}</span> : null}
        </span>
      </button>
      {onRemove && (
        <button onClick={onRemove} aria-label="Entfernen" className="grid h-8 w-8 shrink-0 place-items-center text-s-ink-2">
          <X size={17} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
