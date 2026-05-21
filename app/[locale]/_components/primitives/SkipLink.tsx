"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SkipLinkProps {
  /** The label shown when focused. Default "Direkt zum Inhalt". */
  label?: React.ReactNode;
  /** The anchor target. Default "#main" (matches layout `<main id="main">`). */
  href?: string;
  className?: string;
}

/**
 * Solen V3 skip-to-main link (LIVE_TRUTH §F.6).
 *
 * Mounted as the FIRST focusable child of `<body>` in `app/[locale]/layout.tsx`.
 * Hidden via `sr-only` until focused; on `:focus` / `:focus-visible`, becomes a
 * visible brand-teal pill in the top-left allowing keyboard / screen-reader users
 * to skip past the header / nav and jump straight to main content.
 *
 * Per WCAG 2.4.1 (Bypass Blocks, Level A) — required for accessibility.
 *
 * @example
 * // In app/[locale]/layout.tsx (root):
 * <body>
 *   <SkipLink />
 *   <Header />
 *   <main id="main">{children}</main>
 *   <Footer />
 * </body>
 */
export function SkipLink({
  label = "Direkt zum Inhalt",
  href = "#main",
  className,
}: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        // Hidden by default — sr-only is the standard accessibility pattern
        "sr-only",
        // On focus: become visible as a brand-teal pill in top-left
        "focus:not-sr-only focus-visible:not-sr-only",
        "focus:fixed focus:top-4 focus:left-4 focus:z-tooltip",
        "focus-visible:fixed focus-visible:top-4 focus-visible:left-4 focus-visible:z-tooltip",
        "focus:px-5 focus:py-3 focus:rounded-full",
        "focus-visible:px-5 focus-visible:py-3 focus-visible:rounded-full",
        "focus:bg-s-brand focus:text-white",
        "focus-visible:bg-s-brand focus-visible:text-white",
        "focus:font-body focus:font-semibold focus:text-[14px] focus:leading-[1.3]",
        "focus-visible:font-body focus-visible:font-semibold focus-visible:text-[14px] focus-visible:leading-[1.3]",
        "focus:no-underline",
        "focus-visible:no-underline",
        "focus:outline-2 focus:outline-s-brand focus:outline-offset-2",
        "focus-visible:outline-2 focus-visible:outline-s-brand focus-visible:outline-offset-2",
        // Animation: smooth appearance
        "transition-opacity duration-150 ease-snap",
        className,
      )}
    >
      {label}
    </a>
  );
}
