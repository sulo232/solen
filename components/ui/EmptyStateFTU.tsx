"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

/**
 * EmptyStateFTU — Q60 Treatment A (first-time user, never-booked, full-screen).
 *
 * Full-screen empty centered in viewport. Brand-warm moment with coral CTA.
 * Used when user has never created any entry on this list-type page
 * (no bookings, no favorites, no looks, no stamps, etc.).
 *
 * Anatomy (locked per SOLEN_DESIGN.md §20 Q60):
 *   - line-coral SVG illustration (~80x80, `stroke="#E8624A"` per Q21)
 *   - eyebrow (Figtree 700 .22em uppercase coral)
 *   - Anton headline (uppercase, 18-32px responsive)
 *   - warm sub-copy (Figtree, ink-2)
 *   - primary CTA (coral bg, white text, 99px radius)
 *
 * Pass `illustration` as a ReactNode (inline SVG) or omit to use category-default.
 *
 * i18n: caller must localize all string props.
 */
interface EmptyStateFTUProps {
  /** UPPERCASE eyebrow, e.g. "Noch keine Termine" */
  eyebrow: string;
  /** Anton uppercase headline, e.g. "Bereit für deinen ersten?" */
  headline: string;
  /** warm sub-copy, e.g. "Such einen Salon, buch einen Termin — wir kümmern uns um den Rest." */
  subCopy: string;
  /** CTA label, e.g. "Salon entdecken →" */
  ctaLabel: string;
  /** Where the CTA navigates */
  ctaHref: string;
  /** Inline SVG element (line-coral, 80x80). Caller provides a context-appropriate anchor. */
  illustration: React.ReactNode;
  className?: string;
}

export default function EmptyStateFTU({
  eyebrow,
  headline,
  subCopy,
  ctaLabel,
  ctaHref,
  illustration,
  className,
}: EmptyStateFTUProps) {
  const prefersReducedMotion = useReducedMotion();
  const enter = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, ease: [0.2, 0.8, 0.4, 1] },
      };

  return (
    <div
      className={[
        "min-h-[60vh] flex flex-col items-center justify-center text-center px-6 py-12",
        className ?? "",
      ].join(" ")}
    >
      <motion.div {...enter} className="max-w-[280px] flex flex-col items-center">
        <div className="mb-4">{illustration}</div>
        <span className="font-body text-[10px] sm:text-[11px] font-bold uppercase tracking-[.22em] text-s-coral-text">
          {eyebrow}
        </span>
        <h2 className="mt-1 font-heading text-[22px] sm:text-[28px] md:text-[32px] leading-[0.95] text-s-ink uppercase">
          {headline}
        </h2>
        <p className="mt-3 font-body text-[12px] sm:text-[13px] leading-[1.5] text-s-ink/65">
          {subCopy}
        </p>
        <Link
          href={ctaHref}
          className="mt-5 inline-flex items-center justify-center h-11 min-w-[180px] px-5 rounded-full bg-s-coral text-white font-body text-[12px] font-bold tracking-[.04em] uppercase transition-[transform,filter] duration-150 hover:brightness-[1.06] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-coral focus-visible:ring-offset-2"
        >
          {ctaLabel}
        </Link>
      </motion.div>
    </div>
  );
}
