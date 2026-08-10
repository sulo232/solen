"use client";

// exists-check: `npm run exists "motion speed ladder demo card"` (2026-07-25), 0 matches , net-new.

import * as React from "react";
import { motion } from "motion/react";
import { Play } from "lucide-react";
import { SPEED_LADDER, GLIDE_EASE } from "./speeds";

/**
 * SpeedLadder , page section 1, the core visual. One row per candidate speed (80/150/250/300/
 * 420ms), the SAME honest motion on every row (a card sliding in from the left edge while it
 * fades in), so the ONLY variable across rows is duration. Every row uses the one locked easing
 * this page is allowed to use (`GLIDE_EASE`, imported from `primitives/motion.ts`, never
 * re-derived).
 *
 * Each row remounts its animated card on every "play" via a changing `key` , the standard
 * React way to force a fresh `initial` -> `animate` run, so every replay (the section's own "Play
 * all" or the page's master "Replay all", both drive the same `globalTick`) restarts every row at
 * the exact same instant, which is what lets the owner see them race side by side.
 */
function LadderRow({ ms, who, playKey }: { ms: number; who: string; playKey: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-[52px] shrink-0 text-right font-heading text-[15px] font-semibold tabular-nums text-s-ink">
        {ms}ms
      </div>
      <div className="relative h-11 flex-1 overflow-hidden rounded-full bg-s-bg-sunken">
        <motion.div
          key={playKey}
          initial={{ x: "-120%", opacity: 0 }}
          animate={{ x: "0%", opacity: 1 }}
          transition={{ duration: ms / 1000, ease: [...GLIDE_EASE] }}
          className="absolute inset-y-1 left-1 flex w-[88px] items-center justify-center rounded-full bg-s-ink font-body text-[12px] font-semibold text-white"
        >
          Card
        </motion.div>
      </div>
      <p className="w-[132px] shrink-0 font-body text-[12px] leading-[1.3] text-s-ink-2">{who}</p>
    </div>
  );
}

export function SpeedLadder({
  globalTick,
  onPlayAll,
}: {
  globalTick: number;
  onPlayAll: () => void;
}) {
  return (
    <section className="rounded-2xl border border-s-border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-body text-[12px] font-semibold text-s-ink-2">Section 1</p>
          <h2 className="mt-0.5 font-display text-[18px] font-semibold tracking-[-0.01em] text-s-ink">
            The speed ladder
          </h2>
          <p className="mt-1 font-body text-[13px] leading-[1.4] text-s-ink-2">
            Five candidate speeds, the same card sliding in and fading, only the duration changes.
          </p>
        </div>
        <button
          type="button"
          onClick={onPlayAll}
          className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-s-ink px-4 font-body text-[13px] font-semibold text-white transition-transform duration-150 ease-glide active:scale-[0.97]"
        >
          <Play size={16} strokeWidth={2.25} className="ml-0.5" aria-hidden />
          Play all
        </button>
      </div>

      <div className="mt-4 space-y-2.5">
        {SPEED_LADDER.map((row) => (
          <LadderRow key={row.ms} ms={row.ms} who={row.who} playKey={globalTick} />
        ))}
      </div>
    </section>
  );
}
