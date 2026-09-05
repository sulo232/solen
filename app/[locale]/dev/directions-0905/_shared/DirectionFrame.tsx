"use client";

// exists-check: net-new vs Switch.tsx, SalonSwitcher.tsx, search-bar/SearchBarVariants.tsx,
// mock/category-morph/Variants.tsx because none of them render a direction-comparison
// shell (an in-flow direction-label strip with variant chips wrapped around a real
// screen). No longer imports VariantSwitcher.tsx: its fixed pill sat at bottom-[88px]
// and obstructed real card content in every phone comparison (measured 2026-09-05, the
// pill spanned y=633..756 on the salon page, 124px tall where its labels wrapped). This
// file copies only VariantSwitcher's `?v=` link-construction logic, in-flow instead of
// fixed; VariantSwitcher.tsx itself is unchanged and still serves the 5 whole-page
// mock-* routes.
//
// Grounded-in: app/[locale]/dev/_shared/VariantSwitcher.tsx (link-construction logic
// copied below, not imported), app/[locale]/dev/flows/layout.tsx (the original
// fixed-bar-under-real-chrome shape this followed before the 2026-09-05 rewrite).
// Depicts: direction label strip -> NET-NEW: no other dev route labels which comparison
// direction is on screen.
// Depicts: variant chips -> app/[locale]/dev/_shared/VariantSwitcher.tsx link logic,
// reimplemented in-flow with the locked selected treatment (bg-s-bg-sunken + text-s-ink
// + font-semibold), never fixed, never blue.

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

interface Direction {
  value: string;
  label: string;
}

interface DirectionFrameProps {
  /** Identifies which comparison surface this is (confirmation, salon-page, search,
   *  home, motion-kit, ...). Not rendered in the strip copy, carried as a data attribute
   *  so a screenshot/video harness can target a surface without guessing at DOM text. */
  surface: string;
  directions: Direction[];
  /** The `?v=` value currently active, as read by the calling page. */
  active: string;
  /** Optional one-line addition after the direction label, e.g. what makes this
   *  direction different. Never a second line, never a dash. */
  note?: string;
  children: React.ReactNode;
}

/**
 * DirectionFrame: the one shared shell every /dev/directions-0905/<surface>/page.tsx
 * wraps itself in. Renders the wrapped screen at its own real width and height (no fake
 * phone frame, no wrapper card, no padding of its own so the real screen's own layout is
 * what gets judged), preceded by a single in-flow strip at the very top of the document
 * (position static, scrolls away with the page, never fixed or sticky) naming which
 * direction is on screen plus three chips ("A"/"B"/"C") that swap `?v=` on the current
 * route. Replaces the pair of fixed overlays this file used to render (a top strip at
 * top-20 plus VariantSwitcher's bottom pill), which obstructed real screen content in
 * every phone screenshot.
 *
 * English only (mockup rule), no em-dashes, no decorative separators. Sizes/colours are
 * all existing tokens: 12px text, s-ink-2 on white, one hairline border, no shadow, no
 * new colour, no blue. The label uses a colon, not a middle-dot separator (LOCKFILE
 * §2.5 A12 bans a bare `·`/`|` separator glyph).
 */
export function DirectionFrame({ surface, directions, active, note, children }: DirectionFrameProps) {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const activeIndex = directions.findIndex((d) => d.value === active);
  const activeLabel = activeIndex >= 0 ? directions[activeIndex].label : active;
  const letter = String.fromCharCode(65 + Math.max(activeIndex, 0));

  return (
    <div data-direction-surface={surface}>
      <div className="flex h-11 items-center justify-between border-b border-s-border bg-white px-4">
        <span className="text-[12px] text-s-ink-2">
          {`Direction ${letter} of ${directions.length}: ${activeLabel}`}
        </span>
        <div className="flex items-center gap-2">
          {directions.map((opt, i) => {
            const params = new URLSearchParams(searchParams?.toString());
            params.set("v", opt.value);
            const href = `${pathname}?${params.toString()}`;
            const isActive = active === opt.value;
            return (
              <Link
                key={opt.value}
                href={href}
                className={
                  isActive
                    ? "flex h-8 items-center justify-center rounded-[16px] bg-s-bg-sunken px-3 text-[12px] font-semibold text-s-ink"
                    : "flex h-8 items-center justify-center rounded-[16px] border border-s-border bg-white px-3 text-[12px] font-medium text-s-ink-2"
                }
              >
                {String.fromCharCode(65 + i)}
              </Link>
            );
          })}
        </div>
      </div>
      {note ? <div className="px-4 py-1 text-[12px] text-s-ink-2">{note}</div> : null}
      {children}
    </div>
  );
}
