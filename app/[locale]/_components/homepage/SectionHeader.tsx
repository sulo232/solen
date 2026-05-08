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
      {/* Top hairline rule — softened from solid ink to warm-gray 30% alpha
          (2026-05-09 user feedback: stark dark line felt out of place against
          the soft wash bg + cards). Still visible as a section divider but
          no longer competing with the hero's strong typography for attention. */}
      <hr className="m-0 mb-[14px] h-px border-0 bg-s-ink-3/30" aria-hidden />

      {/* Eyebrow + meta row.
          Mobile (< sm): stack vertically — long uppercase strings wrap
          horribly on narrow viewports.
          Desktop (≥ sm): side-by-side flex space-between as designed. */}
      <div className="mb-3 flex flex-col gap-1 font-body text-[13px] font-bold uppercase tracking-[0.18em] sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
        <span className="inline-flex items-center gap-2 whitespace-nowrap text-s-ink before:block before:h-[5px] before:w-[5px] before:rounded-full before:bg-s-brand before:content-['']">
          {eyebrow}
        </span>
        {meta && (
          // ink-2 (warm dark) instead of ink-3 (cool gray) — secondary info
          // stays subordinate to the eyebrow but reads warmer against the
          // wash bg.
          <span className="whitespace-nowrap text-s-ink-2">
            {meta}
          </span>
        )}
      </div>

      {/* H2 + optional link */}
      <div className="flex items-baseline justify-between gap-6">
        <h2 className="font-display text-[clamp(28px,4vw,44px)] font-black leading-none tracking-[-0.02em] text-s-ink">
          {title}
        </h2>
        {link && (
          <Link
            href={link.href}
            className="shrink-0 font-body text-[15px] font-semibold text-s-brand underline decoration-[1.5px] underline-offset-[4px]"
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
  // Mobile padding (px-5 = 20px) chosen so two 160px cards + 12px gap (332px)
  // fit cleanly inside a 375px viewport: 375 - 40 padding = 335 content area,
  // enough room for 2 full cards w/o the right edge of card 2 being clipped.
  // Desktop keeps px-8 (32px) — wider viewports have plenty of room.
  return (
    <section
      className={cn("relative z-[1] mx-auto max-w-[1280px] px-5 py-16 md:px-8", className)}
    >
      {children}
    </section>
  );
}
