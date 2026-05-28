"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * StatusPill — V3-D201 (2026-05-26, salon Phase A · A4) · V3-D212 icon prop.
 *
 * Single-source open/closed state pill for salon-detail surfaces. Currently
 * inlined in 2 places (SalonHeader, SalonSidebar) with inconsistent classes;
 * this colocates the rule.
 *
 * Layer: 3 (semantic UI) — color carries the meaning per V3-D197 + universal-
 * color convention (§1):
 *   - Open  → `text-s-success` green (universal "go/open")
 *   - Closed → `text-s-ink-2` muted (universal "off/inactive")
 *
 * The dot mirrors the text color and is purely decorative (`aria-hidden`).
 * Status text itself is the accessible label (live region wraps it upstream
 * if the value is time-sensitive).
 *
 * V3-D212 (verifier #3): added `icon` prop. Fresha's closed-state pill
 * shows a leading clock icon — Solen now mirrors with lucide `Clock`. Icon
 * inherits the tone color so closed = muted clock, open = green clock.
 * Mutually exclusive with dot (don't show both).
 */

export interface StatusPillProps {
  /** Open vs closed semantic. */
  isOpen: boolean;
  /** Human-readable label (German). E.g. "Geöffnet bis 19:30", "Geschlossen · Öffnet 10:00". */
  label: string;
  /** sm = inline (meta rows), md = block (sidebar). */
  size?: "sm" | "md";
  /** Show the leading colored dot. Default true. Ignored if `icon` is set. */
  showDot?: boolean;
  /** Optional leading lucide icon (e.g. `Clock` for closed state). Suppresses dot. */
  icon?: LucideIcon;
  /** Optional extra classes (e.g. `tabular-nums` for time alignment). */
  className?: string;
}

const pillVariants = cva(
  cn(
    "inline-flex items-center font-body font-semibold",
    "transition-colors duration-200 ease-glide",
  ),
  {
    variants: {
      tone: {
        open:   "text-s-success",
        closed: "text-s-ink-2",
      },
      size: {
        sm: "gap-1.5 text-[13px] leading-[1.3]",
        md: "gap-2 text-[14px] leading-[1.3]",
      },
    },
    defaultVariants: { tone: "open", size: "sm" },
  },
);

const dotVariants = cva(
  "inline-block rounded-full shrink-0",
  {
    variants: {
      tone: {
        open:   "bg-s-success",
        closed: "bg-s-border",
      },
      size: {
        sm: "h-2 w-2",
        md: "h-2.5 w-2.5",
      },
    },
    defaultVariants: { tone: "open", size: "sm" },
  },
);

export function StatusPill({
  isOpen,
  label,
  size = "sm",
  showDot = true,
  icon: Icon,
  className,
}: StatusPillProps) {
  const tone = isOpen ? "open" : "closed";
  const iconSize = size === "md" ? 14 : 13;
  return (
    <span className={cn(pillVariants({ tone, size }), className)}>
      {Icon ? (
        <Icon size={iconSize} strokeWidth={2} aria-hidden className="shrink-0" />
      ) : showDot ? (
        <span aria-hidden className={dotVariants({ tone, size })} />
      ) : null}
      <span>{label}</span>
    </span>
  );
}
