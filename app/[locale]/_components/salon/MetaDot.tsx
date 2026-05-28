import * as React from "react";

/**
 * MetaDot — V3-D202 (2026-05-26, salon Phase A · A1 / spec §4.2).
 *
 * The bullet `·` separator used between meta-row segments. Currently inlined
 * 12+ times across salon-detail surfaces. Single source here. Layer 1 chrome
 * (typographic separator, no semantic meaning).
 *
 * No props — if you need a different separator (e.g. `|` for compact rows or
 * an em-dash for editorial moments), build a sibling component, don't
 * parameterize this.
 */
export function MetaDot() {
  return (
    <span className="text-s-ink-3" aria-hidden>
      ·
    </span>
  );
}
