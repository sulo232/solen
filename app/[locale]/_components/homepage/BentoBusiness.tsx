"use client";

import * as React from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import { ArrowRight, Check, ChevronRight, Star } from "lucide-react";
import {
  MorphingDialog,
  MorphingDialogClose,
  MorphingDialogContainer,
  MorphingDialogContent,
  MorphingDialogDescription,
  MorphingDialogSubtitle,
  MorphingDialogTitle,
  MorphingDialogTrigger,
} from "@/components/core/morphing-dialog";
import { Typewriter } from "@/components/ui/typewriter";
import { cn } from "@/lib/utils";

/**
 * BentoBusiness — V3-D75-bento (2026-05-18).
 *
 * SUPERSEDES the V2-D70 SalonRegister "Solen für dein Geschäft" section
 * (`WhySolen.tsx`). New format: Apple-style 4-card bento grid. Asymmetric
 * 3-column layout — 2 large cards (col-span-2) + 2 small cards, arranged
 * diagonally for editorial rhythm.
 *
 * Each card has THREE layers of interaction:
 *   1. Scroll-triggered fade-up entry (whileInView, once: true)
 *   2. Desktop cursor-following 3D tilt (max ±6°, springs back on leave)
 *   3. Internal animated visual (pulse dot / growing bars / etc.)
 *
 * Backend wiring deferred — visuals are illustrative, copy is final.
 *
 * Audience: B2B salon owners. Replaces the dashboard-mockup-right-side layout
 * with a more confident "here are the 4 things we do for you" pitch.
 */

interface BentoCardProps {
  title: string;
  description: string;
  visual: React.ReactNode;
  className?: string;
}

function BentoCard({ title, description, visual, className }: BentoCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-100, 100], [6, -6]), {
    damping: 30,
    stiffness: 200,
  });
  const rotateY = useSpring(useTransform(x, [-100, 100], [-6, 6]), {
    damping: 30,
    stiffness: 200,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        transformPerspective: 1200,
      }}
      className={cn(
        "group relative overflow-hidden rounded-[24px] bg-white",
        "shadow-[0_20px_40px_rgba(0,0,0,0.04)]",
        "transition-shadow duration-300 ease-out",
        "hover:shadow-[0_30px_60px_rgba(0,0,0,0.06)]",
        "min-h-[280px] md:min-h-[320px]",
        className,
      )}
    >
      <div
        className="relative z-[1] flex h-full flex-col p-6 md:p-7"
        style={{ transform: "translateZ(20px)" }}
      >
        {/* Visual area — flex-1 so the card height drives the visual */}
        <div className="relative mb-6 flex-1">{visual}</div>
        {/* Copy area */}
        <div>
          <h3 className="font-display text-[20px] font-bold leading-tight tracking-[-0.02em] text-s-ink md:text-[22px]">
            {title}
          </h3>
          <p className="mt-2 font-body text-[14px] leading-[1.5] text-s-ink-2">
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Card visuals ─── */

function VisualBooking() {
  return (
    <div className="relative grid h-full w-full place-items-center">
      {/* V3-D78 glow halo behind popup — gives glassmorphism something
          to blur (without it, white-on-white card looks the same as solid). */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-36 w-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(55% 50% at 50% 50%, rgba(31,80,55,0.22) 0%, rgba(224,112,61,0.12) 55%, transparent 85%)",
        }}
      />
      <div
        className="relative w-[200px] rounded-[18px] border border-white/55 bg-white/55 p-5 backdrop-blur-xl backdrop-saturate-150"
        style={{ boxShadow: "0 12px 32px rgba(0,0,0,0.10)" }}
      >
        <div className="mb-3 flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-s-brand text-white">
            <Check size={16} strokeWidth={2.5} aria-hidden />
          </div>
          <div className="flex-1">
            <div className="text-[12px] font-bold leading-tight text-s-ink">
              Lara K.
            </div>
            <div className="text-[10px] text-s-ink-3">
              Schnitt + Föhn · 14:00
            </div>
          </div>
        </div>
        <div className="rounded-full bg-s-brand py-1.5 text-center font-body text-[11px] font-bold text-white">
          Bestätigt · 23 Sek.
        </div>
        {/* Animated ping dot */}
        <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-s-brand/40" />
          <span className="relative h-3 w-3 rounded-full bg-s-brand" />
        </span>
      </div>
    </div>
  );
}

/**
 * VisualCustomerDM — V3-D75-dm (2026-05-18).
 *
 * Instagram-DM-style chat preview for the "Direkt-Chat mit Kund:innen"
 * card. Shows a back-and-forth conversation: customer asks (left bubble,
 * neutral), salon replies (right bubble, brand emerald, typewriter cycles
 * through stock replies), customer types back (3-dot pulsing indicator).
 *
 * Communicates the upcoming Phase-2 DM feature (`/api/messages/...`)
 * without needing a real chat backend.
 */
const SALON_REPLIES = [
  "Klar — 14:00 ist frei ✓",
  "Heute 17:30 noch offen",
  "Komm gern vorbei!",
  "Sicher — bestätigt 🙏",
];

function VisualCustomerDM() {
  return (
    <div className="relative grid h-full w-full place-items-center">
      <div className="w-full max-w-[260px] space-y-2">
        {/* ── Customer message (left, neutral grey) ── */}
        <div className="flex justify-start">
          <div className="max-w-[80%] rounded-[16px] rounded-bl-[4px] bg-s-bg-sunken px-3 py-2">
            <p className="font-body text-[12px] leading-snug text-s-ink">
              Habt ihr Mo 14:00 noch frei?
            </p>
          </div>
        </div>

        {/* ── Salon reply (right, charcoal-ink — neutral "sent message"
            visual distinct from the grey customer bubble without spending
            brand emerald on something that isn't a click target). ── */}
        <div className="flex justify-end">
          <div className="max-w-[80%] rounded-[16px] rounded-br-[4px] bg-s-ink px-3 py-2 text-white">
            <p className="font-body text-[12px] leading-snug">
              <Typewriter
                texts={SALON_REPLIES}
                delay={45}
                deleteDelay={20}
                pauseBetween={2200}
                caretClassName="bg-white"
              />
            </p>
          </div>
        </div>

        {/* ── Customer typing-back indicator (3 pulsing dots) ── */}
        <div className="flex justify-start pt-1">
          <div className="rounded-[14px] rounded-bl-[4px] bg-s-bg-sunken px-3 py-2.5">
            <div className="flex items-center gap-1" aria-label="Kund:in tippt">
              <span
                className="block h-1.5 w-1.5 animate-pulse rounded-full bg-s-ink-3"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="block h-1.5 w-1.5 animate-pulse rounded-full bg-s-ink-3"
                style={{ animationDelay: "200ms" }}
              />
              <span
                className="block h-1.5 w-1.5 animate-pulse rounded-full bg-s-ink-3"
                style={{ animationDelay: "400ms" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VisualCalendar() {
  const slots = [
    { name: "Lara", color: "#E5F2EA" },
    { name: "Marc", color: "#FFE8D8" },
    { name: null, color: "transparent" },
    { name: "Anna", color: "#D4DDC8" },
    { name: "Sara", color: "#FFE8D8" },
    { name: null, color: "transparent" },
    { name: "Eva", color: "#EAE0D0" },
    { name: "Niklas", color: "#FFE8D8" },
    { name: "Sophie", color: "#D4DDC8" },
    { name: null, color: "transparent" },
    { name: "David", color: "#E5F2EA" },
    { name: null, color: "transparent" },
    { name: "Lena", color: "#FFF1C2" },
    { name: "Anna", color: "#EAE0D0" },
    { name: "Mira", color: "#E5F2EA" },
  ];
  return (
    <div className="relative grid h-full w-full place-items-center">
      <div className="grid w-full max-w-[240px] grid-cols-5 gap-1">
        {slots.map((slot, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.35,
              delay: i * 0.035,
              ease: [0.22, 1, 0.36, 1],
            }}
            className={cn(
              "flex h-8 items-center justify-center rounded-md text-[8.5px] font-bold",
              slot.name
                ? "text-s-ink"
                : "border border-dashed border-s-ink/10",
            )}
            style={{ background: slot.color }}
          >
            {slot.name}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/**
 * VisualAnalyticsTabbed — V3-D75-tabs (2026-05-18).
 *
 * Apple-style tab-switcher visual for the Analytics bento card. 4 metric
 * tabs at the bottom (Buchungen / Umsatz / Kund:innen / Sterne). Active
 * tab gets emerald pill bg; others are quiet on s-bg-sunken. Tapping a
 * tab swaps the chart with AnimatePresence crossfade + bars growing from
 * 0 → target height per the new dataset. Reference pattern: pill-tab
 * switcher cards (Tab-Switcher UI 2025).
 *
 * Tab data per metric — kept inline (mockup). Backend later wires:
 *   - GET /api/business/analytics?range=7d  → returns buchungen/umsatz/etc.
 */
/** V3-D78 (2026-05-19): Stripe-style line chart in light mode.
 *  Replaces the bar chart with a smoothed cubic curve, area fill, and a
 *  dotted reference line for the prior period. Right-edge labels brand
 *  the two series (Diese / Letzte). Three tabs (J / M / W) swap the dataset
 *  with AnimatePresence crossfade.
 *
 *  Coordinate system: SVG viewBox 0..100 x 0..60. Data Y is INVERTED
 *  (higher value → lower Y), so peaks are visually high. */
type AnalyticsPeriodId = "jahr" | "monat" | "woche";
interface AnalyticsPeriod {
  id: AnalyticsPeriodId;
  label: string;
  countLabel: string;
  count: string;
  revenue: string;
  trend: string;
  trendNote: string;
  labels: string[]; // x-axis ticks
  current: number[]; // 0..60 Y values per x position (inverted: low = high)
  previous: number[];
}

const ANALYTICS_PERIODS: AnalyticsPeriod[] = [
  {
    // Story: Jan-Feb quiet, ramp through spring, peak in MAI, summer dip.
    // current[] = bar HEIGHTS in percent (0..100). Higher number = taller bar.
    id: "jahr",
    label: "Jahr",
    countLabel: "Buchungen",
    count: "1'842",
    revenue: "CHF 172'380",
    trend: "+22%",
    trendNote: "YoY",
    labels: ["JAN", "FEB", "MAR", "APR", "MAI", "JUN", "JUL"],
    current:  [25, 35, 50, 65, 95, 80, 70],
    previous: [],
  },
  {
    // Story: clean monotonic build-up over 4 weeks.
    id: "monat",
    label: "Monat",
    countLabel: "Buchungen",
    count: "186",
    revenue: "CHF 18'420",
    trend: "+12%",
    trendNote: "vs. Monat",
    labels: ["W1", "W2", "W3", "W4"],
    current:  [40, 60, 75, 95],
    previous: [],
  },
  {
    // Story: ramp Mo → Sa peak, Sunday quiet (typical salon week).
    id: "woche",
    label: "Woche",
    countLabel: "Buchungen",
    count: "47",
    revenue: "CHF 4'280",
    trend: "+18%",
    trendNote: "vs. Woche",
    labels: ["MO", "DI", "MI", "DO", "FR", "SA", "SO"],
    current:  [32, 48, 55, 70, 78, 95, 50],
    previous: [],
  },
];

/** V3-D78 (2026-05-19): iOS-Wallet-style bar gradient.
 *  Vivid purple top → coral middle → orange-amber bottom. Each bar shows
 *  the same color story — consistent identity across the row, height alone
 *  signals the peak. Rounded tops give the soft-popsicle silhouette. */
const BAR_GRADIENT =
  "linear-gradient(180deg, #C084FC 0%, #FBA4B3 50%, #FB923C 100%)";

/** Catmull-Rom-to-cubic-bezier smoothing. Returns an SVG path `d` string. */
function smoothPath(yValues: number[]): string {
  const n = yValues.length;
  if (n < 2) return "";
  const pts: [number, number][] = yValues.map((y, i) => [(i / (n - 1)) * 100, y]);
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

function VisualAnalyticsTabbed() {
  const [activeId, setActiveId] = React.useState<AnalyticsPeriodId>("woche");
  const active = ANALYTICS_PERIODS.find((p) => p.id === activeId) ?? ANALYTICS_PERIODS[2];

  return (
    <div className="relative flex h-full w-full flex-col">
      {/* ── Top: stats + tabs ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-display text-[26px] font-extrabold leading-none tracking-[-0.02em] text-s-ink md:text-[28px]">
            {active.count}
          </div>
          <div className="mt-1 font-body text-[9.5px] font-bold uppercase tracking-[0.12em] text-s-ink-3">
            {active.countLabel}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-[18px] font-bold leading-none tracking-[-0.01em] text-s-ink md:text-[19px]">
            {active.revenue}
          </div>
          <div className="mt-1.5 flex items-center gap-1 font-body text-[9.5px] font-bold uppercase tracking-[0.12em] text-s-ink-3">
            <span className="inline-flex items-center gap-0.5 text-s-brand">
              <ArrowRight size={10} className="rotate-[-45deg]" aria-hidden />
              {active.trend}
            </span>
            <span className="truncate">{active.trendNote}</span>
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          {ANALYTICS_PERIODS.map((p) => {
            const isActive = p.id === activeId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveId(p.id);
                }}
                aria-pressed={isActive}
                className={cn(
                  "grid h-7 w-7 place-items-center rounded-full border font-body text-[10px] font-extrabold uppercase tracking-wider transition-colors duration-200 ease-glide",
                  isActive
                    ? "border-s-brand text-s-brand bg-s-brand/[0.06]"
                    : "border-s-ink/15 text-s-ink-3 hover:border-s-ink/30",
                  "focus-visible:outline-2 focus-visible:outline-s-brand focus-visible:outline-offset-2",
                )}
              >
                {p.label.charAt(0)}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Chart: vivid gradient bars (iOS-Wallet style) ── */}
      <div className="relative mt-4 flex-1 min-h-[130px]">
        {/* Subtle horizontal grid lines */}
        <div aria-hidden className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-px w-full bg-s-ink/[0.05]" />
          ))}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-end gap-1.5 md:gap-2"
          >
            {active.current.map((h, i) => (
              <motion.div
                key={`bar-${activeId}-${i}`}
                initial={{ height: "0%" }}
                animate={{ height: `${h}%` }}
                transition={{
                  duration: 0.7,
                  delay: i * 0.06,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="flex-1 rounded-t-[6px]"
                style={{
                  background: BAR_GRADIENT,
                  boxShadow: "0 4px 12px rgba(192, 132, 252, 0.18)",
                }}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── X-axis labels ── */}
      <div className="mt-1.5 flex justify-between font-body text-[9px] font-bold uppercase tracking-[0.1em] text-s-ink-3">
        {active.labels.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
    </div>
  );
}

/* ─── JoinUsCard — full-width 5th card with expand-to-form ─── */

function JoinUsCard() {
  // V3-D75-morph (2026-05-18): refactored from custom position-swap modal
  // to MorphingDialog primitive. Old version stuttered because
  // `position: relative` → `position: fixed` swap forced a layout-tree change
  // mid-animation. Morphing-dialog uses `layoutId` shared between trigger
  // (in normal flow) and content (in a portal), so motion morphs a single
  // conceptual element across the layout boundary smoothly.
  return (
    <MorphingDialog
      transition={{ type: "spring", bounce: 0.05, duration: 0.4 }}
    >
      {/* ── Trigger (collapsed state — sits in the bento grid) ── */}
      <MorphingDialogTrigger
        style={{ borderRadius: "24px" }}
        className="md:col-span-3 overflow-hidden bg-s-brand text-white"
      >
        <div className="p-8 md:p-12">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <span
                className="inline-flex items-center gap-2 font-body text-[12px] font-bold uppercase text-white/80"
                style={{ letterSpacing: "0.18em" }}
              >
                <span
                  aria-hidden
                  style={{
                    display: "inline-block",
                    width: "5px",
                    height: "5px",
                    borderRadius: "9999px",
                    background: "#F2D77B",
                  }}
                />
                Bereit dazuzukommen?
              </span>
              <MorphingDialogTitle
                className="mt-4 font-display font-extrabold text-white"
                style={{
                  fontSize: "clamp(28px, 4vw, 48px)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.025em",
                }}
              >
                Werde Solen-Partner.
              </MorphingDialogTitle>
              <MorphingDialogSubtitle className="mt-4 max-w-[480px] font-body text-[15px] leading-[1.55] text-white/85 md:text-[17px]">
                Über 1&apos;200 Salons buchen schon mit Solen. Trag dich in 60
                Sekunden ein — wir melden uns innerhalb von 24 Stunden.
              </MorphingDialogSubtitle>
            </div>
            <div
              aria-hidden
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-s-brand"
              style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.10)" }}
            >
              <ChevronRight size={22} strokeWidth={2.5} aria-hidden />
            </div>
          </div>
          {/* Trust line — only in trigger */}
          <div className="mt-8 flex items-center gap-3 text-white/85">
            <span
              className="font-display font-extrabold leading-none"
              style={{ fontSize: "18px", letterSpacing: "-0.01em" }}
            >
              4.9 / 5
            </span>
            <span
              aria-hidden
              style={{
                color: "#F2D77B",
                fontSize: "14px",
                letterSpacing: "0.06em",
              }}
            >
              ★★★★★
            </span>
            <span className="font-body text-[13px] text-white/70">
              · von 1&apos;200+ Salon-Partnern
            </span>
          </div>
        </div>
      </MorphingDialogTrigger>

      {/* ── Container (portal + backdrop) ── */}
      <MorphingDialogContainer>
        {/* ── Content (expanded modal — morphs from trigger via shared layoutId) ── */}
        <MorphingDialogContent
          style={{ borderRadius: "24px" }}
          className="relative max-h-[90vh] w-full max-w-[640px] overflow-y-auto bg-s-brand text-white"
        >
          <div className="p-8 md:p-12">
            <div className="flex items-start justify-between gap-6 pr-12">
              <div className="flex-1">
                <span
                  className="inline-flex items-center gap-2 font-body text-[12px] font-bold uppercase text-white/80"
                  style={{ letterSpacing: "0.18em" }}
                >
                  <span
                    aria-hidden
                    style={{
                      display: "inline-block",
                      width: "5px",
                      height: "5px",
                      borderRadius: "9999px",
                      background: "#F2D77B",
                    }}
                  />
                  Bereit dazuzukommen?
                </span>
                <MorphingDialogTitle
                  className="mt-4 font-display font-extrabold text-white"
                  style={{
                    fontSize: "clamp(28px, 4vw, 48px)",
                    lineHeight: 1.05,
                    letterSpacing: "-0.025em",
                  }}
                >
                  Werde Solen-Partner.
                </MorphingDialogTitle>
                <MorphingDialogSubtitle className="mt-4 max-w-[480px] font-body text-[15px] leading-[1.55] text-white/85 md:text-[17px]">
                  Über 1&apos;200 Salons buchen schon mit Solen. Trag dich in
                  60 Sekunden ein — wir melden uns innerhalb von 24 Stunden.
                </MorphingDialogSubtitle>
              </div>
            </div>

            {/* Description (form) — disableLayoutAnimation: it shouldn't morph
                from the trigger (no equivalent there), just fade-in fresh. */}
            <MorphingDialogDescription
              disableLayoutAnimation
              variants={{
                initial: { opacity: 0, y: 16 },
                animate: { opacity: 1, y: 0 },
                exit: { opacity: 0, y: 8 },
              }}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  alert(
                    "Anmeldung erfasst (Mockup). Backend wiring deferred — wir melden uns sobald die API live ist.",
                  );
                }}
                className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4"
              >
                <input
                  type="text"
                  name="name"
                  placeholder="Dein Name"
                  required
                  className="rounded-[12px] bg-white px-4 font-body text-[15px] text-s-ink placeholder:text-s-ink-3 outline-none transition-shadow focus:shadow-[0_0_0_3px_rgba(255,255,255,0.4)]"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="E-Mail"
                  required
                  className="rounded-[12px] bg-white px-4 font-body text-[15px] text-s-ink placeholder:text-s-ink-3 outline-none transition-shadow focus:shadow-[0_0_0_3px_rgba(255,255,255,0.4)]"
                />
                <input
                  type="text"
                  name="salon"
                  placeholder="Salon-Name"
                  required
                  className="rounded-[12px] bg-white px-4 font-body text-[15px] text-s-ink placeholder:text-s-ink-3 outline-none transition-shadow focus:shadow-[0_0_0_3px_rgba(255,255,255,0.4)]"
                />
                <input
                  type="text"
                  name="city"
                  placeholder="Stadt"
                  required
                  className="rounded-[12px] bg-white px-4 font-body text-[15px] text-s-ink placeholder:text-s-ink-3 outline-none transition-shadow focus:shadow-[0_0_0_3px_rgba(255,255,255,0.4)]"
                />
                <div className="mt-2 flex flex-col gap-4 md:col-span-2 md:flex-row md:items-center md:justify-between">
                  <p className="max-w-[320px] font-body text-[12px] leading-[1.4] text-white/70">
                    Mit Anmeldung akzeptierst du unsere AGB. Keine versteckten
                    Gebühren — Bezahlung erst ab erstem Termin.
                  </p>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 self-start rounded-full bg-white px-7 py-3.5 font-body text-[15px] font-bold text-s-brand transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.97] md:self-auto"
                    style={{ boxShadow: "0 6px 16px rgba(0,0,0,0.18)" }}
                  >
                    Jetzt anmelden
                    <ArrowRight size={16} aria-hidden />
                  </button>
                </div>
              </form>
            </MorphingDialogDescription>
          </div>

          <MorphingDialogClose className="text-white" />
        </MorphingDialogContent>
      </MorphingDialogContainer>
    </MorphingDialog>
  );
}

export default function BentoBusiness() {
  // V3-D75-floating (2026-05-18): removed outer green-bordered card wrapper
  // per user "remove ths like card in a card... cards floating". Cards now
  // sit directly in the section with their own breathing room. Section padding
  // bumped to py-12/16 to compensate for the removed inner padding.
  return (
    <section className="relative z-[1] mx-auto mb-1 max-w-[1280px] px-4 py-12 md:mb-3 md:px-6 md:py-16">
      {/* ─── Header ─── */}
      <div className="mx-auto mb-10 max-w-[640px] text-center md:mb-12">
          <span className="mb-4 inline-flex items-center gap-2 font-body text-[14px] font-medium text-s-accent">
            <span
              aria-hidden
              style={{
                display: "inline-block",
                width: "5px",
                height: "5px",
                borderRadius: "9999px",
                background: "#D87352",
              }}
            />
            Für Salons
          </span>
          <h2
            className="font-display font-extrabold text-s-ink"
            style={{
              fontSize: "clamp(32px, 5vw, 56px)",
              lineHeight: "1.05",
              letterSpacing: "-0.025em",
            }}
          >
            Solen für<br />
            <span className="text-s-accent">dein Geschäft.</span>
          </h2>
          <p className="mt-5 font-body text-[15px] leading-[1.55] text-s-ink-2 md:text-[17px]">
            Mehr Buchungen, weniger Aufwand. Vier Werkzeuge, eine Plattform.
          </p>
        </div>

        {/* ─── Bento grid — asymmetric 3-col on desktop ─── */}
        {/*
          Row 1: [Booking · col-span-2] [Stars · col 3]
          Row 2: [Calendar · col 1] [Chart · col-span-2]
        */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          <BentoCard
            title="Sofortige Bestätigung"
            description="Kund:innen buchen direkt. Du bestätigst nichts mehr von Hand. Im Durchschnitt: 23 Sekunden."
            visual={<VisualBooking />}
            className="md:col-span-2"
          />
          <BentoCard
            title="Direkt-Chat"
            description="Schreib mit Kund:innen wie auf Insta. Termine bestätigen, Fragen klären — alles im Chat."
            visual={<VisualCustomerDM />}
          />
          <BentoCard
            title="Voller Kalender"
            description="Heute-frei und Last-Minute füllen Lücken automatisch. Keine Anrufe nötig."
            visual={<VisualCalendar />}
          />
          <BentoCard
            title="Analytics & Insights"
            description="Sieh wann's voll ist, wer wiederkommt, wo's hapert. Tab durchklicken."
            visual={<VisualAnalyticsTabbed />}
            className="md:col-span-2"
          />

          {/* 5th card — full-width expandable Join Us card.
              Replaces the old bottom CTA + trust line. Collapsed = green
              card with title + lede + arrow indicator + small trust line.
              Click → expands to reveal salon-registration form inline. */}
          <JoinUsCard />
        </div>
    </section>
  );
}
