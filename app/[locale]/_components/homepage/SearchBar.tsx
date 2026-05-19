"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion, type Transition } from "motion/react";
import {
  Footprints,
  Hand,
  Leaf,
  Moon,
  Navigation,
  Palette,
  Scissors,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  X,
  type LucideIcon,
} from "lucide-react";
import { type CalendarDate, getLocalTimeZone } from "@internationalized/date";
import { DateTimePicker } from "@/app/[locale]/_components/primitives";
import { cn } from "@/lib/utils";

/**
 * Hero search bar — Dynamic-Island-style morphing pill.
 *
 * Animation architecture (matches user-supplied DynamicIslandTOC reference):
 *   - ONE container morphs between explicit width/height/borderRadius values
 *     (NOT `layout` animation — explicit values are smoother & predictable)
 *   - TWO content layers stacked absolutely inside the morphing container
 *   - Cross-fade between layers with STAGGER DELAY (0.1s):
 *       collapsed → expanded: collapsed fades out 0s, expanded fades in 0.1s
 *       expanded → collapsed: expanded fades out 0s, collapsed fades in 0.1s
 *     The 0.1s stagger creates the "hand-off" feel — neither layer fights
 *     the other for visibility during the morph.
 *   - `overflow-hidden` on the morphing container clips content during morph
 *
 * Tween: cubic-bezier(0.22, 1, 0.36, 1) duration 0.5s — same as reference.
 */

type Segment = "service" | "stadt" | "zeit";

const islandTransition: Transition = {
  type: "tween",
  ease: [0.22, 1, 0.36, 1],
  duration: 0.5,
};

// V2-D41-fu.3: when user has prefers-reduced-motion, all morph/crossfade
// transitions become instant. State changes still happen (segment expands /
// collapses) but without the animation curve.
const instantTransition: Transition = { duration: 0 };

// Explicit heights per viewport+state — animations are smoother w fixed values vs height:auto.
// Mobile collapsed: stacked card (3 rows × ~44px + button ~48px + container 12px).
// Desktop collapsed: horizontal pill (~60px tall).
// Tightened from 280/76 → 196/60 (round 2 — first round 232/64 left dead
// space below the submit button because the height was set for the old
// bigger row paddings before they shrank).
// V2-D49: expanded bumped 480 → 600 to fit the real Calendar (~340px tall)
// + period-of-day chips (~50px) + header (64px) + footer (76px). Mobile
// viewport ≥700px still leaves room around the dimmed backdrop.
// V2-D67-fu3 (2026-05-15): bumped 248 → 304 because pill padding went
// p-[12px_18px] → p-[16px_22px] (each row ~62px tall now) and gap-2 → gap-3.
// Math: 3 rows × ~62px + 3 gaps × 12px + button ~56px + container 28px ≈ 304.
// V2-D70 (2026-05-18): mobile collapsed bumped 246 → 280 for the warm-minimal
// architecture: rows are now flush-stacked (no gap, just hairline ::before
// divider), each row 60px (18px padding × 2 + 24px icon/text), button at
// bottom 56px (16px padding × 2 + 24px text), 6px button-margin-top, container
// 8px × 2 = 240 + 24 = 264, round to 280 for safety.
const HEIGHT = {
  mobile:  { collapsed: 280, expanded: 600 },
  desktop: { collapsed: 60,  expanded: 600 },
};

// V2-D49b: each service chip gets an icon in front (Fresha treatment-list pattern,
// adapted to our flat chip style). Icons are lucide-react — same set used elsewhere
// in the homepage. Coiffeur + Barbershop both use Scissors (haircut iconography);
// the labels disambiguate.
const SERVICES: { label: string; icon: LucideIcon }[] = [
  { label: "Coiffeur",       icon: Scissors },
  { label: "Barbershop",     icon: Scissors },
  { label: "Nails",          icon: Sparkles },
  { label: "Spa & Wellness", icon: Leaf },
  { label: "Massage",        icon: Hand },
  { label: "Maniküre",       icon: Sparkles },
  { label: "Pediküre",       icon: Footprints },
  { label: "Färben",         icon: Palette },
];

const CITIES = ["Basel", "Zürich", "Bern", "Lausanne", "Genf", "Luzern", "St. Gallen", "Winterthur"];

// V2-D49: period-of-day chips replace the loose "Jetzt / Heute / Morgen" list.
// Locked decision (user pick B): day + period chips, NOT hour-by-hour. Exact-slot
// picking happens on the salon detail page after a salon is chosen.
// English values for URL params, German labels for display.
// V2-D49b: time-of-day icons map to the day's arc — sunrise/sun/sunset/moon.
const PERIODS: { label: string; value: string; icon: LucideIcon }[] = [
  { label: "Morgens",     value: "morning",   icon: Sunrise },
  { label: "Mittags",     value: "noon",      icon: Sun },
  { label: "Nachmittags", value: "afternoon", icon: Sunset },
  { label: "Abends",      value: "evening",   icon: Moon },
];

export function SearchBar() {
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "de";

  const [active, setActive] = React.useState<Segment | null>(null);
  const [service, setService] = React.useState("");
  const [stadt, setStadt] = React.useState("");
  // V2-D49: zeit splits into structured (date + period) + derived display string.
  // Display label is computed from the structured state — keeps the rest of the
  // collapsed/expanded UI ("Zeit" placeholder vs picked label) untouched.
  const [zeitDate, setZeitDate] = React.useState<CalendarDate | null>(null);
  const [zeitPeriod, setZeitPeriod] = React.useState<string>("");
  const zeit = React.useMemo(() => {
    if (!zeitDate) return zeitPeriod ? PERIODS.find((p) => p.value === zeitPeriod)?.label ?? "" : "";
    const dateStr = new Intl.DateTimeFormat("de-CH", {
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(zeitDate.toDate(getLocalTimeZone()));
    const periodLabel = PERIODS.find((p) => p.value === zeitPeriod)?.label;
    return periodLabel ? `${dateStr} · ${periodLabel}` : dateStr;
  }, [zeitDate, zeitPeriod]);

  const [isDesktop, setIsDesktop] = React.useState(false);
  const prefersReducedMotion = useReducedMotion();
  const transition = prefersReducedMotion ? instantTransition : islandTransition;

  // Track viewport so the collapsed-state height matches the layout
  // (mobile = 280 stacked card / desktop = 76 horizontal pill).
  React.useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Lock body scroll when expanded
  React.useEffect(() => {
    if (active) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [active]);

  // Esc key dismisses
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    if (active) {
      document.addEventListener("keydown", onKey);
      return () => document.removeEventListener("keydown", onKey);
    }
  }, [active]);

  const isExpanded = active !== null;
  const sizes = isDesktop ? HEIGHT.desktop : HEIGHT.mobile;

  // V2-D49: submit builds URL params and navigates to the existing /[locale]/search
  // route. Empty fields are omitted from the query string, so a fully-empty submit
  // lands on /search showing all venues with no filters applied.
  // Decision lock (user pick B): single-select service, single date, day + period
  // chips, "Alle Services" === empty (placeholder stays "Service" until tap).
  const handleSubmit = () => {
    const sp = new URLSearchParams();
    if (service) sp.set("service", service);
    if (stadt) sp.set("city", stadt);
    if (zeitDate) sp.set("date", zeitDate.toString());
    if (zeitPeriod) sp.set("period", zeitPeriod);
    const query = sp.toString();
    router.push(`/${locale}/search${query ? `?${query}` : ""}`);
    setActive(null);
  };

  return (
    <>
      {/* Backdrop overlay — blur dropped (was extremely expensive on every
          paint during the morph). Plain rgba dim is much cheaper + visually
          90% as effective for our purpose (dimming the page behind). */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transition}
            className="fixed inset-0 z-[60] bg-black/30"
            onClick={() => setActive(null)}
            aria-hidden
          />
        )}
      </AnimatePresence>

      {/* Morphing container — animates height + borderRadius w explicit values.
          NO will-change / translateZ(0) — those forced a permanent GPU
          compositor layer that rasterized text at the layer's resolution
          (often less than device DPR), causing blurry text in the resting
          collapsed state. Motion library promotes layers during animation
          on its own; we don't need to force it constantly.
          Desktop collapsed = 76px horizontal pill; expanded = 480px
          tall card. */}
      <motion.div
        initial={false}
        animate={{
          height: isExpanded ? sizes.expanded : sizes.collapsed,
          borderRadius: !isExpanded && isDesktop ? 999 : 24,
        }}
        transition={transition}
        className={cn(
          // V3-D72 (2026-05-18) — unified Aurex floating shadow with cards
          // per user "apply a soft, wide shadow to ALL your white cards" —
          // single value across SearchBar + SalonCard for visual consistency.
          // `0px 6px 24px rgba(0, 0, 0, 0.06)` + no visible border. Was V2-D71's
          // slightly different `0 8px 24px 0.06` — now matches cards exactly.
          "relative w-full max-w-[540px] overflow-hidden border border-s-ink/[0.03] bg-white",
          "shadow-[0_20px_40px_rgba(0,0,0,0.04)]",
          "max-md:mx-auto",
          isExpanded && "z-[70] md:max-w-[640px]",
          !isExpanded && "md:max-w-none",
        )}
      >
        {/* COLLAPSED LAYER — 3 segments + submit button.
            Blur filter dropped earlier; will-change hint also dropped to
            avoid blurry text artifacts from forced GPU rasterization. */}
        <motion.div
          initial={false}
          animate={{
            opacity: isExpanded ? 0 : 1,
            scale: isExpanded ? 0.95 : 1,
          }}
          transition={prefersReducedMotion ? instantTransition : { ...islandTransition, delay: isExpanded ? 0 : 0.1 }}
          className={cn(
            // V2-D70 (2026-05-18) — Aurex/Fresha warm-minimal layout:
            // padding 8px (was 12), NO gap (rows stack flush, divider via
            // ::before on each row), button at bottom full-width.
            // Desktop unchanged (horizontal pill segments + right-side CTA).
            "absolute inset-0 flex flex-col p-2 md:gap-0 md:p-[5px_5px_5px_7px] md:flex-row md:items-stretch",
            isExpanded && "pointer-events-none",
          )}
        >
          <CollapsedRow
            icon={<IconSearch />}
            ariaLabel="Service suchen"
            value={service || "Service"}
            isPlaceholder={!service}
            isFirst
            onClick={() => setActive("service")}
          />
          <CollapsedRow
            icon={<IconPin />}
            ariaLabel="Standort wählen"
            value={stadt || "Stadt"}
            isPlaceholder={!stadt}
            onClick={() => setActive("stadt")}
          />
          <CollapsedRow
            icon={<IconCalendar />}
            ariaLabel="Zeit wählen"
            value={zeit || "Zeit"}
            isPlaceholder={!zeit}
            onClick={() => setActive("zeit")}
          />
          <button
            type="button"
            onClick={handleSubmit}
            // V2-D70 (2026-05-18) — Aurex/Fresha CTA: mobile full-width
            // 16px radius (was rounded-full pill), weight 700, mt-1 to lift
            // off the last row's divider. Desktop unchanged (rounded pill
            // on right). Brand green s-brand #3B7A57 still V2-D49j action color.
            className="font-body shrink-0 rounded-[16px] border-0 bg-s-brand py-4 px-5 text-base font-bold text-white transition-[colors,transform] duration-200 ease-glide hover:bg-s-brand-mid active:scale-[0.97] active:duration-[80ms] md:mt-0 md:rounded-full md:py-[10px] md:px-6 mt-1 tracking-[-0.01em]"
          >
            Solen durchsuchen
          </button>
        </motion.div>

        {/* EXPANDED LAYER — active segment's picker */}
        <motion.div
          initial={false}
          animate={{
            opacity: isExpanded ? 1 : 0,
            scale: isExpanded ? 1 : 1.05,
          }}
          transition={prefersReducedMotion ? instantTransition : { ...islandTransition, delay: isExpanded ? 0.1 : 0 }}
          className={cn(
            "absolute inset-0 flex flex-col",
            !isExpanded && "pointer-events-none",
          )}
        >
          {/* Header w segment tabs + close */}
          <div className="flex items-center justify-between gap-2 border-b border-black/5 px-5 py-4">
            <div className="flex gap-1">
              <SegmentTab
                active={active === "service"}
                onClick={() => setActive("service")}
                label={service || "Service"}
                isPlaceholder={!service}
              />
              <SegmentTab
                active={active === "stadt"}
                onClick={() => setActive("stadt")}
                label={stadt || "Stadt"}
                isPlaceholder={!stadt}
              />
              <SegmentTab
                active={active === "zeit"}
                onClick={() => setActive("zeit")}
                label={zeit || "Zeit"}
                isPlaceholder={!zeit}
              />
            </div>
            <button
              type="button"
              onClick={() => setActive(null)}
              aria-label="Schliessen"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-s-ink-3 transition-colors hover:bg-s-bg-sunken hover:text-s-ink"
            >
              <X size={18} />
            </button>
          </div>

          {/* Picker content — cross-fades when active segment changes */}
          <div className="flex-1 overflow-y-auto px-5 py-5">
            <AnimatePresence mode="wait" initial={false}>
              {active === "service" && (
                <motion.div
                  key="service"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                >
                  <input
                    type="text"
                    autoFocus
                    placeholder="Was suchst du?"
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    className="w-full border-b border-black/5 bg-transparent pb-3 font-display text-[24px] font-black text-s-ink placeholder:text-s-ink-3 focus:outline-none focus:border-s-brand"
                  />
                  <div className="mt-5 flex flex-wrap gap-2">
                    {SERVICES.map((s) => {
                      const Icon = s.icon;
                      const isPicked = service === s.label;
                      return (
                        <button
                          key={s.label}
                          type="button"
                          onClick={() => {
                            setService(s.label);
                            setActive("stadt");
                          }}
                          className={cn(
                            "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 font-body text-[14px] font-medium transition-colors",
                            isPicked
                              ? "border-s-brand bg-s-brand text-white"
                              : "border-s-ink/10 bg-white text-s-ink-2 hover:border-s-brand hover:text-s-brand",
                          )}
                        >
                          <Icon
                            size={14}
                            strokeWidth={2.25}
                            className={cn("shrink-0", !isPicked && "text-s-brand")}
                          />
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {active === "stadt" && (
                <motion.div
                  key="stadt"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                >
                  <input
                    type="text"
                    autoFocus
                    placeholder="Wo?"
                    value={stadt}
                    onChange={(e) => setStadt(e.target.value)}
                    className="w-full border-b border-black/5 bg-transparent pb-3 font-display text-[24px] font-black text-s-ink placeholder:text-s-ink-3 focus:outline-none focus:border-s-brand"
                  />

                  {/* V2-D49: primary "current location" row at the top of the
                      city picker. Stores the literal label as the value for now;
                      the actual lat/lng resolution is deferred until the search
                      results page reads it from the query string. */}
                  <button
                    type="button"
                    onClick={() => {
                      setStadt("Aktueller Standort");
                      setActive("zeit");
                    }}
                    className="mt-5 flex w-full items-center gap-3 rounded-2xl border border-s-brand/15 bg-s-brand-subtle px-4 py-3 transition-colors hover:bg-s-brand/[0.10]"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-s-brand text-white">
                      <Navigation size={16} strokeWidth={2.5} />
                    </span>
                    <span className="font-body font-semibold text-s-ink">
                      Aktueller Standort
                    </span>
                  </button>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {CITIES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setStadt(c);
                          setActive("zeit");
                        }}
                        className="rounded-full border border-s-ink/10 bg-white px-4 py-2 font-body text-[14px] font-medium text-s-ink-2 transition-colors hover:border-s-brand hover:text-s-brand"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {active === "zeit" && (
                <motion.div
                  key="zeit"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="font-display text-[24px] font-black text-s-ink mb-5">
                    Wann?
                  </div>

                  {/* V2-D49: real Calendar primitive (single-date variant) replaces
                      the loose Jetzt/Heute/Morgen chips. Reuses §F.5 DateTimePicker
                      so the homepage search and the booking flow share one Calendar
                      visual. `time: null` because the search bar only goes to period
                      granularity — exact slot picking happens on salon detail. */}
                  <DateTimePicker
                    variant="single-date"
                    value={{ date: zeitDate, time: null }}
                    onChange={({ date }) => setZeitDate(date)}
                  />

                  {/* Period-of-day chips — independent filter from the date.
                      Tapping the same chip twice clears it (toggle behavior). */}
                  <div className="mt-5">
                    <div className="font-body text-[13px] font-medium text-s-ink-3 mb-2">
                      Tageszeit
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {PERIODS.map((p) => {
                        const Icon = p.icon;
                        const isPicked = zeitPeriod === p.value;
                        return (
                          <button
                            key={p.value}
                            type="button"
                            onClick={() => {
                              setZeitPeriod(isPicked ? "" : p.value);
                            }}
                            className={cn(
                              "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 font-body text-[14px] font-medium transition-colors",
                              isPicked
                                ? "border-s-brand bg-s-brand text-white"
                                : "border-s-ink/10 bg-white text-s-ink-2 hover:border-s-brand hover:text-s-brand",
                            )}
                          >
                            <Icon
                              size={14}
                              strokeWidth={2.25}
                              className={cn("shrink-0", !isPicked && "text-s-brand")}
                            />
                            {p.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer w submit */}
          <div className="border-t border-black/5 p-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setService("");
                setStadt("");
                setZeitDate(null);
                setZeitPeriod("");
              }}
              className="font-body text-[14px] font-semibold text-s-ink-3 underline-offset-2 px-3 py-2 hover:text-s-ink transition-colors"
            >
              Zurücksetzen
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="font-body shrink-0 rounded-full border-0 bg-s-brand px-6 py-3 font-semibold text-white transition-colors hover:bg-s-brand-mid"
            >
              Suchen
            </button>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}

/**
 * Compact row for the collapsed state. Same visual as before — divider line +
 * icon + value. Click triggers expand.
 */
function CollapsedRow({
  icon,
  ariaLabel,
  value,
  isPlaceholder,
  isFirst,
  onClick,
}: {
  icon: React.ReactNode;
  ariaLabel: string;
  value: string;
  isPlaceholder: boolean;
  isFirst?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        "group relative flex shrink-0 cursor-pointer items-center text-left",
        // V2-D70 (2026-05-18) — Aurex/Fresha warm-minimal rows: NO individual
        // border / bg / radius on mobile. All rows share the same card surface;
        // hairline divider via `before:` pseudo-element between sibling rows
        // (positioned at top of each non-first row). Row padding 18px to match
        // mockup's "tactile but refined" feel. Desktop unchanged.
        "rounded-[16px] p-[18px_18px]",
        "transition-[background] duration-150 ease-glide",
        "hover:bg-s-ink/[0.025]",
        !isFirst && "max-md:before:content-[''] max-md:before:absolute max-md:before:top-0 max-md:before:left-[50px] max-md:before:right-[18px] max-md:before:h-px max-md:before:bg-s-ink/[0.06]",
        "md:flex-1 md:rounded-full md:p-[11px_22px] md:hover:bg-s-bg-sunken",
      )}
    >
      {/* V2-D70: icon column — drop right-border divider on mobile (clutters
          row, divider lives on the row itself now). Desktop keeps it for the
          horizontal segmented pill. */}
      <span className="flex shrink-0 items-center justify-center pr-3 text-s-ink-2 md:border-r md:border-black/10">
        {icon}
      </span>
      <span
        className={cn(
          // V2-D70: text-base + ink-2 secondary grey (was ink-2 warm; ink-2
          // now redefined to #6B7068 cool grey per spec). Weight 500 for
          // placeholder, 600 for picked value.
          "font-body min-w-0 flex-1 truncate text-[15px] text-s-ink-2 tracking-[-0.005em] md:pl-4",
          isPlaceholder ? "font-medium" : "font-semibold",
        )}
      >
        {value}
      </span>
    </button>
  );
}

/**
 * Header tab inside the expanded state. Switches active segment.
 */
function SegmentTab({
  active,
  onClick,
  label,
  isPlaceholder,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  isPlaceholder: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 font-body text-[13px] font-semibold transition-colors",
        active && "bg-s-brand text-white",
        !active && isPlaceholder && "text-s-ink-3 hover:text-s-ink",
        !active && !isPlaceholder && "text-s-ink hover:bg-s-bg-sunken",
      )}
    >
      {label}
    </button>
  );
}

// --- Icons ---
function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <circle cx={11} cy={11} r={7} />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
function IconPin() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <path d="M20 10c0 7-8 13-8 13s-8-6-8-13a8 8 0 0 1 16 0Z" />
      <circle cx={12} cy={10} r={3} />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <rect x={3} y={4} width={18} height={18} rx={2} />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
