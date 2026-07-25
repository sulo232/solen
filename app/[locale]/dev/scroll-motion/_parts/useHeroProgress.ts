"use client";

// exists-check: `npm run exists "scroll motion condensing top bar frosted"` and `npm run exists
// "frost glass sticky header"` (2026-07-25) both returned 0 matches. net-new vs the closest
// matches: `app/[locale]/dev/search-morph/page.tsx` (the scroll/drag-linked precedent this hook's
// technique is DELIBERATELY copied from, see doc-comment below, not a duplicate , that file's
// `expand` motion value is local to its own component, not exported/reusable, and drives a
// pointer-gesture accordion, not a page-scroll top bar); `_design-system/MOTION.md` +
// `app/[locale]/_components/primitives/motion.ts` (the locked easing/duration source this hook
// intentionally does NOT reuse for the raw scroll mapping, see comment, but DOES reuse
// `GLIDE_EASE` from the latter inside CondenseBar.tsx for press micro-interactions); the
// `lib/gdpr` / `Hero.tsx` / `ClientPhotosTab.tsx` hits are unrelated keyword collisions ("hero",
// "scroll") with no shared concern.

import * as React from "react";
import { useMotionValue, useReducedMotion, type MotionValue } from "motion/react";

/**
 * useHeroProgress , the scroll-linked driver shared by all three CondenseBar
 * directions (S1/S2/S3).
 *
 * PURE 1:1 LINEAR mapping, matching this codebase's existing scroll-linked
 * precedent (`app/[locale]/dev/search-morph/page.tsx`, `EXPAND_DIST = 120`,
 * "PURE 1:1 SCROLL-LINKED EXPAND ... every property driven from this single
 * value" , memory `feedback_search_expand_gesture_linked`: a continuously-driven
 * surface tracks its input directly, it does not ease against a timer). RANGE
 * below reuses that exact 120px constant rather than inventing a new one. The
 * task brief's own example range ("0 to ~120px") lines up with this precedent.
 *
 * progress = 0 while the hero photo's bottom edge is still at/below the bar's
 * own height (the bar sits over live photo, fully unclipped). progress rises
 * linearly to 1 across the next RANGE px of scroll, starting the instant the
 * photo begins disappearing under the bar , so frost/title/action are tied to
 * CONTENT crossing the bar, not to a raw page-top offset (robust to whatever
 * height the English chrome strip above the demo renders at).
 *
 * prefers-reduced-motion (task brief, literal): no transform/opacity/backdrop
 * animation runs , the scroll listener is never attached, progress is pinned
 * at 1 (the fully condensed end state) once the effect resolves the OS setting,
 * mirroring the same collapse-to-final-state technique already used by
 * `useStepSwapMotion` / `useEnterMotion` in primitives/motion.ts.
 */
const RANGE = 120; // px , matches search-morph's EXPAND_DIST precedent
export const BAR_HEIGHT = 56; // px , this bar's own collapsed row height (see CondenseBar)

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export function useHeroProgress(
  heroRef: React.RefObject<HTMLElement | null>,
): MotionValue<number> {
  const reduce = useReducedMotion();
  const progress = useMotionValue(0);

  React.useEffect(() => {
    if (reduce) {
      progress.set(1); // end state applied directly, nothing to animate from
      return;
    }

    let raf = 0;
    function measure() {
      raf = 0;
      const hero = heroRef.current;
      if (!hero) return;
      const bottom = hero.getBoundingClientRect().bottom;
      progress.set(clamp01((BAR_HEIGHT - bottom) / RANGE));
    }
    function onScroll() {
      if (raf) return;
      raf = requestAnimationFrame(measure);
    }

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [heroRef, progress, reduce]);

  return progress;
}
