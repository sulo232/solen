import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Reusable section header — V3 (LIVE_TRUTH §15 section header pattern).
 *
 * Used by every horizontally-scrolling homepage section (Recently Viewed,
 * Last-Minute, Nearby, 4 categories, Looks, Reviews). Anatomy:
 *
 *   ─────────────────────────────────────  ← 1px ink-1 top rule
 *   ● BEI DIR ZULETZT       letzte 5 · localStorage  ← eyebrow + meta
 *
 *   Zuletzt angesehen          Im Profil ansehen →   ← H2 + optional link
 *
 * Server component. Pure structure.
 */
export interface SectionHeaderProps {
  /** Eyebrow label (with brand-colored dot before, uppercase tracked). */
  eyebrow: string;
  /** Right-side meta text (ink-3, same uppercase tracking). Optional. */
  meta?: string;
  /** Main section title (Cooper BT 900). */
  title: string;
  /** Optional "see more" link. */
  link?: { label: string; href: string };
  className?: string;
}

export function SectionHeader({
  eyebrow,
  meta,
  title,
  link,
  className,
}: SectionHeaderProps) {
  return (
    <header className={cn("flex flex-col", className)}>
      {/* Hairline rule REMOVED 2026-05-09 — the glass section-container
          wrapper does the visual sectioning now (modern UI surface) instead
          of an editorial top-rule. */}

      {/* Eyebrow + meta row. Eyebrow now in brand-teal (modernity direction).
          Mobile stacks vertically, desktop side-by-side. */}
      <div className="mb-3 flex flex-col gap-1 font-body text-[13px] font-bold uppercase tracking-[0.18em] sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
        <span className="inline-flex items-center gap-2 whitespace-nowrap text-s-brand before:block before:h-[5px] before:w-[5px] before:rounded-full before:bg-s-brand before:content-['']">
          {eyebrow}
        </span>
        {meta && (
          <span className="whitespace-nowrap text-s-ink-2">
            {meta}
          </span>
        )}
      </div>

      {/* H2 + optional pill link */}
      <div className="flex items-baseline justify-between gap-6">
        <h2 className="font-display text-[clamp(28px,4vw,44px)] font-black leading-none tracking-[-0.02em] text-s-ink">
          {title}
        </h2>
        {link && (
          <Link
            href={link.href}
            className="shrink-0 rounded-full bg-s-brand px-4 py-2 font-body text-[13px] font-semibold text-white transition-colors hover:bg-s-brand-mid"
          >
            {link.label}
          </Link>
        )}
      </div>
    </header>
  );
}

/**
 * Horizontal scroll-snap row — V3 (LIVE_TRUTH §17 horizontal scroll row).
 *
 * Container for SalonCards in section feeds. Native scroll-snap with hidden
 * scrollbar. Cards use `scroll-snap-align: start` (already on SalonCard).
 *
 * Padding 4px y to give photos room to translateY(-1px) on hover w/o clipping.
 */
export function ScrollRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mt-4 flex gap-3 overflow-x-auto py-1 [scrollbar-width:none]",
        "[scroll-snap-type:x_mandatory] [-webkit-overflow-scrolling:touch]",
        "[&::-webkit-scrollbar]:hidden",
        // Bleed beyond container padding so first/last cards align with section gutter.
        // Mobile padding matches Section.px-5 (20px); desktop matches Section.px-8 (32px).
        "-mx-5 px-5 md:-mx-8 md:px-8",
        // 🔴 CRITICAL fix (2026-05-09): scroll-padding aligns scroll-snap-align:start
        // to the PADDING edge, not the container edge. Without this, scroll-snap
        // auto-scrolls cards' left edges flush against viewport (no gutter), and
        // any swipe attempt snaps back to the same flush state.
        "scroll-pl-5 md:scroll-pl-8",
        // Right-trailing margin on the last card so when user scrolls to the
        // end, the last card doesn't get its right corner clipped by the
        // overflow boundary.
        "[&>*:last-child]:mr-2",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Standard homepage section wrapper — gives consistent max-width + padding.
 */
export function Section({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  // Glassmorphic section container (V2-D## modernity pivot, 2026-05-09).
  // Subtle-outline mode (per user feedback "thin line... covering too much"):
  // very light fill + lighter blur, the border + rounded corners do the
  // sectioning work. Atmosphere wash bleeds through near-fully.
  return (
    <section
      className={cn(
        "relative z-[1] mx-auto max-w-[1280px]",
        "rounded-[32px] border border-white/50 bg-white/20 backdrop-blur-[10px] backdrop-saturate-[1.15]",
        "px-5 py-8 md:px-10 md:py-12 md:rounded-[40px]",
        "mb-4 md:mb-6",
        className,
      )}
    >
      {children}
    </section>
  );
}
