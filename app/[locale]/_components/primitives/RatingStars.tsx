import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion, useAnimationControls } from "framer-motion";

/**
 * RatingStars - the canonical rating display and interactive input (CONTRADICTIONS.md §4).
 * Layer 3 (semantic): the star is yellow because rating IS the message
 * (s-star #FFC32B per the universal-colour table); NOT part of the 3% accent budget.
 *
 * Replaces ~14 hand-rolled `<Star className="fill-s-star" /> {value}` blocks +
 * 5 raw `<svg><polygon>` five-star renders. Three modes cover every site:
 *   compact     - one star + value (+ optional count), e.g. salon cards, PDP header
 *   five        - N stars filled to value, e.g. an individual review row
 *   interactive - tappable star input (role="radiogroup"), e.g. review-write form
 */
export type RatingStarsSize = "sm" | "md" | "lg";

export interface RatingStarsProps {
  /** Rating value, e.g. 4.8. Integer for interactive mode. */
  value: number;
  /** Optional review count, rendered as "(16)" in muted ink. compact mode only. */
  count?: number;
  /**
   * `compact` (default) = one star + value.
   * `five` = `max` stars filled to value.
   * `interactive` = tappable star input (role="radiogroup").
   */
  mode?: "compact" | "five" | "interactive";
  size?: RatingStarsSize;
  /** Star count for `five` and `interactive` modes. Default 5. */
  max?: number;
  className?: string;
  /**
   * interactive mode only. Called with the chosen star value (1..max).
   */
  onChange?: (v: number) => void;
  /**
   * interactive mode only. Override the star pixel size (default 32px when
   * size="md"; the review form uses 42px).
   */
  starPx?: number;
}

// `size` controls the STAR only. Text (value + count) inherits the caller's
// font-size / weight / colour, so RatingStars drops into any meta context
// (grey-regular on cards, darker on the PDP header) without overrides.
const STAR_PX: Record<RatingStarsSize, number> = { sm: 11, md: 13, lg: 16 };

// Interactive star default sizes (larger than display stars).
const INTERACTIVE_STAR_PX: Record<RatingStarsSize, number> = { sm: 24, md: 32, lg: 40 };

// Single interactive star: pops exactly once when it transitions from
// unfilled to filled. Imperative controls mean framer-motion never
// re-triggers the animation on hover or unrelated re-renders.
function InteractiveStar({
  starNum,
  filled,
  px,
  reduced,
  delay,
  onTap,
}: {
  starNum: number;
  filled: boolean;
  px: number;
  reduced: boolean;
  delay: number;
  onTap: () => void;
}) {
  const controls = useAnimationControls();
  const prevFilledRef = React.useRef(filled);

  React.useEffect(() => {
    if (!reduced && filled && !prevFilledRef.current) {
      controls.start({
        scale: [1, 1.38, 1],
        transition: { delay, duration: 0.45, ease: [0.34, 1.56, 0.64, 1] },
      });
    }
    prevFilledRef.current = filled;
  }, [filled, reduced, delay, controls]);

  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={filled}
      aria-label={`${starNum} star${starNum > 1 ? "s" : ""}`}
      onClick={onTap}
      className="p-1 rounded focus-visible:bg-s-bg-sunken"
      whileTap={reduced ? {} : { scale: 0.85 }}
      animate={controls}
    >
      <Star
        size={px}
        strokeWidth={1.2}
        className={filled ? "fill-s-star text-s-star" : "fill-transparent text-s-border"}
      />
    </motion.button>
  );
}

// Inner component for interactive mode - needs access to useReducedMotion hook.
function InteractiveStars({
  value,
  max,
  px,
  onChange,
  className,
}: {
  value: number;
  max: number;
  px: number;
  onChange?: (v: number) => void;
  className?: string;
}) {
  const reduced = useReducedMotion() ?? false;

  return (
    <div
      role="radiogroup"
      aria-label="Rating"
      className={cn("flex gap-1", className)}
    >
      {Array.from({ length: max }).map((_, i) => {
        const starNum = i + 1;
        const filled = value >= starNum;
        return (
          <InteractiveStar
            key={i}
            starNum={starNum}
            filled={filled}
            px={px}
            reduced={reduced}
            delay={i * 0.07}
            onTap={() => onChange?.(value === starNum ? 0 : starNum)}
          />
        );
      })}
    </div>
  );
}

export function RatingStars({
  value,
  count,
  mode = "compact",
  size = "md",
  max = 5,
  className,
  onChange,
  starPx,
}: RatingStarsProps) {
  const px = STAR_PX[size];

  if (mode === "interactive") {
    const interactivePx = starPx ?? INTERACTIVE_STAR_PX[size];
    return (
      <InteractiveStars
        value={value}
        max={max}
        px={interactivePx}
        onChange={onChange}
        className={className}
      />
    );
  }

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
