"use client";

// exists-check: `npm run exists directions` shows no round-2 button kit wrapper; `npm run
// exists kit` returns no existing token/kit module. No shared generic "PrimaryButton" primitive
// is registered in _design-system/COMPONENT_REGISTRY.md (grep confirms no Button row), so this
// is new plumbing over an existing, real recipe, not a duplicate of a registered component.
//
// Note on the ink fill: this button's `bg-s-ink` class is the one NAMED exception to the
// graveyarded "ink fill as a SELECTED/active-state indicator" rule (CLAUDE.md design contract,
// "selected / active" row: "Exceptions (four, all named): the ONE commit button stays ink").
// This component renders the primary COMMIT action, never a selected pill/chip/option.

// Depicts: the one ink commit button per screen -> components-legacy/booking/BookingConfirmation.tsx (its real "Add to calendar" button anatomy, transcribed at app/[locale]/dev/directions-0905/press-motion/_va/PressMotionSceneA.tsx:180, height 52px, rounded-btn, bg-s-ink, 15px/500 white text)

// Grounded-in: app/[locale]/dev/directions-0905/press-motion/_va/PressMotionSceneA.tsx:90-122
// (PressableA, the press motion) and :179-184 (the real anatomy this recipe transcribes).
// bg-s-ink resolves through app/globals.css's owner-dated override (2026-08-15) to #1C1C1F
// (s-ink-soft, "the ink fill"), never the raw hex: this component writes the Tailwind class,
// never either hex directly, per R2_LOOK_SYSTEMS.md A3.
//
// measured: rendered in preview/page.tsx; see that file's comment block for computed height,
// radius and text values.
//
// system: none. A3 (the one commit button) carries no per-system delta in Part B; all three
// systems keep it identical (a system changes GROUPING devices, not the one commit action).
// PrimaryButton therefore does not read useSystem().

import * as React from "react";
import { TYPE_RAMP } from "./tokens";
import { useSystem } from "./KitProvider";

export interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}

/** The one commit action per screen (A3). 52px tall, full content width, capsule corner via
 * `rounded-btn` (99px, clips to half the element's own height so it renders as a true capsule
 * at this height). Press motion is round-1 direction A: 0.97 scale / 4% darker at 100ms
 * ease-thud on press, 200ms ease-glide back on release, disabled under prefers-reduced-motion.
 *
 * ROUND 3: candidate C (`_plans/R3_ONE_SYSTEM.md` "Primary button" row: "Radius 12px, ... height
 * 40px is REFUSED [under the 44px touch floor], so 44px minimum") swaps the capsule for a 12px
 * rounded rect at 44px tall, ink fill and white 14/500 text unchanged. Candidates A and B declare
 * no `candidate.button` delta beyond this file's existing 52/capsule shape (their sheet rows read
 * "identical to both the control and confirmation RULE"), so lift/rule/tray/a/b all render exactly
 * as before; only "c" branches. */
export function PrimaryButton({ children, onClick, type = "button", disabled, className }: PrimaryButtonProps) {
  const [pressed, setPressed] = React.useState(false);
  const { candidate } = useSystem();
  const isAirbnbPort = candidate?.button.secondaryFill === "neutralFill"; // candidate C only
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      className={[
        "flex w-full items-center justify-center gap-2 bg-s-ink font-body text-white",
        // Static literals (Tailwind JIT cannot compile a runtime-built arbitrary class): 44/12 is
        // RADIUS.c.ctaPx + RADIUS.c.ctaHeightPx (row 14, height REFUSED under the 44px touch
        // floor); 52px/rounded-btn is this file's original, unchanged A/B shape. bg-s-ink is the
        // CLAUDE.md-named exception (the ONE commit button stays ink), unchanged from the shipped
        // recipe this file already carried.
        isAirbnbPort ? "h-[44px] rounded-[12px]" : "h-[52px] rounded-btn",
        TYPE_RAMP.cta.weightClass,
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "motion-reduce:!transition-none motion-reduce:!transform-none motion-reduce:!filter-none",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        fontSize: TYPE_RAMP.cta.size,
        transform: pressed ? "scale(0.97)" : "scale(1)",
        filter: pressed ? "brightness(0.96)" : "brightness(1)",
        transition: pressed
          ? "transform 100ms cubic-bezier(0.7,0,0.84,0), filter 100ms cubic-bezier(0.7,0,0.84,0)"
          : "transform 200ms cubic-bezier(0.16,1,0.3,1), filter 200ms cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      {children}
    </button>
  );
}
