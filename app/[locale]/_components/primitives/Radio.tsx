"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface RadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  /** The label text or node beside the radio. */
  children?: React.ReactNode;
}

/**
 * Solen V3 radio primitive — Variant A (radio row) per LIVE_TRUTH §F.1.5.
 *
 * Used in sort sheets (§25.6), booking step-selection, B2B booking-policy single-select.
 * For compact single-select toggle groups (3-5 mutually exclusive), use
 * `<PillToggle mode="single">` instead (Variant B).
 *
 * Pair multiple `<Radio>` instances in a `<RadioGroup>` for the visual radio-list
 * container (1px border, lg radius, bottom-rule between rows). Or render standalone
 * as a single radio choice.
 *
 * @example
 * <RadioGroup>
 *   <Radio name="sort" value="distance" defaultChecked>Distanz (am nächsten zuerst)</Radio>
 *   <Radio name="sort" value="rating">Bewertung (höchste zuerst)</Radio>
 *   <Radio name="sort" value="availability">Verfügbarkeit (heute frei)</Radio>
 * </RadioGroup>
 */
export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  function Radio({ className, disabled, checked, children, id, ...props }, ref) {
    return (
      <label
        className={cn(
          "group flex items-center gap-3 cursor-pointer select-none py-[14px]",
          "font-body font-normal text-[14px] text-s-ink",
          "border-b border-s-ink/[0.05] last:border-b-0",
          "has-[:checked]:font-semibold",
          disabled && "cursor-not-allowed opacity-40",
          className,
        )}
      >
        <input
          ref={ref}
          type="radio"
          disabled={disabled}
          checked={checked}
          id={id}
          className="peer sr-only"
          {...props}
        />
        <span
          aria-hidden="true"
          className={cn(
            "relative inline-flex items-center justify-center shrink-0",
            "w-[18px] h-[18px] border-2 border-s-ink/25 bg-transparent rounded-full",
            "transition-colors duration-150 ease-snap",
            "peer-checked:border-s-brand",
            "peer-focus-visible:outline-2 peer-focus-visible:outline-s-brand peer-focus-visible:outline-offset-2",
            "group-active:scale-[0.94] [&]:transition-transform",
          )}
        >
          {/* Inner dot — 8px brand-teal, fades in 150ms */}
          <span
            className={cn(
              "block w-2 h-2 rounded-full bg-s-brand",
              "transition-transform duration-150 ease-snap",
              checked ? "scale-100" : "scale-0",
            )}
          />
        </span>
        {children && <span>{children}</span>}
      </label>
    );
  },
);

interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * Container for a list of `<Radio>` rows — provides the V3 radio-list visual:
 * 1px border, lg radius, 0 16px padding (vertical comes from each `<Radio>`).
 *
 * Native ARIA: render a `role="radiogroup"` with an `aria-labelledby` reference to
 * the visible group label (typically a `<FieldLabel>` rendered above this container).
 */
export function RadioGroup({ className, children, ...props }: RadioGroupProps) {
  return (
    <div
      role="radiogroup"
      {...props}
      className={cn(
        "bg-s-bg-base border border-s-ink/[0.06] rounded-[12px] px-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
