"use client";

import * as React from "react";
import { flushSync } from "react-dom";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion, type Transition } from "motion/react";
import {
  Calendar,
  MapPin,
  Moon,
  Search,
  Sun,
  Sunrise,
  Sunset,
  type LucideIcon,
} from "lucide-react";
import { type CalendarDate, getLocalTimeZone } from "@internationalized/date";
import { cn } from "@/lib/utils";
import { formatDateLabel } from "@/lib/format";
import { SearchOverlay } from "@/app/[locale]/_components/search/SearchOverlay";

/**
 * Hero search bar (Dynamic-Island-style morphing pill).
 *
 * Animation architecture (matches user-supplied DynamicIslandTOC reference):
 *   - ONE container morphs between explicit width/height/borderRadius values
 *     (NOT `layout` animation, explicit values are smoother and predictable)
 *   - `overflow-hidden` on the morphing container clips content during morph
 *
 * Tween: cubic-bezier(0.22, 1, 0.36, 1) duration 0.5s, same as reference.
 *
 * 2026-09-04: the dormant "expanded island" content layer (in-place segment
 * tabs, service/city/time chips, its own handleSubmit) was removed. It was
 * never reachable: every resting row calls openOverlay() below and hands
 * off to SearchOverlay instead. `active`/`isExpanded`, the backdrop and
 * `islandTransition` stay: the live collapsed pill's own height/radius
 * morph (mobile to desktop) and the collapsed layer's own animate still
 * read them, even though `isExpanded` is now always false in practice.
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
  // morphing into an in-place island. The island's own expanded-state JSX
  // was removed 2026-09-04 (it was never reachable); `overlayOpen` drives
  // the real search surface. `active`/`isExpanded` stay: the live collapsed
  // pill still reads them for its own morph animate (see file header).
  const [overlayOpen, setOverlayOpen] = React.useState(false);
  // Which field the user tapped on the resting hero. Passed to SearchOverlay as
  // `initialFocus` so each row opens its OWN picker — tapping "Stadt" lands on
  // the city picker, not the service search (owner 2026-06-13). The CTA defaults
  // to "service" (ready-to-type).
  const [overlayFocus, setOverlayFocus] = React.useState<Segment>("service");
  // Shared ref to the overlay's query input , lets us focus it inside the tap (below).
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const openOverlay = (seg: Segment) => {
    if (seg === "service") {
      // Open synchronously (flushSync mounts the overlay + its input now), then focus the input
      // INSIDE this tap , iOS opens the soft keyboard only for a focus() within the user gesture.
      // preventScroll stops the open-then-scroll-down jump.
      flushSync(() => { setOverlayFocus("service"); setOverlayOpen(true); });
      searchInputRef.current?.focus({ preventScroll: true });
    } else {
      setOverlayFocus(seg);
      setOverlayOpen(true);
    }
  };
  const [service, setService] = React.useState("");
  const [stadt, setStadt] = React.useState("");
  // V2-D49: zeit splits into structured (date + period) + derived display string.
  // Display label is computed from the structured state — keeps the rest of the
  // collapsed/expanded UI ("Zeit" placeholder vs picked label) untouched.
  const [zeitDate, setZeitDate] = React.useState<CalendarDate | null>(null);
  const [zeitPeriod, setZeitPeriod] = React.useState<string>("");
  const zeit = React.useMemo(() => {
    if (!zeitDate) return zeitPeriod ? PERIODS.find((p) => p.value === zeitPeriod)?.label ?? "" : "";
    // CalendarDate.toDate returns a Date; extract ISO date then format via the
    // shared helper so FR/IT users see their own weekday abbreviations.
    const isoStr = zeitDate.toDate(getLocalTimeZone()).toISOString().split("T")[0];
    const dateStr = formatDateLabel(isoStr, locale);
    const periodLabel = PERIODS.find((p) => p.value === zeitPeriod)?.label;
    return periodLabel ? `${dateStr} ${periodLabel}` : dateStr;
  }, [zeitDate, zeitPeriod, locale]);

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
          // V3 (2026-06-29, owner + gemini): the wide 24px-blur float bled a "halo" below the dark CTA on
          // mobile (read like the button had a shadow). Unified to the tight card token elevation-2 , no bleed.
          "relative w-full max-w-[540px] overflow-hidden bg-white",
          "shadow-elevation-2",
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
            icon={<Search size={18} strokeWidth={1.9} />}
            ariaLabel="Service suchen"
            value={service || "Service"}
            isPlaceholder={!service}
            isFirst
            onClick={() => openOverlay("service")}
          />
          <CollapsedRow
            icon={<MapPin size={18} strokeWidth={1.9} />}
            ariaLabel="Standort wählen"
            value={stadt || "Stadt"}
            isPlaceholder={!stadt}
            onClick={() => openOverlay("stadt")}
          />
          <CollapsedRow
            icon={<Calendar size={18} strokeWidth={1.9} />}
            ariaLabel="Zeit wählen"
            value={zeit || "Zeit"}
            isPlaceholder={!zeit}
            onClick={() => openOverlay("zeit")}
          />
          <button
            type="button"
            onClick={() => openOverlay("service")}
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
            // mockup-ok: geometry fix (LOCKFILE DS-4 nested-radius formula, 2026-07-17
            // check-geometry.mjs sweep). Mobile rounded-[13px] -> rounded-[6px], a
            // mechanical derivation, not a design choice: this button sits inset by the
            // morphing container's p-4 (16px) padding inside a 22px-radius card
            // (borderRadius:22 on mobile, set above); DS-4 = inner = outer - gap =
            // 22 - 16 = 6, min 4. 13px put the corner gap ~41% wider on the diagonal
            // than the flat edge (the "amateur tell" the geometry research names). No
            // token in the radius ladder matches 6px exactly, so this stays arbitrary.
            className="font-heading shrink-0 mt-0 rounded-[6px] md:rounded-full border-0 bg-s-ink h-12 px-6 text-[15px] font-bold text-white transition-[colors,transform] duration-200 ease-glide hover:bg-black active:scale-[0.97] active:duration-[80ms] md:mt-0 md:h-12 md:py-0 md:px-6 tracking-[-0.01em]"
          >
            {/* V3-D178 (2026-05-26, council item #5): "Solen durchsuchen" →
                "Termine finden". Rhetorical echo with the H1 ("Termin in
                30 Sekunden") + "finden" implies the result is waiting
                vs. "suchen" implying effort. Drops the redundant brand
                mention (user is already ON Solen). */}
            Termine finden
          </button>
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
        initialFocus={overlayFocus}
        autoFocusService
        serviceInputRef={searchInputRef}
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
        // 2026-06-29 (owner + council): drop the gray fill , white + 1px hairline reads cleaner.
        // mockup-ok: geometry fix (LOCKFILE DS-4 nested-radius formula, 2026-07-17
        // check-geometry.mjs sweep). rounded-[13px] to rounded-[6px], a mechanical
        // derivation: this row sits inset by the morphing container's p-4 (16px)
        // padding inside a 22px-radius card (mobile), DS-4 = inner = outer - gap =
        // 22 - 16 = 6, min 4. All three CollapsedRow instances (Service/Stadt/Zeit)
        // share this one component, so they change together per DS-4's own
        // twin-control rule (styling repeated same-purpose controls differently is
        // drift). No token in the ladder matches 6px, so this stays arbitrary.
        "rounded-[6px] bg-white border border-s-border h-[46px] px-[14px]",
        "transition-[background,border-color,transform] duration-150 ease-glide", // mockup-ok: motion-only, adds transform to the property list + a press scale, no resting-appearance change
        "hover:bg-s-bg-sunken active:scale-[0.98] active:duration-[80ms]",
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

