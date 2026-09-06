"use client";

// exists-check: `npm run exists directions` shows no round-2 button kit wrapper; `npm run
// exists kit` returns no existing token/kit module. No shared generic "SecondaryButton"
// primitive is registered in _design-system/COMPONENT_REGISTRY.md.

// Depicts: the neutral outline repeat action -> components-legacy/booking/BookingConfirmation.tsx (its real "Directions" button anatomy, transcribed at app/[locale]/dev/directions-0905/press-motion/_va/PressMotionSceneA.tsx:190, height 50px, rounded-btn, white fill, hairline border, ink text, 15px/500)

// Grounded-in: app/[locale]/dev/directions-0905/press-motion/_va/PressMotionSceneA.tsx:90-122
// (PressableA, the press motion) and :188-195 (the real anatomy this recipe transcribes). The
// concept ported from Fresha (cited, fresha--look-recipes.md): two tiers separated by FILL and
// SIZE, not by colour, solid for the one commit, outline and smaller for every repeated inline
// action. Fresha's own 36px height and 999px capsule and #D3D3D3 border are NOT ported (under
// our 44px floor and our own hairline token stays #E4E4E7).
//
// measured: rendered in preview/page.tsx; see that file's comment block for computed values.
//
// system: none. A4's neutral secondary recipe carries no per-system delta in Part B.
// SecondaryButton therefore does not read useSystem().

import * as React from "react";
import { TYPE_RAMP } from "./tokens";
import { useSystem } from "./KitProvider";

export interface SecondaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}

/** A repeated inline action, never a second commit. 50px tall, white fill, 1px hairline
 * border, ink text, capsule corner via `rounded-btn`. Same press envelope as PrimaryButton.
 *
 * ROUND 3: candidate C (`_plans/R3_ONE_SYSTEM.md` "Secondary button" row: "Neutral grey fill,
 * full width, one per card, inside the card"; the sheet's own note: "exact fill hex not
 * measured, the trips helper should have PIL-sampled it") swaps the white/hairline-outline
 * recipe for a flat neutral fill at the same 12px CTA radius and 44px height as PrimaryButton,
 * no border. The fill is COLOR.tray (#F4F4F5, PICK, see tokens.ts
 * SECONDARY_BUTTON_FILL_C_PICK_NOTE), Solen's own locked neutral rather than an invented hex.
 * Candidates A and B keep this file's original outline recipe unchanged. */
export function SecondaryButton({ children, onClick, type = "button", disabled, className }: SecondaryButtonProps) {
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
        "flex w-full items-center justify-center gap-2 font-body",
        // Static literals, same Tailwind-JIT constraint as PrimaryButton.tsx: candidate C is
        // RADIUS.c.ctaPx (12) / RADIUS.c.ctaHeightPx (44) / bg-s-bg-sunken (the tray token,
        // COLOR.tray #F4F4F5, PICK per the sheet's own "hex not measured" note), no border. A/B
        // stay this file's original 50px/capsule/white/hairline-border/ink-text shape.
        isAirbnbPort
          ? "h-[44px] rounded-[12px] bg-s-bg-sunken text-s-ink"
          : "h-[50px] rounded-btn border border-s-border bg-white text-s-ink",
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
