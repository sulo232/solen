'use client';

import { Plus, Check } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react'; // mockup-ok: shared ENTER RECIPE module (MOTION.md, owner-approved 2026-07-09), not new design exploration
import { ENTER_RECIPE, ENTER_DURATION, GLIDE_EASE } from '@/app/[locale]/_components/primitives';

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
  const box = size === 'lg' ? 'w-9 h-9' : 'w-7 h-7';
  const icon = size === 'lg' ? 17 : 14;
  const shown = reduce ? { opacity: 1 } : ENTER_RECIPE.animate;
  const hidden = reduce ? { opacity: 0 } : ENTER_RECIPE.initial;
  const transition = reduce ? { duration: 0 } : { duration: ENTER_DURATION, ease: GLIDE_EASE };
  return (
    <span
      className={`relative shrink-0 ${box} rounded-full grid place-items-center transition-colors duration-300 ${
        selected /* selected-ok: check glyph */ ? 'bg-s-ink text-white' : 'border border-s-border text-s-ink-2'
      }`}
      aria-hidden
    >
      <motion.span // mockup-ok: shared ENTER RECIPE module
        className="absolute inset-0 grid place-items-center"
        initial={false} // mockup-ok: shared ENTER RECIPE module
        animate={selected ? hidden : shown} // mockup-ok: shared ENTER RECIPE module
        transition={transition}
      >
        <Plus size={icon} strokeWidth={2} />
      </motion.span>
      <motion.span // mockup-ok: shared ENTER RECIPE module
        className="absolute inset-0 grid place-items-center"
        initial={false} // mockup-ok: shared ENTER RECIPE module
        animate={selected ? shown : hidden} // mockup-ok: shared ENTER RECIPE module
        transition={transition}
      >
        <Check size={icon} strokeWidth={2.5} />
      </motion.span>
    </span>
  );
}
