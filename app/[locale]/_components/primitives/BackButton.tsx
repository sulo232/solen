"use client";

import * as React from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { FROST_GLASS } from "@/lib/frost-glass";

/**
 * BackButton — the canonical back affordance (CONTRADICTIONS.md §4).
 * Layer 1 (chrome). Variant follows CONTROL_ELEVATION (V3-D420):
 *   glass — sits OVER a photo (hero, gallery); frosted white via shared FROST_GLASS
 *   flat  — on calm white/stone chrome; white + hairline, sink on hover, no shadow
 *
 * Replaces 4 hand-rolled frosted back buttons (SalonHero, SalonStickyTabNav,
 * BookingWizard, Breadcrumb).
 */
export type BackButtonVariant = "glass" | "flat";

export interface BackButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BackButtonVariant;
  /** Accessible label. No default on purpose: this primitive holds no copy,
   *  so pass your i18n string. A German default here shipped "Zurück" to
   *  English, French and Italian visitors of any caller that omitted one. */
  label?: string;
}

export const BackButton = React.forwardRef<HTMLButtonElement, BackButtonProps>(
  function BackButton({ variant = "flat", label, className, ...props }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        style={variant === "glass" ? FROST_GLASS : undefined}
        className={cn(
          "grid h-10 w-10 place-items-center rounded-full transition-[transform,background-color] duration-150 active:scale-[0.94] active:duration-[80ms] active:ease-glide",
          variant === "flat" && "border border-s-border bg-white hover:bg-s-bg-sunken",
          className,
        )}
        {...props}
      >
        <ArrowLeft size={18} strokeWidth={1.9} aria-hidden className="text-s-ink" />
      </button>
    );
  },
);
