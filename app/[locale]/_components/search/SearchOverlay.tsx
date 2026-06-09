"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence, useReducedMotion, type Transition } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Search,
  Scissors,
  MapPin,
  Navigation,
  Calendar as CalendarIcon,
  Clock,
  SearchX,
  TriangleAlert,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  type LucideIcon,
} from "lucide-react";
import { type CalendarDate, getLocalTimeZone, today } from "@internationalized/date";
import { DateTimePicker, RatingStars } from "@/app/[locale]/_components/primitives";
import { cn } from "@/lib/utils";
import { useSearchSuggest } from "../homepage/useSearchSuggest";
import {
  useRecentSearches,
  recentLabel,
  type RecentSearch,
} from "../homepage/useRecentSearches";
import { useRecentlyViewed } from "../homepage/useRecentlyViewed";
import { TRENDING } from "../homepage/searchTrending";

/**
 * SearchOverlay — full-page search surface (V2-D51 / Path C, completed).
 *
 * Design truth = the locked mockups:
 *   public/solen-search-screens.html   (full flow, flow A)
 *   public/solen-search-consistent.html (state grammar)
 *   public/solen-search-council.html   (selected-state treatment)
 *   public/solen-search-states.html    (loading / no-match / empty / error)
 *
 * Decision lock: search is FULL-PAGE everywhere (like Fresha), NOT a half-sheet.
 * Opened from BOTH the homepage SearchBar and the SearchTemplate sticky bar.
 *
 * Layer 1 chrome (B&W). The only color is semantic: rating star (s-star), the
 * date/time PICK (solid blue — the one allowed blue fill), open/closed badge
 * (green/grey), and the "clear / Loeschen" link (blue). Input focus = blue
 * focus-visible ring only. Primary submit = ink.
 *
 * STATE GRAMMAR (from the mockups, never invented):
 *   - Selected pill/segment  = soft-grey sink (bg-s-bg-sunken) + ink text.
 *     Inactive = white + muted text. Mirrors TabPill.tsx.
 *   - Date PICK (chosen day) = solid blue (DateTimePicker handles this — its
 *     selected cell is ink today, so we keep the period chips on the sink
 *     grammar; the calendar's own selected state is the component's contract).
 *
 * Composition / reuse:
 *   - useSearchSuggest  → debounced as-you-type groups (services/salons/stylists)
 *   - useRecentSearches → recent pills (click = restore + auto-submit)
 *   - DateTimePicker    → the "Zeit" segment day picker (single-date variant)
 *   - FEATURED_SALONS / TRENDING → resting content
 *   - Categories are RESKINNED inline (the old searchCategories.ts palette is
 *     dead pre-B&W terracotta/cream + fake counts; the mockup shows a neutral
 *     icon row, so we render that instead).
 */

type Segment = "service" | "stadt" | "zeit";

// ── Animation: fast cross-fade + slight rise, matches the overlay feel (the
//    island morph lives on the collapsed pill; the overlay itself just fades in).
const overlayTransition: Transition = {
  type: "tween",
  ease: [0.22, 1, 0.36, 1],
  duration: 0.28,
};
const instantTransition: Transition = { duration: 0 };

// (Service quick-pick chips removed — the approved resting state, mockup A1, is
//  recents-only, not category chips.)

const CITIES = ["Basel", "Zürich", "Bern", "Lausanne", "Genf", "Luzern", "St. Gallen", "Winterthur"];

// Approx city centroids — "use current location" resolves real GPS coords to the
// nearest of these (squared-distance; fine at country scale, no reverse-geocode dep).
const CITY_COORDS: Record<string, [number, number]> = {
  Basel: [47.5596, 7.5886], "Zürich": [47.3769, 8.5417], Bern: [46.948, 7.4474],
  Lausanne: [46.5197, 6.6323], Genf: [46.2044, 6.1432], Luzern: [47.0502, 8.3093],
  "St. Gallen": [47.4245, 9.3767], Winterthur: [47.5008, 8.7241],
};
function nearestCity(lat: number, lng: number): string {
  let best = "", bestD = Infinity;
  for (const [city, [la, lo]] of Object.entries(CITY_COORDS)) {
    const d = (la - lat) ** 2 + (lo - lng) ** 2;
    if (d < bestD) { bestD = d; best = city; }
  }
  return best;
}

// ── Period-of-day chips. English values for URL params, label via i18n.
const PERIODS: { value: string; icon: LucideIcon }[] = [
  { value: "morning", icon: Sunrise },
  { value: "noon", icon: Sun },
  { value: "afternoon", icon: Sunset },
  { value: "evening", icon: Moon },
];

// (Category cards removed — not in the approved mockup; resting state is recents-only.)

export interface SearchOverlayProps {
  /** Controlled open state. */
  open: boolean;
  /** Fires on X / Escape / backdrop / cancel. */
  onClose: () => void;
  /** Locale for navigation + DateTimePicker formatting. */
  locale: string;
  /** Optional seed values (e.g. the sticky bar passes the active city). */
  initialService?: string;
  initialCity?: string;
}

export function SearchOverlay({
  open,
  onClose,
  locale,
  initialService = "",
  initialCity = "",
}: SearchOverlayProps) {
  const router = useRouter();
  const t = useTranslations("ui.searchOverlay");
  const prefersReducedMotion = useReducedMotion();
  const transition = prefersReducedMotion ? instantTransition : overlayTransition;

  // ── Composer state ──────────────────────────────────────────────────────
  const [query, setQuery] = React.useState("");
  // "committed" collapses the live typeahead (e.g. after picking a service or opening a
  // field) so City + When are reachable — lets you compose service → city → date. Typing clears it.
  const [committed, setCommitted] = React.useState(false);
  const [service, setService] = React.useState(initialService);
  const [stadt, setStadt] = React.useState(initialCity);
  const [zeitDate, setZeitDate] = React.useState<CalendarDate | null>(null);
  // No setter: picking a period auto-searches (navigates away), so it's never held in state.
  const [zeitPeriod] = React.useState<string>("");

  // Which segment's focused picker is open (null = the resting/typing screen).
  const [segment, setSegment] = React.useState<Segment | null>(null);

  // Suggestion scope tabs (Alle / Services / Salons / Stylisten).
  type Scope = "all" | "services" | "salons" | "stylists";
  const [scope, setScope] = React.useState<Scope>("all");

  const { recent, push, clear } = useRecentSearches();
  const { items: recentlyViewed, clear: clearViewed } = useRecentlyViewed(4);
  const { results, loading, error } = useSearchSuggest(query, {
    city: stadt || undefined,
  });

  const trimmed = query.trim();
  const isTyping = trimmed.length >= 2 && !committed;
  const hasAnyResults =
    results.services.length > 0 ||
    results.salons.length > 0 ||
    results.stylists.length > 0;

  // ── Period label map (i18n) ─────────────────────────────────────────────
  const periodLabel = React.useCallback(
    (value: string) => {
      const map: Record<string, string> = {
        morning: t("periodMorning"),
        noon: t("periodNoon"),
        afternoon: t("periodAfternoon"),
        evening: t("periodEvening"),
      };
      return map[value] ?? value;
    },
    [t],
  );

  // ── Derived "Zeit" display label (date + period) ─────────────────────────
  const zeitLabel = React.useMemo(() => {
    if (!zeitDate && !zeitPeriod) return "";
    const periodTxt = zeitPeriod ? periodLabel(zeitPeriod) : "";
    if (!zeitDate) return periodTxt;
    const dateStr = new Intl.DateTimeFormat(`${locale}-CH`, {
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(zeitDate.toDate(getLocalTimeZone()));
    return periodTxt ? `${dateStr}, ${periodTxt}` : dateStr;
  }, [zeitDate, zeitPeriod, periodLabel, locale]);

  // ── Body-scroll lock while open ──────────────────────────────────────────
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ── Escape closes (the focused picker first, else the overlay) ───────────
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (segment) setSegment(null);
      else onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, segment, onClose]);

  // ── Sync seeds when (re)opened ───────────────────────────────────────────
  React.useEffect(() => {
    if (open) {
      setService(initialService);
      setStadt(initialCity);
    }
    // Intentionally only on open toggle — typed state is reset on close below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ── Submit — preserves the EXACT URL contract the legacy SearchBar built
  //    (service / city / date / period). Free-text `q` is added when present.
  const buildParams = React.useCallback(
    (over?: Partial<{ q: string; service: string; city: string; date: string; period: string }>) => {
      const sp = new URLSearchParams();
      const qv = over?.q ?? trimmed;
      const sv = over?.service ?? service;
      const cv = over?.city ?? stadt;
      const dv = over?.date ?? (zeitDate ? zeitDate.toString() : "");
      const pv = over?.period ?? zeitPeriod;
      if (qv && qv.length >= 2) sp.set("q", qv);
      if (sv) sp.set("service", sv);
      if (cv) sp.set("city", cv);
      if (dv) sp.set("date", dv);
      if (pv) sp.set("period", pv);
      return sp;
    },
    [trimmed, service, stadt, zeitDate, zeitPeriod],
  );

  const navigate = React.useCallback(
    (sp: URLSearchParams) => {
      const qs = sp.toString();
      router.push(`/${locale}/search${qs ? `?${qs}` : ""}`);
      onClose();
    },
    [router, locale, onClose],
  );

  const handleSubmit = React.useCallback(() => {
    push({
      query: trimmed || undefined,
      service: service || undefined,
      city: stadt || undefined,
      date: zeitDate ? zeitDate.toString() : undefined,
      period: zeitPeriod || undefined,
    });
    navigate(buildParams());
  }, [push, trimmed, service, stadt, zeitDate, zeitPeriod, buildParams, navigate]);

  // Auto-search: a committing selection (city / date / period) fires the search
  // immediately with the just-picked value — no manual "Suchen" tap. The value is
  // passed explicitly because setState hasn't flushed yet when this runs.
  const autoSearch = React.useCallback(
    (over: Partial<{ city: string; date: string; period: string }>) => {
      push({
        query: trimmed || undefined,
        service: service || undefined,
        city: over.city ?? stadt ?? undefined,
        date: over.date ?? (zeitDate ? zeitDate.toString() : undefined),
        period: over.period ?? zeitPeriod ?? undefined,
      });
      navigate(buildParams(over));
    },
    [push, trimmed, service, stadt, zeitDate, zeitPeriod, buildParams, navigate],
  );

  // ── Recent pill → restore all fields + auto-submit (useRecentSearches doc) ─
  const handleRecentClick = React.useCallback(
    (r: RecentSearch) => {
      const sp = new URLSearchParams();
      if (r.query) sp.set("q", r.query);
      if (r.service) sp.set("service", r.service);
      if (r.city) sp.set("city", r.city);
      if (r.date) sp.set("date", r.date);
      if (r.period) sp.set("period", r.period);
      push({
        query: r.query,
        service: r.service,
        city: r.city,
        date: r.date,
        period: r.period,
      });
      navigate(sp);
    },
    [push, navigate],
  );

  // ── Suggestion-row clicks ────────────────────────────────────────────────
  const onServiceSuggest = React.useCallback(
    (name: string) => {
      // Compose: fill the query with the picked service + collapse the results so City + When
      // stay reachable. (Was: navigate immediately, which blocked composing service → city → date.)
      // Drill-in: also return to the home composer so the Service field shows the picked term.
      setQuery(name);
      setCommitted(true);
      setSegment(null);
    },
    [],
  );
  const onSalonSuggest = React.useCallback(
    (slug: string, name: string) => {
      push({ query: name });
      router.push(`/${locale}/salon/${slug}`);
      onClose();
    },
    [push, router, locale, onClose],
  );
  const onStylistSuggest = React.useCallback(
    (salonSlug: string, name: string) => {
      push({ query: name });
      router.push(`/${locale}/salon/${salonSlug}`);
      onClose();
    },
    [push, router, locale, onClose],
  );

  // ── Trending → free-text submit (bypasses the composer, per plan D2) ──────
  const onTrending = React.useCallback(
    (q: string) => {
      push({ query: q });
      navigate(buildParams({ q }));
    },
    [push, navigate, buildParams],
  );

  // ── Reset typed + composer state on close so a reopen starts clean ────────
  const close = React.useCallback(() => {
    setSegment(null);
    setQuery("");
    setCommitted(false);
    setScope("all");
    onClose();
  }, [onClose]);

  // Portal to <body> so the overlay escapes the SearchBar island's stacking +
  // transform + overflow context. Nested, a fixed z-index is scoped to that
  // transformed ancestor, so later page sections paint over the overlay.
  // SSR-safe via the mounted gate (document is unavailable during SSR).
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // NOTE: the body-scroll lock lives in ONE effect above (~line 200). A duplicate
  // here caused the lock to stick (each effect captured the other's "hidden" as its
  // restore value), leaving the page unscrollable after close. Removed.

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="search-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={t("title")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transition}
          className="fixed inset-0 z-[800] flex flex-col bg-white"
        >
          {/* ── Header: back (when in a focused picker) OR title + close ── */}
          <div className="flex items-center gap-3 px-4 pb-3 pt-[max(16px,env(safe-area-inset-top))] md:px-6">
            {segment ? (
              <button
                type="button"
                onClick={() => setSegment(null)}
                aria-label={t("back")}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-s-border text-s-ink transition-colors hover:border-s-ink focus-visible:outline-2 focus-visible:outline-s-accent focus-visible:outline-offset-2"
              >
                <ChevronLeft size={18} strokeWidth={2} aria-hidden />
              </button>
            ) : null}
            <h2 className="font-heading text-[19px] font-extrabold tracking-[-0.02em] text-s-ink">
              {segment === "service"
                ? t("searchTitle")
                : segment === "stadt"
                  ? t("locationTitle")
                  : segment === "zeit"
                    ? t("dateTitle")
                    : t("title")}
            </h2>
            <button
              type="button"
              onClick={close}
              aria-label={t("close")}
              className="ml-auto grid h-9 w-9 shrink-0 place-items-center rounded-full border border-s-border text-s-ink transition-colors hover:border-s-ink focus-visible:outline-2 focus-visible:outline-s-accent focus-visible:outline-offset-2"
            >
              <X size={18} strokeWidth={2} aria-hidden />
            </button>
          </div>

          {/* ── Scrollable body ── */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 md:px-6">
            <div className="mx-auto w-full max-w-[640px]">
              {segment === "stadt" ? (
                <LocationPicker
                  t={t}
                  value={stadt}
                  onChange={setStadt}
                  onPick={(city) => {
                    setStadt(city);
                    setSegment(null); // compose: fill the City field, back to the composer (no search yet)
                  }}
                  onUseCurrent={() => {
                    if (typeof navigator !== "undefined" && navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          setStadt(nearestCity(pos.coords.latitude, pos.coords.longitude) || t("currentLocation"));
                          setSegment(null);
                        },
                        (err) => {
                          console.error("[SearchOverlay] geolocation failed:", err.message);
                          setSegment(null);
                        },
                        { timeout: 8000, maximumAge: 300000 },
                      );
                    } else {
                      setStadt(t("currentLocation"));
                      setSegment(null);
                    }
                  }}
                />
              ) : segment === "zeit" ? (
                <TimePicker
                  t={t}
                  locale={locale}
                  zeitDate={zeitDate}
                  zeitPeriod={zeitPeriod}
                  // compose: a day HOLDS the date (calendar turns blue); a time band COMMITS
                  // the search with the held date + period. So you set date AND time, then go.
                  onDateChange={setZeitDate}
                  onPeriodChange={(p) => autoSearch({ period: p })}
                />
              ) : segment === "service" ? (
                <ServiceSearch
                  t={t}
                  locale={locale}
                  query={query}
                  setQuery={(v) => {
                    setQuery(v);
                    setCommitted(false);
                  }}
                  scope={scope}
                  setScope={setScope}
                  isTyping={isTyping}
                  loading={loading}
                  error={error}
                  results={results}
                  hasAnyResults={hasAnyResults}
                  recent={recent}
                  recentlyViewed={recentlyViewed}
                  onRecentClick={handleRecentClick}
                  onServiceSuggest={onServiceSuggest}
                  onSalonSuggest={onSalonSuggest}
                  onStylistSuggest={onStylistSuggest}
                  onTrending={onTrending}
                  onSubmitAnyway={handleSubmit}
                />
              ) : (
                <Home
                  t={t}
                  query={query}
                  stadt={stadt}
                  zeitLabel={zeitLabel}
                  recent={recent}
                  clearRecent={() => {
                    clear();
                    clearViewed();
                  }}
                  onRecentClick={handleRecentClick}
                  onOpenSegment={(seg) => {
                    setCommitted(true); // moving to a field commits the typed query → results collapse
                    setSegment(seg);
                  }}
                  onSubmitAnyway={handleSubmit}
                />
              )}
            </div>
          </div>

          {/* ── Footer: the single ink commit action ── */}
          <div className="border-t border-s-bg-sunken px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 md:px-6">
            <div className="mx-auto w-full max-w-[640px]">
              <button
                type="button"
                onClick={handleSubmit}
                className="flex h-12 w-full items-center justify-center rounded-[13px] bg-s-ink font-heading text-[15px] font-bold text-white transition-colors duration-200 ease-glide hover:bg-black active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-s-accent focus-visible:outline-offset-2"
              >
                {t("submit")}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ════════════════════════════════════════════════════════════════════════
   RESTING (query<2) + TYPING (query>=2) screen
   ════════════════════════════════════════════════════════════════════════ */

type TFn = ReturnType<typeof useTranslations>;

/* ────────────────────────────────────────────────────────────────────────
   HOME composer (segment === null) — three tap-fields + recent.
   No inline input, no live results, no for-you chips here: each field drills
   into its own focused sub-screen (Service / Stadt / Zeit), mirroring the
   Location + Date screens. (solen-search-drill.html frame 1.)
   ──────────────────────────────────────────────────────────────────────── */

function Home({
  t,
  query,
  stadt,
  zeitLabel,
  recent,
  clearRecent,
  onRecentClick,
  onOpenSegment,
  onSubmitAnyway,
}: {
  t: TFn;
  query: string;
  stadt: string;
  zeitLabel: string;
  recent: RecentSearch[];
  clearRecent: () => void;
  onRecentClick: (r: RecentSearch) => void;
  onOpenSegment: (s: Segment) => void;
  onSubmitAnyway: () => void;
}) {
  return (
    <>
      {/* ── Three tap-fields (stacked). All three drill into their own screen. ── */}
      <div className="flex flex-col gap-[9px] pt-1">
        {/* Service — drill into the focused search sub-screen */}
        <FieldButton
          icon={<Search size={17} strokeWidth={2} aria-hidden />}
          value={query || t("queryPlaceholder")}
          isPlaceholder={!query}
          onClick={() => onOpenSegment("service")}
          ariaLabel={t("queryPlaceholder")}
        />

        {/* Stadt — drill into the location picker */}
        <FieldButton
          icon={<MapPin size={17} strokeWidth={2} aria-hidden />}
          value={stadt || t("cityField")}
          isPlaceholder={!stadt}
          onClick={() => onOpenSegment("stadt")}
          ariaLabel={t("cityField")}
        />

        {/* Zeit — drill into the date/time picker */}
        <FieldButton
          icon={<CalendarIcon size={17} strokeWidth={2} aria-hidden />}
          value={zeitLabel || t("anytime")}
          isPlaceholder={!zeitLabel}
          onClick={() => onOpenSegment("zeit")}
          ariaLabel={t("dateField")}
        />
      </div>

      {/* ── Zuletzt — recent searches for quick re-search + browse-all shortcut. ── */}
      <div className="mt-5 pb-2">
        <div className="flex items-center justify-between">
          <SectionLabel>{t("recentLabel")}</SectionLabel>
          {recent.length > 0 && (
            <button
              type="button"
              onClick={clearRecent}
              className="font-body text-[13px] font-semibold text-s-accent transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-s-accent focus-visible:outline-offset-2"
            >
              {t("clear")}
            </button>
          )}
        </div>
        <div className="mt-1">
          {/* recent search terms */}
          {recent.slice(0, 10).map((r, i) => (
            <SuggestRow
              key={`recent-${recentLabel(r)}-${i}`}
              icon={<Search size={16} strokeWidth={2} aria-hidden />}
              title={recentLabel(r)}
              onClick={() => onRecentClick(r)}
            />
          ))}
          {/* persistent browse-all shortcut (Fresha "All treatments") */}
          <SuggestRow
            icon={<Search size={16} strokeWidth={2} aria-hidden />}
            title={t("allServices")}
            onClick={onSubmitAnyway}
          />
        </div>
      </div>
    </>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   SERVICE search sub-screen (segment === "service") — the focused search.
   Autofocus input → typing shows live results; empty shows discovery
   (Für dich / Zuletzt / Schon besucht / Im Trend). Picking a result or a
   chip returns to the Home composer with the query filled.
   (solen-search-drill.html frame 2.)
   ──────────────────────────────────────────────────────────────────────── */

function ServiceSearch({
  t,
  locale,
  query,
  setQuery,
  scope,
  setScope,
  isTyping,
  loading,
  error,
  results,
  hasAnyResults,
  recent,
  recentlyViewed,
  onRecentClick,
  onServiceSuggest,
  onSalonSuggest,
  onStylistSuggest,
  onTrending,
  onSubmitAnyway,
}: {
  t: TFn;
  locale: string;
  query: string;
  setQuery: (v: string) => void;
  scope: "all" | "services" | "salons" | "stylists";
  setScope: (s: "all" | "services" | "salons" | "stylists") => void;
  isTyping: boolean;
  loading: boolean;
  error: Error | null;
  results: ReturnType<typeof useSearchSuggest>["results"];
  hasAnyResults: boolean;
  recent: RecentSearch[];
  recentlyViewed: ReturnType<typeof useRecentlyViewed>["items"];
  onRecentClick: (r: RecentSearch) => void;
  onServiceSuggest: (name: string) => void;
  onSalonSuggest: (slug: string, name: string) => void;
  onStylistSuggest: (salonSlug: string, name: string) => void;
  onTrending: (q: string) => void;
  onSubmitAnyway: () => void;
}) {
  const wantServices = scope === "all" || scope === "services";
  const wantSalons = scope === "all" || scope === "salons";
  const wantStylists = scope === "all" || scope === "stylists";

  // ── "Für dich" chips (empty-state in-between zone). Personalized terms from
  //    the discovery engine; falls back to the static TRENDING list on miss/err.
  const [forYou, setForYou] = React.useState<{ label: string; query: string }[]>([]);
  React.useEffect(() => {
    let alive = true;
    fetch("/api/recommendations/chips")
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        const terms = ((d?.terms ?? []) as { term: string }[])
          .map((x) => x.term)
          .filter(Boolean)
          .slice(0, 8)
          .map((term) => ({ label: term, query: term }));
        setForYou(terms.length > 0 ? terms : TRENDING.map((x) => ({ label: x.label, query: x.query })));
      })
      .catch((e) => {
        console.error("[SearchOverlay] chip-terms fetch failed:", e);
        setForYou(TRENDING.map((x) => ({ label: x.label, query: x.query })));
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      <div className="flex flex-col gap-[9px] pt-1">
        {/* Query field — the live text input (autofocus). */}
        <label
          className={cn(
            "flex h-12 items-center gap-[10px] rounded-[13px] border bg-white px-[13px]",
            "border-s-border focus-within:border-s-accent",
            "transition-colors",
          )}
        >
          <Search size={17} strokeWidth={2} className="shrink-0 text-s-accent" aria-hidden />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("queryPlaceholder")}
            aria-label={t("queryPlaceholder")}
            className="min-w-0 flex-1 !border-0 !bg-transparent !px-0 !min-h-0 font-body text-[14.5px] text-s-ink placeholder:text-s-ink-3 focus:outline-none focus-visible:shadow-none"
          />
        </label>

        {/* ── TYPING = live results; EMPTY = discovery stack. ── */}
        {isTyping ? (
          <>
            {/* Scope tabs — sink grammar (selected = soft-grey, inactive = white) */}
            <div
              className="scrollbar-none mt-[13px] flex gap-[7px] overflow-x-auto"
              style={{ scrollbarWidth: "none" }}
              role="tablist"
              aria-label={t("scopeLabel")}
            >
              {(["all", "services", "salons", "stylists"] as const).map((s) => (
                <ScopeTab
                  key={s}
                  active={scope === s}
                  onClick={() => setScope(s)}
                  label={
                    s === "all"
                      ? t("scopeAll")
                      : s === "services"
                        ? t("scopeServices")
                        : s === "salons"
                          ? t("scopeSalons")
                          : t("scopeStylists")
                  }
                />
              ))}
            </div>

            {error ? (
              <ErrorBlock t={t} />
            ) : loading ? (
              <SuggestSkeleton />
            ) : !hasAnyResults ? (
              <NoMatchBlock t={t} query={query} onSubmitAnyway={onSubmitAnyway} onTrending={onTrending} />
            ) : (
              <div className="pb-2">
                {wantServices && results.services.length > 0 && (
                  <Group label={t("groupServices")}>
                    {results.services.map((s) => {
                      const name = locale === "en" ? s.name_en || s.name_de : s.name_de;
                      return (
                        <SuggestRow
                          key={s.id}
                          icon={<Scissors size={15} strokeWidth={2} aria-hidden />}
                          title={name}
                          onClick={() => onServiceSuggest(name)}
                        />
                      );
                    })}
                  </Group>
                )}
                {wantSalons && results.salons.length > 0 && (
                  <Group label={t("groupSalons")}>
                    {results.salons.map((s) => (
                      <VenueRow
                        key={s.id}
                        name={s.name}
                        photoUrl={s.cover_photo_url}
                        rating={s.average_rating}
                        meta={s.address?.split(",")[0]}
                        onClick={() => onSalonSuggest(s.slug, s.name)}
                      />
                    ))}
                  </Group>
                )}
                {wantStylists && results.stylists.length > 0 && (
                  <Group label={t("groupStylists")}>
                    {results.stylists.map((s) => (
                      <VenueRow
                        key={s.id}
                        name={s.name}
                        photoUrl={s.avatar_url}
                        meta={s.salon_name}
                        rounded
                        onClick={() => onStylistSuggest(s.salon_slug, s.name)}
                      />
                    ))}
                  </Group>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            {/* (a) Für dich — personalized chips */}
            {forYou.length > 0 && (
              <div className="pt-1">
                <SectionLabel>{t("forYou")}</SectionLabel>
                {/* single tidy scroll row (was flex-wrap → ragged multi-row clutter) */}
                <div className="scrollbar-none mt-2 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                  {forYou.map((c) => (
                    <button
                      key={c.query}
                      type="button"
                      onClick={() => onTrending(c.query)}
                      className="shrink-0 whitespace-nowrap rounded-full border border-s-border bg-white px-3.5 py-2 font-body text-[13.5px] font-semibold text-s-ink transition-colors hover:border-s-ink focus-visible:outline-2 focus-visible:outline-s-accent focus-visible:outline-offset-2"
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* (b) Zuletzt — recent searches */}
            {recent.length > 0 && (
              <div className="mt-5">
                <SectionLabel>{t("recentLabel")}</SectionLabel>
                <div className="mt-1">
                  {recent.slice(0, 10).map((r, i) => (
                    <SuggestRow
                      key={`recent-${recentLabel(r)}-${i}`}
                      icon={<Search size={16} strokeWidth={2} aria-hidden />}
                      title={recentLabel(r)}
                      onClick={() => onRecentClick(r)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* (c) Schon besucht — recently-viewed venues (photo thumbnails) */}
            {recentlyViewed.length > 0 && (
              <div className="mt-5">
                <SectionLabel>{t("visitedLabel")}</SectionLabel>
                <div className="mt-1">
                  {recentlyViewed.map((v) => (
                    <VenueRow
                      key={`rv-${v.slug}`}
                      name={v.name}
                      photoUrl={v.photoUrl ?? null}
                      rating={v.rating ?? null}
                      meta={v.category.charAt(0).toUpperCase() + v.category.slice(1)}
                      onClick={() => onSalonSuggest(v.slug, v.name)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* (d) Im Trend — numbered trending list (rank + label) */}
            <div className="mt-5 pb-2">
              <SectionLabel>{t("trendingLabel")}</SectionLabel>
              <div className="mt-1">
                {TRENDING.map((item) => (
                  <button
                    key={item.rank}
                    type="button"
                    onClick={() => onTrending(item.query)}
                    className="flex w-full items-center gap-3 rounded-[10px] px-2 py-2.5 text-left transition-colors hover:bg-s-bg-sunken focus-visible:outline-2 focus-visible:outline-s-accent focus-visible:outline-offset-2"
                  >
                    <span className="w-4 shrink-0 text-center font-heading text-[14px] font-extrabold text-s-ink-3" aria-hidden>
                      {item.rank}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-body text-[14.5px] font-medium text-s-ink">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   LOCATION picker (Stadt segment)
   ════════════════════════════════════════════════════════════════════════ */

function LocationPicker({
  t,
  value,
  onChange,
  onPick,
  onUseCurrent,
}: {
  t: TFn;
  value: string;
  onChange: (v: string) => void;
  onPick: (city: string) => void;
  onUseCurrent: () => void;
}) {
  return (
    <div className="pt-1">
      <label className="flex h-12 items-center gap-[10px] rounded-[13px] border border-s-border bg-white px-[13px] focus-within:border-s-accent">
        <Search size={17} strokeWidth={2} className="shrink-0 text-s-ink-3" aria-hidden />
        <input
          type="text"
          autoFocus
          value={value === t("currentLocation") ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("cityPlaceholder")}
          aria-label={t("cityPlaceholder")}
          className="min-w-0 flex-1 !border-0 !bg-transparent !px-0 !min-h-0 font-body text-[14.5px] text-s-ink placeholder:text-s-ink-3 focus:outline-none focus-visible:shadow-none"
        />
      </label>

      <button
        type="button"
        onClick={onUseCurrent}
        className="mt-3 flex w-full items-center gap-3 rounded-[13px] px-2 py-3 text-left transition-colors hover:bg-s-bg-sunken focus-visible:outline-2 focus-visible:outline-s-accent focus-visible:outline-offset-2"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-s-accent/[0.10] text-s-accent">
          <Navigation size={16} strokeWidth={2.25} aria-hidden />
        </span>
        <span className="font-body text-[14.5px] font-semibold text-s-accent">{t("useCurrentLocation")}</span>
      </button>

      <div className="mt-4">
        <SectionLabel>{t("popularCities")}</SectionLabel>
        <div className="mt-1">
          {CITIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onPick(c)}
              className="flex w-full items-center gap-3 rounded-[10px] px-2 py-2.5 text-left transition-colors hover:bg-s-bg-sunken focus-visible:outline-2 focus-visible:outline-s-accent focus-visible:outline-offset-2"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-s-bg-sunken text-s-ink-2">
                <MapPin size={16} strokeWidth={2} aria-hidden />
              </span>
              <span className="flex-1 font-body text-[14.5px] font-medium text-s-ink">{c}</span>
              <ChevronRight size={16} strokeWidth={2} className="text-s-ink-3" aria-hidden />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   TIME picker (Zeit segment) — DateTimePicker (single-date) + period chips
   ════════════════════════════════════════════════════════════════════════ */

function TimePicker({
  t,
  locale,
  zeitDate,
  zeitPeriod,
  onDateChange,
  onPeriodChange,
}: {
  t: TFn;
  locale: string;
  zeitDate: CalendarDate | null;
  zeitPeriod: string;
  onDateChange: (d: CalendarDate | null) => void;
  onPeriodChange: (p: string) => void;
}) {
  const tz = getLocalTimeZone();
  const todayDate = today(tz);
  const tomorrowDate = todayDate.add({ days: 1 });
  const subOf = (d: CalendarDate) =>
    new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "long" }).format(d.toDate(tz));
  const dayPicked = (d: CalendarDate) => zeitDate != null && zeitDate.compare(d) === 0;

  // Council time bands: 4 periods (with ranges) then Jederzeit last. Values = URL params.
  const BANDS: { value: string; label: string; range: string }[] = [
    { value: "morning", label: t("periodMorning"), range: "9–12" },
    { value: "noon", label: t("periodNoon"), range: "12–15" },
    { value: "afternoon", label: t("periodAfternoon"), range: "15–18" },
    { value: "evening", label: t("periodEvening"), range: "18+" },
    { value: "", label: t("anytime"), range: "" },
  ];

  return (
    <div className="pt-1">
      <SectionLabel>{t("pickDay")}</SectionLabel>
      {/* Day quick-cards (council mockup) — selected = royal-blue accent ("blue marks your pick"). */}
      <div className="mt-2 flex gap-2.5">
        {[
          { d: todayDate, label: t("today") },
          { d: tomorrowDate, label: t("tomorrow") },
        ].map(({ d, label }) => {
          const picked = dayPicked(d);
          return (
            <button
              key={label}
              type="button"
              onClick={() => onDateChange(picked ? null : d)}
              aria-pressed={picked}
              className={cn(
                "flex-1 rounded-[13px] border px-3.5 py-3 text-left transition-colors",
                "focus-visible:outline-2 focus-visible:outline-s-accent focus-visible:outline-offset-2",
                picked ? "border-s-accent bg-s-accent text-white" : "border-s-border bg-white text-s-ink hover:border-s-ink",
              )}
            >
              <span className="block font-body text-[14px] font-semibold">{label}</span>
              <span className={cn("mt-0.5 block font-body text-[12px]", picked ? "text-white/85" : "text-s-ink-2")}>
                {subOf(d)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3">
        {/* Calendar for any other day (DateTimePicker single-date primitive).
            German Mo-first weekdays + blue selected day per council mockup. */}
        <DateTimePicker
          variant="single-date"
          selectedTone="accent"
          value={{ date: zeitDate, time: null }}
          onChange={({ date }) => onDateChange(date)}
        />
      </div>

      <div className="mt-5">
        <SectionLabel>{t("pickTime")}</SectionLabel>
        {/* 2-col grid: all 5 bands visible at once (no cut-off scroll rail). Jederzeit spans full
            width. Gives the time picker real presence + fills the screen so the CTA doesn't float. */}
        <div className="mt-2 grid grid-cols-2 gap-2">
          {BANDS.map((band) => {
            const picked = zeitPeriod === band.value;
            const isAnytime = band.value === "";
            return (
              <button
                key={band.value || "anytime"}
                type="button"
                onClick={() => onPeriodChange(band.value)}
                aria-pressed={picked}
                className={cn(
                  "rounded-[13px] border px-4 py-3.5 text-left transition-colors",
                  isAnytime && "col-span-2",
                  "focus-visible:outline-2 focus-visible:outline-s-accent focus-visible:outline-offset-2",
                  // sink toggle (council .tchip): selected = #F5F5F4 fill + ink text, no ring; idle = white + muted
                  picked ? "border-s-border bg-s-bg-sunken text-s-ink" : "border-s-border bg-white text-s-ink-2 hover:border-s-ink",
                )}
              >
                <span className="block font-body text-[14px] font-semibold leading-tight">{band.label}</span>
                {band.range && (
                  <span className="mt-0.5 block font-body text-[12px] leading-tight text-s-ink-2">
                    {band.range}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   Small shared bits (match the mockup anatomy)
   ════════════════════════════════════════════════════════════════════════ */

function FieldButton({
  icon,
  value,
  isPlaceholder,
  onClick,
  ariaLabel,
}: {
  icon: React.ReactNode;
  value: string;
  isPlaceholder: boolean;
  onClick: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="flex h-12 items-center gap-[10px] rounded-[13px] border border-s-border bg-white px-[13px] text-left transition-colors hover:border-s-ink/30 focus-visible:outline-2 focus-visible:outline-s-accent focus-visible:outline-offset-2"
    >
      <span className="flex shrink-0 items-center text-s-ink-3">{icon}</span>
      <span
        className={cn(
          "min-w-0 flex-1 truncate font-body text-[14.5px]",
          isPlaceholder ? "font-normal text-s-ink-3" : "font-medium text-s-ink",
        )}
      >
        {value}
      </span>
    </button>
  );
}

function ScopeTab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-[34px] shrink-0 items-center rounded-full border px-[14px] font-body text-[13px] leading-none transition-colors",
        "focus-visible:outline-2 focus-visible:outline-s-accent focus-visible:outline-offset-2",
        active
          ? "border-s-border bg-s-bg-sunken font-semibold text-s-ink"
          : "border-s-border bg-white font-medium text-s-ink-2 hover:text-s-ink",
      )}
    >
      {label}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="font-heading text-[14.5px] font-bold tracking-[-0.01em] text-s-ink">{children}</div>;
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <SectionLabel>{label}</SectionLabel>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function SuggestRow({
  icon,
  title,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-[10px] px-2 py-2.5 text-left transition-colors hover:bg-s-bg-sunken focus-visible:outline-2 focus-visible:outline-s-accent focus-visible:outline-offset-2"
    >
      <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-s-bg-sunken text-s-ink-2">
        {icon}
      </span>
      <span className="min-w-0 flex-1 truncate font-body text-[14.5px] font-medium text-s-ink">{title}</span>
    </button>
  );
}

function VenueRow({
  name,
  photoUrl,
  rating,
  meta,
  rounded,
  onClick,
}: {
  name: string;
  photoUrl: string | null;
  rating?: number | null;
  meta?: string | null;
  rounded?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-[12px] px-2 py-2.5 text-left transition-colors hover:bg-s-bg-sunken focus-visible:outline-2 focus-visible:outline-s-accent focus-visible:outline-offset-2"
    >
      <span
        className={cn(
          "relative h-[52px] w-[52px] shrink-0 overflow-hidden bg-s-bg-sunken",
          rounded ? "rounded-full" : "rounded-[12px]",
        )}
      >
        {photoUrl ? (
          <Image src={photoUrl} alt="" fill sizes="52px" className="object-cover" />
        ) : (
          <span className="absolute inset-0 grid place-items-center font-heading text-[20px] font-black text-s-ink-3" aria-hidden>
            {name.charAt(0)}
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-body text-[15px] font-semibold tracking-[-0.01em] text-s-ink">{name}</span>
        {(rating != null || meta) && (
          <span className="mt-0.5 flex items-center gap-2.5 font-body text-[12.5px] text-s-ink-2">
            {rating != null && (
              <RatingStars value={rating} size="sm" className="font-semibold text-s-ink" />
            )}
            {meta && <span className="truncate">{meta}</span>}
          </span>
        )}
      </span>
    </button>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   Data states — loading / no-match / error (per solen-search-states.html)
   ════════════════════════════════════════════════════════════════════════ */

function SuggestSkeleton() {
  return (
    <div className="mt-5 flex flex-col gap-4 pb-2" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-[34px] w-[34px] shrink-0 rounded-full bg-s-bg-sunken animate-shimmer" />
          <div className="flex-1">
            <div className="h-[14px] w-1/2 rounded bg-s-bg-sunken animate-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}

function NoMatchBlock({
  t,
  query,
  onSubmitAnyway,
  onTrending,
}: {
  t: TFn;
  query: string;
  onSubmitAnyway: () => void;
  onTrending: (q: string) => void;
}) {
  return (
    <div className="pb-2">
      <div className="flex flex-col items-center px-6 pt-8 text-center">
        <span className="mb-4 grid h-[60px] w-[60px] place-items-center rounded-full bg-s-bg-sunken text-s-ink-2">
          <SearchX size={26} strokeWidth={2} aria-hidden />
        </span>
        <div className="font-heading text-[18px] font-extrabold tracking-[-0.01em] text-s-ink">
          {t("noMatchTitle")}
        </div>
        <div className="mt-1.5 max-w-[260px] font-body text-[13.5px] leading-snug text-s-ink-2">
          {t("noMatchBody", { query })}
        </div>
      </div>

      {/* "Trotzdem suchen" — never a dead end */}
      <button
        type="button"
        onClick={onSubmitAnyway}
        className="mt-5 flex w-full items-center gap-3 rounded-[13px] border border-s-border px-3.5 py-3 text-left transition-colors hover:border-s-ink focus-visible:outline-2 focus-visible:outline-s-accent focus-visible:outline-offset-2"
      >
        <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-s-bg-sunken text-s-ink">
          <Search size={17} strokeWidth={2} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-body text-[14.5px] font-semibold text-s-ink">{t("searchAnyway")}</span>
          <span className="block truncate font-body text-[12px] text-s-ink-2">{t("searchAnywaySub", { query })}</span>
        </span>
        <ChevronRight size={16} strokeWidth={2} className="shrink-0 text-s-ink-3" aria-hidden />
      </button>

      {/* Popular fallback */}
      <div className="mt-5">
        <SectionLabel>{t("popularLabel")}</SectionLabel>
        <div className="mt-1">
          {TRENDING.map((item) => (
            <SuggestRow
              key={item.rank}
              icon={<Scissors size={15} strokeWidth={2} aria-hidden />}
              title={item.label}
              onClick={() => onTrending(item.query)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ErrorBlock({ t }: { t: TFn }) {
  return (
    <div className="flex flex-col items-center px-6 pb-4 pt-10 text-center">
      <span className="mb-4 grid h-[60px] w-[60px] place-items-center rounded-full bg-s-bg-sunken text-s-ink-2">
        <TriangleAlert size={26} strokeWidth={2} aria-hidden />
      </span>
      <div className="font-heading text-[18px] font-extrabold tracking-[-0.01em] text-s-ink">{t("errorTitle")}</div>
      <div className="mt-1.5 max-w-[260px] font-body text-[13.5px] leading-snug text-s-ink-2">{t("errorBody")}</div>
    </div>
  );
}
