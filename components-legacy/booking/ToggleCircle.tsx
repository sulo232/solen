'use client';

import { useEffect, useRef } from 'react';
import { Plus, Check } from 'lucide-react';
import { motion, useReducedMotion, useAnimationControls } from 'motion/react'; // mockup-ok: shared ENTER RECIPE module (MOTION.md, owner-approved 2026-07-09), not new design exploration
import { ENTER_RECIPE, ENTER_DURATION, GLIDE_EASE } from '@/app/[locale]/_components/primitives';

// mockup-ok: owner 2026-07-19, matches liftup-booking-services-tiered mockup
// `.tog.pop{animation:tog-pop .42s var(--pop)}` / `@keyframes tog-pop{0%{transform:
// scale(1)}38%{transform:scale(1.18)}100%{transform:scale(1)}}` from the approved
// mockup, where `--pop:cubic-bezier(0.34,1.56,0.64,1)`. Played imperatively (same
// InteractiveStar pattern as RatingStars.tsx) so it fires exactly once, only on the
// false->true selection edge, never on mount and never on deselect.
const POP_EASE = [0.34, 1.56, 0.64, 1] as const;
const POP_DURATION = 0.42;

// B16 (owner 2026-07-09, "the check button goes down"): the old crossfade used
// a spring + a 90deg `rotate` on BOTH icons (Plus 0->90, Check -90->0).
// Rotating an asymmetric glyph like a checkmark through a quarter turn makes
// its lower stroke sweep through a downward arc as it un-rotates into place,
// which read as the check "going down" instead of resolving in place. Swapped
// for the shared ENTER RECIPE (opacity+scale+blur, glide, no rotate, no y) so
// the check always resolves dead-center.
//
// selected-ok: the ink `bg-s-ink` badge below is the CHECK ICON itself (a
// +/check toggle glyph), not a row/pill selection fill; unchanged by B16,
// matches StaffStep.tsx's CheckBadge convention. Row-level selected state
// (e.g. the service row background) stays bg-s-bg-sunken elsewhere.
export default function ToggleCircle({
  selected,
  size = 'lg',
}: {
  selected: boolean;
  size?: 'lg' | 'sm';
}) {
  const reduce = useReducedMotion();
  // mockup-ok: owner 2026-07-19, matches liftup-booking-services-tiered mockup
  // (`.tog.pop`, see the module doc comment above) , the circle-scale pop, played
  // once per false->true edge only (never on mount, never on deselect).
  const controls = useAnimationControls();
  const wasSelected = useRef(selected);
  useEffect(() => {
    if (!reduce && selected && !wasSelected.current) {
      controls.start({ scale: [1, 1.18, 1] }, { duration: POP_DURATION, ease: POP_EASE });
    }
    wasSelected.current = selected;
  }, [selected, reduce, controls]);

  const box = size === 'lg' ? 'w-9 h-9' : 'w-7 h-7';
  const icon = size === 'lg' ? 17 : 14;
  const shown = reduce ? { opacity: 1 } : ENTER_RECIPE.animate;
  const hidden = reduce ? { opacity: 0 } : ENTER_RECIPE.initial;
  // mockup-ok: owner 2026-07-19, matches liftup-booking-services-tiered mockup , the
  // check glyph's hidden/entering state is `.tog .ck-i` (scale(.6) + blur(6px)), a
  // sharper morph than the Plus icon's gentler shared ENTER_RECIPE scale/blur; the
  // shown state is unchanged (scale 1, blur 0, same as ENTER_RECIPE.animate).
  const checkShown = reduce ? { opacity: 1 } : ENTER_RECIPE.animate;
  const checkHidden = reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6, filter: 'blur(6px)' };
  const transition = reduce ? { duration: 0 } : { duration: ENTER_DURATION, ease: GLIDE_EASE };
  return (
    <motion.span // mockup-ok: owner 2026-07-19, matches liftup-booking-services-tiered mockup (tog-pop)
      className={`relative shrink-0 ${box} rounded-full grid place-items-center transition-colors duration-300 ${
        selected /* selected-ok: check glyph */ ? 'bg-s-ink text-white' : 'border border-s-border text-s-ink-2'
      }`}
      aria-hidden
      initial={false} // mockup-ok: owner 2026-07-19, matches liftup-booking-services-tiered mockup
      animate={controls} // mockup-ok: owner 2026-07-19, matches liftup-booking-services-tiered mockup
    >
      <motion.span // mockup-ok: shared ENTER RECIPE module
        className="absolute inset-0 grid place-items-center"
        initial={false} // mockup-ok: shared ENTER RECIPE module
        animate={selected ? hidden : shown} // mockup-ok: shared ENTER RECIPE module
        transition={transition}
      >
        <Plus size={icon} strokeWidth={2} />
      </motion.span> {/* mockup-ok: shared ENTER RECIPE module */}
      <motion.span // mockup-ok: owner 2026-07-19, matches liftup-booking-services-tiered mockup (sharper check-in morph)
        className="absolute inset-0 grid place-items-center"
        initial={false} // mockup-ok: owner 2026-07-19, matches liftup-booking-services-tiered mockup
        animate={selected ? checkShown : checkHidden} // mockup-ok: owner 2026-07-19, matches liftup-booking-services-tiered mockup
        transition={transition}
      >
        <Check size={icon} strokeWidth={2.5} />
      </motion.span> {/* mockup-ok: owner 2026-07-19, matches liftup-booking-services-tiered mockup */}
    </motion.span> // mockup-ok: owner 2026-07-19, matches liftup-booking-services-tiered mockup
  );
}
