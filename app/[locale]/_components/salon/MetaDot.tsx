import * as React from "react";

/**
 * MetaDot — V3-D202 (2026-05-26). V3-D462 (2026-06-09): renders a thin VERTICAL LINE, not a
 * middle-dot. Owner has rejected separator dots repeatedly ("stop using dots, use a line"); the
 * middle-dot was wrongly sanctioned by LOCKFILE §2.5 A12's old KEEP list (now FORBIDDEN). Name kept
 * for back-compat across 12+ call-sites; the glyph is a line. Layer 1 chrome (typographic separator).
 */
export function MetaDot() {
  return <span className="inline-block w-[14px]" aria-hidden />;
}
