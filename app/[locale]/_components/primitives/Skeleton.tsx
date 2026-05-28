import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * V3-D195 Skeleton primitive — SOURCE.md §10.1 (loading skeleton grammar).
 *
 * Server component (no `"use client"`). Pure markup + computed inline styles.
 * The shimmer animation is driven entirely by `.skeleton-shimmer` (CSS-only,
 * defined in `app/globals.css`). `prefers-reduced-motion` is handled globally
 * in `globals.css` — no per-component opt-in needed.
 *
 * Two co-existing patterns per [Q14](_design-system/QUESTIONS.md#q14):
 *
 * 1. **Utility class** — `<div className="skeleton-shimmer rounded-card aspect-square">` for ad-hoc cases.
 * 2. **`<Skeleton>` wrapper** (this file) — the 80% case, especially when feeding
 *    measured dimensions from data-shaped skeleton compositions.
 *
 * @example match a SalonCard footprint
 *   <Skeleton aspect="square" rounded={16} />
 *   <Skeleton height={20} width="60%" rounded={4} className="mt-2" />
 *   <Skeleton height={16} width="40%" rounded={4} className="mt-1" />
 *
 * @example explicit dimensions
 *   <Skeleton width={72} height={72} rounded="full" />
 */

export interface SkeletonProps {
  /** CSS width — number (px) or string (e.g. "60%", "10rem"). Ignored when `aspect` is set. */
  width?: string | number;
  /** CSS height — number (px) or string. Ignored when `aspect` is set. */
  height?: string | number;
  /** Border radius — number (px) or `"full"` for a pill/circle. Default 4px. */
  rounded?: number | "full";
  /** Aspect-ratio preset. When set, takes over the `width`/`height` — pair with parent width. */
  aspect?: "square" | "video";
  /** Extra classes (e.g. `"mt-2"`, `"max-w-[200px]"`). */
  className?: string;
}

function toCssLength(v: string | number | undefined): string | undefined {
  if (v === undefined) return undefined;
  return typeof v === "number" ? `${v}px` : v;
}

const aspectClass: Record<NonNullable<SkeletonProps["aspect"]>, string> = {
  square: "aspect-square w-full",
  video: "aspect-video w-full",
};

export function Skeleton({
  width,
  height,
  rounded = 4,
  aspect,
  className,
}: SkeletonProps) {
  const style: React.CSSProperties = {};

  if (!aspect) {
    const w = toCssLength(width);
    const h = toCssLength(height);
    if (w) style.width = w;
    if (h) style.height = h;
  }

  style.borderRadius = rounded === "full" ? "9999px" : `${rounded}px`;

  return (
    <div
      aria-hidden="true"
      style={style}
      className={cn(
        // §10.1 — token-aligned gradient + animation. We use Tailwind's
        // `animate-shimmer` (defined in tailwind.config.js keyframes) instead of
        // the legacy `.skeleton-shimmer` CSS class, because that class hardcodes
        // its own gradient + border-radius which would override our tokens.
        // The animation here only drives `background-position`. Gradient stops
        // resolve to s-bg-sunken (#F5F5F4) → white → s-bg-sunken — canonical per
        // SOURCE.md §10.1. `prefers-reduced-motion` is handled globally in
        // globals.css line 681.
        "bg-gradient-to-r from-s-bg-sunken via-white to-s-bg-sunken",
        "bg-[length:200%_100%]",
        "animate-shimmer",
        aspect && aspectClass[aspect],
        className,
      )}
    />
  );
}
