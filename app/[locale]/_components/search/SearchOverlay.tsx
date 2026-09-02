"use client";

// mockup-ok: port of LOCKED search-morph mockup (app/[locale]/dev/search-morph/page.tsx,
// council-approved 2026-06-30). Entire file is a design port, not a live exploration.

import * as React from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
// Records that a search showed results, which is what the personal row learns from. Consent-gated
// inside the helper, so a visitor who refused analytics sends nothing.
import { logSearchImpression } from "@/lib/searchTelemetry";
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
  Store,
  MapPin,
  Clock,
  User,
  Scissors,
  Globe,
  Star,
  type LucideIcon,
} from "lucide-react";
import { CITY_ICONS, ALL_CITIES_PARAM, getCityName } from "@/lib/cities";
import { useActiveCities } from "@/hooks/useActiveCities";
import { formatPrice } from "@/lib/format";
import { matchesSearch, splitHighlight } from "@/lib/utils";
import { CATEGORIES } from "@/app/[locale]/_components/homepage/searchCategories";
import { FEATURED_SALONS } from "@/app/[locale]/_components/homepage/searchFeatured";
import { SALON_CATEGORY_SLUGS } from "@/lib/validations";
// A2/Model B (2026-07-04): the SAME category triples SearchTemplate's own category-tab row
// uses (reuse, not a second list). SearchTemplate only ever reaches this file via a lazy
// `next/dynamic(() => import("./SearchOverlay"))` call inside a callback, so this static
// import back does not create an eager circular module-init cycle.
import { CATEGORY_PILLS } from "./SearchTemplate";
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
// S8 (2026-08-11): EmptyState import removed, the no-match state below no longer uses it
// (variant B, owner pick off /dev/search-states).
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
// OPEN_CURVE, 2026-08-05. This REPLACES the hand-picked `OPEN_EASE` cubic-bezier (deleted, not
// layered on top of), because eleven rounds proved a bezier anyone chooses cannot be one to one
// with a real recording. These are the reference's OWN per-frame fractions, measured off
// `/Users/sulo/solen/screenshots/airbnb-open-ref_2026-08-03.MP4` (1206x2622, device px / 3 = points
// exactly) by masking luma >= 250, running full 2D connected components, and tracking the card by
// max IoU against the previous frame. Seeded on the settled frame and tracked BACKWARD to the pill,
// so the seed is the unambiguous end state rather than a guess about the start. Measured on TRUE
// source frames with their real PTS, never an fps=60 resample: the clip drops frames at t=3.300 and
// t=3.625, both inside the open, and a resample would have inserted a fake zero-motion frame at each.
//
// t = 0 is the last frame of a 16-frame / 250ms static plateau whose card rect is BYTE-IDENTICAL on
// all 16 (top 187, bottom 358, left 63, right 1143 device px, zero variance). The departure frame's
// whole-frame mean absolute luma difference is 1,241x the plateau's worst frame, so the alignment is
// not a judgement call. This is the trap the earlier rounds paid for twice: aligning on "the first
// big frame diff" catches the page's own LOAD, and aligning by walking back from the settled frame
// lands on the END of the motion. The plateau departure is the only one of the three that is the tap.
//
// The three properties ride ONE curve: |f_top - f_height| is at most 0.0097 (2.4 device px) and
// |f_width - f_height| at most 0.0289 (1.5 device px), both inside their own measurement
// quantisation. So one progress value drives top, height and width, which satisfies the
// one-continuous-set-of-values rule by construction rather than by discipline. The samples below are
// the HEIGHT fractions, the finest-grained of the three (1212 device px of travel).
//
// Shape, and why no bezier could reach it: the remaining fraction's decay ratio per frame starts at
// 0.939 (a real ramp-in, zero initial velocity), falls to about 0.80, then HOLDS constant. Constant
// decay ratio is exponential settling, which is a spring, which is why the tail runs 200ms past the
// point the motion looks finished. A fixed-duration bezier lands hard at its duration and has no
// such tail. Sampling the real curve reproduces it without anyone picking a stiffness or a damping.
//
// Fidelity of these 20 samples, linearly interpolated back against EVERY measured frame from 0 to
// 500ms: height RMS 0.00256 of travel, max error 0.00696 (2.81pt); top max error 0.98pt. Two endpoint
// values are forced rather than measured, named here rather than hidden: at t = 500ms the measured
// fractions are f_top 0.9960 and f_height 0.9992, and both arrays end at 1.0 so the animation lands
// exactly. That override is 0.34pt on card top and 0.03pt on height.
//
// Everything needed to re-derive these numbers is in this block plus the source MP4 named above.
// The detector and its per-frame JSON were scratch files and are NOT checked in, so do not go
// looking for them in `_plans/SEARCH_MORPH.md`: re-run the extraction from the recording instead.
const OPEN_CURVE_IN = [
  0, 0.05263, 0.10526, 0.15789, 0.21053, 0.26316, 0.31579, 0.36842, 0.42105, 0.47368,
  0.52632, 0.57895, 0.63158, 0.68421, 0.73684, 0.78947, 0.84211, 0.89474, 0.94737, 1,
];
const OPEN_CURVE = [
  0, 0.1074, 0.2596, 0.4119, 0.5563, 0.6751, 0.7643, 0.836, 0.8828, 0.9184,
  0.9462, 0.9617, 0.9737, 0.982, 0.9885, 0.9926, 0.9953, 0.9966, 0.9979, 1,
];
// MEASURED, not chosen. 500ms is where all three properties are inside a third of a point of final
// and never leave (width +308.3ms, top +433.3ms, height +500.0ms). The prior 0.6 came from "height
// is still climbing at 600ms", which is true but is the last THIRD OF A POINT crawling in, not
// visible travel. Exact-final-value-never-changes-again is +583ms top / +600ms height; 99%-of-travel
// is +308/+383/+400ms. Those three answers differ and only this one is the design decision.
const OPEN_MS = 0.5;
// SCRIM_KNEE, 2026-08-05 (J2), OPEN-ONLY as of the K2 close rebuild below. R6 picked 0.18 as the
// `openT` value below which the backdrop starts clearing on the OPEN; that stays, untouched, because
// the task that follows is explicit: do not touch the open, it already rides its own measured curve.
// J2's OTHER idea, rescaling the CLOSE's geometry to finish at this same knee, is DELETED (see K2):
// it was a chosen divisor, not a measurement, and the owner caught the result ("you just made the
// closing even faster"). The close now reads its own measured curve (CLOSE_CURVE) instead.
const SCRIM_KNEE = 0.18;
// CLOSE_MS / CLOSE_CURVE / CLOSE_SCRIM_CURVE, 2026-08-06 (K2). J2 made the close's box finish its
// whole travel at SCRIM_KNEE (18% of the run) by rescaling `morphT`'s own input, then let the
// backdrop alone cover the remaining 82%. Owner: "you just made the closing even faster... now we
// got another problem". Measured cost at the time: the box shrank in ~150ms of the 333ms close and
// the blur alone kept moving for the final ~150ms with nothing else on screen changing. That was a
// chosen divisor, not a copy of anything real.
//
// This replaces it with his OWN close, extracted the same way OPEN_CURVE was: masking near-white,
// tracking the card's own rect frame by frame (device px / 3 = pt exactly), off
// `/Users/sulo/solen/screenshots/airbnb-open-ref_2026-08-03.MP4`. The clip has exactly one close in
// it (he taps X from the "Where?" step, ~16.20s-16.59s of the recording); there was no second one to
// choose between. Plateau evidence: 16 frames from t=15.80s to t=16.20s hold a byte-identical
// whole-frame diff of 0.00-0.05 (compression noise, not motion) while the card sits at its "Where?"
// rect (top 141pt, bottom 467pt at 402pt device width); the departure frame (whole-frame diff jumps
// to 8.28, a 170x step) is the tap. Settle is where the backdrop's own edge energy (a texture-based
// de-blur proxy, immune to the page background being near-white like the card) stops climbing:
// t=16.5867s, matching the card's rect independently converging on the SAME static rect this file
// already measured at rest (359.0 x 57.0pt at 21.3,62.3). Real close duration, measured, not chosen:
// 16.5867 - 16.2367 = 350ms (replaces the guessed 333ms carried over from a different clip).
//
// The finding the task asked for: geometry and backdrop do NOT land together, and the direction J2
// guessed (geometry first, backdrop trails) was RIGHT, but J2's own numbers were nowhere close. The
// box is front-loaded (91% of its own travel done by 59% of the 350ms, still visibly easing the last
// 9% in) while the backdrop is back-loaded (0% moved through 65% of the run, then rushes to 98.5% in
// the closing 35%, over half of that in the last 10%). Two curves, not one knee.
// CORRECTED 2026-08-07, and the correction is mine to own: 350ms came from his card's rect
// converging to its FINAL value, which is the last sub-pixel of settling, not the moment the thing
// stops being on screen. Measured both closes side by side at 402x874, counting the rows carrying a
// wide near-white run, i.e. how much CARD is actually present:
//   ms      0    33    66   100   133   166   200   233   266   300   333
//   his   332   230   192   172   128    92    80   (page reads back in)
//   ours  332   232   208   164   158   138   114   108    84    72    66
// His card is at bar size by roughly 215ms. Ours did not get there until 333ms, so it hung around
// for an extra ~120ms after his was gone, which is the lingering he kept reporting. The start
// matches (230 against 232 at 33ms); the divergence is entirely in how long it takes to leave.
const CLOSE_MS = 0.22;
const CLOSE_CURVE_IN = [
  0, 0.05263, 0.10526, 0.15789, 0.21053, 0.26316, 0.31579, 0.36842, 0.42105, 0.47368,
  0.52632, 0.57895, 0.63158, 0.68421, 0.73684, 0.78947, 0.84211, 0.89474, 0.94737, 1,
];
// Fraction of the box's OWN close travel completed (0 = departure rect, 1 = settled bar), sampled at
// the CLOSE_CURVE_IN times above (fraction of the measured 350ms).
const CLOSE_CURVE = [
  0, 0.086, 0.2222, 0.3344, 0.4353, 0.5336, 0.613, 0.6727, 0.7354, 0.8052,
  0.8586, 0.8957, 0.9213, 0.9418, 0.9606, 0.9781, 0.9836, 0.9891, 0.9945, 1,
];
// Fraction of the backdrop's own clearing completed, same time samples. Stays at 0 through the first
// ~65% of the close (the page behind is still fully scrimmed while the box is already mostly home),
// then clears fast at the end.
const CLOSE_SCRIM_CURVE = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0.0052, 0.0207, 0.051, 0.1113, 0.2555, 0.7207, 1,
];
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
// mockup-ok: SEARCH_MORPH.md K2, dispatched fix, port of an owner-scoped close-morph correction.
// Linear interpolation through a measured curve (xs/ys, e.g. OPEN_CURVE_IN/OPEN_CURVE or
// CLOSE_CURVE_IN/CLOSE_CURVE). Same job a fixed-range motion-value curve mapping does for one shape,
// pulled out as a plain function so ONE motion-value callback can pick between the open shape and
// the close shape on the static `open` boolean, the same branch-inside-one-value pattern this file
// already uses for contentOp/locSlotOp/dateSlotOp.
function lut(x: number, xs: readonly number[], ys: readonly number[]): number {
  const v = clamp01(x);
  for (let i = 0; i < xs.length - 1; i++) {
    if (v <= xs[i + 1]) {
      const t = (v - xs[i]) / (xs[i + 1] - xs[i]);
      return ys[i] + (ys[i + 1] - ys[i]) * t;
    }
  }
  return ys[ys.length - 1];
}

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
  const { cities: activeCities, loading: citiesLoading } = useActiveCities();  // the live set, shared with every other city picker
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
  const totalResults = results.services.length + results.salons.length + results.stylists.length;
  const hasResults = totalResults > 0;

  // One record per distinct search that actually returned something. This is what the personal row
  // on the home page learns from. Lifted 2026-08-14 from the June work that was never merged; only
  // this half came across, because the click half sits inside result rows this file has since been
  // rewritten around, and guessing where they now live is how a wrong line gets shipped.
  const lastLoggedSearch = React.useRef("");
  React.useEffect(() => {
    const q = serviceQ.trim();
    if (q.length >= 2 && totalResults > 0 && lastLoggedSearch.current !== q) {
      lastLoggedSearch.current = q;
      logSearchImpression({ query: q, locale, resultsCount: totalResults });
    }
  }, [serviceQ, totalResults, locale]);

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
  // C1: the SAME response already carries each salon's cover and rating. It used to be dropped on
  // the floor and the row drew a grey glyph instead. No new request.
  const [featuredMeta, setFeaturedMeta] = React.useState<Record<string, { photo: string | null; rating: number | null }>>({});
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
      .then((data: { items?: { id: string; address?: string | null; cover_photo_url?: string | null; average_rating?: number | null }[] }) => {
        if (cancelled) return;
        const next: Record<string, string> = {};
        const meta: Record<string, { photo: string | null; rating: number | null }> = {};
        for (const item of data.items ?? []) {
          if (item.address) next[item.id] = item.address;
          meta[item.id] = { photo: item.cover_photo_url ?? null, rating: item.average_rating ?? null };
        }
        setFeaturedAddress(next);
        setFeaturedMeta(meta);
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
    // N1 (2026-08-11, owner: "bottom nav bar is everywhere"). Measured with the panel open: the
    // floating nav sits at y 774 to 832 while the panel's own Suchen button runs 740 to 786, so the
    // bar crosses the commit action by 12px. Two fixed bars at the bottom of one phone is the exact
    // case BottomNav's own header comment already calls out, and the sticky-CTA floor says the
    // commit action owns that slot. The nav yields while the panel is up and comes straight back on
    // close. A body attribute rather than a prop because the two components never meet in the tree:
    // the nav is mounted in the locale layout and this sheet is a portal.
    body.setAttribute("data-overlay-open", "search");
    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.left = prev.left;
      body.style.right = prev.right;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      body.removeAttribute("data-overlay-open");
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
        // Routed through `pendingFocus` (see the effect further down) instead of a bare rAF.
        // 2026-08-11: measured with the panel open from the home bar, document.activeElement was
        // NOT this input and four typed characters left the value empty. A requestAnimationFrame
        // scheduled from inside this effect can still land before the input is focusable, and when
        // it does, `.focus()` fails silently and the field just sits there looking ready. The exact
        // same failure was found and fixed on the city input in the step above. One mechanism now,
        // and it runs after the commit.
        setPendingFocus("service");
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
  // F3 RESOLVED 2026-08-04 (was parked, owner: fix the animation, stop asking permission on an
  // already-identified fix). Reference travel: pill 62 -> settled card 146 on a 402x874 device,
  // 84pt. Scaled by the device-height ratio (812/874 = 0.929): 84 * 0.929 = 78px here. Landed on
  // the measured home-pill origin (82) + 78 = 160, replacing the old 96 that only travelled 14px
  // (82 -> 96) and read as growing in place instead of migrating down the screen. This DIRECTLY
  // moves the accepted "bar y228 to y66" pin (it is RESTING_TOP + 16px pt-4, so it moves 1:1);
  // the new resting bar number is measured and reported plainly below, not silently kept at the
  // old one. `focusedTop` just below is a SEPARATE literal this does not touch, so the focused
  // state the owner already approved at (12, 66) does not move.
  // ROOT CAUSE FIX 2026-08-11 (audit, five defects at short viewports, one cause): 160 stays as
  // the CEILING this F3 measurement produced, but it is no longer read directly. On any screen
  // shorter than the 844 this was measured on, a flat 160 held the scrim band at the SAME pixel
  // count regardless of how little height was left underneath it, so the sheet's floor (200,
  // `sheetHeight` below) started winning below about 780px. `RESTING_TOP` itself, the value
  // `topFor` actually reads, is declared further down as a viewport-scaled clamp of this ceiling,
  // once `viewport.h` exists (it is declared after this point in the component, so reading it
  // here would run before it is initialised).
  const RESTING_TOP_MAX = 160; // mockup-ok: named copy of the pre-existing cropTop resting literal below
  const focusedTop = Math.max(safeTop + 6, 50); // mockup-ok: named copy of the pre-existing cropTop focused literal below
  // H5 (2026-08-03, "WHERE it opens"): the reference's settled card does not reach the screen's
  // own bottom edge; a strip of blurred page stays visible below it. Measured directly on
  // airbnb-open-ref_2026-08-03.MP4 (PIL pixel-sample of the settled "Where?" frame, 402x874pt):
  // the last solid element on screen, the pink Search button, ends at y824; below that, 50pt
  // (5.7%) is bare blurred page down to the true screen edge at 874. That refutes the 168pt/19%
  // figure this round started from (traced to a different, uncounted card boundary) , the real
  // number is 50/874. Applied as a ratio of `viewport.h` so it scales with device height the same
  // way the reference figure was derived (cross-device translation precedent: F1's 82pt-of-874pt
  // travel note above `topFor`).
  const REST_BOTTOM_MARGIN_RATIO = 50 / 874;
  const headingH = useTransform(expand, [0, 0.55], [HEADING_H, 0]); // mockup-ok: pre-existing
  // S1 (2026-08-12, owner with three of his own captures: "u see the diffrence between em the sheet
  // size between wo and search i like search better"). Measured off those captures at 402x874: the
  // Suche sheet opens at 112.0, the Wann? sheet at 119.7, the Wo? sheet at 168.3, so Wo? is the one
  // outlier and it is low by 56.3. `HEADING_H` directly above is 56. That is not a coincidence: the
  // service heading has folded on this axis since it was written, and the location heading was
  // never wired to it, so the Wo? card keeps a heading band the Suche card drops the instant the
  // field takes focus. With the heading present the city input also sits 59pt down the card instead
  // of 17, iOS scrolls further to clear the keyboard, and the sheet rides down with it.
  //
  // Same axis, its OWN measured height. The location heading is a 24px line at leading-tight (30)
  // plus `mb-3` (12), inside the card's `p-4`; it is not the service heading's 16px-padded box, so
  // reusing HEADING_H here would push the unfocused Wo? card's content down 14px and change a
  // screen he did not complain about.
  const LOC_HEADING_H = 42;
  const locHeadingH = useTransform(expand, [0, 0.55], [LOC_HEADING_H, 0]); // mockup-ok: the existing focus-fold axis, extended to the one step that was never wired to it; his own measurement is the target, not a new motion
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
      // K6 (2026-08-12, owner "you didnt fix", and his own two captures are the evidence).
      // K2 below assumes `position: fixed` stays glued to the LAYOUT viewport while iOS scrolls
      // the VISUAL one out from under it, so it adds the offset back. If that were the whole
      // story, both steps would put their sheet at `focusedTop`, about 65 on his phone. He
      // measured 112 on Suche and 168 on Wo?, both LOW, by two different amounts that look like
      // two different scroll distances, which is the signature of the compensation being applied
      // on top of a browser that already did it. Safari has re-anchored fixed elements to the
      // visual viewport since iOS 16, so on his phone K2 corrects a shift that never happened.
      //
      // Rather than pick a side of that and be wrong on half the devices, MEASURE it. A probe
      // pinned at `fixed; top: 0` renders wherever this browser decides fixed elements go, and
      // reports that place in the SAME coordinates every other rect in this file is measured in.
      // So the distance the sheet must travel to sit at a wanted `y` is simply `y - probeTop`,
      // and the correction term is `-probeTop`:
      //   desktop, no keyboard   probeTop 0    correction 0    identical to before, by construction
      //   fixed follows the page probeTop -O   correction +O   exactly what K2 added, kept
      //   fixed follows the eye  probeTop 0    correction 0    no double count
      //
      // CORRECTED 2026-08-12 in the same hour it was written, from his own screenshot rather than
      // from reasoning. The first version of this line added `offsetTop` on top of `-probeTop`,
      // which on his phone is O + O, and he measured the result: the Wo? sheet went from opening
      // at 168.3 to opening at 298.3, further from the Suche step's 112.0 instead of nearer. One
      // term, measured, not two.
      const probe = document.createElement("div");
      probe.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;visibility:hidden;pointer-events:none";
      document.body.appendChild(probe);
      const probeTop = probe.getBoundingClientRect().top;
      probe.remove();
      setVvOffset(Math.max(0, Math.round(-probeTop)));
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
  // `openT` is now RAW NORMALISED WALL-CLOCK progress on the open (the open's `animate` below runs
  // it linear), and `morphT` is the reference's own measured shape applied to it. Every geometry
  // property (top, height, width, left) reads `morphT`; the alpha ramps below (chromeOpacity,
  // ghostLabelOp) keep reading `openT`, which is what makes their windows mean milliseconds again.
  // `scrimOpacity` reads raw `openT` too, on open AND close (J1's close-side branch onto `morphT`
  // is reverted, see J2 there): the backdrop no longer chases the box, because the box is now
  // required to finish first.
  //
  // Why the shape lives HERE and not on `openT` itself: driving `openT` along the samples directly
  // was measured and rejected. It would pull the outgoing "Suchen" ghost's [0, 0.22] window from
  // 114.5ms (today) to 46ms, because `curve(0.092) = 0.22`. The ghost being alive early and gone by
  // about 100ms is a DO-NOT-REGRESS item. Splitting raw-time from shape keeps the ghost at 110.0ms
  // AND puts the measured curve on the box. One mapping, monotone, a pure function of `openT`, so
  // this is still one continuous set of values over one tree: no threshold, no second clock.
  // K2 (2026-08-06): J2's rescale (finish the box's whole travel by `openT === SCRIM_KNEE`, chasing
  // a knee nobody measured on the close itself) is DELETED, not retuned. `morphT` now reads its own
  // measured curve per direction, off the SAME raw `openT`, on the SAME branch-on-`open` pattern
  // `contentOp`/`locSlotOp`/`dateSlotOp` already use: OPEN_CURVE (unchanged, still identity-scaled
  // on `open`, so no open DO-NOT-REGRESS item can move) and CLOSE_CURVE, his own close, extracted
  // the same way. `openT` runs 1 -> 0 on close, so `1 - openT` is close-progress (0 at the tap,
  // 1 at settle) and `1 - lut(...)` turns "fraction of the close travelled" back into "fraction
  // open", the same 0..1 meaning `topFor`/`sheetHeight`/`sheetWidth` below already expect.
  const morphT = useTransform(openT, (v) => // mockup-ok: SEARCH_MORPH.md K2, measured close curve
    (open ? lut(v, OPEN_CURVE_IN, OPEN_CURVE) : 1 - lut(1 - v, CLOSE_CURVE_IN, CLOSE_CURVE)));
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
  // H3 SUPERSEDED (2026-08-05): the `/ 0.8` is GONE, and this note replaces the one that told the
  // ninth round to keep it. Both of those rounds were right about the OBSERVATION and wrong about
  // the mechanism. What the divider was really doing was hand-approximating "settles early, then a
  // long slow tail", because a fixed-duration bezier lands hard at its duration and cannot produce a
  // tail on its own. That shape is now MEASURED rather than approximated: the reference's own curve
  // is at 0.9462 by 53% of the duration and 0.9926 by 79%, so the early settle the `/ 0.8` was
  // faking is intrinsic to `morphT` already. Keeping both would compress the measured curve into 80%
  // of its own duration, which is precisely the "pick another constant and layer it on top" method
  // that produced eleven rounds. The A/B that justified the divider was scored in a world where the
  // only alternative was another bezier; it is not evidence about a sampled curve.
  //
  // `oT` here is `morphT` (already shaped), so this function no longer applies any curve of its own.
  // K3 (2026-08-06): the `oT < 1` branch used to interpolate FROM `RESTING_TOP` unconditionally,
  // as if every close started from the composed/unfocused sheet. A close that actually starts
  // FOCUSED (`ex` above 0) begins its geometry at `settledTop` below, not at `RESTING_TOP`, so
  // hardcoding `RESTING_TOP` here made the very first close frame snap from the real starting
  // top (e.g. `focusedTop`) to `RESTING_TOP` before the measured curve had moved at all , the
  // owner's captured "collapses bottom-up, top stays near the top of the screen" symptom. Both
  // branches now share ONE settled-top expression (byte-identical to the old `oT >= 1` branch),
  // so `oT < 1` interpolates from wherever the sheet actually is, ex included, to `origin.top`.
  // On the OPEN, `ex` is always 0 until the container finishes growing, so `settledTop` reduces
  // to the old hardcoded `RESTING_TOP` in every case the open exercises , this is a no-op there.
  //
  // ROOT CAUSE FIX 2026-08-11, continued from RESTING_TOP_MAX above. Measured on the unfocused
  // sheet (ex 0, the state `topFor(1,0)` returns): a flat 160 left `sheetHeight` at 236px on a
  // 420-tall viewport, short of the 276px the three collapsed rows plus the footer need just to
  // lay out without clipping (56 + 66 + 86 + 68), which is the actual number behind both "the
  // footer sits 16px past the bottom edge" and "the calendar scroller has no room for a single
  // day row" at that height. `RESTING_TOP_MAX / 844` is the ratio 160 already implies against the
  // device it was measured on, so multiplying it by the real `viewport.h` reproduces 160 exactly
  // at 844 (the `Math.min` below is then a no-op, so a tall phone is untouched) and shrinks it
  // below that height instead of holding it constant. At 420 this gives RESTING_TOP ~= 79.8,
  // which raises `sheetHeight` to ~316px, clear of the 276px floor. `Math.max(32, ...)` only
  // starts changing that value under ~169px of viewport height, so it never touches any of the
  // seven heights this fix was measured against; it exists purely so a viewport shorter than any
  // of those still gets a sheet instead of RESTING_TOP overshooting the available height itself.
  const RESTING_TOP = Math.min(RESTING_TOP_MAX, Math.max(32, viewport.h * (RESTING_TOP_MAX / 844)));
  // W3 (2026-08-11). Third attempt, and the two before it are worth naming because this one is
  // their arithmetic corrected rather than a new idea.
  //
  // The complaint, twice from his own phone: the Wo? card runs on as blank white under its last
  // row. With the live city set down to Basel alone the card holds two rows and the rest is paper.
  //
  // Attempt 1 capped the CARD and handed the leftover to another slot, which moved the hole above
  // the list instead of below it, and clipped "Basel" by 30px.
  // Attempt 2 pushed the SHEET's top down by the leftover, which is the right shape, and got the
  // sum wrong: it subtracted only what the Wo? card needs and forgot that the sheet also carries
  // the collapsed Suche row, the collapsed Wann? row and the footer. It over-subtracted by about
  // 210px, the sheet hit its 200px floor, and the panel collapsed to a strip.
  //
  // So: the same push, with every occupant counted. The Suche row is always 56. The Wann? row and
  // the footer fold away on the focus axis, so they are scaled by (1 - ex), exactly as their own
  // transforms do. The Wo? card's own need is counted from the row count, not measured off the DOM,
  // so there is no observer and no re-render loop.
  //
  // It only ever REDUCES the sheet, it is multiplied by locT so it is exactly zero on every other
  // step, and it reads `kbInset` so the keyboard case (his screenshot) is the one it helps most.
  // MEASURED off the live card rather than estimated, which is what the first two attempts got
  // wrong: card padding 16 top and 16 bottom, heading 30, a 12 gap, the field 48, an 8 gap, and
  // the slot's own 10 and 20 gaps around the card. Rows are 68 each, including the one that
  // carries a subtitle. The +32 on the end is deliberate headroom: this value only ever REDUCES
  // the sheet, so being generous costs a little white and being mean clips the last row, and
  // clipping "Basel" in half is exactly how attempt 1 failed.
  const LOC_ROW_H = 68;
  // 2026-08-11, corrected the same evening: the field went from 48 to 56 tall when he picked
  // variant B, and this sum still counted 48, so the card came up 8px short and sliced the
  // Basel row at the bottom edge with the keyboard up. That is the exact failure the +32
  // headroom exists to prevent, and it did not, because the error was in a term rather than in
  // the margin. Any future change to the field's height has to move this number with it.
  const LOC_CHROME_H = 16 + 30 + 12 + 56 + 8 + 16 + 10 + 20 + 32;
  const locNeed = LOC_CHROME_H + LOC_ROW_H * ((citiesLoading ? 0 : activeCities.length) + 1);
  const svcT = useMotionValue(activeStep === "service" ? 1 : 0);
  const locT = useMotionValue(activeStep === "location" ? 1 : 0);
  const dateT = useMotionValue(activeStep === "date" ? 1 : 0);
  const locSlackFor = React.useCallback((rawTop: number, ex: number, l: number) => {
    if (l <= 0) return 0;
    const others = 56 + (86 + 68) * (1 - ex); // Suche row, then Wann? row + footer, which fold
    // W4 (2026-08-11, owner: "when u click wo n kezboard mode it bugs"). This used to subtract
    // `kbInset`, which is the height the keyboard covers, and that is what made it move.
    //
    // On a phone the keyboard does not resize the page, it slides up over it, and `kbInset` climbs
    // from 0 to about 330 while it does. Feeding that into the sheet's own TOP meant the whole
    // panel slid down as the keyboard slid up, every time, on a control he had just tapped. Two
    // things moving against each other on one gesture is exactly what "it bugs" describes.
    //
    // The keyboard is not part of this sum any more. The card keeps the height it had before the
    // keyboard appeared; the extra sits behind the keys where nobody can see it, which costs
    // nothing, and the sheet stays still.
    const spare = viewport.h - rawTop - locNeed - others;
    // AND IT ONLY APPLIES WHILE THE COMPOSER IS SHOWING. Measured after the keyboard term came out
    // and it still moved: tapping the field pushed the sheet DOWN by 154px, because folding the
    // composer frees 154px of room and this handed every one of them straight back as slack. The
    // panel is supposed to grow UP into that space, which is what it did before any of this, so
    // the slack is scaled by (1 - ex) and is exactly zero the moment the field takes focus.
    // What survives is the case he actually complained about first: Wo? open, no keyboard, half a
    // screen of white under two rows.
    return Math.max(spare, 0) * l * (1 - ex);
  }, [viewport.h, locNeed]);

  const topFor = React.useCallback(
    (oT: number, ex: number) => {
      const settledTop = RESTING_TOP + (focusedTop - RESTING_TOP) * ex;
      const base = oT < 1
        ? origin.top + (settledTop - origin.top) * oT
        : settledTop;
      // K2: `+ vvOffset` puts the sheet's top where the user actually sees it. It is 0 in every
      // state without a visual-viewport scroll, so this is identity everywhere else.
      return Math.max(minTop, base) + vvOffset;
    },
    // `viewport.h` added (root cause fix): RESTING_TOP now derives from it, and without this
    // dependency `topFor` would keep returning a value computed from a stale RESTING_TOP after a
    // resize/orientation change until one of the other deps also happened to change.
    [origin, focusedTop, minTop, vvOffset, viewport.h],
  );
  // D1 (2026-08-12, owner: "wann calender is not fully all visable yk", with his own Airbnb capture
  // of the same step). Measured off that capture at 402x874: their sheet starts 146pt down and the
  // When card runs from 168pt to about 760pt, so the WHOLE month fits with no scrolling, all six
  // rows, 1 through 31. Ours starts its sheet at 19% of the screen and the calendar gets a 234pt
  // window onto 300pt of month, so it cuts mid-row, which is exactly what his screenshot shows.
  //
  // So the date step lifts the sheet instead of pushing it down: the same one value the location
  // step already uses to give height BACK, run the other way, and clamped at the same `minTop`
  // everything else respects. 0.6 of the distance to that floor puts our sheet at about 7% on his
  // screen size, which is where the reference has it, and it is multiplied by `dateT` so it is
  // exactly zero on every other step.
  const dateLiftFor = React.useCallback((rawTop: number, d: number) => {
    if (d <= 0) return 0;
    return Math.max(rawTop - minTop, 0) * 0.6 * d;
  }, [minTop]);
  const cropTop = useTransform([morphT, expand, locT, dateT], (latest) => { // mockup-ok: SEARCH_MORPH.md A7/A8/A9
    const [oT, ex, l, d] = latest as [number, number, number, number];
    const raw = topFor(oT, ex);
    return raw + locSlackFor(raw, ex, l) - dateLiftFor(raw, d);
  });
  // Measured on the reference: `left * 2 + width = 402.0` at EVERY frame, to within 0.02pt. The card
  // is centred throughout and expands symmetrically, so left is not an independent property, it is
  // derived from width. Ours is centred at both ends too (origin.left with origin.width = w - 32,
  // then 0 with the full viewport), so driving both off the one `morphT` keeps that identity instead
  // of animating left on a second curve that could drift out of centre mid-flight.
  const sheetLeft = useTransform(morphT, [0, 1], [origin.left, 0]); // mockup-ok: SEARCH_MORPH.md H3, measured curve, full travel
  const sheetWidth = useTransform(morphT, [0, 1], [origin.width, viewport.w]); // mockup-ok: SEARCH_MORPH.md H3, measured curve, full travel
  // C6 (round 2, "bottom is cut off"): port of an owner-dictated SEARCH_MORPH.md punch-list
  // fix, not a live design exploration. Measured cause: this used to interpolate ONLY on
  // openT, so once fully open its height stayed pinned to `viewport.h - RESTING_TOP` even
  // while the FOCUSED/typing state (`expand`) raises the sheet's top to `focusedTop` , the
  // bottom edge then sat short of the viewport (top moved up, height didn't grow to
  // compensate), the same gap `cardRadiusBottom`'s flush-bottom assumption already expects not
  // to exist. Mirrors cropTop's own piecewise shape (open morph 0->1, then focus progress on
  // top of that) so the sheet's bottom edge reaches the true viewport bottom in EITHER state,
  // one continuous transform, no threshold swap.
  const sheetHeight = useTransform([morphT, expand, locT, dateT], (latest) => { // mockup-ok: SEARCH_MORPH.md C6, H5
    const [oT, ex, l, d] = latest as [number, number, number, number];
    // K-A: the usable bottom edge is always the viewport's own bottom, keyboard up or not, so
    // the sheet is never shrunk to sit above the keys (that was K-B, rejected at the K4
    // chooser). Height is always "bottom minus the top `topFor` just returned", so the sheet's
    // bottom edge lands exactly there in every state.
    // H5: `ex` (expand) already reaches 1 whenever the keyboard is up OR the field is focused
    // (`expand = max(scrollExpand, kbT)`, above), so gating the margin on `ex` alone keeps the
    // keyboard-up and focused states flush at the true viewport bottom (K-A, C6, both
    // DO-NOT-REGRESS) and only opens a gap in the composed, unfocused moment , the exact moment
    // "OURS settled" was measured at. One continuous value, same `ex` this function already
    // takes, no new threshold and no new motion value.
    // K5 (2026-08-12, owner: "when on keyboard wo why when expanded no full oage on the bottom yk
    // like sheet is not long enough", with his own shot of the Wo? step, keyboard up, the white
    // stopping short of it). The cause is an asymmetry in this file, not anything about iOS:
    // `topFor` ends in `+ vvOffset` (K2 above) so the TOP follows the viewport the user can
    // actually see, and this line then computes the height as "layout bottom minus that top",
    // which cancels the term and leaves the BOTTOM edge pinned to the layout viewport. When iOS
    // scrolls the visual viewport up to clear the keyboard, that bottom edge renders exactly
    // `vvOffset` above the bottom of what he can see, which is the gap in his screenshot.
    //
    // Adding the same term to the bottom is what K-A below already says it wants: the usable
    // bottom edge is the viewport's own bottom in every state, keyboard up or not. `vvOffset` is
    // 0 with no keyboard and on every desktop browser, so this is identity everywhere else, the
    // same way the top's copy of it is.
    // D2 (2026-08-12): `* (1 - d)` hands the rest margin back to the DATE step, and only to it.
    // His IMG_7121 still slices the 31 row, which I had reported fixed off a 780-tall desktop
    // viewport that has no Safari chrome; re-measured at the heights his phone actually gives the
    // page, the month needs 300 and the calendar's scroller gets 288 at 730, 262 at 700, 236 at
    // 670. D1 above has already pulled the sheet's top as far as it may go, so the only space left
    // is this 40px margin at the BOTTOM, which exists to make the settled composed sheet sit off
    // the edge and has no job while a step is open and full. Taking it clears the month at 730
    // (330 against 300) and at 700 (302 against 300). It deliberately does NOT touch the sheet's
    // TOP, because he measured the Wann? sheet at 119.7 in the same message and put it on the side
    // he likes; moving the top would "fix" a screen he just approved.
    const restMargin = viewport.h * REST_BOTTOM_MARGIN_RATIO * (1 - ex) * (1 - d);
    const bottom = viewport.h + vvOffset - restMargin;
    if (oT < 1) {
      // W3: the same slack the top takes, so the bottom edge stays pinned where K-A put it.
      const rawResting = topFor(1, ex);
      const restingHeight = Math.max(bottom - rawResting - locSlackFor(rawResting, ex, l) + dateLiftFor(rawResting, d), 200);
      // H3 (2026-08-05): `oT` is `morphT`, the same already-shaped value `topFor` just took, so
      // height and top still settle on the same frame, never a box that is already tall but not yet
      // positioned. The `/ 0.8` that used to sit here is gone for the reason written above `topFor`.
      return origin.height + (restingHeight - origin.height) * oT;
    }
    const raw = topFor(oT, ex);
    return Math.max(bottom - raw - locSlackFor(raw, ex, l) + dateLiftFor(raw, d), 200);
  });
  // R6 (2026-08-02 round 3, owner bug report): the scrim used to fade on its OWN
  // AnimatePresence clock while the sheet faded on `openT`. The two curves are not the same
  // shape, so the sheet's own backdrop died about 4x faster than the sheet: for ~250ms the
  // white overlay cards and the ink Suchen pill were painted straight onto a sharp, unblurred
  // results feed and read as duplicated chrome. Both now read the SAME `openT`, on curves
  // chosen so the scrim is >= the sheet at every value of openT , the blur outlives the sheet
  // by construction, not by two clocks that happen to agree until someone edits one.
  // R6's guarantee stands, and J2 (see `scrimOpacity` below) is what makes it true again. When H3
  // moved the box's own geometry off `openT` onto `morphT`, ">= the sheet at every value of openT"
  // stopped being the same claim as ">= the sheet on screen". J1 tried to fix that by moving the
  // scrim onto `morphT`; J2 reverts that and instead makes the close's geometry LAND at the same
  // `SCRIM_KNEE` this ramp starts falling at, so both halves are anchored to one shared constant.
  // H4 (2026-08-03): this drives the close-X only, NOT the sheet. It used to sit on the sheet
  // wrapper, where it composited the white paper and the ink on ONE alpha (see the sheet's own
  // style block for the measurement that killed that). Renamed from `sheetOpacity` so the name
  // cannot re-attract a "the sheet fades" edit.
  const chromeOpacity = useTransform(openT, [0, 0.35, 1], [0, 0.55, 1]); // mockup-ok: SEARCH_MORPH.md H4
  // J1 REVERTED, J2 replaces it (2026-08-05). J1 pointed the close half of the scrim at `morphT`,
  // the value that actually paints the box, so the backdrop would stay up until the box was small.
  // That was the right diagnosis and the wrong lever, and it was reported as "roughly halved" on an
  // analytic model rather than on frames. Measured on real compositor frames at 375x812, the model
  // understated it: it assumed a 444px open box when this build's resting sheet is 605.55px, so the
  // excess it predicted at scrim 0.20 was 11.5px and the measured excess at scrim 0.21 was 22px.
  // The deeper point is that no divisor here can reach zero. Both the scrim and the box's excess
  // height were monotone functions of the one driver, so they were locked in a straight line
  // (excess was a fixed 97px per unit of scrim opacity here) and both only hit 0 on the same last
  // frame. Every intermediate frame therefore had a part-cleared page under a still-oversized white
  // box, which is exactly the thing the owner kept seeing. Changing the divisor tilts that line; it
  // cannot delete it.
  //
  // K2 (2026-08-06): J2's fix was ordering by CONSTRUCTION (force the geometry to land at the exact
  // `openT` value this ramp starts falling from) rather than by measurement, and the owner caught the
  // result. His own close answers the R6 question directly instead: does the backdrop clear WITH the
  // box or after it, and by how much. Measured (see CLOSE_SCRIM_CURVE above): the backdrop stays at
  // 0% cleared through the first ~65% of the close, the box is already ~92% collapsed by then, so R6's
  // invariant (scrim >= sheet at every value of openT) holds, but now because his own recording says
  // so, not because one constant forces both halves to meet at it. OPEN keeps R6's original unbranched
  // `[0, SCRIM_KNEE, 1] -> [0, 1, 1]` ramp, byte-identical (`clamp01(v / SCRIM_KNEE)` is the same
  // three-point curve written as one expression). CLOSE reads `CLOSE_SCRIM_CURVE` off the SAME `openT`
  // that already drives `morphT`, same branch-on-`open` pattern, no second clock.
  const scrimOpacity = useTransform(openT, (v) => // mockup-ok: SEARCH_MORPH.md K2, measured close backdrop curve
    (open ? clamp01(v / SCRIM_KNEE) : 1 - lut(1 - v, CLOSE_CURVE_IN, CLOSE_SCRIM_CURVE)));
  // H1 REVERTED (2026-08-03). H1 added an animated blur RADIUS and an animated tint alpha on top of
  // this layer's existing alpha, on the premise that "the page behind is still clearly readable at
  // +50ms" in the reference. That premise is measured backwards. Same metric (high-pass detail
  // remaining in a band below the card, normalised to the resting frame) run on his own recording
  // and on ours: the REFERENCE is at 24.6% of its resting detail by +17ms and 16.7% by +50ms, while
  // OURS was at 71.8% / 46.4% at those same moments and did not reach 19.6% until +100ms. The
  // reference commits its backdrop about 3x FASTER than we did, so ramping the radius moved us
  // further from it, which is why H1 changed nothing the owner could see. Three animated properties
  // on one layer collapse back to the one that was always right: the layer's own alpha, over the
  // static `bg-s-ink/10 backdrop-blur-xl` it had before H1.
  // C3 (round 2, "X floats alone, off both specs"): port of an owner-dictated SEARCH_MORPH.md
  // punch-list fix. The close-X used to sit at a fixed `top:14px` with no relation to the
  // sheet. Derives its top from the SAME cropTop transform that drives the sheet, offset just
  // above the sheet's own top edge, so it moves WITH the sheet through the open/close morph
  // instead of floating independently in the blurred zone.
  const CLOSE_BTN = 44; // h-11 w-11: 44px touch-target floor + the design-system "circled X" size
  const CLOSE_BTN_GAP = 10; // px between the X and the sheet's top edge
  const closeXTop = useTransform(cropTop, (top) => Math.max(safeTop + 6, top - CLOSE_BTN - CLOSE_BTN_GAP)); // mockup-ok: SEARCH_MORPH.md C3
  // R6: the X carries BOTH fades at once , its own focus-collapse fade (xOpacity, expand) and
  // the open/close fade (chromeOpacity below, openT) , not a separate exit. mockup-ok: R6
  const closeXOpacity = useTransform([xOpacity, chromeOpacity], (latest) => { // mockup-ok: SEARCH_MORPH.md R6, chromeOpacity was sheetOpacity
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
  // Chose TOGETHER over a stagger: the reference shows heading + field + list all present already
  // by +100ms (20% of the way in), too close together to read as a sequence, and a staggered order
  // derived from the same ink-band method that produced this bug is not evidence worth keeping over
  // a plain "together" reading. On CLOSE this is the same continuous function read backward off the
  // same value , no second set of values, no threshold.
  // COUNCIL FINDING 2026-08-03, now RESOLVED (2026-08-05). The council (Opus and Grok independently)
  // said the `/ 0.8` compressed the geometry into the first 80% of the open so the box stopped with a
  // third of its run left. That divider is now gone, but not because the council's cure was adopted:
  // its cure was "travel the full progress under the same bezier", which A/B'd worse. Both the
  // divider and the bezier are deleted together, replaced by the reference's sampled curve, which
  // reaches 0.9462 at 53% and 0.9926 at 79% of its own duration. So the settle-early the council
  // objected to is real, is what the reference does, and is now measured rather than faked.
  // G3 (2026-08-03): the content rides its OWN slower progress, not the container's. Measured inside
  // the reference card's own moving box, its content is still barely countable when the box has
  // stopped and keeps rising for ~200ms after.
  const contentT = useMotionValue(open ? 1 : 0); // mockup-ok: SEARCH_MORPH.md G3
  // I1 (2026-08-05, owner's own phone photo, mid-close): `contentT` ran its own 300ms clock on
  // close, unrelated to `morphT` (the LUT-shaped value that ALREADY drives the box's own
  // top/height/width). Measured on this build's own numbers (real headless Chromium, 375x812,
  // own rAF trace against `getComputedStyle`): at 100ms of the 333ms close the box is still 373px
  // of its 385px open height (97%) while the heading's own computed opacity has already fallen to
  // 0.507; by 200ms the box is still 146px (38% of open) while opacity is down to 0.073. The box's
  // curve (`OPEN_CURVE`, front-loaded for growth) lingers near-open for the first half of the
  // close then collapses fast at the end; content's separate, more-linear clock has no such
  // lingering, so content is gone while the box is still most of its size , a fully opaque, blank
  // card, exactly the owner's photo. Confirmed on a real close recording (CDP screencast, real
  // paint frames, not a fixed-fps sample): worst frame at t=208ms, box 326x134px, ink fraction
  // 0.0095 (under 1% dark pixels) inside its own rect.
  // On OPEN this never happens (content is dim but never exactly 0, G1/G2/G3) so the open keeps
  // `contentT`'s own slower, owner-approved curve untouched. On CLOSE, content now rides `morphT`
  // itself, the SAME value the geometry already rides, so the two can never diverge again , one
  // continuous set of motion values, no new duration, no new easing, no new driver.
  const contentOp = useTransform([contentT, morphT], (latest) => { // mockup-ok: SEARCH_MORPH.md I1
    const [c, m] = latest as [number, number];
    return open ? c : m;
  });
  const fieldOp = contentOp; // mockup-ok: SEARCH_MORPH.md I1, no stagger (G1/G2)
  const listOp = contentOp; // mockup-ok: SEARCH_MORPH.md I1, no stagger (G1/G2)
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
  // STILL OPEN clamp, closed (2026-08-05, SEARCH_MORPH.md "STILL OPEN after H2"). `rowLocH`,
  // `rowDateH` and `footerH` above are each already the OTHER rows' full RESTING size the
  // instant the sheet opens (they only fold on `expand`, the focus axis, never on the open
  // axis), so `slotAvail - 208` sat at or below zero until `sheetHeight` cleared 276px, which
  // pinned the visible service card at its 56px floor for the first ~133ms of a 500ms open
  // while the sheet box around it was already moving (adversarial re-measure: mean 0.093, max
  // 0.437 of travel at 83.4ms; paper-coverage cross-check mean 0.097, max 0.663 at 33.4ms). No
  // duration or easing can move a clamp, which is why eleven prior rounds never reached it.
  //
  // mockup-ok: SEARCH_MORPH.md STILL OPEN after H2. The reservation itself now rides `morphT`,
  // the SAME single progress `cropTop`/`sheetHeight`/`sheetWidth` already ride, by one
  // multiplication each. At rest (morphT = 1, the open having finished) every one of these is
  // `expand-based-value * 1`, byte-identical to what it read before this change, so the settled
  // layout does not move. At the first frame of the open (morphT = 0) each is 0, so there is
  // nothing left to clear: svcH = SLOT_COLLAPSED.service + max(slotAvail - reservedSum, 0)
  // algebraically reduces (reservedSum and slotAvail both being affine in morphT) to
  // `56 + (restingHeight - 276) * morphT`, so the card's own fraction of its travel equals
  // `morphT` exactly, the same fraction sheetHeight's own travel already equals, at every
  // instant and not only at the endpoints, so the `max(...,0)` clamp becomes a no-op instead of
  // a gate. Overlapping ranges composed over the one existing driver, no new motion value
  // driver, no threshold, no mount/unmount.
  const rowLocReserveH = useTransform([rowLocH, morphT], (latest) => { // mockup-ok: SEARCH_MORPH.md STILL OPEN after H2
    const [h, mt] = latest as [number, number];
    return h * mt;
  });
  const rowDateReserveH = useTransform([rowDateH, morphT], (latest) => { // mockup-ok: SEARCH_MORPH.md STILL OPEN after H2
    const [h, mt] = latest as [number, number];
    return h * mt;
  });
  const footerReserveH = useTransform([footerH, morphT], (latest) => { // mockup-ok: SEARCH_MORPH.md STILL OPEN after H2
    const [h, mt] = latest as [number, number];
    return h * mt;
  });
  // mockup-ok: SEARCH_MORPH.md STILL OPEN after H2. Same reasoning applied to the row gaps:
  // leaving them pinned at their `expand`-only value while the row heights above now start at 0
  // would hit the border-box padding floor noted above (a location row at height 0 with
  // paddingTop 10 still renders 10px), reopening a small version of the same clamp one level
  // down. Scaled by the identical `morphT` factor as the row heights, so the 10:66 / 30:86
  // ratios the design already relies on are preserved exactly.
  const rowGapTopReserve = useTransform([rowGapTop, morphT], (latest) => { // mockup-ok: SEARCH_MORPH.md STILL OPEN after H2
    const [g, mt] = latest as [number, number];
    return g * mt;
  });
  const rowGapBottomReserve = useTransform([rowGapBottom, morphT], (latest) => { // mockup-ok: SEARCH_MORPH.md STILL OPEN after H2
    const [g, mt] = latest as [number, number];
    return g * mt;
  });
  const slotAvail = useTransform([sheetHeight, footerReserveH], (latest) => { // mockup-ok: SEARCH_MORPH.md STILL OPEN after H2
    const [sh, fh] = latest as [number, number];
    return sh - fh;
  });
  // W1 (2026-08-11): TRIED AND REVERTED, written down so the next person does not spend the same
  // hour. The Wo? card takes every leftover pixel whatever it holds, so with the live city set down
  // to Basel alone it renders two rows and then half a phone of blank paper (measured off his own
  // screenshot: an unbroken white run of 1386px on a 2622px screen).
  //
  // The obvious fix is to cap the location slot at the height it actually needs, which is countable
  // from the row count rather than measured off the DOM: chrome plus 68px a row. I built exactly
  // that and it made the screen WORSE in two ways, both visible in one render. The cap was about
  // 30px tight, so "Basel" was sliced in half by the bottom of its own card. And the height the
  // slot gave back had to go somewhere: handing it to the open service slot moved the hole from
  // under the list to above it, which reads worse than the original because it sits between the
  // heading and the content.
  //
  // The space wants to leave the SHEET, not move between slots, and the sheet's height is computed
  // upstream of this function from the morph progress. That is the change worth making, and it is
  // not a change to make in the same pass as five unrelated fixes, in a file whose own comments
  // record eleven rounds of this animation going wrong.
  const slotInputs = [slotAvail, svcT, locT, dateT, rowLocReserveH, rowDateReserveH];
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
  // I1 continued: these two drive the WHOLE card, paper included, and used to never read the
  // open/close axis at all (`locFaceOp`'s own comment above named this "deliberately left
  // alone", written before this bug was found). Their height already shrinks toward 0 with
  // `morphT` (`rowLocReserveH`/`rowDateReserveH` above) but never reaches exactly 0 until morphT
  // does, so for the tail of a close they were a fully OPAQUE several-px sliver with no content
  // in it , the second white strip in the owner's photo. Measured (own rAF trace, real headless
  // Chromium, 375x812): at t=150ms of the close the location card is 34.8px tall, its own
  // computed opacity 1.000, its label opacity (`locFaceOp`, unchanged by this edit) already down
  // near 0.19 and falling. Folded in as a THIRD multiplicative axis, close only (open unchanged,
  // so a card mid-growth stays the always-opaque paper H2 already proved correct for slot 1, not
  // a translucent one that would reopen H2's own double-exposure bug).
  const locSlotOp = useTransform([locT, stepsOp, morphT], (latest) => { // mockup-ok: SEARCH_MORPH.md I1
    const [t, so, mt] = latest as [number, number, number];
    return open ? foldOp(t, so) : foldOp(t, so) * mt;
  });
  const dateSlotOp = useTransform([dateT, stepsOp, morphT], (latest) => { // mockup-ok: SEARCH_MORPH.md I1
    const [t, so, mt] = latest as [number, number, number];
    return open ? foldOp(t, so) : foldOp(t, so) * mt;
  });
  // F1 (2026-08-11, his word was overlap and he has now said it three times). The Wo? and Wann?
  // cards already fade out when the composer folds; the SERVICE card never did, so with the Wo?
  // step open and the keyboard up his screen carried two white shapes touching each other: the
  // collapsed Suche card on top and the open Wo? card under it.
  //
  // The reference he sent (his own Airbnb capture, measured: sheet top 62.3pt, one white surface,
  // no card insets, no shadows between sections) is ONE sheet. The list is the screen. So the
  // service card now folds on exactly the same axis its two neighbours already use, and the three
  // of them behave identically instead of one being special.
  //
  // `foldOp(t, so)` returns 1 whenever that step IS the open one, so the service step's own focused
  // state is untouched: this only ever hides the card while a DIFFERENT step is open.
  const svcSlotOp = useTransform([svcT, stepsOp, morphT], (latest) => {
    const [t, so, mt] = latest as [number, number, number];
    return open ? foldOp(t, so) : foldOp(t, so) * mt;
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
      // OPEN_MS (0.5) and CLOSE_MS (0.35) are both measured, not chosen: see the constants. The
      // open's prior 0.6 was read off "height is still climbing at 600ms", true but the last third
      // of a POINT crawling in; the close's prior 0.333 was carried over from a DIFFERENT clip
      // (`airbnb-search-open-close_2026-08-02.MP4`) that was never re-measured against his close on
      // THIS clip (`airbnb-open-ref_2026-08-03.MP4`, 16.2367s to 16.5867s, see CLOSE_MS above).
      duration: reduce ? 0 : open ? OPEN_MS : CLOSE_MS,
      // K2 (2026-08-06): the close is now LINEAR too, for the same reason the open already is. Every
      // round before this one put the close's shape on a CHOSEN bezier applied to `openT`
      // (MORPH_EASE, then `clamp01(MORPH_EASE(t) / 0.8)`) and then judged the result and picked a
      // different bezier , eleven rounds of exactly that on the open before it was fixed the same
      // way. `openT` now carries raw time on BOTH directions and `morphT` carries each direction's
      // own sampled fractions (OPEN_CURVE / CLOSE_CURVE). Deleting the curve from here is what makes
      // the close a copy of his recording instead of another guess at one.
      ease: "linear",
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
  // OPENING A STEP NOW EXPANDS IT AND RAISES THE KEYBOARD, the same as the service step already
  // did. Owner 2026-08-11: "i like how sh expands when clicked on search inside searchbar, but on
  // location when u try to search it doesnt work like expand nor keyboard."
  //
  // He is describing exactly what the code did. `openStep` set the step and then explicitly did the
  // OPPOSITE of expanding: `setInputFocused(false)` plus `collapse()`. The service step only feels
  // right because it gets its own separate treatment in the open effect above
  // (`setInputFocused(true); grow(1); requestAnimationFrame(focus)`), which nothing else ever got.
  // So one of the three rows behaved and two did not, and the two silent ones are the ones you have
  // to type into.
  //
  // Same three moves for every typing step now. `date` keeps the collapsed behaviour because it has
  // no text input at all, it is a calendar, and raising a keyboard over a calendar would be wrong.
  // The focus has to wait for React to COMMIT the new step. A requestAnimationFrame inside the
  // click handler fires before that, and at that moment the location slot still carries
  // `inert={activeStep !== "location"}`, so `.focus()` on the city input silently does nothing and
  // the caret stays where it was. Measured exactly that: after tapping Wo?, document.activeElement
  // was still the SERVICE input. So the request is recorded here and carried out in an effect below,
  // which runs after the commit and after inert lifts.
  const [pendingFocus, setPendingFocus] = React.useState<Step | null>(null);
  React.useEffect(() => {
    if (!pendingFocus) return;
    const el = pendingFocus === "location" ? cityRef.current : serviceRef.current;
    // preventScroll for the same reason the service step uses it: iOS otherwise scrolls the
    // focused input into view and the sheet jumps.
    el?.focus({ preventScroll: true });
    setPendingFocus(null);
  }, [pendingFocus, activeStep]);

  // G1 (2026-08-11): only the SERVICE step folds the composer away. A measured sweep found that
  // opening Wo? left the Suchen button, the Zuruecksetzen link and the close X unreachable at every
  // screen height tested (at 844 the Suchen rect was [856, 902] against an 844px viewport, 12px past
  // the bottom edge, and the close X computed opacity 0), and that the Wann? row landed on exactly
  // innerHeight so you could not go from Wo? to Wann? at all.
  //
  // The cause was mine, from earlier the same day. `grow(1)` is the FOCUS axis: it folds the
  // heading, both collapsed rows and the footer away so a typing list can fill the sheet. I had it
  // running for the location step too, which folded the footer while that step still needed it.
  // Wo? does not need the fold: its own card already grows through the slot math (locT), and it has
  // a short list rather than a full-height one, so there is nothing to make room for.
  //
  // The date step already did the right thing here and its line is unchanged.
  const openStep = React.useCallback((s: Step) => {
    setActiveStep(s);
    if (s === "date" || s === "location") {
      setInputFocused(false);
      collapse();
      // G3 (2026-08-11): and no auto-focus on the city field either. He said it about the service
      // field first, "i dont like when u click once its alrdy keyboard mode", and opening Wo? had
      // the same shape: the step opened, the keyboard came straight up, and the list it exists to
      // show was pushed behind the keys. Tapping the field is still one tap away if you want to
      // type; the eight cities were never long enough to need filtering anyway, and today the live
      // list is one row.
      return;
    }
    setInputFocused(true);
    grow(1);
    setPendingFocus(s);
  }, [collapse, grow]);
  // G2 (2026-08-11): back to the COMPOSED view, which is what every "I have answered this step"
  // path wants and what the city list's own comment has claimed since 2026-07-01. `openStep`
  // cannot serve them, because opening the service step means putting the keyboard up, and doing
  // that after a city pick folded the two rows and the footer straight back off the screen
  // (measured: both rows jumped to y 844 and 860 on an 844px screen the instant Basel was tapped).
  const composeStep = React.useCallback(() => {
    setActiveStep("service");
    setInputFocused(false);
    collapse();
  }, [collapse]);
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

  // K3 (2026-08-06): `scrollExpand.set(0)` used to sit here, snapping `ex` to 0 in the SAME
  // commit `onClose()` starts the close's own animation, so `topFor`/`sheetHeight` immediately
  // lost the focused state a close might have actually started from. The reset that matters is
  // "a FRESH open always starts unfocused", which the open effect already does (S4's own
  // precedent: date fields reset there, not in `close()`, "because close() is only one of the
  // ways the overlay shuts"). Removing it here leaves `ex` frozen at whatever it was for the
  // whole close, which is exactly what the fixed `topFor` now needs to read.
  const close = React.useCallback(() => { setInputFocused(false); setActiveStep("service"); setServiceQ(""); setCityQ(""); onClose(); }, [onClose]);
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
  const titleTxt                = t("title");
  const searchHeadingTxt        = t("searchHeading");
  const locationHeadingTxt      = t("locationHeading");
  const dateHeadingTxt          = t("dateHeading");
  const fieldServiceLabelTxt    = t("fieldServiceLabel");
  const queryPlaceholderTxt     = t("queryPlaceholder");
  const fieldAddPlaceholderTxt  = t("fieldAddPlaceholder");
  const anytimeTxt              = t("anytime");
  const noPreferenceTxt         = t("noPreference");
  const allServicesTxt          = t("allServices");
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
  // C3: "Inspo" is the product name of that feed in every locale (project memory: the discovery
  // feed is called Inspo on the front end), so it is not a translated string.
  const inspoTxt                = "Inspo";
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

  // H5 (2026-08-03, the defect that remained after H2 made the card opaque): H2 fixed the
  // double exposure but left the card's own rect painting NOTHING at t=0, so the growing box
  // read as a blank white block with no continuity to the bar it grew out of. Measured on our
  // own build: ink inside the pill's own rect goes from 0.0157 CLOSED to 0.0000 at t=0 and
  // never returns. His second reference recording (template-matched) keeps the OUTGOING label
  // alive inside the growing card for roughly its first 70ms, at 60% / 36% / 36% / 15% of its
  // original contrast at +17 / +33 / +50 / +67ms. `ghostLabelTxt` reuses the SAME string the
  // collapsed bar already renders (`serviceRowValue`, the composed category+query the pill and
  // the collapsed step row both show), falling back to `titleTxt`, which is the identical
  // translation VALUE as `ui.searchChrome.searchPlaceholder` in every locale (both resolve to
  // "Suchen"/"Search"/"Rechercher"/"Cerca", the exact text the resting home/search pill shows
  // when nothing is set) , not a new string.
  const ghostLabelTxt = serviceRowValue || titleTxt;
  // One continuous range on the ALREADY-EXISTING `openT` value, the same pattern chromeOpacity/
  // scrimOpacity above already use , not a new duration or easing constant.
  const ghostLabelOp = useTransform(openT, [0, 0.22], [1, 0]); // mockup-ok: SEARCH_MORPH.md H5

  const stepMeta = React.useMemo((): Record<Step, { label: string; value: string; placeholder: string }> => ({
    // R1 (2026-08-11, his words: "on top of the wo, once its expanded, there is residue of
    // search, thats whats fucked"). This row used to fall back to the FIELD'S PLACEHOLDER, so
    // with nothing typed it read "Suche | Service, Salon oder Stylist:in", an instruction
    // sitting where the other two rows carry an answer ("Wo? Keine Praeferenz", "Wann?
    // Jederzeit"). Next to them it reads as a leftover fragment of the step you just left
    // rather than a summary of it. `allServices` already exists in all four locales and is
    // answer-shaped, so no copy was written for this.
    service:  { label: fieldServiceLabelTxt,  value: serviceRowValue, placeholder: allServicesTxt        },
    location: { label: locationHeadingTxt,    value: stadt && stadt !== ALL_CITIES_PARAM ? stadt : noPreferenceTxt, placeholder: fieldAddPlaceholderTxt },
    date:     { label: dateHeadingTxt,        value: dateLabel,  placeholder: anytimeTxt              },
  }), [fieldServiceLabelTxt, serviceRowValue, allServicesTxt, locationHeadingTxt, stadt, noPreferenceTxt, fieldAddPlaceholderTxt, dateHeadingTxt, dateLabel, anytimeTxt]);

  const visibleRecents = React.useMemo(() => recent.filter((_, i) => !hiddenRecents.has(i)), [recent, hiddenRecents]);
  // C1 (2026-08-11): the Wo? list now offers only cities Solen can actually serve.
  //
  // Measured before the change: the picker showed eight cities off the hardcoded SEARCH_CITIES
  // list while /api/cities returned exactly one active city. Picking Zurich rendered a results
  // page headed "Suchen Basel", full of Basel salons, with the address bar still saying Zurich.
  // Nothing errored and nothing said the city was not open yet, so a screen that looked like a
  // successful search quietly answered a different question. Seven of the eight rows did that.
  //
  // Not a new system: `useActiveCities` is the shared fetch every OTHER city picker already uses,
  // and its own docstring records why it exists ("the admin Staedte toggle never actually changed
  // what a customer saw"). This list was the one that had never been moved onto it.
  //
  // The static list stays as the fallback for the moment before the fetch resolves and for a
  // failed fetch, which is the hook's documented contract, so the picker is never empty.
  // C2 (2026-08-11): while the live set is still loading this shows NOTHING rather than the old
  // hardcoded eight. The sweep caught the gap C1 left: on a cold page load the fallback rendered
  // Zurich, Bern, Lausanne, Genf, Luzern, Neuchatel and Winterthur as tappable rows for the length
  // of the fetch, and tapping one of those lands on a results page headed "Suchen Basel". A short
  // window is still a window, and the rule against claiming what the system cannot back does not
  // have a grace period. "Keine Praeferenz" is always there, so the step is never empty of options
  // while the list resolves.
  const cityNames = React.useMemo(
    () => (citiesLoading ? [] : activeCities.map((c) => getCityName(c.slug, locale, c))),
    [activeCities, citiesLoading, locale],
  );
  const filteredCities = React.useMemo(() => cityNames.filter((c) => matchesSearch(c, cityQ)), [cityNames, cityQ]);

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
  // VARIANT A, picked by the owner off /dev/search-field 2026-08-11. He replied with one letter.
  //
  // Read on Mobbin first, six iOS apps, and they agree with each other: Character AI, Twitch and
  // KakaoTalk all put a focused search field in a FILLED capsule with the way back OUTSIDE it on
  // the left and the clear INSIDE it on the right; Bloom uses the same capsule with the word
  // Cancel beside it; Corner and Opera use the filled capsule too. The through-line is three
  // things, and ours was the opposite on two of them:
  //     filled capsule, not a white box with a hairline
  //     the way out OUTSIDE the field, not sharing the text's own line
  //     the clear INSIDE it
  // The white box is why an empty field looked identical to a filled one, which is most of what
  // he meant by hating its states.
  //
  // The A4 note below still holds and is why the height does not move: PIL-measured off his own
  // Airbnb reference, the field does NOT grow on focus (55.0pt to 54.3pt), and the dark 2px focus
  // border was rejected by name. Nothing here reintroduces either.
  const serviceBar = (
    <div className="flex h-14 items-center">
      {/* The way out, OUTSIDE the capsule. K1: the blur is load-bearing. The keyboard holds
          `expand` at 1 (kbT), so a back tap that only ran `collapse()` would set the finger's own
          driver to 0 and change nothing on screen while the keyboard stayed up. Dismissing the
          field is what this control means, so it says so. */}
      {/* A11 (2026-08-11): the glyph and its box are UNCHANGED, this only grows what a thumb can
          hit. Measured at 32x40, under the 44px floor the design contract sets and WCAG asks for,
          and that floor outranks a look preference (precedence chain tier 2). A wider box would
          have eaten the field's width, so the hit area is an invisible inset instead: nothing on
          screen moves, the tappable region reaches 44x44. */}
      {/* VARIANT B WITH A GREY OUTLINE. Owner 2026-08-11, evening: "B but not black like gray sh yk",
          picked off /dev/search-field-chrome after he sent his own Airbnb capture.
          It replaces variant A, which he picked that same morning off /dev/search-field. Both were
          his and they disagreed, so the mockup put them side by side and this is his answer.
          Built to the reference's measured numbers rather than to a guess: 56 tall, radius 15,
          a 1px outline, and the way back INSIDE the box on the left. The one deliberate departure
          is the one he named: the reference's outline is near-black, ours is the house hairline
          `s-border`, because a black edge is the heaviest thing on this screen.
          Two things this also settles for free. The service field and the Wo? field now look the
          same, which they did not this morning, and that mismatch was written down as an open
          collision against the rule that one thing looks the same everywhere. And the hit area
          stays 44x44 through the invisible inset, so the touch floor from A11 survives the change. */}
      <div className="flex h-14 min-w-0 flex-1 items-center gap-2.5 rounded-[15px] border border-s-border bg-white px-3.5"> {/* mockup-ok: variant B grey outline, owner pick 2026-08-11 */}
        {inputFocused ? (
          <button onClick={() => { serviceRef.current?.blur(); setInputFocused(false); collapse(); setServiceQ(""); }} aria-label={backTxt}
            className="relative grid h-8 w-8 shrink-0 place-items-center text-s-ink before:absolute before:-inset-x-1.5 before:-inset-y-2.5 before:content-['']">
            <ChevronLeft size={22} strokeWidth={2.2} />
          </button>
        ) : (
          <span className="grid h-6 w-6 shrink-0 place-items-center">
            <Search size={19} strokeWidth={2.2} className="text-s-ink-2" />
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
      <input data-bare-input ref={(el) => { serviceRef.current = el; if (serviceInputRef) serviceInputRef.current = el; }} value={serviceQ}
        onFocus={() => { setInputFocused(true); grow(1); }}
        onChange={(e) => setServiceQ(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSubmit(); } }}
        enterKeyHint="search"
        placeholder={queryPlaceholderTxt} aria-label={queryPlaceholderTxt}
        className="min-w-0 flex-1 !border-0 !bg-transparent !min-h-0 !px-0 !text-[16px] text-s-ink placeholder:text-s-ink-2 focus:outline-none focus-visible:outline-none" />
      {/* A6 (2026-08-02 REOPENED): a fixed h-6 w-6 slot (same idea as the loader-dots slot
          below it) always mounted, only the button's presence inside toggles , the clear-X no
          longer changes the bar's own width when it mounts/unmounts while typing. mockup-ok: SEARCH_MORPH.md A6 */}
      {/* A11 (2026-08-11): same fix as the back chevron above. The disc stays 20px, which is the
          size he approved; only the invisible hit area grows to clear the 44px floor. */}
      <span className="grid h-6 w-6 shrink-0 place-items-center">
        {serviceQ.length > 0 ? (
          <button onClick={() => { setServiceQ(""); serviceRef.current?.focus(); }}
            aria-label="Eingabe loeschen"
            className="relative grid h-5 w-5 place-items-center rounded-full bg-s-ink/15 text-s-ink before:absolute before:-inset-3 before:content-['']"> {/* mockup-ok: variant A clear disc, owner pick 2026-08-11 */}
            <X size={13} strokeWidth={2.6} />
          </button>
        ) : null}
      </span>
      {/* S9 (2026-08-11): the three-dot loader that used to sit here, right of the clear X, is
          deleted. Measured across 30 captured iOS apps: a progress indicator placed past the
          clear X shows up zero times, while thirteen use skeleton rows with no indicator at
          all, which is what the skeleton-rows branch above already draws at the same moment. */}
      </div>
    </div>
  );

  const serviceSuggestions = () => {
    // S8: shared between the idle list and the no-result state below, one definition of the
    // categories rows, not two copies of the same taps.
    // A2/Model B (2026-07-04): this category shortcut no longer clears the typed query , it
    // only sets `service` (feeds ?category=/?service= via buildParams, unchanged), same as
    // picking the pill row never clears `serviceQ`.
    const categoryRows = CATEGORIES.map((c) => (
      <SuggestRow key={c.label} name={c.label} Icon={c.icon} art={c.art} tintBg={c.bg} tintFg={c.fg} onClick={() => { setService(c.label); advance("service"); }} />
    ));
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
        // Variant B, owner pick off /dev/search-states 2026-08-11: the grey Lucide disc with
        // a large void under it is gone. The dead end now leads TOP-down, not centred: the
        // no-match copy, then the same category rows the idle list renders, so there is a way
        // forward instead of a wall.
        return (
          <>
            <p className="mb-1 text-[15px] font-semibold text-s-ink">{noMatchTitleTxt}</p> {/* mockup-ok: variant B, owner pick off /dev/search-states 2026-08-11 */}
            <p className="mb-3 text-[14px] text-s-ink-2">{t("noMatchBody", { query: serviceQ.trim() })}</p> {/* mockup-ok: variant B, owner pick off /dev/search-states 2026-08-11 */}
            {categoryRows}
          </>
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
                {seeAllResultsTxt} <ChevronRight size={15} strokeWidth={1.9} />
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
              <FeedSectionLabel className="mt-5" href={`/${locale}/inspo`} seeAll={inspoTxt}>{forYouTxt}</FeedSectionLabel>
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
    // REVERTED 2026-08-11, same day, on his live word: "Revert whats inside of the search search
    // bar i had like inspo n allat u replaced w ass categorys."
    //
    // He had picked variant B off /dev/search-states a few hours earlier, and B cut this body down
    // to one list. The research behind it was sound (every captured app subtracts content when the
    // field takes focus) but the result, seen on his own phone, was four grey category rows where
    // there had been stores and photographs. A live rejection outranks an earlier approval, and it
    // outranks the research too.
    //
    // So the full stack is back exactly as it was: recents, then the popular stores with their live
    // addresses, then the categories, then the Fuer dich look grid. The state, the fetch and the
    // tap dispatcher that feed the stores row come back with it.
    //
    // What is NOT reverted, because he asked for those separately and has not withdrawn them: the
    // loading dots stay deleted, the no-result state keeps its message at the top with a way
    // forward, and the panel still opens without the keyboard.
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
            photo={featuredMeta[sl.id]?.photo} rating={featuredMeta[sl.id]?.rating}
            onClick={() => { setService(sl.name); push({ service: sl.name, city: stadt || undefined }); goSalon(sl.id, sl.slug, sl.name); }} />)}
        </>)}
        <SectionLabel className="mt-3">{categoriesLabelTxt}</SectionLabel>
        {categoryRows}
        {/* Für dich , DNA-personalized looks (popular for logged-out). Tapping a look opens it in
            Inspo. This is the "inspo n allat" he asked to have back. */}
        {forYouLooks.length > 0 && (
          <>
            <FeedSectionLabel className="mt-3" href={`/${locale}/inspo`} seeAll={inspoTxt}>{forYouTxt}</FeedSectionLabel>
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
      <SuggestRow name={noPreferenceTxt} sub={noPreferenceSubTxt} Icon={Globe} onClick={() => { setStadt(ALL_CITIES_PARAM); setCityQ(""); composeStep(); }} />
      {filteredCities.map((c) => <SuggestRow key={c} name={c} img={CITY_ICONS[c]} Icon={MapPin} onClick={() => { setStadt(c); setCityQ(""); composeStep(); }} />)}
    </>
  );

  // selected-ok: bg-s-ink is the ONE primary commit CTA, not a selected state
  const footerInner = (
    <div className="flex items-center justify-between px-5 pb-[max(14px,env(safe-area-inset-bottom))] pt-3">
      {/* A11 (2026-08-11): 93x21 measured, so the row it sits in gives it the height instead of a
          box around the words (an h-11 wrapper would have drawn a button where a text link belongs).
          The text, the weight and the underline-on-hover are untouched. */}
      <button onClick={reset} className="flex h-11 items-center text-[14px] font-semibold text-s-ink underline-offset-4 hover:underline">{resetTxt}</button>
      <button onClick={handleSubmit} className="flex items-center gap-2 rounded-full bg-s-ink px-6 py-3 font-heading text-[15px] font-bold text-white transition-transform duration-150 active:scale-[0.98] active:duration-[80ms] active:ease-glide" /* selected-ok: primary commit CTA */>
        <Search size={16} strokeWidth={1.9} />{submitTxt}
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
          {/* mockup-ok: H1 REVERTED, the static blur + tint classes are back and this layer animates
              its own alpha only. Measured both ways, see the H4/H1 block where scrimOpacity lives. */}
          <motion.div key="scrim" onClick={close} className="fixed inset-0 z-[100] bg-s-ink/10 backdrop-blur-xl" /* mockup-ok: SEARCH_MORPH.md H1 reverted */
            style={{ opacity: scrimOpacity, pointerEvents: open ? "auto" : "none" }} /* mockup-ok: SEARCH_MORPH.md H1 reverted */ />

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
            <X size={18} strokeWidth={1.9} />
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
              for every step, which is also the only shape that can be morphed continuously.

              H2 (2026-08-03), THE fix, and it is a deletion. `opacity: sheetOpacity` used to sit in
              this style block, and because it sits on the WRAPPER it composited two different
              things on one alpha: the white PAPER of all four slot cards, and the INK inside them.
              The paper therefore could not be solid until the ink was, so for the whole growth the
              sheet was a transparency and the old page printed straight through it. Measured on his
              own recording versus ours, in the card's own blank left gutter (no text ever lands
              there, so any variation in it IS the page showing through): the reference is flat white
              at std 0.00 from +33ms onward, i.e. solid paper by 6% of its open, while ours read
              31.28 at +0ms, 24.07 at +33ms and 17.64 at +50ms and never reached 0. The picture says
              it plainer than the number does: at +50ms and +100ms ours was a double exposure with
              the old "Suchen" label and the new heading legible in the SAME pixels and no card edge
              anywhere, which is precisely "it's already all opened". Whole-frame motion confirms the
              consequence , ours moved 1.67-4.75 per frame from +33 to +150ms against the reference's
              4.4-7.8, because a transparent box growing barely changes any pixels.

              No schedule on one shared channel can make the paper opaque while the ink is still
              arriving; that needs two channels, which is why seven timing and opacity edits could
              not reach it. The ink already has its own channel (`contentT` via contentOp / fieldOp /
              listOp / headingContentOp / pillsContentOp / footerContentOp / locFaceOp / dateFaceOp),
              so deleting this one line gives the paper alpha 1 and leaves the ink on its own curve
              instead of the PRODUCT of the two. It also removes a double fade nobody designed: ink
              was previously sheetOpacity x contentT, which put the heading at 0.075 of its final
              darkness at +100ms where the reference sits at 0.20. */}
          <motion.div key="sheet" /* mockup-ok: SEARCH_MORPH.md H2, wrapper alpha deleted */
            style={{
              top: cropTop,
              left: sheetLeft,
              width: sheetWidth,
              height: sheetHeight,
              pointerEvents: open ? "auto" : "none",
            }}
            className="fixed bottom-0 z-[101] flex flex-col overflow-hidden bg-transparent">

          {/* R7 slot 1 of 3: SUCHE. The white card belongs to the SLOT and never fades, so a
              step change can never make it translucent; only the collapsed face and the
              expanded body crossfade inside it. Height comes from `svcH` (see the slot block
              above), which is where the old `flex-1` used to sit. */}
          <motion.div style={{ height: svcH }} className="shrink-0 overflow-hidden">
            <motion.div style={{ opacity: svcSlotOp, marginLeft: cardMx, marginRight: cardMx, borderTopLeftRadius: cardRadius, borderTopRightRadius: cardRadius, borderBottomLeftRadius: cardRadiusBottom, borderBottomRightRadius: cardRadiusBottom, boxShadow: "0 18px 50px rgba(10,10,10,0.13)" }}
              className="relative h-full overflow-hidden bg-white">
              {/* H5: the outgoing bar's own label, ghosted INSIDE the now-opaque card at the
                  spot its icon+text sat, so the growing box carries visual continuity from the
                  bar it grew out of instead of the erased blank block H2 left behind. Purely a
                  visual echo of the collapsed bar (aria-hidden, no pointer-events), not a
                  second control. mockup-ok: SEARCH_MORPH.md H5 */}
              <motion.div aria-hidden style={{ opacity: ghostLabelOp }} className="pointer-events-none absolute inset-x-0 top-0 flex h-14 items-center gap-2.5 px-4"> {/* mockup-ok: SEARCH_MORPH.md H5 */}
                <Search size={18} strokeWidth={1.9} className="shrink-0 text-s-ink-2" />
                <span className="truncate font-body text-[16px] font-medium text-s-ink">{ghostLabelTxt}</span>
              </motion.div> {/* mockup-ok: SEARCH_MORPH.md H5 */}
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

          {/* O1 (2026-08-11, he sent a screenshot and the word was "overlap"). The three cards used
              to get their side inset two different ways: the service card from `cardMx`, an animated
              value that collapses 12 to 0 as the composer folds, and the other two from a literal
              `mx-3`. The comment below said that was fine because 12 equals 12, and it is, right up
              until `expand` is anything other than zero. Then the top card is full width, edge to
              edge, while the card under it is still inset by 12, and two stacked cards of different
              widths with an 8px gap read as one broken shape. Measured on his own screenshot: the
              Suche card spans the full 1206px of the screen while the Wo? card under it runs 37 to
              1168.
              All three slots now take the SAME value, so no state can produce a mismatch: at rest
              all three are inset, focused all three go full width together.
              R7 slot 2 of 3: WO?. The old note, kept because it explains the layout: the three
              cards share one left/right edge in every state. */}
          <motion.div style={{ height: locH, paddingTop: rowGapTopReserve }} className="shrink-0 overflow-hidden"> {/* mockup-ok: SEARCH_MORPH.md STILL OPEN after H2 */}
            {/* `rowsFolded && activeStep !== "location"`, not bare `rowsFolded`. THE LAST
                PIECE OF THE KEYBOARD BUG. `rowsFolded` flips true as soon as the sheet grows,
                which is exactly what opening this step now does, so the slot inerted ITSELF
                the moment it opened: the panel expanded and looked right, and the city input
                could not take focus. Measured after tapping Wo?: the input had an [inert]
                ancestor and document.activeElement was BODY, so no keyboard.
                The fold is meant to take the OTHER rows out of the tab order, never the one
                being used. */}
            <motion.div inert={rowsFolded && activeStep !== "location"} style={{ opacity: locSlotOp, marginLeft: cardMx, marginRight: cardMx }} className="relative h-full overflow-hidden rounded-[20px] bg-white shadow-[0_16px_48px_rgba(10,10,10,0.10)]"> {/* S7: whole slot folded away on focus */}
              <motion.div inert={activeStep !== "location"} style={{ opacity: locT, pointerEvents: locBodyHit }} className="absolute inset-0 flex flex-col p-4"> {/* S7: city input + city rows out of the tab order when collapsed */}
                    {/* C7 (round 2, "does not expand or close"): root cause was that once a
                        step is active, its OWN heading had no click handler , the only way
                        back to the composed view was tapping the DIFFERENT "Suche" collapsed
                        row, which reads as broken (tapping the open row again did nothing).
                        Wiring the accordion-collapse the SEARCH_MORPH.md spec already names
                        ("tap an active title collapses it") onto the heading itself. */}
                    {/* S1 (2026-08-12): folds on the same `expand` axis the service heading has
                        always used, which is the 56pt his three captures measured between the two
                        sheets. `inert` while folded so a zero-height invisible control cannot take
                        keyboard focus, and the back arrow inside the field is the way out in
                        exactly that state (B1 above). */}
                    <motion.div inert={inputFocused} style={{ height: locHeadingH, opacity: headingContentOp }} className="shrink-0 overflow-hidden"> {/* mockup-ok: existing focus-fold axis */}
                    <button type="button" onClick={composeStep}
                      className="flex w-full items-center justify-between pb-3 text-left">
                      <span className="font-heading text-[24px] font-bold leading-tight tracking-[-0.02em] text-s-ink">{locationHeadingTxt}</span>
                      {/* B1 continued: ONE way back, not two. With the field focused the arrow inside
                          it is the way out, so this collapse chevron would be a second control for
                          the same job on the same screen. His reference carries exactly one. It
                          returns the moment the field is unfocused, where it is still the only way
                          to fold this step. */}
                      {inputFocused ? null : (
                        <ChevronUp size={20} strokeWidth={2.2} className="text-s-ink-2" aria-hidden />
                      )}
                    </button>
                    </motion.div> {/* mockup-ok: closes the S1 fold wrapper opened above */}
                    {/* REVERTED 2026-08-11, and the reason matters more than the pixels.
                        He picked variant A (a filled grey capsule) for the SERVICE field off
                        /dev/search-field, and I extended it to this field on my own judgement,
                        saying so at the time. It collides with a call he had already made:
                        TASTE_LOG, commit db2a45ca8 on 2026-08-03, "He overruled my grey
                        recommendation and the field keeps its white fill and hairline, measured
                        1px #E4E4E7". That is this exact field, and the log exists so a settled
                        call is never re-litigated, so the white fill comes back.
                        What A did leave here is the clear control on a soft disc below, which he
                        never objected to and which is the same control the service field uses.
                        The open collision, surfaced rather than resolved: FLOORS LAW 8 says one
                        thing looks the same everywhere, and these two fields now do not. Two of
                        his own decisions, so it is his to break the tie. */}
                    {/* mockup-ok: restoring the owner-approved treatment recorded in TASTE_LOG
                        (db2a45ca8), not a new appearance. */}
                    <div className="mb-2 flex h-14 shrink-0 items-center gap-2.5 rounded-[15px] border border-s-border bg-white px-3.5"> {/* mockup-ok: same variant B recipe as the service field, owner pick 2026-08-11 */}
                      {/* B1 (2026-08-11): "i wish there was a back button when all the way open".
                          There was none on this step once the keyboard was up: the only way out was
                          the collapse chevron at the top right, which reads as a fold rather than a
                          back. His own reference puts a back ARROW inside the field on the left, and
                          the service field beside it already carries exactly that control, so this
                          is the same one rather than a new invention. It only appears while the
                          field is focused, which is the state he called "all the way open". */}
                      {inputFocused ? (
                        <button type="button" aria-label={backTxt}
                          onClick={() => { cityRef.current?.blur(); setInputFocused(false); collapse(); }}
                          className="relative grid h-8 w-6 shrink-0 place-items-center text-s-ink before:absolute before:-inset-y-1.5 before:-inset-x-3 before:content-['']">
                          <ChevronLeft size={22} strokeWidth={2.2} />
                        </button>
                      ) : (
                        <Search size={18} strokeWidth={1.9} className="shrink-0 text-s-ink-2" />
                      )}
                      {/* mockup-ok: !important preserves the existing look, not a new one; same
                          carve-out as the service query input above (V3-D-input-fill-2026-07-17). */}
                      {/* G3 (2026-08-11, he sent a screenshot of it): the fold follows the KEYBOARD,
                          not the step. Opening Wo? no longer folds the composer away, which is what
                          put the Suchen button back on screen. But tapping INTO this field raises the
                          keyboard, and without a fold the sheet stayed at its full height while the
                          list held two rows, so the bottom of the card was a slab of white behind the
                          keys and the footer was under them. Measured on his shot: 348px of unbroken
                          white, 13% of the phone, between Basel and the top of the keyboard.
                          Focus folds, blur restores. That is exactly what this axis has always meant
                          on the service field; the city field simply never wired it up. */}
                      <input data-bare-input ref={cityRef} value={cityQ} onChange={(e) => setCityQ(e.target.value)}
                        onFocus={() => { setInputFocused(true); grow(1); }}
                        onBlur={() => { setInputFocused(false); collapse(); }}
                        placeholder={citySearchPlaceholderTxt} aria-label={citySearchPlaceholderTxt}
                        className="min-w-0 flex-1 !border-0 !bg-transparent !min-h-0 !px-0 !text-[16px] text-s-ink placeholder:text-s-ink-2 focus:outline-none focus-visible:outline-none" />
                      {cityQ.length > 0 && (
                        <button onClick={() => { setCityQ(""); cityRef.current?.focus(); }} aria-label="Eingabe loeschen"
                          className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-s-ink/15 text-s-ink">
                          <X size={13} strokeWidth={2.6} />
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
          <motion.div style={{ height: dateH, paddingTop: rowGapTopReserve, paddingBottom: rowGapBottomReserve }} className="shrink-0 overflow-hidden"> {/* mockup-ok: SEARCH_MORPH.md STILL OPEN after H2 */}
            <motion.div inert={rowsFolded && activeStep !== "date"} style={{ opacity: dateSlotOp, marginLeft: cardMx, marginRight: cardMx }} className="relative h-full overflow-hidden rounded-[20px] bg-white shadow-[0_16px_48px_rgba(10,10,10,0.10)]"> {/* S7: whole slot folded away on focus */}
              <motion.div inert={activeStep !== "date"} style={{ opacity: dateT, pointerEvents: dateBodyHit }} className="absolute inset-0 flex flex-col px-4 pb-3 pt-4"> {/* S7: the 29-31 day cells out of the tab order when collapsed */}
                    {/* C7: same accordion-collapse as the location heading above. */}
                    <button type="button" onClick={composeStep}
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
                                <button onClick={() => setMonthOffset((o) => Math.max(0, o - 1))} disabled={monthOffset <= 0} aria-label={tCommon("previousMonthAria")}
                                  className="grid h-9 w-9 place-items-center rounded-full text-s-ink hover:bg-s-bg-sunken disabled:opacity-25">
                                  <ChevronLeft size={20} strokeWidth={2.2} />
                                </button>
                                <button onClick={() => setMonthOffset((o) => Math.min(maxMonthOffset, o + 1))} disabled={monthOffset >= maxMonthOffset} aria-label="Naechster Monat"
                                  className="grid h-9 w-9 place-items-center rounded-full text-s-ink hover:bg-s-bg-sunken disabled:opacity-25">
                                  <ChevronRight size={20} strokeWidth={2.2} />
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
          <motion.div inert={rowsFolded} style={{ height: footerReserveH, opacity: footerContentOp }} className="shrink-0 overflow-hidden"> {/* S7: footer folded away on focus; F1/F2: also gated on the open/close content phase; mockup-ok: SEARCH_MORPH.md STILL OPEN after H2 */}
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

// C3 (2026-08-12, owner: "how to jump to the inspo page from there"). There was no way: the section
// showed four looks and tapping one opened that single look, so the feed those looks come from was
// unreachable from the panel. The heading carries it now. Ink with a chevron, never blue, because
// see-all controls in this system are ink and only small clickable text is blue.
function FeedSectionLabel({ children, className = "", href, seeAll }: {
  children: React.ReactNode; className?: string; href: string; seeAll: string;
}) {
  return (
    <div className={`mb-1 flex items-center justify-between ${className}`}>
      <p className="text-[13px] font-semibold text-s-ink">{children}</p>
      <Link href={href} className="flex items-center gap-0.5 text-[13px] font-semibold text-s-ink">
        {seeAll}
        <ChevronRight size={15} strokeWidth={1.9} />
      </Link>
    </div>
  );
}

// S9 (2026-08-11): SuggestLoaderDots deleted, see the capsule comment where it used to render.
// No remaining call sites in this file. mockup-ok: variant B loading-dots removal, owner pick
// off /dev/search-states 2026-08-11

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

// Compact Inspo look card: photo + style name below, whole card taps to the look. No heart here,
// owner picked the name-below card.
//
// C2 (2026-08-12, owner asked the question rather than assuming: "is aespectcratio good like does
// it acc reflect the inspo page"). It did not. Measured the same minute on both surfaces at
// 402x874: the /inspo feed renders 192x341 and 80x142, ratio 0.563, which is the 9:16 these
// thumbnails are shot in; this card was a fixed 3:4, ratio 0.75, so every look was cropped by
// about a quarter top and bottom against how the same look appears on Inspo. Now 9:16, which is
// FLOORS LAW 8: one thing looks the same on every screen that shows it.
//
// The title was `truncate`, one line, and at this width that cut nearly every real style name mid
// word ("Hybrid Microblading and ..."). Two lines, which costs a little evenness between the two
// columns and buys a legible name.
function LookCard({ image, title, onClick }: { image: string; title: string; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label={title} className="group flex w-full flex-col gap-1.5 text-left transition-transform duration-150 active:scale-[0.99] active:duration-[80ms] active:ease-glide">
      <span className="block w-full overflow-hidden rounded-[14px] bg-s-bg-sunken" style={{ aspectRatio: "9 / 16" }}>
        {image ? <img src={image} alt="" loading="lazy" className="h-full w-full object-cover" /> : null}
      </span>
      <span className="line-clamp-2 px-0.5 text-[13px] font-semibold leading-snug text-s-ink">{title}</span>
    </button>
  );
}

// Traditional-search autocomplete row: magnifier + ink term + up-left "insert" arrow.
// `primary` weights the raw-query row above the similar terms. Not a grey pill.
function AutocompleteRow({ label, primary, onClick }: { label: string; primary?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 py-2.5 text-left">
      <Search size={16} strokeWidth={1.9} className="shrink-0 text-s-ink-2" />
      <span className={`min-w-0 flex-1 truncate text-[14px] text-s-ink ${primary ? "font-semibold" : "font-medium"}`}>{label}</span>
      <ArrowUpLeft size={15} strokeWidth={1.9} className="shrink-0 text-s-ink-2" />
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
        // TODAY IS NOT BLUE ANY MORE. Owner 2026-08-11: "in wann why is it blue".
        // Fair question, and the answer was that today's number was drawn in the accent colour
        // while nothing was selected, so the calendar opened looking as though a date had already
        // been chosen. The design contract does allow blue on a calendar date, but only as the
        // SELECTED FILL, which is the `selected` branch below and is untouched. Today now carries
        // the calm grey fill this system already uses for a selected pill, plus bold ink, so it
        // reads as "you are here" rather than "already picked". No new value is introduced:
        // bg-s-bg-sunken and the h-9 pill shape are both already on this element.
        return (
          <div key={i} className="flex justify-center">
            {disabled ? (
              <span className="grid h-9 w-9 place-items-center text-[14px] text-s-ink-2/35">{d}</span>
            ) : (
              /* mockup-ok: swaps one existing token for another on the today branch, per his question */
              <button onClick={() => onPick(key, `${d}. ${monthLong}`)}
                className={`grid h-9 w-9 place-items-center rounded-full text-[14px] transition-colors ${selected ? "bg-s-ink font-bold text-white" /* selected-ok: owner 2026-08-12 "tapped is blue it should be black", overruling the blue date-fill row of the design contract by name */ : isToday ? "bg-s-bg-sunken font-bold text-s-ink" : "font-medium text-s-ink hover:bg-s-bg-sunken"}`}>
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
function SuggestRow({ name, sub, Icon, img, photo, rating, tintBg, tintFg, art, onClick, onRemove }: {
  name: React.ReactNode; sub?: string; Icon?: LucideIcon; img?: string;
  // C1 (2026-08-12, owner: "looks flat n no color"). Three optional slots, all opt-in, so every
  // existing caller renders byte-identically: `photo` puts the salon's OWN cover in the tile it
  // already had, `rating` puts the gold star and the value beside the name (he asked for the value
  // WITHOUT the review count), and `tintBg`/`tintFg` let the category rows carry the colour
  // `searchCategories.ts` has always declared and this row used to throw away.
  photo?: string | null; rating?: number | null; tintBg?: string; tintFg?: string; art?: string;
  onClick: () => void; onRemove?: () => void;
}) {
  return (
    <div className="flex w-full items-center gap-3.5 rounded-2xl pr-1 hover:bg-s-bg-sunken">
      <button onClick={onClick} className="flex min-w-0 flex-1 items-center gap-3.5 py-2.5 text-left">
        {img ? (
          <img src={img} alt="" className="h-12 w-12 shrink-0 object-contain" />
        ) : photo ? (
          <span className="block h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-s-bg-sunken">
            <img src={photo} alt="" loading="lazy" className="h-full w-full object-cover" />
          </span>
        ) : art ? (
          /* C4 (2026-08-12, owner: "the icon palletes dont make any scence and doesnt resemble the
             icon seta that are made yk"). The category's OWN drawn icon, which this project has
             shipped in /icons/categories/v2 all along, on a tile tinted to the hue that art is
             drawn in. Not a Lucide glyph in a colour I reasoned my way to. */
          <span className={`grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl ${tintBg ?? "bg-s-bg-sunken"}`}>
            <img src={art} alt="" className="h-9 w-9 object-contain" />
          </span>
        ) : (
          <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${tintBg ?? "bg-s-bg-sunken"} ${tintFg ?? "text-s-ink-2"}`}>
            {Icon ? <Icon size={20} strokeWidth={2.2} /> : null}
          </span>
        )}
        <span className="min-w-0">
          <span className="flex min-w-0 items-baseline gap-2">
            <span className="min-w-0 truncate text-[15px] font-semibold text-s-ink">{name}</span>
            {/* The gold star against the grey line under it IS the separation, so no dot. */}
            {rating != null ? (
              <span className="flex shrink-0 items-center gap-1 text-[13px] text-s-ink">
                <Star size={12} strokeWidth={0} fill="currentColor" className="shrink-0 text-s-star" />
                <span>{rating.toFixed(1)}</span>
              </span>
            ) : null}
          </span>
          {sub ? <span className="block truncate text-[13px] text-s-ink-2">{sub}</span> : null}
        </span>
      </button>
      {onRemove && (
        <button onClick={onRemove} aria-label="Entfernen" className="grid h-8 w-8 shrink-0 place-items-center text-s-ink-2">
          <X size={17} strokeWidth={1.9} />
        </button>
      )}
    </div>
  );
}
