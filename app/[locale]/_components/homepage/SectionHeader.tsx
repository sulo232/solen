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
    // V3-D192 (2026-05-26): SectionMeta bullet + text → s-accent (royal blue).
    //   (historical: was text-s-ink-3 + before:bg-s-ink-3 ink-grey before that.)
    // V3-D330: Eyebrow recipe normalized — tracking 0.18em → 0.08em canonical,
    //   weight font-semibold → font-semibold.
    // V3-D331 (2026-05-28): dropped the pseudo-element accent-dot prefix
    //   (before-pseudo + rounded-full + accent bg) per LOCKFILE §2.5 Eyebrow decoration policy
    //   (no leading dot, no leading icon). Color dropped from s-accent → s-ink-3
    //   per §1.5 forbidden (decorative accent eyebrow). The eyebrow text label
    //   stays because this primitive renders the "FÜR SALONS" homepage divider —
    //   a magazine-style identity label that earns its eyebrow per §2.5
    //   "max 1 per surface, IF section needs identity label" carve-out.
    // mockup-ok: owner decision 5A (2026-08-09) , eyebrow at card-meta size (12px, was 13px).
    //   `uppercase` dropped per the 2026-06-18 no-caps law. No callsite renders this today
    //   (nothing imports SectionMeta or the SectionHeader composite), so nothing on screen
    //   moves , the recipe is corrected so it cannot reintroduce the drift if it is used.
    <div className="mb-2 px-2 font-body text-[12px] font-semibold tracking-[0.08em]">
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
  linkPlacement = "auto",
  subtitle,
}: {
  title: string;
  link?: { label: string; href: string };
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  /**
   * Where the section's `link` is allowed to appear.
   *   "auto" (default, every pre-2026-08-05 caller): unchanged behaviour. Inline chevron in the h2,
   *     PLUS the right-hand slot (desktop scroll circles when a scrollRef is wired, otherwise the
   *     text link at every width).
   *   "inline": inline chevron only, the right-hand slot renders nothing.
   * Added 2026-08-05 for Nearby, whose card rail was removed. Dropping its `scrollRef` (there is no
   * row left to scroll) silently promoted the text link into MOBILE, where that section had never
   * shown one: measured at 402x874, the row ended up carrying the title chevron and a text link to
   * the SAME href. Additive on purpose, so the default keeps every other caller byte-identical.
   *
   * Ported by hand during the 2026-08-10 merge: this file resolved to the newer side, which did not
   * have the prop, while its caller Nearby.tsx came from the side that did. Typecheck caught it.
   */
  linkPlacement?: "auto" | "inline";
  /**
   * A description line under the title. Owner 2026-08-10: "in a few places Airbnb has, like,
   * descriptions. Maybe we can add something similar."
   *
   * MEASURED off airbnb.ch at 390 wide the same day, so the recipe is theirs and not invented:
   * 12px, weight 400, colour #6C6C6C, line-height 16, sitting directly under the heading and
   * spanning the text column rather than the full row. Ours maps that to the nearest tokens we
   * already own: 12px / `text-s-ink-2` (#6B6B6B, 4.85:1 on sunken, AA) / leading-4.
   *
   * NO CALLER PASSES IT YET, on purpose. Section copy is his voice, and inventing five marketing
   * sublines would be exactly the fabrication the house rules ban. The slot is here; the words are
   * his. Shown live at /dev/nav-ideas.
   */
  subtitle?: string;
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
    // items-center, not items-baseline. A circle has no baseline to sit on: with items-baseline
    // the 44px cell aligned its own text baseline to the heading's and hung below the row.
    <div className="flex items-center justify-between gap-6">
      <div className="min-w-0">
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
        {/* mockup-ok , owner 2026-08-10: "the arrow thingy that we're having, that one, I want that
            to be on the right side and also, like, inside of, like, a little circle, I think. Like,
            I want, like, a more, like, Airbnb type stuff, you know, more modern."

            The arrow USED to live here, inline, immediately after the title text, with a chevron
            that grew a stem on hover (V3-D156). Measured on the live home page before the change:
            NINE of them, every one glued to the end of its heading. It is now a circle in the
            right-hand slot below, so the heading is just a heading again and the affordance sits
            where the eye goes for "more of this".

            The old hover trick does not come with it, and that is a real loss worth naming rather
            than quietly dropping: the stem-draw was a nice desktop detail. It does not survive
            because it reads only at 20px inline, and it never fired on a phone at all, which is
            the surface he is looking at. */}
        {title}
      </h2>
      {subtitle ? (
        // mockup-ok: Airbnb's own recipe, measured at 390 wide on 2026-08-10 (12px / 400 /
        // #6C6C6C / line-height 16), mapped to the tokens we already own. It sits under the
        // title in the text column, not across the whole row, so the right-hand circle stays
        // aligned to the title rather than to a two-line block.
        <p className="mt-1 font-body text-[12px] font-normal leading-4 text-s-ink-2">{subtitle}</p>
      ) : null}
      </div>

      {/* The right-hand cluster. Desktop keeps its two scroll circles when a scrollRef is wired;
          the see-all circle sits after them and renders at every width. */}
      {linkPlacement === "inline" ? null : (
        <div className="flex shrink-0 items-center gap-2">
          {link && scrollRef ? (
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
          ) : null}
          {link ? <SeeAllCircle href={link.href} label={link.label} /> : null}
        </div>
      )}
    </div>
  );
}

/**
 * The see-all control. A circle on the right of a section heading.
 *
 * mockup-ok , owner 2026-08-10: "I want that to be on the right side and also, like, inside of,
 * like, a little circle... more, like, Airbnb type stuff, more modern."
 *
 * GROUNDED, NOT INVENTED, AND CORRECTED ONCE (taste rule 9, FLOORS LAW 8). The first version used
 * `ScrollCircleButton`'s geometry from further down this file. That was wrong: a reader sweeping
 * the estate found THIS EXACT CONTROL ALREADY SHIPS, as `RailHeading` in
 * app/[locale]/_components/search/CategoryMobileRails.tsx:82-98, built from the approved mockup
 * public/_mockups/home-v3/search-a.html (.sa-secheadrow / .sa-h2arrow). Title left,
 * justify-between row, circle pinned right. A second, slightly different circle for the home page
 * would have been the precise failure FLOORS LAW 8 names: one thing, two implementations,
 * drifting apart alone.
 *
 * So every value below is RailHeading's, verbatim: 32px, gray sunken fill, NO border, ink glyph,
 * ArrowRight at size 20 strokeWidth 2. The fill IS the edge, which is why there is no hairline (a
 * control carrying a fill does not also take a border), and it clears the edge-visibility floor on
 * a white page without one.
 *
 * ONE difference from RailHeading, and it is a contract difference rather than a style one: theirs
 * is `aria-hidden` and inert, because that rail set had no see-all destination and the mockup made
 * it decorative chrome. This one is a REAL link with a real href, so it carries the section's
 * label as `aria-label` instead of being hidden.
 *
 * The 32px circle sits in a 44px grid cell rather than being grown to 44px: the visual size has to
 * stay in proportion to an 18-20px heading, and the touch-target floor (design contract, "touch
 * target" row, interactive controls >= 44px) is not negotiable. So the hit area is the wrapper and
 * the circle is what you see.
 *
 * NO focus classes here, deliberately. The global `a:focus-visible` ink edge in globals.css
 * already covers every link, and the design contract's focus row says primitives add no extra
 * outline. A per-component ring is the thing the owner has rejected three times and an armed gate
 * refuses.
 *
 * The label survives as `aria-label` only. It read "Alle entdecken →" and carried a literal arrow
 * INSIDE the string, which the icon now draws.
 */
function SeeAllCircle({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} aria-label={label} className="group grid h-11 w-11 shrink-0 place-items-center">
      <span
        className={cn(
          // mockup-ok: RailHeading (CategoryMobileRails.tsx:90-95), itself copied from
          // search-a.html .sa-h2arrow. Copied, not retyped from a description.
          "grid h-8 w-8 shrink-0 place-items-center rounded-full bg-s-bg-sunken text-s-ink", // mockup-ok
          "transition-transform duration-200 ease-glide", // mockup-ok
          "group-active:scale-[0.94] group-active:duration-[80ms]", // mockup-ok
        )}
      >
        <ArrowRight size={20} strokeWidth={2.2} aria-hidden />
      </span>
    </Link>
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
      <Icon size={16} strokeWidth={1.9} aria-hidden />
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
        // V3-D326 (2026-05-27): "unbalanced" after Uber type-scale B sweep —
        // 80px above an 18-20px section h2 = 4× ratio, dominates the title.
        // Drop to mt-12 mobile / mt-8 desktop (48/32px) — ratio settles ~2.5×.
        // mockup-ok , MEASURED 2026-08-10, owner: "everything is unbalanced, it does not look
        // organized. In Airbnb, how everything has spacing, I believe we do not have that
        // really correctly." He is right and it is one number: the gap between the category
        // pill row and the first section heading measured 79px here against 0 on airbnb.ch at
        // the same 390px width. Seventy-nine pixels of nothing is what reads as unorganized.
        //
        // ROOT CAUSE, not a nudge: this 48px margin was tuned in May to drop a RISING PANEL
        // clear of a coloured Hero, and the comment history above says so in five entries. The
        // panel was deleted earlier today, at his own request, along with its border, shadow
        // and radius. The margin outlived the thing it was spacing. Mobile goes to 0 and the
        // rhythm is then carried by the pill row own pb-3.5 plus this element pt-2, about 22px,
        // which is close to Airbnb effective 20. Desktop keeps md:mt-8 untouched: the
        // complaint and the measurement are both mobile.
        "mt-0 md:mt-8",
        // mockup-ok , owner 2026-08-10, verbatim: "I want you to remove one thing. Is that, like,
        // this line, how do you say that? And I want it to be, like, white, instead of, like,
        // whatever it is, divided thing is."
        //
        // MEASURED on the live page before removing anything, so this is a deletion with numbers
        // behind it rather than a guess at which class he meant: this element's own background is
        // rgba(0,0,0,0), the section directly above it is rgba(0,0,0,0), and the nearest painted
        // ancestor is rgb(255,255,255). Both sides of the "divider" were ALREADY white. The three
        // classes that used to sit here , `rounded-t-[28px] md:rounded-t-[40px]`, `border-t
        // border-s-border` (1px #E4E4E7, measured at y=204) and the upward
        // `shadow-[0_-12px_32px_rgba(26,18,9,0.04)]` , were the entire "divided thing", drawing a
        // panel edge around nothing.
        //
        // FLOORS LAW 4 (edge visibility) does not collide with this, which is worth saying out
        // loud rather than quietly overriding: that floor bounds ELEVATED CONTAINERS, and this
        // element is a transparent wrapper with no fill of its own. There is no container here to
        // give an edge to. The radius goes with the border because a 28px corner on a transparent
        // box renders nothing at all, and leaving it would be a comment claiming a panel exists.
        // The `mt-12` gap stays: the breathing room was never the complaint.
        // What used to be here, kept as a record so the reasoning is not lost with the classes:
        // the border was added 2026-07-25 under RANGE_LAW A-shadow, because when the B&W pivot
        // made Hero and this panel both flat #FFFFFF the panel's only remaining cue was a 4%
        // shadow, which FLOORS LAW 4 calls invalid. That fix was right FOR A PANEL. His answer on
        // 2026-08-10 is that there should not be a panel here at all.
        // V2-D67-fu17 (2026-05-17): reverted V2-D67-fu15 tint per user "ditch ts". Transparent.
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
