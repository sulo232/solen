"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Bookmark, Heart, Play } from "lucide-react";
import { Section, SectionFrame, SectionTitle } from "./SectionHeader";
import { cn } from "@/lib/utils";

/**
 * Entdecken preview — V2-D49g (2026-05-10).
 *
 * Faithful port of the pre-V2-rebuild canonical structure that ran on the
 * homepage Mar 26 → Apr 13 2026 via `components/ui/DiscoverCarousel.tsx` +
 * `components/discovery/ItemCard.tsx` (inlined here to keep one file).
 * Adapted to V3 tokens — emerald `s-brand` replaces coral, V3 SectionFrame
 * pattern wraps the title.
 *
 * Key behaviors carried over (the structural deltas the user flagged were
 * "fundamentally different" in the previous draft):
 *   1. Center-zoom: card under viewport center scales 1.03 / opacity 1;
 *      neighbors scale 0.88 / opacity 0.6 (mobile) or 0.95 / 0.8 (desktop).
 *   2. Heart + Bookmark grouped in ONE glass pill top-right —
 *      mobile-always-visible, desktop-hover-only.
 *   3. Bottom style_name pill — desktop-hover-only.
 *   4. Final CTA card "Alle entdecken" with same center-zoom behavior.
 *   5. Aspect-[9/16] portrait, fixed `w-[44vw] max-w-[200px]`.
 *   6. Bottom gradient inside card for overlay-text legibility.
 *
 * Demo data uses gradient backgrounds (real photos ship later via
 * `/api/discovery/feed`). Each card flagged isVideo=true gets the centered
 * play button, matching the original TikTok-vs-photo split.
 */

interface Look {
  slug: string;
  styleName: string;
  category: string;
  source: string;
  isVideo: boolean;
  bgGradient: string;
}

const DEMO: Look[] = [
  { slug: "voluminous-layers", styleName: "Voluminous Layers",   category: "Hair", source: "TikTok",    isVideo: true,  bgGradient: "linear-gradient(135deg, #D9C9A8 0%, #6B4F37 100%)" },
  { slug: "cool-hair-life",    styleName: "Cool Hair for Life",  category: "Hair", source: "TikTok",    isVideo: true,  bgGradient: "linear-gradient(160deg, #E8B89B 0%, #8B5530 100%)" },
  { slug: "textured-shag",     styleName: "Textured Shag",       category: "Hair", source: "Instagram", isVideo: false, bgGradient: "linear-gradient(135deg, #D4DDC8 0%, #4A6B4F 100%)" },
  { slug: "layered-butterfly", styleName: "Layered Butterfly",   category: "Hair", source: "TikTok",    isVideo: true,  bgGradient: "linear-gradient(135deg, #E8DDC9 0%, #8E4A2D 100%)" },
  { slug: "curtain-bangs",     styleName: "Curtain Bangs",       category: "Hair", source: "Instagram", isVideo: false, bgGradient: "linear-gradient(160deg, #F2D77B 0%, #8E4A2D 100%)" },
  { slug: "wolf-cut",          styleName: "Wolf Cut",            category: "Hair", source: "TikTok",    isVideo: true,  bgGradient: "linear-gradient(135deg, #A8CFB8 0%, #0F3D26 100%)" },
  { slug: "soft-balayage",     styleName: "Soft Balayage",       category: "Hair", source: "TikTok",    isVideo: true,  bgGradient: "linear-gradient(135deg, #FAF2E5 0%, #C97A57 100%)" },
];

export default function Entdecken() {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  // Center-zoom scroll listener (port of pre-V2 DiscoverCarousel logic).
  // Finds the child whose center sits closest to the container center,
  // marks it active. Hover overrides on desktop. Throttle = passive scroll.
  React.useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current) return;
      const container = scrollRef.current;
      const center = container.scrollLeft + container.clientWidth / 2;
      let closestIdx = 0;
      let minDistance = Infinity;
      Array.from(container.children).forEach((child, i) => {
        const el = child as HTMLElement;
        const childCenter = el.offsetLeft + el.clientWidth / 2;
        const dist = Math.abs(childCenter - center);
        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = i;
        }
      });
      setActiveIndex(closestIdx);
    };
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", handleScroll, { passive: true });
      handleScroll();
    }
    return () => el?.removeEventListener("scroll", handleScroll);
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
            const isExpanded =
              hoveredIndex !== null ? hoveredIndex === index : activeIndex === index;
            return (
              <Link
                key={look.slug}
                href={`/entdecken/${look.slug}`}
                aria-label={`${look.styleName}, ${look.category} look auf ${look.source}`}
                className="group relative block shrink-0 snap-center w-[44vw] max-w-[200px] aspect-[9/16] focus-visible:outline-2 focus-visible:outline-s-brand focus-visible:outline-offset-4 focus-visible:rounded-[16px]"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div
                  className={cn(
                    "relative w-full h-full rounded-[16px] overflow-hidden origin-center",
                    "transition-[transform,opacity] duration-[250ms] ease-glide",
                    isExpanded
                      ? "scale-[1.03] z-10 opacity-100"
                      : "scale-[0.88] opacity-60 md:scale-[0.95] md:opacity-80",
                  )}
                  style={{ background: look.bgGradient }}
                >
                  {/* Bottom gradient for legibility under overlays */}
                  <div
                    aria-hidden
                    className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"
                  />

                  {/* Centered play button — only for video items */}
                  {look.isVideo && (
                    <div className="absolute inset-0 grid place-items-center pointer-events-none">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-white/25 backdrop-blur-sm">
                        <Play size={16} fill="white" stroke="none" className="ml-0.5" aria-hidden />
                      </div>
                    </div>
                  )}

                  {/* Top-left: category · source pill (warm gold glass) */}
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#C99B6A]/85 backdrop-blur-[6px] px-2 py-[3px] font-body text-[10px] font-semibold text-white">
                    <span>{look.category}</span>
                    <span className="opacity-60">·</span>
                    <span>{look.source}</span>
                  </span>

                  {/* Top-right: Heart + Bookmark in ONE glass pill.
                      Mobile: always-visible. Desktop: hover-only. */}
                  <div
                    className={cn(
                      "absolute right-2 top-2 flex items-center gap-1.5 rounded-full",
                      "bg-white/25 backdrop-blur-[6px] px-2 py-1",
                      "opacity-100 md:opacity-0 group-hover:md:opacity-100 transition-opacity duration-200",
                    )}
                  >
                    <Heart size={14} strokeWidth={2} className="text-white" aria-hidden />
                    <Bookmark size={14} strokeWidth={2} className="text-white" aria-hidden />
                  </div>

                  {/* Bottom: style_name glass pill.
                      Mobile: always-visible. Desktop: hover-only. */}
                  <div
                    className={cn(
                      "absolute bottom-2 left-2 right-2",
                      "opacity-100 md:opacity-0 group-hover:md:opacity-100 transition-opacity duration-200",
                    )}
                  >
                    <div className="inline-block max-w-[80%] rounded-full bg-white/25 backdrop-blur-[6px] px-2.5 py-1">
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
                activeIndex === ctaIndex
                  ? "scale-[1.03] z-10 opacity-100 border-s-brand"
                  : "scale-[0.88] opacity-60 md:scale-[0.95] md:opacity-80 border-s-brand/30",
              )}
            >
              <div
                className={cn(
                  "grid h-12 w-12 place-items-center rounded-full bg-s-brand text-white mb-4",
                  "transition-transform duration-[250ms] ease-glide",
                  activeIndex === ctaIndex && "scale-110",
                )}
              >
                <ArrowRight size={20} strokeWidth={2.5} aria-hidden />
              </div>
              <h3
                className={cn(
                  "font-body text-[15px] font-bold leading-tight transition-colors",
                  activeIndex === ctaIndex ? "text-s-brand" : "text-s-ink",
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
