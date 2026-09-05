"use client";

// Exists-check: `npm run exists "empty state"` -> components-legacy/ui/EmptyState.tsx is the
// real, locked, shared primitive (icon halo + title + message + action, motion-in on mount).
// This file is a COPY of that primitive (per the brief's "copy into your own _v<letter>/
// folder, rename it, change the copy" rule), because direction A's one idea needs a per-state
// ICON COLOUR the shared component does not expose (it hardcodes `text-s-ink-2` on the icon),
// and because this component is a Client Component rendered from a Server Component caller, so
// its `icon` prop takes an already-rendered, pre-coloured element, not a component reference
// (see the prop's own doc comment below).
//
// CHANGED FROM THE REAL COMPONENT, on purpose, and flagged: the real EmptyState.tsx wraps its
// Lucide icon in a `bg-s-bg-sunken` circle (a grey tile behind a glyph). The pre-edit drift
// gate (A25) refuses that pattern in a NEW file, and the design contract's own "states" row
// already names the same ban in words ("NEVER a grey Lucide disc"), so the real component is
// itself drifted against its own lock, not a pattern to copy forward. Fix applied here, per the
// gate's own suggested remedy: the icon sits directly on the page at a larger size (48px, no
// backdrop box), coloured per state; the SUNKEN TRAY the lock also asks for wraps the whole
// unit (icon + headline + subline + CTA) instead, via the outer rounded-[24px] bg-s-bg-sunken
// card in EmptyStatesDirectionA.tsx, which satisfies "on the sunken tray inside a living page"
// without putting a second grey box immediately behind the glyph.
//
// Everything else, spacing rhythm, the mount fade, the filled ink CTA, stays the shape of the
// real, locked anatomy.
//
// Depicts: headline + message + action shell -> components-legacy/ui/EmptyState.tsx (title/
// message/action classes kept close to the original, icon treatment changed per above).
// Depicts: mount fade+scale -> components-legacy/ui/EmptyState.tsx's own
// `initial:{opacity:0,scale:.97} -> animate:{opacity:1,scale:1}, 250ms, ease [0.2,0.8,0.4,1]`,
// copied unchanged (this is the LOCKED default already shipping, not a new motion choice for
// this direction, whose declared axis is recipe-sameness, not motion).

import { motion, useReducedMotion } from "motion/react";

interface EmptyStateRecipeProps {
  /** Pre-rendered Lucide icon element (sized + coloured by the caller), not a component
   *  reference: this file is a Client Component and the caller (EmptyStatesDirectionA) is a
   *  Server Component, so a bare component function cannot cross that boundary as a prop, only
   *  an already-rendered element can. */
  icon: React.ReactNode;
  title: string;
  message: string;
  actionLabel: string;
  actionHref: string;
}

export default function EmptyStateRecipe({
  icon,
  title,
  message,
  actionLabel,
  actionHref,
}: EmptyStateRecipeProps) {
  const prefersReducedMotion = useReducedMotion();
  const animationProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, scale: 0.97 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 0.25, ease: [0.2, 0.8, 0.4, 1] as const },
      };

  return (
    <motion.div
      className="flex flex-col items-center justify-center text-center py-10 px-6"
      {...animationProps}
    >
      <div className="mb-5">{icon}</div>
      <h3 className="font-heading text-s-ink text-lg font-semibold mb-1.5">{title}</h3>
      <p className="font-body text-s-ink-2 text-sm max-w-xs leading-relaxed">{message}</p>
      <div className="mt-5">
        <a
          href={actionHref}
          className="inline-flex h-11 items-center justify-center rounded-full bg-s-ink px-5 text-[15px] font-semibold text-white transition-[filter,transform] duration-150 hover:brightness-[1.06] active:scale-[0.98] active:duration-[80ms]"
        >
          {actionLabel}
        </a>
      </div>
    </motion.div>
  );
}
