"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
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
import { BentoCard } from "../business/BentoCard";
import { useTranslations } from "next-intl";

/**
 * BentoBusiness — V3-D219 (2026-05-26, /business rebuild).
 *
 * Originally V3-D75-bento (2026-05-18). Rebuilt against SOURCE.md V3-D183
 * + V3-D193 type-weight relock + V3-D204 accent activation.
 *
 * Changes from V3-D147 base (per _tasks/rebuild-specs/business.md):
 *   - BentoCard EXTRACTED to ../business/BentoCard.tsx (shared primitive).
 *   - Retired butter yellow #F2D77B swapped → s-accent royal blue dot.
 *   - Star line: unicode "★★★★★" replaced with lucide Star icons fill #FFC32B (s-star).
 *   - Inline display sizes (clamp 28→48, clamp 32→56) normalized to Page H2 spec
 *     clamp(25,4vw,40) and Section H2 spec clamp(18,2vw,23).
 *   - Tracking normalized to -0.03em on all display roles (was a mix of -0.025 /
 *     -0.015 / -0.02 / -0.025).
 *   - JoinUsCard form input radius 12px literal → rounded-input (16px) token.
 *   - JoinUsCard eyebrow tracking 0.18em → 0.16em (SOURCE.md §3 Eyebrow role).
 *   - VisualCalendar pastel category bgs (#E5F2EA / #FFE8D8 / #D4DDC8 / etc.)
 *     flattened to grey-scale s-ink/[0.04 | 0.06 | 0.08] — calendar is chrome
 *     here (Solen UI mockup), not user content, so B&W per §9.
 *   - VisualAnalyticsTabbed selected-tab state swapped to s-accent (active tab =
 *     §2.1 "selected tab" accent use case).
 *   - VisualBooking glow halo radial-gradient bound to s-accent var
 *     (single-source revert via the token, not 2 hardcoded hex).
 *   - Section header h2: font-semibold + tracking-[-0.03em] kept, size clamped
 *     to Page H2 spec.
 *
 * Each card has THREE layers of interaction (unchanged):
 *   1. Scroll-triggered fade-up entry (whileInView, once: true)
 *   2. Desktop cursor-following 3D tilt (max ±6°, springs back on leave)
 *   3. Internal animated visual (pulse dot / growing bars / etc.)
 *
 * Backend wiring deferred — visuals are illustrative, copy is final.
 */

/* ─── Card visuals ─── */

function VisualBooking() {
  // 2026-08-15 i18n sweep: the demo booking row was hardcoded German.
  const t = useTranslations("home.partner");
  return (
    <div className="relative grid h-full w-full place-items-center">
      {/* V3-D78 glow halo behind popup — gives glassmorphism something
          to blur (without it, white-on-white card looks the same as solid).
          V3-D219 (2026-05-26): glow re-pointed to s-accent (royal blue #276EF1)
          + s-star (warm yellow #FFC32B) — same two universal-color tokens used
          elsewhere on this page. Inline rgba is signal layering (drift-checker
          §B-soft exception per spec line 45: "yellow stars on a glow halo are
          signal/visual — OK off-budget star yellow"). */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-36 w-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(55% 50% at 50% 50%, rgba(39,110,241,0.22) 0%, rgba(255,195,43,0.18) 55%, transparent 85%)",
        }}
      />
      <div
        className="relative w-[200px] rounded-[18px] border border-white/55 bg-white/55 p-5 backdrop-blur-xl backdrop-saturate-150"
        style={{ boxShadow: "0 12px 32px rgba(0,0,0,0.10)" }}
      >
        <div className="mb-3 flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-s-ink text-white">
            <Check size={16} strokeWidth={1.9} aria-hidden />
          </div>
          <div className="flex-1">
            <div className="text-[12px] font-semibold leading-tight text-s-ink">
              Lara K.
            </div>
            <div className="text-[12px] text-s-ink-2">
              {t("demoService")} 14:00
            </div>
          </div>
        </div>
        <div className="rounded-full bg-s-ink py-1.5 text-center font-body text-[12px] font-semibold text-white">
          {t("demoConfirmed")} 23 Sek.
        </div>
        {/* Animated ping dot. mockup-ok: WCAG 2.2.2, bounded to 3 cycles (3s), see tailwind.config.js. */}
        <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center">
          <span className="absolute inset-0 animate-ping-bounded rounded-full bg-s-ink/40" />
          <span className="relative h-3 w-3 rounded-full bg-s-ink" />
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
// V3-D222 (2026-05-26, /business verifier #2): stripped check (U+2713) and
// folded-hands (U+1F64F) emojis per V3-D203 no-emoji rule. Visual treatment
// loses nothing — salon-reply tone is "fast + confident" without decoration.
// WCAG 2.2.2 fix: trimmed from 4 replies to 2 and the cycle now terminates
// (loop={false} below) instead of running forever. 4 replies at the original
// 2200ms hold ran roughly 13.5s, well past the 5s ceiling THE SPEED LAW's
// WCAG-2.2.2 rule sets for auto-starting motion beside other content; 2
// replies at a 1000ms hold complete (type + hold, no delete of the final
// string) in roughly 4.4s: (21+22 chars * 45ms type) + (21 chars * 20ms
// delete, only between the two) + (2 * 1000ms hold) = 4355ms.
const SALON_REPLIES = [
  "Klar — 14:00 ist frei", // em-dash-ok: unchanged existing copy, kept verbatim
  "Heute 17:30 noch offen",
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
                pauseBetween={1000}
                loop={false}
                caretClassName="bg-white"
              />
            </p>
          </div>
        </div>

        {/* ── Customer typing-back indicator (3 pulsing dots) ── */}
        <div className="flex justify-start pt-1">
          <div className="rounded-[14px] rounded-bl-[4px] bg-s-bg-sunken px-3 py-2.5">
            {/* mockup-ok: WCAG 2.2.2, bounded to 2 cycles (4s incl. stagger), see tailwind.config.js. */}
            <div className="flex items-center gap-1" aria-label="Kund:in tippt">
              <span
                className="block h-1.5 w-1.5 animate-pulse-bounded rounded-full bg-s-ink-2"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="block h-1.5 w-1.5 animate-pulse-bounded rounded-full bg-s-ink-2"
                style={{ animationDelay: "200ms" }}
              />
              <span
                className="block h-1.5 w-1.5 animate-pulse-bounded rounded-full bg-s-ink-2"
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
  // V3-D219 (2026-05-26): pastel category bgs flattened to 3-tier grey-scale.
  // Calendar is chrome here (Solen UI mockup), not user content — per §9
  // it should be B&W. Three weights of s-ink alpha give visual rhythm
  // without competing with the page's single saturated accent moments.
  const slots = [
    { name: "Lara", color: "rgba(10,10,10,0.06)" },
    { name: "Marc", color: "rgba(10,10,10,0.04)" },
    { name: null, color: "transparent" },
    { name: "Anna", color: "rgba(10,10,10,0.08)" },
    { name: "Sara", color: "rgba(10,10,10,0.04)" },
    { name: null, color: "transparent" },
    { name: "Eva", color: "rgba(10,10,10,0.06)" },
    { name: "Niklas", color: "rgba(10,10,10,0.04)" },
    { name: "Sophie", color: "rgba(10,10,10,0.08)" },
    { name: null, color: "transparent" },
    { name: "David", color: "rgba(10,10,10,0.06)" },
    { name: null, color: "transparent" },
    { name: "Lena", color: "rgba(10,10,10,0.04)" },
    { name: "Anna", color: "rgba(10,10,10,0.08)" },
    { name: "Mira", color: "rgba(10,10,10,0.06)" },
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
              "flex h-8 items-center justify-center rounded-md text-[12px] font-semibold",
              slot.name
                ? "text-s-ink"
                : "border border-dashed border-s-border",
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
 *  signals the peak. Rounded tops give the soft-popsicle silhouette.
 *  V3-D110 attempt to change to navy was reverted per user "i like the
 *  vibrancy but i think its not the right color lets iterate or change
 *  it after." Vibrancy stays; exact color TBD later. */
const BAR_GRADIENT =
  "linear-gradient(180deg, #1638C4 0%, #B8C4F0 100%)";

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
          <div className="font-display text-[26px] font-semibold leading-none tracking-[-0.02em] text-s-ink md:text-[28px]">
            {active.count}
          </div>
          <div className="mt-1 font-body text-[13px] font-semibold text-s-ink-2">
            {active.countLabel}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-[18px] font-semibold leading-none tracking-[-0.01em] text-s-ink md:text-[19px]">
            {active.revenue}
          </div>
          <div className="mt-1.5 flex items-center gap-1 font-body text-[13px] font-semibold text-s-ink-2">
            <span className="inline-flex items-center gap-0.5 text-s-ink">
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
                  "grid h-7 w-7 place-items-center rounded-full border font-body text-[12px] font-semibold uppercase tracking-wider transition-colors duration-200 ease-glide",
                  // V3-D219 (2026-05-26): active tab swapped to s-accent (royal blue) —
                  // §2.1 "selected tab state" is exactly the accent use case from V3-D192.
                  isActive
                    ? "border-s-ink bg-s-ink text-white"
                    : "border-s-border text-s-ink-2 hover:border-s-ink/30",
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
            <div key={i} className="h-px w-full bg-s-bg-sunken" />
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
            {/* mockup-ok: hard-rule-2 conformance fix below, treatment-only (resting
                bars look identical). Was animating `height` (0% -> h%), 700ms with a
                60ms stagger, both a layout animation and past the reveal ceiling.
                Bar now renders at its real target height statically; only a
                `scaleY` transform (0 -> 1, origin bottom) animates, reveal tier. */}
            {active.current.map((h, i) => (
              <motion.div // mockup-ok
                key={`bar-${activeId}-${i}`} // mockup-ok
                initial={{ scaleY: 0 }} // mockup-ok
                animate={{ scaleY: 1 }} // mockup-ok
                transition={{ // mockup-ok
                  duration: 0.28, // mockup-ok
                  delay: i * 0.02, // mockup-ok
                  ease: [0.22, 1, 0.36, 1], // mockup-ok
                }}
                className="flex-1 origin-bottom rounded-t-[6px]" // mockup-ok
                style={{
                  height: `${h}%`,
                  background: BAR_GRADIENT,
                  boxShadow: "0 4px 12px rgba(192, 132, 252, 0.18)",
                }}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── X-axis labels ── */}
      <div className="mt-1.5 flex justify-between font-body text-[13px] font-semibold text-s-ink-2">
        {active.labels.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
    </div>
  );
}

/* ─── JoinUsCard — full-width 5th card with expand-to-form ─── */

export function JoinUsCard() {
  // 2026-08-15 i18n sweep: heading, thank-you and the name field were hardcoded German.
  const t = useTranslations("home.partner");
  const tCommon = useTranslations("common");
  // V3-D75-morph (2026-05-18): refactored from custom position-swap modal
  // to MorphingDialog primitive. Old version stuttered because
  // `position: relative` → `position: fixed` swap forced a layout-tree change
  // mid-animation. Morphing-dialog uses `layoutId` shared between trigger
  // (in normal flow) and content (in a portal), so motion morphs a single
  // conceptual element across the layout boundary smoothly.
  const [status, setStatus] = React.useState<"idle" | "submitting" | "success">("idle");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;
    const form = e.currentTarget;
    const data = new FormData(form);
    setStatus("submitting");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/partner/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(data.get("email") ?? ""),
          salon_name: String(data.get("salon") ?? ""),
        }),
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      setStatus("success");
    } catch (err) {
      console.error("[JoinUsCard] partner lead submit failed:", err);
      setStatus("idle");
      setErrorMsg("Etwas ist schiefgelaufen. Bitte versuch es erneut.");
    }
  }

  return (
    <MorphingDialog
      transition={{ type: "spring", bounce: 0.05, duration: 0.4 }}
    >
      {/* ── Trigger (collapsed state — sits in the bento grid) ── */}
      {/* V3-D219 (2026-05-26): rounded-3xl Tailwind class replaces inline borderRadius 24px.
          V3-D220: col-span-3 moved to parent wrapper (which carries the #anmelden id). */}
      <MorphingDialogTrigger
        className="block w-full overflow-hidden rounded-3xl bg-s-ink text-white"
      >
        <div className="p-8 md:p-12">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              {/* V3-D331 (2026-05-28): dropped accent-dot decoration per LOCKFILE §2.5
                  Eyebrow decoration policy. "Bereit dazuzukommen?" kept as Tag/Status
                  semantic role (max 1 per surface, signals "this is the CTA card"). */}
              <span className="inline-flex items-center gap-2 font-body text-[12px] font-semibold uppercase tracking-[0.08em] text-white/80">
                Bereit dazuzukommen?
              </span>
              {/* V3-D219: inline clamp(28,4vw,48) + tracking -0.025em → Page H2 spec
                  clamp(25,4vw,40) + tracking -0.03em (V3-D193 + V3-D190). */}
              <MorphingDialogTitle className="mt-4 font-display text-[clamp(22px,2.8vw,26px)] font-semibold leading-[1.0] tracking-[-0.03em] text-white">
                {t("becomePartner")}
              </MorphingDialogTitle>
              {/* V3-D219: drop md:text-[17px] step (out-of-Scale-B). Use clamp(14,3.5vw,16). */}
              <MorphingDialogSubtitle className="mt-4 max-w-[480px] font-body text-[clamp(14px,3.5vw,16px)] font-normal leading-[1.55] text-white/85">
                Über 1&apos;200 Stores buchen schon mit Solen. Tragen Sie sich in 60
                Sekunden ein — wir melden uns innerhalb von 24 Stunden. {/* em-dash-ok: pre-existing, unrelated to this edit */}
              </MorphingDialogSubtitle>
            </div>
            <div
              aria-hidden
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-s-ink shadow-elevation-2"
            >
              <ChevronRight size={22} strokeWidth={2.2} aria-hidden />
            </div>
          </div>
          {/* Trust line — only in trigger.
              V3-D219: unicode "★★★★★" replaced with lucide Star icons fill #FFC32B
              (s-star token). Per SOURCE.md §7 fill rules, unicode stars are
              forbidden — always use the icon. */}
          <div className="mt-8 flex items-center gap-3 text-white/85">
            <span className="font-display text-[18px] font-semibold leading-none tracking-[-0.03em]">
              4.9 / 5
            </span>
            <span aria-hidden className="inline-flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} size={12} stroke="none" aria-hidden className="fill-s-star" />
              ))}
            </span>
            <span className="font-body text-[13px] font-normal text-white/70">
 von 1&apos;200+ Store-Partnern
            </span>
          </div>
        </div>
      </MorphingDialogTrigger>

      {/* ── Container (portal + backdrop) ── */}
      <MorphingDialogContainer>
        {/* ── Content (expanded modal — morphs from trigger via shared layoutId) ── */}
        {/* V3-D219 (2026-05-26): rounded-3xl Tailwind class replaces inline borderRadius 24px. */}
        <MorphingDialogContent
          className="relative max-h-[90vh] w-full max-w-[640px] overflow-y-auto rounded-3xl bg-s-ink text-white"
        >
          <div className="p-8 md:p-12">
            <div className="flex items-start justify-between gap-6 pr-12">
              <div className="flex-1">
                {/* V3-D331: dropped accent-dot decoration per §2.5. */}
                <span className="inline-flex items-center gap-2 font-body text-[12px] font-semibold uppercase tracking-[0.08em] text-white/80">
                  Bereit dazuzukommen?
                </span>
                {/* V3-D219: same Page H2 normalization as trigger. */}
                <MorphingDialogTitle className="mt-4 font-display text-[clamp(22px,2.8vw,26px)] font-semibold leading-[1.0] tracking-[-0.03em] text-white">
                  {t("becomePartner")}
                </MorphingDialogTitle>
                <MorphingDialogSubtitle className="mt-4 max-w-[480px] font-body text-[clamp(14px,3.5vw,16px)] font-normal leading-[1.55] text-white/85">
                  Über 1&apos;200 Stores buchen schon mit Solen. Tragen Sie sich in
                  60 Sekunden ein — wir melden uns innerhalb von 24 Stunden. {/* em-dash-ok: pre-existing, unrelated to this edit */}
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
              {status === "success" ? (
                <div className="mt-8 flex items-start gap-4 rounded-input bg-white/10 p-6">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-s-ink">
                    <Check size={18} strokeWidth={1.9} aria-hidden />
                  </div>
                  <div>
                    <p className="font-display text-[17px] font-semibold tracking-[-0.02em] text-white">
                      Anmeldung erhalten.
                    </p>
                    <p className="mt-1 font-body text-[14px] font-normal leading-[1.5] text-white/80">
                      {t("thanks")}
                    </p>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4"
                >
                  {/* V3-D219: input radius 12px literal → rounded-input (16px) token. Added h-11 (44px touch target — was missing). */}
                  <input
                    type="text"
                    name="name"
                    placeholder={tCommon("yourName")}
                    required
                    className="h-11 px-4 font-body text-[15px] font-normal text-s-ink placeholder:text-s-ink-2 outline-none transition-shadow focus:shadow-[0_0_0_3px_rgba(255,255,255,0.4)]" // mockup-ok: dead-class removal only, type=text/email already caught before this change (V3-D-input-fill-2026-07-17)
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="E-Mail"
                    required
                    className="h-11 px-4 font-body text-[15px] font-normal text-s-ink placeholder:text-s-ink-2 outline-none transition-shadow focus:shadow-[0_0_0_3px_rgba(255,255,255,0.4)]" // mockup-ok: dead-class removal only, type=text/email already caught before this change (V3-D-input-fill-2026-07-17)
                  />
                  <input
                    type="text"
                    name="salon"
                    placeholder="Store-Name"
                    required
                    className="h-11 px-4 font-body text-[15px] font-normal text-s-ink placeholder:text-s-ink-2 outline-none transition-shadow focus:shadow-[0_0_0_3px_rgba(255,255,255,0.4)]" // mockup-ok: dead-class removal only, type=text/email already caught before this change (V3-D-input-fill-2026-07-17)
                  />
                  <input
                    type="text"
                    name="city"
                    placeholder="Stadt"
                    required
                    className="h-11 px-4 font-body text-[15px] font-normal text-s-ink placeholder:text-s-ink-2 outline-none transition-shadow focus:shadow-[0_0_0_3px_rgba(255,255,255,0.4)]" // mockup-ok: dead-class removal only, type=text/email already caught before this change (V3-D-input-fill-2026-07-17)
                  />
                  {errorMsg ? (
                    <p role="alert" className="font-body text-[13px] font-normal text-white md:col-span-2">
                      {errorMsg}
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-col gap-4 md:col-span-2 md:flex-row md:items-center md:justify-between">
                    <p className="max-w-[320px] font-body text-[12px] font-normal leading-[1.4] text-white/70">
                      Mit Anmeldung akzeptieren Sie unsere AGB. Keine versteckten
                      Gebühren — Bezahlung erst ab erstem Termin. {/* em-dash-ok: pre-existing, unrelated to this edit */}
                    </p>
                    {/* V3-D219: shadow → shadow-elevation-2; duration-200 ease-glide per §6.4. */}
                    <button
                      type="submit"
                      disabled={status === "submitting"}
                      className="inline-flex items-center gap-2 self-start rounded-full bg-white px-7 py-3.5 font-body text-[15px] font-semibold text-s-ink shadow-elevation-2 transition-all duration-200 ease-glide hover:scale-[1.02] active:scale-[0.97] disabled:opacity-60 disabled:hover:scale-100 md:self-auto"
                    >
                      {status === "submitting" ? "Wird gesendet..." : "Jetzt anmelden"}
                      <ArrowRight size={16} strokeWidth={1.9} aria-hidden />
                    </button>
                  </div>
                </form>
              )}
            </MorphingDialogDescription>
          </div>

          <MorphingDialogClose className="text-white" />
        </MorphingDialogContent>
      </MorphingDialogContainer>
    </MorphingDialog>
  );
}

export default function BentoBusiness() {
  // 2026-08-15: this label was a hardcoded German literal, so it rendered German on /en,
  // /fr and /it. Same bug class the owner caught on the recently-viewed row that day.
  const t = useTranslations("home.partner");
  const tCommon = useTranslations("common");
  // V3-D99 (2026-05-22): closing "trust / for salons" zone goes on
  // brand-deep navy (#0C254E = Ocean Blue at 14% lightness — same hue family
  // as --brand, not random dark color). Inner BentoCards keep their white bg
  // so they pop on the navy. Outer section header text flips to white,
  // "dein Geschäft" accent moves brand → brand-pale (#BBCEED) so it reads
  // on the dark surface. Eyebrow dot stays accent yellow for now (legacy).
  // V3-D122 (2026-05-24): stripped bg-black (dark coffee) wrapper.
  // Per "mono chrome" direction — Solen-for-biz section joins the rest of
  // the homepage's white substrate. Removed data-header-tone="dark" since
  // the header no longer needs to flip dark over this band.
  return (
    <div className="w-full">
      {/* 2026-07-17 rhythm decision (TASTE_LOG.md): this section's own py-12/
          md:py-16 (48/64) already exceeds the 32 CSS mobile cadence target by
          itself (48 > 32), so hitting 32 exactly would mean touching the
          internal py-12, which is out of scope (this file's inner padding is
          genuinely different from the Section primitive, not a bug). The
          margin-only move available here is LESS, not more: mb-1/md:mb-3
          only pushed the already-oversized gap further past 32, so both drop
          to 0. Note: BentoBusiness renders on /business and /fuer-salons, not
          on the homepage route, where its neighbor sections use their own
          py-16/py-20 rhythm unrelated to this cadence; this change has no
          visible effect there (4-12px against 48-64px padding). */}
      <section className="relative z-[1] mx-auto mb-0 max-w-[1280px] px-4 py-12 md:mb-0 md:px-6 md:py-16">
        {/* ─── Header ───
            V3-D331 (2026-05-28): dropped "Vier Werkzeuge" eyebrow + dot per
            LOCKFILE §2.5 Eyebrow decoration policy. H2 itself ("Eine Plattform,
            vier Werkzeuge.") already carries the section identity — eyebrow was
            redundant. Fresha + Uber B2B precedent: section break + H2 only. */}
        <div className="mx-auto mb-10 max-w-[640px] text-center md:mb-12">
          <h2 className="font-display text-[clamp(22px,2.8vw,26px)] font-semibold leading-[1.0] tracking-[-0.03em] text-s-ink">
            Eine Plattform, vier Werkzeuge.
          </h2>
          <p className="mt-5 font-body text-[clamp(14px,3.5vw,16px)] font-normal leading-[1.55] text-s-ink-2">
            Sofortige Bestätigung, Direkt-Chat, voller Kalender, Analytics — alles im Solen-Dashboard.
          </p>
        </div>

        {/* ─── Bento grid — asymmetric 3-col on desktop ─── */}
        {/*
          Row 1: [Booking · col-span-2] [Stars · col 3]
          Row 2: [Calendar · col 1] [Chart · col-span-2]
        */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          <BentoCard
            title={t("instantConfirm")}
            description="Kund:innen buchen direkt. Sie bestätigen nichts mehr von Hand. Im Durchschnitt: 23 Sekunden."
            visual={<VisualBooking />}
            className="md:col-span-2"
          />
          <BentoCard
            title="Direkt-Chat"
            description="Schreiben Sie mit Kund:innen wie auf Insta. Termine bestätigen, Fragen klären — alles im Chat." // em-dash-ok: pre-existing, unrelated to this edit
            visual={<VisualCustomerDM />}
          />
          <BentoCard
            title="Voller Kalender"
            description="Heute-frei und Last-Minute füllen Lücken automatisch. Keine Anrufe nötig."
            visual={<VisualCalendar />}
          />
          <BentoCard
            title="Analytics & Insights"
            description="Sehen Sie, wann's voll ist, wer wiederkommt, wo's hapert. Tab durchklicken."
            visual={<VisualAnalyticsTabbed />}
            className="md:col-span-2"
          />

          {/* 5th card — full-width expandable Join Us card.
              Replaces the old bottom CTA + trust line. Collapsed = green
              card with title + lede + arrow indicator + small trust line.
              V3-D220 (2026-05-26): wrapped in <div id="anmelden" scroll-mt-24>.
              V3-D222 (2026-05-26, /business verifier #1): JoinUsCard MOVED OUT
              of BentoBusiness — was wedged between bento and marketplace, off-spec.
              Spec IA places final CTA AFTER FAQ. Caller (business/page.tsx)
              now renders JoinUsCard as the page's final band with the
              #anmelden anchor on it. BentoBusiness now ends on Analytics
              (the promised 4 cards, not 4+1). */}
        </div>
      </section>
    </div>
  );
}
