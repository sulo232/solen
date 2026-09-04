// Grounded-in: app/[locale]/_components/layout/CategoryPillRow.tsx (the real component this file
//   byte-copies; see the WHY block below).
//
// exists-check: net-new file vs app/[locale]/dev/design-fixes/page.tsx and
//   app/[locale]/dev/round5/Round5Client.tsx (closest matches, both read this turn), because this
//   is a byte-copy of ONE specific component (CategoryPillRow.tsx) scoped to this mockup folder,
//   the same pattern design-fixes/page.tsx already uses for its own review-card byte-copy; it does
//   not overlap the roadmap docs (_plans/DESIGN_MOCKUPS.md, _roadmaps/*, INSPO_DETAIL_FIXES.md) or
//   dashboard/barber-clients/page.tsx, none of which render a category pill row.
//
// reinvent-ok: HEADER_CATEGORIES below is copied verbatim from CategoryPillRow.tsx (its own
//   `HEADER_CATEGORIES` const, lines 76-101), which itself already carries a "reinvent-ok"-class
//   comment (lines 31-42) explaining this exact array is a MOVE off Header.tsx, not a duplicate of
//   searchCategories.ts / discovery-categories.ts / SearchTemplate's CATEGORY_PILLS (checked and
//   named there as three separate, already-accepted namespaces). This file copies THAT array
//   byte-for-byte a second time for the reason stated below (usePathname gating blocks the real
//   import on a /dev route), not because a fourth data source was invented.
//
// Depicts: category pills (home state) -> app/[locale]/_components/layout/CategoryPillRow.tsx
//   (BYTE-COPY, not an import; see the WHY block below for the exact reason the real import
//   cannot be used on a /dev route)
//
// BYTE-COPY of app/[locale]/_components/layout/CategoryPillRow.tsx, not an import.
//
// WHY a copy instead of the real import (punch-list fix, round 2): CategoryPillRow gates its own
// visibility on `usePathname()` (`isHome = /^\/[a-z]{2}\/?$/.test(pathname)`, `showCategoryChrome =
// isHome || categorySegment || isDiscover`, source lines 122/139/180). This mockup lives at
// `/en/dev/mockups-0904/home-anchor`, which matches none of those patterns, so the real component
// renders null here no matter how it is imported or props are passed, there is no prop that
// overrides `usePathname()`. Round 1 imported it anyway and it silently rendered nothing, which the
// critic caught by diffing live SSR HTML against the real /en route.
//
// This file reproduces CategoryPillRow's JSX, HEADER_CATEGORIES, classes, press-state and overlay
// markup VERBATIM (copied 2026-09-05 off CategoryPillRow.tsx lines 76-353), with exactly one
// change: `isHome` is hardcoded `true` instead of derived from `usePathname()`, because this route
// mocks the HOME screen's first viewport, where CategoryPillRow's own derivation would also
// evaluate to `isHome = true`. Every class, every shadow value, every icon path, the 220ms press
// timing, and the optimistic-selection state are unchanged. If CategoryPillRow.tsx's pill markup
// ever changes, this copy will drift and needs re-syncing by hand, same caveat the /en/dev/
// design-fixes page's own byte-copy carries for the review card.
"use client";

import * as React from "react";
import Image from "next/image";
import { Link } from "next-view-transitions";
import { useTranslations } from "next-intl";
import { Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { strokeForSize } from "@/lib/icon-stroke";

const HEADER_CATEGORIES: { slug: string; route: string; label: string; iconSrc?: string; home?: boolean }[] = [
  { slug: "home", route: "", label: "All", home: true },
  { slug: "coiffeur", route: "coiffeur", label: "Coiffeur", iconSrc: "/icons/categories/v2/coiffeur.png" },
  { slug: "barbershop", route: "barbershop", label: "Barber", iconSrc: "/icons/categories/v2/barber.png" },
  { slug: "nails", route: "nails", label: "Nails", iconSrc: "/icons/categories/v2/nails.png" },
  { slug: "spa", route: "spa", label: "Spa", iconSrc: "/icons/categories/v2/spa.png" },
  { slug: "inspo", route: "inspo", label: "Inspo", iconSrc: "/icons/categories/map.png" },
];

export function CategoryPillsMock({ locale }: { locale: string }) {
  const tNav = useTranslations("navigation");

  // Hardcoded: this mockup depicts the HOME screen, where CategoryPillRow's own
  // usePathname()-derived `isHome` would evaluate to true. No other route state applies.
  const isHome = true;

  const [pressedCategory, setPressedCategory] = React.useState<string | null>(null);
  const [optimisticCategory, setOptimisticCategory] = React.useState<string | null>(null);

  const handleCategoryPress = (slug: string) => {
    setPressedCategory(slug);
    setOptimisticCategory(slug);
    window.setTimeout(() => {
      setPressedCategory((prev) => (prev === slug ? null : prev));
    }, 220);
  };

  return (
    <div className="md:hidden mx-auto mt-0 max-w-[1280px] px-4 pointer-events-auto">
      <div
        role="tablist"
        aria-label={tNav("categories")}
        className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-5 pb-5"
        style={{
          scrollbarWidth: "none",
          WebkitMaskImage: "linear-gradient(90deg, #000 90%, transparent)",
          maskImage: "linear-gradient(90deg, #000 90%, transparent)",
        }}
      >
        {HEADER_CATEGORIES.map((c) => {
          const routeActive = c.home ? isHome : false;
          const isActive = optimisticCategory ? optimisticCategory === c.slug : routeActive;
          return (
            <Link
              key={c.slug}
              href={c.home ? `/${locale}` : `/${locale}/${c.route}`}
              role="tab"
              aria-selected={isActive}
              onPointerDown={() => handleCategoryPress(c.slug)}
              onMouseDown={() => handleCategoryPress(c.slug)}
              onTouchStart={() => handleCategoryPress(c.slug)}
              className={cn(
                "relative isolate inline-flex h-10 shrink-0 items-center gap-1 rounded-[40px] px-3.5 bg-transparent",
                "font-body text-[14px] font-normal leading-none text-s-ink",
                "transition-transform duration-[220ms] ease-[cubic-bezier(0.1,0.9,0.2,1)]",
                pressedCategory === c.slug && "scale-[0.96]",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "pointer-events-none absolute inset-0 z-[-1] rounded-[inherit] bg-white transition-opacity duration-[220ms] ease-[cubic-bezier(0.1,0.9,0.2,1)]",
                  isActive ? "opacity-0" : "opacity-100",
                )}
                style={{
                  boxShadow:
                    "rgba(0,0,0,0.10) 0 3px 2.5px 0, rgba(0,0,0,0.15) 0 1px 1px 0, rgba(0,0,0,0.15) 0 0.8px 0.4px 0, rgb(255,255,255) 0 1px 1.5px 0 inset, rgba(58,58,58,0.02) 0 10px 15px 0 inset, rgba(255,255,255,0.6) 0 -1.5px 0.8px 0 inset, rgba(0,0,0,0.30) 0 -1.5px 0.75px 0 inset",
                }}
              />
              <span
                aria-hidden
                className={cn(
                  "pointer-events-none absolute inset-0 z-[-1] rounded-[inherit] bg-s-bg-sunken transition-opacity duration-[220ms] ease-[cubic-bezier(0.1,0.9,0.2,1)]",
                  isActive ? "opacity-100" : "opacity-0",
                )}
                style={{
                  boxShadow:
                    "rgb(255,255,255) 0 1px 0.5px 0, rgba(0,0,0,0.15) 0 -0.5px 1px 0, rgba(0,0,0,0.05) 0 -1.2px 0.5px 1px, rgba(0,0,0,0.05) 0 8px 16px 0, rgb(255,255,255) -0.2px -1px 1px 0 inset, rgba(0,0,0,0.20) 0.5px 0.7px 2.5px 0 inset, rgba(0,0,0,0.05) -1px -3px 8px 0 inset, rgba(0,0,0,0.10) 0.5px 2px 4px 0 inset, rgba(0,0,0,0.10) 1px 6px 6px 2px inset",
                }}
              />
              {c.home ? (
                <span aria-hidden className="grid h-[28px] w-[28px] shrink-0 place-items-center">
                  <Home size={24} strokeWidth={strokeForSize(24)} />
                </span>
              ) : c.iconSrc ? (
                <Image
                  src={c.iconSrc}
                  alt=""
                  width={64}
                  height={64}
                  sizes="84px"
                  className="h-[28px] w-[28px] shrink-0 object-contain"
                  aria-hidden
                />
              ) : null}
              {c.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
