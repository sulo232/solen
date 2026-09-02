"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
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
 *
 * Polymorphic on `href`. Omit it and this renders exactly what it always
 * has, a button type="button". Pass it and this renders a real next/link
 * Link instead, same look, same aria-label, same chevron. A back control
 * that navigates is a link, not a click handler on a button: forcing the
 * button shape there silently drops cmd/ctrl/middle-click into a new tab,
 * right-click "copy link address", Next's prefetch, and no-JS navigability.
 */
export type BackButtonVariant = "glass" | "flat";

type BackButtonBaseProps = {
  variant?: BackButtonVariant;
  /** Accessible label. No default on purpose: this primitive holds no copy,
   *  so pass your i18n string. A German default here shipped "Zurück" to
   *  English, French and Italian visitors of any caller that omitted one. */
  label?: string;
};

export type BackButtonProps =
  | (BackButtonBaseProps &
      React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined })
  | (BackButtonBaseProps & React.ComponentPropsWithoutRef<typeof Link>);

// mockup-ok: restores the exact tokens BackButton already shipped (h-11 w-11
// rounded-full, s-border + shadow-elevation-2 for the flat variant, the
// text-s-ink chevron), unchanged, only shared between the button and the new
// Link render path below so both stay visually identical, no new appearance.
const backButtonClassName = (variant: BackButtonVariant, className?: string) =>
  cn(
    "grid h-11 w-11 place-items-center rounded-full transition-[transform,background-color] duration-150 active:scale-[0.94] active:duration-[80ms] active:ease-glide",
    variant === "flat" && "border border-s-border bg-white hover:bg-s-bg-sunken shadow-elevation-2",
    className,
  );

export const BackButton = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  BackButtonProps
>(function BackButton(props, ref) {
  const glyph = (
    <ChevronLeft size={18} strokeWidth={1.9} aria-hidden className="text-s-ink" />
  );

  if (props.href !== undefined) {
    const { variant = "flat", label, className, href, ...rest } = props;
    return (
      <Link
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        aria-label={label}
        style={variant === "glass" ? FROST_GLASS : undefined}
        className={backButtonClassName(variant, className)}
        {...rest}
      >
        {glyph}
      </Link>
    );
  }

  const { variant = "flat", label, className, href: _href, ...rest } = props;
  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      type="button"
      aria-label={label}
      style={variant === "glass" ? FROST_GLASS : undefined}
      className={backButtonClassName(variant, className)}
      {...rest}
    >
      {glyph}
    </button>
  );
});
