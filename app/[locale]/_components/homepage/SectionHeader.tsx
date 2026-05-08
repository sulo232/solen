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
      <SectionMeta eyebrow={eyebrow} meta={meta} />
      <SectionTitle title={title} link={link} />
    </header>
  );
}

/**
 * Eyebrow + meta row — RENDERED OUTSIDE the glass section-frame so the
 * frame can be a smaller, content-tight rounded box per user feedback
 * (2026-05-09: "thin line... covering too much area").
 */
export function SectionMeta({ eyebrow, meta }: { eyebrow: string; meta?: string }) {
  return (
    <div className="mb-3 flex flex-col gap-1 px-2 font-body text-[13px] font-bold uppercase tracking-[0.18em] sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <span className="inline-flex items-center gap-2 whitespace-nowrap text-s-brand before:block before:h-[5px] before:w-[5px] before:rounded-full before:bg-s-brand before:content-['']">
        {eyebrow}
      </span>
      {meta && <span className="whitespace-nowrap text-s-ink-2">{meta}</span>}
    </div>
  );
}

/**
 * H2 + optional pill link — RENDERED INSIDE the glass section-frame.
 */
export function SectionTitle({
  title,
  link,
}: {
  title: string;
  link?: { label: string; href: string };
}) {
  return (
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
  );
}

/**
 * Glass section-frame — wraps title + content (NOT the meta above).
 * Smaller than the page-edge-to-edge container we had before; meta floats
 * above in the page-flow per user feedback ("not eyebrow above, just title
 * and cards inside the glass").
 */
export function SectionFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        // Glass: 40% white + 18px blur + 1.25 saturate (kept from previous).
        "rounded-[20px] border border-white/55 bg-white/40 backdrop-blur-[18px] backdrop-saturate-[1.25]",
        // Minimal padding (was px-3 py-4 md:px-5 py-5). Both axes pushed
        // to near-zero "nearness" per user feedback. Cards now have
        // maximum room → 2 full + sliver of 3rd visible on 375px viewport.
        "px-3 py-4 md:rounded-[24px] md:px-4 md:py-4",
        // overflow-hidden clips card-bleed at the rounded border.
        "overflow-hidden",
        className,
      )}
    >
      {children}
    </div>
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
        // Negative margin matches the new SectionFrame padding (px-3 mobile /
        // px-5 desktop) — so cards bleed up to the frame's rounded border but
        // not past it. SectionFrame has overflow-hidden, so any visual escape
        // gets clipped at the rounded edge.
        "-mx-3 px-3 md:-mx-5 md:px-5",
        // scroll-padding aligns scroll-snap-align:start to the padding edge
        "scroll-pl-3 md:scroll-pl-5",
        // Right-trailing margin on the last card so it has rest space at the
        // end of the scroll without its right corner clipped.
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
  // Outer Section — minimal padding so the SectionFrame inside reaches
  // near-edge of viewport. Both axes "matching nearness" per user feedback.
  return (
    <section
      className={cn(
        "relative z-[1] mx-auto max-w-[1280px] px-2 py-3 md:px-4 md:py-4",
        "mb-2 md:mb-3",
        className,
      )}
    >
      {children}
    </section>
  );
}
