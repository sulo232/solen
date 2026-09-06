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
import { useSystem } from "./KitProvider";

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
 * anything the real TabPill is already the right primitive for.
 *
 * ROUND 3: reads `useSystem().candidate?.pill` and branches ONLY when a candidate's recipe
 * differs from this default. Candidates A and B declare `selectionMode: "grey"` (this file's
 * existing, unmodified recipe, per `_plans/R3_ONE_SYSTEM.md`'s own "identical to Candidate A"
 * rows) so they render through the exact code path that already shipped. Candidate C declares
 * `selectionMode: "borderOnly"` (`airbnb/CAPTURE.md` Part A: fill stays white in both states,
 * text stays ink in both states, no bold, selecting a chip changes ONLY the border colour) and a
 * 24px radius (RADIUS.c.pillPx), overridden the same `!important` way `!rounded-full` already is,
 * for the reason documented above (bare clsx, no tailwind-merge dedup). lift/rule/tray have no
 * `candidate` entry at all, so this branch never fires for them either. */
export function Pill({ active, onClick, children, ariaLabel, variant, size = "md", className }: PillProps) {
  const { candidate } = useSystem();
  const pillSpec = candidate?.pill;

  if (pillSpec?.selectionMode === "borderOnly") {
    // Candidate C: white fill and ink text in BOTH states (never TabPill's grey-when-inactive),
    // font-normal in both states (no bolding), and selection changes only the border colour.
    // Tailwind classes below are STATIC LITERALS, not built from `pillSpec` at runtime: Tailwind's
    // JIT scans source text for exact class strings, so a template-literal class compiles to
    // nothing. `pillSpec` still owns the DECISION; these literals are RADIUS.c.pillPx (24) and
    // COLOR.inkText (#0A0A0A, via the s-ink token) transcribed by hand.
    return (
      <TabPill
        active={active}
        onClick={onClick}
        ariaLabel={ariaLabel}
        variant={variant}
        size="sm" // 13px, TabPill's own measured-live size (R3_ONE_SYSTEM.md "Ported: text 13px")
        className={[
          "!rounded-[24px] !bg-white !font-normal !text-s-ink",
          active ? "!border-s-ink" : "!border-s-border", // selected-ok: Candidate C Airbnb-PORT (SHOW verdict, R3_ONE_SYSTEM.md Part 4 item 2) -- fill stays white, ONLY the border goes ink; not the graveyarded ink-fill/blue-border selection (V3-D421/V3-D450)
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </TabPill>
    );
  }

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
