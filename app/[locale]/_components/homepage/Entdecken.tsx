"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Heart, Play } from "lucide-react";
import { Section, SectionFrame, SectionTitle } from "./SectionHeader";
import { cn } from "@/lib/utils";

/**
 * Entdecken preview — V2-D62 (2026-05-15) — TikTok-only homepage variant.
 *
 * Homepage shows TikTok videos only (uniform 9:16 portrait + play button).
 * The full /entdecken route (Phase 2) ships the Pinterest mixed-media feed
 * with photo + video tiles at varied aspect ratios — that lives at the
 * destination page, not the homepage preview.
 *
 * Key behaviors carried over from V2-D49g:
 *   1. Center-zoom: card under viewport center scales 1.03 / opacity 1;
 *      neighbors scale 0.88 / opacity 0.6 (mobile) or 0.95 / 0.8 (desktop).
 *   2. Final CTA card "Alle entdecken" with same center-zoom behavior.
 *   3. Aspect-[9/16] portrait, fixed `w-[44vw] max-w-[200px]`.
 *   4. Bottom gradient inside card for overlay-text legibility.
 *
 * V2-D62 deltas vs V2-D49g:
 *   - Demo data: real Unsplash photos (no more `bgGradient` placeholders).
 *   - All entries `isVideo: true` (TikTok-only on homepage).
 *   - Dropped the "Hair · TikTok" top-left tag — redundant when all tiles
 *     are TikTok and the play button already signals video.
 *   - Dropped Bookmark icon — only Heart save (matches salon-card pattern).
 *   - Pills now use V3 liquid-glass recipe (white tint + heavy blur + inset
 *     top highlight + no border), aligned with SalonCard's V2-D61-fu pills.
 */

interface Look {
  slug: string;
  styleName: string;
  /** V3-palette gradient stand-in until real TikTok thumbnails ship from
   *  `/api/discovery/feed` (Phase 2). Each tile gets a distinct V3 hue pair
   *  so the row visually varies without faking photo content. */
  bgGradient: string;
}

const DEMO: Look[] = [
  { slug: "voluminous-layers", styleName: "Voluminous Layers",  bgGradient: "linear-gradient(135deg, #FFE8D8 0%, #A04A22 100%)" }, // peach → terra-deep
  { slug: "cool-hair-life",    styleName: "Cool Hair for Life", bgGradient: "linear-gradient(160deg, #F0A98C 0%, #2A1F18 100%)" }, // soft-terra → ink
  { slug: "textured-shag",     styleName: "Textured Shag",      bgGradient: "linear-gradient(135deg, #D4DDC8 0%, #0F6F44 100%)" }, // sage-pale → emerald-mid
  { slug: "layered-butterfly", styleName: "Layered Butterfly",  bgGradient: "linear-gradient(150deg, #A8E0BF 0%, #084B2D 100%)" }, // emerald-pale → emerald-deep
  { slug: "curtain-bangs",     styleName: "Curtain Bangs",      bgGradient: "linear-gradient(160deg, #FFE8D8 0%, #E0703D 100%)" }, // peach → terracotta
  { slug: "wolf-cut",          styleName: "Wolf Cut",           bgGradient: "linear-gradient(135deg, #D4F2E0 0%, #1A8F5C 100%)" }, // brand-subtle → emerald
  { slug: "soft-balayage",     styleName: "Soft Balayage",      bgGradient: "linear-gradient(140deg, #F0A98C 0%, #5C2E12 100%)" }, // soft-terra → deep terra
];

/** V2-D62 liquid-glass pill recipe for Entdecken overlay UI — white tint, no
 *  border, inset top highlight + outer depth shadow, heavy blur + saturate.
 *  Mirrors the SalonCard V2-D61-fu pills but uses white as the only hue since
 *  these sit on photo backgrounds where colored tints would muddy the look. */
const liquidGlassStyle = {
  background: "rgba(255, 255, 255, 0.20)",
  backdropFilter: "blur(22px) saturate(1.7)",
  WebkitBackdropFilter: "blur(22px) saturate(1.7)",
  boxShadow:
    "inset 0 1px 0 rgba(255, 255, 255, 0.35), 0 1px 3px rgba(0, 0, 0, 0.15)",
} as const;

export default function Entdecken() {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);

  // Center-zoom detection via IntersectionObserver.
  //
  // V2-D62-fu (2026-05-15): rebuilt the active-index tracker. The old
  // implementation combined a scroll listener with an `hoveredIndex` state +
  // onMouseEnter/onMouseLeave on each card. On mobile, touch-tap fires
  // synthetic mouseenter which locked `hoveredIndex` and prevented the
  // scroll-based detection from updating — the user saw "weird" zoom that
  // didn't track the scrolled-to card. Hover-driven zoom is dropped; pill
  // visibility on hover still works via CSS (`group-hover:md:opacity-100`).
  //
  // IntersectionObserver replaces the scroll-math approach:
  //   - rootMargin trims the root by 40% each side so only cards near the
  //     center count as "intersecting"
  //   - the card with the highest intersectionRatio is the most-centered one
  //   - only fires when ratios cross thresholds → no flicker during scroll
  React.useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const cards = Array.from(container.children).filter(
      (el): el is HTMLElement => el instanceof HTMLElement,
    );
    if (cards.length === 0) return;

    const ratios = new Map<Element, number>();
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target, entry.intersectionRatio);
        }
        let topRatio = 0;
        let topIdx = -1;
        cards.forEach((card, i) => {
          const r = ratios.get(card) ?? 0;
          if (r > topRatio) {
            topRatio = r;
            topIdx = i;
          }
        });
        if (topIdx >= 0) setActiveIndex(topIdx);
      },
      {
        root: container,
        rootMargin: "0px -40% 0px -40%",
        threshold: [0, 0.25, 0.5, 0.75, 1.0],
      },
    );

    cards.forEach((card) => obs.observe(card));
    return () => obs.disconnect();
  }, []);

  const ctaIndex = DEMO.length;

  return (
    <Section>
      <SectionFrame>
        <SectionTitle
          title="Finde deine Inspiration."
          link={{ label: "Alle entdecken →", href: "/entdecken" }}
          scrollRef={scrollRef}
        />
        <div
          ref={scrollRef}
          className={cn(
            "mt-3 flex gap-4 overflow-x-auto py-2",
            "[scroll-snap-type:x_mandatory] [-webkit-overflow-scrolling:touch]",
            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            // Negative-margin bleed so cards reach SectionFrame's rounded edge,
            // matched scroll-padding so snap targets align to padding edge.
            "-mx-3 px-3 md:-mx-4 md:px-4",
            "scroll-pl-3 md:scroll-pl-4",
          )}
        >
          {DEMO.map((look, index) => {
            const isExpanded = activeIndex === index;
            return (
              <Link
                key={look.slug}
                href={`/entdecken/${look.slug}`}
                aria-label={`${look.styleName} – TikTok-Inspo`}
                className="group relative block shrink-0 snap-center w-[44vw] max-w-[200px] aspect-[9/16] focus-visible:outline-2 focus-visible:outline-s-brand focus-visible:outline-offset-4 focus-visible:rounded-[16px]"
              >
                <div
                  className={cn(
                    "relative w-full h-full rounded-[16px] overflow-hidden origin-center",
                    "transition-[transform,opacity] duration-[250ms] ease-glide",
                    // Mobile-only center-zoom (driven by IntersectionObserver)
                    isExpanded
                      ? "scale-[1.03] z-10 opacity-100"
                      : "scale-[0.88] opacity-60",
                    // Desktop (md+): reset to plain — no scroll-driven graying.
                    // Only hover emphasizes the hovered card. Other cards stay
                    // at scale-1 / opacity-1 even when a sibling is hovered.
                    // `!` modifiers required: Tailwind JIT generates arbitrary-
                    // value classes (scale-[0.88]) AFTER responsive utilities
                    // (md:scale-100) in the output CSS, so without !important
                    // the mobile scale leaks into desktop viewports.
                    "md:!scale-100 md:!opacity-100",
                    "md:group-hover:!scale-[1.03] md:group-hover:!z-10",
                  )}
                  style={{ background: look.bgGradient }}
                >
                  {/* Bottom gradient for legibility under the style-name pill */}
                  <div
                    aria-hidden
                    className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"
                  />

                  {/* Centered play button — liquid-glass (all entries are TikTok video) */}
                  <div className="absolute inset-0 grid place-items-center pointer-events-none">
                    <div
                      className="grid h-10 w-10 place-items-center rounded-full text-white"
                      style={liquidGlassStyle}
                    >
                      <Play size={16} fill="white" stroke="none" className="ml-0.5" aria-hidden />
                    </div>
                  </div>

                  {/* Top-right: Heart save pill — liquid-glass.
                      Mobile: always-visible. Desktop: hover-only. */}
                  <div
                    className={cn(
                      "absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full",
                      "opacity-100 md:opacity-0 group-hover:md:opacity-100 transition-opacity duration-200",
                    )}
                    style={liquidGlassStyle}
                  >
                    <Heart size={13} strokeWidth={2.2} className="text-white" aria-hidden />
                  </div>

                  {/* Bottom: style-name pill — liquid-glass.
                      Mobile: always-visible. Desktop: hover-only. */}
                  <div
                    className={cn(
                      "absolute bottom-2 left-2 right-2",
                      "opacity-100 md:opacity-0 group-hover:md:opacity-100 transition-opacity duration-200",
                    )}
                  >
                    <div
                      className="inline-block max-w-[80%] rounded-full px-2.5 py-1"
                      style={liquidGlassStyle}
                    >
                      <p className="truncate font-body text-[11px] font-medium text-white">
                        {look.styleName}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}

          {/* Final "Alle entdecken" CTA card — center-zooms with the rest. */}
          <Link
            href="/entdecken"
            aria-label="Alle Looks entdecken"
            className="group relative block shrink-0 snap-center w-[44vw] max-w-[200px] aspect-[9/16] focus-visible:outline-2 focus-visible:outline-s-brand focus-visible:outline-offset-4 focus-visible:rounded-[16px]"
          >
            <div
              className={cn(
                "flex h-full w-full origin-center flex-col items-center justify-center rounded-[16px] p-6 text-center",
                "border-2 border-dashed bg-s-brand-subtle",
                "transition-[transform,opacity,border-color] duration-[250ms] ease-glide",
                // Mobile: center-zoom + border accent when CTA is the active card
                activeIndex === ctaIndex
                  ? "scale-[1.03] z-10 opacity-100 border-s-brand"
                  : "scale-[0.88] opacity-60 border-s-brand/30",
                // Desktop: plain by default, hover bumps to the "active" look.
                // `!` required to win over the mobile arbitrary-value classes.
                "md:!scale-100 md:!opacity-100 md:!border-s-brand/30",
                "md:group-hover:!scale-[1.03] md:group-hover:!z-10 md:group-hover:!border-s-brand",
              )}
            >
              <div
                className={cn(
                  "grid h-12 w-12 place-items-center rounded-full bg-s-brand text-white mb-4",
                  "transition-transform duration-[250ms] ease-glide",
                  // Mobile: arrow scales when CTA is the active center card
                  activeIndex === ctaIndex && "scale-110",
                  // Desktop: arrow scales only on hover (`!` to override mobile)
                  "md:!scale-100 md:group-hover:!scale-110",
                )}
              >
                <ArrowRight size={20} strokeWidth={2.5} aria-hidden />
              </div>
              <h3
                className={cn(
                  "font-body text-[15px] font-bold leading-tight transition-colors",
                  // Mobile: brand color when CTA is the active card
                  activeIndex === ctaIndex ? "text-s-brand" : "text-s-ink",
                  // Desktop: ink by default, brand on hover
                  "md:text-s-ink md:group-hover:text-s-brand",
                )}
              >
                Alle entdecken
              </h3>
              <p className="mt-2 font-body text-[11px] text-s-ink-3">
                Lass dich von tausenden Looks inspirieren
              </p>
            </div>
          </Link>
        </div>
      </SectionFrame>
    </Section>
  );
}
