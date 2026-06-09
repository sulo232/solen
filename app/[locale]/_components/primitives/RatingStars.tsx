import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * RatingStars — the canonical rating display (CONTRADICTIONS.md §4).
 * Layer 3 (semantic): the star is yellow because rating IS the message
 * (s-star #FFC32B per the universal-colour table); NOT part of the 3% accent budget.
 *
 * Replaces ~14 hand-rolled `<Star className="fill-s-star" /> {value}` blocks +
 * 5 raw `<svg><polygon>` five-star renders. Two modes cover every site:
 *   compact — one star + value (+ optional count), e.g. salon cards, PDP header
 *   five    — N stars filled to value, e.g. an individual review row
 */
export type RatingStarsSize = "sm" | "md" | "lg";

export interface RatingStarsProps {
  /** Rating value, e.g. 4.8. */
  value: number;
  /** Optional review count, rendered as "(16)" in muted ink. */
  count?: number;
  /** `compact` (default) = one star + value. `five` = `max` stars filled to value. */
  mode?: "compact" | "five";
  size?: RatingStarsSize;
  /** Star count for `five` mode. Default 5. */
  max?: number;
  className?: string;
}

// `size` controls the STAR only. Text (value + count) inherits the caller's
// font-size / weight / colour, so RatingStars drops into any meta context
// (grey-regular on cards, darker on the PDP header) without overrides.
const STAR_PX: Record<RatingStarsSize, number> = { sm: 11, md: 13, lg: 16 };

export function RatingStars({
  value,
  count,
  mode = "compact",
  size = "md",
  max = 5,
  className,
}: RatingStarsProps) {
  const px = STAR_PX[size];

  if (mode === "five") {
    const filled = Math.round(value);
    return (
      <span
        className={cn("inline-flex items-center gap-[2px]", className)}
        aria-label={`${value} / ${max}`}
      >
        {Array.from({ length: max }).map((_, i) => (
          <Star
            key={i}
            size={px}
            stroke="none"
            aria-hidden
            className={i < filled ? "fill-s-star" : "fill-s-border"}
          />
        ))}
      </span>
    );
  }

  return (
    <span
      className={cn("inline-flex items-center gap-[3px] tabular-nums", className)}
      aria-label={count != null ? `${value}, ${count} reviews` : `${value}`}
    >
      <Star size={px} stroke="none" aria-hidden className="fill-s-star" />
      <span>{value.toFixed(1)}</span>
      {count != null && <span className="text-s-accent">({count})</span>}
    </span>
  );
}
