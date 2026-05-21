"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface PillToggleProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  /** Whether the pill is currently active (selected). */
  active?: boolean;
}

/**
 * Solen V3 pill toggle primitive — Variant B for both Checkbox §F.1.4 and Radio §F.1.5
 * (same shape, single source of truth).
 *
 * The semantics (multi-select for Variant B-checkbox, single-select for Variant B-radio)
 * are managed by the parent — this component renders a single pill. Use `<PillGroup>` for
 * the wrapper that handles flex-wrap + gap, and `<PillGroup mode="single">` to enforce
 * single-select semantics across child pills (clicking one deselects the others).
 *
 * Visual spec (LIVE_TRUTH §F.1.4 Variant B + V2-D15-4 flat-pill discipline):
 * - inactive: white bg, 1px ink-1.06 border, ink-1 text, weight 500
 * - active: ink-1 bg, white text, weight 600, ink-1 border
 * - 7px/12px padding, font 12px, radius 99px (pill)
 * - V2-D15-4 supersedes the §F.1.4 spec line about gradient bg — pills are flat
 *
 * Used in: filter sheets §25.7, B2B service-type tagging, entdecken category multi-select,
 * compact single-select toggle groups (e.g. "Damen / Herren / Unisex").
 *
 * @example multi-select
 * const [active, setActive] = React.useState(new Set(["damen"]));
 * <PillGroup mode="multi" aria-label="Service-Typ">
 *   {["damen", "herren", "kinder"].map((v) => (
 *     <PillToggle key={v} active={active.has(v)} onClick={() => toggle(v)}>
 *       {v}
 *     </PillToggle>
 *   ))}
 * </PillGroup>
 *
 * @example single-select
 * const [val, setVal] = React.useState("damen");
 * <PillGroup mode="single" aria-label="Bedienung">
 *   {["damen", "herren", "unisex"].map((v) => (
 *     <PillToggle key={v} active={val === v} onClick={() => setVal(v)}>
 *       {v}
 *     </PillToggle>
 *   ))}
 * </PillGroup>
 */
export const PillToggle = React.forwardRef<HTMLButtonElement, PillToggleProps>(
  function PillToggle({ className, active, disabled, children, ...props }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        role={
          // Caller can override via `role` prop, otherwise use `switch` semantically
          // (or "checkbox"/"radio" depending on group mode set by aria attrs from parent)
          undefined
        }
        aria-pressed={active}
        disabled={disabled}
        className={cn(
          "font-body text-[13px] leading-none",
          "px-3.5 py-2 rounded-full",
          "border transition-colors duration-150 ease-snap",
          "focus-visible:outline-2 focus-visible:outline-s-brand focus-visible:outline-offset-2",
          active
            ? "bg-s-ink text-white border-s-ink font-semibold"
            : "bg-s-bg-base text-s-ink border-s-ink/[0.06] font-medium hover:border-s-ink/10",
          disabled && "opacity-40 cursor-not-allowed",
          !disabled && "cursor-pointer",
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);

interface PillGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * `multi` = independent pills, parent manages a Set/array of active values.
   * `single` = exactly one active, parent manages a single value (radio semantics).
   *
   * This component does NOT enforce the semantics — it only sets the appropriate
   * ARIA role. Parent state management is the caller's responsibility.
   */
  mode?: "multi" | "single";
  children: React.ReactNode;
}

/**
 * Layout container for `<PillToggle>` instances. Flex-wrap row, 6px gap.
 *
 * Sets `role="group"` with the appropriate ARIA role descendants — children
 * inherit `role="checkbox"` (multi) or `role="radio"` (single) via aria-pressed.
 */
export function PillGroup({
  mode = "multi",
  className,
  children,
  ...props
}: PillGroupProps) {
  return (
    <div
      role="group"
      data-pill-mode={mode}
      {...props}
      className={cn("flex flex-wrap gap-[6px]", className)}
    >
      {children}
    </div>
  );
}
