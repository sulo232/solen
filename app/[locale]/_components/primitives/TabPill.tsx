"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * TabPill — V3-D201 (2026-05-26, salon Phase A · A7).
 *
 * Active/inactive segmented filter pill. Currently inlined in 3 places
 * (SalonServices, SalonServicesSheet, plus future booking flow). This is the
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
 *   - sm — `h-8` (32px). Inline filter rows.
 *   - md — `h-10` (40px). Sticky/standalone segment controls.
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
    "rounded-full font-body font-semibold",
    "transition-[color,background-color,border-color,box-shadow] duration-200 ease-glide",
    "active:scale-[0.97] active:duration-[80ms]",
    "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
  ),
  {
    variants: {
      variant: {
        outline: "border",
        ghost:   "border-0",
      },
      tone: {
        active:   "",
        inactive: "",
      },
      size: {
        sm: "h-8 px-3 text-[13px]",
        md: "h-10 px-4 text-[14px]",
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
        className: "border-s-border bg-white text-s-ink-2 hover:text-s-ink hover:border-s-ink/20",
      },
      // ghost + active = soft gray fill, no border
      {
        variant: "ghost", tone: "active",
        className: "bg-s-bg-sunken text-s-ink",
      },
      // ghost + inactive = bare, low-emphasis
      {
        variant: "ghost", tone: "inactive",
        className: "bg-transparent text-s-ink-3 hover:text-s-ink",
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
