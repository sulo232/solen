"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * TabPill — V3-D201 (2026-05-26, salon Phase A · A7).
 *
 * Active/inactive segmented filter pill. Currently used in SalonServices and
 * the booking flow (SalonServicesSheet was removed 2026-07-19). This is the
 * single source. Generic primitive — will be used by search filters too.
 *
 * Layer: 1 (chrome) — TabPill is a navigation/filter affordance, not a
 * semantic-color signal. Active state = soft gray fill (s-bg-sunken) + ink
 * text — the locked selection treatment, shared with the search filters
 * (not ink-fill, not accent, no check).
 *
 * Variants:
 *   - `outline` (default) — visible border. For filter chips, segment controls.
 *   - `ghost`             — borderless. For sticky-bar variants where the bar
 *                           itself has chrome.
 *
 * Sizes:
 *   - sm: `h-11` (44px). Inline filter rows.
 *   - md: `h-11` (44px). Sticky/standalone segment controls.
 *
 * Both raised to 44px (2026-07-17): the locked design-contract row
 * "interactive controls >= 44px (h-11), the a11y floor" beats the prior
 * 32/40px convenience heights. Height only, every other treatment intact.
 */

export interface TabPillProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  size?: "sm" | "md";
  variant?: "outline" | "ghost";
  /** Optional aria-label override (when children is a glyph/icon only). */
  ariaLabel?: string;
  className?: string;
}

const tabPillVariants = cva(
  cn(
    "inline-flex items-center gap-1.5 shrink-0 select-none whitespace-nowrap",
    // mockup-ok: /dev/round5, the "All four fixed" option, approved by him in words on 2026-08-16:
    // "Now it's a lot lot lot lot better. You can go implement this."
    //
    // WHY A CORNER AND NOT A CAPSULE, measured rather than preferred. He said the pill "looks like
    // it has a sharp corner", and he was describing real geometry. A capsule's radius is half its
    // height, so at h-11 it is fixed at 22px however wide the pill grows. Measured on the live page:
    // the widest option was 135.6 x 44, so only 44px of that width was curved and 91px, two thirds
    // of the outline, was a straight line. A shape whose outline is mostly straight does not read as
    // a capsule; it reads as a rectangle with a visible join, and that join is what he kept seeing.
    // 16px is a deliberate corner at every width, and it is also what Airbnb's own chips measure on
    // their reviews screen (48px tall, radius 16), recorded in _design-system/references/airbnb--reviews.md.
    //
    // THIS MOVES EVERY SCREEN, which is why it waited for him by name: 29 files import this
    // primitive, and CLAUDE.md's radius row ("button/chip pill") is updated in the same commit so
    // the written rule and the shipped component do not disagree.
    "rounded-[16px] font-body",
    "transition-[color,background-color,border-color,box-shadow,transform] duration-150 ease-glide",
    "active:scale-[0.97] active:duration-[80ms]",
    "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
  ),
  {
    variants: {
      variant: {
        outline: "border",
        ghost:   "border-0",
      },
      // A1 weight-share fix (2026-07-25, PDP weight share 83%->~43%, ceiling 30%):
      // font-semibold used to sit in the shared base above, so BOTH tones rendered
      // at 600. The locked selection grammar ("selected = bg-s-bg-sunken + text-s-ink
      // + semibold over a WHITE unselected") only names semibold for the SELECTED
      // state; unselected's cue is the fill + border, not weight. Demoted inactive to
      // font-medium (500), not all the way to font-normal (400): grounded in
      // SalonModeToggle.tsx's shipped inactive-segment weight (the other real
      // selected/unselected pair in this codebase, text-s-ink-2 font-medium), and
      // 400 read too light against text-s-ink-2 on the hairline border when rendered.
      // Active stays font-semibold (600), unchanged.
      tone: {
        active:   "font-semibold",
        inactive: "font-medium",
      },
      size: {
        // mockup-ok: 44px a11y floor (CLAUDE.md design contract, "interactive
        // controls >= 44px (h-11)"); height-only change, same colors/radius/text.
        sm: "h-11 px-3 text-[13px]",
        md: "h-11 px-4 text-[14px]",
      },
    },
    compoundVariants: [
      // outline + active = soft gray fill (matches search filter selection)
      {
        variant: "outline", tone: "active",
        // mockup-ok: DIRECTION D, owner-picked 2026-08-15 off the four-way comparison at
        // /dev/pill-ceramic: "probably d. Yeah. Let's use d. So, yeah, replace them ... in a
        // service, it's, like, all beard extras and stuff ... PDP ... also in the Review section
        // to change the the pills."
        //
        // THE LOCK THIS OVERRULES, named rather than quietly stepped over: the design contract's
        // selected/active row locked selection to a calm GRAY fill and says in as many words
        // "NEVER black/ink fill on a selected state", with a `no-black-selected` gate behind it.
        // His live instruction is precedence item 1 and that row is item 5, so it wins, but it
        // wins on the record. What he was solving is his own complaint that the estate shipped
        // BOTH a grey-selected pill and a black-selected pill one tap apart, and he has now picked
        // the black for both. The border stays so the pill keeps its shape against white.
        // mockup-ok: REVERTS to the calm gray this pill had before today, so nothing new is being
        // designed here and there is nothing to approve. Owner 2026-08-16, on the pill he selected
        // and pointed at: "I don't like how it's, like, black. Like, it just doesn't match at all
        // ... the contrast is just, like, too harsh." Same objection he made on 2026-06-29, which is
        // why the graveyard carries a black-selected entry and the design contract locks a calm gray
        // fill. His black pick earlier today was solving a real problem, two pills one tap apart
        // disagreeing about what selected looks like; restoring gray keeps that consistency and
        // drops the harshness, so nothing regresses. Measured: white on #1C1C1F is 16.4:1 and ink on
        // #F4F4F5 is 18.1:1, so the calm one is the stronger contrast, not the weaker.
        className: "border-s-bg-sunken bg-s-bg-sunken text-s-ink",
      },
      // outline + inactive = white + hairline border. Hover deepens text + border,
      // FLAT with no lift (V3-D420 CONTROL_ELEVATION: calm controls on white never cast a shadow).
      {
        variant: "outline", tone: "inactive",
        className: "border-s-border bg-white text-s-ink-2 hover:text-s-ink hover:border-s-border",
      },
      // ghost + active = soft gray fill, no border
      {
        variant: "ghost", tone: "active",
        // mockup-ok: REVERTS with its sibling above, for the same reason and in the same turn. The
        // whole point of these two matching is that one primitive must not disagree with itself
        // about what selected looks like, so they move together or not at all.
        className: "bg-s-bg-sunken text-s-ink",
      },
      // ghost + inactive = bare, low-emphasis
      {
        variant: "ghost", tone: "inactive",
        className: "bg-transparent text-s-ink-2 hover:text-s-ink",
      },
    ],
    defaultVariants: { variant: "outline", tone: "inactive", size: "sm" },
  },
);

export function TabPill({
  active,
  onClick,
  children,
  size = "sm",
  variant = "outline",
  ariaLabel,
  className,
}: TabPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={ariaLabel}
      className={cn(
        tabPillVariants({
          variant,
          tone: active ? "active" : "inactive",
          size,
        }),
        className,
      )}
    >
      {children}
    </button>
  );
}
