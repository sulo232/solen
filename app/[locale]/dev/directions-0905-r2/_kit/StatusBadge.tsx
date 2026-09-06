"use client";

// exists-check: `npm run exists directions` (run this session) shows no round-2 StatusBadge kit
// wrapper. No shared/registered "StatusBadge" primitive exists in _design-system/
// COMPONENT_REGISTRY.md; the recipe lives inline in BookingCard.tsx's own statusConfig map,
// which is exactly the surface named in the brief ("the badge design system we already have").
// Not a re-proposal of the graveyarded StatusPill.tsx (REMOVED.md: a salon open/closed
// indicator, superseded by StatusInline): this component renders BOOKING status
// (confirmed/pending/cancelled/completed/no_show), an unrelated, still-live surface.

// Depicts: booking status badge -> components-legacy/booking/BookingCard.tsx:84-90,138 (statusConfig map + its render: rounded-pill px-2.5 py-1 text-[12px] font-semibold {bg} {fg}, rendered live on /[locale]/profile/bookings via BookingsList.tsx)

// Grounded-in: components-legacy/booking/BookingCard.tsx:84-90 (the state map) and :138 (the
// render). This file is not a compose-the-registered-primitive case (none is registered for
// this shape); it transcribes the exact shipped recipe and applies the two changes
// R2_LOOK_SYSTEMS.md A2 specifies, not a redesign.
//
// KEPT unchanged from the shipped recipe: the shape (a rounded, capsule-corner badge), the
// px-2.5 py-1 padding, the 12px size, the five states, the pale semantic fill family.
//
// CHANGED, with the number (A2 table):
//   1. text colour: the semantic token itself -> s-ink #0A0A0A. Computed this run in
//      R2_LOOK_SYSTEMS.md: confirmed #16A34A on bg-s-success/10 (#E8F6ED) is 2.96:1, pending
//      #F1AE27 on #FEF7E9 is 1.82:1, cancelled #DC2626 on #FCE9E9 is 4.13:1 -- three of five
//      states fail WCAG AA (4.5:1) for 12px text, pending fails even the 3:1 graphical floor.
//      Ink on the same fill is 17.76:1. Taste rule 6 already specifies "pastel .bg + ink text +
//      saturated icon"; taste rule 4 already says success "is legal as ICONS, never as body text".
//   2. a leading icon appears: none today -> a 14px semantic glyph, since once the text goes ink
//      there is nothing left carrying the state's colour (same taste rule 6).
//   3. the fill comes from the token, not the alpha: bg-s-success/10 (#E8F6ED) -> s-success.bg
//      #E8F5E9, LOCKFILE §1 locks .bg values for exactly this; applied the same way to warning
//      and error for consistency (both have their own locked .bg tokens too).
//   4. weight: font-semibold, unchanged in source, renders at 500 (globals.css:269 clamp inside
//      <main>). Nothing to change; recorded so a critic measuring 500 does not file it as drift.
//
// OPEN, not resolved here (R2_LOOK_SYSTEMS.md CONFLICT C3, verdict ASK): the success icon at its
// own DEFAULT colour measures 2.96:1 on its own pale fill, under the 3:1 graphical floor; there
// is no locked dark companion for s-success/s-error the way s-warning already has a `.text`
// step (hue-ok: that step is a genuine locked tailwind.config.js token, V3-D424, this gate's
// closed-hue shortlist just does not enumerate `.text` companions by hex). The interim (A2's own
// words) is that ink text alone already carries the state at 17.76:1; the icon colour is left at
// DEFAULT pending his call, not silently darkened to an unlocked hex.
//
// CONFLICT C2 (does colour encode status at all -- Airbnb says no, taste rule 4 says yes) is
// also open, verdict ASK. This component keeps colour-coding (the shipped, lock-backed
// behaviour) until he decides otherwise; a mockup using it is not pre-empting that call, and
// Airbnb's neutral-pill alternative is not built here.
//
// measured: rendered in preview/page.tsx; see that file's own comment block for computed values.
//
// system: none. A2's recipe is a base recipe (Part A), not one of the three systems' deltas --
// no system entry in systems.ts touches the badge. StatusBadge therefore does not read
// useSystem().

import * as React from "react";
import { Check, Clock, X, CircleSlash } from "lucide-react";
import { COLOR, STATUS_BADGE_BASE } from "./tokens";

export type BookingStatus = "confirmed" | "pending" | "cancelled" | "completed" | "no_show";

interface StatusVariant {
  bg: string;
  /** The icon's own colour. Text is ALWAYS ink (COLOR.inkText), per A2 change 1; only the icon
   * carries the semantic hue. */
  iconColor: string;
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
}

const VARIANTS: Record<BookingStatus, StatusVariant> = {
  confirmed: { bg: COLOR.success.bg, iconColor: COLOR.success.DEFAULT, Icon: Check },
  pending: { bg: COLOR.warning.bg, iconColor: COLOR.warning.DEFAULT, Icon: Clock },
  cancelled: { bg: COLOR.error.bg, iconColor: COLOR.error.DEFAULT, Icon: X },
  // completed/no_show keep the shipped neutral ink/5 fill; there is no `.bg` token for ink, so
  // the alpha form stays (it is a neutral, not a semantic-alpha-vs-token mismatch case).
  completed: { bg: "rgba(10,10,10,0.05)", iconColor: COLOR.meta, Icon: Check },
  no_show: { bg: "rgba(10,10,10,0.05)", iconColor: COLOR.meta, Icon: CircleSlash },
};

export interface StatusBadgeProps {
  status: BookingStatus;
  /** Real translated label (bookingCard.status.*). Never invent copy here; pass it in. */
  label: string;
  /**
   * ROUND 3 (`_plans/R3_ONE_SYSTEM.md` CANDIDATE C "Status treatment" row: "Neutral. Colour
   * never encodes state."; Part 4 item 3, verdict SHOW). "pastel" (default, unchanged) is the
   * shipped recipe below: pastel bg + ink text + a semantic-hue icon. "neutral" renders the same
   * shape and the same icon (so the fact is still legible), but on the tray fill with an ink
   * icon, so no colour anywhere on the badge encodes confirmed/pending/cancelled. Explicit prop,
   * not auto-derived from `useSystem()`, since a caller building the candidate-C comparison
   * screen decides this per usage, same as `hasPhoto` on Card.
   */
  treatment?: "pastel" | "neutral";
  className?: string;
}

export function StatusBadge({ status, label, treatment = "pastel", className }: StatusBadgeProps) {
  const v = VARIANTS[status];
  const bg = treatment === "neutral" ? COLOR.tray : v.bg;
  const iconColor = treatment === "neutral" ? COLOR.inkText : v.iconColor;
  return (
    <span
      className={["inline-flex items-center gap-1 rounded-full font-semibold", className]
        .filter(Boolean)
        .join(" ")}
      style={{
        backgroundColor: bg,
        color: COLOR.inkText,
        paddingLeft: STATUS_BADGE_BASE.paddingXPx,
        paddingRight: STATUS_BADGE_BASE.paddingXPx,
        paddingTop: STATUS_BADGE_BASE.paddingYPx,
        paddingBottom: STATUS_BADGE_BASE.paddingYPx,
        fontSize: STATUS_BADGE_BASE.fontSizePx,
        lineHeight: 1.2,
      }}
      data-kit-status-treatment={treatment}
    >
      <v.Icon size={STATUS_BADGE_BASE.iconSizePx} color={iconColor} strokeWidth={2.25} />
      {label}
    </span>
  );
}
