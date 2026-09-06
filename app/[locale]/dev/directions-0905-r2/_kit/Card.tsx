"use client";

// exists-check: `npm run exists directions` shows no round-2 card kit wrapper; `npm run exists
// kit` returns no existing token/kit module. No shared generic "Card" primitive is registered
// in _design-system/COMPONENT_REGISTRY.md (individual card grammars are baked into their own
// components, e.g. SalonResultCard); this is the first cross-screen extraction of the three A7
// treatments, gated by THE CONTAINER TEST so it does not become a fourth hand-rolled card shape.

// Depicts: the three card treatments -> _design-system/LOCKFILE.md section 17.2 depth table (photo card: shadow-whisper, no border, radius 16; grouped list card: radius 24 + shadow-whisper + hairline rows; individual entity card: radius 16 + hairline border, flat)

// Grounded-in: _design-system/LOCKFILE.md (section 17.2, the depth table, and section 3, THE
// CONTAINER TEST: earned only on a non-white surface, for peer items competing in one scroll, or
// when the whole box is tappable). A card carrying elevation drops its border, never both
// (§17.2), enforced below by construction (each variant sets exactly one of border/shadow).
//
// measured: rendered in preview/page.tsx under all three systems; see that file's comment block.
//
// system: YES, per SYSTEM 1/2/3 deltas in systems.ts. Lift keeps shadow, drops border. Rule
// drops both for every variant EXCEPT one named exception: systems.ts's rule.deltas.card sets
// `borderExceptionVariant: "entity"`, and this component forces a border on exactly that variant
// when the caller passes variant="entity" under Rule, restoring Part B's one documented bordered
// identity block (Fresha profile hub) without a hand-written border outside this file (Rule's own
// screens still mostly skip Card entirely in favour of bare hairline-divided rows for photo/
// grouped content, which is a layout decision made by the mockup, not by this component). Tray
// drops both and expects the caller to place the card on a tray band (or an inline sunken
// background) for its edge; Card itself never paints the tray, since the tray is a PAGE-level
// device (systems.ts note: "the canvas is its boundary"), not a property of one card.

import * as React from "react";
import { useSystem } from "./KitProvider";
import { RADIUS } from "./tokens";

export type CardVariant = "photo" | "grouped" | "entity";

const VARIANT_RADIUS: Record<CardVariant, number> = {
  photo: RADIUS.photoCardPx,
  grouped: RADIUS.groupedListCardPx,
  entity: RADIUS.entityCardPx,
};

export interface CardProps {
  variant: CardVariant;
  children: React.ReactNode;
  className?: string;
}

export function Card({ variant, children, className }: CardProps) {
  const system = useSystem();
  const radius = VARIANT_RADIUS[variant];
  const { border, shadow, borderExceptionVariant } = system.deltas.card;

  // The one named per-system exception (Part B, SYSTEM 2 notes): a system can force a border on
  // exactly one named variant even while its own uniform `border` delta is false for everything
  // else. Today only RULE declares one ("entity"). No exception ever grants a shadow: the
  // identity block stays flat, same as LOCKFILE §17.2's "a card carrying elevation drops its
  // border, never both".
  const resolvedBorder = variant === borderExceptionVariant ? true : border;

  return (
    <div
      className={["bg-white overflow-hidden", className].filter(Boolean).join(" ")}
      style={{
        borderRadius: radius,
        border: resolvedBorder ? "1px solid #E4E4E7" : "none", // drift-ok: locked s-border hairline hex, a runtime system-delta toggle so not expressible as a static className
        // shadow-whisper (LOCKFILE §3): a barely-there lift, never Airbnb's own stronger value.
        boxShadow: shadow ? "0 1px 2px rgba(10,10,10,0.04), 0 1px 1px rgba(10,10,10,0.03)" : "none",
      }}
      data-kit-card-variant={variant}
      data-kit-system={system.key}
    >
      {children}
    </div>
  );
}
