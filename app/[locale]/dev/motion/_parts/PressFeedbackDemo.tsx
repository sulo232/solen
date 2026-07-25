"use client";

// exists-check: `npm run exists "motion speed ladder demo card"` (2026-07-25), 0 matches , net-new.

import * as React from "react";
import { motion } from "motion/react";
import { DemoCard } from "./DemoCard";
import { useDemoToggle } from "./useDemoToggle";
import { GLIDE_EASE, FAST_TIER_S, SLOW_TIER_S } from "./speeds";

/**
 * Interaction (e) , Press feedback, the real ink commit CTA's `active:scale-[0.97]` (the "cta"
 * tier of `butterPress()`, primitives/motion.ts) reproduced with `motion.button` so its scale-down
 * duration is swappable per column. Two ways to trigger it, both real: (1) actually press the
 * button (`onPointerDown`/`onPointerUp`), the direct "does this feel instant" test the brief asks
 * for; (2) the card's own Play button / the page's "Replay all", a synthetic press-then-release
 * pulse so this demo replays alongside its siblings.
 *
 * This is the smallest, most immediate feedback a screen gives, an input registering: the fast
 * tier is the fit, a 300ms scale-down on every tap would read as the UI lagging behind the finger.
 */
function PressCTA({ durationS, on }: { durationS: number; on: boolean }) {
  const [pressed, setPressed] = React.useState(false);
  const releaseTimer = React.useRef<number | undefined>(undefined);
  const mountedOn = React.useRef(on);

  React.useEffect(() => {
    if (mountedOn.current === on) return;
    mountedOn.current = on;
    window.clearTimeout(releaseTimer.current);
    setPressed(true);
    releaseTimer.current = window.setTimeout(() => setPressed(false), durationS * 1000);
  }, [on, durationS]);

  React.useEffect(() => () => window.clearTimeout(releaseTimer.current), []);

  return (
    <motion.button
      type="button"
      onPointerDown={() => {
        window.clearTimeout(releaseTimer.current);
        setPressed(true);
      }}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      animate={{ scale: pressed ? 0.97 : 1 }}
      transition={{ duration: durationS, ease: [...GLIDE_EASE] as [number, number, number, number] }}
      className="flex h-11 w-full items-center justify-center rounded-full bg-s-ink font-body text-[15px] font-semibold text-white"
    >
      Buchen
    </motion.button>
  );
}

export function PressFeedbackDemo({ globalTick }: { globalTick: number }) {
  const { on, toggle } = useDemoToggle(globalTick);

  return (
    <DemoCard
      index={5}
      title="Press feedback"
      description="The ink commit CTA's press scale-down. Hold it, or hit Play for a synthetic press."
      verdict="The smallest, most immediate feedback a screen gives, an input registering: feedback tier (150ms) fits, a slower scale-down reads as lag under the finger."
      onPlay={toggle}
    >
      <PressCTA durationS={FAST_TIER_S} on={on} />
      <PressCTA durationS={SLOW_TIER_S} on={on} />
    </DemoCard>
  );
}
