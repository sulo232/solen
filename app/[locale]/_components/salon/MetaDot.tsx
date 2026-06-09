import * as React from "react";

/**
 * MetaDot — V3-D202 (2026-05-26). V3-D463 (2026-06-09): renders a NO-GLYPH GAP (~14px), not a dot
 * or a pipe. Owner rejected both the middle-dot and the pipe; the Apple pattern is space + hierarchy,
 * no separator character (LOCKFILE §2.5 A12, now FORBIDS any separator glyph). Name kept for
 * back-compat across 12+ call-sites; it's a spacer. Layer 1 chrome (typographic separator).
 */
export function MetaDot() {
  return <span className="inline-block w-[14px]" aria-hidden />;
}
