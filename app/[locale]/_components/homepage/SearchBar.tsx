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
import { SearchOverlay } from "@/app/[locale]/_components/search/SearchOverlay";

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
// architecture: rows flush-stacked w hairline divider.
// V3-D89 (2026-05-20): mobile collapsed bumped 280 → 320 for Fresha-exact
// row STRUCTURE: outlined pills with gap-3 between, taller button.
// V3-D90 (2026-05-21): exact pixel-measured Fresha spec applied.
// V3-D91-fu (2026-05-21): HEIGHT bumped 260 → 280 to give the submit
// button proper bottom padding inside the card. Math: pt-4 (16) +
// 3×h-12 (48×3=144) + 2×gap-3 (12×2=24) + mt-4 above button (16) +
// h-12 button (48) + pb-4 (16) = 264. Round up to 280 for safety
// margin (overflow-hidden clips at exact 260, leaving the button
// pressed against the card bottom — that's the overlap user kept
// flagging).
// V3-D125 (2026-05-24): HEIGHT bumped 280 → 308 after h-12 → h-14 input
// shape change (Fresha rounded-square inputs).
// V3-D131 (2026-05-24): button shrunk h-14 → h-12 per user "too big",
// container shrunk 284 → 264 = Fresha-exact card height (measured).
// New math: pt-4 (16) + 3×h-12 (144) + 3×gap-3 (36, flex applies gap
// between input3 and button too) + mt-4 (16) + h-12 button (48) +
// pb-4 (16) = 276 content needed.
// V3-D144 (2026-05-25): mobile collapsed 264 → 280 per user "ths button is
// too low or idfk but its not correct". Measured: at 264 the CTA bottom
// sat only 3px above the card's rounded-3xl corner — visually jammed
// against the bottom. At 280, CTA gets ~19px breathing room below,
// symmetric with the 16px pt-4 above. Sacrifices Fresha-exact card height
// for breathing room — visual hierarchy wins over reference-matching.
const HEIGHT = {
  mobile:  { collapsed: 250, expanded: 600 },
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
  const params = useParams<{ locale: string }>()!;
  const locale = params?.locale ?? "de";

  const [active, setActive] = React.useState<Segment | null>(null);
  // V2-D51 Path C (completed): the resting hero pill now opens the full-page
  // SearchOverlay (search is full-page everywhere, like Fresha) instead of
  // morphing into the in-place island. The island JSX below is kept dormant
  // (never re-triggered from the resting rows) so nothing that referenced it
  // breaks; `overlayOpen` drives the real search surface.
  const [overlayOpen, setOverlayOpen] = React.useState(false);
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
          borderRadius: !isExpanded && isDesktop ? 999 : 22,
        }}
        transition={transition}
        className={cn(
          // V3-D72 (2026-05-18) — unified Aurex floating shadow with cards
          // per user "apply a soft, wide shadow to ALL your white cards" —
          // single value across SearchBar + SalonCard for visual consistency.
          // `0px 6px 24px rgba(0, 0, 0, 0.06)` + no visible border. Was V2-D71's
          // slightly different `0 8px 24px 0.06` — now matches cards exactly.
          "relative w-full max-w-[540px] overflow-hidden bg-white",
          "shadow-[0_18px_44px_-12px_rgba(0,0,0,0.13),0_4px_12px_-6px_rgba(0,0,0,0.07)]",
          "max-md:mx-auto",
          isExpanded && "z-[70] md:max-w-[640px]",
          // V3-D228 (2026-05-27, desktop placement fix): cap collapsed-state
          // width at 820px and FORCE collapsed height + radius via Tailwind
          // !important. Framer's animate prop computes from React state
          // (isDesktop), but on initial render state=false and motion's
          // initial={false} captures the mobile values (h=280, br=11) into
          // inline style — even after isDesktop flips, the inline style
          // sticks. `md:!h-[60px] md:!rounded-full` beats inline style and
          // gives the proper desktop horizontal pill. Mobile max-w-[540px]
          // above unchanged.
          !isExpanded && "md:max-w-[820px] md:mx-auto md:!h-[60px] md:!rounded-full",
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
            // V3-D90-fu (2026-05-21): pixel-spec-auto measurements applied —
            // padding 16 CSS all sides (p-4), gap-3 (12 CSS) between rows.
            // Desktop unchanged.
            // V3-D130 (2026-05-24): REVERTED p-3 → p-4 (12 → 16 CSS). The
            // p-3 was over-shrink; Fresha's actual internal padding is 16 CSS.
            // Inputs were too tight against card edge.
            "absolute inset-0 flex flex-col p-4 gap-[10px] md:gap-0 md:p-[5px_5px_5px_7px] md:flex-row md:items-stretch",
            isExpanded && "pointer-events-none",
          )}
        >
          <CollapsedRow
            icon={<IconSearch />}
            ariaLabel="Service suchen"
            value={service || "Service"}
            isPlaceholder={!service}
            isFirst
            onClick={() => setOverlayOpen(true)}
          />
          <CollapsedRow
            icon={<IconPin />}
            ariaLabel="Standort wählen"
            value={stadt || "Stadt"}
            isPlaceholder={!stadt}
            onClick={() => setOverlayOpen(true)}
          />
          <CollapsedRow
            icon={<IconCalendar />}
            ariaLabel="Zeit wählen"
            value={zeit || "Zeit"}
            isPlaceholder={!zeit}
            onClick={() => setOverlayOpen(true)}
          />
          <button
            type="button"
            onClick={() => setOverlayOpen(true)}
            // V3-D111 (2026-05-23): swapped bg-black → bg-s-ink so the
            // hero CTA matches the top banner exactly (both #054F31 Fruitful
            // green-900). User flagged that the CTA read darker than the banner
            // strip → root cause was V3-D110 using `s-brand-deep` which after the
            // V3-D107 Fruitful swap maps to green-1200 #173E26 (darkest forest)
            // instead of the brand's primary green-900. Hover now bumps to
            // bg-black (green-800 #0B7443), one step deeper in family —
            // replacing a stale hardcoded navy hex left over from when
            // `s-brand-deep` was the old #142F4A navy (pre-V3-D107).
            // V3-D131 (2026-05-24): button h-14 → h-12 (56 → 48 CSS — match
            // input height, per user "button too big makes card height too
            // big"). mt-5 → mt-4 (20 → 16 CSS — tighter button gap). Keep
            // text-[15px] for input-button consistency.
            // V3-D146 (2026-05-25): bg-s-ink (green) → bg-s-ink (black/ink)
            // per Phase 1 of B&W palette pivot. Hover deeper-than-default ink.
            // Phase 2 sweep will catch all other s-brand CTAs across the app.
            // V3-D192-fix (2026-05-26): primary CTA REVERTED to bg-s-ink per user
            // "no accent color not primary bro." Royal blue is the ACCENT (small
            // highlight moments — eyebrows, bullets, badges), NOT the primary
            // action surface. Primary CTAs stay ink for chrome neutrality.
            // V3-D228 (2026-05-27, desktop placement fix): md:h-auto was
            // making the CTA inherit parent height, growing into a tall
            // ellipse on wide search bars. Fixed at md:h-12 (matches mobile
            // 48px). Removes the "giant oval" symptom.
            // V3-D347 (2026-05-28): mt-4 -> mt-0. On mobile the stacked container
            // is `flex flex-col gap-3` (12px between every field). The button's
            // extra mt-4 (16px) stacked on the 12px gap = 28px, so the CTA sat
            // unbalanced/low vs the even 12px input rhythm. mt-0 lets the gap-3
            // carry it = uniform 12px. Desktop unchanged (md:mt-0 already set).
            className="font-heading shrink-0 mt-0 rounded-[13px] md:rounded-full border-0 bg-s-ink h-12 px-6 text-[15px] font-bold text-white shadow-[0_10px_22px_-8px_rgba(10,10,10,0.7)] transition-[colors,transform] duration-200 ease-glide hover:bg-black active:scale-[0.97] active:duration-[80ms] md:mt-0 md:h-12 md:py-0 md:px-6 tracking-[-0.01em]"
          >
            {/* V3-D178 (2026-05-26, council item #5): "Solen durchsuchen" →
                "Termine finden". Rhetorical echo with the H1 ("Termin in
                30 Sekunden") + "finden" implies the result is waiting
                vs. "suchen" implying effort. Drops the redundant brand
                mention (user is already ON Solen). */}
            Termine finden
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
          <div className="flex items-center justify-between gap-2 border-b border-s-border px-5 py-4">
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
                    className="w-full border-b border-s-border bg-transparent pb-3 font-display text-[22px] font-bold text-s-ink placeholder:text-s-ink-3 focus:outline-none focus-visible:border-s-border focus-visible:shadow-none"
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
                              ? "border-s-ink bg-s-ink text-white"
                              : "border-s-border bg-white text-s-ink-2 hover:border-s-ink hover:text-s-ink",
                          )}
                        >
                          <Icon
                            size={14}
                            strokeWidth={2.25}
                            className={cn("shrink-0", !isPicked && "text-s-ink")}
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
                    className="w-full border-b border-s-border bg-transparent pb-3 font-display text-[22px] font-bold text-s-ink placeholder:text-s-ink-3 focus:outline-none focus-visible:border-s-border focus-visible:shadow-none"
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
                    className="mt-5 flex w-full items-center gap-3 rounded-2xl border border-s-border bg-white px-4 py-3 transition-colors hover:bg-s-bg-sunken"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-s-ink text-white">
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
                        className="rounded-full border border-s-border bg-white px-4 py-2 font-body text-[14px] font-medium text-s-ink-2 transition-colors hover:border-s-ink hover:text-s-ink"
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
                  <div className="font-display text-[22px] font-bold text-s-ink mb-5">
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
                                ? "border-s-ink bg-s-ink text-white"
                                : "border-s-border bg-white text-s-ink-2 hover:border-s-ink hover:text-s-ink",
                            )}
                          >
                            <Icon
                              size={14}
                              strokeWidth={2.25}
                              className={cn("shrink-0", !isPicked && "text-s-ink")}
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
          <div className="border-t border-s-border p-3 flex items-center justify-between">
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
              // V3-D192-fix: expanded picker CTA also reverted to ink (same logic
              // as primary CTA — accent ≠ primary action surface).
              className="font-body shrink-0 rounded-full border-0 bg-s-ink px-6 py-3 font-semibold text-white transition-colors hover:bg-black"
            >
              Suchen
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* V2-D51 Path C: the full-page search surface. Opened by tapping any
          resting row / the CTA above. Seeds the current city so the sticky
          composer continues an in-progress query. */}
      <SearchOverlay
        open={overlayOpen}
        onClose={() => setOverlayOpen(false)}
        locale={locale}
        initialService={service}
        initialCity={stadt}
      />
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
        // V3-D90 (2026-05-21): Fresha pixel-exact — 1px hairline border
        // #D3D3D3 (exact RGB sampled).
        // V3-D125 (2026-05-24): pill → rounded-square per user reference.
        // V3-D129 (2026-05-24): h-14 (56) → h-12 (48) — measured Fresha
        // input height is 47 CSS px, not 56. My h-14 bump over-shot Fresha
        // by 9px. Reverted to h-12 (~Fresha-exact 48px). px-5 + rounded-2xl
        // stay (those measurements were correct).
        // Depth system (2026-06-09): filled-gray field (Apple pattern), no hairline border.
        "rounded-[13px] bg-s-bg-sunken border border-transparent h-[46px] px-[14px]",
        "transition-[background,border-color] duration-150 ease-glide",
        "hover:bg-s-bg-active",
        "md:flex-1 md:rounded-full md:border-0 md:p-[11px_22px] md:hover:bg-s-bg-sunken",
      )}
    >
      {/* V3-D90 (2026-05-21): icon-to-text gap pr-3 (12 CSS) per Fresha spec.
          Desktop keeps inline divider for the horizontal segmented pill. */}
      <span className="flex shrink-0 items-center justify-center pr-3 text-s-ink-2 md:border-r md:border-s-border">
        {icon}
      </span>
      <span
        className={cn(
          "font-body min-w-0 flex-1 truncate text-[14px] text-s-ink-2 tracking-[-0.005em] md:pl-4",
          isPlaceholder ? "font-normal" : "font-semibold",
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
        active && "bg-s-ink text-white",
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
