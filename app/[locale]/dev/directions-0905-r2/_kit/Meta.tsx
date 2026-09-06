"use client";

// exists-check: `npm run exists directions` shows no round-2 typography kit wrapper; `npm run
// exists kit` returns no existing token/kit module. The 12px meta tier is a locked
// design-contract row, never previously pinned to its own component.

// Depicts: meta/address/duration/timestamp text -> _design-system/LOCKFILE.md line 393-397 (Core ramp phone column, meta 12px, reconciled 2026-09-04)

// Grounded-in: _design-system/LOCKFILE.md:393-397 (Core ramp phone column) and CLAUDE.md
// FLOORS LAW 6 (meta/chevrons/placeholders/timestamps use s-ink-2 #6B6B6B, never s-chart-2
// #9CA3AF as text). Reads its size from tokens.ts's TYPE_RAMP.meta.
//
// system: none. Meta text carries no per-system delta.

// style?: React.CSSProperties added 2026-09-06 so a caller can override the resting
// s-ink-2 color for a semantic state (e.g. COLOR.error.DEFAULT on a "Cancelled" line)
// without hand-rolling a span. Merged after the base style so it can override color;
// no rendered value changed for any existing caller that omits it.

import * as React from "react";
import { TYPE_RAMP, COLOR } from "./tokens";

export interface MetaProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/** Meta, address, duration, timestamps, badge text: 12px, s-ink-2, never s-chart-2. */
export function Meta({ children, className, style }: MetaProps) {
  return (
    <span
      className={["font-body", TYPE_RAMP.meta.weightClass, className].filter(Boolean).join(" ")}
      style={{ fontSize: TYPE_RAMP.meta.size, lineHeight: TYPE_RAMP.meta.lineHeight, color: COLOR.meta, ...style }}
    >
      {children}
    </span>
  );
}
