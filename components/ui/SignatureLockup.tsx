"use client";

import { cn } from "@/lib/utils";

/**
 * SignatureLockup — Q48 (locked 2026-05-02) brand fingerprint primitive.
 *
 * The signature combo: tracked-uppercase coral eyebrow + Anton uppercase headline.
 * This combo IS Solen's brand fingerprint — it appears on every page header
 * (home above-fold, profile, salon detail, booking wizard, dashboard, empty states,
 * confirmation screens, every section header).
 *
 * Anatomy:
 *   - Eyebrow: Figtree 700, 9-11px, .18-.22em tracking, UPPERCASE, coral `#E8624A` (locked)
 *   - Headline: Anton, 18-72px responsive, UPPERCASE (Anton is always uppercase),
 *     line-height 0.95, letter-spacing 0.01em
 *   - Optional sub-line: Figtree, 13-15px, ink-2 (warm secondary)
 *
 * Sizes (matches the Q48 viewport scale):
 *   - sm:    Anton 18-22px → small section headers, modal headers
 *   - md:    Anton 22-32px → standard page headers (default)
 *   - lg:    Anton 32-48px → home above-fold, salon detail hero
 *   - xl:    Anton 48-72px → marketing hero, partner block
 *
 * i18n: caller localizes all strings.
 */
type Size = "sm" | "md" | "lg" | "xl";

const SIZE_CLASSES: Record<
  Size,
  { eyebrow: string; headline: string; subLine: string; gap: string }
> = {
  sm: {
    eyebrow: "text-[9px] tracking-[.18em]",
    headline: "text-[18px] sm:text-[22px]",
    subLine: "text-[12px] mt-1",
    gap: "mt-1",
  },
  md: {
    eyebrow: "text-[10px] sm:text-[11px] tracking-[.20em]",
    headline: "text-[22px] sm:text-[28px] md:text-[32px]",
    subLine: "text-[13px] sm:text-[14px] mt-1.5",
    gap: "mt-1.5",
  },
  lg: {
    eyebrow: "text-[11px] sm:text-[12px] tracking-[.22em]",
    headline: "text-[32px] sm:text-[40px] md:text-[48px]",
    subLine: "text-[14px] sm:text-[15px] mt-2",
    gap: "mt-2",
  },
  xl: {
    eyebrow: "text-[12px] tracking-[.22em]",
    headline: "text-[48px] sm:text-[60px] md:text-[72px]",
    subLine: "text-[15px] sm:text-[17px] mt-3",
    gap: "mt-3",
  },
};

interface SignatureLockupProps {
  /** Tracked-uppercase coral eyebrow (e.g. "Heute · 14:30 · Studio Lina"). */
  eyebrow?: string;
  /** Anton uppercase headline. Renders as <h1> by default; override with `as`. */
  headline: string;
  /** Optional warm sub-line below the headline (Figtree, ink-2). */
  subLine?: React.ReactNode;
  /** Size scale. Default md. */
  size?: Size;
  /** Semantic heading element. Default `h1`; pass `h2`–`h6` for section headers. */
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  /** Center-align the lockup. Default left. */
  align?: "left" | "center";
  className?: string;
}

export default function SignatureLockup({
  eyebrow,
  headline,
  subLine,
  size = "md",
  as: Heading = "h1",
  align = "left",
  className,
}: SignatureLockupProps) {
  const s = SIZE_CLASSES[size];

  return (
    <div className={cn(align === "center" && "text-center", className)}>
      {eyebrow && (
        <span
          className={cn(
            "block font-body font-bold uppercase",
            s.eyebrow,
          )}
          style={{ color: "#E8624A" }}
        >
          {eyebrow}
        </span>
      )}
      <Heading
        className={cn(
          "font-heading text-s-ink uppercase leading-[0.95]",
          eyebrow && s.gap,
          s.headline,
        )}
        style={{ letterSpacing: "0.01em" }}
      >
        {headline}
      </Heading>
      {subLine && (
        <p className={cn("font-body text-s-ink/65 leading-[1.5]", s.subLine)}>
          {subLine}
        </p>
      )}
    </div>
  );
}
