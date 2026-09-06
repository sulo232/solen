"use client";

// exists-check: `npm run exists directions-0905-r3` (this session) returned the same 7
// REMOVED hits already logged in this folder's own EmptyStatesB.tsx and EmptyUnitB.tsx headers
// (a grey-band whole-canvas system, three killed home structures, a killed prior round of this
// same bookings/saved/looks/vouchers screen superseded by this build, a killed search heading
// line, a killed review count, a killed component-isolation preview route, a killed service-row
// book-button harness); none of them is this file's own job (a corner icon-badge device on an
// already-existing panel), and none of them is a re-proposal of a killed screen. No candidate-B
// icon device existed before this file.
//
// Depicts: icon-badge device on the existing empty-state cluster -> ./EmptyUnitB.tsx
//
// Grounded-in: components-legacy/ui/EmptyState.tsx (its own "icon inside a designed container"
// anatomy, already cited by EmptyUnitB.tsx's header) and CLAUDE.md's own design-contract "states"
// row (a bare glyph is banned by name; the two other legal options are a 3D category icon, which
// has no PNG for booking/favorite/look/voucher, the category set being salon-service topics
// only, or a ghost-preview, which this file builds). The project's own Skeleton convention
// ("shape matches the final layout, not a bare spinner", same states row) grounds the two
// placeholder bars.
//
// Repair pass, fix item 4 (icon), per critique/empty-states.md "Repair pass" candidate B finding
// 2: a bare 56x56 Lucide glyph "just now sitting inside the tray panel" does not satisfy
// ROOT_CAUSES.md Part 3.6 fix item 4. No category PNG matches booking/favorite/look/voucher,
// same finding EmptyUnitB.tsx's own prior header already disclosed, so the remaining legal path
// is a genuine ghost-preview: a small skeletal preview of the row that will render here once
// data exists, not a decorative icon standing alone.
//
// Shape: a bounded white ghost-card (two skeleton bars standing in for a future title/meta line)
// with the topical Lucide glyph demoted to a small corner badge, so the glyph now LABELS the
// ghost card instead of being the whole device. Grounded in COLOR.hairline / COLOR.tray (no new
// hex) and RADIUS.entityCardPx (no new radius token); the 80x64 footprint and the two skeleton
// bar widths are a PICK, no measured source (a decorative internal shape, not a locked
// component), sized to roughly the vertical footprint the previous 56px icon slot occupied.
//
// system: b, via the caller's KitProvider; this file reads no system state itself, same as
// EmptyUnitB.tsx.
import * as React from "react";
import { COLOR, RADIUS } from "./kitBridge";

export interface GhostPreviewProps {
  icon: React.ReactNode;
  tint?: string;
}

export function GhostPreview({ icon, tint = COLOR.inkText }: GhostPreviewProps) {
  return (
    <div
      className="relative flex h-16 w-20 items-center justify-center bg-white"
      style={{ border: `1px solid ${COLOR.hairline}`, borderRadius: RADIUS.entityCardPx }}
      aria-hidden="true"
    >
      <span
        className="absolute left-3 right-3 top-[22px] h-1.5 rounded-full"
        style={{ background: COLOR.hairline }}
      />
      <span
        className="absolute left-3 top-[34px] h-1.5 w-1/2 rounded-full"
        style={{ background: COLOR.hairline }}
      />
      <span
        className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white"
        style={{ border: `1px solid ${COLOR.hairline}`, color: tint }}
      >
        {icon}
      </span>
    </div>
  );
}
