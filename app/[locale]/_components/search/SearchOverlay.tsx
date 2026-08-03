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
// S5: the locked shared empty state (design contract "states" row, COMPONENT_REGISTRY),
// the same one 19 other surfaces import. Not a hand-rolled one-off.
import EmptyState from "@/components-legacy/ui/EmptyState";
import { localizedField } from "@/lib/i18n/localized-field";

// ── Constants ────────────────────────────────────────────────────────────────

const EASE = [0.32, 0.72, 0, 1] as const;
// C2 (round 2, owner "did you actually analyze the motion frame by frame"): a 60fps recording
// of our own open proved the container morph LOOKS finished in ~167ms of a nominal 367ms,
// because EASE above is an extreme decelerate that spends most of the travel in the first ~15%
// of the time. EASE stays untouched (other things depend on it); this curve is scoped to ONLY
// the open/close container morph (`animate(openT, ...)` below) so the height travel actually
// fills its own duration instead of visually settling a third of the way in.
// OWNER PICK 2026-08-03, curve "C" from the side-by-side chooser
// (`public/_mockups/search-curve/index.html`). He was shown three on the same geometry and answered
// "C". Measured on that page: A calm [0.4, 0, 0.2, 1] hits 50% at 128ms and 95% at 266ms; B, the
// literal Airbnb curve pixel-measured off his own recording, [0.32, 0.72, 0, 1], hits 50% at 59ms
// and 95% at 177ms and is the shape he had called too fast; C sits between them at 50% in 90ms and
// 95% in 233ms, so it starts immediately without finishing early.
const MORPH_EASE = [0.36, 0.36, 0.1, 1] as const;
// R4c (2026-08-02 round 3, owner "too snappy, it breaks scrolling"): was 120. The expand
// reallocates real layout space, so while it runs the scroller's own box grows AND its top
// edge climbs: measured over the old 120px, the scroller gained 382px of height and its top
// rose 162px, which means content under the finger moved 2.35x faster than the finger and the
// whole expand was spent inside one flick. The box-top rise (162px) is fixed by the collapsing
// heading + pills, so the only lever on that ratio is the scroll distance the expand is spread
// over: (162 + D) / D. At D=320 that is 1.51x instead of 2.35x, and the expand survives a
// single flick instead of being consumed by it. Stays gesture-linked (never a binary focus
// threshold, feedback_search_expand_gesture_linked) , one continuous driver, longer runway.
const EXPAND_DIST = 320; // px of scroll = full 0->1 expand (service step only)
const HEADING_H = 56;    // collapsing heading height (px)
const ROW_H = 66;        // collapsed step row (h-14=56 + pt-2.5=10); see SLOT_COLLAPSED
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

  // S6 (2026-08-03, owner decision): a category pill tap FILTERS the list underneath
  // immediately. `category` is the SAME state slice the pill row already wrote and the
  // same one buildParams already turns into `?category=` on submit , no second taxonomy,
  // no second state. The only missing wire was this param: /api/search/suggest already
  // read `category` and handed it to the search_suggest RPC as `p_category`, but
  // useSearchSuggest never sent it, which is why the pills changed nothing but their own
  // fill. Proven to DISCRIMINATE against the live seed before wiring (q=haar: 5 services
  // across spa+coiffeur unfiltered, 5 coiffeur-only + 2 salons at category=coiffeur,
  // 1 spa service + 0 salons at category=spa, 0/0/0 at category=nails), so this is a real
  // subset and not the silent no-op a discovery-vs-salon taxonomy mismatch would produce.
  const { results, loading } = useSearchSuggest(open ? serviceQ : "", {
    city: stadt || undefined,
    category: category || undefined,
  });
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
  // S6 (2026-08-03): the ids this SAME fetch came back with. When a category pill is
  // active the request also carries `&category=`, which /api/salons already applies as
  // `.contains("categories", [category])` on the same query builder as the `ids` filter
  // (route.ts lines 164 + 177), so the server returns the SUBSET of the featured ids that
  // are actually in that category and the idle "Beliebte Stores" list narrows with the
  // suggestions instead of contradicting them. Server-side, not a client-side pass over
  // one page. null = not resolved yet (render the full list rather than flash to empty).
  const [featuredMatch, setFeaturedMatch] = React.useState<string[] | null>(null);
  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const sp = new URLSearchParams({
      ids: FEATURED_SALONS.map((s) => s.id).join(","),
      limit: String(FEATURED_SALONS.length),
    });
    if (category) sp.set("category", category);
    fetch(`/api/salons?${sp.toString()}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`status ${res.status}`))))
      .then((data: { items?: { id: string; address?: string | null }[] }) => {
        if (cancelled) return;
        const next: Record<string, string> = {};
        for (const item of data.items ?? []) if (item.address) next[item.id] = item.address;
        setFeaturedAddress(next);
        setFeaturedMatch((data.items ?? []).map((item) => item.id));
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[SearchOverlay] featured salons address fetch failed:", err);
      });
    return () => { cancelled = true; };
  }, [open, category]);
  // Only a RESOLVED category response narrows the list; with no pill active, or before
  // the first response lands, the full featured list renders exactly as it did before.
  const featuredVisible = React.useMemo(
    () => (category && featuredMatch ? FEATURED_SALONS.filter((s) => featuredMatch.includes(s.id)) : FEATURED_SALONS),
    [category, featuredMatch],
  );

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
      // S4 (2026-08-03): the date family had no re-seed line here while service /
      // category / query / city all did, so an ABANDONED date outlived the overlay and
      // was silently applied to the next search. Measured before this fix: set Nails +
      // Zuerich + 21. August + Abend, close with the X, reopen, and the three collapsed
      // faces read ["Suche | Service, Store oder Stylist:in", "Wo? | Basel",
      // "Wann? | 21. August"] , every other row reset, the date did not. There is no
      // date prop to re-seed FROM (SearchTemplate passes initialService/initialQuery/
      // initialCity only), so the symmetric value is empty. This lives in the OPEN
      // effect rather than in close() because close() is only one of the ways the
      // overlay shuts: Escape calls onClose() directly (see the keydown effect above)
      // and the parent can flip `open` on its own, while EVERY path has to come back
      // through here to reopen.
      setIsoDate("");
      setSelKey(null);
      setDateLabel("");
      setZeitPeriod("");
      setDateTab("daten");
      setMonthOffset(0);
      if (initialFocus === "stadt") setActiveStep("location");
      else if (initialFocus === "zeit") setActiveStep("date");
      else setActiveStep("service");
      scrollExpand.set(0);
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
  // K1 (2026-08-03, owner shots IMG_6911 / IMG_6914): with the keyboard up the sheet is 384px on
  // his device (top 65 = safe-area floor, bottom 449 = the keyboard's top edge), while the
  // UNFOLDED composer's own fixed chrome is heading 56 + pills 60 + field 68 + Wo? row 76 +
  // Wann? row 86 + footer 68 = 414px. 414 does not fit in 384, and the one elastic child is the
  // suggestion list, so it absorbed the whole deficit and measured 0px of content (a 20px box
  // that is entirely its own padding, 0 rows in view). That is the screenshot: the card ends
  // right under the field. It is also a DEAD END, because the only control that can raise
  // `expand` again is scrolling that same list, and a 0px list cannot be scrolled: focus the
  // field (expand -> 1), scroll the suggestions back to the top (the scroll link writes expand
  // -> 0), and the composer re-expands into a sheet that has no room for it, with the keyboard
  // still up and no way back.
  //
  // The system already has exactly one answer for "this chrome has to fold away": `expand`.
  // So the keyboard now drives it too. `scrollExpand` is the driver the FINGER writes (the focus
  // `grow(1)` and the scroll link), `kbT` is the keyboard's own progress, and `expand` is their
  // MAX, so the keyboard can only ever raise the fold, never undo what the finger did. Still one
  // continuous value over ONE DOM tree, never two layouts swapped at a threshold: nothing mounts,
  // unmounts or re-parents, the same transforms interpolate the same nodes, and `kbT` animates on
  // the SAME duration/curve `grow` already uses so a keyboard-driven fold and a focus-driven fold
  // are the same motion. At kbInset 0 `kbT` is 0 and `expand` is byte-identical to what it was.
  const scrollExpand = useMotionValue(0); // mockup-ok: the pre-existing `expand` value, renamed only
  const kbT = useMotionValue(0); // mockup-ok: SEARCH_MORPH.md K1, keyboard fold progress
  const expand = useTransform([scrollExpand, kbT], (latest) => { // mockup-ok: SEARCH_MORPH.md K1
    const [s, k] = latest as [number, number];
    return Math.max(s, k);
  });
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
  // R7: `stepsH` (one height for BOTH collapsed rows at once) is gone. The rows are separate
  // slots now, so each carries its own height on the same 0.4-0.8 window (rowLocH/rowDateH).
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
  // R4b/R3 (2026-08-02 round 3): this used to size the sheet off the VISUAL viewport, which
  // conflates two different things. (1) A pinch/auto zoom shrinks visualViewport, so the sheet
  // collapsed to a fraction of the screen while the scrim still filled it (measured: at page
  // scale 2 the sheet rendered 188x310 inside a 375x812 screen). The sheet is
  // `position: fixed`, which is laid out against the LAYOUT viewport, so its box must come
  // from `window.innerWidth/innerHeight`. (2) The keyboard is a separate fact: it covers the
  // BOTTOM of the layout viewport, and is measured here as its own inset rather than by
  // shrinking the whole viewport. `offsetTop` matters because iOS scrolls the layout viewport
  // under the keyboard and fires `scroll`, not `resize`.
  const [viewport, setViewport] = React.useState({ w: 375, h: 812 });
  const [kbInset, setKbInset] = React.useState(0);
  // K2 (2026-08-03, IMG_6914's top edge): `position: fixed` is laid out against the LAYOUT
  // viewport, and iOS scrolls the VISUAL viewport inside it when the keyboard comes up, so a
  // sheet pinned to layout-y N renders at screen-y N - offsetTop. Reconstructing IMG_6914 from
  // its own pixels: the Wo? card measures 207pt tall there, which the sheet arithmetic only
  // produces at kbInset 380 (= a 425px keyboard read through a 45px visual-viewport scroll),
  // and at that offset the sheet's layout top of 65 renders at screen 20, which is why the
  // Suche row above the Wo? card is a sliver cut off by the status bar instead of a 56px row.
  // The BOTTOM edge already survives this (`viewport.h - kbInset` is the keyboard's top edge in
  // layout coordinates by construction, offset included), so only the top needed the term.
  const [vvOffset, setVvOffset] = React.useState(0);
  React.useEffect(() => {
    const measure = () => {
      const w = window.innerWidth, h = window.innerHeight;
      setViewport({ w, h });
      const vv = window.visualViewport;
      setVvOffset(Math.max(0, Math.round(vv?.offsetTop ?? 0)));
      // The band of the layout viewport the visual viewport no longer covers = the keyboard.
      // `* scale` is what keeps a ZOOM from being misread as a keyboard: zooming to 2x halves
      // visualViewport.height for the same screen, and without the scale term this computed a
      // phantom 406px keyboard and hauled the sheet to the top of the screen (measured before
      // the term was added: sheet 0,6,375,400 at scale 2 instead of 0,96,375,716). At scale 1
      // the term is identity, so the keyboard case is unaffected. Sub-pixel noise and a 1-2px
      // browser-chrome wobble must not read as a keyboard either, hence the 48px floor.
      const scale = vv?.scale ?? 1;
      const covered = vv ? Math.round(h - (vv.height + vv.offsetTop) * scale) : 0;
      setKbInset(covered > 48 ? covered : 0);
    };
    measure();
    window.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("scroll", measure);
    return () => {
      window.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("scroll", measure);
    };
  }, []);
  // K1: the keyboard's own fold progress. Same duration and same curve as `grow`, so the fold
  // the keyboard triggers and the fold a focus triggers are one motion, and a keyboard that
  // arrives while `grow(1)` is already running just lands on the value that is already there.
  // `expand` above takes the MAX of this and the finger's own value, so this can never pull the
  // sheet back down: releasing the keyboard hands control back to whatever the finger last set.
  React.useEffect(() => {
    const controls = animate(kbT, kbInset > 0 ? 1 : 0, reduce ? { duration: 0 } : { duration: 0.34, ease: EASE });
    return () => controls.stop();
  }, [kbInset, reduce, kbT]);
  // No visible bar to point at (e.g. the ?compose=1 deep link) -> a plausible near-top rect
  // instead of the old bottom-of-screen slide.
  const origin = React.useMemo(
    () => originRect ?? { top: 60, left: 16, width: Math.max(viewport.w - 32, 200), height: 56 },
    [originRect, viewport.w],
  );
  const openT = useMotionValue(open ? 1 : 0); // mockup-ok: SEARCH_MORPH.md A7/A8/A9
  // K-A (2026-08-03, owner picked K-A over K-B at public/_mockups/search-keyboard/index.html,
  // SEARCH_MORPH.md K4): R3 used to RISE the sheet by the keyboard inset so it shrank to sit
  // above the keys, which cut whatever row sat on the keyboard line against a hard white edge
  // (IMG_6909/IMG_6914, K2). K-A keeps the sheet at the height it would have with no keyboard
  // and lets it run behind the keyboard instead, so a row at that line slides under the keys
  // rather than terminating on an edge. `topFor` no longer subtracts `kbInset`; only the
  // suggestion scroller's own bottom padding (below) reads it now, so the last row can still be
  // scrolled clear of the keys. One function, used by both `cropTop` and `sheetHeight`, so top
  // and bottom can never disagree.
  const minTop = Math.max(safeTop + 6, 6);
  // F1/F2 (2026-08-03, "THE FRAME-BY-FRAME HE ASKED FOR" , SEARCH_MORPH.md): the reference's own
  // open is THREE STAGED PHASES on a 120fps frame trace, not one blended morph , content leaves,
  // then an EMPTY container travels (every ink band reads 0.000 at 200/250ms), then content fades
  // UP into an already-landed container (the box itself stops around 400ms, content keeps arriving
  // after). `containerT` remaps the box's own [0,1] open progress onto [0, 0.8] of `openT` so the
  // box finishes settling before `openT` itself reaches 1, leaving the tail of the open for content
  // (contentOp/fieldOp/listOp below) to fade up into a box that has already landed , the exact shape
  // the reference shows and ours didn't. Reused by `topFor`, `sheetHeight`, `sheetLeft` and
  // `sheetWidth` so all four box dimensions settle together. Still ONE continuous value driving the
  // box (`openT`, unedited duration/MORPH_EASE); only this range on it changes.
  const topFor = React.useCallback(
    (oT: number, ex: number) => {
      const containerT = clamp01(oT / 0.8);
      const base = oT < 1
        ? origin.top + (RESTING_TOP - origin.top) * containerT
        : RESTING_TOP + (focusedTop - RESTING_TOP) * ex;
      // K2: `+ vvOffset` puts the sheet's top where the user actually sees it. It is 0 in every
      // state without a visual-viewport scroll, so this is identity everywhere else.
      return Math.max(minTop, base) + vvOffset;
    },
    [origin, focusedTop, minTop, vvOffset],
  );
  const cropTop = useTransform([openT, expand], (latest) => { // mockup-ok: SEARCH_MORPH.md A7/A8/A9
    const [oT, ex] = latest as [number, number];
    return topFor(oT, ex);
  });
  const sheetLeft = useTransform(openT, [0, 0.8], [origin.left, 0]); // mockup-ok: SEARCH_MORPH.md F1/F2, box settles by 0.8
  const sheetWidth = useTransform(openT, [0, 0.8], [origin.width, viewport.w]); // mockup-ok: SEARCH_MORPH.md F1/F2, box settles by 0.8
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
    // K-A: the usable bottom edge is always the viewport's own bottom, keyboard up or not, so
    // the sheet is never shrunk to sit above the keys (that was K-B, rejected at the K4
    // chooser). Height is always "bottom minus the top `topFor` just returned", so the sheet's
    // bottom edge lands exactly there in every state.
    const bottom = viewport.h;
    if (oT < 1) {
      const restingHeight = Math.max(bottom - topFor(1, ex), 200);
      // F1/F2: same [0, 0.8] container-position window as topFor, so height and top settle on
      // the same frame , never a box that's already tall but not yet positioned, or vice versa.
      const containerT = clamp01(oT / 0.8);
      return origin.height + (restingHeight - origin.height) * containerT;
    }
    return Math.max(bottom - topFor(oT, ex), 200);
  });
  // R6 (2026-08-02 round 3, owner bug report): the scrim used to fade on its OWN
  // AnimatePresence clock while the sheet faded on `openT`. The two curves are not the same
  // shape, so the sheet's own backdrop died about 4x faster than the sheet: for ~250ms the
  // white overlay cards and the ink Suchen pill were painted straight onto a sharp, unblurred
  // results feed and read as duplicated chrome. Both now read the SAME `openT`, on curves
  // chosen so the scrim is >= the sheet at every value of openT , the blur outlives the sheet
  // by construction, not by two clocks that happen to agree until someone edits one.
  const sheetOpacity = useTransform(openT, [0, 0.35, 1], [0, 0.55, 1]); // mockup-ok: SEARCH_MORPH.md A7/A8/A9
  const scrimOpacity = useTransform(openT, [0, 0.18, 1], [0, 1, 1]); // mockup-ok: SEARCH_MORPH.md R6
  // H1 (2026-08-03), the root cause of six failed rounds. The scrim was `backdrop-blur-xl`, a
  // STATIC 24px blur whose only animated property was opacity. A full-strength blur fading in still
  // reads as the entire screen fogging over at once, so the screen looked open before anything had
  // moved and the sheet's real growth happened invisibly inside an already-blurred field. Owner:
  // "it's already all opened, then it just pops up everything." Measured on his recording the page
  // behind is still clearly readable at +50ms and only reaches full blur around when the card
  // finishes growing, so the RADIUS itself has to travel, not just the layer's alpha.
  const scrimBlur = useTransform(openT, (v) => `blur(${(clamp01(v) * 24).toFixed(1)}px)`); // mockup-ok: SEARCH_MORPH.md H1
  const scrimTint = useTransform(openT, (v) => `rgba(10, 10, 10, ${(clamp01(v) * 0.1).toFixed(3)})`); // mockup-ok: SEARCH_MORPH.md H1
  // C3 (round 2, "X floats alone, off both specs"): port of an owner-dictated SEARCH_MORPH.md
  // punch-list fix. The close-X used to sit at a fixed `top:14px` with no relation to the
  // sheet. Derives its top from the SAME cropTop transform that drives the sheet, offset just
  // above the sheet's own top edge, so it moves WITH the sheet through the open/close morph
  // instead of floating independently in the blurred zone.
  const CLOSE_BTN = 44; // h-11 w-11: 44px touch-target floor + the design-system "circled X" size
  const CLOSE_BTN_GAP = 10; // px between the X and the sheet's top edge
  const closeXTop = useTransform(cropTop, (top) => Math.max(safeTop + 6, top - CLOSE_BTN - CLOSE_BTN_GAP)); // mockup-ok: SEARCH_MORPH.md C3
  // R6: the X carries BOTH fades at once , its own focus-collapse fade (xOpacity, expand) and
  // the open/close fade (sheetOpacity, openT) , instead of an independent AnimatePresence exit.
  const closeXOpacity = useTransform([xOpacity, sheetOpacity], (latest) => { // mockup-ok: SEARCH_MORPH.md R6
    const [x, s] = latest as [number, number];
    return x * s;
  });

  // G1/G2 (2026-08-03 CORRECTION, SEARCH_MORPH.md "CORRECTION 2026-08-03"): the F1/F2 model above
  // this comment (content pinned at exactly 0 through openT [0, 0.4]/[0, 0.55], only fading in
  // after) was built off ink density sampled in FIXED SCREEN-SPACE bands while the card was still
  // moving through them, so at 200/250ms those bands were pointing at parts of the screen the card
  // had not reached yet and read 0.000 for a reason that had nothing to do with the content's own
  // opacity. That shipped the OPPOSITE of the reference. A second recording, read frame-by-frame
  // (not sampled) instead of by ink band, shows the content ghosted from the FIRST frame after the
  // press: +50ms the old pill label and the new "Where?" + field are already overlaid; +100ms the
  // whole new content (heading, field, list) is present at LOW opacity; from there it just gets
  // more opaque. The content is never blank and nothing waits for anything else , ONE simultaneous
  // move, not three staged phases.
  // `containerT` is the exact [0, 0.8]-of-`openT` progress that already grows the box (`topFor` /
  // `sheetHeight` above compute the same ratio inline); driving opacity off the SAME value is "the
  // same progress value that grows the container" per spec, so the content is guaranteed to be
  // above zero at every frame the box is still growing (it only clamps to 1 once the box has
  // settled at openT=0.8, never before).
  // Chose TOGETHER over a stagger: the reference shows heading + field + list all present already
  // by +100ms of a 367ms open (27% of the way in), too close together to read as a sequence, and a
  // staggered order derived from the same ink-band method that produced this bug is not evidence
  // worth keeping over a plain "together" reading. On CLOSE this is the same continuous function
  // read backward off the same `openT` , no second set of values, no threshold.
  const containerT = useTransform(openT, (v) => clamp01(v / 0.8)); // mockup-ok: SEARCH_MORPH.md G1
  // G3 (2026-08-03): the content rides its OWN slower progress, not the container's. Measured inside
  // the reference card's own moving box, its content is still barely countable when the box has
  // stopped and keeps rising for ~200ms after. Driving opacity off `containerT` made it land at
  // 162ms of a 367ms open, which is what the owner is calling out as the wrong speed.
  const contentT = useMotionValue(open ? 1 : 0); // mockup-ok: SEARCH_MORPH.md G3
  const contentOp = contentT; // heading + category pills, mockup-ok: SEARCH_MORPH.md G1/G2/G3
  const fieldOp = contentT; // mockup-ok: SEARCH_MORPH.md G1/G2/G3
  const listOp = contentT; // mockup-ok: SEARCH_MORPH.md G1/G2/G3
  // Combined with the EXISTING focus-fold opacities (headingOp/pillsOp, driven by `expand`) so a
  // single element carries both axes at once , open/close staging and the separate focus fold ,
  // the same multiply pattern `closeXOpacity` above already uses for its own two axes.
  const headingContentOp = useTransform([headingOp, contentOp], (latest) => { // mockup-ok: SEARCH_MORPH.md F1/F2
    const [h, c] = latest as [number, number];
    return h * c;
  });
  const pillsContentOp = useTransform([pillsOp, contentOp], (latest) => { // mockup-ok: SEARCH_MORPH.md F1/F2
    const [p, c] = latest as [number, number];
    return p * c;
  });
  // Same fix, on the footer: `stepsOp` only ever read `expand` (the focus fold), so the
  // Suchen/Zuruecksetzen row was fully opaque and tappable from the same early frame as the
  // Wo?/Wann? rows above. Multiplied by `listOp`, which post-G1/G2 is the same container
  // progress as every other content opacity , no stagger, see the correction note above.
  const footerContentOp = useTransform([stepsOp, listOp], (latest) => { // mockup-ok: SEARCH_MORPH.md F1/F2
    const [s, l] = latest as [number, number];
    return s * l;
  });

  // ── R7: the step change is a morph, not a swap ──────────────────────────────
  // (2026-08-02 round 3, owner "switching between Suche / Standort / Datum still is not a
  // morph and looks weird".) It used to be an AnimatePresence crossfade between two
  // STRUCTURALLY DIFFERENT trees: one painted a single 351x496 white card, the other painted
  // three 351x56 rows plus a card at a different y. Their white surfaces did not coincide, so
  // through most of the sheet exactly ONE panel was painting at a fractional opacity and the
  // blurred page showed through , measured 100% of the sheet below composite alpha 0.98 for
  // 136ms, worst point 0.372, plus real holes at alpha 0 on the commit frame where popLayout
  // yanked the outgoing panel to its old absolute rect. Changing AnimatePresence modes cannot
  // fix that; the two trees are the bug.
  //
  // There is now ONE tree: three slots (Suche / Wo? / Wann?) in fixed order plus the footer,
  // exactly the order both old panels already rendered. Each slot is a persistent white card
  // whose HEIGHT is a continuous motion value, and whose collapsed face and expanded body
  // crossfade INSIDE it. Because the white surface belongs to the slot and never fades during
  // a step change, no point that is white before and after can go translucent in between ,
  // the wash is gone by construction, not by tuning.
  //
  // Sizes are derived, never hardcoded per step: each slot gets its collapsed height plus a
  // share of the leftover space weighted by its own t. The shares are normalised by their sum,
  // so the three heights add up to the available space on EVERY frame, including a step change
  // interrupted mid-flight, which is what keeps a gap from opening between the cards.
  // service = the bare h-14 row (it sits flush against the sheet's top edge, no gap above it);
  // location = ROW_H, the row plus its 10px gap; date = the same plus the 20px tail the old
  // `stepsH` literal carried, so the footer keeps its exact y.
  const SLOT_COLLAPSED = { service: ROW_H - 10, location: ROW_H, date: ROW_H + 20 };
  const svcT = useMotionValue(activeStep === "service" ? 1 : 0);
  const locT = useMotionValue(activeStep === "location" ? 1 : 0);
  const dateT = useMotionValue(activeStep === "date" ? 1 : 0);
  React.useEffect(() => {
    const cfg = { duration: reduce ? 0 : 0.3, ease: MORPH_EASE };
    const runs = [
      animate(svcT, activeStep === "service" ? 1 : 0, cfg),
      animate(locT, activeStep === "location" ? 1 : 0, cfg),
      animate(dateT, activeStep === "date" ? 1 : 0, cfg),
    ];
    return () => runs.forEach((r) => r.stop());
  }, [activeStep, reduce, svcT, locT, dateT]);
  // The two collapsed rows still fold away on focus, on the same 0.4-0.8 window `stepsH` used.
  const rowLocH = useTransform(expand, [0.4, 0.8], [SLOT_COLLAPSED.location, 0]);
  const rowDateH = useTransform(expand, [0.4, 0.8], [SLOT_COLLAPSED.date, 0]);
  // The gaps around each row are PADDING on a border-box element, so a height of 0 still
  // renders the padding: measured mid-fix, the fully focused sheet had slot heights
  // [762, 10, 30, 0] against a 762px sheet, i.e. 40px of leftover sliver overflowing its
  // bottom. The gaps therefore collapse on the same window as the heights they belong to.
  const rowGapTop = useTransform(expand, [0.4, 0.8], [10, 0]);
  const rowGapBottom = useTransform(expand, [0.4, 0.8], [20, 0]);
  const slotAvail = useTransform([sheetHeight, footerH], (latest) => {
    const [sh, fh] = latest as [number, number];
    return sh - fh;
  });
  const slotInputs = [slotAvail, svcT, locT, dateT, rowLocH, rowDateH];
  const slotSizes = (latest: unknown) => {
    const [avail, s, l, d, cl, cd] = latest as number[];
    const collapsed = [SLOT_COLLAPSED.service, cl, cd];
    const weights = [s, l, d];
    const total = Math.max(weights[0] + weights[1] + weights[2], 0.0001);
    const surplus = Math.max(avail - (collapsed[0] + collapsed[1] + collapsed[2]), 0);
    return collapsed.map((c, i) => c + (surplus * weights[i]) / total);
  };
  const svcH = useTransform(slotInputs, (l) => slotSizes(l)[0]);
  const locH = useTransform(slotInputs, (l) => slotSizes(l)[1]);
  const dateH = useTransform(slotInputs, (l) => slotSizes(l)[2]);
  const inverse = (v: number) => 1 - v;
  const svcFaceOp = useTransform(svcT, inverse);
  const locFaceOpRaw = useTransform(locT, inverse);
  const dateFaceOpRaw = useTransform(dateT, inverse);
  // F1/F2 (2026-08-03): found by recording OUR OWN open and reading an actual frame (not an
  // endpoint), not by re-deriving the spec , at t~=40ms into the open (sheet still only ~25% of
  // its final height, well inside the travel window) the Wo?/Wann? collapsed rows' TEXT
  // ("Keine Präferenz", "Jederzeit") already painted at full opacity, because `locFaceOp`/
  // `dateFaceOp` only ever read `locT`/`dateT` (the step-switch axis) and never the open/close
  // axis at all. Same bug class as the heading/field/list fix above, on two rows that measured
  // table doesn't name individually but the owner's "it's all already over there" complaint
  // covers as a whole. Multiplied by `contentOp` (NOT `listOp`) , these rows sit structurally
  // beside the heading in the composed view, not after the suggestion list. The SLOT's own white
  // card shell (`locSlotOp`/`dateSlotOp` below) is deliberately left alone: it belongs to the
  // container morph, not the content cross-fade. Post-G1/G2, `contentOp` itself is the same
  // container progress the box grows on, so this text now rises with the box instead of waiting
  // on a separate "content-in" phase (see the correction note above `containerT`).
  const locFaceOp = useTransform([locFaceOpRaw, contentOp], (latest) => {
    const [f, c] = latest as [number, number];
    return f * c;
  });
  const dateFaceOp = useTransform([dateFaceOpRaw, contentOp], (latest) => {
    const [f, c] = latest as [number, number];
    return f * c;
  });
  // S8 / R6 (2026-08-03): the sheet root already computed `pointer-events:none` for the whole
  // close, but CSS does not let an ancestor's `none` win over a descendant's `auto`, and these
  // six slot layers set `auto` off their own step transform alone. So the dying sheet, which
  // morphs back down onto the search pill's own rect, kept hit-testing there for the full 333ms.
  // Measured before: 67.9% of the 375x812 viewport still resolved to the sheet at close+30ms, and
  // a real tap on the pill at close+78ms / +171ms / +281ms delivered 0 click events and re-opened
  // nothing, while the same tap at +421ms worked. `hitGate` is set in the effect below, which
  // React commits in the same pass that flips `open` to false, so every layer goes `none` when the
  // close STARTS rather than when it finishes. It stays a motion value (not `open ? x : "none"`)
  // because swapping a motion value for a static string in `style` does not detach the already
  // attached value, the same trap R7 documented on `height`. No pixel moves: this changes only
  // which layer answers a hit test, never a size, a position, or an opacity.
  const hitGate = useMotionValue(open ? 1 : 0); /* mockup-ok: hit-test gate only, SEARCH_MORPH.md S8/R6, no visual change */
  React.useEffect(() => { hitGate.set(open ? 1 : 0); }, [open, hitGate]);
  const hitWhenOpen = (latest: number[]) => {
    const [v, gate] = latest as [number, number];
    return gate > 0.5 && v > 0.5 ? "auto" : "none";
  };
  const hitWhenShut = (latest: number[]) => {
    const [v, gate] = latest as [number, number];
    return gate > 0.5 && v <= 0.5 ? "auto" : "none";
  };
  const svcBodyHit = useTransform([svcT, hitGate], hitWhenOpen), svcFaceHit = useTransform([svcT, hitGate], hitWhenShut); /* mockup-ok: hit-test gate only, SEARCH_MORPH.md S8/R6 */
  const locBodyHit = useTransform([locT, hitGate], hitWhenOpen), locFaceHit = useTransform([locT, hitGate], hitWhenShut); /* mockup-ok: hit-test gate only, SEARCH_MORPH.md S8/R6 */
  const dateBodyHit = useTransform([dateT, hitGate], hitWhenOpen), dateFaceHit = useTransform([dateT, hitGate], hitWhenShut); /* mockup-ok: hit-test gate only, SEARCH_MORPH.md S8/R6 */
  // S3 (2026-08-03, round 3 audit): the close-X hit-tests off its OWN opacity now, not off
  // `open` alone. Measured before this line existed: with the keyboard up (visualViewport 476 of
  // a 812 layout viewport) the X sat at [319,6,44,44] with computed opacity "0" and
  // pointerEvents "auto", on top of the search field row [12,22,351,48] , so
  // `elementFromPoint(351,46)` returned the close button, and a real tap at the right end of the
  // field (the ordinary way to move the caret) destroyed the overlay and the typed query
  // (measured after the tap: overlay gone, query ""). An invisible control must not be a target.
  // `hitGate` is folded in rather than writing `open ? closeXHit : "none"`, because swapping a
  // motion value for a static string in `style` does NOT detach the already-attached value ,
  // the exact trap S8 documented one block above and R7 documented on `height`. So the R6 fact
  // (drop hit-testing the instant `open` flips false, so a tap during the 333ms close cannot
  // land on the dying overlay) is preserved through the gate, not through a ternary that would
  // silently keep writing "auto" every frame. No pixel moves.
  const closeXHit = useTransform([closeXOpacity, hitGate], (latest) => { /* mockup-ok: hit-test only, paints nothing */
    const [o, gate] = latest as [number, number];
    return gate > 0.5 && o > 0.05 ? "auto" : "none";
  });
  // A collapsed row still fades out with the focus expand (what `stepsOp` did); an EXPANDED
  // slot never does, so a step change alone can never fade a card.
  const foldOp = (t: number, so: number) => t + (1 - t) * so;
  const locSlotOp = useTransform([locT, stepsOp], (latest) => {
    const [t, so] = latest as [number, number];
    return foldOp(t, so);
  });
  const dateSlotOp = useTransform([dateT, stepsOp], (latest) => {
    const [t, so] = latest as [number, number];
    return foldOp(t, so);
  });
  // S7 (2026-08-03, round 3 audit): `pointer-events:none` hides a control from the FINGER only.
  // Measured before this block existed, overlay open on the service step: 72 controls were
  // invisible on screen yet still tabbable and still in the accessibility tree , the entire Wo?
  // body (its city input and every city row) and the entire Wann? body (29 calendar day cells,
  // the month arrows, the period chips), all sitting hundreds of px below the viewport inside
  // their collapsed slots. They cannot be unmounted: the morph is one continuous transform over
  // ONE DOM tree and every slot has to stay in it. `inert` is exactly that tool , it takes a
  // still-rendered subtree out of the focus order and out of AT while changing no layout and
  // painting nothing, so the morph is byte-identical. The same file already uses it on the
  // collapsed time chips (`inert={!selKey}` in the calendar below), so this is that pattern
  // applied to the three slots that needed it.
  //
  // `rowsFolded` is the one fact the React tree could not already see. `expand` is a MotionValue,
  // so when the two collapsed rows and the footer fold to zero height on focus, no state knows
  // and their faces/buttons stay tabbable inside a zero-height overflow-hidden box. It flips at
  // 0.8, the SAME endpoint rowLocH / rowDateH / footerH already finish folding at, and it drives
  // nothing but the `inert` attribute , no size, no position, no opacity, so this is not a
  // second layout threshold.
  const [rowsFolded, setRowsFolded] = React.useState(false);
  React.useEffect(() => expand.on("change", (v) => setRowsFolded(v >= 0.8)), [expand]);

  // R6 (2026-08-02 round 3): ONE lifecycle for the whole overlay. `mounted` used to be two
  // independent clocks , an AnimatePresence exit owning the scrim and the close-X, and a
  // `setTimeout(340)` owning the sheet , so the scrim and X unmounted at ~320ms while the
  // sheet lived to ~370ms, leaving a tail where the overlay chrome had no backdrop and no
  // close button. The sheet's removal is now the completion of the SAME morph that draws it:
  // when `openT` finishes its run to 0, the node goes. No timer, no second presence tree, so
  // the two can no longer drift apart.
  const [sheetOpen, setSheetOpen] = React.useState(open);
  React.useEffect(() => {
    let cancelled = false;
    if (open) setSheetOpen(true);
    const controls = animate(openT, open ? 1 : 0, {
      duration: reduce ? 0 : open ? 0.367 : 0.333,
      ease: MORPH_EASE,
      onComplete: () => { if (!cancelled && !open) setSheetOpen(false); },
    });
    // SPEED FIX 2026-08-03, owner: "the speed is nothing like it". Measured on his own recording by
    // detecting the card's rect PER FRAME and sampling ink INSIDE the card's own moving box, which
    // is the measurement my earlier fixed-screen-band attempt got wrong twice. Countable ink inside
    // the reference's card: 0.0003 at +250ms, 0.0063 at +400ms, 0.0147 at +500ms, 0.0216 at +550ms,
    // and it does not reach its settled 0.0345 until about +750ms, while the CONTAINER stops moving
    // at +550ms. So the content fade is roughly 1.5x the container's duration AND it keeps rising
    // for ~200ms after the box has landed. Ours reached full opacity at 162ms, about 3.5x too fast,
    // which is exactly the "speed is nothing like it" complaint. The content therefore gets its own
    // longer progress value instead of riding the container's. Same one tree, same continuous
    // function read backward on close, no threshold and no second layout.
    const contentControls = animate(contentT, open ? 1 : 0, {
      duration: reduce ? 0 : open ? 0.57 : 0.30,
      ease: MORPH_EASE,
    });
    return () => { cancelled = true; controls.stop(); contentControls.stop(); };
  }, [open, reduce, openT, contentT]);

  const grow = React.useCallback(
    (to: number) => animate(scrollExpand, to, reduce ? { duration: 0 } : { duration: 0.34, ease: EASE }),
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

  const close = React.useCallback(() => { setInputFocused(false); setActiveStep("service"); setServiceQ(""); setCityQ(""); scrollExpand.set(0); onClose(); }, [scrollExpand, onClose]);
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
  // S5: both strings already existed in messages/{de,en,fr,it}.json under this same
  // namespace and were unused by any file; no new copy invented. `noMatchBody` takes a
  // {query} placeholder so it is called at the use site with the live query, not here.
  const noMatchTitleTxt         = t("noMatchTitle");

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

  // R7: the collapsed FACE only. The white fill, radius and shadow moved onto the slot that
  // owns it (see the slot block above), because that surface has to survive the crossfade , it
  // is the thing that stops the blurred page showing through mid-morph. Same 56px row, same
  // type, same tap target as before.
  const collapsedFace = (s: Step) => (
    <button type="button" key={s} onClick={() => openStep(s)}
      className="flex h-14 w-full items-center justify-between px-4 text-left">
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
        // K1: the blur is load-bearing now. The keyboard holds `expand` at 1 (kbT), so a back
        // tap that only ran `collapse()` would set the finger's own driver to 0 and change
        // nothing on screen while the keyboard stayed up. Dismissing the field is what this
        // control means, so it says so instead of relying on the platform to infer it.
        <button onClick={() => { serviceRef.current?.blur(); setInputFocused(false); collapse(); }} aria-label={backTxt}
          className="grid h-6 w-6 shrink-0 place-items-center text-s-ink">
          <ArrowLeft size={20} strokeWidth={2} />
        </button>
      ) : (
        <span className="grid h-6 w-6 shrink-0 place-items-center">
          <Search size={19} strokeWidth={2} className="text-s-ink-2" />
        </span>
      )}
      {/* R4b (2026-08-02 round 3, owner "it reads zoomed in"): this input computed to 15px.
          iOS Safari auto-zooms the WHOLE page when a field under 16px takes focus, and
          app/layout.tsx deliberately ships no `maximum-scale`/`user-scalable` (an a11y decision
          from 2026-07-26, not to be reversed), so nothing zooms it back. 16px is the platform's
          no-zoom threshold and is also what the global input law in globals.css already sets ,
          the `!` carve-out below was overriding it down. The compounding half of that bug (the
          sheet sizing itself off the shrunken VISUAL viewport, so the zoom collapsed it to a
          card floating in a blurred field) is fixed at the `viewport` measure above. */}
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
        className="min-w-0 flex-1 !border-0 !bg-transparent !min-h-0 !px-0 !text-[16px] text-s-ink placeholder:text-s-ink-2 focus:outline-none focus-visible:outline-none" />
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
      // S5 (2026-08-03): a query that matches NOTHING used to fall straight through to the
      // "Fuer dich" grid below, which is DNA/popular looks and has nothing to do with the
      // query, so a failed search rendered as a successful one (measured on "zzzqqq":
      // suggest returned 0 salons / 0 services / 0 stylists and the sheet still showed 8
      // brow looks). The LOCKED mockup this file was ported from has the state
      // (app/[locale]/dev/search-morph/page.tsx:155). Every query-related group is counted,
      // not just the three suggest groups, so a query with only geocode hits or only
      // autocomplete completions still shows its rows instead of a false "no results".
      const nothingMatched =
        !hasResults && !geoLoading && geoCandidates.length === 0 && acTerms.length === 0 && looks.length === 0;
      if (nothingMatched) {
        return (
          <EmptyState
            icon={Search}
            title={noMatchTitleTxt}
            message={t("noMatchBody", { query: serviceQ.trim() })}
          />
        );
      }
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
                  // R8-1 (2026-08-02 round 3): `close()` used to run ONLY on the map path, so on
                  // the normal search page a store tap ran no teardown at all , the overlay just
                  // vanished as a side effect of the route change unmounting its parent.
                  // Measured: 630ms of nothing moving, then a single frame changing 28% of the
                  // screen. Every other row in this same list (stylist, look, the primary submit
                  // row) already closes properly; this one is now the same, so all three row
                  // types tear down identically instead of three different ways.
                  <div key={s.id} onClickCapture={(e) => {
                    setService(s.name); push({ service: s.name, city: stadt || undefined });
                    if (onSalonLocate) { e.preventDefault(); e.stopPropagation(); onSalonLocate({ id: s.id, slug: s.slug, name: s.name }); }
                    close();
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
        {/* S6: the whole section goes when the active category has no featured store in it,
            rather than leaving a titled empty block (taste log 2026-07-06, data-state
            filters hide while empty). */}
        {featuredVisible.length > 0 && (<>
          <SectionLabel className="mt-3">{storesLabelTxt}</SectionLabel>
          {/* A Beliebte Store is a specific salon , tapping JUMPS straight to it (marks it selected
              + opens the store page), it does NOT advance to the location step (owner). */}
          {featuredVisible.map((sl) => <SuggestRow key={sl.id} name={sl.name} sub={featuredAddress[sl.id]} Icon={Store}
            onClick={() => { setService(sl.name); push({ service: sl.name, city: stadt || undefined }); goSalon(sl.id, sl.slug, sl.name); }} />)}
        </>)}
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
    <>
      {sheetOpen && (
        <>
          {/* R6: same `sheetOpen` mount and same `openT` driver as the sheet below, so the
              backdrop can no longer disappear out from under the sheet's own chrome.
              `pointer-events` is dropped the instant `open` flips false: a tap during the
              close used to land on the dying overlay (measured: at +120ms `elementFromPoint`
              returned the closing sheet's own collapsed row), which is why re-opening
              immediately after closing did nothing. */}
          {/* mockup-ok: H1, the static blur class is gone and the radius travels with openT. */}
          <motion.div key="scrim" onClick={close} className="fixed inset-0 z-[100]"
            style={{ opacity: scrimOpacity, backdropFilter: scrimBlur, WebkitBackdropFilter: scrimBlur, backgroundColor: scrimTint, pointerEvents: open ? "auto" : "none" }} /* mockup-ok: SEARCH_MORPH.md H1 */ />

          {/* C3 (round 2, "X too small and mis-placed"): port of an owner-dictated
              SEARCH_MORPH.md punch-list fix. Was 36x36 at a fixed `top:14px`, floating alone in
              the blurred zone with no relation to the sheet. Now h-11 w-11 (44px, the
              touch-target floor AND the design-system 38px "circled X" grammar rounded up to
              the floor), right inset matches the sheet's own resting right inset (12px, not the
              viewport's `right-4`=16px), and `top` is derived from the sheet's own cropTop
              (closeXTop above) so it sits just above the sheet's top edge and tracks it through
              the open/close morph. R6: `xOpacity` (the focus-collapse fade) is multiplied by
              the open/close fade so the X leaves WITH the sheet, not on its own clock. */}
          <motion.button key="closeX" onClick={close} aria-label={closeTxt}
            className="fixed right-3 z-[102] grid h-11 w-11 place-items-center rounded-full border border-s-border bg-white text-s-ink"
            style={{ opacity: closeXOpacity, top: closeXTop, pointerEvents: closeXHit }} /* motion-ok: close-X fade, now openT-driven; S3: hit-testing tied to its own opacity */>
            <X size={18} strokeWidth={2.2} />
          </motion.button>

          {/* A7/A8/A9 (2026-08-02 REOPENED): top/left/width/height are continuously driven by
              cropTop/sheetLeft/sheetWidth/sheetHeight (openT composed with expand, declared
              above) instead of a declarative y:"100%"->0 slide, so the sheet grows OUT OF the
              tapped search bar on open and shrinks BACK INTO it on close , never a bottom-sheet
              slide. Mounted with the scrim and X above under ONE `sheetOpen` gate (R6).
              R7 (2026-08-02 round 3): the `activeStep === "date"` branch this style block used
              to carry was dead. It passed `height: undefined`, which does NOT detach the
              already-attached sheetHeight MotionValue, so framer kept writing the last numeric
              height every frame and the "content-height bottom sheet" the comment described
              never existed , measured `top:auto; height:716px`, byte-identical to every other
              step's box. Removing the branch changes no pixel and leaves one set of properties
              for every step, which is also the only shape that can be morphed continuously. */}
          <motion.div key="sheet"
            style={{
              top: cropTop,
              left: sheetLeft,
              width: sheetWidth,
              height: sheetHeight,
              opacity: sheetOpacity,
              pointerEvents: open ? "auto" : "none",
            }}
            className="fixed bottom-0 z-[101] flex flex-col overflow-hidden bg-transparent">

          {/* R7 slot 1 of 3: SUCHE. The white card belongs to the SLOT and never fades, so a
              step change can never make it translucent; only the collapsed face and the
              expanded body crossfade inside it. Height comes from `svcH` (see the slot block
              above), which is where the old `flex-1` used to sit. */}
          <motion.div style={{ height: svcH }} className="shrink-0 overflow-hidden">
            <motion.div style={{ marginLeft: cardMx, marginRight: cardMx, borderTopLeftRadius: cardRadius, borderTopRightRadius: cardRadius, borderBottomLeftRadius: cardRadiusBottom, borderBottomRightRadius: cardRadiusBottom, boxShadow: "0 18px 50px rgba(10,10,10,0.13)" }}
              className="relative h-full overflow-hidden bg-white">
              <motion.div inert={activeStep !== "service"} style={{ opacity: svcT, pointerEvents: svcBodyHit }} className="absolute inset-0 flex flex-col"> {/* S7: inert when this slot is not the active step */}
                <motion.div style={{ height: headingH, opacity: headingContentOp }} className="shrink-0 overflow-hidden"> {/* mockup-ok: SEARCH_MORPH.md G1/G2, rises with the container, no stagger */}
                  <h2 className="px-4 pb-1 pt-4 font-heading text-[24px] font-bold leading-tight tracking-[-0.02em] text-s-ink">{searchHeadingTxt}</h2>
                </motion.div> {/* mockup-ok: SEARCH_MORPH.md F1/F2 */}
                {/* A2/Model B (2026-07-04): the category pill row sits ABOVE the query input,
                    results-only (showCategoryPills). Picking a pill writes ONLY `category` , it
                    never reads or clears `serviceQ` (the free-text query below it).
                    A2 (2026-08-02 REOPENED): now wired into the SAME `expand` transform as the
                    heading (pillsH/pillsOp) so it collapses away on focus instead of pinning the
                    bar down , the padding lives on the INNER div (like the heading's own h2)
                    so the outer motion.div's height/opacity stay the only animated properties. */}
                {showCategoryPills && (
                  <motion.div style={{ height: pillsH, opacity: pillsContentOp }} className="shrink-0 overflow-hidden"> {/* mockup-ok: SEARCH_MORPH.md A2/G1/G2 */}
                    <div className="px-3 pb-2 pt-3">
                      <CategoryPillsRow active={category} onSelect={setCategory} ariaLabel={categoriesLabelTxt} />
                    </div>
                  </motion.div>
                )}
                {/* G1/G2: the field carries `fieldOp`, the same container progress as the heading
                    (no stagger, see the correction note above `containerT`). Wasn't a motion
                    element at all before F1/F2 , content simply rendered at opacity 1 from frame
                    one, the exact "it's all already over there" complaint that started this. */}
                <motion.div style={{ opacity: fieldOp }} className="shrink-0 px-3 pb-1 pt-4"> {/* mockup-ok: SEARCH_MORPH.md G1/G2 */}
                  {serviceBar}
                </motion.div> {/* mockup-ok: SEARCH_MORPH.md G1/G2 */}
                {/* C6 (round 2, "bottom is cut off"): the footer/steps rows collapse away to 0
                    height in the focused/expanded state (footerH/stepsH above), so once
                    focused this scroller IS the bottom of the sheet , its own `pb-4` (16px)
                    didn't clear the safe-area inset on a device with a home indicator.
                    K-A (owner-picked at public/_mockups/search-keyboard/index.html, SEARCH_MORPH.md
                    K4/K2): the sheet no longer shrinks above the keyboard (above), so a row at the
                    keyboard line now runs BEHIND the keys instead of stopping on a hard edge. The
                    scroller's own bottom padding becomes `kbInset` while the keyboard is up so the
                    last row can still be scrolled clear of the keys; at kbInset 0 this is
                    byte-identical to the old fixed safe-area padding. */}
                <motion.div ref={listRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-1"
                  style={{ opacity: listOp, paddingBottom: kbInset > 0 ? `${kbInset}px` : "max(16px, env(safe-area-inset-bottom))" }} /* mockup-ok: SEARCH_MORPH.md G1/G2, same container progress as heading/field, no stagger; folds in the pre-existing K4 padding */
                  onScroll={(e) => { scrollExpand.set(clamp01(e.currentTarget.scrollTop / EXPAND_DIST)); }}>
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
                </motion.div>
              </motion.div>
              <motion.div inert={activeStep === "service"} style={{ opacity: svcFaceOp, pointerEvents: svcFaceHit }} className="absolute inset-x-0 top-0"> {/* S7: the collapsed face is gone while the body is up */}
                {collapsedFace("service")}
              </motion.div>
            </motion.div>
          </motion.div>

          {/* R7 slot 2 of 3: WO?. `mx-3` is the same 12px inset `cardMx` rests at, so the three
              cards share one left/right edge in every state. */}
          <motion.div style={{ height: locH, paddingTop: rowGapTop }} className="shrink-0 overflow-hidden">
            <motion.div inert={rowsFolded} style={{ opacity: locSlotOp }} className="relative mx-3 h-full overflow-hidden rounded-[20px] bg-white shadow-[0_16px_48px_rgba(10,10,10,0.10)]"> {/* S7: whole slot folded away on focus */}
              <motion.div inert={activeStep !== "location"} style={{ opacity: locT, pointerEvents: locBodyHit }} className="absolute inset-0 flex flex-col p-4"> {/* S7: city input + city rows out of the tab order when collapsed */}
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
                        className="min-w-0 flex-1 !border-0 !bg-transparent !min-h-0 !px-0 !text-[16px] text-s-ink placeholder:text-s-ink-2 focus:outline-none focus-visible:outline-none" />
                      {cityQ.length > 0 && (
                        <button onClick={() => { setCityQ(""); cityRef.current?.focus(); }} aria-label="Eingabe loeschen" className="shrink-0 text-s-ink-2">
                          <X size={18} strokeWidth={2.2} />
                        </button>
                      )}
                    </div>
                    {/* K4 follow-up (2026-08-03): the city list needs the SAME keyboard inset as the
                        service list above. Without it the last city cannot be scrolled clear of the
                        keys, which is exactly what the owner's IMG_6914 and IMG_6916 show, and the
                        Wo? step is the one step whose own input RAISES that keyboard. */}
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
                      style={{ paddingBottom: kbInset > 0 ? `${kbInset}px` : undefined }} /* mockup-ok: SEARCH_MORPH.md K4 */>{cityList()}</div>
              </motion.div>
              <motion.div inert={activeStep === "location"} style={{ opacity: locFaceOp, pointerEvents: locFaceHit }} className="absolute inset-x-0 top-0"> {/* S7 */}
                {collapsedFace("location")}
              </motion.div>
            </motion.div>
          </motion.div>

          {/* R7 slot 3 of 3: WANN?. `pb-5` is the 20px tail the old fixed `stepsH` literal
              (ROW_H * 2 + 20) carried, kept so the footer lands on exactly the same y as
              before this rewrite. */}
          <motion.div style={{ height: dateH, paddingTop: rowGapTop, paddingBottom: rowGapBottom }} className="shrink-0 overflow-hidden">
            <motion.div inert={rowsFolded} style={{ opacity: dateSlotOp }} className="relative mx-3 h-full overflow-hidden rounded-[20px] bg-white shadow-[0_16px_48px_rgba(10,10,10,0.10)]"> {/* S7: whole slot folded away on focus */}
              <motion.div inert={activeStep !== "date"} style={{ opacity: dateT, pointerEvents: dateBodyHit }} className="absolute inset-0 flex flex-col px-4 pb-3 pt-4"> {/* S7: the 29-31 day cells out of the tab order when collapsed */}
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
                    {/* R7: the calendar scrolls inside its own card now that the card fills a
                        sized slot , with the keyboard up the sheet can be short enough that a
                        6-row month plus the time chips would otherwise be clipped by the card's
                        own overflow-hidden with no way to reach them. */}
                    {/* K4 follow-up (2026-08-03): same keyboard inset as the other two scrollers, so
                        the last calendar row and the time chips can be scrolled clear of the keys if
                        a keyboard is up when this step is reached. */}
                    <div ref={dateScrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
                      style={{ paddingBottom: kbInset > 0 ? `${kbInset}px` : undefined }} /* mockup-ok: SEARCH_MORPH.md K4 */>
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
              </motion.div>
              <motion.div inert={activeStep === "date"} style={{ opacity: dateFaceOp, pointerEvents: dateFaceHit }} className="absolute inset-x-0 top-0"> {/* S7 */}
                {collapsedFace("date")}
              </motion.div>
            </motion.div>
          </motion.div>

          {/* R7: ONE footer for every step (it used to be duplicated in both panels, at two
              different heights). It still folds away with the focus expand. */}
          <motion.div inert={rowsFolded} style={{ height: footerH, opacity: footerContentOp }} className="shrink-0 overflow-hidden"> {/* S7: footer folded away on focus; F1/F2: also gated on the open/close content phase */}
            {footerInner}
          </motion.div>
          </motion.div>
        </>
      )}
    </>,
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
