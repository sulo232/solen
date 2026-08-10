"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * TabPill — V3-D201 (2026-05-26, salon Phase A · A7).
 *
 * Active/inactive segmented filter pill. Currently used in SalonServices and
 * the booking flow (SalonServicesSheet was removed 2026-07-19). This is the
 * single source. Generic primitive — will be used by search filters too.
 *
 * Layer: 1 (chrome) — TabPill is a navigation/filter affordance, not a
 * semantic-color signal. Active state = soft gray fill (s-bg-sunken) + ink
 * text — the locked selection treatment, shared with the search filters
 * (not ink-fill, not accent, no check).
 *
 * Variants:
 *   - `outline` (default) — visible border. For filter chips, segment controls.
 *   - `ghost`             — borderless. For sticky-bar variants where the bar
 *                           itself has chrome.
 *
 * Sizes:
 *   - sm: `h-11` (44px). Inline filter rows.
 *   - md: `h-11` (44px). Sticky/standalone segment controls.
 *
 * Both raised to 44px (2026-07-17): the locked design-contract row
 * "interactive controls >= 44px (h-11), the a11y floor" beats the prior
 * 32/40px convenience heights. Height only, every other treatment intact.
 */

export interface TabPillProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  size?: "sm" | "md";
  variant?: "outline" | "ghost";
  /** Optional aria-label override (when children is a glyph/icon only). */
  ariaLabel?: string;
  className?: string;
}

const tabPillVariants = cva(
  cn(
    "inline-flex items-center gap-1.5 shrink-0 select-none whitespace-nowrap",
    "rounded-full font-body",
    "transition-[color,background-color,border-color,box-shadow,transform] duration-150 ease-glide",
    "active:scale-[0.97] active:duration-[80ms]",
    "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
  ),
  {
    variants: {
      variant: {
        outline: "border",
        ghost:   "border-0",
      },
      // A1 weight-share fix (2026-07-25, PDP weight share 83%->~43%, ceiling 30%):
      // font-semibold used to sit in the shared base above, so BOTH tones rendered
      // at 600. The locked selection grammar ("selected = bg-s-bg-sunken + text-s-ink
      // + semibold over a WHITE unselected") only names semibold for the SELECTED
      // state; unselected's cue is the fill + border, not weight. Demoted inactive to
      // font-medium (500), not all the way to font-normal (400): grounded in
      // SalonModeToggle.tsx's shipped inactive-segment weight (the other real
      // selected/unselected pair in this codebase, text-s-ink-2 font-medium), and
      // 400 read too light against text-s-ink-2 on the hairline border when rendered.
      // Active stays font-semibold (600), unchanged.
      tone: {
        active:   "font-semibold",
        inactive: "font-medium",
      },
      size: {
        // mockup-ok: 44px a11y floor (CLAUDE.md design contract, "interactive
        // controls >= 44px (h-11)"); height-only change, same colors/radius/text.
        sm: "h-11 px-3 text-[13px]",
        md: "h-11 px-4 text-[14px]",
      },
    },
    compoundVariants: [
      // outline + active = soft gray fill (matches search filter selection)
      {
        variant: "outline", tone: "active",
        className: "border-s-border bg-s-bg-sunken text-s-ink",
      },
      // outline + inactive = white + hairline border. Hover deepens text + border,
      // FLAT with no lift (V3-D420 CONTROL_ELEVATION: calm controls on white never cast a shadow).
      {
        variant: "outline", tone: "inactive",
        className: "border-s-border bg-white text-s-ink-2 hover:text-s-ink hover:border-s-border",
      },
      // ghost + active = soft gray fill, no border
      {
        variant: "ghost", tone: "active",
        className: "bg-s-bg-sunken text-s-ink",
      },
      // ghost + inactive = bare, low-emphasis
      {
        variant: "ghost", tone: "inactive",
        className: "bg-transparent text-s-ink-2 hover:text-s-ink",
      },
    ],
    defaultVariants: { variant: "outline", tone: "inactive", size: "sm" },
  },
);

export function TabPill({
  active,
  onClick,
  children,
  size = "sm",
  variant = "outline",
  ariaLabel,
  className,
}: TabPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={ariaLabel}
      className={cn(
        tabPillVariants({
          variant,
          tone: active ? "active" : "inactive",
          size,
        }),
        className,
      )}
    >
      {children}
    </button>
  );
}
