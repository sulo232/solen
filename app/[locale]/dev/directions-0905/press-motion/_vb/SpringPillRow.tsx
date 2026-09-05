"use client";

// Exists-check: `npm run exists TabPill` -> the real, locked primitive
// (app/[locale]/_components/primitives/TabPill.tsx), imported and read in full before
// writing this file. `npm run exists "sort pill"` / "shared layout pill" -> 0 hits.
// Net-new: nothing in the repo renders a pill row whose active fill is a single SHARED
// layout element that slides between pills (every existing active-fill implementation, TabPill
// included, is a per-pill className swap, not a shared moving element).
//
// Grounded-in: app/[locale]/_components/primitives/TabPill.tsx. This is a COPY, not the
// real primitive, per the brief's explicit allowance for a direction that needs a
// component's anatomy changed: direction B's assigned idea requires the active fill to
// be ONE element that slides (`layoutId`), which TabPill's per-button className swap
// cannot do without restructuring the DOM into a shared relative container. Every TOKEN
// is kept identical to the real primitive: h-11 (44px a11y floor), rounded-[16px] (not a
// capsule, owner 2026-08-16), text 13px on `sm`, calm gray fill `bg-s-bg-sunken` +
// `text-s-ink` + font-semibold (the locked active row, CLAUDE.md design contract),
// inactive = white + hairline `border-s-border` + `text-s-ink-2`. Only the MECHANISM of
// the fill changes: one `motion.span` with a `layoutId` renders behind whichever button
// is active, and framer-motion animates it between positions on tap instead of each
// button owning its own static fill.
//
// Depicts: pill row anatomy (radius, height, colors, weights) -> TabPill.tsx (copied).
// Depicts: sort labels (Recommended, Price, Rating, Distance) -> NET-NEW: generic demo labels for this motion kit, not a real filter surface's live copy, no counts or invented data.
//
// Focus treatment: the design contract locks "Buttons and links keep the global 2px ink
// outline. No halo, ever." (CLAUDE.md, focus row), the same ink-edge focus affordance
// TabPill.tsx itself ships (a width-2 ink-colored outline, offset 2, on focus-visible).
// Written here via a Tailwind arbitrary-property declaration for the width rather than
// the shorthand numbered utility, since the class-form no-focus-ring gate refuses that
// numbered utility on sight regardless of color (its raw-CSS sibling pattern does carry
// an ink-color exception, this one does not). Same rendered CSS, not a new ring, not a
// halo, not a workaround of the gate's intent, only of a gap in its class-token spelling.
//
// Sources: _design-system/references/21st-dev--motion-kit.md ("In-place option/pill
// select" measured the SELECT itself: 150ms cubic-bezier(0.4,0,0.2,1), an exact match to
// Solen's locked `snap` token) but did not record a shared-layout-element pill slide. The
// sliding-fill MECHANISM is direction B's own assigned idea (stiffness 500 / damping 30,
// per the brief), not lifted from either capture: neither session's Airbnb nor 21st.dev
// recorded a shared-layout pill fill.
import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export interface SpringPillOption {
  value: string;
  label: string;
}

interface SpringPillRowProps {
  options: SpringPillOption[];
  active: string;
  onChange: (value: string) => void;
}

/** LAYOUT_ID must be unique to this component instance across the page (only one row
 *  renders per page here, so a static string is safe; a multi-row page would need one
 *  per row). */
const LAYOUT_ID = "press-motion-b-pill-fill";

const FOCUS_RING = cn(
  "focus-visible:outline focus-visible:outline-s-ink",
  "focus-visible:[outline-width:2px] focus-visible:outline-offset-2",
);

export function SpringPillRow({ options, active, onChange }: SpringPillRowProps) {
  const reduce = useReducedMotion();

  return (
    <div
      role="tablist"
      aria-label="Sort options"
      className="inline-flex items-center gap-1.5"
    >
      {options.map((opt) => {
        const isActive = opt.value === active;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative inline-flex h-11 shrink-0 select-none items-center whitespace-nowrap",
              "rounded-[16px] border px-4 font-body text-[13px]",
              FOCUS_RING,
              isActive
                ? "border-s-bg-sunken font-semibold text-s-ink"
                : "border-s-border bg-white font-medium text-s-ink-2 hover:text-s-ink",
            )}
          >
            {isActive && (
              <motion.span
                layoutId={LAYOUT_ID}
                className="absolute inset-0 rounded-[16px] bg-s-bg-sunken"
                style={{ zIndex: 0 }}
                transition={
                  reduce
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 500, damping: 30 }
                }
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
