"use client";

// exists-check: `npm run exists "motion speed ladder demo card"` (2026-07-25), 0 matches , net-new.

import * as React from "react";
import { SheetPanelCopy } from "./SheetPanelCopy";
import { DemoCard } from "./DemoCard";
import { FAST_TIER_MS, SLOW_TIER_MS } from "./speeds";

const VIEW_MS = 900; // how long the sheet stays open before auto-closing, same for both sides

/**
 * Interaction (c) , Sheet present, a faithful visual copy of the real bottom `Sheet` primitive's
 * chrome (`SheetPanelCopy.tsx`, see its own doc comment for why the real component's baked-in
 * 600ms/200ms durations cannot be used directly for a 150-vs-300ms comparison). Two separate
 * triggers so only one sheet is ever open at a time; the shared "Play" / global replay opens the
 * fast tier, waits, closes it, then opens the slow tier.
 *
 * This is a NEW SURFACE ENTERING the screen, not a flip the user already expects, so the reveal
 * tier is the fit , it gives the sheet a bit of weight on arrival.
 */
export function SheetDemo({ globalTick }: { globalTick: number }) {
  const [openSide, setOpenSide] = React.useState<"fast" | "slow" | null>(null);
  const timers = React.useRef<number[]>([]);

  const clearTimers = React.useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);

  const playBoth = React.useCallback(() => {
    clearTimers();
    setOpenSide("fast");
    const t1 = window.setTimeout(() => {
      setOpenSide(null);
      const t2 = window.setTimeout(() => setOpenSide("slow"), FAST_TIER_MS + 300);
      timers.current.push(t2);
    }, FAST_TIER_MS + VIEW_MS);
    timers.current.push(t1);
  }, [clearTimers]);

  const mountedTick = React.useRef(globalTick);
  React.useEffect(() => {
    if (mountedTick.current === globalTick) return;
    mountedTick.current = globalTick;
    playBoth();
  }, [globalTick, playBoth]);

  React.useEffect(() => clearTimers, [clearTimers]);

  return (
    <>
      <DemoCard
        index={3}
        title="Sheet present"
        description="A faithful copy of the real bottom Sheet's chrome, opening from the bottom edge."
        verdict="A new surface arriving, not a flip: the reveal tier (300ms) fits, it gives the sheet a moment of weight instead of a jump-cut."
        onPlay={playBoth}
      >
        <button
          type="button"
          onClick={() => { clearTimers(); setOpenSide("fast"); }}
          className="h-11 w-full rounded-full border border-s-border bg-white font-body text-[14px] font-semibold text-s-ink transition-colors active:bg-s-bg-sunken"
        >
          Open
        </button>
        <button
          type="button"
          onClick={() => { clearTimers(); setOpenSide("slow"); }}
          className="h-11 w-full rounded-full border border-s-border bg-white font-body text-[14px] font-semibold text-s-ink transition-colors active:bg-s-bg-sunken"
        >
          Open
        </button>
      </DemoCard>

      <SheetPanelCopy
        isOpen={openSide === "fast"}
        onClose={() => setOpenSide(null)}
        durationOpenMs={FAST_TIER_MS}
        durationCloseMs={FAST_TIER_MS}
        title="Sort by"
      >
        <p className="text-s-ink-2">Recommended, Nearest, Highest rated. (Feedback tier, 150ms.)</p>
      </SheetPanelCopy>

      <SheetPanelCopy
        isOpen={openSide === "slow"}
        onClose={() => setOpenSide(null)}
        durationOpenMs={SLOW_TIER_MS}
        durationCloseMs={SLOW_TIER_MS}
        title="Sort by"
      >
        <p className="text-s-ink-2">Recommended, Nearest, Highest rated. (Reveal tier, 300ms.)</p>
      </SheetPanelCopy>
    </>
  );
}
