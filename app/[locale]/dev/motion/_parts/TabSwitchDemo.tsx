"use client";

// exists-check: `npm run exists "motion speed ladder demo card"` (2026-07-25), 0 matches , net-new.

import * as React from "react";
import { DemoCard } from "./DemoCard";
import { ModeToggleCopy } from "./ModeToggleCopy";
import { useDemoToggle } from "./useDemoToggle";
import { GLIDE_EASE, FAST_TIER_S, SLOW_TIER_S } from "./speeds";

/**
 * Interaction (a) , Tab switch. The owner named this control by name (the Termin / Walk-in
 * toggle, `SalonModeToggle`), copied verbatim into `ModeToggleCopy.tsx` per the task brief ("copy
 * it into _parts, do not edit it") with one addition: the real component crossfades each
 * segment's own background independently and never actually travels, so this copy adds a single
 * sliding indicator so the two speeds have something to compare.
 *
 * This is a STATE FLIP (the user taps and expects an immediate switch, not a reveal), so the
 * fast tier is the fit.
 */
export function TabSwitchDemo({ globalTick }: { globalTick: number }) {
  const { on, toggle } = useDemoToggle(globalTick);
  const [fastMode, setFastMode] = React.useState<"book" | "walkin">("book");
  const [slowMode, setSlowMode] = React.useState<"book" | "walkin">("book");

  React.useEffect(() => {
    setFastMode(on ? "walkin" : "book");
    setSlowMode(on ? "walkin" : "book");
  }, [on]);

  return (
    <DemoCard
      index={1}
      title="Tab switch"
      description="The Termin / Walk-in mode toggle. The indicator travels between segments."
      verdict="This is a state flip, not a reveal: the user taps and expects an instant switch. Feedback tier (150ms) fits; the reveal tier reads sluggish on a binary toggle."
      onPlay={toggle}
    >
      <ModeToggleCopy mode={fastMode} onChange={setFastMode} durationS={FAST_TIER_S} ease={GLIDE_EASE} />
      <ModeToggleCopy mode={slowMode} onChange={setSlowMode} durationS={SLOW_TIER_S} ease={GLIDE_EASE} />
    </DemoCard>
  );
}
