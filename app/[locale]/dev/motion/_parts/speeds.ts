// exists-check: `npm run exists "motion speed ladder"` (2026-07-25), 0 matches , net-new.
// GROUNDED in, not a re-derivation of, `primitives/motion.ts`: GLIDE_EASE and STAGGER_STEP are
// imported/re-exported verbatim below, never re-typed as new numbers. This file adds ZERO new
// easing curves , every animated demo on /dev/motion uses this single imported GLIDE_EASE, per
// the task brief ("use the LOCKED easing from primitives/motion.ts, import it, never re-derive a
// curve"). The only new numbers here are DURATIONS (ms), sourced from the measured evidence in
// `_plans/MOTION_LAW.md` ("CAPTURED, LIVE" table), not invented.

import { GLIDE_EASE, STAGGER_STEP } from "@/app/[locale]/_components/primitives/motion";

export { GLIDE_EASE, STAGGER_STEP };

/**
 * THE SPEED LADDER (page section 1). One row per candidate speed, same honest motion (a card
 * sliding in + fading), only the duration differs. Every number + citation below is copied
 * verbatim from the "CAPTURED, LIVE" table in `_plans/MOTION_LAW.md`, not re-derived.
 */
export const SPEED_LADDER: { ms: number; who: string }[] = [
  { ms: 80, who: "Solen code today , our fastest tier (35 elements)" },
  { ms: 150, who: "X uses this on 105 elements" },
  { ms: 250, who: "Airbnb uses this on 90 elements" },
  { ms: 300, who: "Airbnb uses this on 102 elements" },
  { ms: 420, who: "our docs' most-used value (MOTION.md ENTER_RECIPE)" },
];

/**
 * SECTION 2 tiers. The task brief's own literal labels: "80-150ms (feedback tier)" vs
 * "250-300ms (reveal tier)". The ACTUAL numbers driving every one of the four demo pairs are
 * fixed at the two headline values from section 1's ladder (150ms = X's own number, 300ms =
 * Airbnb's own number) so section 2 ties directly back to section 1 instead of introducing new,
 * un-cited numbers.
 */
export const FAST_TIER_MS = 150;
export const SLOW_TIER_MS = 300;
export const FAST_TIER_LABEL = "80-150ms (feedback tier)";
export const SLOW_TIER_LABEL = "250-300ms (reveal tier)";
export const FAST_TIER_S = FAST_TIER_MS / 1000;
export const SLOW_TIER_S = SLOW_TIER_MS / 1000;

/**
 * THE EVIDENCE TABLE (page section 3). Copied verbatim from `_plans/MOTION_LAW.md` "CAPTURED,
 * LIVE" table + the owner's own X recording measurement , real numbers, not recalled from
 * training data.
 */
export const EVIDENCE_ROWS: { source: string; speeds: string; note: string }[] = [
  {
    source: "X (x.com), mobile web",
    speeds: "150ms on 105 elements, 200ms on 7",
    note: "cubic-bezier(0.4, ...) family , a feed you scan",
  },
  {
    source: "Airbnb (airbnb.com), mobile web",
    speeds: "300ms on 102, 250ms on 90, 100ms on 28, 200ms on 25",
    note: "cubic-bezier(0.2, ...) family , a product you browse",
  },
  {
    source: "Solen code today",
    speeds: "150ms x335, 200ms x127, 300ms x37, 80ms x35",
    note: "already has the fast tier",
  },
  {
    source: "Solen docs (MOTION.md)",
    speeds: "180 / 260 / 300 / 320 / 420 / 500 / 520ms",
    note: "nothing under 180ms , the fast tier is missing here, not in the code",
  },
  {
    source: "Owner's own X screen recording",
    speeds: "83ms and 167ms sustained motion windows",
    note: "60fps, frame-diffed , the direct measurement that started this build",
  },
];
