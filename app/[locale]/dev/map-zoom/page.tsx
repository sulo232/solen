"use client";

/**
 * /dev/map-zoom , INTERACTIVE cluster <-> pins ZOOM motion mockup (owner 2026-07-02, BATCH 18b).
 * English (mockup rule). Owner leans cluster V2/V3; this focuses on the ZOOM IN/OUT transition motion.
 * Tap "Zoom in" (cluster -> individual pins) / "Zoom out" (pins -> cluster). Toggle 3 motion treatments:
 *   M1 Burst    , pins spring OUT from the cluster center, staggered (energetic).
 *   M2 Soft     , cluster fades+scales, pins gentle fade + short travel (matches the search EASE; calm).
 *   M3 Cascade  , pins pop in one-by-one with overshoot (playful, staggered).
 * Zoom-out is the reverse of each (pins converge back into the cluster).
 * Exists-check: `npm run exists map-zoom` = 0; real cluster/pins = components-legacy/MapView.tsx.
 * Grounded-in: /dev/map-motion + /dev/map-full (star+rating gray-selected pin, gray cluster disc) +
 *   SearchOverlay motion (motion/react, EASE) + BATCH-18 council. Cluster held at the gray disc (V2)
 *   while judging MOTION; the V2-vs-V3 look is a separate pick.
 * Real tokens, Lucide, no CDN.
 */
import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Star, ZoomIn, ZoomOut } from "lucide-react";
import { notFound } from "next/navigation";

const EASE = [0.32, 0.72, 0, 1] as const;
const CX = 195, CY = 300; // cluster centre inside the map frame

const PINS = [
  { rating: "4.9", top: 180, left: 90 },
  { rating: "5.0", top: 230, left: 300 },
  { rating: "5.0", top: 380, left: 130 },
  { rating: "4.7", top: 420, left: 285 },
  { rating: "4.8", top: 320, left: 210 },
];

type MotionSpec = {
  s0: number;
  clusterExit: Record<string, number>;
  clusterT: object;
  pinT: (i: number) => object;
  travel: number; // fraction of the center->pin distance the pin travels from (1 = starts at center)
};

const MOTIONS: Record<1 | 2 | 3, MotionSpec> = {
  1: { // Burst
    s0: 0.5, travel: 1,
    clusterExit: { scale: 1.3, opacity: 0 },
    clusterT: { duration: 0.18, ease: EASE },
    pinT: (i) => ({ type: "spring", stiffness: 280, damping: 18, delay: i * 0.04 }),
  },
  2: { // Soft crossfade
    s0: 0.9, travel: 0.4,
    clusterExit: { scale: 0.9, opacity: 0 },
    clusterT: { duration: 0.24, ease: EASE },
    pinT: (i) => ({ duration: 0.26, ease: EASE, delay: i * 0.03 }),
  },
  3: { // Cascade
    s0: 0.4, travel: 1,
    clusterExit: { scale: 0.8, opacity: 0, y: 6 },
    clusterT: { duration: 0.2, ease: EASE },
    pinT: (i) => ({ type: "spring", stiffness: 420, damping: 16, delay: i * 0.09 }),
  },
};

function PinVisual({ rating }: { rating: string }) {
  return (
    <span className="flex flex-col items-center">
      <span className="inline-flex items-center gap-1 rounded-full border border-s-border bg-white px-2.5 py-1 text-[12.5px] font-semibold text-s-ink shadow-[0_1px_2px_rgba(10,10,10,0.12),0_4px_12px_rgba(10,10,10,0.10)]">
        <Star size={12} className="fill-s-star text-s-star" strokeWidth={0} /> {rating}
      </span>
      <span className="-mt-1 h-2 w-2 rotate-45 border-b border-r border-s-border bg-white" />
    </span>
  );
}

function Frame({ variant }: { variant: 1 | 2 | 3 }) {
  const reduce = useReducedMotion();
  const [zoomed, setZoomed] = useState(false);
  const m = MOTIONS[variant];
  const rt = reduce ? { duration: 0 } : undefined;

  return (
    <div className="relative h-[560px] w-full overflow-hidden rounded-[24px] border border-s-border bg-white shadow-[0_8px_40px_rgba(10,10,10,0.12)]">
      <div className="absolute inset-0 [background:repeating-linear-gradient(0deg,transparent,transparent_31px,rgba(10,10,10,0.04)_32px),repeating-linear-gradient(90deg,transparent,transparent_31px,rgba(10,10,10,0.04)_32px)]" />

      {/* pins (zoomed in) */}
      <AnimatePresence>
        {zoomed && PINS.map((p, i) => {
          const dx = (CX - p.left) * m.travel;
          const dy = (CY - p.top) * m.travel;
          return (
            <motion.span
              key={p.rating + i}
              className="absolute -translate-x-1/2"
              style={{ top: p.top, left: p.left }}
              initial={{ x: dx, y: dy, scale: m.s0, opacity: 0 }}
              animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
              exit={{ x: dx, y: dy, scale: m.s0, opacity: 0 }}
              transition={rt ?? m.pinT(i)}
            >
              <PinVisual rating={p.rating} />
            </motion.span>
          );
        })}
      </AnimatePresence>

      {/* cluster (zoomed out) , gray disc */}
      <AnimatePresence>
        {!zoomed && (
          <motion.span
            key="cluster"
            className="absolute grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-s-border bg-s-bg-sunken text-[14px] font-bold text-s-ink shadow-[0_1px_2px_rgba(10,10,10,0.12),0_6px_16px_rgba(10,10,10,0.12)]"
            style={{ top: CY, left: CX }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={rt ? { opacity: 0 } : m.clusterExit}
            transition={rt ?? m.clusterT}
          >
            {PINS.length}
          </motion.span>
        )}
      </AnimatePresence>

      {/* zoom controls (bottom-right, like a map) */}
      <div className="absolute bottom-4 right-4 flex flex-col overflow-hidden rounded-2xl border border-s-border bg-white shadow-[0_1px_2px_rgba(10,10,10,0.10),0_4px_12px_rgba(10,10,10,0.08)]">
        <button onClick={() => setZoomed(true)} aria-label="Zoom in" className="grid h-11 w-11 place-items-center text-s-ink active:bg-s-bg-sunken"><ZoomIn size={19} /></button>
        <span className="h-px w-full bg-s-border" />
        <button onClick={() => setZoomed(false)} aria-label="Zoom out" className="grid h-11 w-11 place-items-center text-s-ink active:bg-s-bg-sunken"><ZoomOut size={19} /></button>
      </div>

      {/* one-tap replay */}
      <button onClick={() => setZoomed((z) => !z)} className="absolute bottom-4 left-4 rounded-full border border-s-border bg-white px-4 py-2 text-[13px] font-semibold text-s-ink shadow-[0_1px_2px_rgba(10,10,10,0.10),0_4px_12px_rgba(10,10,10,0.08)] active:scale-95">
        {zoomed ? "Zoom out" : "Zoom in"}
      </button>
    </div>
  );
}

export default function MapZoomMockup() {
  if (process.env.NODE_ENV === "production") notFound();
  const [mounted, setMounted] = useState(false);
  const [variant, setVariant] = useState<1 | 2 | 3>(1);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  const NAMES: Record<1 | 2 | 3, string> = { 1: "Burst", 2: "Soft", 3: "Cascade" };
  return (
    <main className="min-h-screen bg-s-bg-sunken py-4">
      <div className="mx-auto w-full max-w-[390px] px-3">
        <p className="pb-2 text-center text-[12.5px] font-semibold text-s-ink-3">Zoom in = cluster opens into pins. Zoom out = pins merge back. Pick a motion.</p>
        <div className="mb-3 flex items-center justify-center gap-2">
          {[1, 2, 3].map((n) => (
            <button key={n} onClick={() => setVariant(n as 1 | 2 | 3)} className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold ${variant === n ? "border-transparent bg-s-bg-sunken text-s-ink" : "border-s-border bg-white text-s-ink-2"}`}>
              M{n} {NAMES[n as 1 | 2 | 3]}
            </button>
          ))}
        </div>
        <Frame variant={variant} />
        <p className="px-1 pt-3 text-center text-[12.5px] text-s-ink-2">
          M1 Burst = pins spring out fast. M2 Soft = calm crossfade (search-bar ease). M3 Cascade = pins pop one by one.
        </p>
      </div>
    </main>
  );
}
