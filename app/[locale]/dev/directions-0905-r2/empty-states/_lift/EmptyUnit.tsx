"use client";

// Exists-check: `npm run exists empty-states` (run this session) -> the round-1 comparison
// route + its three direction folders (_va/_vb/_vc), read in full, none is a round-2 kit-based
// unit. `npm run exists kit` -> the round-2 _kit module, imported below, never re-derived.
//
// Grounded-in: app/[locale]/dev/directions-0905/empty-states/_vb/AirbnbEmptyUnit.tsx (the
// anatomy this file REPLACES for round 2: icon, headline, subline, one action, unchanged; every
// literal size/weight/colour in that file is swapped for the round-2 kit's own tokens below,
// per the task brief's screen constraint "no magenta or pink pill anywhere: the action is a kit
// primary button").
//
// What is KEPT from _vb/AirbnbEmptyUnit.tsx: the anatomy (icon, 28px headline, body subline,
// one action) and its entrance motion shape (opacity+y+scale, staggered by index).
// What CHANGES, with the reason:
//   1. headline: Airbnb ink #222222 (round-1, banned by name in round 2, R2_LOOK_SYSTEMS.md A8)
//      -> COLOR.inkText #0A0A0A via kit SectionTitle(as="anchor"), TYPE_RAMP.anchor (28/500).
//   2. subline: Airbnb secondary grey #6C6C6C (also banned by name) -> COLOR.meta #6B6B6B, the
//      round-2 token (a close but DIFFERENT, non-literal value; TYPE_RAMP.body 14/400, read
//      directly since the kit ships no <Body> wrapper component, same pattern StatusBadge.tsx
//      and Card.tsx use for values with no dedicated component).
//   3. action: a raw `<a>` filled with the measured-not-invented Airbnb rausch pink #E41C5C
//      (banned by name in round 2, "not this pink thing because that's not how we do it") ->
//      kit <PrimaryButton> for the one commit action on this comparison page, kit
//      <SecondaryButton> for the other three (see REPAIR 4 below: this file used to render
//      PrimaryButton unconditionally on all four states).
//   4. icon size 56 is KEPT (round-1's own citation: not an Airbnb-measured number, chosen to
//      read as an object-illustration rather than a 32px-in-a-64px-tile; this is a component
//      prop, not a CSS token the kit governs, so it is not one of the "no pill/badge/button/
//      size/weight/radius/colour literal" values the kit README bans inline).
//   5. motion: round-1's own curve (Airbnb's measured back-nav stagger, 250ms, 50ms step,
//      cubic-bezier(0.2,0,0,1)) is KEPT: A9 (the round-2 press-motion lock) only governs
//      press/release/select/sheet gestures, not one-time entrance animation, and MOTION.md's
//      own ENTER RECIPE (opacity+scale+blur, 280ms glide) is what confirmation/_lift already
//      uses for its own entrances -- reused here too for consistency across this round's lift
//      screens (not the round-1 y-translate variant), see confirmation/_lift/LiftConfirmationView.tsx.
//
// Navigation: PrimaryButton (_kit) is a <button>, not an anchor (A3 governs the one commit
// action's fill/height/motion, not routing). This file adds the one small piece of glue A3
// leaves to the caller: a client-side router.push on click, same as a real EmptyState's
// `action` slot would wire a Link. No fabricated destination: every ctaHref passed in below
// (EmptyStatesLift.tsx) is a real, live route.
//
// REPAIR (own verify pass, this session): `icon` was originally typed `LucideIcon` (a component
// TYPE) and this file rendered `<Icon .../>` itself, with the caller (EmptyStatesLift.tsx, an
// async SERVER component) passing the raw Calendar/Heart/Ticket/Images function references as a
// prop into this "use client" file. React Server Components can only pass PLAIN, serializable
// values (or already-rendered elements) across that boundary, never a function/component type:
// this threw "Functions cannot be passed directly to Client Components" at runtime, verified via
// a fresh Playwright load (console + pageerror capture) after the first curl-only check missed
// it (curl reads the initial SSR HTML, which this bug does not break; only the client hydration
// path does, so a curl-only check is not a discriminating measurement here). Fixed by having
// the SERVER caller render the icon element itself (JSX, not a type) and pass the finished
// `React.ReactNode` down; this file only places it, never instantiates a Lucide component.
//
// system: none directly (a base-recipe composition, not one of Part B's three systems'
// deltas); the KitProvider wrapping this tree in EmptyStatesLift.tsx governs the sibling Card
// rails, not this unit, which carries no card/border/shadow of its own.
//
// REPAIR 4 (final repair pass, this session): this file rendered the kit's one ink commit
// button unconditionally on every call site, so EmptyStatesLift.tsx (four states, four EmptyUnit
// instances) put four of them on one page, a direct violation of the cross-system rule ("one ink
// commit button per screen") this task brief itself carries. The sibling TRAY system
// (EmptyStatesTrayView.tsx's own EmptyUnit, `action.kind === "primary" ? <PrimaryButton> :
// <SecondaryButton>`) already solves the identical four-states-one-page shape correctly: exactly
// one commit button (its first-rendered state, Bookings), the neutral outline button on the
// other three. Fixed the same way here: a required `ctaVariant` prop, no default, so every call
// site in EmptyStatesLift.tsx states its choice explicitly rather than inheriting a silent one.
// This file's own first-rendered state (Looks, reordered into that slot by REPAIR 2 above) is
// the one `ctaVariant="primary"`; Bookings/Favorites/Vouchers are `"secondary"`, matching TRAY's
// own first-state-primary, rest-secondary distribution.

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { SectionTitle, PrimaryButton, SecondaryButton, TYPE_RAMP, COLOR } from "../../_kit";

export interface EmptyUnitProps {
  /** A fully-rendered icon element (e.g. `<Calendar size={56} .../>`), built by the caller.
   * Never a component TYPE: see the REPAIR note above for why a server caller cannot hand this
   * file a raw Lucide component reference. */
  icon: React.ReactNode;
  headline: string;
  subline: string;
  ctaLabel: string;
  ctaHref: string;
  index: number;
  /** "primary" = the kit's one ink commit button; "secondary" = the kit's neutral outline
   * button (white fill, hairline border). No default: see REPAIR 4 above, exactly one of the
   * four EmptyUnit instances on this page may pass "primary". */
  ctaVariant: "primary" | "secondary";
}

export function EmptyUnit({ icon, headline, subline, ctaLabel, ctaHref, index, ctaVariant }: EmptyUnitProps) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const motionProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 12, scale: 0.96 },
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: { duration: 0.25, delay: index * 0.05, ease: [0.2, 0, 0, 1] as const },
      };

  return (
    <motion.div className="flex flex-col items-center px-6 py-10 text-center" {...motionProps}>
      {icon}
      <SectionTitle as="anchor" className="mt-4 max-w-[280px]">
        {headline}
      </SectionTitle>
      <p
        className="mt-2 max-w-[280px] font-body"
        style={{
          fontSize: TYPE_RAMP.body.size,
          lineHeight: TYPE_RAMP.body.lineHeight,
          fontWeight: 400,
          color: COLOR.meta,
        }}
      >
        {subline}
      </p>
      <div className="mt-6 w-full max-w-[280px]">
        {ctaVariant === "primary" ? (
          <PrimaryButton onClick={() => router.push(ctaHref)}>{ctaLabel}</PrimaryButton>
        ) : (
          <SecondaryButton onClick={() => router.push(ctaHref)}>{ctaLabel}</SecondaryButton>
        )}
      </div>
    </motion.div>
  );
}
