"use client";

// exists-check: net-new vs Switch.tsx, SalonSwitcher.tsx, search-bar/SearchBarVariants.tsx,
// mock/category-morph/Variants.tsx because none of them render a direction-comparison
// shell (a fixed direction-label strip plus a variant switcher wrapped around a real
// screen); reuses VariantSwitcher.tsx unchanged (imported below, not forked).
//
// Grounded-in: app/[locale]/dev/_shared/VariantSwitcher.tsx (reused unchanged below, not
// forked), app/[locale]/dev/flows/layout.tsx (the fixed-bar-under-real-chrome shape this
// follows).
// Depicts: direction label strip -> NET-NEW: no other dev route labels which comparison
// direction is on screen.
// Depicts: variant switcher -> app/[locale]/dev/_shared/VariantSwitcher.tsx (reused as-is).

import { VariantSwitcher } from "@/app/[locale]/dev/_shared/VariantSwitcher";

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
 * what gets judged), the shared VariantSwitcher fixed at the bottom (cleared 88px up so
 * it never sits under a real sticky CTA bar, e.g. the booking confirmation / booking-flow
 * screens), and a plain one-line strip pinned under the real site header naming which
 * direction is on screen.
 *
 * English only (mockup rule), no em-dashes, no decorative separators. Sizes/colours are
 * all existing tokens: 12px text, s-ink-2 on white, one hairline border, no shadow, no
 * new colour.
 */
export function DirectionFrame({ surface, directions, active, note, children }: DirectionFrameProps) {
  const activeIndex = directions.findIndex((d) => d.value === active);
  const activeLabel = activeIndex >= 0 ? directions[activeIndex].label : active;
  const letter = String.fromCharCode(65 + Math.max(activeIndex, 0));

  return (
    <div data-direction-surface={surface}>
      <div className="fixed inset-x-0 top-20 z-40 border-b border-s-border bg-white px-4 py-2 text-[12px] text-s-ink-2">
        {`Direction ${letter} of ${directions.length}: ${activeLabel}`}
        {note ? `, ${note}` : ""}
      </div>
      <div className="pt-10">{children}</div>
      <VariantSwitcher options={directions} bottomClassName="bottom-[88px]" />
    </div>
  );
}
