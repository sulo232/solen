"use client";

// Exists-check: `npm run exists TabPill` -> the real, live TabPill.tsx (29 importers), which
// is the anatomy this file copies. `npm run exists press-motion` -> 0, net-new surface.
//
// Depicts: pill anatomy (radius, colour, size, weight) -> app/[locale]/_components/
//   primitives/TabPill.tsx (copied verbatim for anatomy; only transition timing changes below).
//
// Grounded-in: app/[locale]/_components/primitives/TabPill.tsx (copied verbatim for anatomy,
// radius, colour, size, weight; ONLY the transition timing on the active/inactive swap and the
// press-hold feedback are changed for Direction A). Per the brief: "If your direction needs a
// component's anatomy changed, COPY that component into your own _v<letter>/ folder, rename it,
// and change the copy." Nothing about the real TabPill.tsx is edited.
//
// Direction A change (the ONLY thing that differs from the real TabPill):
// 1. Press-hold (pointer down, before release): scale to 0.97 + 4% darker (brightness 0.96),
//    100ms `ease-thud` (accelerate). Duration replaces the brief's own 120ms starting value with
//    Airbnb's verified press-transform number for small controls (`airbnb--motion.md`, table (f):
//    "transform (press-scale, smallest controls) 100ms cubic-bezier(0.2,0,0,1)"). CONFLICT kept:
//    Solen's press curve is locked to `thud` (accelerate, "press-down feel"), not Airbnb's
//    decelerate curve; the DURATION is ported, the CURVE is not (already-decided divergence,
//    logged in airbnb--motion.md's Conflicts section, not re-litigated here).
// 2. Release (pointer up, back to resting scale): 200ms `ease-glide` (decelerate). Replaces the
//    brief's own 180ms starting value with the measured value LOCKFILE's own table already uses
//    for "Hover lift (cards): 200ms glide", independently corroborated by Airbnb's own measured
//    box-shadow hover-lift duration (also 200ms, same curve family). Good fit, both sides agree.
// 3. Selecting a pill (active swap): the fill/border/text swap itself is INSTANT (no transition
//    at all on colour/background/border, `transition-none`) -- the defining "Snap" identity,
//    a hard cut rather than a fade. A separate 150ms scale-tick (1 -> 1.06 -> 1) plays on top of
//    the swap. Replaces the brief's own 140ms starting value with 21st.dev's verified exact match:
//    `21st-dev--motion-kit.md`, Tabs in-place select, 150ms `cubic-bezier(0.4,0,0.2,1)`, which is
//    a byte-for-byte match to Solen's own locked `snap` token -- "the cleanest direct confirmation
//    in this whole capture" per that file. The tick uses `ease-snap`.
//
// Everything else (radius 16px, h-11, gray-fill selected/white-unselected grammar, font sizes/
// weights) is the real, unmodified TabPill anatomy -- CLAUDE.md design contract rows "selected /
// active" and "radius" are both kept exactly as locked. Focus cue is not redeclared here at all
// (see note above `pillBase`): the global stylesheet already paints one on every real <button>.

import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

export interface PressPillAProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  ariaLabel?: string;
  id?: string;
}

// Focus cue: NOT declared here on purpose. globals.css's global `button:focus-visible` rule
// (D1-focus-visible, 2026-07-27) already paints a keyboard-only ink inset cue on every real
// <button> in the app (not a ring/halo). Adding a per-component focus-visible class here would
// duplicate that (TabPill.tsx's own copy of that duplicate predates the global fix); this copy
// relies on the same global rule instead of redeclaring it.
const pillBase = cn(
  "inline-flex items-center gap-1.5 shrink-0 select-none whitespace-nowrap",
  "rounded-[16px] font-body h-11 px-4 text-[14px]",
  "border",
);

const pillTone = cva("", {
  variants: {
    tone: {
      active: cn(
        "font-semibold border-s-bg-sunken bg-s-bg-sunken text-s-ink",
        "transition-none",
      ),
      inactive: cn(
        "font-medium border-s-border bg-white text-s-ink-2",
        "hover:text-s-ink hover:border-s-border",
        "transition-none",
      ),
    },
  },
});

let keyframesInjected = false;

function ensureKeyframes() {
  if (keyframesInjected || typeof document === "undefined") return;
  keyframesInjected = true;
  const style = document.createElement("style");
  style.setAttribute("data-press-motion-a", "pill-tick");
  style.textContent = `
    @keyframes pmaPillTick {
      0% { transform: scale(1); }
      50% { transform: scale(1.06); }
      100% { transform: scale(1); }
    }
    @media (prefers-reduced-motion: reduce) {
      .pma-pill-tick-anim { animation: none !important; }
    }
  `;
  document.head.appendChild(style);
}

export function PressPillA({ active, onClick, children, ariaLabel, id }: PressPillAProps) {
  const [pressed, setPressed] = React.useState(false);
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    ensureKeyframes();
  }, []);

  const handleClick = () => {
    onClick();
    setTick((t) => t + 1);
  };

  return (
    <button
      id={id}
      type="button"
      key={tick}
      onClick={handleClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      aria-pressed={active}
      aria-label={ariaLabel}
      className={cn(
        pillBase,
        pillTone({ tone: active ? "active" : "inactive" }),
        "motion-safe:pma-pill-tick-anim",
      )}
      style={{
        transform: pressed ? "scale(0.97)" : "scale(1)",
        filter: pressed ? "brightness(0.96)" : "brightness(1)",
        transition: pressed
          ? "transform 100ms cubic-bezier(0.7,0,0.84,0), filter 100ms cubic-bezier(0.7,0,0.84,0)"
          : "transform 200ms cubic-bezier(0.16,1,0.3,1), filter 200ms cubic-bezier(0.16,1,0.3,1)",
        animation: tick > 0 ? "pmaPillTick 150ms cubic-bezier(0.4,0,0.2,1)" : undefined,
      }}
    >
      {children}
    </button>
  );
}
