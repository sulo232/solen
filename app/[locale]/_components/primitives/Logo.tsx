"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * V3 Logo — Solen wordmark (V2-D27, 2026-05-09).
 *
 * Cooper-style "Solen" wordmark + brand-teal dot accent. Replaces the V2 Bebas-Neue-with-
 * coral-dot logo (retired V2-D27). Renders via Tailwind `font-display` (Cooper BT → Sansita
 * 900 fallback) so the loaded V3 fonts apply correctly.
 *
 * For metadata / og:image / favicon use cases, `public/logo.svg` provides the same wordmark
 * as a static SVG with a fallback font chain.
 *
 * Sizes (V2-D27 lock):
 * - sm  = 18px font · 4px dot · header collapsed / mobile small
 * - md  = 28px font · 6px dot · header default / app top bar
 * - lg  = 40px font · 8px dot · marketing hero / footer
 * - xl  = 64px font · 12px dot · landing splash / brand-mark moments
 *
 * @example
 * import { Logo } from "@/app/[locale]/_components/primitives";
 *
 * <Link href="/"><Logo size="md" /></Link>
 * <Logo size="xl" tone="dark" />  // for dark backgrounds
 */
const logoVariants = cva(
  cn(
    "inline-flex items-baseline shrink-0 select-none",
    "font-display font-black leading-none",
    // V2-D42: Peace Sans natural tracking. Negative tracking crashed Peace
    // Sans's chunky letters together (logo + hero h1 looked like one blob).
    "tracking-normal",
  ),
  {
    variants: {
      size: {
        sm: "text-[18px]",
        md: "text-[28px]",
        lg: "text-[40px]",
        xl: "text-[64px]",
      },
      tone: {
        light: "text-s-ink",
        dark: "text-white",
      },
    },
    defaultVariants: {
      size: "md",
      tone: "light",
    },
  },
);

const dotVariants = cva(
  cn(
    "inline-block rounded-full shrink-0",
  ),
  {
    variants: {
      size: {
        sm: "w-1 h-1 ml-[2px] mb-[1px]",
        md: "w-1.5 h-1.5 ml-[3px] mb-[2px]",
        lg: "w-2 h-2 ml-[4px] mb-[3px]",
        xl: "w-3 h-3 ml-[6px] mb-[6px]",
      },
      tone: {
        light: "bg-s-brand",
        // On dark backgrounds, brand-teal would disappear — use brand-pale instead
        dark: "bg-s-brand-pale",
      },
    },
    defaultVariants: {
      size: "md",
      tone: "light",
    },
  },
);

export type LogoSize = NonNullable<VariantProps<typeof logoVariants>["size"]>;
export type LogoTone = NonNullable<VariantProps<typeof logoVariants>["tone"]>;

export interface LogoProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: LogoSize;
  /** `light` (default) for white substrate · `dark` for ink-1 substrate (footer, dark CTAs). */
  tone?: LogoTone;
  /** Render WITHOUT the brand-teal dot accent. Default false (dot always shows per V3 lock). */
  noDot?: boolean;
}

export function Logo({
  size = "md",
  tone = "light",
  noDot = false,
  className,
  ...props
}: LogoProps) {
  return (
    <span
      aria-label="Solen"
      role="img"
      className={cn(logoVariants({ size, tone }), className)}
      {...props}
    >
      <span aria-hidden="true">Solen</span>
      {!noDot && <span aria-hidden="true" className={dotVariants({ size, tone })} />}
    </span>
  );
}
