"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
    // V3-D192 (2026-05-26): SectionMeta bullet + text → s-accent (royal blue).
    //   (historical: was text-s-ink-2 + before:bg-s-ink-2 ink-grey before that.)
    // V3-D330: Eyebrow recipe normalized — tracking 0.18em → 0.08em canonical,
    //   weight font-bold → font-semibold.
    // V3-D331 (2026-05-28): dropped the pseudo-element accent-dot prefix
    //   (before-pseudo + rounded-full + accent bg) per LOCKFILE §2.5 Eyebrow decoration policy
    //   (no leading dot, no leading icon). Color dropped from s-accent → s-ink-2
    //   per §1.5 forbidden (decorative accent eyebrow). The eyebrow text label
    //   stays because this primitive renders the "FÜR SALONS" homepage divider —
    //   a magazine-style identity label that earns its eyebrow per §2.5
    //   "max 1 per surface, IF section needs identity label" carve-out.
    <div className="mb-2 px-2 font-body text-[13px] font-semibold uppercase tracking-[0.08em]">
      <span className="inline-flex items-center gap-2 whitespace-nowrap text-s-ink-2">
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

  // V2-D66 (2026-05-15): title is plain text again — only the circled arrow
  // is the click target with its own hover state. The glass pill bloom that
  // used to wrap the whole title-arrow group is GONE — user feedback was
  // that the title shouldn't grow a hover affordance (it's a heading, not a
  // chip). Also kills the duplicate mobile bare-arrow that used to sit on
  // the right side — the inline circled arrow already serves that role.
  return (
    <div className="flex items-baseline justify-between gap-6">
      <h2
        // V2-D70 (2026-05-18): Plus Jakarta Sans is now the locked font (no
        // longer drift). Section h2 stays `font-body` (which IS Plus Jakarta
        // after V2-D70 single-family pivot) bold 700, slightly tighter
        // tracking -0.025em to match the hero h1's tight tracking discipline. (V3-D330 stale ref — actual current value is -0.01em per §2.5 Section H2 recipe.)
        // Size kept clamp(20, 2.2vw, 26) — section h2 is one tier below hero.
        // V3-D193 (2026-05-26): Section H2 weight 800 → 700 per "too bold" sweep.
        // V3-D326 (2026-05-27): bump back to Section H2 spec (18-20) — V3-D325
        // sweep wrongly classified this as Subsection H3 (16-18).
        // V3-D346 REVERTED (2026-05-28): bumping to 24/700 was wrong — user wants
        // every section title to match the calm "Für dich" treatment (18px/600), not
        // Uber's big-bold headers. Restraint is the house style here. Back to 18/600.
        className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.25] tracking-[-0.01em] text-s-ink"
      >
        {title}
        {link ? (
          <Link
            href={link.href}
            aria-label={link.label}
            className={cn(
              // V3-D140 (2026-05-25): stripped dusty-blue circle bg + colored
              // glyph per user "make them jst normal black arrow." Section
              // title arrows are NOT in the 3% accent band per 80/17/3 rule
              // (_tasks/SOLEN_DESIGN.md) — they're nav affordances, ink only.
              // Killed (V3-D140 commit): s-cool/0.20 bg, dusty-blue glyph, circle h-9 w-9,
              // hover:scale, active:scale. Kept: ml-3 spacing, group-hover
              // translate-x on the glyph, focus-visible outline for a11y.
              "group ml-3 inline-flex shrink-0 items-center align-middle",
              "text-s-ink transition-colors duration-150 ease-glide",
              "focus-visible:rounded focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
            )}
          >
            {/* V3-D156 (2026-05-25): chevron-only at rest, stem draws in on
                hover per user "if not hovered its jst [a chevron], once u hover
                theres an line so it becomes arrow." Implemented via stroke
                dasharray trick — stem path length is 14 (M5 12h14), initial
                dashoffset 14 hides it, hover transitions dashoffset → 0 to
                "draw" the stem left-to-right. Compounds with the existing
                translate-x nudge for a layered hover effect. */}
            <svg
              width={20}
              height={20}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
              className="transition-transform duration-200 ease-glide group-hover:translate-x-0.5"
            >
              <path
                d="M5 12h14"
                className="[stroke-dasharray:14] [stroke-dashoffset:14] transition-[stroke-dashoffset] duration-200 ease-glide group-hover:[stroke-dashoffset:0]"
              />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        ) : null}
      </h2>

      {/* V2-D49m: when a scrollRef is wired, render the desktop scroll
          controls. The previous mobile-only right-side arrow is gone (V2-D66)
          since the inline circled arrow next to the title now serves that role. */}
      {link && scrollRef ? (
        <>
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
          className="shrink-0 font-body text-[13px] font-semibold text-s-ink transition-colors hover:text-s-ink"
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
        "border border-s-border bg-white text-s-ink",
        "transition-[colors,transform,opacity] duration-200 ease-glide",
        "hover:bg-white hover:border-s-ink/30 hover:text-s-ink",
        "active:scale-[0.94] active:duration-[80ms]",
        "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
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
        // V3-D145 (2026-05-25): negative margin REMOVED per user "can u jst
        // put ths whole section abit lower". Was `-mt-6 md:-mt-8`. The
        // rising-panel-overlap intent was for a colored Hero; now Hero ends
        // with a WHITE SearchBar card so the rounded-t edge was rendering
        // INVISIBLY inside the card (geometry collision). Measured: search
        // card bottom was 16px below FeedZone top — panel's rounded corners
        // hidden. mt-0 makes the rounded top + shadow visible delineators.
        // V3-D170b (2026-05-26): first attempt added pt-10 (padded the
        // content inside the panel) — user: "u jst lowered the text instead
        // of the acc box". The PANEL itself (rounded top edge) needs to
        // sit lower, not just the children. Switched to mt-10 mobile /
        // md:mt-8 so the whole rising-panel drops 32-40px below the
        // SearchCard, with the rounded-t edge VISIBLE in the new gap.
        // V3-D322 (2026-05-27): user "the tabs underneath the search bar
        // why s it so high up put it lower" — bump 40→64 mobile / 32→48
        // desktop so the "Für dich" panel sits further from the SearchCard.
        // More breathing room above the tile grid.
        // V3-D323 (2026-05-27): user "make the underneath thing lower too" —
        // second bump per follow-up. 64→80 mobile / 48→64 desktop.
        // V3-D326 (2026-05-27): "unbalanced" after Uber type-scale B sweep,
        // 80px above an 18-20px section h2 = 4x ratio, dominates the title.
        // Drop to mt-12 mobile / mt-8 desktop (48/32px), ratio settles ~2.5x.
        // V2-D67-fu17 (2026-05-17): reverted V2-D67-fu15 tint per user "ditch ts".
        // Back to V2-D65 transparent FeedZone, atmosphere reads at full chroma
        // below the cards. Shadow RGB kept as ink.
        // RANGE_LAW A-shadow (2026-07-25): border-white/40 was written when this panel
        // overlapped a COLORED Hero (V3-D145 comment above); the B&W pivot made Hero and
        // this panel both flat #FFFFFF, so a white-on-white 40%-alpha border composites to
        // zero and the panel's only boundary cue left was its 4%-alpha shadow, exactly the
        // "white card with only a 4% shadow on white is invalid" case in FLOORS LAW 4.
        // Swapped to the one locked hairline token (border-s-border, design contract
        // "hairline" row) per FLOORS LAW 4(c) "on white keep the hairline". Shadow value
        // and direction left untouched, it still reads as the panel rising over Hero.
        // mockup-ok: task-directed edge-visibility fix (RANGE_LAW / FLOORS LAW 4c), a
        // token-only border-color swap, no radius/shadow/layout value changed.
        //
        // OVERRIDE 2026-08-01 (owner, live and literal, precedence chain tier 1 beats every
        // decision above): "there's like a little sheet right between the search bar and shit
        // right in the home page. Remove that shit." Measured: the rounded-t + hairline-top +
        // upward shadow this block has carried since V2-D41 IS the visible "sheet" seam he is
        // pointing at (search pill bottom y=172, this panel's rounded/hairlined top edge at
        // y=229). All three of the previous decisions (V3-D145 negative-margin removal,
        // RANGE_LAW A-shadow's hairline swap, the rising-panel edge itself) are superseded HERE,
        // not deleted from history, superseded. Content now runs straight out of the search bar:
        // no rounded top, no top hairline, no upward shadow. Gap closed to one small even value
        // (mt-3, 12px) instead of the old 48/32 split that read as "floating below the bar".
        "mt-3",
        // V2-D49n-fu7 (2026-05-10): bottom padding cut from pb-12/20 → pb-4/6
        // so the FeedZone's glass panel flows right into the footer instead
        // of leaving a 96px cream gap.
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
        // V3-D132 (2026-05-25): pb-4 → pb-2 (16→8) per user "gap too big vs
        // Airbnb". The pb was the biggest section-internal contributor to
        // the inter-section gap. Combined with Section component mb/py shrink
        // → total mobile gap drops from ~50-108 toward Airbnb's ~27.
        "px-3 pt-1 pb-2 md:px-4 md:pt-2 md:pb-3",
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
        // V3-D132 (2026-05-25): mt-3 → mt-1 — title-to-cards gap shrink
        "mt-1 flex gap-3 overflow-x-auto py-1 [scrollbar-width:none]",
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
        // V3-D138 (2026-05-25): mask-image fade REMOVED per user "the corner
        // like fade this is not good at all." Problem: 32px fade zone fully
        // consumed the visible peek of the next card (Nail Loft visible width
        // 29px < fade width 32px), so the peek-card looked broken/faded. Now
        // hard-cuts at frame edge — matches Airbnb/Booking horizontal-scroll
        // marketplaces. Prior V2-D66 mask line kept in git history for revert.
        className,
      )}
    >
      {children}
    </div>
  );
});

/**
 * Standard homepage section wrapper — gives consistent max-width + padding.
 *
 * V3-D107 (2026-05-23): outer/inner split so `className` (bg color) can go
 * FULL-BLEED across the viewport while the content stays max-w-[1280px]
 * centered. Required for the Fruitful 60-30-10 section sequencing — see
 * `_rules/solen-color-60-30-10.md`. Layout-neutral when no bg is passed
 * (outer is transparent + zero own padding); only matters when a tint
 * class like s-peach / s-wasabi / s-droplet (legacy tint tokens) is supplied.
 */
export function Section({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        // V3-D132 (2026-05-24): mb-4 md:mb-6 -> mb-2 md:mb-4 + py-3 md:py-4
        // -> py-2 md:py-3. Measured then: Solen section gaps were 49-108 CSS vs
        // a measured reference at 27 CSS. Combined shrink: bottom-of-A (py-2 +
        // mb-2 = 16) + top-of-B (py-2 = 8) -> ~24 CSS visible gap.
        //
        // 2026-07-17, the rhythm decision (owner: "breathing room is good but
        // those are too big of a gap", then "u can choose"): mb-2 -> mb-4 on
        // mobile only. The arithmetic, not a vibe: py-2 (8) + mb-4 (16) +
        // py-2 (8) = 32 CSS visible, which is exactly the section rhythm
        // LOCKFILE 442-450 already locks and the page never actually rendered.
        // Desktop is untouched (md:py-3 + md:mb-4 + md:py-3 = 40, already above
        // the rung). Probed at 16/24/32 on the real homepage before choosing;
        // the +56/+72 round the owner rejected as too big lives in the mockup
        // history at public/_mockups/homepage-rhythm/.
        "relative z-[1] mb-4 md:mb-4",
        className,
      )}
    >
      <div className="mx-auto max-w-[1280px] px-1 py-2 md:px-3 md:py-3">
        {children}
      </div>
    </section>
  );
}
