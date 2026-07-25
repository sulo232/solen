"use client";

// exists-check: `npm run exists "motion gallery snap glide demo"` (2026-07-25), 0 matches ,
// net-new. The shared A/B toggle driver every demo card on this page uses so a single "Replay
// all" control (MotionGallery.tsx) can re-trigger every demo at once, while each card also stays
// independently triggerable by the owner (task brief: "a self-contained card the owner can
// trigger repeatedly").

import * as React from "react";

/**
 * `on` flips every time `globalTick` changes (never on first mount) AND every time `toggle()` is
 * called directly (the card's own "Play" button). Demos read `on` to decide which of their two
 * states to animate to , the SAME toggle drives both the "Today" and "Proposed" columns, so a
 * single click is a fair, synchronized side-by-side comparison.
 */
export function useDemoToggle(globalTick: number) {
  const [on, setOn] = React.useState(false);
  const mountedTick = React.useRef(globalTick);

  React.useEffect(() => {
    if (mountedTick.current === globalTick) return;
    mountedTick.current = globalTick;
    setOn((v) => !v);
  }, [globalTick]);

  const toggle = React.useCallback(() => setOn((v) => !v), []);

  return { on, toggle };
}
