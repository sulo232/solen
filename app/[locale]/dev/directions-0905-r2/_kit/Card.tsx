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
// measured: Playwright, 390x844, dpr 3, /en/dev/directions-0905-r2/kit-preview?s=lift|rule|tray,
// networkidle, 0 console errors on all three. The new `bordered` entity card renders identically
// under every system: width 358px, height 47px, border "1px solid rgb(228, 228, 231)"
// (#E4E4E7), box-shadow "none", border-radius 16px. The pre-existing system-driven entity card
// (bordered=false, same page) diverges exactly as systems.ts specifies: lift = 0px border +
// box-shadow present (shadow-whisper values), rule = 1px solid #E4E4E7 border + no shadow (its
// borderExceptionVariant), tray = 0px border + no shadow.
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
//
// bordered (added second pass): the system delta alone could never render either of the two
// documented, per-screen exceptions that sit ABOVE any one system, because both are screen-level
// facts, not system-level ones. (1) RULE's own one bordered identity block (Fresha profile hub
// keeps exactly one bordered card, borderExceptionVariant above only fires when a mockup is
// already running under RULE and passes variant="entity"; a LIFT or TRAY screen that needs the
// same identity block had no way to ask for it). (2) LOCKFILE section 17.2 edge case c: a
// photo-less entity card on white keeps the hairline and drops the shadow, independent of which
// system the rest of the screen is running. `bordered` is an explicit per-instance override: when
// true it renders the locked hairline (1px solid #E4E4E7, COLOR.hairline) and forces shadow off,
// regardless of what the active system's delta says for border or shadow. Radius still comes from
// `variant`, unchanged. It never turns a border ON and a shadow ON together (LOCKFILE §17.2, "a
// card carrying elevation drops its border, never both") and it never fights `borderExceptionVariant`,
// since that path already resolves to the same rendered result (border on, shadow off).

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
  /** Forces the locked hairline border on and the shadow off, regardless of the active system's
   * delta. Use for the two documented per-screen exceptions the system delta cannot express on
   * its own: RULE's one bordered identity block on a screen not already forcing it via
   * `borderExceptionVariant`, and LOCKFILE §17.2 edge case c (a photo-less entity card on white
   * keeps the hairline, drops the shadow) under any system. Radius still comes from `variant`.
   * Defaults to false (system-driven, unchanged behaviour). */
  bordered?: boolean;
}

export function Card({ variant, children, className, bordered = false }: CardProps) {
  const system = useSystem();
  const radius = VARIANT_RADIUS[variant];
  const { border, shadow, borderExceptionVariant } = system.deltas.card;

  // The one named per-system exception (Part B, SYSTEM 2 notes): a system can force a border on
  // exactly one named variant even while its own uniform `border` delta is false for everything
  // else. Today only RULE declares one ("entity"). No exception ever grants a shadow: the
  // identity block stays flat, same as LOCKFILE §17.2's "a card carrying elevation drops its
  // border, never both".
  //
  // `bordered` sits above both the system delta and the per-variant exception: it is a caller's
  // explicit, per-instance override for the two screen-level cases in the header comment, so it
  // wins outright rather than merging with either.
  const resolvedBorder = bordered ? true : variant === borderExceptionVariant ? true : border;
  const resolvedShadow = bordered ? false : shadow;

  return (
    <div
      className={["bg-white overflow-hidden", className].filter(Boolean).join(" ")}
      style={{
        borderRadius: radius,
        border: resolvedBorder ? "1px solid #E4E4E7" : "none", // drift-ok: locked s-border hairline hex, a runtime system-delta toggle so not expressible as a static className
        // shadow-whisper (LOCKFILE §3): a barely-there lift, never Airbnb's own stronger value.
        boxShadow: resolvedShadow ? "0 1px 2px rgba(10,10,10,0.04), 0 1px 1px rgba(10,10,10,0.03)" : "none",
      }}
      data-kit-card-variant={variant}
      data-kit-system={system.key}
      data-kit-card-bordered={bordered || undefined}
    >
      {children}
    </div>
  );
}
