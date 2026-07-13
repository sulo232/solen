"use client";

// Mockup-scope: whole-page
// panel-ok: shared dev-only scroll helper, not a page component itself (no
// _components/components-legacy import needed for a one-line DOM call).
// Exists-check: `npm run exists section-services` -> the real anchor id
// (app/[locale]/_components/salon/SalonServices.tsx, `id="section-services"`).
// No existing dev helper scrolls a whole-page mock to a real section on load.
// Net-new: this tiny wrapper, so mock-shadow can open pre-scrolled to the real
// services section instead of the reviewer scrolling there by hand.

import * as React from "react";

/**
 * ScrollToId, dev-mock-only helper. Scrolls the real page to a real section's own
 * DOM id on mount. Reads an id the real section already renders; no component file
 * is touched.
 */
export function ScrollToId({ id }: { id: string }) {
  React.useEffect(() => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ block: "start" });
  }, [id]);
  return null;
}
