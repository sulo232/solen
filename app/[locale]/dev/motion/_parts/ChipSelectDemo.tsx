"use client";

// exists-check: `npm run exists "motion speed ladder demo card"` (2026-07-25), 0 matches , net-new.

import * as React from "react";
import { motion } from "motion/react";
import { TabPill } from "@/app/[locale]/_components/primitives/TabPill";
import { DemoCard } from "./DemoCard";
import { useDemoToggle } from "./useDemoToggle";
import { GLIDE_EASE, FAST_TIER_S, SLOW_TIER_S } from "./speeds";

const CHIPS = ["All", "Coiffeur", "Barbershop"];

/**
 * Interaction (b) , Chip select, the real `TabPill` primitive. TabPill is always rendered
 * `active={false}` here so its own fixed 200ms internal crossfade never runs and doesn't
 * contaminate the comparison , the selected text weight/color is set directly on the label span
 * instead. The thing actually being timed is the sliding fill behind the pills (`layoutId`-
 * driven), the real "selection moving between chips" the brief asks for.
 *
 * Same job as the tab switch, a selection FLIP: the fast tier fits here too.
 */
function ChipRow({
  speed,
  durationS,
  active,
  onSelect,
}: {
  speed: string;
  durationS: number;
  active: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {CHIPS.map((label, i) => (
        <div key={label} className="relative">
          {active === i && (
            <motion.div
              layoutId={`chip-fill-${speed}`}
              className="absolute inset-0 rounded-full bg-white"
              transition={{ duration: durationS, ease: [...GLIDE_EASE] as [number, number, number, number] }}
            />
          )}
          <TabPill active={false} variant="ghost" onClick={() => onSelect(i)} className="relative z-10 bg-transparent">
            <span className={active === i ? "text-s-ink font-semibold" : "text-s-ink-3 font-medium"}>{label}</span>
          </TabPill>
        </div>
      ))}
    </div>
  );
}

export function ChipSelectDemo({ globalTick }: { globalTick: number }) {
  const { on, toggle } = useDemoToggle(globalTick);
  const [fastActive, setFastActive] = React.useState(0);
  const [slowActive, setSlowActive] = React.useState(0);

  React.useEffect(() => {
    setFastActive(on ? 1 : 0);
    setSlowActive(on ? 1 : 0);
  }, [on]);

  return (
    <DemoCard
      index={2}
      title="Chip select"
      description="A TabPill row, the selection fill travelling between chips instead of cutting."
      verdict="Also a flip, not a reveal: picking a filter should feel as instant as tapping it. Feedback tier (150ms) fits."
      onPlay={toggle}
    >
      <ChipRow speed="fast" durationS={FAST_TIER_S} active={fastActive} onSelect={setFastActive} />
      <ChipRow speed="slow" durationS={SLOW_TIER_S} active={slowActive} onSelect={setSlowActive} />
    </DemoCard>
  );
}
