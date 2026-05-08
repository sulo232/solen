"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface FieldLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /**
   * Render a trailing red dot 5px (`#D32F2F`) per LIVE_TRUTH §F.1.0.
   * Mutually exclusive with `optional` — `required` wins if both are passed.
   */
  required?: boolean;
  /**
   * Render a trailing "optional" tag in ink-3, lowercase, 11px.
   * Use when the field is genuinely optional in a form where most fields are required.
   */
  optional?: boolean;
  children: React.ReactNode;
}

/**
 * Solen V3 form-field label (LIVE_TRUTH §F.1.0).
 *
 * Always renders ABOVE the field, never inside (floating labels are banned per §F.1.10).
 * Avant Garde Gothic 600 12px ink-1, line-height 1.3.
 *
 * @example
 * <FieldLabel htmlFor="email" required>E-Mail-Adresse</FieldLabel>
 * <FieldLabel htmlFor="website" optional>Website</FieldLabel>
 */
export function FieldLabel({
  className,
  required,
  optional,
  children,
  ...props
}: FieldLabelProps) {
  return (
    <label
      {...props}
      className={cn(
        "font-body font-semibold text-[12px] leading-[1.3] text-s-ink",
        "inline-flex items-center gap-[6px]",
        className,
      )}
    >
      <span>{children}</span>
      {required && (
        <span
          aria-hidden="true"
          className="inline-block w-[5px] h-[5px] rounded-full bg-s-error"
        />
      )}
      {!required && optional && (
        <span className="font-normal text-[11px] text-s-ink-3 lowercase">
          optional
        </span>
      )}
    </label>
  );
}
