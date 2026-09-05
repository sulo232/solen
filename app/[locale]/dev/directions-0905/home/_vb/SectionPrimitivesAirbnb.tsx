"use client";

// Exists-check: ran `npm run exists SectionHeader`, hit the real, live app/[locale]/_components/
// homepage/SectionHeader.tsx (Section/SectionFrame/SectionTitle/ScrollRow/FeedZone, imported by
// every homepage rail: RecentlyViewed, TopCategoryRails, SalonOfMonth, Reviews). This file is a
// FORK of it (per the off-limits rule: copy into your own _v<letter>/ folder when the anatomy
// must change), because this direction is LOOK-FULL and the brief names the section-title size
// and weight and the ink value as locks to break on purpose, which the real, shared file cannot
// do without changing every other surface that imports it. The desktop-only scroll-arrow pair on
// the real SectionTitle is dropped here (invisible at this direction's 390x844 verify width,
// same call the prior builder made copying this same file, kept). The see-all control (an ink
// ArrowRight on a 32px gray-sunken circle) is UNCHANGED: it is already Solen's own Airbnb-derived
// recipe (ported from Airbnb on 2026-08-10 per the real file's history), so "the ink arrow" this
// direction's brief asks for already exists here and is reused, not redrawn.
//
// Direction: home ?v=b, Airbnb look at FULL STRENGTH (LOCK MODE: LOOK-FULL).
//
// Sources + values taken:
//   - _design-system/references/airbnb--look-recipe.md #2 -> section heading 22px, line-height
//     26px (was the locked clamp(18px,2vw,20px)). WEIGHT CORRECTION (repair round, critic-measured
//     2026-09-05): the class below is `font-semibold` (Tailwind 600), but a sitewide rule at
//     app/globals.css:269-271 (`main :is(.font-semibold, .font-bold) { font-weight: 500; }`,
//     exempting only `[data-surface="dashboard"]`) forces every non-dashboard `.font-semibold` in
//     the app down to 500 at render, this title included. Measured live: the rendered weight here
//     is 500, not 600. That sitewide rule is an owner-locked global (off-limits, not edited here),
//     so 22px/600 was never actually deliverable through this class on a non-dashboard surface;
//     the delivered value is 22px/500, and this file no longer claims 600.
//   - _design-system/references/airbnb--look-recipe.md #5 -> ink rgb(34,34,34)/#222222 on the
//     title (was the locked frozen literal #0A0A0A).
//   - _design-system/references/airbnb--look-recipe.md #17 -> the 35px content-to-divider /
//     24px divider-to-next-row review rhythm (60px total), the only concrete Airbnb vertical
//     rhythm number this capture measured anywhere. Its own port map says 24 lands on Solen's
//     4pt grid as-is and 35 rounds to 32; 32+24=56, used below as the section-to-section gap
//     (`mb-14` = 56px) replacing the live page's `mb-4` (16px). No other Airbnb page-rhythm
//     number exists in the cited files, so no other spacing value on this screen was changed.
//
// Conflicts (locks broken on purpose, LOOK-FULL):
//   1. lock: section-H2 SIZE clamp(18px,2vw,20px) broken on purpose: reference value = Airbnb
//      22px, line-height 26px (look-recipe #2). WEIGHT is NOT delivered at 600: see the WEIGHT
//      CORRECTION note above, the rendered weight is 500 (sitewide global, off-limits).
//   2. lock: ink #0A0A0A broken on purpose, on the section title only: reference value = Airbnb
//      rgb(34,34,34)/#222222 (look-recipe #5).
//   3. lock: section-to-section spacing `mb-4` (16px) broken on purpose: reference value = the
//      Airbnb review-rhythm number (35+24, rounded to the 4pt grid as 32+24=56) applied as the
//      inter-section gap (look-recipe #17), since no other Airbnb rail-spacing number exists in
//      the cited captures. This is the one spacing change this file makes; every other spacing
//      value (SectionFrame padding, ScrollRow gap-3) is untouched, since neither reference file
//      measured a different number for those.
//   Kept, not broken: the see-all ink-arrow circle (already Solen's own Airbnb-derived recipe,
//   reused verbatim) and the eyebrow/meta text, which stays at the existing 12px/600 s-ink-2, a
//   value neither reference file names a conflicting one for.
//
// No em-dashes. No copy of its own (structural chrome only).

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  link?: { label: string; href: string };
  className?: string;
}

export function SectionMeta({ eyebrow }: { eyebrow: string }) {
  return (
    <div className="mb-2 px-2 font-body text-[12px] font-semibold tracking-[0.08em]">
      <span className="inline-flex items-center gap-2 whitespace-nowrap text-s-ink-2">
        {eyebrow}
      </span>
    </div>
  );
}

/**
 * SectionTitle, forked from the real component. LOOK-FULL: 22px SIZE, line-height 26px (Airbnb
 * look-recipe #2) and ink #222222 (look-recipe #5) replace the locked clamp(18px,2vw,20px) and
 * #0A0A0A. WEIGHT stays 500 at render (sitewide `.font-semibold` -> 500 override, off-limits, see
 * file header WEIGHT CORRECTION), so 600 is not delivered here. See file header for the full
 * conflicts list.
 */
export function SectionTitle({
  title,
  link,
  linkPlacement = "auto",
  subtitle,
}: {
  title: string;
  link?: { label: string; href: string };
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  linkPlacement?: "auto" | "inline";
  subtitle?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div className="min-w-0">
        <h2 className="font-display text-[22px] font-semibold leading-[26px] tracking-[-0.01em] text-[#222222]"> {/* conflict-ok: LOOK-FULL, Airbnb 22px size + ink override replace the locked clamp(18px,2vw,20px)/#0A0A0A; weight renders 500 (sitewide .font-semibold override, off-limits), not the 600 this class name suggests */}
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 font-body text-[12px] font-normal leading-4 text-s-ink-2">{subtitle}</p>
        ) : null}
      </div>

      {linkPlacement === "inline" ? null : (
        <div className="flex shrink-0 items-center gap-2">
          {link ? <SeeAllCircle href={link.href} label={link.label} /> : null}
        </div>
      )}
    </div>
  );
}

/** The see-all control, unchanged from the real component: ink ArrowRight on a 32px gray-sunken
 *  circle, already Solen's own Airbnb-derived recipe (ported 2026-08-10), reused verbatim. */
function SeeAllCircle({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} aria-label={label} className="group grid h-11 w-11 shrink-0 place-items-center">
      <span
        className={cn(
          "grid h-8 w-8 shrink-0 place-items-center rounded-full bg-s-bg-sunken text-s-ink", // content-image-ok: see-all navigation circle, not a photo fallback slot
          "transition-transform duration-200 ease-glide",
          "group-active:scale-[0.94] group-active:duration-[80ms]",
        )}
      >
        <ArrowRight size={20} strokeWidth={2.2} aria-hidden />
      </span>
    </Link>
  );
}

export function FeedZone({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("relative z-[2]", "mt-0 md:mt-8", "pt-2 pb-4 md:pt-4 md:pb-6", className)}>{children}</div>;
}

export function SectionFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("px-3 pt-1 pb-2 md:px-4 md:pt-2 md:pb-3", "overflow-hidden", className)}>{children}</div>;
}

export const ScrollRow = React.forwardRef<HTMLDivElement, { children: React.ReactNode; className?: string }>(
  function ScrollRow({ children, className }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          "mt-1 flex gap-3 overflow-x-auto py-1 [scrollbar-width:none]",
          "salon-card-stagger",
          "[scroll-snap-type:x_mandatory] [-webkit-overflow-scrolling:touch]",
          "[&::-webkit-scrollbar]:hidden",
          "-mx-3 px-3 md:-mx-5 md:px-5",
          "scroll-pl-3 md:scroll-pl-5",
          "[&>*:last-child]:mr-2",
          className,
        )}
      >
        {children}
      </div>
    );
  },
);

export function Section({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("relative z-[1] mb-14 md:mb-14", className)}> {/* conflict-ok: LOOK-FULL, Airbnb review-rhythm 32+24=56px replaces the locked mb-4 (16px) */}
      <div className="mx-auto max-w-[1280px] px-1 py-2 md:px-3 md:py-3">{children}</div>
    </section>
  );
}
