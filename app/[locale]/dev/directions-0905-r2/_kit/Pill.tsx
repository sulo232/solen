"use client";

// exists-check: `npm run exists directions` (run this session) shows no round-2 Pill kit
// wrapper; `npm run exists kit` returns no existing token/kit module. TabPill.tsx itself is the
// real, live, 29-importer primitive (found via the same command's earlier runs this session and
// read directly, see the Grounded-in line).
//
// Depicts: filter/segment pill anatomy -> app/[locale]/_components/primitives/TabPill.tsx (height, selected/unselected fill+border+text+weight, rendered here unmodified except one radius override, see below)
//
// Grounded-in: app/[locale]/_components/primitives/TabPill.tsx (COMPOSED, not redrawn: this
// file renders the real TabPill and changes nothing about its selected/unselected recipe,
// height, or motion; FLOORS LAW 9, "if the registry owns it, compose it, never re-draw it
// inline").
//
// measured: TabPill ships h-11 (44px) and `rounded-[16px]` per its own file header, dated
// 2026-08-16. R2_LOOK_SYSTEMS.md CONFLICT C1 leaves the radius an open owner call, but the
// orchestrator brief for this kit resolves it: round 2 ships the CAPSULE (9999px), the corner
// that was landed unshown and rejected on sight 2026-09-02 ("I never wanted this corner thing"),
// matching what the live product actually renders on 359 call sites (`rounded-btn` +
// `rounded-pill`). Since this repo's `cn()` (lib/utils.ts) is bare clsx with NO tailwind-merge
// dedup, a plain `rounded-full` class appended after TabPill's own `rounded-[16px]` would win or
// lose depending on Tailwind's CSS output order, not on the order these classes are written --
// unpredictable. `!rounded-full` (Tailwind's important-modifier syntax) is used instead:
// `!important` always outranks a non-important declaration regardless of source order, so this
// is the one safe way to override a literal class baked into a composed primitive without
// forking it.
//
// floors: this is a control component, not a screen; the six-item finished-screen pass does not
// apply here (see preview/page.tsx, which composes controls into an actual fold and answers it).
//
// system: the base pill recipe (A1) carries no per-system delta (R2_LOOK_SYSTEMS.md Part B: no
// system overrides A1; System 1's own text says "the filter row keeps its own pill borders
// because a control needs an edge, and that is the only border in the fold" -- i.e. Pill looks
// identical in all three systems). This component therefore does not read useSystem() at all.

import * as React from "react";
import { TabPill, type TabPillProps } from "@/app/[locale]/_components/primitives/TabPill";

export interface PillProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  ariaLabel?: string;
  /** Passed straight through to TabPill; "outline" (default, bordered) or "ghost" (borderless,
   * for sticky-bar contexts where the bar itself has chrome). */
  variant?: TabPillProps["variant"];
  /** Passed straight through to TabPill. Defaults to "md" (h-11, 14px/500), the size A1
   * transcribes from press-motion/_va/PressPillA.tsx:47. "sm" (13px) is off the closed A5 type
   * ramp and stays available only for a caller with its own documented reason to use it. */
  size?: TabPillProps["size"];
  className?: string;
}

/** The kit's Pill: TabPill's real selected/unselected/height recipe, capsule corner. 44px
 * (h-11) touch target either way. Use for filter chips, segment controls, category selectors:
 * anything the real TabPill is already the right primitive for. */
export function Pill({ active, onClick, children, ariaLabel, variant, size = "md", className }: PillProps) {
  return (
    <TabPill
      active={active}
      onClick={onClick}
      ariaLabel={ariaLabel}
      variant={variant}
      size={size}
      className={["!rounded-full", className].filter(Boolean).join(" ")}
    >
      {children}
    </TabPill>
  );
}
