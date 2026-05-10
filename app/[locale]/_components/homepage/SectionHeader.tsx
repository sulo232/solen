"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
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
  /** Main section title (Cooper BT 900). */
  title: string;
  /** Optional "see more" link. */
  link?: { label: string; href: string };
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  link,
  className,
}: SectionHeaderProps) {
  return (
    <header className={cn("flex flex-col", className)}>
      <SectionMeta eyebrow={eyebrow} />
      <SectionTitle title={title} link={link} />
    </header>
  );
}

/**
 * Eyebrow row — RENDERED OUTSIDE the glass section-frame.
 *
 * V2-D41-rising-panel-3 (2026-05-09): meta-text line removed per user
 * feedback ("delete these and make it more near to each other and
 * compact"). Each section is now eyebrow + title + cards, no second-line
 * meta below the eyebrow. Reduces vertical noise + tightens rhythm.
 */
export function SectionMeta({ eyebrow }: { eyebrow: string }) {
  return (
    <div className="mb-2 px-2 font-body text-[13px] font-bold uppercase tracking-[0.18em]">
      <span className="inline-flex items-center gap-2 whitespace-nowrap text-s-brand before:block before:h-[5px] before:w-[5px] before:rounded-full before:bg-s-brand before:content-['']">
        {eyebrow}
      </span>
    </div>
  );
}

/**
 * H2 + optional pill link — RENDERED INSIDE the glass section-frame.
 *
 * V2-D49m (2026-05-10) — Airbnb-style scroll-arrow mode:
 *   When `scrollRef` is passed, the right side of the title row swaps from
 *   the text "Alle X →" link to:
 *     - Mobile: a single bare ArrowRight icon (no surrounding circle), tappable
 *       to navigate to `link.href` (the see-all destination).
 *     - Desktop (md+): two emerald-on-cream circle buttons that scroll the
 *       referenced row left / right by ~80% of its visible width. The
 *       see-all text link is dropped on desktop since the circles take its
 *       slot — Airbnb does the same.
 *   When `scrollRef` is NOT passed, behaves as before (text label both viewports).
 */
export function SectionTitle({
  title,
  link,
  scrollRef,
}: {
  title: string;
  link?: { label: string; href: string };
  scrollRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);

  // Track scroll position so left/right arrow disabled-state matches reality.
  // Listener only mounts when scrollRef is provided.
  React.useEffect(() => {
    if (!scrollRef?.current) return;
    const el = scrollRef.current;
    const update = () => {
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    // Recompute when content changes width (e.g. async images load)
    const resizeObs = new ResizeObserver(update);
    resizeObs.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      resizeObs.disconnect();
    };
  }, [scrollRef]);

  const scrollByPercent = (dir: 1 | -1) => {
    const el = scrollRef?.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div className="flex items-baseline justify-between gap-6">
      <h2 className="font-body text-[clamp(22px,3.5vw,38px)] font-black leading-none tracking-[-0.02em] text-s-ink">
        {title}
      </h2>

      {/* V2-D49m: when a scrollRef is wired, render the Airbnb-style scroll
          controls. Otherwise fall back to the legacy text link. */}
      {link && scrollRef ? (
        <>
          {/* Mobile — bare arrow icon, no circle, tappable to see-all */}
          <Link
            href={link.href}
            aria-label={link.label}
            className="md:hidden shrink-0 grid h-9 w-9 -mr-2 place-items-center text-s-ink-2 transition-colors hover:text-s-ink active:scale-95 active:duration-[80ms] focus-visible:outline-2 focus-visible:outline-s-brand focus-visible:outline-offset-2 focus-visible:rounded-md"
          >
            <ArrowRight size={20} strokeWidth={2.25} aria-hidden />
          </Link>

          {/* Desktop — two emerald-on-cream circle scroll buttons */}
          <div className="hidden md:flex shrink-0 items-center gap-2">
            <ScrollCircleButton
              direction="left"
              disabled={!canScrollLeft}
              onClick={() => scrollByPercent(-1)}
            />
            <ScrollCircleButton
              direction="right"
              disabled={!canScrollRight}
              onClick={() => scrollByPercent(1)}
            />
          </div>
        </>
      ) : link ? (
        <Link
          href={link.href}
          className="shrink-0 font-body text-[13px] font-semibold text-s-brand transition-colors hover:text-s-brand-mid"
        >
          {link.label}
        </Link>
      ) : null}
    </div>
  );
}

/**
 * V2-D49m: V3-themed scroll-control circle button. Used on desktop in
 * Airbnb-style horizontal-scroll section headers. Default = white surface
 * + emerald icon + soft ink hairline. Hover = emerald-subtle bg + emerald
 * icon. Disabled (at scroll boundary) = 30% opacity, no pointer events.
 */
function ScrollCircleButton({
  direction,
  disabled,
  onClick,
}: {
  direction: "left" | "right";
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "left" ? "Zurückscrollen" : "Weiterscrollen"}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-full",
        "border border-s-ink/10 bg-white text-s-ink",
        "transition-[colors,transform,opacity] duration-200 ease-glide",
        "hover:bg-s-brand-subtle hover:border-s-brand/30 hover:text-s-brand",
        "active:scale-[0.94] active:duration-[80ms]",
        "focus-visible:outline-2 focus-visible:outline-s-brand focus-visible:outline-offset-2",
        "disabled:opacity-30 disabled:pointer-events-none",
      )}
    >
      <Icon size={16} strokeWidth={2.25} aria-hidden />
    </button>
  );
}

/**
 * Feed zone — rounded-top panel that the homepage's section feeds live in.
 * Creates the visual "we crossed from hero zone into content zone" cue,
 * inspired by the Base/SocialFi rising-panel pattern but kept in V3 palette
 * (white-glass tint with backdrop-blur, no opaque solid bg). User signed off
 * via `public/solen-v2-rising-panel.html` (2026-05-09 night).
 *
 * Anchors: rounded top corners, slightly overlaps hero's bottom (negative
 * mt), soft upward shadow emphasizes the "rising" feel. Atmosphere wash
 * still bleeds through faintly because the white tint is at 85% alpha.
 */
export function FeedZone({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative z-[2]",
        "-mt-6 md:-mt-8",
        "rounded-t-[28px] md:rounded-t-[40px]",
        // V2-D45-4 (2026-05-09): pushed BOTH white and blur up per user
        // "more glassmorphism, more white" — landed on iOS-Control-Center-
        // style frosted glass: bg-white/45 + blur 22px + saturate 1.6.
        // The 15% transparency was too see-through (read as "translucent
        // film" not "frosted glass"). Border softened to white/50 so the
        // top edge still cues the rising panel without hairline harshness.
        "border-t border-white/50",
        "bg-white/45 backdrop-blur-[22px] backdrop-saturate-[1.6]",
        "shadow-[0_-12px_32px_rgba(4,51,56,0.06)] md:shadow-[0_-16px_40px_rgba(4,51,56,0.08)]",
        // V2-D49n-fu7 (2026-05-10): bottom padding cut from pb-12/20 → pb-4/6
        // so the FeedZone's glass panel flows right into the footer instead
        // of leaving a 96px cream gap. The rounded-top of the footer's
        // emerald panel now shows the FeedZone's white-glass behind its
        // corners, not the page's cream bg — cleaner transition.
        "pt-2 pb-4 md:pt-4 md:pb-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Section-frame — STRUCTURAL container for title + content.
 *
 * V2-D41-rising-panel-3 (2026-05-09): we cycled through multiple visual
 * treatments (40% glass → no fill → solid white slab) and landed on
 * STRUCTURAL ONLY because:
 *   - FeedZone is already the rising-panel container; per-section slabs
 *     duplicated that role and felt cluttered (2 containers per section).
 *   - Slab shadows compounded with card photo + card pill shadows down
 *     the page, creating visual weight bands every section.
 *   - Eyebrow-outside / title-inside split read as 2 visual zones per
 *     section, multiplied 6× down the feed.
 *
 * Final architecture (V2-D41-rising-panel-3):
 *   FeedZone (heavy glass, the only container)
 *     └─ SectionMeta (eyebrow on glass)
 *     └─ SectionFrame (this — invisible, just padding + clip)
 *           ├─ SectionTitle (h2 + Im Profil pill on glass)
 *           └─ ScrollRow (cards w frosted-glass info pills)
 *
 * Component kept (not deleted) so the 6 section files don't need edits;
 * only structural responsibilities remain (padding for ScrollRow's
 * negative-margin bleed, overflow-hidden for card hover/translate clip).
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
        // No fill / blur / border / shadow — FeedZone owns the surface.
        // Padding preserved for ScrollRow's -mx-3/md:-mx-5 negative-margin
        // bleed trick (cards align to section edge, then clip at parent).
        // V2-D48-7: pt shaved further per user "abit more". 8→4 (mobile) / 12→8 (desktop).
        // Title now hugs the section's top edge. pb stays 16 for card breathing room.
        "px-3 pt-1 pb-4 md:px-4 md:pt-2 md:pb-4",
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
 *
 * V2-D49m (2026-05-10): now `forwardRef` so consumer sections can attach a
 * ref shared with `<SectionTitle scrollRef={ref}>` — the desktop circle
 * buttons use it to call `.scrollBy()` programmatically.
 */
export const ScrollRow = React.forwardRef<HTMLDivElement, {
  children: React.ReactNode;
  className?: string;
}>(function ScrollRow({ children, className }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        "mt-3 flex gap-3 overflow-x-auto py-1 [scrollbar-width:none]",
        // V2-D43 (Emil polish): stagger card entrance on first paint.
        // Each card fades+rises 50ms after the previous (defined in globals.css).
        // Reduced-motion users see static (no animation).
        "salon-card-stagger",
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
});

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
  // near-edge of viewport. Pushed to px-1 mobile (4px) for max card peek.
  // V2-D41-rising-panel-3: vertical compacted (py-3→py-2, mb-2→mb-1) so
  // sections sit closer together per user "more near to each other" feedback.
  return (
    <section
      className={cn(
        "relative z-[1] mx-auto max-w-[1280px] px-1 py-2 md:px-3 md:py-3",
        "mb-1 md:mb-2",
        className,
      )}
    >
      {children}
    </section>
  );
}
