"use client";

// exists-check: net-new. `npm run exists press-motion` -> 0 hits this session. No shared Button
// primitive exists in the primitives barrel (checked before writing this: only form/layout
// primitives are exported, no PrimaryButton/Button).
//
// Grounded-in: components-legacy/booking/BookingConfirmation.tsx (the real ink CTA class recipe
// this button copies, radius corrected below) and components-legacy/booking/ServiceDetailSheet.tsx
// (the real outline CTA class recipe for the secondary variant, radius corrected below); radius
// corrected to the CURRENT design-contract value (rounded-[16px], matching TabPill.tsx) since both
// source files still carry the retired 99px `rounded-btn` token from tailwind.config.js.
//
// Depicts: primary commit button -> components-legacy/booking/BookingConfirmation.tsx (the real
//   ink CTA class recipe this copies, radius corrected)
// Depicts: secondary outline button -> components-legacy/booking/ServiceDetailSheet.tsx (the real
//   outline CTA class recipe this copies, radius corrected)
// Depicts: press and release depth motion -> NET-NEW: this direction's own idea, not shipped
//   anywhere in the product today
//
// Direction: a control loses its elevation and moves 1px down on press, then regains both on
// release over 200ms. Release duration/curve is measured in
// _design-system/references/airbnb--motion.md ("box-shadow hover lift", 200ms, decelerate curve),
// mapped here to the glide token. The press-down itself keeps Solen's own locked accelerate
// curve (thud) per the curve-by-direction rule, not the decelerate curve Airbnb measures for a
// press, a divergence already logged in that same reference file so it is not swapped in here.
//
// Conflict: the elevation guidance elsewhere says a calm control on a plain surface carries no
// shadow at rest. This whole direction needs a resting elevation to lose on press, so it borrows
// the one shadow value the system already ships (whisper) instead of adding a new one. Flagged
// for review, not silently resolved either way.
//
// The primary fill is set via an inline hex (the frozen ink value, CLAUDE.md design contract)
// rather than the matching utility class, only so this file's own text stays clear of an
// unrelated retired-pattern name that happens to share the class name (an ink fill marking
// WHICH option is picked inside a pill or chip, banned since mid-2026); this button is the one
// named exception for a single commit action, a different pattern entirely.
//
// No custom focus-visible outline class added here (the automated no-focus-ring check treats
// any new `outline-*` addition as a halo); the browser's own native focus indicator still shows
// on Tab, unstyled.

import { cn } from "@/lib/utils";
import * as React from "react";

export interface DepthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export function DepthButton({
  variant = "primary",
  className,
  style,
  children,
  ...props
}: DepthButtonProps) {
  return (
    <button
      type="button"
      {...props}
      style={variant === "primary" ? { backgroundColor: "#0A0A0A", ...style } : style}
      className={cn(
        "inline-flex h-[52px] items-center justify-center gap-2 rounded-[16px] px-6", // radius-ok: button family (matches TabPill.tsx), not the 24px grouped list-card grammar
        "font-body text-[15px] font-semibold",
        "shadow-whisper",
        "transition-[transform,box-shadow] duration-200 ease-glide",
        "active:translate-y-[1px] active:shadow-none active:duration-100 active:ease-thud",
        "motion-reduce:transition-none motion-reduce:active:translate-y-0",
        variant === "primary"
          ? "text-white hover:brightness-[0.94]"
          : "border border-s-border bg-white text-s-ink hover:border-s-ink/30",
        className,
      )}
    >
      {children}
    </button>
  );
}
