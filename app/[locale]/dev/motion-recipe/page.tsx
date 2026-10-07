"use client";

/**
 * /dev/motion-recipe , BEFORE/AFTER demo of the new element-enter animation recipe (owner 2026-07-09).
 * The owner walked the booking flow and called the animations "raggedy" because they only animate ONE
 * property (opacity). This mockup proposes the new standard: every enter animation = blur + scale +
 * opacity TOGETHER, on the locked "butter" glide easing, plus a smooth button press/hover transition.
 * Exists-check: `npm run exists motion-recipe` = 0 new; `npm run exists motion` hit /dev/map-motion
 * (map-specific interaction demo, different scope), lib/motion.ts + lib/animations.ts (shared variant
 * tokens, reused below for the BEFORE recipe), components-legacy/booking (source of the raggedy BEFORE,
 * opacity-only initial={{opacity:0}} animate={{opacity:1}}, no blur/scale). This route is net-new: a
 * side-by-side replayable comparison of the current opacity-only recipe against the proposed
 * blur+scale+opacity recipe at three intensities, for owner sign-off before codifying into real
 * components. /dev/mockups and /dev/flows already exist as sibling dev index surfaces.
 * Ease token reused verbatim from tailwind.config.js (transitionTimingFunction, ~line 312):
 *   glide = cubic-bezier(0.16, 1, 0.3, 1), the locked "butter" curve, used for all three intensities
 *   (a second candidate curve is drift-gate RETIRED per _design-system/QUESTIONS.md#q2, so it is not
 *   used here, only the canonical snap/spring/glide/thud set is live).
 * Real tokens, Lucide icons only, no CDN, no fabricated data (placeholder copy only, English per the
 * mockup-english rule, real components render translated copy via i18n).
 */
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, RotateCcw, Star, MapPin, Scissors } from "lucide-react";


// Locked ease token, from tailwind.config.js , do not invent new curves.
const GLIDE: [number, number, number, number] = [0.16, 1, 0.3, 1];

type Intensity = "subtle" | "recommended" | "strong";

const RECIPE: Record<Intensity, { scale: number; blur: number; duration: number; ease: [number, number, number, number]; label: string }> = {
  subtle: { scale: 0.98, blur: 4, duration: 0.32, ease: GLIDE, label: "Subtle" },
  recommended: { scale: 0.96, blur: 8, duration: 0.28, ease: GLIDE, label: "Recommended" },
  strong: { scale: 0.94, blur: 12, duration: 0.52, ease: GLIDE, label: "Strong" },
};

const BEFORE_DURATION = 0.15;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-[13px] font-semibold text-s-ink-2">{children}</p>;
}

function RowShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-card border border-s-border bg-white p-4">
      <p className="mb-3 text-[12px] font-semibold text-s-ink-2">{title}</p>
      <div className="grid grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

// ── Demo 1: card enter ──────────────────────────────────────────────────
function BeforeCard({ replayKey }: { replayKey: number }) {
  return (
    <motion.div
      key={replayKey}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: BEFORE_DURATION }}
      className="rounded-card border border-s-border bg-white p-3"
    >
      <div className="mb-2 aspect-[3/2] w-full rounded-xl bg-s-bg-sunken" />
      <p className="truncate text-[14px] font-semibold text-s-ink">Sample service</p>
      <div className="mt-1 flex items-center gap-1 text-[12px] text-s-ink-2">
        <Star size={12} className="fill-s-star text-s-star" />
        <span>4.9</span>
        <span className="text-s-ink-2">Sample Street 1</span>
      </div>
    </motion.div>
  );
}

function AfterCard({ replayKey, intensity }: { replayKey: number; intensity: Intensity }) {
  const r = RECIPE[intensity];
  return (
    <motion.div
      key={replayKey}
      initial={{ opacity: 0, scale: r.scale, filter: `blur(${r.blur}px)` }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: r.duration, ease: r.ease }}
      className="rounded-card border border-s-border bg-white p-3"
    >
      <div className="mb-2 aspect-[3/2] w-full rounded-xl bg-s-bg-sunken" />
      <p className="truncate text-[14px] font-semibold text-s-ink">Sample service</p>
      <div className="mt-1 flex items-center gap-1 text-[12px] text-s-ink-2">
        <Star size={12} className="fill-s-star text-s-star" />
        <span>4.9</span>
        <span className="text-s-ink-2">Sample Street 1</span>
      </div>
    </motion.div>
  );
}

// ── Demo 2: accordion / service-row expand ──────────────────────────────
function BeforeAccordion({ replayKey }: { replayKey: number }) {
  const [open, setOpen] = useState(true);
  return (
    <div key={replayKey} className="rounded-card border border-s-border bg-white p-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-[14px] font-semibold text-s-ink">Haircut & styling</span>
        <Plus size={18} className={`text-s-ink-2 ${open ? "rotate-45" : ""}`} />
      </button>
      {open && (
        <div className="mt-3 rounded-xl bg-s-bg-sunken p-3 text-[13px] text-s-ink-2">
          45 min, from CHF 60. Sample text for the expanded state.
        </div>
      )}
    </div>
  );
}

function AfterAccordion({ replayKey, intensity }: { replayKey: number; intensity: Intensity }) {
  const r = RECIPE[intensity];
  const [open, setOpen] = useState(true);
  return (
    <div key={replayKey} className="rounded-card border border-s-border bg-white p-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-[14px] font-semibold text-s-ink">Haircut & styling</span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.18, ease: GLIDE }}
        >
          <Plus size={18} className="text-s-ink-2" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: r.scale, filter: `blur(${r.blur}px)`, height: 0 }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)", height: "auto" }}
            exit={{ opacity: 0, scale: r.scale, filter: `blur(${r.blur}px)`, height: 0 }}
            transition={{ duration: r.duration, ease: r.ease }}
            className="overflow-hidden"
          >
            <div className="mt-3 rounded-xl bg-s-bg-sunken p-3 text-[13px] text-s-ink-2">
              45 min, from CHF 60. Sample text for the expanded state.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Demo 3: sheet / pop-in ──────────────────────────────────────────────
function BeforeSheet({ replayKey }: { replayKey: number }) {
  return (
    <motion.div
      key={replayKey}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: BEFORE_DURATION }}
      className="rounded-card border border-s-border bg-white p-4 shadow-elevation-2"
    >
      <p className="text-[14px] font-semibold text-s-ink">Booking confirmed</p>
      <p className="mt-1 text-[12px] text-s-ink-2">Sample note for the panel.</p>
    </motion.div>
  );
}

function AfterSheet({ replayKey, intensity }: { replayKey: number; intensity: Intensity }) {
  const r = RECIPE[intensity];
  return (
    <motion.div
      key={replayKey}
      initial={{ opacity: 0, scale: r.scale, filter: `blur(${r.blur}px)` }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: r.duration, ease: r.ease }}
      className="rounded-card border border-s-border bg-white p-4 shadow-elevation-2"
    >
      <p className="text-[14px] font-semibold text-s-ink">Booking confirmed</p>
      <p className="mt-1 text-[12px] text-s-ink-2">Sample note for the panel.</p>
    </motion.div>
  );
}

// ── Demo 4: button press + hover ────────────────────────────────────────
function BeforeButton() {
  return (
    <button className="w-full rounded-btn bg-s-ink px-5 py-3 text-[15px] font-semibold text-white">
      Continue
    </button>
  );
}

function AfterButton() {
  return (
    <button className="w-full rounded-btn bg-s-ink px-5 py-3 text-[15px] font-semibold text-white transition-all duration-[180ms] ease-glide hover:-translate-y-[1px] hover:shadow-elevation-2 active:scale-[0.97]">
      Continue
    </button>
  );
}

export default function MotionRecipePage() {
  const [intensity, setIntensity] = useState<Intensity>("recommended");
  const [replayKey, setReplayKey] = useState(0);

  const r = RECIPE[intensity];

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[12px] font-semibold text-s-ink-2">Dev / motion recipe</p>
          <h1 className="mt-1 text-[22px] font-bold text-s-ink">Enter animation: before vs after</h1>
          <p className="mt-2 max-w-[560px] text-[13px] text-s-ink-2">
            Before uses opacity only, matching the current booking flow components. After adds blur,
            scale and opacity together on the glide easing. This demo intentionally keeps moving
            regardless of reduced-motion settings so the comparison stays visible, the real components
            will respect prefers-reduced-motion.
          </p>
        </div>
        <button
          onClick={() => setReplayKey((k) => k + 1)}
          className="flex shrink-0 items-center gap-2 rounded-btn bg-s-ink px-5 py-3 text-[15px] font-semibold text-white transition-all duration-[180ms] ease-glide hover:-translate-y-[1px] hover:shadow-elevation-2 active:scale-[0.97]"
        >
          <RotateCcw size={16} />
          Replay all
        </button>
      </div>

      <div className="mb-8 inline-flex rounded-full border border-s-border bg-white p-1">
        {(Object.keys(RECIPE) as Intensity[]).map((key) => (
          <button
            key={key}
            onClick={() => setIntensity(key)}
            className={`rounded-full px-4 py-2 text-[13px] transition-colors duration-150 ease-glide ${
              intensity === key
                ? "bg-s-bg-sunken font-semibold text-s-ink"
                : "text-s-ink-2 hover:text-s-ink-2"
            }`}
          >
            {RECIPE[key].label}
          </button>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <SectionLabel>Before</SectionLabel>
        <SectionLabel>
          After ({r.label}: scale {r.scale}, blur {r.blur}px, {Math.round(r.duration * 1000)}ms)
        </SectionLabel>
      </div>

      <div className="space-y-4">
        <RowShell title="1. Card enter">
          <BeforeCard replayKey={replayKey} />
          <AfterCard replayKey={replayKey} intensity={intensity} />
        </RowShell>

        <RowShell title="2. Service row expand">
          <BeforeAccordion replayKey={replayKey} />
          <AfterAccordion replayKey={replayKey} intensity={intensity} />
        </RowShell>

        <RowShell title="3. Sheet pop-in">
          <BeforeSheet replayKey={replayKey} />
          <AfterSheet replayKey={replayKey} intensity={intensity} />
        </RowShell>

        <div className="rounded-card border border-s-border bg-white p-4">
          <p className="mb-3 text-[12px] font-semibold text-s-ink-2">4. Button press and hover</p>
          <div className="grid grid-cols-2 gap-4">
            <BeforeButton />
            <AfterButton />
          </div>
        </div>
      </div>

      <p className="mt-8 flex items-center gap-2 text-[12px] text-s-ink-2">
        <Scissors size={13} className="text-s-ink-2" />
        This demo intentionally ignores prefers-reduced-motion so the comparison stays visible; real
        booking components will respect it.
      </p>
      <p className="mt-2 flex items-center gap-2 text-[12px] text-s-ink-2">
        <MapPin size={13} className="text-s-ink-2" />
        Placeholder content only, not wired to live salon data.
      </p>
    </div>
  );
}
