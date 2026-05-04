"use client";

import Link from "next/link";

/**
 * EmptyStateInline — Q60 Treatment B (no-upcoming, has past, inline tile).
 *
 * NOT full-screen — past-bookings carousel (or other secondary content) renders
 * below this tile. Warm-amber dashed tile that's friendly but smaller in register
 * than the FTU treatment.
 *
 * Anatomy (locked per SOLEN_DESIGN.md §20 Q60):
 *   - warm-amber bg (`#FFF4E8`), 1px dashed `#F3D8B8` border
 *   - small line-coral SVG (~48x48 illustration)
 *   - sub-line w/ optional emphasis (e.g. "Letzter Termin: 28 Tage her bei <salon>")
 *   - smaller coral CTA (28-32px height)
 *
 * i18n: caller must localize all string props.
 */
interface EmptyStateInlineProps {
  /** Optional eyebrow above the tile (often the page-level header label) */
  eyebrow?: string;
  /** Sub-line; can be a string or ReactNode (for emphasis spans) */
  subLine: React.ReactNode;
  /** CTA label, e.g. "Wieder buchen →" */
  ctaLabel: string;
  /** Where the CTA navigates */
  ctaHref: string;
  /** Small inline SVG (~48x48 line-coral, e.g. clock anchor) */
  illustration: React.ReactNode;
  className?: string;
}

export default function EmptyStateInline({
  eyebrow,
  subLine,
  ctaLabel,
  ctaHref,
  illustration,
  className,
}: EmptyStateInlineProps) {
  return (
    <div
      className={[
        "rounded-[10px] border border-dashed px-3 py-4 flex flex-col items-center text-center",
        className ?? "",
      ].join(" ")}
      style={{ background: "#FFF4E8", borderColor: "#F3D8B8" }}
    >
      {eyebrow && (
        <span className="font-body text-[9px] font-bold uppercase tracking-[.22em] text-s-coral-text mb-2">
          {eyebrow}
        </span>
      )}
      <div className="mb-2">{illustration}</div>
      <p className="font-body text-[11px] sm:text-[12px] leading-[1.5] text-s-ink/65 max-w-[260px]">
        {subLine}
      </p>
      <Link
        href={ctaHref}
        className="mt-2.5 inline-flex items-center justify-center h-8 px-3.5 rounded-full bg-s-coral text-white font-body text-[10px] font-bold tracking-[.04em] uppercase transition-[transform,filter] duration-150 hover:brightness-[1.06] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-coral focus-visible:ring-offset-2"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
