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
 * semantic-color signal. Active state uses ink (chrome dominance), NOT brand
 * accent (which is reserved for non-chrome highlights per V3-D192-fix).
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
    "transition-colors duration-200 ease-glide",
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
      // outline + active = solid ink filled
      {
        variant: "outline", tone: "active",
        className: "border-s-ink bg-s-ink text-white shadow-elevation-1",
      },
      // outline + inactive = white + hairline border, hovers to ink
      {
        variant: "outline", tone: "inactive",
        className: "border-s-border bg-white text-s-ink-2 hover:border-s-ink hover:text-s-ink",
      },
      // ghost + active = filled ink, no border
      {
        variant: "ghost", tone: "active",
        className: "bg-s-ink text-white",
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
