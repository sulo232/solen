import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion, useAnimationControls } from "motion/react";

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
   * Override the star pixel size.
   *   interactive: default 32px at size="md"; the review form uses 42px.
   *   five: opt-in override of STAR_PX, for the one site that needs a display-scale star row
   *     rather than a meta-scale one (the PDP reviews summary, owner 2026-08-15 "the stars to
   *     be more big"). Additive: every existing `five` caller passes no starPx and keeps
   *     STAR_PX exactly.
   *   compact: ignored. That mode sizes its star against the numeral beside it (A7), so a
   *     free-floating override would break the measured ink-to-cap-height ratio.
   */
  starPx?: number;
}

// `size` controls the STAR only. Text (value + count) inherits the caller's
// font-size / weight / colour, so RatingStars drops into any meta context
// (grey-regular on cards, darker on the PDP header) without overrides.
const STAR_PX: Record<RatingStarsSize, number> = { sm: 11, md: 13, lg: 16 };

// A7 (owner 2026-08-05): "make the star bigger so it matches the number beside it."
// mockup-ok: a measured correction to an existing ratio, not a new appearance decision.
//
// compact mode ONLY, because that is the mode where a star sits next to a numeral and has
// something to match. `five` and `interactive` stars stand alone and keep STAR_PX.
//
// Grounded in what this system already ships, not in a taste call. The lucide star paints
// 0.7947 of its box height (measured getBBox on the live 24x24 viewBox: y 2.000 -> 21.072),
// so the honest comparison is painted-ink height vs the numeral's cap height (measured with
// canvas actualBoundingBoxAscent in the number's own computed font), NOT box vs font-size:
//   search card + PDP header : 13px star, 14px numeral, cap 10.19 -> ink/cap 1.014  (fine)
//   home SalonCard  (sm)     : 11px star, 13px numeral, cap  9.46 -> ink/cap 0.924  (his flag)
// Two independent shipped surfaces agree on ~1.01, so that is the target. At a 13px numeral
// it needs a 12px box (ink 9.54 / cap 9.46 = 1.008); 13px would overshoot to 1.092 and make
// the home star read LARGER, relative to its number, than the search card's does.
const COMPACT_STAR_PX: Record<RatingStarsSize, number> = { sm: 12, md: 13, lg: 16 };

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
    // mockup-ok: starPx honoured here as of 2026-08-15 so one caller can render a display-scale
    // star row. No appearance change for anyone who does not pass it.
    const fivePx = starPx ?? px;
    return (
      <span
        className={cn("inline-flex items-center gap-[2px]", className)}
        aria-label={`${value} / ${max}`}
      >
        {Array.from({ length: max }).map((_, i) => (
          <Star
            key={i}
            size={fivePx}
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
      className={cn("inline-flex items-center gap-[3px]", className)}
      aria-label={count != null ? `${value}, ${count} reviews` : `${value}`}
    >
      {/* COMPACT_STAR_PX, not STAR_PX: this is the one mode with a numeral to match (A7). */}
      <Star size={COMPACT_STAR_PX[size]} stroke="none" aria-hidden className="fill-s-star" />
      <span>{value.toFixed(1)}</span>
      {count != null && <span className="text-s-accent">({count})</span>}
    </span>
  );
}
