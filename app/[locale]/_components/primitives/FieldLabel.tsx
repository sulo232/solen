"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface FieldLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /**
   * Render a trailing red dot 5px (`#DC2626`) per LIVE_TRUTH §F.1.0.
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
        // owner 2026-08-09, decision 7 of ten, verbatim "7C": the label above a field becomes a
        // larger ink question instead of small text, the Uber shape he picked from the three on
        // /dev/form-labels. 14 to 16, and the weight drops because size now carries it , two
        // emphasis signals on one element is what the emphasis budget calls flat.
        // mockup-ok: he picked C from three variants, TASTE_LOG 2026-08-09.
        "font-body text-[16px] leading-[1.3] text-s-ink",
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
        <span className="font-normal text-[12px] text-s-ink-3 lowercase">
          optional
        </span>
      )}
    </label>
  );
}
